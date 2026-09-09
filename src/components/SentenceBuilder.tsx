import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Sparkles,
  Volume2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  BookOpen,
  Mic,
  MicOff,
  Layers,
  MessageSquareQuote,
} from 'lucide-react';
import { VocabWord, SentenceFeedback, WritingAnalysis } from '../types';
import { speakText, createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';
import { recordWordPracticeResult } from '../utils/storage';
import confetti from 'canvas-confetti';

interface Props {
  savedWords: VocabWord[];
  prefilledWord?: VocabWord | null;
}

const GRAMMAR_PATTERNS = [
  {
    id: 'relative-clause',
    name: '關係代名詞子句 (Relative Clause)',
    formula: 'Main Clause + which / that / who / where + Clause',
    tip: '修飾前方名詞，使句子資訊更精準生動。',
    example: 'He articulated a concept that resonated with everyone in the room.',
  },
  {
    id: 'present-perfect',
    name: '現在完成式 (Present Perfect)',
    formula: 'Subject + have/has + V-pp + since / for / yet / recently',
    tip: '強調從過去持續到現在的經驗、影響或狀態。',
    example: 'We have comprehended the core issues through extensive research.',
  },
  {
    id: 'conditional',
    name: '條件假設句 (Conditionals)',
    formula: 'If + Clause, Subject + will/would/could + V',
    tip: '表達假設立場、推測結果或條理性論點。',
    example: 'If you look at the problem from a broader perspective, you will find new solutions.',
  },
  {
    id: 'concession',
    name: '轉折與讓步句型 (Concession & Contrast)',
    formula: 'Although / Even though / While + Clause, Main Clause',
    tip: '表達觀點的深層對比，展現高級邏輯思維。',
    example: 'Although there are subtle differences, both methods yield excellent results.',
  },
  {
    id: 'participle',
    name: '分詞構句 (Participle Construction)',
    formula: 'V-ing / V-ed Phrase, Subject + Verb...',
    tip: '簡化狀語子句，讓文章更加凝練緊湊。',
    example: 'Comprehending the urgency of the matter, she took spontaneous action.',
  },
  {
    id: 'opinion',
    name: '有力論點與想法表達 (Articulating Opinions)',
    formula: 'From my perspective, it is evident that + Clause',
    tip: '清晰表達個人完整觀點與看法。',
    example: 'From my perspective, the ability to articulate thoughts clearly is a crucial career asset.',
  },
];

export const SentenceBuilder: React.FC<Props> = ({ savedWords, prefilledWord }) => {
  const [activeSubTab, setActiveSubTab] = useState<'word-to-sentence' | 'expansion' | 'essay'>('word-to-sentence');

  // SubTab 1: Word to Sentence state
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [selectedPattern, setSelectedPattern] = useState<string>(GRAMMAR_PATTERNS[0].name);
  const [userSentence, setUserSentence] = useState<string>('');
  const [isSentenceLoading, setIsSentenceLoading] = useState<boolean>(false);
  const [sentenceFeedback, setSentenceFeedback] = useState<SentenceFeedback | null>(null);

  // SubTab 2: Expansion state
  const [seedSentence, setSeedSentence] = useState<string>('Technology is changing our daily habits.');
  const [expandedWord, setExpandedWord] = useState<string>('');
  const [isExpanding, setIsExpanding] = useState<boolean>(false);
  const [expansionResult, setExpansionResult] = useState<SentenceFeedback | null>(null);

  // SubTab 3: Essay & Thought Formulation
  const [essayDraft, setEssayDraft] = useState<string>(
    'Learning English is very important today. When I read articles, I sometimes can not understand some words. I want to speak with foreign people naturally and express my ideas clearly.'
  );
  const [essayTopic, setEssayTopic] = useState<string>('My English Learning Journey & Goals');
  const [isEssayLoading, setIsEssayLoading] = useState<boolean>(false);
  const [writingAnalysis, setWritingAnalysis] = useState<WritingAnalysis | null>(null);

  // Microphone recording for speech input
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    if (prefilledWord) {
      setSelectedWord(prefilledWord.word);
      setExpandedWord(prefilledWord.word);
    } else if (savedWords.length > 0 && !selectedWord) {
      setSelectedWord(savedWords[0].word);
      setExpandedWord(savedWords[0].word);
    }
  }, [prefilledWord, savedWords]);

  // Toggle voice recognition
  const toggleRecording = (target: 'sentence' | 'essay') => {
    if (!isSpeechRecognitionSupported()) {
      alert('您的瀏覽器不支援即時語音識別，請直接鍵盤輸入。建議使用 Chrome、Edge 或 Safari。');
      return;
    }

    if (isRecording) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsRecording(false);
      return;
    }

    const initialText = target === 'sentence' ? userSentence : essayDraft;
    const recognizer = createSpeechRecognizer({
      onResult: (transcript) => {
        if (target === 'sentence') {
          setUserSentence(transcript);
        } else {
          setEssayDraft(transcript);
        }
      },
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });

    if (recognizer) {
      if (initialText.trim()) {
        recognizer.setBasePrefix(initialText.trim());
      }
      setRecognitionInstance(recognizer);
      recognizer.start();
      setIsRecording(true);
    }
  };

  // Submit word-to-sentence
  const handleCheckSentence = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userSentence.trim()) return;

    setIsSentenceLoading(true);
    try {
      const res = await fetch('/api/gemini/build-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWords: selectedWord ? [selectedWord] : [],
          userSentence: userSentence.trim(),
          grammarPattern: selectedPattern,
          stage: 'word-to-sentence',
        }),
      });

      if (!res.ok) throw new Error('評估失敗');
      const data: SentenceFeedback = await res.json();
      setSentenceFeedback(data);

      if (selectedWord) {
        const isPassed = data.isCorrect || (data.score && data.score >= 70);
        recordWordPracticeResult(selectedWord, 'writing', Boolean(isPassed));
      }

      if (data.score >= 85) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        } catch (_) {}
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSentenceLoading(false);
    }
  };

  // Submit Expansion
  const handleExpandSentence = async () => {
    if (!seedSentence.trim()) return;

    setIsExpanding(true);
    try {
      const res = await fetch('/api/gemini/build-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWords: expandedWord ? [expandedWord] : [],
          userSentence: seedSentence.trim(),
          grammarPattern: '進階擴寫與語義深化 (Subordinate clauses and rich vocabulary)',
          stage: 'expansion',
        }),
      });

      if (!res.ok) throw new Error('擴寫失敗');
      const data = await res.json();
      setExpansionResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExpanding(false);
    }
  };

  // Submit Essay Polish
  const handlePolishEssay = async () => {
    if (!essayDraft.trim()) return;

    setIsEssayLoading(true);
    try {
      const res = await fetch('/api/gemini/polish-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: essayDraft.trim(),
          targetTopic: essayTopic,
          style: 'articulate and natural',
        }),
      });

      if (!res.ok) throw new Error('批改失敗');
      const data: WritingAnalysis = await res.json();
      setWritingAnalysis(data);

      if (data.score >= 80) {
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
        } catch (_) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEssayLoading(false);
    }
  };

  const currentPatternObj = GRAMMAR_PATTERNS.find((p) => p.name === selectedPattern) || GRAMMAR_PATTERNS[0];

  return (
    <div className="space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setActiveSubTab('word-to-sentence')}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'word-to-sentence'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <PenTool className="w-4 h-4" />
          1. 生字語法造句 (Word to Sentence)
        </button>

        <button
          onClick={() => setActiveSubTab('expansion')}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'expansion'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          2. 句子擴寫與升級 (Sentence Expansion)
        </button>

        <button
          onClick={() => setActiveSubTab('essay')}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'essay'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4" />
          3. 短文精修與口說表達 (Essay & Spoken Thoughts)
        </button>
      </div>

      {/* SUBTAB 1: Word to Sentence */}
      {activeSubTab === 'word-to-sentence' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Configuration & User Input */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-stone-900">第一步：選擇學習生字與語法句型</h3>
              </div>

              {/* Select target word from vocabulary */}
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1.5">
                  目標生字 (可自生字庫選擇或直接輸入)
                </label>
                <div className="flex gap-2">
                  <select
                    id="select-target-word"
                    value={selectedWord}
                    onChange={(e) => setSelectedWord(e.target.value)}
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-stone-400"
                  >
                    <option value="">-- 自生字庫選擇 --</option>
                    {savedWords.map((w) => (
                      <option key={w.id} value={w.word}>
                        {w.word} ({w.translation})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="或自訂單字"
                    value={selectedWord}
                    onChange={(e) => setSelectedWord(e.target.value)}
                    className="w-36 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-stone-400"
                  />
                </div>
              </div>

              {/* Select grammar pattern */}
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1.5">
                  目標語法結構 (Grammar Pattern)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GRAMMAR_PATTERNS.map((pattern) => (
                    <button
                      key={pattern.id}
                      type="button"
                      onClick={() => setSelectedPattern(pattern.name)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                        selectedPattern === pattern.name
                          ? 'border-stone-900 bg-stone-900 text-white font-medium'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="font-semibold leading-tight">{pattern.name}</div>
                      <div className="text-[11px] opacity-80 mt-1 line-clamp-1">{pattern.formula}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formula & Reference Card */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-stone-800 font-semibold">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  句型公式：{currentPatternObj.formula}
                </div>
                <p className="text-stone-600 leading-relaxed">{currentPatternObj.tip}</p>
                <div className="pt-1 text-stone-500 italic flex items-center justify-between">
                  <span>參考範例：{currentPatternObj.example}</span>
                  <button
                    onClick={() => speakText(currentPatternObj.example)}
                    className="p-1 hover:text-stone-800 transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* User sentence input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-600">
                    第二步：嘗試造出完整句子 (鍵盤輸入或麥克風語音輸入)
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleRecording('sentence')}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecording ? '聆聽中 (點擊停止)...' : '語音輸入'}
                  </button>
                </div>

                <textarea
                  id="textarea-user-sentence"
                  rows={3}
                  value={userSentence}
                  onChange={(e) => setUserSentence(e.target.value)}
                  placeholder={`例如：請使用 "${selectedWord || '單字'}" 並依照「${selectedPattern}」造句...`}
                  className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedWord) {
                      setUserSentence(`From my perspective, she is very articulate when expressing thoughts.`);
                    }
                  }}
                  className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                >
                  帶入示範靈感
                </button>

                <button
                  type="button"
                  disabled={isSentenceLoading || !userSentence.trim()}
                  onClick={() => handleCheckSentence()}
                  className="px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  {isSentenceLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      AI 語法診斷中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      立即檢驗語法
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: AI Feedback & Breakdown */}
          <div className="lg:col-span-6 space-y-4">
            {sentenceFeedback ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    {sentenceFeedback.isCorrect ? (
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </span>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">
                        {sentenceFeedback.isCorrect ? '語法正確！' : '語法建議與調整'}
                      </h4>
                      <p className="text-xs text-stone-500">
                        語法正確度評分：<span className="font-semibold text-stone-800">{sentenceFeedback.score} / 100</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => speakText(sentenceFeedback.correctedSentence)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    朗讀示範
                  </button>
                </div>

                {/* Corrected / Polished Sentence */}
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[11px] font-semibold text-stone-400 block">推薦標準句型 (Polished Version)</span>
                  <p className="text-sm font-semibold text-stone-900 leading-relaxed">
                    {sentenceFeedback.correctedSentence}
                  </p>
                </div>

                {/* Grammar Explanation in Traditional Chinese */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-stone-700">語法結構解析 (繁體中文)</span>
                  <p className="text-xs text-stone-600 leading-relaxed bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                    {sentenceFeedback.grammarExplanation}
                  </p>
                </div>

                {/* Syntax components breakdown */}
                {sentenceFeedback.grammarBreakdown && sentenceFeedback.grammarBreakdown.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-stone-700">句子成分剖析 (Sentence Structure)</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {sentenceFeedback.grammarBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-stone-50 border border-stone-100"
                        >
                          <span className="font-mono font-medium text-stone-800">{item.part}</span>
                          <span className="text-[11px] text-stone-500">{item.role}：{item.tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Native Alternatives */}
                {sentenceFeedback.nativeAlternatives && sentenceFeedback.nativeAlternatives.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-stone-700">母語者更地道的說法 (Native Expressions)</span>
                    <div className="space-y-1.5">
                      {sentenceFeedback.nativeAlternatives.map((alt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-950 font-medium"
                        >
                          <span>{alt}</span>
                          <button
                            onClick={() => speakText(alt)}
                            className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spoken Delivery Tip */}
                {sentenceFeedback.spokenDeliveryTip && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs space-y-1">
                    <span className="font-semibold text-amber-900 flex items-center gap-1">
                      🗣️ 口說發音與停頓要訣 (Spoken Delivery)
                    </span>
                    <p className="text-amber-800 leading-relaxed">{sentenceFeedback.spokenDeliveryTip}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-8 text-center h-full flex flex-col items-center justify-center text-stone-500 space-y-2">
                <PenTool className="w-8 h-8 text-stone-300" />
                <p className="text-sm font-medium text-stone-700">等待語法檢驗</p>
                <p className="text-xs text-stone-500 max-w-xs">
                  在左側選擇生字與語法句型並提交句子，AI 將在此即時分析句子成分、時態主謂一致性與母語者表達方式。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: Sentence Expansion */}
      {activeSubTab === 'expansion' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-semibold text-stone-900">句子擴寫：從簡單句到深層思維表達</h3>
            <p className="text-xs text-stone-600 mt-1">
              將簡短的直述句，透過添加從屬子句、轉折連接詞與目標生字，昇華為結構豐富的母語級完整句子。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1.5">
                基礎簡單句 (Seed Sentence)
              </label>
              <textarea
                rows={3}
                value={seedSentence}
                onChange={(e) => setSeedSentence(e.target.value)}
                placeholder="輸入一個簡單句，例如：I want to speak English better."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-stone-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1.5">
                想融入的進階生字
              </label>
              <input
                type="text"
                value={expandedWord}
                onChange={(e) => setExpandedWord(e.target.value)}
                placeholder="例如：articulate, comprehend, perspective"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-stone-400"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                AI 會自動將這個生字以最自然的文法語境融入擴寫後的句子中。
              </p>

              <button
                type="button"
                disabled={isExpanding || !seedSentence.trim()}
                onClick={handleExpandSentence}
                className="mt-3 w-full py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isExpanding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI 擴寫昇華中...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 text-emerald-400" />
                    立即擴寫句子
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expansion Result */}
          {expansionResult && (
            <div className="pt-4 border-t border-stone-100 space-y-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    擴寫升級完成 (Polished & Expanded)
                  </span>
                  <button
                    onClick={() => speakText(expansionResult.correctedSentence)}
                    className="p-1 hover:text-stone-900 transition cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-stone-600" />
                  </button>
                </div>
                <p className="text-base font-medium text-stone-900 leading-relaxed">
                  {expansionResult.correctedSentence}
                </p>
                <p className="text-xs text-stone-600">{expansionResult.grammarExplanation}</p>
              </div>

              {expansionResult.nativeAlternatives && expansionResult.nativeAlternatives.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-stone-700 block mb-2">多種母語風格變體：</span>
                  <div className="space-y-2">
                    {expansionResult.nativeAlternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200 text-sm text-stone-800"
                      >
                        <span>{alt}</span>
                        <button
                          onClick={() => speakText(alt)}
                          className="text-stone-400 hover:text-stone-800 cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: Essay Refinement & Spoken Thoughts */}
      {activeSubTab === 'essay' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Essay Input */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-semibold text-stone-900">文章段落寫作與口說觀點提煉</h3>
                <p className="text-xs text-stone-600 mt-1">
                  寫下或貼上您想表達的想法草稿，AI 會提供全面的語法批改、CEFR等級評估，並整理出能自信口說發表的大綱！
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">寫作主題 (Topic)</label>
                <input
                  type="text"
                  value={essayTopic}
                  onChange={(e) => setEssayTopic(e.target.value)}
                  placeholder="例如：My Views on Remote Work / Favorite Book"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-hidden focus:border-stone-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-600">英文短文或想法草稿</label>
                  <button
                    type="button"
                    onClick={() => toggleRecording('essay')}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecording ? '聆聽語音中...' : '語音聽寫輸入'}
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={essayDraft}
                  onChange={(e) => setEssayDraft(e.target.value)}
                  placeholder="在此輸入您的文章段落..."
                  className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400 focus:bg-white"
                />
              </div>

              <button
                type="button"
                disabled={isEssayLoading || !essayDraft.trim()}
                onClick={handlePolishEssay}
                className="w-full py-3 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isEssayLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    深度寫作診斷中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    精修文章並生成口說大綱
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Writing Analysis & Spoken Presentation Outline */}
          <div className="lg:col-span-6 space-y-4">
            {writingAnalysis ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-5">
                {/* Score & CEFR */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <span className="text-xs text-stone-500 block">綜合寫作評分</span>
                    <span className="text-2xl font-bold text-stone-900">{writingAnalysis.score}</span>
                    <span className="text-xs text-stone-400"> / 100</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">估計 CEFR 等級</span>
                    <span className="text-base font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      {writingAnalysis.cefrLevel}
                    </span>
                  </div>
                </div>

                {/* Polished Native Version */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">母語級修訂版本 (Polished Text)</span>
                    <button
                      onClick={() => speakText(writingAnalysis.nativePolishedVersion)}
                      className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      朗讀全文
                    </button>
                  </div>
                  <p className="text-sm text-stone-900 leading-relaxed font-serif">
                    {writingAnalysis.nativePolishedVersion}
                  </p>
                </div>

                {/* Grammar Issues */}
                {writingAnalysis.grammarIssues && writingAnalysis.grammarIssues.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-stone-800">語法與詞法修正細項：</span>
                    <div className="space-y-2">
                      {writingAnalysis.grammarIssues.map((issue, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="line-through text-rose-700">{issue.original}</span>
                            <ArrowRight className="w-3 h-3 text-stone-400" />
                            <span className="font-semibold text-emerald-800">{issue.correction}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-rose-100 text-rose-800 font-mono">
                              {issue.rule}
                            </span>
                          </div>
                          <p className="text-stone-600">{issue.explanationZh}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spoken Presentation Outline */}
                {writingAnalysis.spokenPresentationOutline && (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        🎙️ 口說觀點發表大綱 (Spoken Thought Outline)
                      </span>
                      <span className="text-[11px] text-emerald-800 font-medium">幫您將文章說成流利的想法</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-emerald-900">開場句 (Opening)：</span>
                        <div className="flex items-center justify-between text-emerald-950 mt-0.5">
                          <span className="italic">"{writingAnalysis.spokenPresentationOutline.openingPhrase}"</span>
                          <button
                            onClick={() => speakText(writingAnalysis.spokenPresentationOutline.openingPhrase)}
                            className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="font-semibold text-emerald-900">核心論點骨幹 (Key Points to Say)：</span>
                        <ul className="list-disc list-inside space-y-1 mt-1 text-emerald-950">
                          {writingAnalysis.spokenPresentationOutline.keyPoints.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-semibold text-emerald-900">總結句 (Closing)：</span>
                        <div className="flex items-center justify-between text-emerald-950 mt-0.5">
                          <span className="italic">"{writingAnalysis.spokenPresentationOutline.closingPhrase}"</span>
                          <button
                            onClick={() => speakText(writingAnalysis.spokenPresentationOutline.closingPhrase)}
                            className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-8 text-center h-full flex flex-col items-center justify-center text-stone-500 space-y-2">
                <PenTool className="w-8 h-8 text-stone-300" />
                <p className="text-sm font-medium text-stone-700">等待文章提交</p>
                <p className="text-xs text-stone-500 max-w-xs">
                  在左側輸入英文短文，AI 將為您精修語法、提升詞彙，並整理成能自信演說的口說發表骨幹。
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
