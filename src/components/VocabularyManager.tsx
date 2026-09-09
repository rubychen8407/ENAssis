import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Volume2,
  Trash2,
  CheckCircle2,
  Sparkles,
  ClipboardPaste,
  Search,
  RefreshCw,
  Award,
  Clock,
  AlertCircle,
  Upload,
  Link,
  FileText,
  GraduationCap,
  Brain,
  Layers3,
  Pencil,
  Mic,
  Headphones,
  X,
  Send,
} from 'lucide-react';
import { VocabWord, SkillTab } from '../types';
import { speakText } from '../utils/speech';
import {
  addWordToVocabulary,
  deleteWord,
  readClipboardTextSafe,
  isWordAddedWithin24Hours,
} from '../utils/storage';
import { VocabMasteryCheckModal } from './VocabMasteryCheckModal';
import { toTraditionalChinese } from '../utils/chineseConverter';
import { VocabAIQuiz } from './VocabAIQuiz';

interface Props {
  words: VocabWord[];
  onWordsChange: () => void;
  onSelectWordForPractice: (word: VocabWord, targetTab: SkillTab) => void;
}

type FilterLevel = 'all' | 'new' | 'learning' | 'mastered' | 'review';
type StudyMode = 'study' | 'exam';
type ImportSource = 'clipboard' | 'file' | 'website';
type PracticeType = 'sentence' | 'speaking' | 'listening';

interface SentencePracticeData {
  originalSentence?: string;
  isCorrect?: boolean;
  score?: number;
  grammarExplanation?: string;
  correctedSentence?: string;
  nativeAlternatives?: string[];
  collocationTips?: string[];
  spokenDeliveryTip?: string;
  error?: string;
}

interface SpeakingPracticeData {
  reply?: string;
  translationZh?: string;
  coaching?: { nativeAlternative?: string; grammarRuleZh?: string };
  suggestedFollowUps?: string[];
  error?: string;
}

interface ListeningPracticeData {
  title?: string;
  audioScript?: string;
  sentences?: { en: string; zh: string }[];
  error?: string;
}

const formatAddedTimeAgo = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return '';
  const diffHours = Math.floor(diffMs / (3600 * 1000));
  if (diffHours < 1) return `${Math.max(1, Math.floor(diffMs / (60 * 1000)))}分鐘前`;
  if (diffHours < 24) return `${diffHours}小時前`;
  return `${Math.floor(diffHours / 24)}天前`;
};

