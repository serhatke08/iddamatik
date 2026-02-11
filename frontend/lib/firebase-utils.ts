// Firebase Firestore utility functions for frontend
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp,
  orderBy,
  limit as firestoreLimit
} from "firebase/firestore";
import { db } from "./firebase";

export interface Match {
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  date: string;
  time: string;
  status: string;
  odds: Record<string, number>;
  source: string;
  created_at?: any;
  updated_at?: any;
}

/**
 * Firebase'den maçları getirir
 */
export async function getMatchesFromFirebase(
  teamName?: string,
  league?: string,
  dateFrom?: string,
  dateTo?: string,
  status?: string,
  limitCount: number = 100
): Promise<Match[]> {
  try {
    const matchesRef = collection(db, "matches");
    let q = query(matchesRef, orderBy("match_datetime", "desc"), firestoreLimit(limitCount));
    
    // Filtreler
    if (teamName) {
      q = query(matchesRef, where("home_team", "==", teamName), firestoreLimit(limitCount));
    }
    
    if (league) {
      q = query(matchesRef, where("league", "==", league), firestoreLimit(limitCount));
    }
    
    if (status) {
      q = query(matchesRef, where("status", "==", status), firestoreLimit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const matches: Match[] = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      matches.push({
        match_id: docSnapshot.id,
        home_team: data.home_team || "",
        away_team: data.away_team || "",
        league: data.league || "",
        date: data.date || "",
        time: data.time || "",
        status: data.status || "UPCOMING",
        odds: data.odds || {},
        source: data.source || "mackolik"
      });
    });
    
    // Client-side filtreleme (Firestore'da complex query sınırlamaları var)
    let filteredMatches = matches;
    
    if (teamName && !teamName.includes("==")) {
      filteredMatches = filteredMatches.filter(m => 
        m.home_team.toLowerCase().includes(teamName.toLowerCase()) ||
        m.away_team.toLowerCase().includes(teamName.toLowerCase())
      );
    }
    
    return filteredMatches.slice(0, limitCount);
  } catch (error) {
    console.error("Firebase'den maç getirme hatası:", error);
    return [];
  }
}

/**
 * Firebase'den bugünkü maçları getirir
 */
export async function getTodayMatchesFromFirebase(): Promise<Match[]> {
  return getMatchesFromFirebase(undefined, undefined, undefined, undefined, "TODAY");
}

/**
 * Firebase'den gelecek maçları getirir
 */
export async function getUpcomingMatchesFromFirebase(days: number = 7): Promise<Match[]> {
  return getMatchesFromFirebase(undefined, undefined, undefined, undefined, "UPCOMING");
}

/**
 * Oran değerine göre maçları arar
 */
export async function searchMatchesByOdds(
  marketType: string,
  oddsValue: number,
  tolerance: number = 0.01
): Promise<Match[]> {
  try {
    const matchesRef = collection(db, "matches");
    const q = query(matchesRef, firestoreLimit(500)); // Firestore'da range query yok, client-side filtreleme
    
    const querySnapshot = await getDocs(q);
    const matches: Match[] = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const odds = data.odds || {};
      
      // Market key normalize et
      const marketKey = normalizeMarketKey(marketType);
      
      if (marketKey in odds) {
        const matchOdds = odds[marketKey];
        if (typeof matchOdds === "number" && Math.abs(matchOdds - oddsValue) <= tolerance) {
          matches.push({
            match_id: docSnapshot.id,
            home_team: data.home_team || "",
            away_team: data.away_team || "",
            league: data.league || "",
            date: data.date || "",
            time: data.time || "",
            status: data.status || "UPCOMING",
            odds: odds,
            source: data.source || "mackolik"
          });
        }
      }
    });
    
    return matches;
  } catch (error) {
    console.error("Oran arama hatası:", error);
    return [];
  }
}

/**
 * Market key'i normalize eder
 */
function normalizeMarketKey(marketType: string): string {
  const marketMap: Record<string, string> = {
    'ms': 'ms1',
    'ms1': 'ms1',
    '1': 'ms1',
    'msx': 'msx',
    'x': 'msx',
    'ms2': 'ms2',
    '2': 'ms2',
    'kg': 'kg_var',
    'kg_var': 'kg_var',
    'kgv': 'kg_var',
    'kg_yok': 'kg_yok',
    'kgy': 'kg_yok',
    'alt': 'alt_2_5',
    'alt_2_5': 'alt_2_5',
    'ust': 'ust_2_5',
    'üst': 'ust_2_5',
    'ust_2_5': 'ust_2_5',
    'üst_2_5': 'ust_2_5'
  };
  
  return marketMap[marketType.toLowerCase().trim()] || marketType.toLowerCase().trim();
}
