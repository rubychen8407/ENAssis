import React, { useState, useRef } from 'react';
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
  GraduationCap,
  BookOpen,
  Headphones,
  CheckCircle,
} from 'lucide-react';
import { VocabWord } from '../types';
import { IELTSListeningExam } from '../data/ielts/curatedListeningExams';
import { StudyListeningItem } from './ListeningLab';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'exam' | 'study';
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
  onExamCreated: (newExam: IELTSListeningExam) => void;
}

export const ListeningImportDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  mode: initialMode,
  savedWords,
  targetVocabBatch,
  vocabCoverageStats,
  onNextVocabBatch,
  onVocabGenerated,
  onSourceImported,
  onExamCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'exam' | 'study_vocab' | 'study_external'>(
    initialMode === 'exam' ? 'exam' : 'study_vocab'
  );

  // Exam import state (Matches Image 2)
  const [examUrl, setExamUrl] = useState('');
  const [examRawText, setExamRawText] = useState('');
  const [examSection, setExamSection] = useState<'Section 1' | 'Section 2' | 'Section 3' | 'Section 4'>('Section 1');
  const [isFetchingExam, setIsFetchingExam] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Exam AI 抓取
  const handleFetchExam = async () => {
    if (!examUrl.trim() && !examRawText.trim()) {
      setExamError('請輸入外部題目網址或直接貼上題目與錄音稿內容');
      return;
    }
    setIsFetchingExam(true);
    setExamError(null);

    try {
      const res = await fetch('/api/gemini/parse-external-ielts-listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: examUrl.trim(),
          rawText: examRawText.trim(),
          section: examSection,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '解析外部雅思試題失敗');
      }

      const newExam: IELTSListeningExam = await res.json();
      onExamCreated(newExam);
      onClose();
    } catch (err: any) {
      setExamError(err?.message || '抓取失敗，請確認題目網址或文字格式');
    } finally {
      setIsFetchingExam(false);
    }
  };

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

  // 3. 匯入外部音源 (YouTube / 音訊網址)
  const handleImportExternal = async () => {
    if (!externalUrl.trim()) {
      setExternalError('請輸入 YouTube、音訊串流或 Podcast 網址');
      return;
    }
    setIsImportingExternal(true);
    setExternalError(null);

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
      let ytId: string | undefined = undefined;
      const ytMatch = externalUrl.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
      );
      if (ytMatch) {
        ytId = ytMatch[1];
      }

      const newStudyItem: StudyListeningItem = {
        ...data,
        id: `study_import_${Date.now()}`,
        sourceType: 'imported',
        sourceLabel: ytId
          ? '外部匯入 (YouTube)'
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
    }
  };

  // 4. 本地檔案上傳
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingExternal(true);
    setExternalError(null);

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
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setExternalError('讀取本地音訊檔案失敗');
      setIsImportingExternal(false);
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
              支援從生字簿輪轉生成高頻聽力篇章、解析 YouTube / 音訊，或抓取外部雅思模擬題庫。
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

        {/* 模式切換 Tabs (包含 Image 1 與 Image 2 樣式) */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80">
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
            由生字庫生成
          </button>

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
            匯入外部語音
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exam')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'exam'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            抓取雅思考卷
          </button>
        </div>

        {/* ======================================================== */}
        {/* Tab 1: 由生字庫生成 (Exact match with Image 1) */}
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

        {/* ======================================================== */}
        {/* Tab 2: 匯入外部語音來源 (YouTube / 音訊檔) */}
        {/* ======================================================== */}
        {activeTab === 'study_external' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl border-2 border-stone-700/80 bg-stone-900 text-stone-100 space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-200 block mb-1.5 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-rose-500" />
                  YouTube 影片網址或音訊串流：
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... 或 MP3 網址"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-xs text-stone-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                  篇章自訂備註標題（選填）：
                </label>
                <input
                  type="text"
                  placeholder="例如：TED-Ed: Why is sleep important?"
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
                  上傳本機音訊檔案 (.mp3/.wav)
                </button>
              </div>

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
        {/* Tab 3: 外部雅思題目來源抓取 (Exact match with Image 2) */}
        {/* ======================================================== */}
        {activeTab === 'exam' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl border-2 border-amber-500/40 bg-stone-900 text-stone-100 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-100">
                <Sparkles className="w-4 h-4 text-amber-400" />
                輸入外部雅思題目來源
              </div>

              {/* 網址輸入 (Image 2) */}
              <input
                type="url"
                placeholder="https://mini-ielts.com/listening/... 或題庫網址"
                value={examUrl}
                onChange={(e) => setExamUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-xs text-stone-100 outline-none focus:border-amber-400"
              />

              {/* Section 選擇下拉選單 (Image 2) */}
              <select
                value={examSection}
                onChange={(e) => setExamSection(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-xs font-bold text-stone-100 outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="Section 1">Section 1 (生活諮詢對話)</option>
                <option value="Section 2">Section 2 (公共設施獨白)</option>
                <option value="Section 3">Section 3 (學術小組討論)</option>
                <option value="Section 4">Section 4 (學術專題演講)</option>
              </select>

              {/* 文本區塊 (Image 2) */}
              <textarea
                rows={4}
                placeholder="或直接貼上題目、錄音稿與問題文本..."
                value={examRawText}
                onChange={(e) => setExamRawText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-xs text-stone-100 outline-none focus:border-amber-400 resize-none"
              />

              {examError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{examError}</span>
                </div>
              )}

              {/* AI 抓取按鈕 (Image 2) */}
              <button
                type="button"
                disabled={isFetchingExam}
                onClick={handleFetchExam}
                className="w-full py-3 rounded-xl bg-stone-950 hover:bg-stone-900 border border-stone-700 text-amber-400 hover:text-amber-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {isFetchingExam ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
                <span>AI 抓取並生成聽力考卷</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
