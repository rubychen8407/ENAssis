import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Volume2,
  Plus,
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
  const [singleWordInput, setSingleWordInput] = useState('');
  const [isSingleLoading, setIsSingleLoading] = useState(false);
  const [selectedTestWord, setSelectedTestWord] = useState<VocabWord | null>(null);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleAddSingleWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = singleWordInput.trim();
    if (!raw) return;
    setIsSingleLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/gemini/quick-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: raw }),
      });
      if (!res.ok) throw new Error('單字查詢失敗，請確認網路或 API 設置');
      const data = await res.json();
      addWordToVocabulary({
        word: data.word || raw,
        phonetic: data.phonetic || '',
        partOfSpeech: data.partOfSpeech || 'n.',
        translation: toTraditionalChinese(data.translation || '查詢結果'),
        definitionEn: data.definitionEn || '',
        collocations: (data.collocations || []).map(toTraditionalChinese),
        exampleEn: data.exampleEn || `Using ${raw} in everyday communication.`,
        exampleZh: toTraditionalChinese(data.exampleZh || ''),
        grammarNotes: toTraditionalChinese(data.grammarNotes || ''),
        masteryLevel: 'new',
        tags: ['Quick-Add'],
      });
      setSingleWordInput('');
      onWordsChange();
    } catch (error: any) {
      setAnalysisError(error?.message || '查詢失敗');
    } finally {
      setIsSingleLoading(false);
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
    <div className="space-y-6">
      {/* Header + mode switch */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-stone-900">生字庫</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 border border-stone-200">共 {words.length} 個</span>
              {reviewWordsCount > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">待複習 {reviewWordsCount}</span>}
            </div>
            <p className="mt-1 text-sm text-stone-600">Study Mode 用字卡理解；Exam Mode 用多題型主動回想，並依正確率自動判斷「已學習 / 需要再學習」。</p>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-100 border border-stone-200 shadow-xs">
            <button
              type="button"
              onClick={() => setMode('study')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${studyMode === 'study' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
            >
              <Layers3 className="w-4 h-4" />
              Study Mode
              <span className="text-[10px] opacity-70">字卡</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('exam')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${studyMode === 'exam' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
            >
              <Brain className="w-4 h-4" />
              Exam Mode
              <span className="text-[10px] opacity-70">考題</span>
            </button>
          </div>
        </div>
      </section>

      {studyMode === 'exam' ? (
        <VocabAIQuiz words={words} onWordsChange={onWordsChange} />
      ) : (
        <>
          {/* Import + quick add */}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-stone-900">新增 / 匯入單字</h3>
                <p className="text-xs text-stone-600 mt-1">一個「匯入」按鈕統一處理剪貼簿、檔案與網站文字。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openImport('clipboard')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 cursor-pointer shadow-xs">
                  <Upload className="w-4 h-4" /> 匯入
                </button>
              </div>
            </div>

            <form onSubmit={handleAddSingleWord} className="mt-4 flex gap-2">
              <input value={singleWordInput} onChange={(e) => setSingleWordInput(e.target.value)} placeholder="快速新增單字，例如 articulate" className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-200" />
              <button type="submit" disabled={isSingleLoading || !singleWordInput.trim()} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-semibold hover:bg-stone-900 disabled:opacity-40 cursor-pointer">
                {isSingleLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                查詢加入
              </button>
            </form>
          </section>

          {/* Adaptive mastery summary */}
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-xs">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-xl bg-amber-200 text-amber-950 shrink-0 dark:bg-amber-900 dark:text-amber-100"><Sparkles className="w-4 h-4" /></span>
                <div>
                  <p className="font-bold text-amber-950">生字掌握度反饋機制</p>
                  <p className="mt-0.5 text-xs text-amber-900 leading-relaxed">說、寫與 Exam Mode 的表現會持續累積。Exam 正確率達 80% 且至少考過 2 次 → <strong className="text-emerald-800">已學習</strong>；否則 → <strong className="text-rose-800">需要再學習</strong>。</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-center"><div className="text-[11px] font-semibold text-sky-800">新收錄</div><div className="text-lg font-bold text-sky-950">{newWordsCount}</div></div>
                <div className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-center"><div className="text-[11px] font-semibold text-amber-800">學習中</div><div className="text-lg font-bold text-amber-950">{learningWordsCount}</div></div>
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-center"><div className="text-[11px] font-semibold text-emerald-800">已掌握</div><div className="text-lg font-bold text-emerald-950">{masteredWordsCount}</div></div>
                <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-center"><div className="text-[11px] font-semibold text-rose-800">需再學習</div><div className="text-lg font-bold text-rose-950">{reviewWordsCount}</div></div>
              </div>
            </div>
          </section>

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

                    <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-stone-900">{word.translation}</span>
                        {examAttempts > 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${word.examStatus === 'learned' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>{word.examStatus === 'learned' ? `已學習 ${examAccuracy}%` : `需複習 ${examAccuracy}%`}</span>}
                      </div>
                      {word.definitionEn && <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">{word.definitionEn}</p>}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className={`rounded-xl border px-3 py-2 ${word.speakingPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>
                        🗣️ 說：{word.speakingPassed ? '通過 ✓' : '待測'}
                      </div>
                      <div className={`rounded-xl border px-3 py-2 ${word.writingPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>
                        ✍️ 寫：{word.writingPassed ? '通過 ✓' : '待測'}
                      </div>
                    </div>

                    {word.collocations?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">搭配字詞</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {word.collocations.slice(0, 4).map((item, index) => <span key={index} className="text-xs px-2 py-1 rounded-md bg-stone-50 border border-stone-200 text-stone-700">{item}</span>)}
                        </div>
                      </div>
                    )}

                    {word.exampleEn && (
                      <div className="mt-3 rounded-xl bg-stone-50 border border-stone-100 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-stone-800 font-medium leading-relaxed">{word.exampleEn}</p>
                          <button onClick={() => speakText(word.exampleEn)} className="text-stone-400 hover:text-stone-700 cursor-pointer" title="朗讀例句"><Volume2 className="w-3.5 h-3.5" /></button>
                        </div>
                        {word.exampleZh && <p className="mt-1 text-xs text-stone-500">{word.exampleZh}</p>}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      <button onClick={() => onSelectWordForPractice(word, 'writing')} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 cursor-pointer">造句</button>
                      <button onClick={() => onSelectWordForPractice(word, 'speaking')} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 cursor-pointer">口說</button>
                      <button onClick={() => onSelectWordForPractice(word, 'listening')} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 cursor-pointer">聽力</button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedTestWord(word); setIsCheckModalOpen(true); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 cursor-pointer"><Award className="w-3.5 h-3.5 text-amber-400" />檢測</button>
                      <button onClick={() => { deleteWord(word.id); onWordsChange(); }} className="p-1.5 rounded-lg text-stone-300 hover:text-rose-500 hover:bg-rose-50 cursor-pointer" title="刪除"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
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
  );
};
