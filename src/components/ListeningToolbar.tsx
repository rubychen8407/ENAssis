import React from 'react';
import { Layers3, Brain, Upload, ListFilter, GraduationCap, Headphones } from 'lucide-react';

interface Props {
  mode: 'exam' | 'study';
  onToggleMode: () => void;
  onOpenImportDialog: () => void;
  stage: 'source' | 'listening' | 'review';
  onBackToSources?: () => void;
}

/**
 * Material Design 3 (M3) Vertical Floating Toolbar for Listening Lab
 * Exact visual match with VocabToolbar specs:
 * - Vertical orientation (aria-orientation="vertical")
 * - 56dp container width (w-14) with fully rounded 28dp pill container (rounded-[28px])
 * - Elevated surface container with elevation shadow & border
 * - 48x48dp touch targets with standard 24x24dp icons
 * - Standard M3 1dp horizontal divider separating actions
 * - M3 plain tooltips anchored to the left of each action
 */
export const ListeningToolbar: React.FC<Props> = ({
  mode,
  onToggleMode,
  onOpenImportDialog,
  stage,
  onBackToSources,
}) => {
  const isExam = mode === 'exam';

  return (
    <nav
      id="listening-vertical-floating-toolbar"
      role="toolbar"
      aria-orientation="vertical"
      aria-label="聽力實驗室功能工具列"
      className="fixed right-4 md:right-6 bottom-6 z-40 flex flex-col items-center gap-1.5 p-2 rounded-[28px] bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-800 shadow-2xl ring-1 ring-white/10 w-14 transition-all duration-200"
    >
      {/* 1. 單一按鈕切換 Exam Mode 與 Study Mode */}
      <div className="relative group">
        <button
          id="btn-listening-toggle-mode"
          type="button"
          onClick={onToggleMode}
          className={`relative w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
            isExam
              ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold shadow-md shadow-amber-950/20'
              : 'bg-stone-800 hover:bg-stone-700/90 text-sky-400 hover:text-sky-300'
          }`}
          title={isExam ? '當前為雅思模考 (點擊切換為精聽研讀)' : '當前為精聽研讀 (點擊切換為雅思模考)'}
          aria-label={isExam ? '切換為精聽研讀 (Study Mode)' : '切換為雅思模考 (Exam Mode)'}
        >
          {isExam ? (
            <GraduationCap className="w-5 h-5 stroke-[2.4]" />
          ) : (
            <Headphones className="w-5 h-5 stroke-[2.2]" />
          )}
        </button>

        {/* M3 Plain Tooltip (Anchored to the left) */}
        <div
          role="tooltip"
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
        >
          <span>{isExam ? '切換為精聽研讀' : '切換為雅思模考'}</span>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-stone-800 text-stone-300">
            {isExam ? 'Exam' : 'Study'}
          </span>
          <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
        </div>
      </div>

      {/* M3 1dp Divider */}
      <div
        className="w-7 h-[1px] bg-stone-700/60 my-0.5"
        role="separator"
        aria-orientation="horizontal"
      />

      {/* 2. 外部匯入與生成來源按鈕（點擊開啟 Dialog） */}
      <div className="relative group">
        <button
          id="btn-listening-import-dialog"
          type="button"
          onClick={onOpenImportDialog}
          className="relative w-11 h-11 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all duration-200 cursor-pointer shadow-md shadow-emerald-950/20 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          title={isExam ? '外部抓取 / 匯入雅思考題' : '匯入外部來源 / 生字庫生成篇章'}
          aria-label="外部匯入與生成工具"
        >
          <Upload className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* M3 Plain Tooltip */}
        <div
          role="tooltip"
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
        >
          <span>{isExam ? '外部抓取雅思考卷' : '外部匯入 / 生字生成'}</span>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-emerald-900 text-emerald-200">
            Import
          </span>
          <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
        </div>
      </div>

      {/* 3. 在正式聆聽或檢查階段時，提供快速返回更換來源按鈕 */}
      {stage !== 'source' && onBackToSources && (
        <>
          <div
            className="w-7 h-[1px] bg-stone-700/60 my-0.5"
            role="separator"
            aria-orientation="horizontal"
          />
          <div className="relative group">
            <button
              id="btn-listening-back-sources"
              type="button"
              onClick={onBackToSources}
              className="relative w-11 h-11 flex items-center justify-center rounded-full bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 transition-all duration-200 cursor-pointer shadow-md select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              title="返回來源清單"
              aria-label="返回來源清單"
            >
              <ListFilter className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div
              role="tooltip"
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
            >
              <span>更換來源清單</span>
              <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
            </div>
          </div>
        </>
      )}
    </nav>
  );
};