export const VocabularyManager: React.FC<Props> = ({
  words,
  onWordsChange,
  onSelectWordForPractice,
}) => {
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [studyMode, setStudyMode] = useState<StudyMode>(() => {
    if (typeof window === 'undefined') return 'study';
    return localStorage.getItem('linguacraft-vocab-mode') === 'exam' ? 'exam' : 'study';
  });
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSource, setImportSource] = useState<ImportSource>('clipboard');
  const [importText, setImportText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedTestWord, setSelectedTestWord] = useState<VocabWord | null>(null);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Inline AI practice panel (造句 / 口說 / 聽力) — generated fresh each time, no tab navigation
  const [openPractice, setOpenPractice] = useState<{ wordId: string; type: PracticeType } | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceData, setPracticeData] = useState<SentencePracticeData | SpeakingPracticeData | ListeningPracticeData | null>(null);
  const [practiceUserSentence, setPracticeUserSentence] = useState('');

  // Example sentence regenerated fresh by AI, per word (session-only, not persisted over the saved example)
  const [exampleOverrides, setExampleOverrides] = useState<Record<string, { en: string; zh: string; loading: boolean }>>({});

  const loadPractice = async (word: VocabWord, type: PracticeType, userSentence?: string) => {
    setPracticeLoading(true);
    try {
      if (type === 'sentence') {
        const res = await fetch('/api/gemini/build-sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetWords: [word.word], userSentence: userSentence || '', stage: 'word-to-sentence' }),
        });
        if (!res.ok) throw new Error('生成失敗');
        setPracticeData(await res.json());
      } else if (type === 'speaking') {
        const res = await fetch('/api/gemini/voice-dialogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: 'vocabulary-practice',
            scenarioDetails: `練習使用單字 "${word.word}" 進行簡短口說對話`,
            history: [],
            userMessage: '',
            targetVocabWords: [word.word],
          }),
        });
        if (!res.ok) throw new Error('生成失敗');
        setPracticeData(await res.json());
      } else if (type === 'listening') {
        const res = await fetch('/api/gemini/generate-listening', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: `使用單字 "${word.word}" 的情境`, level: 'B1', vocabWords: [word.word] }),
        });
        if (!res.ok) throw new Error('生成失敗');
        setPracticeData(await res.json());
      }
    } catch {
      setPracticeData({ error: '生成失敗，請稍後再試一次。' });
    } finally {
      setPracticeLoading(false);
    }
  };

  const togglePractice = (word: VocabWord, type: PracticeType) => {
    if (openPractice?.wordId === word.id && openPractice.type === type) {
      setOpenPractice(null);
      return;
    }
    setOpenPractice({ wordId: word.id, type });
    setPracticeData(null);
    setPracticeUserSentence('');
    loadPractice(word, type);
  };

  const regenerateExample = async (word: VocabWord) => {
    setExampleOverrides((prev) => ({ ...prev, [word.id]: { en: prev[word.id]?.en || '', zh: prev[word.id]?.zh || '', loading: true } }));
    try {
      const res = await fetch('/api/gemini/quick-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.word }),
      });
      if (!res.ok) throw new Error('生成失敗');
      const data = await res.json();
      setExampleOverrides((prev) => ({
        ...prev,
        [word.id]: {
          en: data.exampleEn || word.exampleEn,
          zh: toTraditionalChinese(data.exampleZh || word.exampleZh),
          loading: false,
        },
      }));
    } catch {
      setExampleOverrides((prev) => ({ ...prev, [word.id]: { en: prev[word.id]?.en || word.exampleEn, zh: prev[word.id]?.zh || word.exampleZh, loading: false } }));
    }
  };

  const setMode = (mode: StudyMode) => {
    setStudyMode(mode);
    localStorage.setItem('linguacraft-vocab-mode', mode);
  };

  const openImport = (source: ImportSource = 'clipboard') => {
    setAnalysisError(null);
    setImportSource(source);
    setIsImportModalOpen(true);
  };

  const readClipboardIntoImport = async () => {
    setAnalysisError(null);
    const result = await readClipboardTextSafe();
    if (result.success && result.text) {
      setImportText(result.text.slice(0, 120000));
    } else if (result.error) {
      setAnalysisError(result.error);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAnalysisError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '').trim();
      if (!text) {
        setAnalysisError('檔案沒有可讀取的文字內容。');
        return;
      }
      setImportText(text.slice(0, 120000));
      setImportSource('file');
      setIsImportModalOpen(true);
    };
    reader.onerror = () => setAnalysisError('讀取檔案失敗，請確認檔案格式。');
    reader.readAsText(file);
    event.target.value = '';
  };

  const fetchWebsiteText = async () => {
    const normalizedUrl = sourceUrl.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      setAnalysisError('請輸入完整網址，例如 https://example.com/article');
      return;
    }
    setIsFetchingUrl(true);
    setAnalysisError(null);
    try {
      const response = await fetch(`https://r.jina.ai/${normalizedUrl}`);
      if (!response.ok) throw new Error(`網站讀取失敗（${response.status}）`);
      const text = (await response.text()).trim();
      if (!text) throw new Error('網站沒有可擷取的文字內容。');
      setImportText(text.slice(0, 120000));
    } catch (error: any) {
      setAnalysisError(error?.message || '無法取得網站文字，請直接複製文章內容再匯入。');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleBatchAnalyze = async () => {
    if (!importText.trim()) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/gemini/analyze-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: importText.trim(), count: 12 }),
      });
      if (!res.ok) throw new Error('AI 生字分析失敗');
      const data = await res.json();
      if (!Array.isArray(data.words) || data.words.length === 0) {
        throw new Error('找不到適合匯入的單字，請貼上英文文章、單字清單或片語。');
      }
      data.words.forEach((item: any) => {
        addWordToVocabulary({
          word: item.word,
          phonetic: item.phonetic || '',
          partOfSpeech: item.partOfSpeech || 'n.',
          translation: toTraditionalChinese(item.translation || ''),
          definitionEn: item.definitionEn || '',
          collocations: (item.collocations || []).map(toTraditionalChinese),
          exampleEn: item.exampleEn || '',
          exampleZh: toTraditionalChinese(item.exampleZh || ''),
          grammarNotes: toTraditionalChinese(item.grammarNotes || ''),
          masteryLevel: 'new',
          tags: ['AI-Import'],
        });
      });
      onWordsChange();
      setImportText('');
      setSourceUrl('');
      setIsImportModalOpen(false);
    } catch (error: any) {
      setAnalysisError(error?.message || 'AI 分析發生錯誤');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const newWordsCount = words.filter((w) => w.masteryLevel === 'new' || isWordAddedWithin24Hours(w)).length;
  const learningWordsCount = words.filter((w) => w.masteryLevel === 'learning').length;
  const masteredWordsCount = words.filter((w) => w.masteryLevel === 'mastered').length;
  const reviewWordsCount = words.filter((w) => w.examStatus === 'review').length;

  const filteredWords = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return words.filter((w) => {
      const matchesSearch =
        w.word.toLowerCase().includes(query) ||
        w.translation.toLowerCase().includes(query) ||
        w.definitionEn.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (filterLevel === 'new') return w.masteryLevel === 'new' || isWordAddedWithin24Hours(w);
      if (filterLevel === 'learning') return w.masteryLevel === 'learning';
      if (filterLevel === 'mastered') return w.masteryLevel === 'mastered';
      if (filterLevel === 'review') return w.examStatus === 'review';
      return true;
    });
  }, [filterLevel, searchTerm, words]);

  return (
    <div className="flex gap-3">
    <aside className={`hidden md:flex fixed left-3 top-28 z-30 flex-col items-center gap-0.5 rounded-2xl bg-stone-900/90 backdrop-blur border border-stone-800/60 shadow-xl ring-1 ring-white/5 py-2 h-fit transition-all duration-300 ${railCollapsed ? 'w-10' : 'w-14'}`}>
      {/* Toggle collapse/expand */}
      <button
        onClick={() => setRailCollapsed((v) => !v)}
        className="w-full flex items-center justify-center h-8 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-white/[0.06] transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
        title={railCollapsed ? '展開導覽' : '收起導覽'}
        aria-label={railCollapsed ? '展開導覽' : '收起導覽'}
      >
        <span className="text-[10px] font-bold leading-none">{railCollapsed ? '>' : '≡'}</span>
      </button>

      <div className="w-3 h-px bg-white/10 my-0.5" />
      {/* M3 Collapsed Rail — narrow width, icon-only with optional tiny label/badge */}
      <div className="relative w-full flex flex-col items-center">
        <button
          onClick={() => setMode('study')}
          className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 active:scale-95 ${studyMode === 'study' ? 'text-stone-950' : 'text-stone-500 hover:text-stone-300 hover:bg-white/[0.06]'}`}
          title="字卡 Study Mode"
          aria-label="字卡"
        >
          {studyMode === 'study' && (
            <span className="absolute inset-0.5 rounded-lg bg-amber-400 z-0" />
          )}
          <span className="relative z-10"><Layers3 className="w-4.5 h-4.5" /></span>
        </button>
      </div>

      <div className="relative w-full flex flex-col items-center">
        <button
          onClick={() => setMode('exam')}
          className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 active:scale-95 ${studyMode === 'exam' ? 'text-stone-950' : 'text-stone-500 hover:text-stone-300 hover:bg-white/[0.06]'}`}
          title="考題 Exam Mode"
          aria-label="考題"
        >
          {studyMode === 'exam' && (
            <span className="absolute inset-0.5 rounded-lg bg-amber-400 z-0" />
          )}
          <span className="relative z-10"><Brain className="w-4.5 h-4.5" /></span>
          {newWordsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-stone-900 z-20" aria-label={`${newWordsCount} 個新收錄`} />
          )}
        </button>
      </div>

      <div className="w-4 h-px bg-white/10 my-0.5" />

      <div className="relative w-full flex flex-col items-center">
        <button
          type="button"
          onClick={() => openImport('clipboard')}
          className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 active:scale-95 ${isImportModalOpen ? 'text-stone-950' : 'text-stone-500 hover:text-stone-300 hover:bg-white/[0.06]'}`}
          title="匯入單字"
          aria-label="匯入單字"
        >
          {isImportModalOpen && (
            <span className="absolute inset-0.5 rounded-lg bg-amber-400 z-0" />
          )}
          <span className="relative z-10"><Upload className="w-4 h-4" /></span>
        </button>
      </div>
    </aside>

    {/* Mobile Bottom Navigation — M3 NavigationBar, shown only below md (responsive behavior per spec) */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur border-t border-stone-800/60 shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-around h-14 px-2">
        <button onClick={() => setMode('study')} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition cursor-pointer ${studyMode === 'study' ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'}`} aria-label="字卡">
          <Layers3 className="w-5 h-5" />
          <span className="text-[9px] font-semibold mt-0.5">字卡</span>
          {studyMode === 'study' && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />}
        </button>
        <button onClick={() => setMode('exam')} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition cursor-pointer ${studyMode === 'exam' ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'}`} aria-label="考題">
          <Brain className="w-5 h-5" />
          <span className="text-[9px] font-semibold mt-0.5">考題</span>
          {studyMode === 'exam' && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />}
        </button>
        <button type="button" onClick={() => openImport('clipboard')} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition cursor-pointer ${isImportModalOpen ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'}`} aria-label="匯入單字">
          <Upload className="w-5 h-5" />
          <span className="text-[9px] font-semibold mt-0.5">匯入</span>
          {isImportModalOpen && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />}
        </button>
      </div>
    </nav>
    <div className="space-y-6 pb-24">

      {studyMode === 'exam' ? (
        <VocabAIQuiz words={words} onWordsChange={onWordsChange} />
      ) : (
        <>
          {/* Search / filter */}
          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋單字、中文釋義或英文定義..." className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden" />
              </div>
              <div className="flex gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto">
                {[
                  { id: 'all', label: '全部', count: words.length },
                  { id: 'new', label: '新收錄', count: newWordsCount },
                  { id: 'learning', label: '學習中', count: learningWordsCount },
                  { id: 'mastered', label: '已掌握', count: masteredWordsCount },
                  { id: 'review', label: '需再學習', count: reviewWordsCount },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setFilterLevel(tab.id as FilterLevel)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${filterLevel === tab.id ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}>
                    {tab.label} <span className="ml-1 opacity-70">{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {analysisError && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-center justify-between">
              <span>{analysisError}</span>
              <button onClick={() => setAnalysisError(null)} className="text-xs font-bold cursor-pointer">關閉</button>
            </div>
          )}

          {/* Word cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredWords.map((word) => {
              const examAccuracy = word.examAccuracy ?? 0;
              const examAttempts = word.examAttempts ?? 0;
              return (
                <article key={word.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold text-stone-900 tracking-tight">{word.word}</h3>
                          <button onClick={() => speakText(word.word)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer" title="發音"><Volume2 className="w-4 h-4" /></button>
                          {word.tags?.some((tag) => tag.includes('IELTS') || tag.includes('雅思')) && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-bold inline-flex items-center gap-1"><GraduationCap className="w-3 h-3" /> IELTS</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                          <span>{word.phonetic}</span><span>•</span><span className="italic">{word.partOfSpeech}</span>
                        </div>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border shrink-0 ${word.masteryLevel === 'mastered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : word.masteryLevel === 'new' || isWordAddedWithin24Hours(word) ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                        {word.masteryLevel === 'mastered' ? '已掌握' : word.masteryLevel === 'new' || isWordAddedWithin24Hours(word) ? `新收錄${word.dateAdded ? ` · ${formatAddedTimeAgo(word.dateAdded)}` : ''}` : '學習中'}
                      </span>
                    </div>

                    <div className="mt-3 rounded-xl border border-stone-200 bg-stone-100 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-stone-900">{word.translation}</span>
                        {examAttempts > 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${word.examStatus === 'learned' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>{word.examStatus === 'learned' ? `已學習 ${examAccuracy}%` : `需複習 ${examAccuracy}%`}</span>}
                      </div>
                      {word.definitionEn && <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">{word.definitionEn}</p>}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className={`rounded-xl border px-3 py-2 ${word.speakingPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-stone-100 border-stone-200 text-stone-600'}`}>
                        🗣️ 說：{word.speakingPassed ? '通過 ✓' : '待測'}
                      </div>
                      <div className={`rounded-xl border px-3 py-2 ${word.writingPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-stone-100 border-stone-200 text-stone-600'}`}>
                        ✍️ 寫：{word.writingPassed ? '通過 ✓' : '待測'}
                      </div>
                    </div>

                    {word.collocations?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">搭配字詞</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {word.collocations.slice(0, 4).map((item, index) => <span key={index} className="text-xs px-2 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-700">{item}</span>)}
                        </div>
                      </div>
                    )}

                    {(() => {
                      const override = exampleOverrides[word.id];
                      const shownEn = override?.en || word.exampleEn;
                      const shownZh = override?.zh || word.exampleZh;
                      if (!shownEn && !override?.loading) return null;
                      return (
                        <div className="mt-3 rounded-xl bg-stone-100 border border-stone-200 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-stone-800 font-medium leading-relaxed">{override?.loading ? 'AI 生成新例句中…' : shownEn}</p>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => regenerateExample(word)} disabled={override?.loading} className="text-stone-400 hover:text-stone-700 cursor-pointer disabled:opacity-40" title="AI 重新生成例句">
                                <RefreshCw className={`w-3.5 h-3.5 ${override?.loading ? 'animate-spin' : ''}`} />
                              </button>
                              <button onClick={() => speakText(shownEn)} className="text-stone-400 hover:text-stone-700 cursor-pointer" title="朗讀例句"><Volume2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          {shownZh && !override?.loading && <p className="mt-1 text-xs text-stone-500">{shownZh}</p>}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-1">
                        <button onClick={() => togglePractice(word, 'sentence')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${openPractice?.wordId === word.id && openPractice.type === 'sentence' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}`}>造句</button>
                        <button onClick={() => togglePractice(word, 'speaking')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${openPractice?.wordId === word.id && openPractice.type === 'speaking' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}`}>口說</button>
                        <button onClick={() => togglePractice(word, 'listening')} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${openPractice?.wordId === word.id && openPractice.type === 'listening' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}`}>聽力</button>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setSelectedTestWord(word); setIsCheckModalOpen(true); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 cursor-pointer"><Award className="w-3.5 h-3.5 text-amber-400" />檢測</button>
                        <button onClick={() => { deleteWord(word.id); onWordsChange(); }} className="p-1.5 rounded-lg text-stone-300 hover:text-rose-500 hover:bg-rose-50 cursor-pointer" title="刪除"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {openPractice?.wordId === word.id && (
                      <div className="mt-3 rounded-xl border border-stone-200 bg-stone-100 p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700">
                            {openPractice.type === 'sentence' && <><Pencil className="w-3.5 h-3.5" />AI 造句練習</>}
                            {openPractice.type === 'speaking' && <><Mic className="w-3.5 h-3.5" />AI 口說練習</>}
                            {openPractice.type === 'listening' && <><Headphones className="w-3.5 h-3.5" />AI 聽力練習</>}
                          </span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => loadPractice(word, openPractice.type)} disabled={practiceLoading} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 cursor-pointer disabled:opacity-40" title="換一個">
                              <RefreshCw className={`w-3.5 h-3.5 ${practiceLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={() => setOpenPractice(null)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 cursor-pointer" title="關閉">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {practiceLoading && !practiceData && (
                          <p className="text-xs text-stone-500">AI 生成中…</p>
                        )}

                        {practiceData?.error && (
                          <p className="text-xs text-rose-600">{practiceData.error}</p>
                        )}

                        {!practiceData?.error && openPractice.type === 'sentence' && practiceData && (
                          <div className="space-y-2 text-xs">
                            {(practiceData as SentencePracticeData).grammarExplanation && (
                              <p className="text-stone-700 leading-relaxed">{(practiceData as SentencePracticeData).grammarExplanation}</p>
                            )}
                            {(practiceData as SentencePracticeData).nativeAlternatives?.map((s, i) => (
                              <p key={i} className="rounded-lg bg-white border border-stone-200 px-2.5 py-1.5 text-stone-800">{s}</p>
                            ))}
                            <form
                              onSubmit={(e) => { e.preventDefault(); if (practiceUserSentence.trim()) loadPractice(word, 'sentence', practiceUserSentence.trim()); }}
                              className="flex gap-1.5 pt-1"
                            >
                              <input
                                value={practiceUserSentence}
                                onChange={(e) => setPracticeUserSentence(e.target.value)}
                                placeholder={`用 "${word.word}" 造一個句子...`}
                                className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 outline-none"
                              />
                              <button type="submit" disabled={practiceLoading || !practiceUserSentence.trim()} className="px-2.5 py-1.5 rounded-lg bg-stone-900 text-white disabled:opacity-40 cursor-pointer"><Send className="w-3.5 h-3.5" /></button>
                            </form>
                            {!!(practiceData as SentencePracticeData).originalSentence && (
                              <p className="text-stone-600">評分：{(practiceData as SentencePracticeData).score} 分 · 建議：{(practiceData as SentencePracticeData).correctedSentence}</p>
                            )}
                          </div>
                        )}

                        {!practiceData?.error && openPractice.type === 'speaking' && practiceData && (
                          <div className="space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-2 rounded-lg bg-white border border-stone-200 px-2.5 py-1.5">
                              <p className="text-stone-800">{(practiceData as SpeakingPracticeData).reply}</p>
                              <button onClick={() => speakText((practiceData as SpeakingPracticeData).reply || '')} className="text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"><Volume2 className="w-3.5 h-3.5" /></button>
                            </div>
                            {(practiceData as SpeakingPracticeData).translationZh && <p className="text-stone-500">{(practiceData as SpeakingPracticeData).translationZh}</p>}
                            {(practiceData as SpeakingPracticeData).suggestedFollowUps?.map((s, i) => (
                              <p key={i} className="rounded-lg bg-white border border-stone-200 px-2.5 py-1.5 text-stone-700">💬 {s}</p>
                            ))}
                          </div>
                        )}

                        {!practiceData?.error && openPractice.type === 'listening' && practiceData && (
                          <div className="space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-2 rounded-lg bg-white border border-stone-200 px-2.5 py-1.5">
                              <p className="text-stone-800 leading-relaxed">{(practiceData as ListeningPracticeData).audioScript}</p>
                              <button onClick={() => speakText((practiceData as ListeningPracticeData).audioScript || '')} className="text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"><Volume2 className="w-3.5 h-3.5" /></button>
                            </div>
                            {(practiceData as ListeningPracticeData).sentences?.slice(0, 3).map((s, i) => (
                              <p key={i} className="text-stone-500">{s.zh}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {filteredWords.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-200">
                <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-700">目前沒有符合條件的單字</p>
                <p className="text-xs text-stone-500 mt-1">使用「匯入」或上方快速新增功能建立你的第一批單字。</p>
              </div>
            )}
          </div>

          {/* Import modal */}
          {isImportModalOpen && (
            <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-stone-200 bg-white shadow-2xl p-6 space-y-5 dark:bg-stone-900 dark:border-stone-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2"><Upload className="w-5 h-5 text-emerald-500" /><h3 className="text-lg font-bold text-stone-900">匯入單字</h3></div>
                    <p className="mt-1 text-xs text-stone-600">選擇來源 → 轉成文字 → AI 擷取適合學習的單字。</p>
                  </div>
                  <button onClick={() => setIsImportModalOpen(false)} className="text-stone-400 hover:text-stone-900 text-sm font-semibold cursor-pointer">關閉</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'clipboard', label: '剪貼簿', icon: ClipboardPaste, desc: '貼上文章、單字或片語' },
                    { id: 'file', label: '檔案', icon: FileText, desc: 'TXT / MD / CSV / HTML' },
                    { id: 'website', label: '網站', icon: Link, desc: '公開網址轉成文字' },
                  ].map((source) => {
                    const Icon = source.icon;
                    return <button key={source.id} type="button" onClick={() => setImportSource(source.id as ImportSource)} className={`rounded-2xl border p-3 text-left transition cursor-pointer ${importSource === source.id ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}>
                      <Icon className="w-5 h-5 text-stone-800 mb-2" />
                      <div className="text-sm font-bold text-stone-900">{source.label}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">{source.desc}</div>
                    </button>;
                  })}
                </div>

                {importSource === 'clipboard' && (
                  <div className="space-y-3">
                    <button type="button" onClick={readClipboardIntoImport} className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 cursor-pointer"><ClipboardPaste className="w-4 h-4" />讀取剪貼簿</button>
                    <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={7} placeholder="也可以直接貼上英文單字清單或文章..." className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-200" />
                  </div>
                )}

                {importSource === 'file' && (
                  <div className="space-y-3">
                    <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json,.html,.htm" onChange={handleFileImport} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 cursor-pointer"><FileText className="w-4 h-4" />選擇檔案</button>
                    <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={7} placeholder="選擇檔案後會在這裡預覽文字..." className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-200" />
                  </div>
                )}

                {importSource === 'website' && (
                  <div className="space-y-3">
                    <div className="flex gap-2"><input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://example.com/article" className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none" /><button type="button" onClick={fetchWebsiteText} disabled={isFetchingUrl} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer">{isFetchingUrl ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}抓取文字</button></div>
                    <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={7} placeholder="抓取成功後會顯示轉換後的文章文字..." className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-200" />
                  </div>
                )}

                {analysisError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{analysisError}</div>}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-stone-500">內容會先轉成文字，再交給 AI 選出高價值生字。</span>
                  <button type="button" disabled={isAnalyzing || !importText.trim()} onClick={handleBatchAnalyze} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 cursor-pointer">
                    {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI 分析並匯入
                  </button>
                </div>
              </div>
            </div>
          )}

          <VocabMasteryCheckModal
            word={selectedTestWord}
            isOpen={isCheckModalOpen}
            onClose={() => { setIsCheckModalOpen(false); setSelectedTestWord(null); }}
            onWordsChange={onWordsChange}
          />
        </>
      )}
    </div>
    </div>
  );
};
