import React, { useState } from 'react';
import { Minimize2, Maximize2, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  zenMode: boolean;
  onToggleZenMode: () => void;
  onExitToDashboard?: () => void;
}

/**
 * Floating Zen Mode Exit/Toggle Bar (M3 Collapsible Toolbar)
 * Provides touch-friendly exit from Zen Mode on mobile and desktop devices.
 */
export const FloatingZenBar: React.FC<Props> = ({
  zenMode,
  onToggleZenMode,
  onExitToDashboard,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!zenMode) return null;

  return (
    <nav
      id="floating-zen-mode-bar"
      role="toolbar"
      aria-label="專注模式控制列"
      className="fixed right-4 md:right-6 bottom-6 z-50 flex items-center gap-2 p-1.5 rounded-full bg-stone-900/95 dark:bg-stone-900/95 text-white backdrop-blur-md border border-stone-800 shadow-2xl ring-1 ring-white/10 transition-all duration-300 animate-fade-in"
    >
      <button
        type="button"
        onClick={onToggleZenMode}
        style={{ touchAction: 'manipulation' }}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
        title="退出 Zen 專注模式（恢復導覽列）"
        aria-label="退出 Zen 專注模式"
      >
        <Minimize2 className="w-4 h-4" />
        <span>退出 Zen 模式</span>
      </button>

      {onExitToDashboard && (
        <button
          type="button"
          onClick={onExitToDashboard}
          style={{ touchAction: 'manipulation' }}
          className="p-2 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white text-xs transition cursor-pointer"
          title="返回今日進度儀表板"
          aria-label="返回今日進度"
        >
          <LayoutDashboard className="w-4 h-4" />
        </button>
      )}
    </nav>
  );
};
