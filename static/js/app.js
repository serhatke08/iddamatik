// İddaa Matik - Frontend JavaScript

let currentDate = new Date().toISOString().split('T')[0];

document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('dateInput');
    const loadBtn = document.getElementById('loadBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    // Bugünün tarihini yükle
    loadMatches(currentDate);
    
    // Tarih değiştiğinde
    dateInput.addEventListener('change', function() {
        currentDate = this.value;
    });
    
    // Yükle butonu
    loadBtn.addEventListener('click', function() {
        loadMatches(currentDate);
    });
    
    // Yenile butonu
    refreshBtn.addEventListener('click', function() {
        loadMatches(currentDate);
    });
    
    // Enter tuşu ile yükleme
    dateInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadMatches(currentDate);
        }
    });
    
    // Arama butonu
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            searchMatches();
        });
    }
    
    // Temizle butonu
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            document.getElementById('teamSearch').value = '';
            document.getElementById('leagueSearch').value = '';
            document.getElementById('dateFrom').value = '';
            document.getElementById('dateTo').value = '';
            loadMatches(currentDate);
        });
    }
});

function loadMatches(date) {
    showLoading();
    hideError();
    
    // Tarih formatını dönüştür (YYYY-MM-DD -> DD/MM/YYYY)
    const dateParts = date.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    
    fetch(`/api/matches?date=${encodeURIComponent(formattedDate)}`)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                displayMatches(data.matches, formattedDate);
                updateLastUpdate();
            } else {
                showError('Maçlar yüklenirken bir hata oluştu: ' + (data.error || 'Bilinmeyen hata'));
            }
        })
        .catch(error => {
            hideLoading();
            showError('Bağlantı hatası: ' + error.message);
            console.error('Error:', error);
        });
}

function displayMatches(matches, date) {
    const container = document.getElementById('matchesContainer');
    
    if (!matches || matches.length === 0) {
        container.innerHTML = `
            <div class="no-matches">
                <h3>📅 ${date} tarihinde maç bulunamadı</h3>
                <p>Lütfen farklı bir tarih seçin.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    matches.forEach(match => {
        const odds = match.odds || {};
        const homeTeam = match.home_team || 'Ev Sahibi';
        const awayTeam = match.away_team || 'Deplasman';
        const league = match.league || 'Lig';
        const time = match.time || '--:--';
        
        html += `
            <div class="match-card">
                <div class="match-header">
                    <span class="league">${league}</span>
                    <span class="match-time">${time}</span>
                </div>
                <div class="teams">
                    <div class="team">
                        <div class="team-name">${homeTeam}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <div class="team-name">${awayTeam}</div>
                    </div>
                </div>
                <div class="odds-section">
                    <div class="odd-item">
                        <div class="odd-label">1 (Ev Sahibi)</div>
                        <div class="odd-value">${odds.ms1 || 'N/A'}</div>
                    </div>
                    <div class="odd-item">
                        <div class="odd-label">X (Beraberlik)</div>
                        <div class="odd-value">${odds.msx || 'N/A'}</div>
                    </div>
                    <div class="odd-item">
                        <div class="odd-label">2 (Deplasman)</div>
                        <div class="odd-value">${odds.ms2 || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('matchesContainer').innerHTML = '';
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function updateLastUpdate() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR');
    document.getElementById('lastUpdate').textContent = `Son güncelleme: ${timeStr}`;
}

function searchMatches() {
    showLoading();
    hideError();
    
    const team = document.getElementById('teamSearch').value.trim();
    const league = document.getElementById('leagueSearch').value.trim();
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    // Tarih formatını dönüştür (YYYY-MM-DD -> DD/MM/YYYY)
    let dateFromFormatted = '';
    let dateToFormatted = '';
    
    if (dateFrom) {
        const parts = dateFrom.split('-');
        dateFromFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    if (dateTo) {
        const parts = dateTo.split('-');
        dateToFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    // API parametrelerini oluştur
    const params = new URLSearchParams();
    if (team) params.append('team', team);
    if (league) params.append('league', league);
    if (dateFromFormatted) params.append('date_from', dateFromFormatted);
    if (dateToFormatted) params.append('date_to', dateToFormatted);
    
    fetch(`/api/search?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                if (data.matches && data.matches.length > 0) {
                    displayMatches(data.matches, dateFromFormatted || dateToFormatted || 'Arama Sonuçları');
                    updateLastUpdate();
                } else {
                    document.getElementById('matchesContainer').innerHTML = `
                        <div class="no-matches">
                            <h3>🔍 Arama sonucu bulunamadı</h3>
                            <p>Arama kriterlerinizi değiştirip tekrar deneyin.</p>
                        </div>
                    `;
                }
            } else {
                showError('Arama sırasında bir hata oluştu: ' + (data.error || 'Bilinmeyen hata'));
            }
        })
        .catch(error => {
            hideLoading();
            showError('Bağlantı hatası: ' + error.message);
            console.error('Error:', error);
        });
}
