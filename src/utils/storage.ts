import { VocabWord } from '../types';

const VOCAB_STORAGE_KEY = 'linguacraft_vocab_v1';
const HISTORY_STORAGE_KEY = 'linguacraft_history_v1';

const INITIAL_WORDS: VocabWord[] = [
  {
    id: 'w1',
    word: 'articulate',
    phonetic: '/ɑːˈtɪk.jə.lət/',
    partOfSpeech: 'adj. / v.',
    translation: '善於表達的；清楚說明',
    definitionEn: 'able to express ideas clearly and effectively in speech or writing',
    collocations: ['an articulate speaker', 'articulate an idea clearly', 'highly articulate'],
    exampleEn: 'She was able to articulate her complex feelings with remarkable clarity.',
    exampleZh: '她能夠以驚人的清晰度清楚表達自己複雜的感受。',
    grammarNotes: '作動詞時重音在第三音節 /ɑːˈtɪk.jʊ.leɪt/，常接 that 子句或受詞。',
    masteryLevel: 'learning',
    dateAdded: '2026-03-01',
    tags: ['Speaking', 'Advanced', 'Communication'],
  },
  {
    id: 'w2',
    word: 'comprehend',
    phonetic: '/ˌkɒm.prɪˈhend/',
    partOfSpeech: 'v.',
    translation: '充分理解；領會',
    definitionEn: 'to understand something fully and completely',
    collocations: ['fully comprehend', 'difficult to comprehend', 'comprehend the significance'],
    exampleEn: 'It took him several minutes to comprehend the full meaning of what was said.',
    exampleZh: '他花了幾分鐘才充分理解剛才所說的話的全部涵義。',
    grammarNotes: '及物動詞，常用於肯定句或否定句中接名詞或 what 引導的名詞子句。',
    masteryLevel: 'learning',
    dateAdded: '2026-03-02',
    tags: ['Reading', 'Academic'],
  },
  {
    id: 'w3',
    word: 'perspective',
    phonetic: '/pəˈspek.tɪv/',
    partOfSpeech: 'n.',
    translation: '觀點；洞察力；透視法',
    definitionEn: 'a particular attitude toward or way of regarding something; a point of view',
    collocations: ['from my perspective', 'gain a fresh perspective', 'broader perspective'],
    exampleEn: 'Traveling to different countries gives you a much broader perspective on life.',
    exampleZh: '到不同的國家旅行能給予你對生活更寬廣的視角。',
    grammarNotes: '可數名詞。常與介系詞 on 或 from 搭配（e.g., from the perspective of...）。',
    masteryLevel: 'new',
    dateAdded: '2026-03-03',
    tags: ['Writing', 'Discussion'],
  },
  {
    id: 'w4',
    word: 'spontaneous',
    phonetic: '/spɒnˈteɪ.ni.əs/',
    partOfSpeech: 'adj.',
    translation: '自發的；非預先安排的；隨興的',
    definitionEn: 'happening or done in a natural, often sudden way, without being planned',
    collocations: ['spontaneous decision', 'spontaneous applause', 'spontaneous reaction'],
    exampleEn: 'We made a spontaneous decision to take a weekend road trip to the coast.',
    exampleZh: '我們隨興做了一個決定，週末開車去海邊旅行。',
    grammarNotes: '形容詞，副詞為 spontaneously。常用於形容談話或反應自然而不做作。',
    masteryLevel: 'new',
    dateAdded: '2026-03-04',
    tags: ['Speaking', 'Daily'],
  },
  {
    id: 'w5',
    word: 'subtle',
    phonetic: '/ˈsʌt.əl/',
    partOfSpeech: 'adj.',
    translation: '細微的；微妙的；不易察覺的',
    definitionEn: 'not loud, bright, noticeable, or obvious in any way',
    collocations: ['subtle difference', 'subtle nuance', 'subtle hint'],
    exampleEn: 'There is a subtle distinction between being confident and being arrogant.',
    exampleZh: '自信與傲慢之間存在著極其微妙的區別。',
    grammarNotes: '注意發音中字母 b 不發音。常用來修飾 nuance、difference、change。',
    masteryLevel: 'learning',
    dateAdded: '2026-03-05',
    tags: ['Vocabulary', 'High-Yield'],
  },
];

// Helper: Check if word was added in past 24 hours
export function isWordAddedWithin24Hours(word: VocabWord): boolean {
  if (!word.dateAdded) return false;
  const addedTime = new Date(word.dateAdded).getTime();
  if (isNaN(addedTime)) return false;
  const diff = Date.now() - addedTime;
  return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
}

// Helper: Compute word mastery based on user rule:
// 1. If speaking AND writing both passed => 'mastered' (已掌握)
// 2. If added in past 24 hours and not passed both => 'new' (新收錄)
// 3. Otherwise (tested and failed either, or older than 24h without both passed) => 'learning' (學習中)
export function computeWordMastery(word: VocabWord): 'new' | 'learning' | 'mastered' {
  if (word.speakingPassed && word.writingPassed) {
    return 'mastered';
  }
  // If tested and either failed, it is in learning
  if (word.speakingPassed === false || word.writingPassed === false) {
    // If one is passed and other failed, definitely learning
    if (word.speakingPassed || word.writingPassed) {
      return 'learning';
    }
  }
  // If freshly added within 24 hours and neither passed yet
  if (isWordAddedWithin24Hours(word)) {
    return 'new';
  }
  return 'learning';
}

