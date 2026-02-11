"""
Footiqo CSV export -> JSON + storage import
Beklenen kolonlar:
ID, maçTarihi, Ülke, Lig, Mevsim, ev takımı, deplasman takımı,
H,D,A,O05,U05,O15,U15,O25,U25,O35,U35,O45,U45,BTTSY,BTTSN
"""
import csv
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.data_storage import DataStorage
from utils.firebase import FirebaseService


def _parse_date(date_str: str) -> Optional[str]:
    if not date_str:
        return None
    date_str = date_str.strip()
    # ör: 26-01-26 21:00
    for fmt in ("%d-%m-%y %H:%M", "%d-%m-%Y %H:%M", "%d/%m/%Y %H:%M"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%d/%m/%Y")
        except Exception:
            continue
    return None


def _parse_time(date_str: str) -> str:
    if not date_str:
        return "00:00"
    date_str = date_str.strip()
    for fmt in ("%d-%m-%y %H:%M", "%d-%m-%Y %H:%M", "%d/%m/%Y %H:%M"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%H:%M")
        except Exception:
            continue
    return "00:00"


def _float(val: Optional[str]) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(str(val).replace(",", ".").strip())
    except Exception:
        return None


def _build_match_id(home: str, away: str, date_val: str, time_val: str) -> str:
    return str(abs(hash(f"{home}|{away}|{date_val}|{time_val}")))


def parse_csv(path: Path) -> List[Dict]:
    matches = []
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            date_raw = row.get("maçTarihi") or row.get("macTarihi") or row.get("MatchDate")
            date_val = _parse_date(date_raw or "")
            if not date_val:
                continue
            time_val = _parse_time(date_raw or "")

            home = (row.get("ev takımı") or row.get("Ev Takımı") or row.get("Home") or "").strip()
            away = (row.get("deplasman takımı") or row.get("Deplasman Takımı") or row.get("Away") or "").strip()
            if not home or not away:
                continue

            odds = {}
            for key in ["H", "D", "A", "O05", "U05", "O15", "U15", "O25", "U25", "O35", "U35", "O45", "U45", "BTTSY", "BTTSN"]:
                val = _float(row.get(key))
                if val is not None:
                    norm_key = key.lower()
                    if norm_key == "h":
                        norm_key = "ms1"
                    elif norm_key == "d":
                        norm_key = "msx"
                    elif norm_key == "a":
                        norm_key = "ms2"
                    elif norm_key == "bttsy":
                        norm_key = "kg_var"
                    elif norm_key == "bttsn":
                        norm_key = "kg_yok"
                    odds[norm_key] = val

            match = {
                "match_id": _build_match_id(home, away, date_val, time_val),
                "date": date_val,
                "time": time_val,
                "league": (row.get("Lig") or "").strip(),
                "country": (row.get("Ülke") or row.get("Ulke") or "").strip(),
                "season": (row.get("Mevsim") or row.get("Season") or "").strip(),
                "home_team": home,
                "away_team": away,
                "status": "PAST",
                "odds": odds,
                "source": "footiqo"
            }
            matches.append(match)
    return matches


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Footiqo CSV import")
    parser.add_argument("--csv-dir", required=True, help="CSV klasörü")
    parser.add_argument("--save-to-storage", action="store_true", help="DataStorage'a yaz")
    parser.add_argument("--save-to-firebase", action="store_true", help="Firebase'e yaz")
    args = parser.parse_args()

    storage = DataStorage() if args.save_to_storage else None
    firebase_service = None
    if args.save_to_firebase:
        try:
            firebase_service = FirebaseService()
        except Exception as e:
            print(f"⚠ Firebase başlatılamadı: {e}")
            firebase_service = None

    csv_dir = Path(args.csv_dir)
    json_dir = Path("data/import/footiqo")
    json_dir.mkdir(parents=True, exist_ok=True)

    total = 0
    for csv_path in csv_dir.glob("*.csv"):
        matches = parse_csv(csv_path)
        out_path = json_dir / f"{csv_path.stem}.json"
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(matches, f, ensure_ascii=False, indent=2)
        print(f"✓ JSON kaydedildi: {out_path} ({len(matches)})")
        total += len(matches)

        if storage:
            saved = storage.save_matches_batch(matches)
            print(f"✓ Storage: {saved} maç")
        if firebase_service and firebase_service.db:
            count = 0
            for match in matches:
                try:
                    firebase_service.save_match(match)
                    count += 1
                except Exception:
                    continue
            print(f"✓ Firebase: {count} maç")

    print(f"\nToplam maç: {total}")


if __name__ == "__main__":
    main()
