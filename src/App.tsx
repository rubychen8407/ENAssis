import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  Headphones,
  Mic,
  BookOpen,
  PenTool,
  ClipboardPaste,
  Sparkles,
  Volume2,
  Award,
  GraduationCap,
  LayoutDashboard,
  Sliders,
  Target,
  Calendar,
  Moon,
  Sun,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { SkillTab, VocabWord } from './types';
import { getSavedVocabulary, readClipboardTextSafe, addWordToVocabulary } from './utils/storage';
import { VocabularyManager } from './components/VocabularyManager';
import { VoiceDialogue } from './components/VoiceDialogue';
import { ListeningLab } from './components/ListeningLab';
import { ReadingHub } from './components/ReadingHub';
import { IELTSPracticeHub } from './components/ielts/IELTSPracticeHub';
import { IELTSWritingStudio } from './components/ielts/IELTSWritingStudio';
import { Dashboard } from './components/Dashboard';
import { GeneralSettingsModal } from './components/GeneralSettingsModal';
import { AccountSyncModal } from './components/AccountSyncModal';
import {
  initAutoSync,
  subscribeSyncState,
  SyncState,
  getSyncAccountId,
} from './utils/syncManager';
import { IELTSMistakeItem, IELTSRecord, IELTSWritingRecord, GeneralSettings } from './types/ielts';
import {
  getIELTSMistakes,
  getIELTSRecords,
  getIELTSWritingRecords,
  getGeneralSettings,
  saveGeneralSettings,
  seedSampleWritingRecords,
  clearAllIELTSWritingRecords,
} from './utils/ielts';

