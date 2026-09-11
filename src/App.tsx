import React, { useState, useEffect, useRef } from 'react';
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
import { UserMenu, SettingsSection } from './components/UserMenu';
import { SettingsPage } from './components/SettingsPage';
import { FloatingZenBar } from './components/FloatingZenBar';
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
  const [previousTab, setPreviousTab] = useState<SkillTab>('dashboard');
  const [savedWords, setSavedWords] = useState<VocabWord[]>([]);
  const [ieltsRecords, setIeltsRecords] = useState<IELTSRecord[]>([]);
  const [ieltsMistakes, setIeltsMistakes] = useState<IELTSMistakeItem[]>([]);
  const [writingRecords, setWritingRecords] = useState<IELTSWritingRecord[]>([]);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(() => getGeneralSettings());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('goals');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null);
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

          {/* Navigator Tabs (inline with logo on desktop) */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto whitespace-nowrap">
            <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'dashboard' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><LayoutDashboard className="w-3.5 h-3.5 inline mr-1"/>今日進度</button>
            <button onClick={() => setActiveTab('vocabulary')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'vocabulary' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><BookMarked className="w-3.5 h-3.5 inline mr-1"/>生字庫 (Vocabulary)</button>
            <button onClick={() => setActiveTab('listening')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'listening' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><Headphones className="w-3.5 h-3.5 inline mr-1"/>聽力 (Listening)</button>
            <button onClick={() => setActiveTab('speaking')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'speaking' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><Mic className="w-3.5 h-3.5 inline mr-1 text-rose-400"/>口說 (Speaking)</button>
            <button onClick={() => setActiveTab('reading')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'reading' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><BookOpen className="w-3.5 h-3.5 inline mr-1"/>閱讀 (Reading)</button>
            <button onClick={() => setActiveTab('writing')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${activeTab === 'writing' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}><PenTool className="w-3.5 h-3.5 inline mr-1"/>寫作 (Writing)</button>
          </div>

          {/* Theme + Profile with M3 UserMenu */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button
              id="btn-theme-toggle-navbar"
              onClick={() => setIsDarkMode((value) => !value)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition cursor-pointer shadow-2xs"
              title={isDarkMode ? '切換到淺色模式' : '切換到深色模式'}
              aria-label={isDarkMode ? '切換到淺色模式' : '切換到深色模式'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Profile Avatar Trigger Button with M3 Dropdown Menu */}
            <div className="relative">
              <button
                ref={userMenuTriggerRef}
                id="btn-user-profile-menu-trigger"
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                style={{ touchAction: 'manipulation' }}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold shadow hover:bg-stone-800 dark:hover:bg-stone-200 transition cursor-pointer"
                aria-label="開啟設定與個人選單"
                aria-expanded={isUserMenuOpen}
              >
                {generalSettings.avatarUrl ? (
                  <img
                    src={generalSettings.avatarUrl}
                    alt="Profile"
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-white/30"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 text-stone-950 flex items-center justify-center text-[10px] font-black">
                    {(generalSettings.profileName || '學').charAt(0)}
                  </span>
                )}
                <span className="hidden sm:inline font-semibold">
                  {generalSettings.profileName || '目標與設定'}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black font-mono">
                  {generalSettings.targetOverallBand.toFixed(1)}
                </span>
              </button>

              {/* Material Design 3 User Menu */}
              <UserMenu
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
                settings={generalSettings}
                syncState={syncState}
                zenMode={zenMode}
                isDarkMode={isDarkMode}
                onSelectSection={(sec) => {
                  setSettingsSection(sec);
                  setPreviousTab(activeTab !== 'settings' ? activeTab : 'dashboard');
                  setActiveTab('settings');
                }}
                onOpenSyncModal={() => setIsSyncModalOpen(true)}
                onToggleZenMode={() => setZenMode((v) => !v)}
                onToggleTheme={() => setIsDarkMode((v) => !v)}
                triggerRef={userMenuTriggerRef}
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs Bar (Visible on mobile screens < md) */}
        <div className="md:hidden border-t border-stone-100 dark:border-stone-800 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap bg-stone-50/90 dark:bg-stone-900/90">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            style={{ touchAction: 'manipulation' }}
            className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> 今日進度
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vocabulary')}
            style={{ touchAction: 'manipulation' }}
            className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vocabulary'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <BookMarked className="w-4 h-4" /> 生字庫
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('listening')}
            style={{ touchAction: 'manipulation' }}
            className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'listening'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Headphones className="w-4 h-4" /> 聽力
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('speaking')}
            style={{ touchAction: 'manipulation' }}
            className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'speaking'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Mic className="w-4 h-4 text-rose-400" /> 口說
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reading')}
            style={{ touchAction: 'manipulation' }}
            className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reading'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4" /> 閱讀
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('writing')}
            style={{ touchAction: 'manipulation' }}
            className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'writing'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <PenTool className="w-4 h-4" /> 寫作
          </button>
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
            onOpenSettings={() => {
              setSettingsSection('goals');
              setPreviousTab('dashboard');
              setActiveTab('settings');
            }}
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
            zenMode={zenMode}
            onToggleZenMode={() => setZenMode((v) => !v)}
          />
        )}

        {activeTab === 'listening' && (
          <ListeningLab
            savedWords={savedWords}
            prefilledWord={prefilledWord}
            onRecordSaved={refreshWords}
            zenMode={zenMode}
            onToggleZenMode={() => setZenMode((v) => !v)}
          />
        )}

        {activeTab === 'speaking' && (
          <VoiceDialogue
            savedWords={savedWords}
            prefilledWord={prefilledWord}
            settings={generalSettings}
            onOpenSettings={() => {
              setSettingsSection('speaking');
              setPreviousTab('speaking');
              setActiveTab('settings');
            }}
          />
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

        {activeTab === 'settings' && (
          <SettingsPage
            initialSection={settingsSection}
            settings={generalSettings}
            onSaveSettings={(newSettings) => {
              saveGeneralSettings(newSettings);
              setGeneralSettings(newSettings);
            }}
            onBack={() => setActiveTab(previousTab || 'dashboard')}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onSeedSampleWriting={() => {
              seedSampleWritingRecords();
              refreshWords();
            }}
            onClearWritingRecords={() => {
              clearAllIELTSWritingRecords();
              refreshWords();
            }}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        )}
      </main>

      {/* Floating Zen Mode Exit/Toggle Bar (Active when in Zen Mode and outside Vocab/Listening toolbars) */}
      {zenMode && activeTab !== 'vocabulary' && activeTab !== 'listening' && (
        <FloatingZenBar
          zenMode={zenMode}
          onToggleZenMode={() => setZenMode((v) => !v)}
          onExitToDashboard={() => {
            setZenMode(false);
            setActiveTab('dashboard');
          }}
        />
      )}

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
