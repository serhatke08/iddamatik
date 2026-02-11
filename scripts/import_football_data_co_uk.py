"""
football-data.co.uk CSV -> JSON dönüştürme ve lokal depolama
"""
import argparse
import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import requests
import re

# Proje root path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.data_storage import DataStorage
from utils.firebase import FirebaseService


LEAGUE_CODE_TO_NAME = {
    "E0": "Premier League",
    "E1": "Championship",
    "E2": "League One",
    "E3": "League Two",
    "D1": "Bundesliga",
    "I1": "Serie A",
    "SP1": "La Liga",
    "F1": "Ligue 1",
    "N1": "Eredivisie",
    "P1": "Primeira Liga",
    "T1": "Süper Lig",
    "SC0": "Scottish Premier",
}

BOOKMAKER_PREFIXES = ["B365", "PS", "BW", "WH", "VC", "SY", "IW", "LB", "SB", "SJ", "GB", "BB"]


def season_codes_last_n(n: int) -> List[str]:
    """Son N sezon için code üretir (ör: 2024-25 -> 2425)"""
    current_year = datetime.now().year
    # Sezon genelde yaz başlayıp sonraki yıla uzar; en güvenlisi current-1 -> current
    # 2026 için 2526, 2425, 2324 gibi
    season_codes = []
    start_year = current_year - 1
    for i in range(n):
        y1 = start_year - i
        y2 = y1 + 1
        season_codes.append(f"{str(y1)[-2:]}{str(y2)[-2:]}")
    return season_codes


def fetch_all_league_codes() -> List[str]:
    """football-data.co.uk sitesinden tüm lig kodlarını çıkarır"""
    url = "https://www.football-data.co.uk/data.php"
    try:
        resp = requests.get(url, timeout=30, verify=False)
        if resp.status_code != 200:
            return []
        html = resp.text
        codes = set(re.findall(r"/mmz4281/\\d{4}/([A-Z0-9]+)\\.csv", html))
        return sorted(list(codes))
    except Exception:
        return []


