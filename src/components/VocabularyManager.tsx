import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ClipboardPaste,
  Filter,
  Search,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Award,
  Clock,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  BookMarked,
} from 'lucide-react';
import { VocabWord, SkillTab } from '../types';
import { speakText } from '../utils/speech';
import {
  addWordToVocabulary,
  updateWordMastery,
  deleteWord,
  readClipboardTextSafe,
  isWordAddedWithin24Hours,
  recordWordPracticeResult,
} from '../utils/storage';
import { VocabMasteryCheckModal } from './VocabMasteryCheckModal';
import { IELTSVocabExplorer } from './ielts/IELTSVocabExplorer';

interface Props {
  words: VocabWord[];
  onWordsChange: () => void;
  onSelectWordForPractice: (word: VocabWord, targetTab: SkillTab) => void;
}

export const VocabularyManager: React.FC<Props> = ({
  words,
  onWordsChange,
  onSelectWordForPractice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [singleWordInput, setSingleWordInput] = useState('');
  const [isSingleLoading, setIsSingleLoading] = useState(false);
  const [selectedTestWord, setSelectedTestWord] = useState<VocabWord | null>(null);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  // Vocabulary source view: my own notebook vs. the curated IELTS core wordlist
  const [vocabSource, setVocabSource] = useState<'mine' | 'ielts-core'>('mine');

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
    if (diffHours < 24) {
      return `${diffHours}小時前`;
    }
    return `${Math.floor(diffHours / 24)}天前`;
  };

  // Read Clipboard directly
  const handleReadClipboard = async () => {
    const result = await readClipboardTextSafe();
    if (result.success && result.text) {
      setImportText(result.text);
      setIsImportModalOpen(true);
    } else {
      setIsImportModalOpen(true);
      if (result.error) {
        setAnalysisError(result.error);
      }
    }
  };

  // Quick single word add
  const handleAddSingleWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleWordInput.trim()) return;

    setIsSingleLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/gemini/quick-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: singleWordInput.trim() }),
      });

      if (!res.ok) throw new Error('單字查詢失敗，請確認網路或 API 設置');
      const data = await res.json();

      addWordToVocabulary({
        word: data.word || singleWordInput.trim(),
        phonetic: data.phonetic || '',
        partOfSpeech: data.partOfSpeech || 'n.',
        translation: data.translation || '查詢結果',
        definitionEn: data.definitionEn || '',
        collocations: data.collocations || [],
        exampleEn: data.exampleEn || `Using ${singleWordInput.trim()} in everyday communication.`,
        exampleZh: data.exampleZh || '在日常交流中使用該單字。',
        grammarNotes: data.grammarNotes || '一般用法。',
        masteryLevel: 'new',
        tags: ['Quick-Add'],
      });

      setSingleWordInput('');
      onWordsChange();
    } catch (err: any) {
      setAnalysisError(err?.message || '查詢失敗');
    } finally {
      setIsSingleLoading(false);
    }
  };

  // Batch analysis from text
  const handleBatchAnalyze = async () => {
    if (!importText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/gemini/analyze-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: importText.trim(), count: 6 }),
      });

      if (!res.ok) throw new Error('分析生字失敗');
      const data = await res.json();

      if (Array.isArray(data.words) && data.words.length > 0) {
        data.words.forEach((item: any) => {
          addWordToVocabulary({
            word: item.word,
            phonetic: item.phonetic || '',
            partOfSpeech: item.partOfSpeech || 'n.',
            translation: item.translation || '',
            definitionEn: item.definitionEn || '',
            collocations: item.collocations || [],
            exampleEn: item.exampleEn || '',
            exampleZh: item.exampleZh || '',
            grammarNotes: item.grammarNotes || '',
            masteryLevel: 'new',
            tags: ['Batch-Import'],
          });
        });
        onWordsChange();
        setImportText('');
        setIsImportModalOpen(false);
      } else {
        setAnalysisError('未能從文字中分析出明確單字，請嘗試輸入單字清單或更明確的文章段落。');
      }
    } catch (err: any) {
      setAnalysisError(err?.message || 'AI 分析發生錯誤');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const newWordsCount = words.filter((w) => w.masteryLevel === 'new' || isWordAddedWithin24Hours(w)).length;
  const learningWordsCount = words.filter((w) => w.masteryLevel === 'learning').length;
  const masteredWordsCount = words.filter((w) => w.masteryLevel === 'mastered').length;

  const filteredWords = words.filter((w) => {
    const matchesSearch =
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.definitionEn.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesLevel = true;
    if (filterLevel === 'new') {
      matchesLevel = w.masteryLevel === 'new' || isWordAddedWithin24Hours(w);
    } else if (filterLevel === 'learning') {
      matchesLevel = w.masteryLevel === 'learning';
    } else if (filterLevel === 'mastered') {
      matchesLevel = w.masteryLevel === 'mastered';
    }
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Top action banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-lg font-semibold text-stone-900">我的個人生字庫</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
              共 {words.length} 個單字
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1">
            支援一鍵讀取剪貼簿、匯入文章生字，並將單字直接套入聽、說、讀、寫模組練習。
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-read-clipboard"
            onClick={handleReadClipboard}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition shadow-xs cursor-pointer"
          >
            <ClipboardPaste className="w-4 h-4 text-emerald-400" />
            讀取剪貼簿 / 匯入文字
          </button>
        </div>
      </div>

      {/* Vocabulary Source Switch: my notebook vs. curated IELTS core wordlist */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs flex items-center gap-2">
        <button
          id="btn-vocab-source-mine"
          onClick={() => setVocabSource('mine')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
            vocabSource === 'mine'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          我的生字本
        </button>
        <button
          id="btn-vocab-source-ielts"
          onClick={() => setVocabSource('ielts-core')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
            vocabSource === 'ielts-core'
              ? 'bg-amber-500 text-stone-950 shadow-2xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-amber-50/70 border border-amber-200/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          雅思核心字表 (3,610詞)
        </button>
      </div>

      {vocabSource === 'ielts-core' ? (
        <IELTSVocabExplorer onWordAdded={onWordsChange} />
      ) : (
      <>
      {/* Mastery Feedback Rules Banner */}
      <div className="bg-gradient-to-r from-stone-50 via-amber-50/40 to-emerald-50/40 border border-stone-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <span className="font-bold text-stone-900 block sm:inline mr-2">
              生字掌握度反饋機制：
            </span>
            <span className="text-stone-600">
              「說」與「寫」雙重考核通過自動標記為
              <strong className="text-emerald-700 font-bold mx-1">已掌握</strong>；
              未完全通過標記為
              <strong className="text-amber-700 font-bold mx-1">學習中</strong>；
              過去 24 小時新匯入單字標記為
              <strong className="text-sky-700 font-bold mx-1">新收錄</strong>。
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-stone-500 shrink-0">
          <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-lg border border-stone-200/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> 24h新匯入: {newWordsCount}
          </span>
          <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-lg border border-stone-200/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 學習中: {learningWordsCount}
          </span>
          <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-lg border border-stone-200/60 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 已掌握: {masteredWordsCount}
          </span>
        </div>
      </div>

      {/* Quick Add and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Quick Add Form */}
        <form onSubmit={handleAddSingleWord} className="md:col-span-6 flex gap-2">
          <div className="relative flex-1">
            <input
              id="input-quick-add-word"
              type="text"
              placeholder="輸入單字快速查詢加入 (例如：articulate)"
              value={singleWordInput}
              onChange={(e) => setSingleWordInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
            />
          </div>
          <button
            type="submit"
            disabled={isSingleLoading || !singleWordInput.trim()}
            className="px-4 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-900 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            {isSingleLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            查詢加入
          </button>
        </form>

        {/* Search & Filter */}
        <div className="md:col-span-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              id="input-search-words"
              type="text"
              placeholder="搜尋單字、中文釋義或例句..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400"
            />
          </div>

          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 shrink-0">
            {[
              { id: 'all', label: '全部', count: words.length },
              { id: 'new', label: '新收錄', count: newWordsCount },
              { id: 'learning', label: '學習中', count: learningWordsCount },
              { id: 'mastered', label: '已掌握', count: masteredWordsCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterLevel(tab.id as any)}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  filterLevel === tab.id
                    ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                    : 'hover:text-stone-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filterLevel === tab.id
                      ? 'bg-stone-100 text-stone-800 font-bold'
                      : 'bg-stone-200/60 text-stone-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {analysisError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center justify-between">
          <span>{analysisError}</span>
          <button
            onClick={() => setAnalysisError(null)}
            className="text-amber-600 hover:text-amber-800 font-medium text-xs ml-2 cursor-pointer"
          >
            關閉
          </button>
        </div>
      )}

      {/* Vocabulary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.map((word) => (
          <div
            key={word.id}
            id={`vocab-card-${word.id}`}
            className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition"
          >
            <div>
              {/* Header: Word, IPA, Pronounce */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-stone-900 tracking-tight">{word.word}</h3>
                    <button
                      onClick={() => speakText(word.word)}
                      title="發音"
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500 font-mono">
                    <span>{word.phonetic}</span>
                    <span className="text-stone-300">•</span>
                    <span className="italic text-stone-600 font-sans">{word.partOfSpeech}</span>
                  </div>
                </div>

                {/* Mastery badge toggle */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border flex items-center gap-1 ${
                      word.masteryLevel === 'mastered'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : word.masteryLevel === 'new' || isWordAddedWithin24Hours(word)
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {word.masteryLevel === 'mastered' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        已掌握 ✓
                      </>
                    ) : word.masteryLevel === 'new' || isWordAddedWithin24Hours(word) ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        新收錄 {word.dateAdded ? `(${formatAddedTimeAgo(word.dateAdded)})` : ''}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        學習中
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Speak & Write Verification Progress Bar */}
              <div className="mt-3 p-2 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !word.speakingPassed;
                      recordWordPracticeResult(word.id, 'speaking', nextState);
                      onWordsChange();
                    }}
                    title="點擊切換口說通過狀態"
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border transition cursor-pointer ${
                      word.speakingPassed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    🗣️ 說: {word.speakingPassed ? '通過 ✓' : '待測'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !word.writingPassed;
                      recordWordPracticeResult(word.id, 'writing', nextState);
                      onWordsChange();
                    }}
                    title="點擊切換寫作通過狀態"
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border transition cursor-pointer ${
                      word.writingPassed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    ✍️ 寫: {word.writingPassed ? '通過 ✓' : '待測'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTestWord(word);
                    setIsCheckModalOpen(true);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                >
                  <Award className="w-3 h-3 text-amber-400" />
                  說寫檢測
                </button>
              </div>

              {/* Translation & Definition */}
              <div className="mt-3">
                <p className="text-sm font-semibold text-stone-900">{word.translation}</p>
                {word.definitionEn && (
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed line-clamp-2">
                    {word.definitionEn}
                  </p>
                )}
              </div>

              {/* Collocations */}
              {word.collocations && word.collocations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <span className="text-[11px] font-semibold text-stone-400 block mb-1">常用搭配 (Collocations)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {word.collocations.map((col, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded-md bg-stone-50 text-stone-700 border border-stone-200/60"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Example sentence */}
              {word.exampleEn && (
                <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-stone-800 font-medium leading-relaxed">{word.exampleEn}</p>
                    <button
                      onClick={() => speakText(word.exampleEn)}
                      title="朗讀例句"
                      className="text-stone-400 hover:text-stone-700 shrink-0 p-0.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {word.exampleZh && <p className="text-stone-500 mt-1">{word.exampleZh}</p>}
                </div>
              )}

              {/* Grammar note */}
              {word.grammarNotes && (
                <div className="mt-2 text-[11px] text-stone-500 leading-snug">
                  <span className="font-semibold text-stone-600">語法重點：</span>
                  {word.grammarNotes}
                </div>
              )}
            </div>

            {/* Bottom Actions: Practice in Speaking / Writing / Listening */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectWordForPractice(word, 'writing')}
                  className="px-2 py-1 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium transition cursor-pointer"
                  title="帶入造句與寫作練習"
                >
                  ✍️ 造句
                </button>
                <button
                  onClick={() => onSelectWordForPractice(word, 'speaking')}
                  className="px-2 py-1 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium transition cursor-pointer"
                  title="帶入口說情境對話"
                >
                  🎙️ 口說
                </button>
                <button
                  onClick={() => onSelectWordForPractice(word, 'listening')}
                  className="px-2 py-1 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium transition cursor-pointer"
                  title="帶入聽力理解練習"
                >
                  🎧 聽力
                </button>
              </div>

              <button
                onClick={() => {
                  deleteWord(word.id);
                  onWordsChange();
                }}
                className="text-stone-300 hover:text-rose-500 p-1 rounded-md transition cursor-pointer"
                title="刪除單字"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredWords.length === 0 && (
          <div className="col-span-full py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-700">尚未找到符合條件的單字</p>
            <p className="text-xs text-stone-500 mt-1">
              可點擊上方「讀取剪貼簿 / 匯入文字」或手動輸入單字加入學習清單。
            </p>
          </div>
        )}
      </div>

      {/* Batch Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-stone-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-stone-800" />
                <h3 className="text-lg font-bold text-stone-900">剪貼簿讀取與生字批次匯入</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-medium cursor-pointer"
              >
                關閉
              </button>
            </div>

            <p className="text-xs text-stone-600">
              貼上複製的英文單字清單（例如：`articulate, nuance, spontaneous`）或整段英文文章。AI
              會自動為您提取關鍵生字，並生成音標、中文釋義、例句與語法搭配。
            </p>

            <textarea
              id="textarea-import-content"
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="在此貼上您複製的英文單字或文章段落..."
              className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
            />

            {analysisError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg">{analysisError}</p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={async () => {
                  const res = await readClipboardTextSafe();
                  if (res.success && res.text) {
                    setImportText(res.text);
                  } else if (res.error) {
                    setAnalysisError(res.error);
                  }
                }}
                className="text-xs text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                從剪貼簿重新貼上
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 font-medium rounded-xl cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={isAnalyzing || !importText.trim()}
                  onClick={handleBatchAnalyze}
                  className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      AI 智能分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      立即分析並匯入
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