export default function App() {
  const [activeTab, setActiveTab] = useState<SkillTab>('dashboard');
  const [savedWords, setSavedWords] = useState<VocabWord[]>([]);
  const [ieltsRecords, setIeltsRecords] = useState<IELTSRecord[]>([]);
  const [ieltsMistakes, setIeltsMistakes] = useState<IELTSMistakeItem[]>([]);
  const [writingRecords, setWritingRecords] = useState<IELTSWritingRecord[]>([]);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(() => getGeneralSettings());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(() => ({
    status: 'idle',
    accountId: getSyncAccountId(),
    accountName: '學員',
    lastSyncTime: null,
  }));
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [prefilledWord, setPrefilledWord] = useState<VocabWord | null>(null);
  const [clipboardAlert, setClipboardAlert] = useState<string | null>(null);
  const [selectedWritingPromptId, setSelectedWritingPromptId] = useState('task2-opinion-practice');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const savedTheme = localStorage.getItem('linguacraft-theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    setZenMode(generalSettings.zenMode || false);
  }, [generalSettings.zenMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('linguacraft-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'z' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only when not typing in input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        setZenMode((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Load state from localStorage
  const refreshWords = () => {
    const list = getSavedVocabulary();
    setSavedWords(list);
    setIeltsRecords(getIELTSRecords());
    setIeltsMistakes(getIELTSMistakes());
    setWritingRecords(getIELTSWritingRecords());
    setGeneralSettings(getGeneralSettings());
  };

  useEffect(() => {
    refreshWords();
    initAutoSync();

    const unsub = subscribeSyncState((st) => {
      setSyncState(st);
    });

    const handleSyncEvent = () => {
      refreshWords();
    };
    window.addEventListener('linguacraft-data-synced', handleSyncEvent);

    return () => {
      unsub();
      window.removeEventListener('linguacraft-data-synced', handleSyncEvent);
    };
  }, []);

  // One-click clipboard quick reader
  const handleQuickClipboardRead = async () => {
    const res = await readClipboardTextSafe();
    if (res.success && res.text) {
      setClipboardAlert(`已自剪貼簿讀取：「${res.text.slice(0, 40)}${res.text.length > 40 ? '...' : ''}」`);
      // If single word, look it up and add
      const cleanWord = res.text.trim();
      if (cleanWord.split(' ').length <= 2) {
        try {
          const apiRes = await fetch('/api/gemini/quick-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: cleanWord }),
          });
          if (apiRes.ok) {
            const data = await apiRes.json();
            addWordToVocabulary({
              word: data.word || cleanWord,
              phonetic: data.phonetic || '',
              partOfSpeech: data.partOfSpeech || 'n.',
              translation: data.translation || '查詢結果',
              definitionEn: data.definitionEn || '',
              collocations: data.collocations || [],
              exampleEn: data.exampleEn || '',
              exampleZh: data.exampleZh || '',
              grammarNotes: data.grammarNotes || '',
              masteryLevel: 'new',
              tags: ['Clipboard-Auto'],
            });
            refreshWords();
            setActiveTab('vocabulary');
          }
        } catch (_) {}
      } else {
        // Multi-word paragraph: switch to vocabulary tab to let user batch import
        setActiveTab('vocabulary');
      }
      setTimeout(() => setClipboardAlert(null), 4000);
    } else {
      setClipboardAlert(res.error || '未能讀取剪貼簿，請於文字框直接貼上。');
      setTimeout(() => setClipboardAlert(null), 4000);
    }
  };

  // Cross-module practice navigation
  const handleSelectWordForPractice = (word: VocabWord, targetTab: SkillTab) => {
    setPrefilledWord(word);
    setActiveTab(targetTab);
  };

  const masteredCount = savedWords.filter((w) => w.masteryLevel === 'mastered').length;

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col">
      {/* Top Navbar */}
      <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs ${zenMode ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-base tracking-tight">LinguaCraft</span>
              </div>
              <div />
            </div>
          </div>

          {/* Navigator Tabs (inline with logo) */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto whitespace-nowrap">
            <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'dashboard' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><LayoutDashboard className="w-3.5 h-3.5 inline mr-1"/>今日進度</button>
            <button onClick={() => setActiveTab('vocabulary')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'vocabulary' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><BookMarked className="w-3.5 h-3.5 inline mr-1"/>生字庫 (Vocabulary)</button>
            <button onClick={() => setActiveTab('listening')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'listening' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><Headphones className="w-3.5 h-3.5 inline mr-1"/>聽力 (Listening)</button>
            <button onClick={() => setActiveTab('speaking')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'speaking' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><Mic className="w-3.5 h-3.5 inline mr-1 text-rose-400"/>口說 (Speaking)</button>
            <button onClick={() => setActiveTab('reading')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'reading' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><BookOpen className="w-3.5 h-3.5 inline mr-1"/>閱讀 (Reading)</button>
            <button onClick={() => setActiveTab('writing')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'writing' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><PenTool className="w-3.5 h-3.5 inline mr-1"/>寫作 (Writing)</button>
          </div>

          {/* Theme + Profile */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button
              id="btn-theme-toggle-navbar"
              onClick={() => setIsDarkMode((value) => !value)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 transition cursor-pointer shadow-2xs"
              title={isDarkMode ? '切換到淺色模式' : '切換到深色模式'}
              aria-label={isDarkMode ? '切換到淺色模式' : '切換到深色模式'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cloud Sync Status Button */}
            <button
              id="btn-cloud-sync-status"
              onClick={() => setIsSyncModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition cursor-pointer shadow-2xs text-xs font-semibold"
              title={`跨裝置同步代碼：${syncState.accountId}`}
              aria-label="跨裝置同步"
            >
              {syncState.status === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              ) : syncState.status === 'error' ? (
                <Cloud className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <div className="relative flex items-center justify-center">
                  <Cloud className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
              )}
              <span className="hidden sm:inline text-[11px] font-medium font-mono text-stone-600 dark:text-stone-400">
                {syncState.accountId}
              </span>
            </button>

            {/* Profile */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-stone-900 text-white text-xs font-bold shadow hover:bg-stone-800 transition cursor-pointer"
              aria-label="Profile"
            >
              {generalSettings.avatarUrl ? (
                <img src={generalSettings.avatarUrl} alt="Profile" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/30" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-[10px]">{(generalSettings.profileName || '學').charAt(0)}</span>
              )}
              <span className="hidden sm:inline">{generalSettings.profileName || '設定'}</span>
            </button>
          </div>
        </div>

      </header>

      {/* Floating Clipboard Notification */}
      {clipboardAlert && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 bg-stone-900 text-white text-xs rounded-xl shadow-lg flex items-center gap-2 max-w-md animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{clipboardAlert}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            savedWords={savedWords}
            records={ieltsRecords}
            mistakes={ieltsMistakes}
            writingRecords={writingRecords}
            settings={generalSettings}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onNavigate={(tab, promptId) => {
              if (promptId) setSelectedWritingPromptId(promptId);
              setActiveTab(tab);
            }}
            onRefreshRecords={refreshWords}
          />
        )}

        {activeTab === 'vocabulary' && (
          <VocabularyManager
            words={savedWords}
            onWordsChange={refreshWords}
            onSelectWordForPractice={handleSelectWordForPractice}
          />
        )}

        {activeTab === 'listening' && (
          <ListeningLab
            savedWords={savedWords}
            prefilledWord={prefilledWord}
            onRecordSaved={refreshWords}
          />
        )}

        {activeTab === 'speaking' && (
          <VoiceDialogue savedWords={savedWords} prefilledWord={prefilledWord} />
        )}

        {activeTab === 'reading' && (
          <ReadingHub savedWords={savedWords} onWordsChange={refreshWords} />
        )}

        {activeTab === 'writing' && (
          <IELTSWritingStudio
            selectedPromptId={selectedWritingPromptId}
            onPromptChange={setSelectedWritingPromptId}
          />
        )}

      </main>

      {/* Footer */}
      <footer className={`border-t border-stone-200 bg-white/70 py-4 text-center text-xs text-stone-500 ${zenMode ? 'hidden' : ''}`}>
        LinguaCraft 英文全方位學習 • 聽、說、讀、寫四維一體 • 結合語意分析與即時語音回饋
      </footer>

      {/* General Settings Modal */}
      <GeneralSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={generalSettings}
        onSaveSettings={(newSettings) => {
          saveGeneralSettings(newSettings);
          setGeneralSettings(newSettings);
        }}
        onSeedSampleWriting={() => {
          seedSampleWritingRecords();
          refreshWords();
        }}
        onClearWritingRecords={() => {
          clearAllIELTSWritingRecords();
          refreshWords();
        }}
      />

      {/* Cross-Device Account Sync Modal */}
      <AccountSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncCompleted={refreshWords}
      />
    </div>
  );
}
