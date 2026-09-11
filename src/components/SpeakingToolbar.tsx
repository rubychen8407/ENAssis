import React, { useState } from 'react';
import {
  MessageSquare,
  Dice5,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface Props {
  onOpenScenarios: () => void;
  onSurpriseTopic: () => void;
  onResetConversation: () => void;
  onOpenSettings?: () => void;
  scenarioTitle?: string;
}

/**
 * Material Design 3 (M3) Vertical Floating Toolbar for Speaking / Voice Dialogue
 * - Vertical orientation (aria-orientation="vertical")
 * - 56dp container width (w-14) with fully rounded 28dp pill container (rounded-[28px])
 * - Elevated surface container with elevation shadow & border
 * - 48x48dp touch targets with standard icons
 * - Collapsible / Expandable
 */
export const SpeakingToolbar: React.FC<Props> = ({
  onOpenScenarios,
  onSurpriseTopic,
  onResetConversation,
  onOpenSettings,
  scenarioTitle = '日常漫談',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <nav
      id="speaking-vertical-floating-toolbar"
      role="toolbar"
      aria-orientation="vertical"
      aria-label="口說對話功能工具列"
      className={`fixed right-4 md:right-6 bottom-6 z-40 flex flex-col items-center gap-1.5 p-2 rounded-[28px] bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-800 shadow-2xl ring-1 ring-white/10 w-14 transition-all duration-300 ${
        isExpanded ? 'opacity-100' : 'opacity-95'
      }`}
    >
      {/* 展開/收合切換按鈕 */}
      <div className="relative group">
        <button
          id="btn-speaking-toolbar-collapse-toggle"
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

          {/* 1. 對話情境選擇 (開啟情境彈窗) */}
          <div className="relative group">
            <button
              id="btn-speaking-toolbar-scenarios"
              type="button"
              onClick={onOpenScenarios}
              style={{ touchAction: 'manipulation' }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 active:scale-95 transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 relative"
              title="切換對話情境與話題"
              aria-label="切換對話情境與話題"
            >
              <MessageSquare className="w-4.5 h-4.5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-stone-900" />
            </button>

            {/* Tooltip */}
            <div
              role="tooltip"
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>切換情境 ({scenarioTitle})</span>
              <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
            </div>
          </div>

          {/* 2. 隨機新話題 (Surprise Topic) */}
          <div className="relative group">
            <button
              id="btn-speaking-toolbar-surprise"
              type="button"
              onClick={onSurpriseTopic}
              style={{ touchAction: 'manipulation' }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 hover:bg-stone-700 text-rose-400 hover:text-rose-300 active:scale-95 transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              title="隨機換個新話題"
              aria-label="隨機換個新話題"
            >
              <Dice5 className="w-4.5 h-4.5" />
            </button>

            {/* Tooltip */}
            <div
              role="tooltip"
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>隨機新話題 (Surprise Topic)</span>
              <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
            </div>
          </div>

          {/* 3. 重新開局對話 (Fresh Restart) */}
          <div className="relative group">
            <button
              id="btn-speaking-toolbar-reset"
              type="button"
              onClick={onResetConversation}
              style={{ touchAction: 'manipulation' }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white active:scale-95 transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              title="清除記錄並重新開始對話"
              aria-label="重新開始對話"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Tooltip */}
            <div
              role="tooltip"
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
            >
              <span>重新開始本輪對話</span>
              <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
            </div>
          </div>

          {/* 4. 口說偏好設定 */}
          {onOpenSettings && (
            <div className="relative group">
              <button
                id="btn-speaking-toolbar-settings"
                type="button"
                onClick={onOpenSettings}
                style={{ touchAction: 'manipulation' }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 active:scale-95 transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                title="語音與自動送出設定"
                aria-label="語音設定"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Tooltip */}
              <div
                role="tooltip"
                className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
              >
                <span>口說偏好與自動送出設定</span>
                <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
              </div>
            </div>
          )}
        </>
      )}
    </nav>
  );
};