def _parse_date(date_str: str) -> Optional[str]:
    if not date_str:
        return None
    date_str = date_str.strip()
    for fmt in ("%d/%m/%y", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%d/%m/%Y")
        except Exception:
            continue
    return None


def _float(val: Optional[str]) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(str(val).strip())
    except Exception:
        return None


def _pick_odds(row: Dict[str, str], keys: List[str]) -> Optional[float]:
    for k in keys:
        if k in row and row.get(k) not in ("", None):
            val = _float(row.get(k))
            if val is not None:
                return val
    return None


def _extract_odds(row: Dict[str, str]) -> Dict[str, float]:
    odds: Dict[str, float] = {}

    # Match Result (1X2)
    for prefix in BOOKMAKER_PREFIXES:
        h = _pick_odds(row, [f"{prefix}H"])
        d = _pick_odds(row, [f"{prefix}D"])
        a = _pick_odds(row, [f"{prefix}A"])
        if h and d and a:
            odds["ms1"] = h
            odds["msx"] = d
            odds["ms2"] = a
            break

    # Over/Under 2.5
    for prefix in BOOKMAKER_PREFIXES:
        over = _pick_odds(row, [f"{prefix}O2.5", f"{prefix}>2.5"])
        under = _pick_odds(row, [f"{prefix}U2.5", f"{prefix}<2.5"])
        if over and under:
            odds["ust_2_5"] = over
            odds["alt_2_5"] = under
            break

    # BTTS
    for prefix in BOOKMAKER_PREFIXES:
        yes = _pick_odds(row, [f"{prefix}BTTSY", f"{prefix}BTTSY"])
        no = _pick_odds(row, [f"{prefix}BTTSN", f"{prefix}BTTSN"])
        if yes and no:
            odds["kg_var"] = yes
            odds["kg_yok"] = no
            break

    return odds


def _build_match_id(home: str, away: str, date_val: str) -> str:
    return str(abs(hash(f"{home}|{away}|{date_val}")))


def download_csv(season_code: str, league_code: str, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    url_https = f"https://www.football-data.co.uk/mmz4281/{season_code}/{league_code}.csv"
    url_http = f"http://www.football-data.co.uk/mmz4281/{season_code}/{league_code}.csv"
    out_path = out_dir / f"{league_code}_{season_code}.csv"

    last_err = None
    for url in [url_https, url_http]:
        for _ in range(2):
            try:
                r = requests.get(url, timeout=60, verify=False)
                if r.status_code == 200:
                    out_path.write_bytes(r.content)
                    return out_path
                last_err = RuntimeError(f"CSV indirilemedi: {url} ({r.status_code})")
            except Exception as e:
                last_err = e
                continue
    raise RuntimeError(last_err)



def csv_to_json(csv_path: Path, league_code: str) -> List[Dict]:
    matches = []
    with csv_path.open("r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            date_val = _parse_date(row.get("Date", ""))
            if not date_val:
                continue

            home = row.get("HomeTeam", "").strip()
            away = row.get("AwayTeam", "").strip()
            if not home or not away:
                continue

            time_val = row.get("Time", "").strip() or "00:00"
            league_name = LEAGUE_CODE_TO_NAME.get(league_code, league_code)

            odds = _extract_odds(row)
            match = {
                "match_id": _build_match_id(home, away, date_val),
                "date": date_val,
                "time": time_val,
                "league": league_name,
                "home_team": home,
                "away_team": away,
                "status": "PAST",
                "odds": odds,
                "source": "football-data.co.uk",
                "result": f"{row.get('FTHG','')}-{row.get('FTAG','')}" if row.get("FTHG") and row.get("FTAG") else None,
                "home_score": _float(row.get("FTHG")),
                "away_score": _float(row.get("FTAG")),
            }
            matches.append(match)
    return matches


def save_json(matches: List[Dict], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(matches, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="football-data.co.uk CSV import")
    parser.add_argument("--leagues", default="E0,SP1,D1,I1,F1,T1", help="Lig kodları (virgül ile)")
    parser.add_argument("--seasons", default=None, help="Sezon kodları (ör: 2324,2223)")
    parser.add_argument("--last-n-seasons", type=int, default=3, help="Son N sezon")
    parser.add_argument("--save-to-storage", action="store_true", help="DataStorage'a yaz")
    parser.add_argument("--save-to-firebase", action="store_true", help="Firebase'e yaz (cred gerek)")
    parser.add_argument("--csv-paths", default=None, help="Yerel CSV dosyaları (virgül ile)")
    parser.add_argument("--csv-dir", default=None, help="CSV klasörü (hepsi içeri alınır)")
    parser.add_argument("--all-leagues", action="store_true", help="Site üzerindeki tüm lig kodlarını kullan")
    args = parser.parse_args()

    if args.all_leagues:
        league_codes = fetch_all_league_codes()
    else:
        league_codes = [x.strip() for x in args.leagues.split(",") if x.strip()]
    if args.seasons:
        season_codes = [x.strip() for x in args.seasons.split(",") if x.strip()]
    else:
        season_codes = season_codes_last_n(args.last_n_seasons)

    csv_dir = Path("data/raw/football-data")
    json_dir = Path("data/import/football-data")

    storage = DataStorage() if args.save_to_storage else None
    firebase_service = None
    if args.save_to_firebase:
        try:
            firebase_service = FirebaseService()
        except Exception as e:
            print(f"⚠ Firebase başlatılamadı: {e}")
            firebase_service = None

    total = 0

    # Yerel CSV ile import
    local_csvs: List[Path] = []
    if args.csv_paths:
        local_csvs.extend([Path(p.strip()) for p in args.csv_paths.split(",") if p.strip()])
    if args.csv_dir:
        local_csvs.extend(list(Path(args.csv_dir).glob("*.csv")))

    if local_csvs:
        for csv_path in local_csvs:
            league_code = csv_path.stem.split("_")[0]
            matches = csv_to_json(csv_path, league_code)
            out_path = json_dir / f"{csv_path.stem}.json"
            save_json(matches, out_path)
            print(f"  ✓ JSON kaydedildi: {out_path} ({len(matches)})")
            total += len(matches)

            if storage:
                saved = storage.save_matches_batch(matches)
                print(f"  ✓ Storage: {saved} maç")
            if firebase_service and firebase_service.db:
                count = 0
                for match in matches:
                    try:
                        firebase_service.save_match(match)
                        count += 1
                    except Exception:
                        continue
                print(f"  ✓ Firebase: {count} maç")
    else:
        for league in league_codes:
            for season in season_codes:
                print(f"İndiriliyor: {league} - {season}")
                try:
                    csv_path = download_csv(season, league, csv_dir)
                except Exception as e:
                    print(f"  ⚠ {league} {season} indirilemedi: {e}")
                    continue

                matches = csv_to_json(csv_path, league)
                out_path = json_dir / f"{league}_{season}.json"
                save_json(matches, out_path)
                print(f"  ✓ JSON kaydedildi: {out_path} ({len(matches)})")
                total += len(matches)

                if storage:
                    saved = storage.save_matches_batch(matches)
                    print(f"  ✓ Storage: {saved} maç")
                if firebase_service and firebase_service.db:
                    count = 0
                    for match in matches:
                        try:
                            firebase_service.save_match(match)
                            count += 1
                        except Exception:
                            continue
                    print(f"  ✓ Firebase: {count} maç")

    print(f"\nToplam maç: {total}")


if __name__ == "__main__":
    main()
