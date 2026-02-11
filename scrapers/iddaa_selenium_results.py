"""
İddaa.com sonuçlar sayfası Selenium scraper
Next.js __NEXT_DATA__ içinden sonuçları çıkarır
"""
try:
    from seleniumwire import webdriver as wire_webdriver
    SELENIUM_WIRE_AVAILABLE = True
except Exception:
    SELENIUM_WIRE_AVAILABLE = False

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime, timedelta
import requests
from typing import Dict, List, Optional, Any
import json
import time
import re


class IddaaSeleniumResultsScraper:
    """İddaa.com Spor Toto sonuçlarını Selenium ile çeker"""

    def __init__(self, headless: bool = True, delay: float = 2.0):
        self.base_url = "https://www.iddaa.com"
        self.results_path = "/spor-toto/sonuclar"
        self.delay = delay
        self.headless = headless
        self.driver = None
        self._init_driver()

    def _init_driver(self) -> None:
        """Selenium WebDriver başlatır"""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument(
            "user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )

        service = Service(ChromeDriverManager().install())
        if SELENIUM_WIRE_AVAILABLE:
            self.driver = wire_webdriver.Chrome(service=service, options=chrome_options)
        else:
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.set_page_load_timeout(30)

    def close(self) -> None:
        if self.driver:
            self.driver.quit()

    def _build_urls(self, date_str: Optional[str]) -> List[str]:
        """Olası URL'leri döner"""
        base = f"{self.base_url}{self.results_path}"
        urls = [base]
        if date_str:
            try:
                # DD/MM/YYYY -> YYYY-MM-DD
                parts = date_str.split("/")
                if len(parts) == 3:
                    ymd = f"{parts[2]}-{parts[1]}-{parts[0]}"
                    urls.append(f"{base}?date={ymd}")
                    urls.append(f"{base}?tarih={ymd}")
                    urls.append(f"{base}?date={parts[0]}.{parts[1]}.{parts[2]}")
            except Exception:
                pass
        return urls

    def get_matches_by_date(self, date_str: str) -> List[Dict]:
        """Belirli bir tarihteki maçları getirir"""
        if not self.driver:
            return []

        urls = self._build_urls(date_str)
        matches: List[Dict] = []

        for url in urls:
            try:
                if SELENIUM_WIRE_AVAILABLE and hasattr(self.driver, "requests"):
                    self.driver.requests.clear()
                self.driver.get(url)
                # __NEXT_DATA__ render'ını bekle
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.ID, "__NEXT_DATA__"))
                )
                time.sleep(self.delay)

                page_source = self.driver.page_source
                # 1) __NEXT_DATA__ dene
                data = self._extract_next_data(page_source)
                if data:
                    extracted = self._extract_matches_from_json(data, date_str)
                    if extracted:
                        matches.extend(extracted)
                        break

                # 2) Selenium-wire ile XHR yakala
                if SELENIUM_WIRE_AVAILABLE:
                    extracted = self._extract_matches_from_network(date_str)
                    if extracted:
                        matches.extend(extracted)
                        break
            except Exception:
                continue

        # Match ID'ye göre uniq
        unique = []
        seen = set()
        for m in matches:
            mid = str(m.get("match_id"))
            if mid in seen:
                continue
            seen.add(mid)
            unique.append(m)

        if unique:
            return unique

        # 3) SporToto API fallback
        api_matches = self._fetch_sportoto_results(date_str)
        return api_matches

    def get_last_year_matches(self, days: int = 365) -> List[Dict]:
        """Son N günün maçlarını getirir"""
        all_matches: List[Dict] = []
        for i in range(days):
            date = datetime.now().date() - timedelta(days=i)
            date_str = date.strftime("%d/%m/%Y")
            print(f"[{i+1}/{days}] {date_str} çekiliyor...")
            matches = self.get_matches_by_date(date_str)
            if matches:
                all_matches.extend(matches)
            time.sleep(self.delay)
        return all_matches

    def _extract_next_data(self, html: str) -> Optional[Dict[str, Any]]:
        """__NEXT_DATA__ JSON'ını çıkarır"""
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(1))
        except Exception:
            return None

    def _fetch_sportoto_results(self, target_date: Optional[str]) -> List[Dict]:
        """SporToto servisinden sonuçları getirir (iddaa altyapısı)"""
        base = "https://sportotov2.iddaa.com"
        headers = {"User-Agent": "Mozilla/5.0"}
        matches: List[Dict] = []

        try:
            r = requests.get(f"{base}/SporToto/dateFilter", headers=headers, timeout=20)
            r.raise_for_status()
            payload = r.json()
            cycles = payload.get("data", []) if isinstance(payload, dict) else []
        except Exception:
            return []

        for cycle in cycles:
            game_cycle_no = cycle.get("gameCycleNo")
            if not game_cycle_no:
                continue

            try:
                res = requests.get(
                    f"{base}/SporToto/result?gameCycleNo={game_cycle_no}",
                    headers=headers,
                    timeout=20,
                )
                res.raise_for_status()
                data = res.json()
            except Exception:
                continue

            events = (data.get("data") or {}).get("events", [])
            for event in events:
                match = self._normalize_sportoto_event(event, target_date)
                if match:
                    matches.append(match)

        unique = []
        seen = set()
        for m in matches:
            mid = str(m.get("match_id"))
            if mid in seen:
                continue
            seen.add(mid)
            unique.append(m)
        return unique

    def _normalize_sportoto_event(self, event: Dict[str, Any], target_date: Optional[str]) -> Optional[Dict]:
        """SporToto event kaydını standart formata çevirir"""
        event_name = event.get("eventName") or ""
        if "-" not in event_name:
            return None
        teams = [t.strip() for t in event_name.split("-")]
        if len(teams) < 2:
            return None
        home_team, away_team = teams[0], teams[1]

        raw_date = event.get("eventDate") or ""
        match_date = ""
        match_time = "00:00"
        if raw_date:
            try:
                dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                match_date = dt.strftime("%d/%m/%Y")
                match_time = dt.strftime("%H:%M")
            except Exception:
                pass

        if target_date and match_date and match_date != target_date:
            return None

        result = event.get("result") or ""
        home_score = None
        away_score = None
        if isinstance(result, str) and ":" in result:
            parts = result.split(":")
            if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                home_score = int(parts[0])
                away_score = int(parts[1])

        return {
            "match_id": str(event.get("eventNo") or abs(hash(event_name + raw_date))),
            "home_team": home_team,
            "away_team": away_team,
            "league": event.get("competitionName") or "Lig",
            "date": match_date or (target_date or ""),
            "time": match_time,
            "status": "PAST",
            "odds": {},
            "source": "iddaa",
            "home_score": home_score,
            "away_score": away_score,
            "result": result if result else None,
        }

    def _extract_matches_from_network(self, target_date: Optional[str]) -> List[Dict]:
        """Selenium-wire ile ağ isteklerinden match verisini çıkarır"""
        matches: List[Dict] = []
        if not SELENIUM_WIRE_AVAILABLE:
            return matches

        try:
            # Selenium-wire request listesi
            for req in getattr(self.driver, "requests", []):
                if not req.response:
                    continue
                content_type = req.response.headers.get("Content-Type", "")
                if "application/json" not in content_type:
                    continue

                body = req.response.body
                try:
                    data = json.loads(body.decode("utf-8"))
                except Exception:
                    continue

                extracted = self._extract_matches_from_json(data, target_date)
                if extracted:
                    matches.extend(extracted)
        except Exception:
            pass

        return matches

    def _extract_matches_from_json(self, data: Dict[str, Any], target_date: Optional[str]) -> List[Dict]:
        """JSON içinden maçları heuristik olarak çıkarır"""
        matches: List[Dict] = []

        def normalize_date(value: Any) -> Optional[str]:
            if value is None:
                return None
            if isinstance(value, (int, float)):
                try:
                    # ms veya s olabilir
                    ts = value / 1000 if value > 1e12 else value
                    dt = datetime.fromtimestamp(ts)
                    return dt.strftime("%d/%m/%Y")
                except Exception:
                    return None
            if isinstance(value, str):
                # ISO format
                try:
                    if "T" in value:
                        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
                        return dt.strftime("%d/%m/%Y")
                    if "-" in value:
                        parts = value.split(" ")[0].split("-")
                        if len(parts) == 3:
                            return f"{parts[2]}/{parts[1]}/{parts[0]}"
                except Exception:
                    return None
            return None

        def normalize_time(value: Any) -> str:
            if value is None:
                return "00:00"
            if isinstance(value, str):
                m = re.search(r"(\d{1,2}):(\d{2})", value)
                if m:
                    return f"{m.group(1).zfill(2)}:{m.group(2)}"
            return "00:00"

        home_keys = ["homeTeamName", "homeTeam", "home_name", "homeTeamShortName", "homeName", "teamHome"]
        away_keys = ["awayTeamName", "awayTeam", "away_name", "awayTeamShortName", "awayName", "teamAway"]
        score_home_keys = ["homeScore", "scoreHome", "homeGoals", "home_goal"]
        score_away_keys = ["awayScore", "scoreAway", "awayGoals", "away_goal"]
        league_keys = ["leagueName", "league", "tournamentName", "competitionName"]
        date_keys = ["matchDate", "date", "startDate", "eventDate", "matchTime", "startTime"]
        time_keys = ["matchTime", "startTime", "time"]
        id_keys = ["matchId", "eventId", "id", "gameId"]

        def get_first(d: Dict, keys: List[str]) -> Optional[Any]:
            for k in keys:
                if k in d and d[k] not in (None, ""):
                    return d[k]
            return None

        def walk(obj: Any) -> None:
            if isinstance(obj, dict):
                home = get_first(obj, home_keys)
                away = get_first(obj, away_keys)
                if home and away:
                    match_id = get_first(obj, id_keys) or abs(hash(f"{home}-{away}-{obj}"))
                    date_val = get_first(obj, date_keys)
                    match_date = normalize_date(date_val) or (target_date if target_date else None)
                    if target_date and match_date and match_date != target_date:
                        pass
                    else:
                        home_score = get_first(obj, score_home_keys)
                        away_score = get_first(obj, score_away_keys)
                        league = get_first(obj, league_keys) or "Lig"
                        time_val = get_first(obj, time_keys)
                        match_time = normalize_time(time_val)
                        matches.append({
                            "match_id": str(match_id),
                            "home_team": str(home).strip(),
                            "away_team": str(away).strip(),
                            "league": str(league).strip(),
                            "date": match_date or (target_date or ""),
                            "time": match_time,
                            "status": "PAST",
                            "odds": {},
                            "source": "iddaa",
                            "home_score": int(home_score) if isinstance(home_score, (int, float, str)) and str(home_score).isdigit() else None,
                            "away_score": int(away_score) if isinstance(away_score, (int, float, str)) and str(away_score).isdigit() else None,
                            "result": f"{home_score}-{away_score}" if home_score is not None and away_score is not None else None
                        })
                for v in obj.values():
                    walk(v)
            elif isinstance(obj, list):
                for item in obj:
                    walk(item)

        walk(data)
        return matches
