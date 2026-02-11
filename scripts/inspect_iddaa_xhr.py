"""
İddaa.com sonuç sayfasında XHR/JSON endpoint'lerini çıkarır
"""
import time
import json
from seleniumwire import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


def main():
    url = "https://www.iddaa.com/spor-toto/sonuclar"

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.set_page_load_timeout(30)

    print(f"Sayfa yükleniyor: {url}")
    driver.get(url)
    time.sleep(8)

    json_requests = []
    for req in driver.requests:
        try:
            if not req.response:
                continue
            content_type = req.response.headers.get("Content-Type", "")
            if "application/json" in content_type:
                json_requests.append(req)
        except Exception:
            continue

    print(f"JSON istek sayısı: {len(json_requests)}")
    for i, req in enumerate(json_requests[:10], 1):
        print(f"{i}. {req.url} ({req.response.status_code})")

    # İlk JSON body örneğini kaydet
    if json_requests:
        sample = json_requests[0]
        try:
            body = sample.response.body
            text = body.decode("utf-8", errors="ignore")
            with open("data/iddaa_sample.json", "w", encoding="utf-8") as f:
                f.write(text)
            print("Örnek JSON kaydedildi: data/iddaa_sample.json")
        except Exception as e:
            print(f"Örnek JSON kaydedilemedi: {e}")

    driver.quit()


if __name__ == "__main__":
    main()
