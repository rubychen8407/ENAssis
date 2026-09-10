import React, { useState } from 'react';
import {
  Award,
  CheckCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  BookOpen,
  Volume2,
  PlusCircle,
  Check,
  ListFilter,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { ListeningItemFeedback } from '../utils/listeningErrorAnalysis';
import { getBandScoreDescriptor } from '../utils/ielts';
import { SentenceTranscriptViewer } from './SentenceTranscriptViewer';

interface Props {
  mode: 'exam' | 'study';
  title: string;
  topic?: string;
  sectionOrSourceLabel?: string;
  // Score stats
  bandScore?: number;
  correctCount: number;
  totalCount: number;
  timeSpentSeconds?: number;
  accuracyPercentage?: number;
  // Detailed feedback per item
  feedbacks: ListeningItemFeedback[];
  // Full transcript & sentences
  fullScript: string;
  isVerbatimTranscript?: boolean;
  sentences?: { en: string; zh: string; focusWords?: string[] }[];
  questions?: Array<{
    id?: string;
    questionNumber?: number | string;
    locatingSentence?: string;
    correctAnswer?: string;
    prompt?: string;
    explanationZh?: string;
  }>;
  vocabularyList?: { word: string; definition: string }[];
  // Actions
  onPlaySentence?: (text: string, index: number) => void;
  playingSentenceIndex?: number | null;
  onSaveWordToVocab?: (word: string, def: string) => void;
  addedWordSuccess?: string | null;
  onReListen: () => void;
  onBackToSources: () => void;
}

export const ListeningReviewFeedback: React.FC<Props> = ({
  mode,
  title,
  topic,
  sectionOrSourceLabel,
  bandScore,
  correctCount,
  totalCount,
  timeSpentSeconds,
  accuracyPercentage,
  feedbacks,
  fullScript,
  isVerbatimTranscript,
  sentences = [],
  questions = [],
  vocabularyList = [],
  onPlaySentence,
  playingSentenceIndex,
  onSaveWordToVocab,
  addedWordSuccess,
  onReListen,
  onBackToSources,
}) => {
  const isExam = mode === 'exam';
  const [highlightedSentenceId, setHighlightedSentenceId] = useState<string | null>(null);

  // 統計各類錯誤數量
  const errorStats: Record<string, number> = {};
  feedbacks.forEach((fb) => {
    errorStats[fb.errorTypeLabel] = (errorStats[fb.errorTypeLabel] || 0) + 1;
  });

  // 滾動並高亮特定題目的定位句
  const handleLocateInTranscript = (fb: ListeningItemFeedback) => {
    // 尋找對應的題目與定位句
    const targetQNum = Number(fb.itemNumber);
    const targetEl = document.querySelector(`[id^="sentence-"]`);
    // 滾動到右側
    const matchedEl = document.getElementById(`sentence-${targetQNum}`);
    if (matchedEl) {
      matchedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedSentenceId(`sent_${targetQNum}`);
      setTimeout(() => setHighlightedSentenceId(null), 3500);
    } else {
      // 嘗試滾動右側容器
      const allSentences = document.querySelectorAll('[id^="sentence-"]');
      if (allSentences.length > 0) {
        allSentences[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // 從右側句子點擊跳轉至左側題目
  const handleJumpToQuestion = (qNum: number) => {
    const qEl = document.getElementById(`feedback-card-${qNum}`);
    if (qEl) {
      qEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      qEl.classList.add('ring-2', 'ring-amber-400');
      setTimeout(() => qEl.classList.remove('ring-2', 'ring-amber-400'), 2500);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. 成績總覽 Banner (MD3 Elevated Container) */}
      <div className="p-6 rounded-3xl border-2 border-amber-500/30 bg-white dark:bg-stone-900 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-stone-950 flex flex-col items-center justify-center font-black shadow-md shrink-0">
              {isExam && bandScore !== undefined ? (
                <>
                  <span className="text-2xl leading-none">{bandScore.toFixed(1)}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold">Band</span>
                </>
              ) : (
                <>
                  <span className="text-xl leading-none">
                    {accuracyPercentage ?? Math.round((correctCount / Math.max(1, totalCount)) * 100)}%
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold">準確率</span>
                </>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                  {sectionOrSourceLabel || (isExam ? '雅思模考' : '精聽研讀')}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">已自動記錄至測驗歷史</span>
              </div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-1">
                {title}
              </h2>
              {isExam && bandScore !== undefined && (
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                  等級評定：{getBandScoreDescriptor(bandScore)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="px-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              答對題數：
              <b className="text-emerald-600 dark:text-emerald-400 font-black">
                {correctCount}
              </b>{' '}
              / {totalCount} 題
            </div>
            {timeSpentSeconds !== undefined && timeSpentSeconds > 0 && (
              <div className="px-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                答題用時：
                <b>
                  {Math.floor(timeSpentSeconds / 60)}分 {timeSpentSeconds % 60}秒
                </b>
              </div>
            )}
          </div>
        </div>

        {/* 錯誤類型分佈摘要 Chips */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            作答類型分佈：
          </span>
          {Object.entries(errorStats).map(([label, count]) => {
            const isCorrect = label.includes('正確');
            return (
              <span
                key={label}
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isCorrect
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                }`}
              >
                {label}：{count}
              </span>
            );
          })}
        </div>
      </div>

      {/* 2. 左右分欄：左側顯示題目與錯誤類型深度反饋；右側顯示全文逐句對照與生字精析 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 左側欄位 (Col 6)：作答診斷與教練反饋 */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                逐題作答診斷與錯誤類型解析
              </h3>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                點擊定位按鈕可在右側原文直觀跳轉
              </span>
            </div>

            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  id={`feedback-card-${fb.itemNumber}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    fb.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/40'
                      : 'border-rose-200 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-stone-900 text-white dark:bg-amber-400 dark:text-stone-950 text-xs font-black flex items-center justify-center shrink-0">
                        {fb.itemNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${fb.badgeColor}`}
                      >
                        {fb.errorTypeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {fb.isCorrect ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> 正確
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> 需加強
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleLocateInTranscript(fb)}
                        className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        title="在右側原文中高亮此定位句"
                      >
                        <MapPin className="w-3 h-3 text-amber-500" />
                        原文定位
                      </button>
                    </div>
                  </div>

                  {fb.prompt && (
                    <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 mt-2">
                      {fb.prompt}
                    </p>
                  )}

                  {/* 答案對照組 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
                      <span className="text-stone-500 dark:text-stone-400 block text-[11px]">
                        你的作答 (Your Input)：
                      </span>
                      <span
                        className={`font-bold text-sm ${
                          fb.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {fb.userAnswer}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
                      <span className="text-stone-500 dark:text-stone-400 block text-[11px]">
                        標準答案 (Target Answer)：
                      </span>
                      <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {fb.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* 教練回饋反饋與防錯提示 */}
                  <div className="mt-3 p-3 rounded-xl bg-stone-100 dark:bg-stone-800/60 text-xs space-y-1.5 border border-stone-200/60 dark:border-stone-700/60">
                    <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                      💡 <b>聽力教練解析反饋：</b>
                      {fb.coachFeedback}
                    </p>

                    {fb.explanationZh && (
                      <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                        <b>題目背景：</b>
                        {fb.explanationZh}
                      </p>
                    )}

                    {fb.locatingSentence && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
                        <b>🎯 錄音原文定位句：</b> &ldquo;{fb.locatingSentence}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右側欄位 (Col 6)：逐句全文內容展開、錯題關鍵句 Highlight 與生字精析 */}
        <div className="lg:col-span-6 space-y-5">
          {isVerbatimTranscript === false && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              以下逐字稿為 AI 模擬內容，非該來源的真實逐字稿
            </div>
          )}
          {/* 1. 逐句對照式原文檢視器 (支援分頁長文、錯題 highlight、定位句標記) */}
          <SentenceTranscriptViewer
            audioScript={fullScript}
            sentences={sentences}
            questions={questions}
            feedbacks={feedbacks}
            activeSentenceIndex={playingSentenceIndex}
            onPlaySentence={onPlaySentence}
            onSaveWord={onSaveWordToVocab}
            onJumpToQuestion={handleJumpToQuestion}
            highlightedSentenceId={highlightedSentenceId}
            isReviewMode={true}
          />

          {/* 2. 本篇高頻生字收藏精析 */}
          {vocabularyList.length > 0 && onSaveWordToVocab && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                篇章生字一鍵收藏
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {vocabularyList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {item.word}
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 ml-2">
                        {item.definition}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSaveWordToVocab(item.word, item.definition)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-stone-950 font-bold shrink-0 cursor-pointer text-[11px] inline-flex items-center gap-1"
                    >
                      {addedWordSuccess === item.word ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400 dark:text-stone-950" /> 已加入
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3 h-3" /> 加入生字本
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 底部導航操作按鈕 */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onReListen}
              className="w-full flex-1 py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重新聆聽此篇章
            </button>

            <button
              type="button"
              onClick={onBackToSources}
              className="w-full flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <ListFilter className="w-4 h-4" />
              返回更換其他來源
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

