import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Sparkles,
  RefreshCw,
  Plus,
  Check,
  ExternalLink,
  HelpCircle,
  GraduationCap,
  PenLine,
} from 'lucide-react';
import { ReadingItem, VocabWord } from '../types';
import { speakText } from '../utils/speech';
import { addWordToVocabulary } from '../utils/storage';
import { IELTSPracticeHub } from './ielts/IELTSPracticeHub';

interface Props {
  savedWords: VocabWord[];
  onWordsChange: () => void;
}

const DEFAULT_READING: ReadingItem = {
  id: 'reading_default',
  title: 'Navigating New Perspectives in Modern Communication',
  level: 'B2',
  topic: 'Language & Mindset',
  content: `In an increasingly connected world, having the ability to articulate complex thoughts in English has become an indispensable life skill. Rather than simply memorizing isolated words, true language mastery requires us to comprehend how subtle shifts in tone and grammar shape our message.

When we adopt a broader perspective, language learning ceases to be a tedious chore and transforms into an exciting exploration. Spontaneous conversations may occasionally feel intimidating, but they offer the fastest route to natural fluency.

Remember that eloquence is not about speaking without errors; rather, it is about having the confidence to share your authentic perspective with clarity and warmth.`,
  summaryZh:
    '在高度互聯的現代社會，清晰表達思想的能力已成為不可或缺的技能。透過開闊的視角和自然流暢的口說對話，我們能真正體會語言學習的深度與樂趣。',
  targetVocab: [
    { word: 'articulate', pos: 'v./adj.', meaningZh: '清楚表達；善於表達的' },
    { word: 'comprehend', pos: 'v.', meaningZh: '充分理解；領會' },
    { word: 'perspective', pos: 'n.', meaningZh: '視角；觀點' },
    { word: 'spontaneous', pos: 'adj.', meaningZh: '自發的；隨興的' },
    { word: 'subtle', pos: 'adj.', meaningZh: '微妙的；細緻的' },
  ],
  sentenceAnalyses: [
    {
      sentence:
        'Rather than simply memorizing isolated words, true language mastery requires us to comprehend how subtle shifts in tone and grammar shape our message.',
      grammarPoint: 'Rather than + V-ing 讓步對比句型 + 名詞子句 (how... shape our message)',
      translationZh:
        '與其單純死記孤立的單字，真正的語言掌握需要我們深刻領會語調與語法中細微的轉折如何塑造我們的信息。',
    },
    {
      sentence:
        'Remember that eloquence is not about speaking without errors; rather, it is about having the confidence to share your authentic perspective with clarity and warmth.',
      grammarPoint: 'not about... rather, it is about... 否定前項、強調後項之並列結構',
      translationZh:
        '請記住，雄辯並非指說話絕不出錯；相反地，它是在於擁有自信，以清晰與溫暖分享你真實的視角。',
    },
  ],
  quiz: [
    {
      question: 'According to the article, what is true language mastery?',
      options: [
        'Knowing how subtle grammar and tone shape the message',
        'Memorizing as many words as possible',
        'Avoiding all spontaneous conversation',
        'Translating every sentence into your native language',
      ],
      correctIndex: 0,
      explanationZh: '文章第一段指出：真正的語言掌握在於理解語氣與語法如何精準傳遞訊息。',
    },
  ],
};

