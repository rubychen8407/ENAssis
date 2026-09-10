export type ListeningErrorType =
  | 'correct'
  | 'spelling'
  | 'plural_suffix'
  | 'capitalization'
  | 'number_date'
  | 'distractor_trap'
  | 'unanswered';

export interface ListeningItemFeedback {
  id: string;
  itemNumber: number | string;
  prompt?: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  errorType: ListeningErrorType;
  errorTypeLabel: string;
  badgeColor: string;
  coachFeedback: string;
  locatingSentence?: string;
  explanationZh?: string;
}

// 簡單編輯距離 (Levenshtein distance)
function getLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1] + 1, dp[i][j - 1] + 1, dp[i - 1][j] + 1);
      }
    }
  }
  return dp[m][n];
}

/**
 * 深入解析聽力題目作答，歸納錯誤類型並給予教練式專業反饋
 */
export function analyzeListeningAnswer(
  id: string,
  itemNumber: number | string,
  userAnswerRaw: string = '',
  correctAnswerRaw: string = '',
  prompt?: string,
  locatingSentence?: string,
  explanationZh?: string
): ListeningItemFeedback {
  const userTrimmed = (userAnswerRaw || '').trim();
  const correctTrimmed = (correctAnswerRaw || '').trim();

  // 1. 未作答
  if (!userTrimmed) {
    return {
      id,
      itemNumber,
      prompt,
      userAnswer: '（未填寫）',
      correctAnswer: correctTrimmed,
      isCorrect: false,
      errorType: 'unanswered',
      errorTypeLabel: '未作答 / 漏聽',
      badgeColor: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-300',
      coachFeedback: '此題未作答。建議在播放錄音前先圈選題目中的定位關鍵字，預判將出現的詞性與內容。',
      locatingSentence,
      explanationZh,
    };
  }

  // 乾淨字串（去除標點）
  const cleanUser = userTrimmed.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
  const cleanCorrect = correctTrimmed.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();

  // 2. 完全正確
  if (cleanUser === cleanCorrect || cleanCorrect.includes(cleanUser) && cleanUser.length > 2 && Math.abs(cleanUser.length - cleanCorrect.length) <= 1) {
    // 檢查是否大小寫有別但被接受
    const isExactCase = userTrimmed === correctTrimmed;
    return {
      id,
      itemNumber,
      prompt,
      userAnswer: userTrimmed,
      correctAnswer: correctTrimmed,
      isCorrect: true,
      errorType: 'correct',
      errorTypeLabel: '完全正確',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
      coachFeedback: isExactCase
        ? '太棒了！精準捕捉到定位詞，單字拼寫與語法形式完全吻合。'
        : '答案正確！注意標準答案之大小寫或專有名詞書寫規範。',
      locatingSentence,
      explanationZh,
    };
  }

  // 3. 檢查是否僅大小寫差異（針對專有名詞如地名、星期等）
  if (userTrimmed.toLowerCase() === correctTrimmed.toLowerCase()) {
    return {
      id,
      itemNumber,
      prompt,
      userAnswer: userTrimmed,
      correctAnswer: correctTrimmed,
      isCorrect: false,
      errorType: 'capitalization',
      errorTypeLabel: '大小寫規範錯誤',
      badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300',
      coachFeedback: `專有名詞或首字母需大寫規範（正確應為 "${correctTrimmed}"）。雅思聽力對專有名詞大小寫要求極為嚴格，請務必留意。`,
      locatingSentence,
      explanationZh,
    };
  }

  // 4. 檢查單複數 / 詞尾時態 (Plural / Suffix Error)
  const isPluralDifference =
    cleanUser + 's' === cleanCorrect ||
    cleanUser === cleanCorrect + 's' ||
    cleanUser + 'es' === cleanCorrect ||
    cleanUser === cleanCorrect + 'es' ||
    cleanUser + 'ed' === cleanCorrect ||
    cleanUser === cleanCorrect + 'ed' ||
    cleanUser + 'ing' === cleanCorrect ||
    cleanUser === cleanCorrect + 'ing';

  if (isPluralDifference) {
    return {
      id,
      itemNumber,
      prompt,
      userAnswer: userTrimmed,
      correctAnswer: correctTrimmed,
      isCorrect: false,
      errorType: 'plural_suffix',
      errorTypeLabel: '單複數 / 詞尾遺漏',
      badgeColor: 'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300',
      coachFeedback: `捕捉到了詞根，但疏忽了單複數或時態詞尾（正確為 "${correctTrimmed}"）。英式英語常有尾音弱讀或與後詞連音（Linking），可多留意前後文文法單複數標誌。`,
      locatingSentence,
      explanationZh,
    };
  }

  // 5. 數字、日期、電話聽力混淆
  const containsNumberUser = /\d/.test(cleanUser);
  const containsNumberCorrect = /\d/.test(cleanCorrect);
  if (containsNumberUser || containsNumberCorrect) {
    return {
      id,
      itemNumber,
      prompt,
      userAnswer: userTrimmed,
      correctAnswer: correctTrimmed,
      isCorrect: false,
      errorType: 'number_date',
      errorTypeLabel: '數字 / 日期偏差',
      badgeColor: 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300',
      coachFeedback: `數字或日期細節聽力偏差（正確為 "${correctTrimmed}"）。注意 -teen（長音重音在後）與 -ty（短音重音在前）的辨析，以及序數詞 th 的輕咬舌發音。`,
      locatingSentence,
      explanationZh,
    };
  }

  // 6. 拼寫錯誤 (Spelling Error) - 編輯距離小於等於 2
  const distance = getLevenshteinDistance(cleanUser, cleanCorrect);
  if (distance <= 2 || (cleanCorrect.length >= 7 && distance <= 3)) {
    return {
      id,
      itemNumber,
      prompt,
      userAnswer: userTrimmed,
      correctAnswer: correctTrimmed,
      isCorrect: false,
      errorType: 'spelling',
      errorTypeLabel: '單字拼寫錯誤',
      badgeColor: 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300',
      coachFeedback: `聽懂了該單字，但拼寫有些微差錯（你寫 "${userTrimmed}"，正確為 "${correctTrimmed}"）。注意雙寫字母（如 cc, mm, rr）或不發音字母（silent letters）。`,
      locatingSentence,
      explanationZh,
    };
  }

  // 7. 干擾項陷阱或關鍵詞漏聽
  return {
    id,
    itemNumber,
    prompt,
    userAnswer: userTrimmed,
    correctAnswer: correctTrimmed,
    isCorrect: false,
    errorType: 'distractor_trap',
    errorTypeLabel: '干擾陷阱 / 關鍵詞位移',
    badgeColor: 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300 border-red-300',
    coachFeedback: `此處講者可能使用了干擾項陷阱（例如先說一個選項，隨後用 "actually", "however", "instead" 進行更正）或同義替換（Paraphrase）。請比對錄音定位句。`,
    locatingSentence,
    explanationZh,
  };
}
