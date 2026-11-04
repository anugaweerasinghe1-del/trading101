import { Trade, JournalEntry } from "./types";
import { portfolioViewMatchesOwner } from './portfolioOwner';

const JOURNAL_STORAGE_KEY = 'trading_journal_analysis';

export interface TradingPattern {
  emotion: string;
  winRate: number;
  avgProfit: number;
  frequency: number;
  recommendation: string;
}

export interface JournalAnalysis {
  totalTrades: number;
  emotionalPatterns: TradingPattern[];
  mostSuccessfulEmotion: string;
  leastSuccessfulEmotion: string;
  commonMistakes: string[];
  strengths: string[];
  aiInsights: string;
  lastUpdated: Date;
}

export const saveJournalToTrade = (trade: Trade, journal: JournalEntry): Trade => {
  return {
    ...trade,
    journal
  };
};

export const getJournalEntries = (trades: Trade[]): Trade[] => {
  return trades.filter(t => t.journal);
};

export const getEmotionalBreakdown = (trades: Trade[]): Record<string, number> => {
  const breakdown: Record<string, number> = {};
  trades.forEach(trade => {
    if (trade.journal?.emotions) {
      trade.journal.emotions.forEach(emotion => {
        breakdown[emotion] = (breakdown[emotion] || 0) + 1;
      });
    }
  });
  return breakdown;
};

export const saveAnalysis = (analysis: JournalAnalysis) => {
  if (!portfolioViewMatchesOwner()) return;
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(analysis));
};

export const getAnalysis = (): JournalAnalysis | null => {
  if (!portfolioViewMatchesOwner()) return null;
  try {
  const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
  if (!stored) return null;
  
  const parsed = JSON.parse(stored);
  return {
    ...parsed,
    lastUpdated: new Date(parsed.lastUpdated)
  };
  } catch { return null; }
};

export const AVAILABLE_EMOTIONS = [
  'Confident',
  'Anxious',
  'FOMO',
  'Greedy',
  'Fearful',
  'Excited',
  'Calm',
  'Stressed',
  'Impulsive',
  'Rational'
];

// Derived only from current entries; legacy stored analyses are left untouched.
export const getJournalSummary = (trades: Trade[]) => {
  const entries = getJournalEntries(trades);
  const counts = new Map<string, number>();
  let taggedEntries = 0;
  for (const trade of entries) {
    const raw = trade.journal?.emotions;
    const tags = new Set(
      (Array.isArray(raw) ? raw : [])
        .filter((tag): tag is string => typeof tag === "string")
        .map(tag => tag.trim().toLowerCase())
        .filter(Boolean),
    );
    if (tags.size > 0) taggedEntries++;
    for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return {
    totalEntries: entries.length,
    taggedEntries,
    emotions: Array.from(counts, ([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count || a.emotion.localeCompare(b.emotion)),
  };
};
