"""
Yardımcı fonksiyonlar
"""
import os
import json
from datetime import datetime
from typing import Dict, List, Any


def ensure_dir(directory: str):
    """Dizin yoksa oluşturur"""
    if not os.path.exists(directory):
        os.makedirs(directory)


def save_json(data: Any, filepath: str):
    """Veriyi JSON dosyasına kaydeder"""
    ensure_dir(os.path.dirname(filepath))
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_json(filepath: str) -> Any:
    """JSON dosyasından veri yükler"""
    if not os.path.exists(filepath):
        return None
    
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def format_date(date_str: str, input_format: str = "%d/%m/%Y", output_format: str = "%Y-%m-%d") -> str:
    """Tarih formatını dönüştürür"""
    try:
        date_obj = datetime.strptime(date_str, input_format)
        return date_obj.strftime(output_format)
    except ValueError:
        return date_str


def clean_team_name(name: str) -> str:
    """Takım adını temizler"""
    if not name:
        return ""
    
    # Gereksiz boşlukları temizle
    name = name.strip()
    
    # Özel karakterleri düzelt
    replacements = {
        'İ': 'I',
        'ı': 'i',
        'ğ': 'g',
        'Ğ': 'G',
        'ü': 'u',
        'Ü': 'U',
        'ş': 's',
        'Ş': 'S',
        'ö': 'o',
        'Ö': 'O',
        'ç': 'c',
        'Ç': 'C'
    }
    
    for old, new in replacements.items():
        name = name.replace(old, new)
    
    return name