export const ReadingHub: React.FC<Props> = ({ savedWords, onWordsChange }) => {
  // Top-level mode: free-form AI reading practice vs. curated IELTS mock-exam bank
  const [readingMode, setReadingMode] = useState<'ai' | 'ielts'>('ai');

  const [currentArticle, setCurrentArticle] = useState<ReadingItem>(DEFAULT_READING);
  const [isGenerating, setIsGenerating] = useState(false);

  // Quick word lookup modal state
  const [clickedWord, setClickedWord] = useState<string | null>(null);
  const [lookupData, setLookupData] = useState<any | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isAddedToVocab, setIsAddedToVocab] = useState(false);

  // Handle word click in article
  const handleWordClick = async (rawWord: string) => {
    const cleanWord = rawWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '').trim();
    if (!cleanWord || cleanWord.length < 2) return;

    setClickedWord(cleanWord);
    setIsLookingUp(true);
    setIsAddedToVocab(false);

    try {
      const res = await fetch('/api/gemini/quick-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: cleanWord }),
      });

      if (!res.ok) throw new Error('查詢失敗');
      const data = await res.json();
      setLookupData(data);
    } catch (err) {
      console.error(err);
      setLookupData({
        word: cleanWord,
        translation: '查詢中...',
        definitionEn: 'Word lookup available',
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Add looked-up word to saved vocabulary
  const handleAddCurrentWordToVocab = () => {
    if (!lookupData) return;
    addWordToVocabulary({
      word: lookupData.word || clickedWord || '',
      phonetic: lookupData.phonetic || '',
      partOfSpeech: lookupData.partOfSpeech || 'n.',
      translation: lookupData.translation || '',
      definitionEn: lookupData.definitionEn || '',
      collocations: lookupData.collocations || [],
      exampleEn: lookupData.exampleEn || '',
      exampleZh: lookupData.exampleZh || '',
      grammarNotes: lookupData.grammarNotes || '',
      masteryLevel: 'new',
      tags: ['Reading-Lookup'],
    });

    setIsAddedToVocab(true);
    onWordsChange();
  };

  // Generate new reading material
  const handleGenerateReading = async () => {
    setIsGenerating(true);
    try {
      const vocabList = savedWords.map((w) => w.word);
      const res = await fetch('/api/gemini/generate-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Personal Growth and Effective Thinking',
          level: 'B1-B2',
          vocabWords: vocabList.slice(0, 4),
        }),
      });

      if (!res.ok) throw new Error('生成失敗');
      const data = await res.json();
      setCurrentArticle(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Render clickable paragraph words
  const renderClickableParagraph = (text: string) => {
    const paragraphs = text.split('\n\n');
    return paragraphs.map((para, pIdx) => (
      <p key={pIdx} className="text-base leading-relaxed text-stone-800 font-serif mb-4">
        {para.split(' ').map((word, wIdx) => {
          const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '').toLowerCase();
          const isTarget = currentArticle.targetVocab?.some(
            (v) => v.word.toLowerCase() === cleanWord
          );

          return (
            <span
              key={wIdx}
              onClick={() => handleWordClick(word)}
              className={`inline-block mr-1 cursor-pointer transition rounded-xs px-0.5 ${
                isTarget
                  ? 'bg-amber-100 text-stone-950 font-sans font-semibold underline decoration-amber-400 hover:bg-amber-200'
                  : 'hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {word}
            </span>
          );
        })}
      </p>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Reading Mode Switch: AI generated reading vs. curated IELTS mock exams */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs flex items-center gap-2">
        <button
          id="btn-reading-mode-ai"
          onClick={() => setReadingMode('ai')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
            readingMode === 'ai'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <PenLine className="w-4 h-4" />
          AI 情境閱讀與查詞
        </button>
        <button
          id="btn-reading-mode-ielts"
          onClick={() => setReadingMode('ielts')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
            readingMode === 'ielts'
              ? 'bg-amber-500 text-stone-950 shadow-2xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-amber-50/70 border border-amber-200/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          雅思全真模考與題庫
        </button>
      </div>

      {readingMode === 'ielts' ? (
        <IELTSPracticeHub onWordAdded={onWordsChange} />
      ) : (
      <>
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-lg font-bold text-stone-900">{currentArticle.title}</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
              CEFR {currentArticle.level}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            提示：文章中任何單字皆可「點擊即時查詞」並一鍵加入生字庫。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => speakText(currentArticle.content)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            全文朗讀
          </button>
          <button
            disabled={isGenerating}
            onClick={handleGenerateReading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            )}
            依生字生成新文章
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Article Reader */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-600">
            <span className="font-semibold text-stone-800 block mb-0.5">中文概述 (Summary)：</span>
            {currentArticle.summaryZh}
          </div>

          <div className="pt-2">{renderClickableParagraph(currentArticle.content)}</div>

          {/* Grammar & Complex Sentence Breakdown */}
          {currentArticle.sentenceAnalyses && currentArticle.sentenceAnalyses.length > 0 && (
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                篇章長難句與文法剖析 (Grammar Highlights)
              </h3>
              <div className="space-y-3">
                {currentArticle.sentenceAnalyses.map((sa, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                    <p className="font-semibold text-stone-900 leading-relaxed font-serif">"{sa.sentence}"</p>
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      語法點：{sa.grammarPoint}
                    </div>
                    <p className="text-stone-500">{sa.translationZh}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right / Word Inspector & Target Vocab */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Word Lookup Panel */}
          {clickedWord ? (
            <div className="bg-white rounded-2xl border border-stone-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-stone-900">{clickedWord}</h3>
                  <button
                    onClick={() => speakText(clickedWord)}
                    className="p-1 hover:text-stone-800 text-stone-500 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setClickedWord(null)}
                  className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                >
                  關閉
                </button>
              </div>

              {isLookingUp ? (
                <div className="py-6 text-center text-xs text-stone-500">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1.5 text-stone-700" />
                  AI 智能查詢單字詳解中...
                </div>
              ) : lookupData ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-stone-500">
                    <span className="font-mono">{lookupData.phonetic}</span>
                    <span>•</span>
                    <span className="italic">{lookupData.partOfSpeech}</span>
                  </div>

                  <p className="text-sm font-bold text-stone-900">{lookupData.translation}</p>
                  {lookupData.definitionEn && (
                    <p className="text-stone-600 leading-relaxed">{lookupData.definitionEn}</p>
                  )}

                  {lookupData.collocations && lookupData.collocations.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <span className="font-semibold text-stone-700 block mb-1">推薦搭配 (Collocations)：</span>
                      <div className="flex flex-wrap gap-1">
                        {lookupData.collocations.map((c: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lookupData.exampleEn && (
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                      <p className="font-medium text-stone-800">{lookupData.exampleEn}</p>
                      {lookupData.exampleZh && <p className="text-stone-500 mt-1">{lookupData.exampleZh}</p>}
                    </div>
                  )}

                  <button
                    onClick={handleAddCurrentWordToVocab}
                    disabled={isAddedToVocab}
                    className={`w-full py-2 rounded-xl font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      isAddedToVocab
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    {isAddedToVocab ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> 已加入個人生字庫
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> 加入我的生字庫
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-500 space-y-1">
              <BookOpen className="w-6 h-6 text-stone-300 mx-auto mb-1" />
              <p className="font-medium text-stone-700">點擊文章中的任一單字</p>
              <p className="text-stone-400">即可在此即時查看音標、例句並收入生字庫</p>
            </div>
          )}

          {/* Target Article Vocabulary List */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
              本篇焦點生字 (Key Vocabulary)
            </h3>
            <div className="space-y-2">
              {currentArticle.targetVocab?.map((tv, idx) => (
                <div
                  key={idx}
                  onClick={() => handleWordClick(tv.word)}
                  className="p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-100 flex items-center justify-between text-xs cursor-pointer transition"
                >
                  <div>
                    <span className="font-bold text-stone-900">{tv.word}</span>
                    <span className="text-stone-400 ml-1 italic">{tv.pos}</span>
                    <p className="text-stone-600 mt-0.5">{tv.meaningZh}</p>
                  </div>
                  <Volume2 className="w-3.5 h-3.5 text-stone-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
