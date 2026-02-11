"""
İddaa Matik - Web Uygulaması
Flask ile idaa oranlarını gösteren web arayüzü
"""
from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
from scrapers.mackolik import MackolikScraper
from scrapers.iddaa import IddaaScraper
import config
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'idaamatik-secret-key-2024'

# Scraper instances
mackolik_scraper = MackolikScraper(delay=1.5)
iddaa_scraper = IddaaScraper(delay=1.5)

# Varsayılan scraper
scraper = mackolik_scraper


@app.route('/')
def index():
    """Ana sayfa"""
    today = datetime.now().strftime("%Y-%m-%d")
    return render_template('index.html', today=today)


@app.route('/api/matches')
def get_matches():
    """Maçları API olarak döndür"""
    date_str = request.args.get('date', datetime.now().strftime("%d/%m/%Y"))
    source = request.args.get('source', 'mackolik')  # mackolik veya iddaa
    
    # Scraper seç
    current_scraper = iddaa_scraper if source == 'iddaa' else mackolik_scraper
    
    try:
        matches = current_scraper.get_matches_by_date(date_str)
        
        # Sadece gerçek veriler - mock data yok
        return jsonify({
            'success': True,
            'date': date_str,
            'matches': matches if matches else [],
            'count': len(matches) if matches else 0
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'matches': [],
            'count': 0
        }), 500


@app.route('/api/odds/<int:match_id>')
def get_odds(match_id):
    """Belirli bir maçın oranlarını getir"""
    try:
        odds = scraper.get_match_odds(match_id)
        
        if not odds:
            return jsonify({
                'success': False,
                'error': 'Oranlar bulunamadı'
            }), 404
        
        return jsonify({
            'success': True,
            'match_id': match_id,
            'odds': odds
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/search')
def search_matches():
    """Geçmiş maçları arama"""
    team_name = request.args.get('team', '').strip()
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    league = request.args.get('league', '').strip()
    source = request.args.get('source', 'mackolik')
    
    # Scraper seç
    current_scraper = iddaa_scraper if source == 'iddaa' else mackolik_scraper
    
    try:
        results = []
        
        # Eğer tarih aralığı verilmişse
        if date_from and date_to:
            from datetime import datetime as dt
            try:
                start = dt.strptime(date_from, "%d/%m/%Y")
                end = dt.strptime(date_to, "%d/%m/%Y")
                
                current = start
                while current <= end:
                    date_str = current.strftime("%d/%m/%Y")
                    matches = current_scraper.get_matches_by_date(date_str)
                    
                    # Filtrele
                    for match in matches:
                        if team_name:
                            if team_name.lower() not in match.get('home_team', '').lower() and \
                               team_name.lower() not in match.get('away_team', '').lower():
                                continue
                        if league:
                            if league.lower() not in match.get('league', '').lower():
                                continue
                        results.append(match)
                    
                    current += timedelta(days=1)
                    time.sleep(0.5)  # Rate limiting
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Geçersiz tarih formatı. DD/MM/YYYY kullanın.'
                }), 400
        else:
            # Sadece takım adı veya lig ile arama - son 30 günü tara
            from datetime import datetime as dt, timedelta
            for i in range(30):
                date = dt.now() - timedelta(days=i)
                date_str = date.strftime("%d/%m/%Y")
                matches = current_scraper.get_matches_by_date(date_str)
                
                for match in matches:
                    if team_name:
                        if team_name.lower() not in match.get('home_team', '').lower() and \
                           team_name.lower() not in match.get('away_team', '').lower():
                            continue
                    if league:
                        if league.lower() not in match.get('league', '').lower():
                            continue
                    results.append(match)
                
                time.sleep(0.3)
        
        return jsonify({
            'success': True,
            'query': {
                'team': team_name,
                'date_from': date_from,
                'date_to': date_to,
                'league': league
            },
            'matches': results,
            'count': len(results)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
