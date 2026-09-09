import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Volume2,
  Plus,
  Check,
  Sparkles,
  BookOpen,
  Layers,
  ArrowRight,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { IELTSCoreVocab } from '../../types/ielts';
import { VocabWord } from '../../types';
import { loadFullIELTSCoreVocab } from '../../data/ielts/vocabLoader';
import { addWordToVocabulary, getSavedVocabulary } from '../../utils/storage';
import { speakText } from '../../utils/speech';
import { toTraditionalChinese } from '../../utils/chineseConverter';

interface Props {
  onWordAdded?: () => void;
  onNavigateToPractice?: (word: VocabWord) => void;
}

export const IELTSVocabExplorer: React.FC<Props> = ({ onWordAdded }) => {
  const [vocabList, setVocabList] = useState<IELTSCoreVocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [freqFilter, setFreqFilter] = useState<'all' | 'top100' | 'top500' | 'top1000'>('top500');
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [flashcardIndex, setFlashcardIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [batchImportStatus, setBatchImportStatus] = useState<string | null>(null);

  // Load existing saved words to track which ones are already added
  useEffect(() => {
    const saved = getSavedVocabulary();
    setAddedWords(new Set(saved.map((w) => w.word.toLowerCase())));

    loadFullIELTSCoreVocab().then((words) => {
      setVocabList(words);
      setLoading(false);
    });
  }, []);

  // Filter words
  const filteredWords = useMemo(() => {
    let list = vocabList;

    if (freqFilter === 'top100') {
      list = list.slice(0, 100);
    } else if (freqFilter === 'top500') {
      list = list.slice(0, 500);
    } else if (freqFilter === 'top1000') {
      list = list.slice(0, 1000);
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        w.example.toLowerCase().includes(q)
    );
  }, [vocabList, searchQuery, freqFilter]);

  // Handle single word import
  const handleAddWord = (item: IELTSCoreVocab) => {
    const newWord: Omit<VocabWord, 'id' | 'dateAdded'> = {
      word: item.word,
      phonetic: item.phonetic ? `/${item.phonetic}/` : '',
      partOfSpeech: item.meaning.startsWith('n.')
        ? 'n.'
        : item.meaning.startsWith('v.') || item.meaning.startsWith('vt.')
        ? 'v.'
        : item.meaning.startsWith('a.') || item.meaning.startsWith('adj.')
        ? 'adj.'
        : 'adv.',
      translation: toTraditionalChinese(item.meaning),
      definitionEn: '',
      collocations: [],
      exampleEn: item.example || '',
      exampleZh: '',
      grammarNotes: `雅思核心真題高頻詞 (考頻係數: ${item.freq})`,
      masteryLevel: 'new',
      tags: ['IELTS-Core', '雅思高頻'],
    };

    addWordToVocabulary(newWord);
    setAddedWords((prev) => new Set(prev).add(item.word.toLowerCase()));
    if (onWordAdded) onWordAdded();
  };

  // Batch import top N from current filtered
  const handleBatchImport = (count: number) => {
    const toAdd = filteredWords
      .filter((w) => !addedWords.has(w.word.toLowerCase()))
      .slice(0, count);

    toAdd.forEach((item) => {
      addWordToVocabulary({
        word: item.word,
        phonetic: item.phonetic ? `/${item.phonetic}/` : '',
        partOfSpeech: item.meaning.slice(0, 4),
        translation: toTraditionalChinese(item.meaning),
        definitionEn: '',
        collocations: [],
        exampleEn: item.example || '',
        exampleZh: '',
        grammarNotes: `雅思核心真題高頻詞 (考頻: ${item.freq})`,
        masteryLevel: 'new',
        tags: ['IELTS-Core', '雅思高頻'],
      });
    });

    const updated = new Set(addedWords);
    toAdd.forEach((w) => updated.add(w.word.toLowerCase()));
    setAddedWords(updated);

    setBatchImportStatus(`成功匯入 ${toAdd.length} 個雅思核心單字至生字庫！`);
    if (onWordAdded) onWordAdded();
    setTimeout(() => setBatchImportStatus(null), 3500);
  };

  const handleSpeak = (text: string) => {
    speakText(text, { rate: 0.85 });
  };

  return (
    <div className="space-y-6" id="ielts-vocab-explorer">
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                IELTS-practice 官方真題詞表
              </span>
              <span className="text-xs text-stone-500 font-mono">共 3,610 核心高頻詞</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              雅思官方真題核心詞彙庫 (IELTS Core Wordlist)
            </h2>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl">
              收錄自歷年雅思閱讀與聽力真題之高頻核心單字，附帶真實官方考題例句、詞性釋義與考頻權重，可一鍵匯入至生字庫展開艾賓浩斯記憶。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-ielts-flashcard-mode"
              onClick={() => {
                setFlashcardIndex(flashcardIndex === null ? 0 : null);
                setIsFlipped(false);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-stone-700" />
              {flashcardIndex === null ? '開啟單字閃卡模式' : '關閉閃卡'}
            </button>

            <button
              id="btn-ielts-batch-import-20"
              onClick={() => handleBatchImport(20)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              匯入前 20 個高頻單字
            </button>
          </div>
        </div>

        {/* Batch alert notification */}
        {batchImportStatus && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>{batchImportStatus}</span>
          </div>
        )}
      </div>

      {/* Flashcard Modal / Hero Section if active */}
      {flashcardIndex !== null && filteredWords.length > 0 && (
        <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-stone-400">
                卡片 {flashcardIndex + 1} / {filteredWords.length}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-amber-300">
                考頻: {filteredWords[flashcardIndex].freq}
              </span>
            </div>
            <button
              onClick={() => setFlashcardIndex(null)}
              className="text-stone-400 hover:text-white text-xs cursor-pointer"
            >
              關閉
            </button>
          </div>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[160px] bg-stone-800/80 hover:bg-stone-800 rounded-xl p-6 border border-stone-700 cursor-pointer flex flex-col justify-center items-center text-center transition select-none"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-serif font-bold tracking-wide">
                {filteredWords[flashcardIndex].word}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(filteredWords[flashcardIndex].word);
                }}
                className="p-1.5 rounded-full bg-stone-700 hover:bg-stone-600 transition"
              >
                <Volume2 className="w-4 h-4 text-amber-300" />
              </button>
            </div>
            {filteredWords[flashcardIndex].phonetic && (
              <p className="text-stone-400 text-sm font-mono mt-1">
                /{filteredWords[flashcardIndex].phonetic}/
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-stone-700/60 w-full max-w-md">
              {isFlipped ? (
                <div className="animate-in fade-in duration-200">
                  <p className="text-amber-200 text-base font-semibold">
                    {filteredWords[flashcardIndex].meaning}
                  </p>
                  {filteredWords[flashcardIndex].example && (
                    <p className="text-stone-300 text-xs italic mt-2">
                      “{filteredWords[flashcardIndex].example}”
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-stone-400">點擊卡片翻面看中文釋義與例句 👆</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => {
                setIsFlipped(false);
                setFlashcardIndex((prev) => (prev! > 0 ? prev! - 1 : filteredWords.length - 1));
              }}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 cursor-pointer"
            >
              ← 上一個
            </button>

            <button
              onClick={() => handleAddWord(filteredWords[flashcardIndex])}
              disabled={addedWords.has(filteredWords[flashcardIndex].word.toLowerCase())}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                addedWords.has(filteredWords[flashcardIndex].word.toLowerCase())
                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-400 text-stone-950 hover:bg-amber-300'
              }`}
            >
              {addedWords.has(filteredWords[flashcardIndex].word.toLowerCase())
                ? '已在生字庫中'
                : '加入生字庫 +'}
            </button>

            <button
              onClick={() => {
                setIsFlipped(false);
                setFlashcardIndex((prev) => (prev! < filteredWords.length - 1 ? prev! + 1 : 0));
              }}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 cursor-pointer"
            >
              下一個 →
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-ielts-vocab-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋單字、中文釋義或真題例句..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
            >
              清除
            </button>
          )}
        </div>

        {/* Frequency Filter Chips */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFreqFilter('top100')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              freqFilter === 'top100'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Top 100 必背
          </button>
          <button
            onClick={() => setFreqFilter('top500')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              freqFilter === 'top500'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Top 500 高頻
          </button>
          <button
            onClick={() => setFreqFilter('top1000')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              freqFilter === 'top1000'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Top 1000 進階
          </button>
          <button
            onClick={() => setFreqFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              freqFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            全部 (3,610詞)
          </button>
        </div>
      </div>

      {/* Word List Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 text-stone-500 text-xs">
          載入雅思真題核心詞彙中...
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-stone-700 text-sm font-semibold">找不到符合條件的單字</p>
          <p className="text-stone-400 text-xs mt-1">請嘗試縮減關鍵字或切換考頻範圍</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredWords.slice(0, 100).map((item, idx) => {
            const isAdded = addedWords.has(item.word.toLowerCase());
            return (
              <div
                key={`${item.word}-${idx}`}
                className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-2xs hover:shadow-xs hover:border-stone-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-stone-900 text-lg">
                        {item.word}
                      </span>
                      {item.phonetic && (
                        <span className="text-[11px] text-stone-400 font-mono">
                          /{item.phonetic}/
                        </span>
                      )}
                      <button
                        onClick={() => handleSpeak(item.word)}
                        className="p-1 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition cursor-pointer"
                        title="朗讀發音"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80">
                      考頻 {item.freq}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-stone-800 mt-1.5">{item.meaning}</p>

                  {item.example && (
                    <p className="text-[11px] text-stone-500 italic mt-2 leading-relaxed bg-stone-50 p-2 rounded-lg border border-stone-100">
                      “{item.example}”
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400 font-mono">
                    #{idx + 1} IELTS Exam Word
                  </span>

                  <button
                    onClick={() => handleAddWord(item)}
                    disabled={isAdded}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 border border-stone-200'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        已在生字庫
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        加入生字庫
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredWords.length > 100 && (
        <div className="text-center text-xs text-stone-400 py-3">
          目前顯示前 100 筆結果，共 {filteredWords.length} 個單字。輸入搜尋詞可進一步精確查找。
        </div>
      )}
    </div>
  );
};
