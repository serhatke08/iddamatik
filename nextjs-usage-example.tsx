
// Next.js kullanım örneği
// app/api/odds/route.ts veya pages/api/odds.ts

import { NextResponse } from 'next/server';
import oddsData from '@/data/league_odds_analysis_grouped_filtered.json';
import type { OddsAnalysisData } from '@/types/odds-analysis.types';

// API Route örneği
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league');
  const betType = searchParams.get('betType');
  
  const data = oddsData as OddsAnalysisData;
  
  if (league && betType) {
    // Belirli lig ve bahis türü için
    const result = data.hierarchical[league]?.[betType];
    return NextResponse.json(result);
  } else if (league) {
    // Belirli lig için
    return NextResponse.json(data.hierarchical[league] || {});
  }
  
  // Tüm veriler
  return NextResponse.json(data);
}

// Client-side kullanım örneği
// components/OddsTable.tsx

'use client';

import { useState, useEffect } from 'react';
import type { FlatOddsData } from '@/types/odds-analysis.types';

export default function OddsTable({ league, betType }: { league: string; betType: string }) {
  const [data, setData] = useState<FlatOddsData[]>([]);
  
  useEffect(() => {
    fetch(`/api/odds?league=${league}&betType=${betType}`)
      .then(res => res.json())
      .then(data => {
        // Düz listeye çevir
        const flat: FlatOddsData[] = [];
        Object.entries(data.odds || {}).forEach(([oddRange, odds]: [string, any]) => {
          flat.push({
            league,
            betType,
            betDescription: data.description,
            oddRange,
            ...odds
          });
        });
        setData(flat);
      });
  }, [league, betType]);
  
  return (
    <table>
      <thead>
        <tr>
          <th>Oran Aralığı</th>
          <th>Toplam Maç</th>
          <th>Tutmuş</th>
          <th>Tutma Oranı</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx}>
            <td>{item.oddRange}</td>
            <td>{item.total}</td>
            <td>{item.hit}</td>
            <td>{item.rate.toFixed(2)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
