import React, { useState } from 'react';
import {
  PenLine,
  GraduationCap,
  Sparkles,
  Volume2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  readingMode: 'ai' | 'ielts';
  onToggleMode: (mode: 'ai' | 'ielts') => void;
  onGenerateReading?: () => void;
  onSpeakAll?: () => void;
  isGenerating?: boolean;
}

/**
 * Material Design 3 (M3) Vertical Floating Toolbar for Reading Hub
 * - Vertical orientation (aria-orientation="vertical")
 * - 56dp container width (w-14) with fully rounded 28dp pill container (rounded-[28px])
 * - Default collapsed state
 * - Elevated surface container with elevation shadow & border
 * - 48x48dp touch targets with standard icons
 */
export const ReadingToolbar: React.FC<Props> = ({
  readingMode,
  onToggleMode,
  onGenerateReading,
  onSpeakAll,
  isGenerating = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAI = readingMode === 'ai';

  return (
    <nav
      id="reading-vertical-floating-toolbar"
      role="toolbar"
      aria-orientation="vertical"
      aria-label="閱讀功能工具列"
      className={`fixed right-4 md:right-6 bottom-6 z-40 flex flex-col items-center gap-1.5 p-2 rounded-[28px] bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-800 shadow-2xl ring-1 ring-white/10 w-14 transition-all duration-300 ${
        isExpanded ? 'opacity-100' : 'opacity-95'
      }`}
    >
      {/* 展開/收合切換按鈕 */}
      <div className="relative group">
        <button
          id="btn-reading-toolbar-collapse-toggle"
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          style={{ touchAction: 'manipulation' }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 hover:bg-stone-700 active:scale-95 text-stone-300 hover:text-white transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          title={isExpanded ? '收合工具列' : '展開工具列'}
          aria-label={isExpanded ? '收合工具列' : '展開工具列'}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* Tooltip */}
        <div
          role="tooltip"
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
        >
          <span>{isExpanded ? '收合工具列' : '展開工具列'}</span>
          <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
        </div>
      </div>

      {isExpanded && (
        <>
          {/* 分隔線 */}
          <div className="w-8 h-[1px] bg-stone-800 my-0.5" />

          {/* 1. 切換模式 (AI 情境閱讀 vs 雅思全真模考) */}
          <div className="relative group">
            <button
              id="btn-reading-toolbar-toggle-mode"
              type="button"
              onClick={() => onToggleMode(isAI ? 'ielts' : 'ai')}
              style={{ touchAction: 'manipulation' }}
              className={`w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 ${
                isAI
                  ? 'bg-stone-800 text-amber-400 hover:bg-stone-700 hover:text-amber-300 focus-visible:ring-amber-400'
                  : 'bg-amber-500 text-stone-950 hover:bg-amber-400 focus-visible:ring-amber-300 shadow-sm'
              }`}
              title={isAI ? '切換至：雅思全真模考與題庫' : '切換至：AI 情境閱讀與查詞'}
              aria-label="切換閱讀模式"
            >
              {isAI ? <PenLine className="w-4.5 h-4.5" /> : <GraduationCap className="w-4.5 h-4.5" />}
            </button>

            {/* Tooltip */}
            <div
              role="tooltip"
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
            >
              <span>{isAI ? '目前：AI 情境閱讀 (點擊切換模考)' : '目前：雅思全真模考 (點擊切換情境閱讀)'}</span>
              <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
            </div>
          </div>

          {/* 2. AI 模式專屬按鈕：依生字生成新文章 */}
          {isAI && onGenerateReading && (
            <div className="relative group">
              <button
                id="btn-reading-toolbar-generate"
                type="button"
                onClick={onGenerateReading}
                disabled={isGenerating}
                style={{ touchAction: 'manipulation' }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 hover:bg-stone-700 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 active:scale-95 transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                title="依生字生成新文章"
                aria-label="依生字生成新文章"
              >
                <Sparkles className="w-4.5 h-4.5" />
              </button>

              {/* Tooltip */}
              <div
                role="tooltip"
                className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>依生字生成新文章</span>
                <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
              </div>
            </div>
          )}

          {/* 3. AI 模式專屬按鈕：全文朗讀 */}
          {isAI && onSpeakAll && (
            <div className="relative group">
              <button
                id="btn-reading-toolbar-speak"
                type="button"
                onClick={onSpeakAll}
                style={{ touchAction: 'manipulation' }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white active:scale-95 transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                title="全文語音朗讀"
                aria-label="全文語音朗讀"
              >
                <Volume2 className="w-4.5 h-4.5" />
              </button>

              {/* Tooltip */}
              <div
                role="tooltip"
                className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-stone-300" />
                <span>全文語音朗讀</span>
                <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
              </div>
            </div>
          )}
        </>
      )}
    </nav>
  );
};
