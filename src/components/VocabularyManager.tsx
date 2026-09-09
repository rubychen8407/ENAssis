import React, { useState } from 'react';
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
  GraduationCap,
  Upload,
  Link,
  FileText,
} from 'lucide-react';
import { VocabWord, SkillTab } from '../types';
import { speakText } from '../utils/speech';
import {
  addWordToVocabulary,
  deleteWord,
  readClipboardTextSafe,
  isWordAddedWithin24Hours,
  recordWordPracticeResult,
} from '../utils/storage';
import { VocabMasteryCheckModal } from './VocabMasteryCheckModal';
import { toTraditionalChinese } from '../utils/chineseConverter';
import { VocabAIQuiz } from './VocabAIQuiz';

interface Props {
  words: VocabWord[];
  onWordsChange: () => void;
  onSelectWordForPractice: (word: VocabWord, targetTab: SkillTab) => void;
}

type FilterLevel = 'all' | 'new' | 'learning' | 'mastered' | 'ielts';
type ImportMode = 'text' | 'file' | 'url';

export const VocabularyManager: React.FC<Props> = ({
  words,
  onWordsChange,
  onSelectWordForPractice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('text');
  const [importText, setImportText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [singleWordInput, setSingleWordInput] = useState('');
  const [isSingleLoading, setIsSingleLoading] = useState(false);
  const [selectedTestWord, setSelectedTestWord] = useState<VocabWord | null>(null);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);

  const formatAddedTimeAgo = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return '';
    const diffHours = Math.floor(diffMs / (3600 * 1000));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (60 * 1000)));
      return `${diffMins}分鐘前`;
    }
    if (diffHours < 24) return `${diffHours}小時前`;
    return `${Math.floor(diffHours / 24)}天前`;
  };

  const handleReadClipboard = async () => {
    setAnalysisError(null);
    const result = await readClipboardTextSafe();
    setImportMode('text');
    setIsImportModalOpen(true);
    if (result.success && result.text) {
      setImportText(result.text);
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
      setImportMode('text');
      setIsImportModalOpen(true);
    };
    reader.onerror = () => setAnalysisError('讀取檔案失敗，請確認檔案格式。');
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleFetchUrl = async () => {
    const normalizedUrl = sourceUrl.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      setAnalysisError('請輸入完整網址，例如 https://example.com/article');
      return;
    }
    setIsFetchingUrl(true);
    setAnalysisError(null);
    try {
      // Jina Reader converts public web pages into clean text/Markdown for import.
      const response = await fetch(`https://r.jina.ai/${normalizedUrl}`);
      if (!response.ok) throw new Error(`網站讀取失敗（${response.status}）`);
      const text = (await response.text()).trim();
      if (!text) throw new Error('網站沒有可擷取的文字內容。');
      setImportText(text.slice(0, 120000));
      setImportMode('text');
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
  const ieltsWordsCount = words.filter((w) => w.tags?.some((tag) => tag.includes('IELTS') || tag.includes('雅思'))).length;

  const filteredWords = words.filter((w) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      w.word.toLowerCase().includes(query) ||
      w.translation.toLowerCase().includes(query) ||
      w.definitionEn.toLowerCase().includes(query);
    let matchesLevel = true;
    if (filterLevel === 'new') matchesLevel = w.masteryLevel === 'new' || isWordAddedWithin24Hours(w);
    if (filterLevel === 'learning') matchesLevel = w.masteryLevel === 'learning';
    if (filterLevel === 'mastered') matchesLevel = w.masteryLevel === 'mastered';
    if (filterLevel === 'ielts') matchesLevel = Boolean(w.tags?.some((tag) => tag.includes('IELTS') || tag.includes('雅思')));
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Unified vocabulary header */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-stone-900">生字庫</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 border border-stone-200">共 {words.length} 個</span>
              {ieltsWordsCount > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">雅思 {ieltsWordsCount}</span>}
            </div>
            <p className="mt-1 text-sm text-stone-600">所有自建、文章匯入與雅思單字統一放在同一個生字庫；AI 會依單字反覆出題，幫你從「看過」走到「會用」。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 cursor-pointer shadow-xs">
              <Upload className="w-4 h-4" />
              從檔案匯入
              <input type="file" accept=".txt,.md,.csv,.json,.html,.htm" onChange={handleFileImport} className="hidden" />
            </label>
            <button type="button" onClick={handleReadClipboard} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 text-stone-800 border border-stone-200 text-sm font-semibold hover:bg-stone-200 cursor-pointer">
              <ClipboardPaste className="w-4 h-4" />
              剪貼簿 / 文字
            </button>
            <button type="button" onClick={() => { setImportMode('url'); setAnalysisError(null); setIsImportModalOpen(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 text-stone-800 border border-stone-200 text-sm font-semibold hover:bg-stone-200 cursor-pointer">
              <Link className="w-4 h-4" />
              網站轉文字
            </button>
          </div>
        </div>
      </div>

      {/* Mastery feedback: high-contrast in dark mode via explicit dark palette classes */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-xs dark:bg-amber-950/70 dark:border-amber-700">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-amber-200 text-amber-950 shrink-0 dark:bg-amber-900 dark:text-amber-100"><Sparkles className="w-4 h-4" /></span>
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-100">生字掌握度反饋機制</p>
              <p className="mt-0.5 text-xs text-amber-900 dark:text-amber-100/90 leading-relaxed">「說」＋「寫」雙重考核通過 → <strong className="text-emerald-800 dark:text-emerald-300">已掌握</strong>；尚未完成 → <strong className="text-amber-800 dark:text-amber-300">學習中</strong>；24 小時內加入 → <strong className="text-sky-800 dark:text-sky-300">新收錄</strong>。</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-0">
            <div className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-center dark:bg-sky-950/80 dark:border-sky-700"><div className="text-[11px] font-semibold text-sky-800 dark:text-sky-200">新收錄</div><div className="text-lg font-bold text-sky-950 dark:text-sky-100">{newWordsCount}</div></div>
            <div className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-center dark:bg-stone-900 dark:border-amber-700"><div className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">學習中</div><div className="text-lg font-bold text-amber-950 dark:text-amber-100">{learningWordsCount}</div></div>
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-center dark:bg-emerald-950/80 dark:border-emerald-700"><div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">已掌握</div><div className="text-lg font-bold text-emerald-950 dark:text-emerald-100">{masteredWordsCount}</div></div>
          </div>
        </div>
      </div>

      {/* AI retrieval practice */}
      <VocabAIQuiz words={words} />

      {/* Quick add + search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <form onSubmit={handleAddSingleWord} className="lg:col-span-5 flex gap-2">
          <input id="input-quick-add-word" value={singleWordInput} onChange={(e) => setSingleWordInput(e.target.value)} placeholder="輸入單字快速查詢加入，例如 articulate" className="flex-1 px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400" />
          <button type="submit" disabled={isSingleLoading || !singleWordInput.trim()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-semibold hover:bg-stone-900 disabled:opacity-50 cursor-pointer">
            {isSingleLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 查詢
          </button>
        </form>
        <div className="lg:col-span-7 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input id="input-search-words" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋單字、中文釋義或英文定義…" className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400" />
          </div>
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold overflow-x-auto max-w-full">
            {[
              ['all', '全部', words.length],
              ['new', '新收錄', newWordsCount],
              ['learning', '學習中', learningWordsCount],
              ['mastered', '已掌握', masteredWordsCount],
              ['ielts', '雅思', ieltsWordsCount],
            ].map(([id, label, count]) => (
              <button key={String(id)} type="button" onClick={() => setFilterLevel(id as FilterLevel)} className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer ${filterLevel === id ? 'bg-white text-stone-950 shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}>
                {label}<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-800">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {analysisError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-sm flex items-center justify-between dark:bg-rose-950/70 dark:border-rose-700 dark:text-rose-100">
          <span>{analysisError}</span>
          <button type="button" onClick={() => setAnalysisError(null)} className="text-xs font-semibold cursor-pointer">關閉</button>
        </div>
      )}

      {/* Vocabulary list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredWords.map((word) => {
          const isIELTS = Boolean(word.tags?.some((tag) => tag.includes('IELTS') || tag.includes('雅思')));
          return (
            <article key={word.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition dark-vocab-card">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-stone-900 tracking-tight break-words">{word.word}</h3>
                      <button type="button" onClick={() => speakText(word.word)} title="發音" className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"><Volume2 className="w-4 h-4" /></button>
                      {isIELTS && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700"><GraduationCap className="w-3 h-3" /> 雅思</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 font-mono"><span>{word.phonetic}</span><span>•</span><span className="italic font-sans">{word.partOfSpeech}</span></div>
                  </div>
                  <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1 ${
                    word.masteryLevel === 'mastered'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-700'
                      : word.masteryLevel === 'new' || isWordAddedWithin24Hours(word)
                      ? 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-700'
                      : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700'
                  }`}>
                    {word.masteryLevel === 'mastered' ? <><CheckCircle2 className="w-3.5 h-3.5" /> 已掌握</> : word.masteryLevel === 'new' || isWordAddedWithin24Hours(word) ? <><Clock className="w-3.5 h-3.5" /> 新收錄</> : <><AlertCircle className="w-3.5 h-3.5" /> 學習中</>}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-xl border border-stone-200 bg-stone-50 dark:bg-stone-900 dark:border-stone-700">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button type="button" onClick={() => { const next = !word.speakingPassed; recordWordPracticeResult(word.id, 'speaking', next); onWordsChange(); }} className={`px-2.5 py-1 rounded-lg border font-semibold cursor-pointer ${word.speakingPassed ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-700' : 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600'}`}>🗣️ 說：{word.speakingPassed ? '通過 ✓' : '待測'}</button>
                    <button type="button" onClick={() => { const next = !word.writingPassed; recordWordPracticeResult(word.id, 'writing', next); onWordsChange(); }} className={`px-2.5 py-1 rounded-lg border font-semibold cursor-pointer ${word.writingPassed ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-700' : 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600'}`}>✍️ 寫：{word.writingPassed ? '通過 ✓' : '待測'}</button>
                    <button type="button" onClick={() => { setSelectedTestWord(word); setIsCheckModalOpen(true); }} className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 cursor-pointer"><Award className="w-3 h-3 text-amber-400" />說寫檢測</button>
                  </div>
                </div>

                <div className="mt-3"><p className="text-sm font-bold text-stone-900">{word.translation}</p>{word.definitionEn && <p className="text-xs text-stone-600 mt-1 leading-relaxed">{word.definitionEn}</p>}</div>

                {word.collocations?.length > 0 && <div className="mt-3 pt-3 border-t border-stone-200"><span className="text-[11px] font-semibold text-stone-500">常用搭配</span><div className="flex flex-wrap gap-1.5 mt-1">{word.collocations.slice(0, 4).map((col, idx) => <span key={idx} className="text-xs px-2 py-0.5 rounded-md bg-stone-50 text-stone-800 border border-stone-200 dark:bg-stone-900 dark:text-stone-200 dark:border-stone-700">{col}</span>)}</div></div>}

                {word.exampleEn && <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs dark:bg-stone-900 dark:border-stone-700"><div className="flex items-start justify-between gap-2"><p className="text-stone-900 font-medium leading-relaxed">{word.exampleEn}</p><button type="button" onClick={() => speakText(word.exampleEn)} className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"><Volume2 className="w-3.5 h-3.5" /></button></div>{word.exampleZh && <p className="text-stone-600 mt-1">{word.exampleZh}</p>}</div>}

                {word.grammarNotes && <p className="mt-2 text-[11px] text-stone-600 leading-snug"><span className="font-semibold text-stone-800">語法：</span>{word.grammarNotes}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => onSelectWordForPractice(word, 'writing')} className="px-2 py-1 rounded-md text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-semibold cursor-pointer">✍️ 造句</button>
                  <button type="button" onClick={() => onSelectWordForPractice(word, 'speaking')} className="px-2 py-1 rounded-md text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-semibold cursor-pointer">🎙️ 口說</button>
                  <button type="button" onClick={() => onSelectWordForPractice(word, 'listening')} className="px-2 py-1 rounded-md text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-semibold cursor-pointer">🎧 聽力</button>
                </div>
                <button type="button" onClick={() => { deleteWord(word.id); onWordsChange(); }} className="text-stone-400 hover:text-rose-600 p-1 rounded-md cursor-pointer" title="刪除單字"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </article>
          );
        })}

        {filteredWords.length === 0 && <div className="col-span-full py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300"><BookOpen className="w-8 h-8 text-stone-400 mx-auto mb-2" /><p className="text-sm font-bold text-stone-800">尚未找到符合條件的單字</p><p className="text-xs text-stone-600 mt-1">從剪貼簿、檔案或網站匯入一篇英文內容，就可以讓 AI 自動整理成生字。</p></div>}
      </div>

      {/* Unified import modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-stone-200 shadow-2xl p-6 space-y-4 dark:bg-stone-900 dark:border-stone-700">
            <div className="flex items-start justify-between gap-4">
              <div><div className="flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500" /><h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">匯入內容 → AI 建立生字</h3></div><p className="text-xs text-stone-600 dark:text-stone-300 mt-1">支援剪貼簿、文字檔，以及公開網站轉文字後匯入。</p></div>
              <button type="button" onClick={() => setIsImportModalOpen(false)} className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer">關閉</button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                ['text', '剪貼簿 / 文字', ClipboardPaste],
                ['file', '檔案', Upload],
                ['url', '網站', Link],
              ].map(([id, label, Icon]) => (
                <button key={String(id)} type="button" onClick={() => setImportMode(id as ImportMode)} className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${importMode === id ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700'}`}><Icon className="w-3.5 h-3.5" />{label}</button>
              ))}
            </div>

            {importMode === 'url' && (
              <div className="space-y-2">
                <div className="flex gap-2"><input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://example.com/article" className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700" /><button type="button" onClick={() => void handleFetchUrl()} disabled={isFetchingUrl || !sourceUrl.trim()} className="px-4 rounded-xl bg-stone-900 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer">{isFetchingUrl ? <RefreshCw className="w-4 h-4 animate-spin" /> : '轉成文字'}</button></div>
                <p className="text-[11px] text-stone-500 dark:text-stone-300">網站必須是公開頁面；系統會先轉成文字，再交給 AI 找出高價值單字。</p>
              </div>
            )}

            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={9} placeholder="在這裡貼上英文單字、文章、字幕或網站轉出的文字…" className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700" />

            {analysisError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs dark:bg-rose-950 dark:text-rose-100 dark:border-rose-700">{analysisError}</div>}

            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setShowImportHelp((value) => !value)} className="text-xs font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white cursor-pointer">{showImportHelp ? '隱藏匯入建議' : '看匯入建議'}</button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={async () => { const result = await readClipboardTextSafe(); if (result.success) { setImportText(result.text); setImportMode('text'); } else if (result.error) setAnalysisError(result.error); }} className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 cursor-pointer"><ClipboardPaste className="w-3.5 h-3.5 inline mr-1" />重新讀取</button>
                <button type="button" onClick={() => void handleBatchAnalyze()} disabled={isAnalyzing || !importText.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">{isAnalyzing ? <><RefreshCw className="w-4 h-4 animate-spin" />AI 分析中…</> : <><Sparkles className="w-4 h-4" />分析並匯入</>}</button>
              </div>
            </div>

            {showImportHelp && <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-xs text-stone-700 space-y-1 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200"><p>• <strong>剪貼簿：</strong>直接貼英文文章、字幕或單字清單。</p><p>• <strong>檔案：</strong>TXT、Markdown、CSV、JSON、HTML 都可先轉為文字。</p><p>• <strong>網站：</strong>貼公開文章網址，系統先轉成文字，再用 AI 擷取高價值單字。</p></div>}
          </div>
        </div>
      )}

      <VocabMasteryCheckModal
        word={selectedTestWord}
        isOpen={isCheckModalOpen}
        onClose={() => setIsCheckModalOpen(false)}
        onWordsChange={onWordsChange}
      />
    </div>
  );
};
