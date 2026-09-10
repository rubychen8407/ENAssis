import fs from 'fs';
import path from 'path';

export interface SyncDataPayload {
  words?: any[];
  ieltsRecords?: any[];
  ieltsMistakes?: any[];
  writingRecords?: any[];
  generalSettings?: any;
}

export interface AccountRecord {
  accountId: string;
  accountName: string;
  createdAt: number;
  lastUpdated: number;
  data: SyncDataPayload;
}

interface StoreSchema {
  version: number;
  accounts: Record<string, AccountRecord>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'sync-store.json');

// Ensure data directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error('Failed to create data directory:', e);
    }
  }
}

// Read store from disk
export function readStore(): StoreSchema {
  ensureDataDir();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: StoreSchema = {
      version: 1,
      accounts: {},
    };
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to initialize sync-store.json:', e);
    }
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.accounts) parsed.accounts = {};
    return parsed;
  } catch (err) {
    console.error('Error reading sync-store.json, creating fallback:', err);
    return { version: 1, accounts: {} };
  }
}

// Atomic write to disk
export function writeStore(store: StoreSchema): void {
  ensureDataDir();
  const tmpFile = `${STORE_FILE}.tmp_${Date.now()}`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmpFile, STORE_FILE);
  } catch (err) {
    console.error('Error writing sync-store.json:', err);
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (_) {}
  }
}

// Smart merger for vocabulary words across devices
function mergeWordLists(serverWords: any[] = [], clientWords: any[] = []): any[] {
  const map = new Map<string, any>();

  // Add server words
  for (const w of serverWords) {
    if (!w || !w.word) continue;
    const key = w.word.toLowerCase().trim();
    map.set(key, { ...w });
  }

  // Merge client words
  for (const cw of clientWords) {
    if (!cw || !cw.word) continue;
    const key = cw.word.toLowerCase().trim();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...cw });
    } else {
      // Merge properties intelligently
      const attempts = Math.max(existing.examAttempts || 0, cw.examAttempts || 0);
      const correct = Math.max(existing.examCorrect || 0, cw.examCorrect || 0);
      const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      const sp = Boolean(existing.speakingPassed || cw.speakingPassed);
      const wp = Boolean(existing.writingPassed || cw.writingPassed);

      let mastery = 'new';
      if (existing.masteryLevel === 'mastered' || cw.masteryLevel === 'mastered' || (sp && wp)) {
        mastery = 'mastered';
      } else if (existing.masteryLevel === 'learning' || cw.masteryLevel === 'learning' || attempts > 0) {
        mastery = 'learning';
      }

      const merged = {
        ...existing,
        ...cw,
        id: existing.id || cw.id,
        examAttempts: attempts,
        examCorrect: correct,
        examAccuracy: accuracy,
        examStatus: attempts >= 2 && accuracy >= 80 ? 'learned' : (existing.examStatus || cw.examStatus || 'review'),
        speakingPassed: sp,
        writingPassed: wp,
        masteryLevel: mastery,
        lastTestedAt: existing.lastTestedAt || cw.lastTestedAt,
        dateAdded: existing.dateAdded || cw.dateAdded,
      };

      map.set(key, merged);
    }
  }

  return Array.from(map.values());
}

// Smart merger for IELTS exam records
function mergeIELTSRecords(serverRecords: any[] = [], clientRecords: any[] = []): any[] {
  const map = new Map<string, any>();
  for (const r of serverRecords) {
    if (r && r.id) map.set(r.id, r);
  }
  for (const r of clientRecords) {
    if (r && r.id) map.set(r.id, r);
  }
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.date || 0).getTime() || 0;
    const timeB = new Date(b.date || 0).getTime() || 0;
    return timeB - timeA;
  });
}

// Smart merger for IELTS writing records
function mergeWritingRecords(serverRecords: any[] = [], clientRecords: any[] = []): any[] {
  const map = new Map<string, any>();
  for (const r of serverRecords) {
    if (r && r.id) map.set(r.id, r);
  }
  for (const r of clientRecords) {
    if (r && r.id) map.set(r.id, r);
  }
  return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

// Smart merger for mistakes
function mergeMistakes(serverMistakes: any[] = [], clientMistakes: any[] = []): any[] {
  const map = new Map<string, any>();
  for (const m of serverMistakes) {
    if (m && (m.examId || m.id)) {
      const key = `${m.examId || ''}_${m.questionId || m.id}`;
      map.set(key, m);
    }
  }
  for (const m of clientMistakes) {
    if (m && (m.examId || m.id)) {
      const key = `${m.examId || ''}_${m.questionId || m.id}`;
      map.set(key, m);
    }
  }
  return Array.from(map.values());
}

export function getAccount(accountId: string): AccountRecord | null {
  const store = readStore();
  return store.accounts[accountId] || null;
}

export function syncAccount(
  accountId: string,
  clientData: SyncDataPayload,
  accountName?: string
): { success: boolean; account: AccountRecord; mergedData: SyncDataPayload } {
  const store = readStore();
  const existing = store.accounts[accountId];
  const now = Date.now();

  let merged: SyncDataPayload;

  if (!existing) {
    // New account on server
    merged = {
      words: clientData.words || [],
      ieltsRecords: clientData.ieltsRecords || [],
      ieltsMistakes: clientData.ieltsMistakes || [],
      writingRecords: clientData.writingRecords || [],
      generalSettings: clientData.generalSettings || {},
    };

    const newAccount: AccountRecord = {
      accountId,
      accountName: accountName || clientData.generalSettings?.profileName || '學員',
      createdAt: now,
      lastUpdated: now,
      data: merged,
    };

    store.accounts[accountId] = newAccount;
    writeStore(store);
    return { success: true, account: newAccount, mergedData: merged };
  }

  // Merge client data with existing server data
  const sData = existing.data || {};
  merged = {
    words: mergeWordLists(sData.words, clientData.words),
    ieltsRecords: mergeIELTSRecords(sData.ieltsRecords, clientData.ieltsRecords),
    writingRecords: mergeWritingRecords(sData.writingRecords, clientData.writingRecords),
    ieltsMistakes: mergeMistakes(sData.ieltsMistakes, clientData.ieltsMistakes),
    generalSettings: {
      ...(sData.generalSettings || {}),
      ...(clientData.generalSettings || {}),
    },
  };

  existing.lastUpdated = now;
  if (accountName) existing.accountName = accountName;
  existing.data = merged;

  store.accounts[accountId] = existing;
  writeStore(store);

  return { success: true, account: existing, mergedData: merged };
}
