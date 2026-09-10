import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Check,
  RefreshCw,
  Copy,
  Smartphone,
  Laptop,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Users,
} from 'lucide-react';
import {
  getSyncAccountId,
  setSyncAccountId,
  performCrossDeviceSync,
  switchAndPullAccount,
  subscribeSyncState,
  SyncState,
} from '../utils/syncManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
}

export const AccountSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSyncCompleted,
}) => {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    accountId: getSyncAccountId(),
    accountName: '學員',
    lastSyncTime: null,
  });

  const [inputAccountId, setInputAccountId] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeSyncState((st) => {
      setSyncState(st);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncState.accountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSync = async () => {
    const res = await performCrossDeviceSync();
    if (res.success) {
      setActionMessage('雲端資料已同步更新！');
      if (onSyncCompleted) onSyncCompleted();
    } else {
      setActionMessage(`同步失敗：${res.error || '請確認網路連線'}`);
    }
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleSwitchAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = inputAccountId.trim();
    if (!cleanId) return;

    setIsSwitching(true);
    setActionMessage(null);

    const res = await switchAndPullAccount(cleanId);
    setIsSwitching(false);

    if (res.success) {
      setInputAccountId('');
      setActionMessage(`已成功切換至帳號 [${cleanId}] 並載入雲端資料！`);
      if (onSyncCompleted) onSyncCompleted();
      setTimeout(() => {
        setActionMessage(null);
      }, 2500);
    } else {
      setActionMessage(`切換失敗：${res.error || '請檢查代碼'}`);
    }
  };

  const formatTime = (ts: number | null) => {
    if (!ts) return '尚未同步';
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                同帳號跨裝置同步 (Cross-Device Sync)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                手機、平板與電腦無縫同步生字庫與備考紀錄
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-left">
          {/* Current Sync Account Box */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                當前綁定帳號代碼 (Account Sync Key)
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  syncState.status === 'syncing'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : syncState.status === 'error'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}
              >
                {syncState.status === 'syncing' ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    同步中
                  </>
                ) : syncState.status === 'error' ? (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    連線異常
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3" />
                    已連線同步
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-mono text-sm font-bold text-stone-900 dark:text-stone-100 tracking-wider">
                {syncState.accountId}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="複製此帳號代碼"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                    已複製！
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    複製代碼
                  </>
                )}
              </button>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>最後同步時間：{formatTime(syncState.lastSyncTime)}</span>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncState.status === 'syncing'}
                className="text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
                立即手動同步
              </button>
            </div>
          </div>

          {/* Cross Device Illustration / Guide */}
          <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-800/40 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-xs text-sky-950 dark:text-sky-200 leading-relaxed">
              <strong className="font-bold block mb-0.5">如何在另一台手機或電腦同步？</strong>
              在另一台裝置打開本應用，點擊右上角同步圖示，在下方輸入此帳號代碼（例如：<code className="px-1 py-0.2 bg-white dark:bg-stone-800 rounded font-mono font-bold text-[11px]">{syncState.accountId}</code>），即可無損接續生字複習、寫作評分與模考進度。
            </div>
          </div>

          {/* Switch / Pair to Another Account */}
          <form onSubmit={handleSwitchAccount} className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              在現有裝置登入 / 切換至另一同步帳號
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputAccountId}
                onChange={(e) => setInputAccountId(e.target.value)}
                placeholder="請輸入其他裝置的帳號代碼或名稱..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                type="submit"
                disabled={isSwitching || !inputAccountId.trim()}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSwitching ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                切換並載入
              </button>
            </div>
          </form>

          {actionMessage && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-semibold animate-fade-in">
              {actionMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 flex items-center justify-between">
          <span className="text-xs text-stone-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            自動即時雙向雲端備份
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
