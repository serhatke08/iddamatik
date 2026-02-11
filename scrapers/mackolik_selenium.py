"""
Mackolik.com Selenium scraper - JavaScript render için
"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime
from typing import Dict, List, Optional
import time
import re


class MackolikSeleniumScraper:
    """Mackolik.com'dan Selenium ile veri çeker"""
    
    def __init__(self, headless: bool = True, delay: float = 2.0):
        self.base_url = "https://www.mackolik.com"
        self.delay = delay
        self.headless = headless
        self.driver = None
        self._init_driver()
    
    def _init_driver(self):
        """Selenium WebDriver'ı başlatır"""
        try:
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.set_page_load_timeout(30)
        except Exception as e:
            print(f"Selenium driver başlatma hatası: {e}")
            raise
    
    def get_matches_by_date(self, date: str) -> List[Dict]:
        """
        Belirli bir tarihteki maçları getirir
        
        Args:
            date: Tarih formatı DD/MM/YYYY (örn: "01/01/2024")
        
        Returns:
            Maç listesi
        """
        if not self.driver:
            return []
        
        try:
            # Mackolik ana sayfasına git
            url = f"{self.base_url}"
            self.driver.get(url)
            
            # Sayfanın yüklenmesini bekle
            time.sleep(3)
            
            # JavaScript'in çalışmasını bekle
            wait = WebDriverWait(self.driver, 10)
            
            matches = []
            
            # Maç elementlerini bul - çeşitli selector'lar dene
            selectors = [
                "a[href*='/Mac/']",
                "a[href*='/mac/']",
                ".match-card",
                ".match-row",
                "[data-match-id]"
            ]
            
            match_elements = []
            for selector in selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        match_elements = elements
                        print(f"  ✓ {len(elements)} maç elementi bulundu ({selector})")
                        break
                except:
                    continue
            
            if not match_elements:
                # Alternatif: Sayfa kaynağından link'leri bul
                page_source = self.driver.page_source
                import re
                match_links = re.findall(r'href=["\']([^"\']*\/Mac\/\d+[^"\']*)["\']', page_source)
                if match_links:
                    print(f"  ✓ {len(match_links)} maç linki bulundu (regex)")
                    # İlk 20 link için detay çek
                    for link in match_links[:20]:
                        match_id = re.search(r'/Mac/(\d+)', link)
                        if match_id:
                            match_info = self._get_match_details_from_link(link, match_id.group(1), date)
                            if match_info:
                                matches.append(match_info)
            
            # Element'lerden parse et
            for element in match_elements[:30]:
                try:
                    match_info = self._parse_match_element_selenium(element, date)
                    if match_info:
                        matches.append(match_info)
                except Exception as e:
                    continue
            
            time.sleep(self.delay)
            return matches
            
        except Exception as e:
            print(f"Selenium scraping hatası: {e}")
            return []
    
    def _parse_match_element_selenium(self, element, date: str) -> Optional[Dict]:
        """Selenium elementinden maç bilgilerini parse eder"""
        try:
            # Link'ten match ID çıkar
            match_id = None
            try:
                href = element.get_attribute('href')
                if href:
                    match_obj = re.search(r'/Mac/(\d+)', href)
                    if match_obj:
                        match_id = match_obj.group(1)
            except:
                pass
            
            if not match_id:
                match_id = abs(hash(str(element)[:100]))
            
            # Text'ten takım isimlerini çıkar
            text = element.text
            home_team = None
            away_team = None
            
            # Takım isimlerini bul
            team_match = re.search(r'([A-Za-z\sİıĞğÜüŞşÖöÇç]+)\s*[-–]\s*([A-Za-z\sİıĞğÜüŞşÖöÇç]+)', text)
            if team_match:
                home_team = team_match.group(1).strip()
                away_team = team_match.group(2).strip()
            
            if not home_team or not away_team:
                return None
            
            # Lig bilgisi (parent'tan veya sayfadan)
            league = "Lig"
            try:
                parent = element.find_element(By.XPATH, "./ancestor::*[contains(@class, 'league') or contains(@class, 'lig')]")
                league = parent.text.strip()[:50]
            except:
                pass
            
            # Saat bilgisi
            time_str = "00:00"
            try:
                time_elem = element.find_element(By.CSS_SELECTOR, "[class*='time'], [class*='saat']")
                time_str = time_elem.text.strip()
            except:
                pass
            
            return {
                'match_id': match_id,
                'home_team': home_team,
                'away_team': away_team,
                'league': league,
                'date': date,
                'time': time_str,
                'odds': {},  # Oranlar için ayrı bir çağrı gerekir
                'source': 'mackolik'
            }
            
        except Exception as e:
            return None
    
    def _get_match_details_from_link(self, link: str, match_id: str, date: str) -> Optional[Dict]:
        """Maç detay sayfasından bilgi çeker"""
        try:
            full_url = link if link.startswith('http') else f"{self.base_url}{link}"
            self.driver.get(full_url)
            time.sleep(2)
            
            # Title'dan takım isimlerini çıkar
            title = self.driver.title
            team_match = re.search(r'([A-Za-z\sİıĞğÜüŞşÖöÇç]+)\s*[-–]\s*([A-Za-z\sİıĞğÜüŞşÖöÇç]+)', title)
            
            if team_match:
                return {
                    'match_id': match_id,
                    'home_team': team_match.group(1).strip(),
                    'away_team': team_match.group(2).strip(),
                    'league': "Lig",
                    'date': date,
                    'time': "00:00",
                    'odds': {},
                    'source': 'mackolik'
                }
        except:
            pass
        
        return None
    
    def close(self):
        """Driver'ı kapatır"""
        if self.driver:
            self.driver.quit()
