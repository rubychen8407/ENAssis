import React, { useEffect, useRef, useState } from 'react';
import {
  Target,
  Calendar,
  Scale,
  Database,
  User,
  Keyboard,
  Cloud,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  ChevronRight,
  Sparkles,
  Sliders,
  LogOut,
  Mic,
} from 'lucide-react';
import { GeneralSettings } from '../types/ielts';
import { SyncState } from '../utils/syncManager';

export type SettingsSection = 'goals' | 'exam' | 'speaking' | 'examiner' | 'data' | 'profile' | 'shortcuts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: GeneralSettings;
  syncState: SyncState;
  zenMode: boolean;
  isDarkMode: boolean;
  onSelectSection: (section: SettingsSection) => void;
  onOpenSyncModal: () => void;
  onToggleZenMode: () => void;
  onToggleTheme: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Material Design 3 (M3) Dropdown Menu
 * Specs reference: https://m3.material.io/components/menus/specs
 * - Surface container (rounded-2xl, elevation shadow, border)
 * - 48dp touch targets, standard leading icons, clear typographic hierarchy
 * - M3 dividers for semantic separation
 * - Accessibility: keyboard navigation, focus trapping, Escape handling
 */
export const UserMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  syncState,
  zenMode,
  isDarkMode,
  onSelectSection,
  onOpenSyncModal,
  onToggleZenMode,
  onToggleTheme,
  triggerRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      aria-label="學員設定與個人選單"
      className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-2xl ring-1 ring-black/5 z-50 py-2 animate-fade-in divide-y divide-stone-100 dark:divide-stone-800/80"
    >
      {/* 1. Header Profile Summary */}
      <div className="px-4 py-3 bg-stone-50/70 dark:bg-stone-800/40 rounded-t-2xl">
        <div className="flex items-center gap-3">
          {settings.avatarUrl ? (
            <img
              src={settings.avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/30 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 text-stone-950 font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              {(settings.profileName || '學').charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                {settings.profileName || '雅思學員'}
              </h4>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-[10px] font-bold shrink-0 border border-amber-200 dark:border-amber-800/50">
                Band {settings.targetOverallBand.toFixed(1)}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono truncate">
              帳號: {syncState.accountId || '本機'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation - Settings Page Sections */}
      <div className="py-1.5">
        <button
          type="button"
          role="menuitem"
          onClick={() => handleItemClick(() => onSelectSection('goals'))}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold">雅思目標成績</div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500">總分 & 各科分項設定</div>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
            {settings.targetOverallBand.toFixed(1)}
          </span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => handleItemClick(() => onSelectSection('exam'))}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold">考期與進度目標</div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500">考試倒數 & 每日學習量</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => handleItemClick(() => onSelectSection('speaking'))}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold">口說與語音對話偏好</div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500">語音朗讀、語速與自動送出</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => handleItemClick(() => onSelectSection('examiner'))}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold">考官與批改偏好</div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500">嚴格度與回饋風格</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => handleItemClick(() => onSelectSection('data'))}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold">資料與字庫管理</div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500">備份匯出 & 紀錄清理</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => handleItemClick(() => onSelectSection('profile'))}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold">學員個人檔案 (Profile)</div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500">名稱、頭像與自訂偏好</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => handleItemClick(() => onSelectSection('shortcuts'))}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0">
              <Keyboard className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold">快捷鍵與網站導覽</div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500">功能分類與站點地圖</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold">
            Site Map
          </span>
        </button>
      </div>

      {/* 3. Global Quick Actions */}
      <div className="py-1.5">
        {/* Cross-Device Sync Action */}
        <button
          type="button"
          role="menuitem"
          onClick={() => handleItemClick(onOpenSyncModal)}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-100/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold">同帳號跨裝置同步</div>
              <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                {syncState.accountId || '已就緒'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
            管理
          </span>
        </button>

        {/* Zen Mode Toggle */}
        <button
          type="button"
          role="menuitem"
          onClick={() => handleItemClick(onToggleZenMode)}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              zenMode
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}>
              {zenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <div className="font-semibold">{zenMode ? '退出 Zen 專注模式' : '開啟 Zen 專注模式'}</div>
              <div className="text-[10px] text-stone-400">{zenMode ? '顯示頂部與底部導覽' : '隱藏四周導覽列'}</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold">
            Z
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          role="menuitem"
          onClick={() => handleItemClick(onToggleTheme)}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0">
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </div>
            <div className="text-left">
              <div className="font-semibold">{isDarkMode ? '切換為淺色模式' : '切換為深色模式'}</div>
              <div className="text-[10px] text-stone-400">{isDarkMode ? 'Light Theme' : 'Dark Theme'}</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-stone-400">
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>
    </div>
  );
};
