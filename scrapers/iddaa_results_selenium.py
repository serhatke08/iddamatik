"""
İddaa.com Biten Maçlar - Selenium + Network log ile JSON çekme
"""
import os
import json
import time
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


try:
    from seleniumwire import webdriver as wire_webdriver
    SELENIUM_WIRE_AVAILABLE = True
except Exception:
    SELENIUM_WIRE_AVAILABLE = False


class IddaaResultsSeleniumScraper:
    """İddaa.com sonuç sayfasından JSON veriyi Selenium ile çeker"""

    def __init__(self, headless: bool = True, delay: float = 2.0):
        self.base_url = "https://www.iddaa.com/spor-toto/sonuclar"
        self.delay = delay
        self.driver = None
        self.headless = headless
        self._init_driver()

    def _init_driver(self):
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

        # macOS default Chrome path
        chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        if os.path.exists(chrome_path):
            chrome_options.binary_location = chrome_path

        # Enable performance logging to capture network
        chrome_options.set_capability("goog:loggingPrefs", {"performance": "ALL"})

        service = Service(ChromeDriverManager().install())
        if SELENIUM_WIRE_AVAILABLE:
            self.driver = wire_webdriver.Chrome(service=service, options=chrome_options)
        else:
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.set_page_load_timeout(30)
        try:
            self.driver.execute_cdp_cmd("Network.enable", {})
        except Exception:
            pass

    def get_yesterday_matches(self) -> List[Dict]:
        """Dünkü maçları getirir"""
        yesterday = datetime.now() - timedelta(days=1)
        return self.get_matches_by_date(yesterday.strftime("%Y-%m-%d"))

    def get_matches_by_date(self, date_yyyy_mm_dd: str) -> List[Dict]:
        """Belirli tarihin sonuçlarını getirir (YYYY-MM-DD)"""
        if not self.driver:
            return []

        url = f"{self.base_url}?date={date_yyyy_mm_dd}"
        self.driver.get(url)
        time.sleep(6)  # JS yüklenmesini bekle

        # Önce HTML'den parse etmeyi dene (page_source JS render'dan sonra dolu)
        html_matches = self._extract_matches_from_html(self.driver.page_source, date_yyyy_mm_dd)
        if html_matches:
            time.sleep(self.delay)
            return html_matches

        json_bodies = []
        json_urls = []

        # Selenium Wire varsa response body'leri daha güvenli alınır
        if SELENIUM_WIRE_AVAILABLE:
            for request in getattr(self.driver, "requests", []):
                try:
                    if not request.response:
                        continue
                    content_type = request.response.headers.get("Content-Type", "")
                    if "application/json" in content_type:
                        body = request.response.body
                        if body:
                            try:
                                body_text = body.decode("utf-8", errors="ignore")
                            except Exception:
                                body_text = str(body)
                            json_bodies.append((request.url, body_text))
                            json_urls.append(request.url)
                except Exception:
                    continue
        else:
            # Network loglarından JSON yanıtlarını al
            logs = self.driver.get_log("performance")

            for entry in logs:
                try:
                    message = json.loads(entry["message"])["message"]
                    if message.get("method") != "Network.responseReceived":
                        continue

                    response = message.get("params", {}).get("response", {})
                    mime_type = response.get("mimeType", "")
                    url_resp = response.get("url", "")
                    request_id = message.get("params", {}).get("requestId")

                    if "application/json" in mime_type and request_id:
                        # JSON body'yi al
                        body = self.driver.execute_cdp_cmd("Network.getResponseBody", {"requestId": request_id})
                        if body and "body" in body:
                            json_bodies.append((url_resp, body["body"]))
                            json_urls.append(url_resp)
                except Exception:
                    continue

        if not json_bodies and json_urls:
            print("  ⚠ JSON response bulundu ama body alınamadı")
        if not json_bodies:
            # Debug: JSON endpoint adaylarını yaz
            if json_urls:
                print("  ⚠ JSON endpoint'leri:", list(set(json_urls))[:5])
            else:
                print("  ⚠ JSON endpoint bulunamadı")

        matches = []
        for url_resp, body in json_bodies:
            try:
                data = json.loads(body)
                extracted = self._extract_matches_from_json(data, date_yyyy_mm_dd)
                if extracted:
                    matches.extend(extracted)
            except Exception:
                continue

        # Duplicate'leri kaldır
        seen = set()
        unique = []
        for m in matches:
            mid = str(m.get("match_id", ""))
            if mid and mid not in seen:
                seen.add(mid)
                unique.append(m)

        time.sleep(self.delay)
        return unique

    def _extract_matches_from_html(self, html: str, date_yyyy_mm_dd: str) -> List[Dict]:
        """Sayfa HTML'inden spor toto sonuçlarını parse eder"""
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        elements = soup.select("[data-comp-name^='sporToto-result-']")
        if not elements:
            return []

        matches = []
        seen = set()

        # Team elementlerini bul
        for elem in elements:
            text = elem.get_text(strip=True)
            if " - " not in text:
                continue

            # Team formatı değilse atla
            if text.count(" - ") != 1:
                continue

            # Tarih/saat/skor içeren metinleri atla
            if re.search(r"\d{2}\.\d{2}\.\d{4}", text) or re.search(r"\d{1,2}:\d{2}", text):
                continue
            if re.search(r"\d+\-\d+", text):
                continue

            home_team, away_team = [t.strip() for t in text.split(" - ")]
            if not home_team or not away_team:
                continue

            # Parent satırındaki diğer sütunları ara
            parent = elem.parent
            date_str = None
            time_str = None
            score = None

            # Aynı satırdaki data-comp-name elementleri
            row_items = parent.find_all(attrs={"data-comp-name": True})
            for item in row_items:
                comp_name = item.get("data-comp-name", "")
                item_text = item.get_text(strip=True)

                # data-comp-name içinden tarih ve skor çıkar
                if comp_name.startswith("sporToto-result-"):
                    suffix = comp_name.replace("sporToto-result-", "")
                    # Tarih formatı: 2026-01-24T14:30:00
                    if re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$", suffix):
                        # Görünen text'i kullan
                        if item_text:
                            date_str = item_text
                    # Skor formatı: 0:3 veya 0-3
                    if re.match(r"^\d+[:\-]\d+$", suffix):
                        score = suffix.replace(":", "-")

                # Fallback: metinden tarih/saat ve skor çıkar
                if not date_str and "." in item_text and ":" in item_text and len(item_text) >= 10:
                    date_str = item_text
                if not score and re.match(r"^\d+\-\d+$", item_text):
                    score = item_text

            # Tarih/saat ayrıştır
            date_val = None
            time_val = "00:00"
            if date_str:
                parts = date_str.split()
                if len(parts) >= 2:
                    date_val = parts[0].replace(".", "/")
                    time_val = parts[1]

            # Eğer tarih yoksa target date kullan
            if not date_val:
                date_val = datetime.strptime(date_yyyy_mm_dd, "%Y-%m-%d").strftime("%d/%m/%Y")

            match_id = str(abs(hash(f"{home_team}{away_team}{date_val}{time_val}")))
            if match_id in seen:
                continue
            seen.add(match_id)

            home_score = None
            away_score = None
            if score:
                try:
                    hs, as_ = score.split("-")
                    home_score = int(hs)
                    away_score = int(as_)
                except Exception:
                    pass

            matches.append({
                "match_id": match_id,
                "home_team": home_team,
                "away_team": away_team,
                "league": "Spor Toto",
                "date": date_val,
                "time": time_val,
                "status": "PAST",
                "odds": {},
                "source": "iddaa",
                "home_score": home_score,
                "away_score": away_score,
                "result": score
            })

        return matches

    def _extract_matches_from_json(self, data: Any, date_yyyy_mm_dd: str) -> List[Dict]:
        """JSON içinden maçları çıkarır"""
        results = []

        def walk(obj):
            if isinstance(obj, dict):
                # Olası maç objesi kontrolü
                keys = set(obj.keys())
                possible_keys = {"homeTeam", "awayTeam", "homeTeamName", "awayTeamName"}
                if keys & possible_keys:
                    home = obj.get("homeTeamName") or obj.get("homeTeam")
                    away = obj.get("awayTeamName") or obj.get("awayTeam")
                    if isinstance(home, dict):
                        home = home.get("name") or home.get("teamName")
                    if isinstance(away, dict):
                        away = away.get("name") or away.get("teamName")

                    if home and away:
                        match_id = obj.get("id") or obj.get("matchId") or obj.get("eventId")
                        league = obj.get("leagueName") or obj.get("league") or obj.get("tournamentName") or "Lig"
                        score_home = obj.get("homeScore") or obj.get("scoreHome")
                        score_away = obj.get("awayScore") or obj.get("scoreAway")
                        time_str = obj.get("time") or obj.get("matchTime") or "00:00"

                        results.append({
                            "match_id": str(match_id or abs(hash(f"{home}{away}{date_yyyy_mm_dd}"))),
                            "home_team": str(home).strip(),
                            "away_team": str(away).strip(),
                            "league": str(league).strip(),
                            "date": datetime.strptime(date_yyyy_mm_dd, "%Y-%m-%d").strftime("%d/%m/%Y"),
                            "time": time_str if time_str else "00:00",
                            "status": "PAST",
                            "odds": {},
                            "source": "iddaa",
                            "home_score": score_home,
                            "away_score": score_away,
                            "result": f"{score_home}-{score_away}" if score_home is not None and score_away is not None else None
                        })

                for v in obj.values():
                    walk(v)
            elif isinstance(obj, list):
                for v in obj:
                    walk(v)

        walk(data)
        return results

    def close(self):
        if self.driver:
            self.driver.quit()
