"""
CSV veri kaynağı (data/raw) -> filtrelenebilir maç listesi
"""
import csv
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime


class CSVDataService:
    def __init__(self, data_dir: str = "data/raw", overview_dir: str = "data/football-data"):
        self.data_dir = Path(data_dir)
        self.overview_dir = Path(overview_dir)
        self._cache: List[Dict] = []
        self._last_mtimes: Dict[str, float] = {}

    def _parse_date(self, date_str: str) -> Optional[str]:
        if not date_str:
            return None
        date_str = date_str.strip()
        for fmt in ("%d-%m-%y %H:%M", "%d-%m-%Y %H:%M"):
            try:
                return datetime.strptime(date_str, fmt).strftime("%d/%m/%Y")
            except Exception:
                continue
        return None

    def _parse_time(self, date_str: str) -> str:
        if not date_str:
            return "00:00"
        date_str = date_str.strip()
        for fmt in ("%d-%m-%y %H:%M", "%d-%m-%Y %H:%M"):
            try:
                return datetime.strptime(date_str, fmt).strftime("%H:%M")
            except Exception:
                continue
        return "00:00"

    def _float(self, val: Optional[str]) -> Optional[float]:
        if val is None:
            return None
        try:
            return float(str(val).replace(",", ".").strip())
        except Exception:
            return None

    def _needs_reload(self) -> bool:
        current = {}
        for path in self.data_dir.glob("*.csv"):
            try:
                current[str(path)] = path.stat().st_mtime
            except Exception:
                continue
        for path in self.overview_dir.glob("*.csv"):
            try:
                current[str(path)] = path.stat().st_mtime
            except Exception:
                continue
        return current != self._last_mtimes

    def load_all(self) -> List[Dict]:
        if not self._needs_reload() and self._cache:
            return self._cache

        matches: List[Dict] = []
        by_id: Dict[str, Dict] = {}
        mtimes = {}
        for csv_path in self.data_dir.glob("*.csv"):
            if csv_path.name.startswith("."):
                continue
            try:
                mtimes[str(csv_path)] = csv_path.stat().st_mtime
            except Exception:
                continue
            with csv_path.open("r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    date_raw = row.get("matchDate") or row.get("maçTarihi") or row.get("macTarihi") or ""
                    date_val = self._parse_date(date_raw)
                    if not date_val:
                        continue
                    time_val = self._parse_time(date_raw)

                    home = (row.get("homeTeam") or row.get("ev takımı") or "").strip()
                    away = (row.get("awayTeam") or row.get("deplasman takımı") or "").strip()
                    if not home or not away:
                        continue

                    odds = {}
                    mapping = {
                        "H": "ms1",
                        "D": "msx",
                        "A": "ms2",
                        "O05": "o05",
                        "U05": "u05",
                        "O15": "o15",
                        "U15": "u15",
                        "O25": "o25",
                        "U25": "u25",
                        "O35": "o35",
                        "U35": "u35",
                        "O45": "o45",
                        "U45": "u45",
                        "BTTSY": "kg_var",
                        "BTTSN": "kg_yok",
                    }
                    for src, dst in mapping.items():
                        val = self._float(row.get(src))
                        if val is not None:
                            odds[dst] = val

                    match_id = str(row.get("id") or f"{home}-{away}-{date_val}-{time_val}")
                    match = {
                        "match_id": str(row.get("id") or f"{home}-{away}-{date_val}-{time_val}"),
                        "date": date_val,
                        "time": time_val,
                        "country": (row.get("Country") or row.get("Ülke") or "").strip(),
                        "league": (row.get("League") or row.get("Lig") or "").strip(),
                        "season": (row.get("Season") or row.get("Mevsim") or "").strip(),
                        "home_team": home,
                        "away_team": away,
                        "odds": odds,
                        "score": (row.get("Score") or row.get("Skor") or row.get("result") or "").strip(),
                        "status": "PAST",
                        "source": "csv"
                    }
                    by_id[match_id] = match
                    matches.append(match)

        # Overview (skor) dosyaları
        for csv_path in self.overview_dir.glob("*.csv"):
            if csv_path.name.startswith("."):
                continue
            try:
                mtimes[str(csv_path)] = csv_path.stat().st_mtime
            except Exception:
                continue
            with csv_path.open("r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    match_id = str(row.get("id") or "").strip()
                    if not match_id:
                        continue
                    date_raw = row.get("matchDate") or ""
                    date_val = self._parse_date(date_raw)
                    time_val = self._parse_time(date_raw)
                    home = (row.get("homeTeam") or "").strip()
                    away = (row.get("awayTeam") or "").strip()
                    fthg = row.get("FTHG")
                    ftag = row.get("FTAG")
                    ftr = (row.get("FTR") or "").strip()
                    score = None
                    if fthg is not None and ftag is not None:
                        score = f"{fthg}-{ftag}"

                    existing = by_id.get(match_id)
                    if existing:
                        if score:
                            existing["score"] = score
                            existing["fthg"] = self._float(fthg)
                            existing["ftag"] = self._float(ftag)
                            existing["ftr"] = ftr
                        existing["referee"] = (row.get("referee") or "").strip()
                    else:
                        match = {
                            "match_id": match_id,
                            "date": date_val or "",
                            "time": time_val or "00:00",
                            "country": (row.get("Country") or "").strip(),
                            "league": (row.get("League") or "").strip(),
                            "season": (row.get("Season") or "").strip(),
                            "home_team": home,
                            "away_team": away,
                            "odds": {},
                            "score": score or "",
                            "fthg": self._float(fthg),
                            "ftag": self._float(ftag),
                            "ftr": ftr,
                            "referee": (row.get("referee") or "").strip(),
                            "status": "PAST",
                            "source": "csv"
                        }
                        by_id[match_id] = match
                        matches.append(match)

        self._cache = matches
        self._last_mtimes = mtimes
        return matches

    def filter_matches(
        self,
        league: Optional[str] = None,
        match: Optional[str] = None,
        home_team: Optional[str] = None,
        away_team: Optional[str] = None,
        score: Optional[str] = None,
        kg: Optional[str] = None,
        alt: Optional[str] = None,
        ust: Optional[str] = None,
        iy: Optional[str] = None,
        ms: Optional[str] = None,
        odds_filters: Optional[Dict[str, float]] = None,
        tolerance: float = 0.01,
        limit: int = 1000
    ) -> List[Dict]:
        data = self.load_all()
        results = []

        for m in data:
            if league:
                if league.lower() not in (m.get("league") or "").lower():
                    continue
            if match:
                combined = f"{m.get('home_team', '')} {m.get('away_team', '')}".lower()
                if match.lower() not in combined:
                    continue
            if home_team:
                if home_team.lower() not in (m.get("home_team") or "").lower():
                    continue
            if away_team:
                if away_team.lower() not in (m.get("away_team") or "").lower():
                    continue
            if score:
                if score.lower() not in (m.get("score") or "").lower():
                    continue
            if iy:
                if iy.lower() not in (m.get("score") or "").lower():
                    continue
            if ms:
                ms_val = ms.strip().lower()
                ftr = (m.get("ftr") or "").lower()
                if ms_val in ("1", "h") and ftr and ftr != "h":
                    continue
                if ms_val in ("x", "d") and ftr and ftr != "d":
                    continue
                if ms_val in ("2", "a") and ftr and ftr != "a":
                    continue
                if ms_val not in ("1", "h", "x", "d", "2", "a"):
                    if ms_val not in (m.get("score") or "").lower():
                        continue

            if odds_filters:
                odds = m.get("odds", {})
                ok = True
                for key, value in odds_filters.items():
                    if key not in odds:
                        ok = False
                        break
                    if abs(odds.get(key, 0) - value) > tolerance:
                        ok = False
                        break
                if not ok:
                    continue

            # KG (1/0 veya odds)
            if kg:
                odds = m.get("odds", {})
                kg_val = kg.strip().lower()
                fthg = m.get("fthg")
                ftag = m.get("ftag")
                
                # Skor varsa skor üzerinden kontrol et
                has_score = fthg is not None and ftag is not None
                both_scored = has_score and fthg > 0 and ftag > 0
                
                if kg_val in ("1", "var", "yes", "true"):
                    # KG Var: Her iki takım da gol atmış olmalı
                    if has_score:
                        if not both_scored:
                            continue
                    else:
                        # Skor yoksa odds'tan kontrol et
                        if "kg_var" not in odds:
                            continue
                elif kg_val in ("0", "yok", "no", "false"):
                    # KG Yok: En az bir takım gol atmamış olmalı
                    if has_score:
                        if both_scored:
                            continue
                    else:
                        # Skor yoksa odds'tan kontrol et
                        if "kg_yok" not in odds:
                            continue
                else:
                    # Sayısal değer: KG Var odds'u ile eşleşmeli
                    try:
                        kg_num = float(kg_val.replace(",", "."))
                        if "kg_var" not in odds:
                            continue
                        if abs(odds.get("kg_var", 0) - kg_num) > tolerance:
                            continue
                    except Exception:
                        continue

            # Alt/Üst (2.5 gibi gol çizgisi)
            if alt:
                line_str = alt.strip().replace(",", ".")
                try:
                    line_val = float(line_str)
                except Exception:
                    line_val = None
                
                fthg = m.get("fthg")
                ftag = m.get("ftag")
                odds = m.get("odds", {})
                has_score = fthg is not None and ftag is not None
                
                if has_score and line_val is not None:
                    # Skor varsa: Toplam gol < çizgi olmalı (Alt)
                    total_goals = fthg + ftag
                    if total_goals >= line_val:
                        continue
                elif line_val is not None:
                    # Skor yoksa: Alt odds'u olmalı
                    line_map = {
                        0.5: "u05",
                        1.5: "u15",
                        2.5: "u25",
                        3.5: "u35",
                        4.5: "u45"
                    }
                    key = line_map.get(line_val)
                    if not key or key not in odds:
                        continue
                else:
                    # Geçersiz format
                    continue

            if ust:
                line_str = ust.strip().replace(",", ".")
                try:
                    line_val = float(line_str)
                except Exception:
                    line_val = None
                
                fthg = m.get("fthg")
                ftag = m.get("ftag")
                odds = m.get("odds", {})
                has_score = fthg is not None and ftag is not None
                
                if has_score and line_val is not None:
                    # Skor varsa: Toplam gol > çizgi olmalı (Üst)
                    total_goals = fthg + ftag
                    if total_goals <= line_val:
                        continue
                elif line_val is not None:
                    # Skor yoksa: Üst odds'u olmalı
                    line_map = {
                        0.5: "o05",
                        1.5: "o15",
                        2.5: "o25",
                        3.5: "o35",
                        4.5: "o45"
                    }
                    key = line_map.get(line_val)
                    if not key or key not in odds:
                        continue
                else:
                    # Geçersiz format
                    continue

            results.append(m)
            if len(results) >= limit:
                break

        return results
