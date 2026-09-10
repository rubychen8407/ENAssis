import { VocabWord } from '../types';

const LISTENING_VOCAB_HISTORY_KEY = 'linguacraft_listening_vocab_history';

export interface ListeningVocabRecord {
  count: number;
  lastUsedAt: number;
}

export function getListeningVocabHistory(): Record<string, ListeningVocabRecord> {
  try {
    const raw = localStorage.getItem(LISTENING_VOCAB_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordListeningVocabUsage(words: string[]): void {
  try {
    const history = getListeningVocabHistory();
    const now = Date.now();
    words.forEach((w) => {
      const normalized = w.trim().toLowerCase();
      if (!normalized) return;
      const prev = history[normalized] || { count: 0, lastUsedAt: 0 };
      history[normalized] = {
        count: prev.count + 1,
        lastUsedAt: now,
      };
    });
    localStorage.setItem(LISTENING_VOCAB_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to record listening vocab usage', err);
  }
}

export function resetListeningVocabHistory(): void {
  try {
    localStorage.removeItem(LISTENING_VOCAB_HISTORY_KEY);
  } catch (err) {
    console.error('Failed to reset listening vocab history', err);
  }
}

/**
 * Smart balanced rotation selector:
 * Guarantees every single word in savedWords gets reviewed progressively.
 * 1. Prioritizes words never featured in listening (count === 0)
 * 2. Prioritizes words with lowest exposure count
 * 3. Prioritizes words not reviewed for the longest time
 * 4. Prioritizes words still in 'learning' mastery level
 */
export function selectBalancedVocabBatch(
  savedWords: VocabWord[],
  batchSize: number = 4,
  offsetIndex: number = 0
): {
  selectedWords: VocabWord[];
  stats: {
    total: number;
    coveredCount: number;
    coveragePercentage: number;
    uncoveredCount: number;
  };
} {
  if (!savedWords || savedWords.length === 0) {
    return {
      selectedWords: [],
      stats: { total: 0, coveredCount: 0, coveragePercentage: 0, uncoveredCount: 0 },
    };
  }

  const history = getListeningVocabHistory();
  let coveredCount = 0;

  // Augment words with metrics
  const scoredWords = savedWords.map((w) => {
    const norm = w.word.trim().toLowerCase();
    const record = history[norm] || { count: 0, lastUsedAt: 0 };
    if (record.count > 0) {
      coveredCount += 1;
    }

    // Weight score: lower is higher priority to pick
    // Never used: count = 0 -> weight base = 0
    let weight = record.count * 1000;
    if (record.lastUsedAt > 0) {
      // Add recency factor (days ago)
      const hoursAgo = (Date.now() - record.lastUsedAt) / (1000 * 60 * 60);
      weight -= Math.min(hoursAgo, 500);
    }
    // Mastery bonus: learning words should be heard more frequently
    if (w.masteryLevel === 'learning' || !w.masteryLevel) {
      weight -= 50;
    }

    return {
      word: w,
      weight,
      count: record.count,
      lastUsedAt: record.lastUsedAt,
    };
  });

  // Sort ascending by weight (least reviewed first)
  scoredWords.sort((a, b) => a.weight - b.weight);

  // Allow rotation pagination if requested
  const total = savedWords.length;
  const start = (offsetIndex * batchSize) % Math.max(1, total);
  const selected: VocabWord[] = [];

  for (let i = 0; i < Math.min(batchSize, total); i++) {
    const idx = (start + i) % total;
    selected.push(scoredWords[idx].word);
  }

  const coveragePercentage = total > 0 ? Math.round((coveredCount / total) * 100) : 0;

  return {
    selectedWords: selected,
    stats: {
      total,
      coveredCount,
      coveragePercentage,
      uncoveredCount: Math.max(0, total - coveredCount),
    },
  };
}
