import {
  getSavedVocabulary,
  saveVocabularyList,
} from './storage';
import {
  getIELTSRecords,
  getIELTSMistakes,
  getIELTSWritingRecords,
  getGeneralSettings,
  saveGeneralSettings,
} from './ielts';
import { VocabWord } from '../types';
import { GeneralSettings, IELTSRecord, IELTSMistakeItem, IELTSWritingRecord } from '../types/ielts';

const SYNC_ACCOUNT_KEY = 'linguacraft_sync_account_id';
const LAST_SYNC_KEY = 'linguacraft_last_sync_timestamp';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncState {
  status: SyncStatus;
  accountId: string;
  accountName: string;
  lastSyncTime: number | null;
  errorMessage?: string;
  serverWordCount?: number;
}

type SyncListener = (state: SyncState) => void;
const listeners = new Set<SyncListener>();

let currentState: SyncState = {
  status: 'idle',
  accountId: getSyncAccountId(),
  accountName: '學員',
  lastSyncTime: getLastSyncTimestamp(),
};

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...currentState }));
}

export function subscribeSyncState(fn: SyncListener): () => void {
  listeners.add(fn);
  fn({ ...currentState });
  return () => listeners.delete(fn);
}

// Generate or retrieve persistent Account ID
export function getSyncAccountId(): string {
  if (typeof window === 'undefined') return 'default_user';
  let acc = localStorage.getItem(SYNC_ACCOUNT_KEY);
  if (!acc) {
    // Generate a clean, human-readable account code: e.g. LC-8392
    const code = Math.floor(1000 + Math.random() * 9000);
    acc = `LC-USER-${code}`;
    localStorage.setItem(SYNC_ACCOUNT_KEY, acc);
  }
  return acc;
}

export function setSyncAccountId(newAccountId: string): void {
  if (typeof window === 'undefined') return;
  const clean = newAccountId.trim();
  if (!clean) return;
  localStorage.setItem(SYNC_ACCOUNT_KEY, clean);
  currentState = {
    ...currentState,
    accountId: clean,
  };
  notifyListeners();
}

function getLastSyncTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  return raw ? parseInt(raw, 10) : null;
}

function setLastSyncTimestamp(ts: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SYNC_KEY, ts.toString());
}

/**
 * Bi-directional cross-device synchronization
 * Sends local words & IELTS progress to server, merges conflict-free with cloud data,
 * and updates local client storage with the merged master set.
 */
export async function performCrossDeviceSync(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false };

  const accountId = getSyncAccountId();
  const settings = getGeneralSettings();
  const accountName = settings.profileName || '學員';

  currentState = {
    ...currentState,
    status: 'syncing',
    accountId,
    accountName,
    errorMessage: undefined,
  };
  notifyListeners();

  try {
    const localWords = getSavedVocabulary();
    const localIelts = getIELTSRecords();
    const localMistakes = getIELTSMistakes();
    const localWriting = getIELTSWritingRecords();

    const payload = {
      accountId,
      accountName,
      data: {
        words: localWords,
        ieltsRecords: localIelts,
        ieltsMistakes: localMistakes,
        writingRecords: localWriting,
        generalSettings: settings,
      },
    };

    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`伺服器尚未就緒 (${res.status})，將於背景自動重試`);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `伺服器連線異常 (${res.status})`);
    }

    const resData = await res.json();
    if (!resData.success) {
      throw new Error(resData.error || '同步失敗');
    }

    const merged = resData.mergedData;
    const now = Date.now();
    setLastSyncTimestamp(now);

    // Update local storage with merged data safely
    if (Array.isArray(merged.words)) {
      saveVocabularyList(merged.words, false);
    }
    if (Array.isArray(merged.ieltsRecords)) {
      localStorage.setItem('linguacraft_ielts_records_v1', JSON.stringify(merged.ieltsRecords));
    }
    if (Array.isArray(merged.writingRecords)) {
      localStorage.setItem('linguacraft_ielts_writing_records_v1', JSON.stringify(merged.writingRecords));
    }
    if (Array.isArray(merged.ieltsMistakes)) {
      localStorage.setItem('linguacraft_ielts_mistakes_v1', JSON.stringify(merged.ieltsMistakes));
    }
    if (merged.generalSettings && typeof merged.generalSettings === 'object') {
      saveGeneralSettings({ ...settings, ...merged.generalSettings });
    }

    currentState = {
      status: 'synced',
      accountId: resData.accountId || accountId,
      accountName: resData.accountName || accountName,
      lastSyncTime: now,
      serverWordCount: merged.words?.length || 0,
    };
    notifyListeners();

    // Broadcast update so all views refresh instantly
    window.dispatchEvent(new CustomEvent('linguacraft-data-synced', { detail: merged }));

    return { success: true };
  } catch (err: any) {
    console.error('Cross-device sync failed:', err);
    currentState = {
      ...currentState,
      status: 'error',
      errorMessage: err?.message || '同步錯誤，請檢查網路連線',
    };
    notifyListeners();
    return { success: false, error: err?.message };
  }
}

