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
} from 'lucide-react';
import { SkillTab, VocabWord } from './types';
import { getSavedVocabulary, readClipboardTextSafe, addWordToVocabulary } from './utils/storage';
import { VocabularyManager } from './components/VocabularyManager';
import { VoiceDialogue } from './components/VoiceDialogue';
import { ListeningLab } from './components/ListeningLab';
import { ReadingHub } from './components/ReadingHub';
import { IELTSPracticeHub } from './components/ielts/IELTSPracticeHub';
import { IELTSWritingCoach } from './components/IELTSWritingCoach';
import { WritingPracticeLab } from './components/WritingPracticeLab';
import { Dashboard } from './components/Dashboard';
import { IELTSMistakeItem, IELTSRecord } from './types/ielts';
import { getIELTSMistakes, getIELTSRecords } from './utils/ielts';

export default function App() {
  const [activeTab, setActiveTab] = useState<SkillTab>('dashboard');
  const [savedWords, setSavedWords] = useState<VocabWord[]>([]);
  const [ieltsRecords, setIeltsRecords] = useState<IELTSRecord[]>([]);
  const [ieltsMistakes, setIeltsMistakes] = useState<IELTSMistakeItem[]>([]);
  const [prefilledWord, setPrefilledWord] = useState<VocabWord | null>(null);
  const [clipboardAlert, setClipboardAlert] = useState<string | null>(null);
  const [selectedWritingPromptId, setSelectedWritingPromptId] = useState('task2-opinion-practice');

  // Load vocabulary from localStorage
  const refreshWords = () => {
    const list = getSavedVocabulary();
    setSavedWords(list);
    setIeltsRecords(getIELTSRecords());
    setIeltsMistakes(getIELTSMistakes());
  };

  useEffect(() => {
    refreshWords();
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-base tracking-tight">LinguaCraft</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  聽・說・讀・寫
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                智慧生字庫 • AI及時語音對話 • 文法組句與寫作精修
              </p>
            </div>
          </div>

          {/* Quick Stats & Clipboard Button */}
          <div className="flex items-center gap-3">
            <button
              id="btn-quick-clipboard-navbar"
              onClick={handleQuickClipboardRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700 transition cursor-pointer shadow-2xs"
              title="讀取剪貼簿單字或文字"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">讀取剪貼簿生字</span>
            </button>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>生字庫：</span>
              <span className="font-bold text-stone-900">{savedWords.length}</span>
              <span className="text-stone-400">/</span>
              <span className="text-emerald-700 font-semibold">{masteredCount} 熟記</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-1.5 py-2">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> 今日進度
          </button>

          <button
            id="tab-vocabulary"
            onClick={() => setActiveTab('vocabulary')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'vocabulary'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            生字庫
          </button>

          <button
            id="tab-listening"
            onClick={() => setActiveTab('listening')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'listening'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Headphones className="w-4 h-4" />
            聽力
          </button>

          <button
            id="tab-speaking"
            onClick={() => setActiveTab('speaking')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'speaking'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Mic className="w-4 h-4 text-rose-400" />
            口說
          </button>

          <button
            id="tab-reading"
            onClick={() => setActiveTab('reading')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'reading'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            閱讀
          </button>

          <button
            id="tab-ielts"
            onClick={() => setActiveTab('ielts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'ielts'
                ? 'bg-amber-500 text-stone-950 shadow-2xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-amber-50/70 border border-amber-200/60'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-600" />
            IELTS 題庫
          </button>

          <button
            id="tab-writing"
            onClick={() => setActiveTab('writing')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'writing'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <PenTool className="w-4 h-4" />
            IELTS 寫作
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
            onNavigate={(tab) => setActiveTab(tab)}
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
          <ListeningLab savedWords={savedWords} prefilledWord={prefilledWord} />
        )}

        {activeTab === 'speaking' && (
          <VoiceDialogue savedWords={savedWords} prefilledWord={prefilledWord} />
        )}

        {activeTab === 'reading' && (
          <ReadingHub savedWords={savedWords} onWordsChange={refreshWords} />
        )}

        {activeTab === 'ielts' && (
          <IELTSPracticeHub onWordAdded={refreshWords} onOpenWriting={() => setActiveTab('writing')} />
        )}

        {activeTab === 'writing' && (
          <div className="space-y-8">
            <section>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Writing Studio</p>
                <h1 className="mt-1 text-2xl font-bold text-stone-900">IELTS 寫作</h1>
                <p className="mt-1 text-sm text-stone-500">先在互動專區整理論點、段落與詞彙，再選 Task 1 或 Task 2 完成正式寫作。</p>
              </div>
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-700" />
                  <h2 className="text-base font-bold text-stone-900">互動專區</h2>
                </div>
                <WritingPracticeLab selectedPromptId={selectedWritingPromptId} onPromptChange={setSelectedWritingPromptId} />
              </div>
            </section>
            <IELTSWritingCoach selectedPromptId={selectedWritingPromptId} onPromptChange={setSelectedWritingPromptId} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/70 py-4 text-center text-xs text-stone-500">
        LinguaCraft 英文全方位學習 • 聽、說、讀、寫四維一體 • 結合語意分析與即時語音回饋
      </footer>
    </div>
  );
}
