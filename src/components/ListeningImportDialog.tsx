import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Radio,
  FileText,
  Youtube,
  Link as LinkIcon,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Headphones,
  CheckCircle,
  PlayCircle,
  Podcast,
} from 'lucide-react';
import { VocabWord } from '../types';
import { StudyListeningItem } from './ListeningLab';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  savedWords: VocabWord[];
  targetVocabBatch: VocabWord[];
  vocabCoverageStats: {
    totalWords: number;
    coveredWordsCount: number;
    coveragePercentage: number;
  };
  onNextVocabBatch: () => void;
  onVocabGenerated: (newItem: StudyListeningItem) => void;
  onSourceImported: (newItem: StudyListeningItem) => void;
}

export const ListeningImportDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  savedWords,
  targetVocabBatch,
  vocabCoverageStats,
  onNextVocabBatch,
  onVocabGenerated,
  onSourceImported,
}) => {
  const [activeTab, setActiveTab] = useState<'study_vocab' | 'study_external'>('study_external');

  // Reset to the default tab whenever the dialog is (re)opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab('study_external');
    }
  }, [isOpen]);

  // Study vocab generation state (Matches Image 1)
  const [studyTopic, setStudyTopic] = useState('Daily Communication & Nuances');
  const [studyLevel, setStudyLevel] = useState('B2');
  const [isGeneratingVocab, setIsGeneratingVocab] = useState(false);
  const [vocabError, setVocabError] = useState<string | null>(null);

  // Study external audio/youtube state
  const [externalUrl, setExternalUrl] = useState('');
  const [externalTitle, setExternalTitle] = useState('');
  const [isImportingExternal, setIsImportingExternal] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [importStatusMessage, setImportStatusMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 2. 生字庫生成篇章
  const handleGenerateFromVocab = async () => {
    setIsGeneratingVocab(true);
    setVocabError(null);

    try {
      const wordsToUse =
        targetVocabBatch.length > 0
          ? targetVocabBatch.map((w) => w.word)
          : ['articulate', 'perspective', 'comprehend', 'subtle'];

      const res = await fetch('/api/gemini/generate-listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: studyTopic,
          level: studyLevel,
          vocabWords: wordsToUse,
        }),
      });

      if (!res.ok) throw new Error('生成失敗，請稍後重試');

      const data = await res.json();
      const newStudyItem: StudyListeningItem = {
        ...data,
        id: `study_vocab_${Date.now()}`,
        sourceType: 'vocab',
        sourceLabel: `生字庫生成 (${wordsToUse.length} 個生詞)`,
        createdAt: new Date().toLocaleDateString('zh-TW'),
        targetWords: wordsToUse,
      };

      onVocabGenerated(newStudyItem);
      onClose();
    } catch (err: any) {
      setVocabError(err?.message || '生成失敗，請稍後重試');
    } finally {
      setIsGeneratingVocab(false);
    }
  };

  // 3. 匯入外部音源 (YouTube / Podcast / 音訊網址)
  const handleImportExternal = async () => {
    if (!externalUrl.trim()) {
      setExternalError('請輸入 YouTube、Podcast 或音訊串流網址');
      return;
    }
    setIsImportingExternal(true);
    setExternalError(null);

    if (externalUrl.includes('youtube') || externalUrl.includes('youtu.be')) {
      setImportStatusMessage('正在分析 YouTube 影片主題與頻道資訊，生成對應新聞或對話精聽聽寫題組...');
    } else if (externalUrl.includes('podcast') || externalUrl.includes('anchor.fm')) {
      setImportStatusMessage('正在抓取 Podcast 節目串流並透過 Gemini 進行高精準度語音辨識與出題...');
    } else {
      setImportStatusMessage('正在解析外部語音資源並建立聽力教材...');
    }

    try {
      const res = await fetch('/api/gemini/import-voice-listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: externalUrl.trim(),
          title: externalTitle.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '音訊資源匯入失敗');
      }

      const data = await res.json();
      let ytId: string | undefined = data.youtubeId;
      if (!ytId) {
        const ytMatch = externalUrl.match(
          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
        );
        if (ytMatch) ytId = ytMatch[1];
      }

      const isPod = data.sourceType === 'podcast' || externalUrl.includes('podcast');

      const newStudyItem: StudyListeningItem = {
        ...data,
        id: `study_import_${Date.now()}`,
        sourceType: 'imported',
        sourceLabel: ytId
          ? '外部匯入 (YouTube 影音)'
          : isPod
          ? '外部匯入 (Podcast 節目)'
          : externalUrl.match(/\.(mp3|m4a|wav|aac)/i)
          ? '外部匯入 (音訊串流)'
          : '外部匯入',
        youtubeId: ytId,
        audioUrl: data.audioUrl || (externalUrl.match(/\.(mp3|m4a|wav|aac)/i) ? externalUrl : undefined),
        createdAt: new Date().toLocaleDateString('zh-TW'),
      };

      onSourceImported(newStudyItem);
      onClose();
    } catch (err: any) {
      setExternalError(err?.message || '匯入失敗，請確認網址是否可公開存取');
    } finally {
      setIsImportingExternal(false);
      setImportStatusMessage('');
    }
  };

  // 4. 本地檔案上傳
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingExternal(true);
    setExternalError(null);
    setImportStatusMessage('正在上傳音訊檔案並透過 Gemini 進行語音逐字轉譯出題...');

    try {
      const objectUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Str = (reader.result as string).split(',')[1];
          const res = await fetch('/api/gemini/import-voice-listening', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Str,
              mimeType: file.type || 'audio/mp3',
              title: file.name.replace(/\.[^/.]+$/, ''),
            }),
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || '音訊辨識出題失敗');
          }

          const data = await res.json();
          const newStudyItem: StudyListeningItem = {
            ...data,
            id: `study_upload_${Date.now()}`,
            sourceType: 'imported',
            sourceLabel: '本機音訊上傳',
            audioUrl: objectUrl,
            createdAt: new Date().toLocaleDateString('zh-TW'),
          };

          onSourceImported(newStudyItem);
          onClose();
        } catch (innerErr: any) {
          setExternalError(innerErr?.message || '解析上傳檔案失敗');
        } finally {
          setIsImportingExternal(false);
          setImportStatusMessage('');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setExternalError('讀取本地音訊檔案失敗');
      setIsImportingExternal(false);
      setImportStatusMessage('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Upload className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                篇章輸入與外部匯入工具
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              支援 YouTube 影片、Podcast 節目、本機音訊上傳，或由生字簿輪轉生成篇章。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            aria-label="關閉對話框"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 模式切換 Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('study_external')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'study_external'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            YouTube / Podcast
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('study_vocab')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'study_vocab'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            生字庫文章生成
          </button>
        </div>

        {/* ======================================================== */}
        {/* Tab 1: 匯入外部語音來源 (YouTube / Podcast / 音訊檔) */}
        {/* ======================================================== */}
        {activeTab === 'study_external' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl border-2 border-amber-500/40 bg-stone-900 text-stone-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200 block flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-rose-500" />
                  <Podcast className="w-4 h-4 text-purple-400" />
                  YouTube / Apple Podcast / 音訊串流網址：
                </label>
                <span className="text-[10px] text-amber-400 font-medium bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  支援語音轉文字
                </span>
              </div>

              <input
                type="url"
                placeholder="https://youtu.be/... 或 Apple Podcast 連結 或 .mp3 串流"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-xs text-stone-100 outline-none focus:border-amber-400"
              />

              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                  篇章自訂備註標題（選填，系統亦會自動解析）：
                </label>
                <input
                  type="text"
                  placeholder="例如：BBC News 專題報導 或 EnglishPod 臉部特徵描繪"
                  value={externalTitle}
                  onChange={(e) => setExternalTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-xs text-stone-100 outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-1 flex items-center justify-between gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 text-xs font-bold transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  上傳本機音訊檔案 (.mp3/.wav/.m4a)
                </button>
              </div>

              {isImportingExternal && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-300 flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-amber-400" />
                  <span className="leading-relaxed">{importStatusMessage || '正在進行語音轉譯與聽力教材分析...'}</span>
                </div>
              )}

              {externalError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{externalError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isImportingExternal || !externalUrl.trim()}
                onClick={handleImportExternal}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
              >
                {isImportingExternal ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
                <span>解析並加入精聽教材庫</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* Tab 2: 由生字庫生成 (Exact match with Image 1) */}
        {/* ======================================================== */}
        {activeTab === 'study_vocab' && (
          <div className="space-y-4 animate-fade-in">
            {/* 覆蓋率與輪轉狀態框 (帶有精緻琥珀色外框) */}
            <div className="p-4 rounded-2xl border-2 border-amber-500/40 bg-stone-900 text-stone-100 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-100 flex items-center gap-2">
                  生字庫聽力覆蓋率：
                  <span className="text-amber-400 font-mono">
                    {vocabCoverageStats.coveredWordsCount}/{vocabCoverageStats.totalWords} ({vocabCoverageStats.coveragePercentage}%)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={onNextVocabBatch}
                  className="text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer inline-flex items-center gap-1"
                >
                  換下一批 →
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${Math.max(4, vocabCoverageStats.coveragePercentage)}%` }}
                />
              </div>

              {/* 單字 Chips (Image 1 呈現方式) */}
              <div className="flex flex-wrap gap-2 pt-1">
                {targetVocabBatch.length > 0 ? (
                  targetVocabBatch.map((w) => (
                    <span
                      key={w.word}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-800 border border-stone-700 text-stone-200"
                    >
                      {w.word}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-400">目前生字簿尚無單字，將採用學術進階高頻詞。</span>
                )}
              </div>

              {/* 主題輸入 (Image 1) */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-stone-400 block">
                  篇章情境主題：
                </label>
                <input
                  type="text"
                  value={studyTopic}
                  onChange={(e) => setStudyTopic(e.target.value)}
                  placeholder="例如：Daily Communication & Nuances, Academic Research..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-xs text-stone-100 outline-none focus:border-amber-400"
                />
              </div>

              {/* 難度下拉選單 (Image 1) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-400 block">
                  語言難度等級：
                </label>
                <select
                  value={studyLevel}
                  onChange={(e) => setStudyLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-xs text-stone-100 outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="B1">CEFR B1 (中級生活與校園日常)</option>
                  <option value="B2">CEFR B2 (高階溝通與專業討論)</option>
                  <option value="C1">CEFR C1 (學術深層研究與抽象議論)</option>
                </select>
              </div>

              {vocabError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{vocabError}</span>
                </div>
              )}

              {/* 生成按鈕 (Image 1) */}
              <button
                type="button"
                disabled={isGeneratingVocab}
                onClick={handleGenerateFromVocab}
                className="w-full py-3 rounded-xl bg-stone-950 hover:bg-stone-900 border border-stone-700 text-amber-400 hover:text-amber-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {isGeneratingVocab ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
                <span>生成新篇章並加入聽力庫</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
