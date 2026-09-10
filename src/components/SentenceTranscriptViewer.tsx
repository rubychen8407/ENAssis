import React, { useState, useMemo } from 'react';
import {
  Volume2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Search,
  BookOpen,
  PlusCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AnalyzedSentence, buildAnalyzedSentences } from '../utils/sentenceSplitter';
import { ListeningItemFeedback } from '../utils/listeningErrorAnalysis';

interface Props {
  audioScript: string;
  sentences?: Array<{ en: string; zh: string; focusWords?: string[] }>;
  questions?: Array<{
    id?: string;
    questionNumber?: number | string;
    locatingSentence?: string;
    correctAnswer?: string;
    explanationZh?: string;
  }>;
  feedbacks?: ListeningItemFeedback[];
  activeSentenceIndex?: number | null;
  onPlaySentence?: (text: string, index: number) => void;
  onSaveWord?: (word: string, def: string) => void;
  onSentenceClick?: (sentence: AnalyzedSentence) => void;
  onJumpToQuestion?: (questionNumber: number) => void;
  highlightedSentenceId?: string | null;
  isReviewMode?: boolean;
}

export const SentenceTranscriptViewer: React.FC<Props> = ({
  audioScript,
  sentences = [],
  questions = [],
  feedbacks = [],
  activeSentenceIndex,
  onPlaySentence,
  onSaveWord,
  onSentenceClick,
  onJumpToQuestion,
  highlightedSentenceId,
  isReviewMode = false,
}) => {
  const [showAllZh, setShowAllZh] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'mistakes' | 'locating'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10; // 10 sentences per page for optimal readability on long audio
  const [isPaginationEnabled, setIsPaginationEnabled] = useState<boolean>(true);

  // Build analyzed sentence list
  const analyzedList = useMemo(() => {
    return buildAnalyzedSentences(audioScript, sentences, questions, feedbacks);
  }, [audioScript, sentences, questions, feedbacks]);

  // Statistics
  const mistakesCount = useMemo(
    () => analyzedList.filter((s) => s.isMistake).length,
    [analyzedList]
  );
  const locatingCount = useMemo(
    () => analyzedList.filter((s) => s.isLocatingSentence).length,
    [analyzedList]
  );

  // Filtered sentences
  const filteredSentences = useMemo(() => {
    return analyzedList.filter((s) => {
      // 1. Tag filter
      if (activeFilter === 'mistakes' && !s.isMistake) return false;
      if (activeFilter === 'locating' && !s.isLocatingSentence) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchEn = s.en.toLowerCase().includes(query);
        const matchZh = s.zh.toLowerCase().includes(query);
        const matchWords = (s.focusWords || []).some((w) => w.toLowerCase().includes(query));
        return matchEn || matchZh || matchWords;
      }

      return true;
    });
  }, [analyzedList, activeFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSentences.length / pageSize) || 1;
  const paginatedSentences = useMemo(() => {
    if (!isPaginationEnabled || filteredSentences.length <= pageSize) {
      return filteredSentences;
    }
    const start = (currentPage - 1) * pageSize;
    return filteredSentences.slice(start, start + pageSize);
  }, [filteredSentences, isPaginationEnabled, currentPage, pageSize]);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4">
      {/* 標題與全局控制列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            聽力原文逐句對照 (Sentence-by-Sentence)
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 font-semibold">
            共 {analyzedList.length} 句
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* 中文翻譯全局切換 */}
          <button
            type="button"
            onClick={() => setShowAllZh(!showAllZh)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold transition cursor-pointer"
          >
            {showAllZh ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showAllZh ? '隱藏全部中文' : '顯示全部中文'}
          </button>

          {/* 分頁 vs 全文切換 (長音訊時極為好用) */}
          {analyzedList.length > pageSize && (
            <button
              type="button"
              onClick={() => setIsPaginationEnabled(!isPaginationEnabled)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold transition cursor-pointer"
            >
              {isPaginationEnabled ? '展開完整全文' : '開啟逐頁瀏覽'}
            </button>
          )}
        </div>
      </div>

      {/* 搜尋列與過濾 Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* 快速過濾按鈕 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-stone-900 text-white dark:bg-amber-400 dark:text-stone-950 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            全部 ({analyzedList.length})
          </button>

          {isReviewMode && mistakesCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveFilter('mistakes');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeFilter === 'mistakes'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              僅看錯題 ({mistakesCount})
            </button>
          )}

          {locatingCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveFilter('locating');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeFilter === 'locating'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              僅看考點句 ({locatingCount})
            </button>
          )}
        </div>

        {/* 關鍵字搜尋 */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="搜尋英文或中文..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* 逐句卡片列表 (Scrollable Container) */}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {paginatedSentences.length === 0 ? (
          <div className="py-12 text-center text-stone-400 dark:text-stone-500 text-xs space-y-2">
            <Filter className="w-6 h-6 mx-auto opacity-50" />
            <p>沒有符合當前過濾條件的句子</p>
          </div>
        ) : (
          paginatedSentences.map((s, idx) => {
            const isPlaying = activeSentenceIndex === s.sentenceNumber - 1;
            const isHighlighted = highlightedSentenceId === s.id;

            // 決定卡片背景色與邊框樣式
            let cardStyle = 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700';

            if (isHighlighted) {
              cardStyle = 'bg-amber-100/70 border-amber-400 dark:bg-amber-950/60 dark:border-amber-500 ring-2 ring-amber-400 ring-offset-2';
            } else if (s.isMistake) {
              cardStyle = 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60';
            } else if (s.isLocatingSentence && isReviewMode) {
              cardStyle = 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/60';
            } else if (s.isLocatingSentence) {
              cardStyle = 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60';
            } else if (isPlaying) {
              cardStyle = 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700';
            }

            return (
              <div
                key={s.id}
                id={`sentence-${s.sentenceNumber}`}
                onClick={() => onSentenceClick && onSentenceClick(s)}
                className={`p-3.5 rounded-2xl border transition-all ${cardStyle} space-y-2`}
              >
                {/* 頂部標籤列：句號序數 + 錯題標記 + 考點定位標記 */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {s.sentenceNumber}
                    </span>

                    {/* 錯題定位標籤 (Highlight) */}
                    {s.isMistake && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        錯題定位句 (第 {s.mistakeQuestionNumbers.join(', ')} 題)
                      </span>
                    )}

                    {/* 正確定位標籤 (Highlight) */}
                    {!s.isMistake && s.isLocatingSentence && isReviewMode && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        考點定位句 (第 {s.locatingQuestionNumbers.join(', ')} 題 · 答對)
                      </span>
                    )}

                    {/* 練習階段考點標籤 */}
                    {!isReviewMode && s.isLocatingSentence && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        考點關鍵句 (第 {s.locatingQuestionNumbers.join(', ')} 題)
                      </span>
                    )}
                  </div>

                  {/* 單句發音按鈕 */}
                  {onPlaySentence && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaySentence(s.en, s.sentenceNumber - 1);
                      }}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700 cursor-pointer transition"
                      title="朗讀此句"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 英文句子內文 */}
                <p className="text-xs sm:text-sm text-stone-900 dark:text-stone-100 leading-relaxed font-medium">
                  {s.en}
                </p>

                {/* 中文翻譯 (可全局隱藏或顯示) */}
                {showAllZh && s.zh && (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed pt-1 border-t border-stone-200/40 dark:border-stone-700/40">
                    {s.zh}
                  </p>
                )}

                {/* 錯題答案快速對照 (在句子內直接呈現) */}
                {s.isMistake && (
                  <div className="pt-2 border-t border-rose-200/70 dark:border-rose-900/60 flex flex-wrap items-center gap-3 text-[11px]">
                    {s.mistakeQuestionNumbers.map((qNum) => {
                      const userAns = s.userAnswers[qNum] || '未作答';
                      const correctAns = s.correctAnswers[qNum] || '';
                      return (
                        <div key={qNum} className="flex items-center gap-1.5">
                          <span className="text-rose-700 dark:text-rose-400 font-bold">
                            Q{qNum} 你的作答:
                          </span>
                          <span className="line-through text-stone-500">{userAns}</span>
                          <span className="text-stone-400">➔</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            正確: {correctAns}
                          </span>
                          {onJumpToQuestion && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onJumpToQuestion(qNum);
                              }}
                              className="ml-1 underline text-amber-700 dark:text-amber-400 hover:text-amber-800 cursor-pointer"
                            >
                              查看解析
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 詞彙焦點快速加入 */}
                {s.focusWords && s.focusWords.length > 0 && onSaveWord && (
                  <div className="pt-1.5 flex flex-wrap items-center gap-1 text-[11px]">
                    <span className="text-stone-400">生詞：</span>
                    {s.focusWords.map((w, wIdx) => (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSaveWord(w, '篇章生字');
                        }}
                        className="px-2 py-0.5 rounded-md bg-stone-200/70 hover:bg-amber-100 text-stone-800 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-amber-900/60 dark:hover:text-amber-200 text-[10px] font-bold transition inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <PlusCircle className="w-2.5 h-2.5" />
                        {w}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 分頁導航 (若音訊很長有分頁時) */}
      {isPaginationEnabled && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          <span className="text-stone-500 dark:text-stone-400">
            第 {currentPage} / {totalPages} 頁 (每頁 {pageSize} 句)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              title="上一頁"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-stone-900 text-white dark:bg-amber-400 dark:text-stone-950'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              title="下一頁"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