export function getSavedVocabulary(): VocabWord[] {
  if (typeof window === 'undefined') return INITIAL_WORDS;
  try {
    const raw = localStorage.getItem(VOCAB_STORAGE_KEY);
    let list: VocabWord[];
    if (!raw) {
      list = INITIAL_WORDS.map((w, index) => {
        // Provide realistic demo states: perspective is freshly imported
        if (w.word === 'perspective' || w.word === 'spontaneous') {
          return {
            ...w,
            dateAdded: new Date(Date.now() - index * 2 * 3600 * 1000).toISOString(),
            speakingPassed: false,
            writingPassed: false,
            masteryLevel: 'new',
          };
        }
        if (w.word === 'articulate') {
          return {
            ...w,
            speakingPassed: true,
            writingPassed: true,
            masteryLevel: 'mastered',
          };
        }
        return {
          ...w,
          speakingPassed: false,
          writingPassed: false,
          masteryLevel: 'learning',
        };
      });
      localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(list));
      return list;
    }

    list = JSON.parse(raw);
    // Recalculate dynamic mastery and synchronize
    let hasChanges = false;
    const synchronized = list.map((w) => {
      const calculated = computeWordMastery(w);
      if (w.masteryLevel !== calculated) {
        hasChanges = true;
        return { ...w, masteryLevel: calculated };
      }
      return w;
    });

    if (hasChanges) {
      try {
        localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(synchronized));
      } catch (_) {}
    }

    return synchronized;
  } catch (err) {
    console.error('Failed to load vocabulary from storage:', err);
    return INITIAL_WORDS;
  }
}

export function saveVocabularyList(words: VocabWord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(words));
  } catch (err) {
    console.error('Failed to save vocabulary:', err);
  }
}

export function addWordToVocabulary(newWord: Omit<VocabWord, 'id' | 'dateAdded'>): VocabWord {
  const current = getSavedVocabulary();
  // Check if exists
  const existingIndex = current.findIndex(
    (w) => w.word.toLowerCase() === newWord.word.toLowerCase()
  );

  const wordObj: VocabWord = {
    ...newWord,
    id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    dateAdded: new Date().toISOString(),
    speakingPassed: false,
    writingPassed: false,
    masteryLevel: 'new',
  };

  let updated: VocabWord[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = {
      ...current[existingIndex],
      ...newWord,
      dateAdded: new Date().toISOString(), // refresh 24h timer on re-import
      masteryLevel: computeWordMastery({
        ...current[existingIndex],
        ...newWord,
        dateAdded: new Date().toISOString(),
      }),
    };
  } else {
    updated = [wordObj, ...current];
  }

  saveVocabularyList(updated);
  return wordObj;
}

// Record result of speaking or writing test for a word
export function recordWordPracticeResult(
  wordId: string,
  type: 'speaking' | 'writing',
  passed: boolean
): VocabWord | null {
  const current = getSavedVocabulary();
  let updatedWord: VocabWord | null = null;

  const updated = current.map((w) => {
    if (w.id === wordId || w.word.toLowerCase() === wordId.toLowerCase()) {
      const sp = type === 'speaking' ? passed : (w.speakingPassed ?? false);
      const wp = type === 'writing' ? passed : (w.writingPassed ?? false);
      const computed = (sp && wp) ? 'mastered' : 'learning';

      updatedWord = {
        ...w,
        speakingPassed: sp,
        writingPassed: wp,
        lastTestedAt: new Date().toISOString(),
        masteryLevel: computed,
      };
      return updatedWord;
    }
    return w;
  });

  if (updatedWord) {
    saveVocabularyList(updated);
  }
  return updatedWord;
}

export function updateWordMastery(id: string, level: 'new' | 'learning' | 'mastered'): void {
  const current = getSavedVocabulary();
  const updated: VocabWord[] = current.map((w): VocabWord => {
    if (w.id === id) {
      if (level === 'mastered') {
        return {
          ...w,
          masteryLevel: 'mastered',
          speakingPassed: true,
          writingPassed: true,
          lastTestedAt: new Date().toISOString(),
        };
      }
      if (level === 'new') {
        return {
          ...w,
          masteryLevel: 'new',
          dateAdded: new Date().toISOString(),
          speakingPassed: false,
          writingPassed: false,
        };
      }
      return {
        ...w,
        masteryLevel: 'learning',
        speakingPassed: false,
        writingPassed: false,
      };
    }
    return w;
  });
  saveVocabularyList(updated);
}

export function deleteWord(id: string): void {
  const current = getSavedVocabulary();
  const updated = current.filter((w) => w.id !== id);
  saveVocabularyList(updated);
}

// Read text from clipboard with browser permission check
export async function readClipboardTextSafe(): Promise<{ success: boolean; text: string; error?: string }> {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      return { success: false, text: '', error: '瀏覽器不支援直接讀取剪貼簿，請使用手動貼上。' };
    }
    const text = await navigator.clipboard.readText();
    return { success: true, text: text ? text.trim() : '' };
  } catch (err: any) {
    return {
      success: false,
      text: '',
      error: '需要剪貼簿授權或當前視窗未聚焦，請直接在文字框按 Ctrl+V / Cmd+V 貼上。',
    };
  }
}
