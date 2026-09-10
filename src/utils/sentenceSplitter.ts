import { ListeningItemFeedback } from './listeningErrorAnalysis';

export interface AnalyzedSentence {
  id: string;
  sentenceNumber: number;
  en: string;
  zh: string;
  focusWords: string[];
  isLocatingSentence: boolean;
  locatingQuestionNumbers: number[];
  isMistake: boolean;
  mistakeQuestionNumbers: number[];
  userAnswers: Record<number, string>;
  correctAnswers: Record<number, string>;
  explanationZh?: string;
}

/**
 * Cleanly split audioScript into punctuated sentences preserving speaker prefixes
 */
export function splitTextIntoSentences(text: string): string[] {
  if (!text || !text.trim()) return [];

  const rawLines = text.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
  const result: string[] = [];

  for (const line of rawLines) {
    // Check if line has speaker prefix like "Officer:" or "Interviewer:"
    const speakerMatch = line.match(/^([A-Za-z0-9\s_-]+:)\s*(.+)$/);
    const speaker = speakerMatch ? speakerMatch[1] + ' ' : '';
    const content = speakerMatch ? speakerMatch[2] : line;

    // Split on sentence boundaries (. ! ?) while handling abbreviations like Mr., e.g., i.e., Dr.
    // Replace common abbreviations temporarily
    const safeContent = content
      .replace(/(?:Mr|Mrs|Ms|Dr|Prof|e\.g|i\.e)\./gi, (m) => m.replace('.', '##DOT##'));

    const parts = safeContent.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [safeContent];

    parts.forEach((part, pIdx) => {
      let restored = part.replace(/##DOT##/g, '.').trim();
      if (restored) {
        if (pIdx === 0 && speaker) {
          result.push(`${speaker}${restored}`);
        } else {
          result.push(restored);
        }
      }
    });
  }

  return result.filter((s) => s.length > 2);
}

/**
 * Fuzzy check if sentence A contains or is located by sentence B
 */
function isLocatingMatch(sentenceEn: string, locatingTarget: string): boolean {
  if (!sentenceEn || !locatingTarget) return false;
  const cleanSent = sentenceEn.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanTarget = locatingTarget.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  if (cleanSent.includes(cleanTarget) || cleanTarget.includes(cleanSent)) {
    return true;
  }

  // Check substantial sub-phrase overlap (>= 4 words)
  const wordsTarget = cleanTarget.split(' ').filter((w) => w.length > 3);
  if (wordsTarget.length >= 3) {
    const matchedWords = wordsTarget.filter((w) => cleanSent.includes(w));
    if (matchedWords.length / wordsTarget.length >= 0.7) {
      return true;
    }
  }

  return false;
}

/**
 * Construct a comprehensive sentence-by-sentence list with mistake & locating sentence highlighting
 */
export function buildAnalyzedSentences(
  audioScript: string,
  existingSentences: Array<{ en: string; zh: string; focusWords?: string[] }> = [],
  questions: Array<{
    id?: string;
    questionNumber?: number | string;
    locatingSentence?: string;
    correctAnswer?: string;
    explanationZh?: string;
  }> = [],
  feedbacks: ListeningItemFeedback[] = []
): AnalyzedSentence[] {
  // 1. Determine baseline sentence list
  const splitSentences = splitTextIntoSentences(audioScript);
  const baselineCount = Math.max(splitSentences.length, existingSentences.length);

  const mergedSentences: Array<{ en: string; zh: string; focusWords: string[] }> = [];

  for (let i = 0; i < baselineCount; i++) {
    const existing = existingSentences[i];
    const splitText = splitSentences[i] || '';

    let en = existing?.en || splitText;
    let zh = existing?.zh || '';
    let focusWords = existing?.focusWords || [];

    // If existing sentence is much shorter or mismatched, prefer split text
    if (!en && splitText) en = splitText;

    mergedSentences.push({ en, zh, focusWords });
  }

  // 2. Map feedbacks by questionNumber or ID
  const feedbackMap: Record<string, ListeningItemFeedback> = {};
  feedbacks.forEach((fb) => {
    feedbackMap[String(fb.itemNumber)] = fb;
    if (fb.id) feedbackMap[fb.id] = fb;
  });

  // 3. Analyze each sentence for locating keys and mistakes
  return mergedSentences.map((s, idx) => {
    const sNum = idx + 1;
    const locatingQNums: number[] = [];
    const mistakeQNums: number[] = [];
    const userAnswers: Record<number, string> = {};
    const correctAnswers: Record<number, string> = {};
    let matchedExplanation = '';

    questions.forEach((q, qIndex) => {
      const qNum = typeof q.questionNumber === 'number' ? q.questionNumber : qIndex + 1;
      const targetLocating = q.locatingSentence || '';
      const targetAnswer = q.correctAnswer || '';

      const isMatch =
        (targetLocating && isLocatingMatch(s.en, targetLocating)) ||
        (targetAnswer && s.en.toLowerCase().includes(targetAnswer.toLowerCase().trim()));

      if (isMatch) {
        locatingQNums.push(qNum);
        if (q.explanationZh && !matchedExplanation) {
          matchedExplanation = q.explanationZh;
        }

        // Check if user made a mistake on this question
        const fb = feedbackMap[String(qNum)] || (q.id ? feedbackMap[q.id] : undefined);
        if (fb) {
          userAnswers[qNum] = fb.userAnswer;
          correctAnswers[qNum] = fb.correctAnswer;
          if (!fb.isCorrect) {
            mistakeQNums.push(qNum);
          }
        }
      }
    });

    return {
      id: `sent_${sNum}`,
      sentenceNumber: sNum,
      en: s.en,
      zh: s.zh,
      focusWords: s.focusWords || [],
      isLocatingSentence: locatingQNums.length > 0,
      locatingQuestionNumbers: locatingQNums,
      isMistake: mistakeQNums.length > 0,
      mistakeQuestionNumbers: mistakeQNums,
      userAnswers,
      correctAnswers,
      explanationZh: matchedExplanation,
    };
  });
}