/**
 * Switch account / Login with existing Account Code on another device
 */
export async function switchAndPullAccount(targetAccountId: string): Promise<{ success: boolean; error?: string }> {
  const cleanId = targetAccountId.trim();
  if (!cleanId) return { success: false, error: '請輸入有效的帳號或同步代碼' };

  currentState = {
    ...currentState,
    status: 'syncing',
    accountId: cleanId,
    errorMessage: undefined,
  };
  notifyListeners();

  try {
    const res = await fetch(`/api/sync/pull?accountId=${encodeURIComponent(cleanId)}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`伺服器尚未就緒 (${res.status})，請稍後重試`);
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `讀取帳號失敗 (${res.status})`);
    }
    const data = await res.json();

    if (data.exists && data.data) {
      // Account exists on server, populate local device with its cloud data
      setSyncAccountId(cleanId);
      const cloudData = data.data;

      if (Array.isArray(cloudData.words)) {
        saveVocabularyList(cloudData.words, false);
      }
      if (Array.isArray(cloudData.ieltsRecords)) {
        localStorage.setItem('linguacraft_ielts_records_v1', JSON.stringify(cloudData.ieltsRecords));
      }
      if (Array.isArray(cloudData.writingRecords)) {
        localStorage.setItem('linguacraft_ielts_writing_records_v1', JSON.stringify(cloudData.writingRecords));
      }
      if (Array.isArray(cloudData.ieltsMistakes)) {
        localStorage.setItem('linguacraft_ielts_mistakes_v1', JSON.stringify(cloudData.ieltsMistakes));
      }
      if (cloudData.generalSettings) {
        saveGeneralSettings(cloudData.generalSettings);
      }

      const now = Date.now();
      setLastSyncTimestamp(now);

      currentState = {
        status: 'synced',
        accountId: cleanId,
        accountName: data.accountName || '學員',
        lastSyncTime: now,
        serverWordCount: cloudData.words?.length || 0,
      };
      notifyListeners();

      window.dispatchEvent(new CustomEvent('linguacraft-data-synced', { detail: cloudData }));
      return { success: true };
    } else {
      // New account ID: associate and push current local data to initialize it
      setSyncAccountId(cleanId);
      return await performCrossDeviceSync();
    }
  } catch (err: any) {
    console.error('Failed to switch account:', err);
    currentState = {
      ...currentState,
      status: 'error',
      errorMessage: err?.message || '切換帳號失敗',
    };
    notifyListeners();
    return { success: false, error: err?.message };
  }
}

// Debounced auto-push for local changes
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
export function triggerDebouncedSync(delayMs = 1200): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    performCrossDeviceSync();
  }, delayMs);
}

// Initialize automated sync listeners on window
let isInitialized = false;
export function initAutoSync(): void {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // Immediate sync on initial load
  performCrossDeviceSync();

  // Sync when window/tab regains focus (e.g. user just picked up phone or switched tab)
  window.addEventListener('focus', () => {
    performCrossDeviceSync();
  });

  // Sync when internet reconnects
  window.addEventListener('online', () => {
    performCrossDeviceSync();
  });

  // Periodic heartbeat sync every 45 seconds to keep cross-device state fresh
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      performCrossDeviceSync();
    }
  }, 45000);
}
