
// TypeScript tip tanımları
export interface OddsData {
  total: number;
  hit: number;
  rate: number;
}

export interface BetTypeData {
  description: string;
  odds: Record<string, OddsData>;
}

export interface LeagueData {
  [betType: string]: BetTypeData;
}

export interface HierarchicalData {
  [league: string]: LeagueData;
}

export interface FlatOddsData {
  league: string;
  betType: string;
  betDescription: string;
  oddRange: string;
  total: number;
  hit: number;
  rate: number;
}

export interface OddsAnalysisData {
  hierarchical: HierarchicalData;
  flat: FlatOddsData[];
}
