import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { ListeningItem, VocabWord } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';
import confetti from 'canvas-confetti';

interface Props {
  savedWords: VocabWord[];
  prefilledWord?: VocabWord | null;
}

const DEFAULT_LISTENING: ListeningItem = {
  id: 'listen_default',
  title: 'Mastering the Art of Clear Articulation',
  level: 'B2',
  topic: 'Communication & Learning',
  audioScript:
    'When learning a foreign language, the ability to articulate your thoughts clearly is just as important as knowing thousands of isolated words. From the perspective of cognitive science, our brain needs to comprehend grammatical relationships before we can speak spontaneously. By paying attention to subtle nuances in intonation and sentence structure, you can transform hesitant speech into confident communication.',
  sentences: [
    {
      en: 'When learning a foreign language, the ability to articulate your thoughts clearly is just as important as knowing thousands of isolated words.',
      zh: '學習外語時，清晰表達思想的能力與認識數以千計的孤立單字同等重要。',
      focusWords: ['articulate'],
    },
    {
      en: 'From the perspective of cognitive science, our brain needs to comprehend grammatical relationships before we can speak spontaneously.',
      zh: '從認知科學的角度來看，我們的大腦在能夠自發流暢表達之前，需要先充分理解語法關係。',
      focusWords: ['perspective', 'comprehend', 'spontaneously'],
    },
    {
      en: 'By paying attention to subtle nuances in intonation and sentence structure, you can transform hesitant speech into confident communication.',
      zh: '透過關注語調和句型結構中細微的差異，你能將遲疑的表達轉變為自信的交流。',
      focusWords: ['subtle'],
    },
  ],
  vocabularyList: [
    { word: 'articulate', definition: '清晰表達' },
    { word: 'perspective', definition: '觀點；視角' },
    { word: 'comprehend', definition: '充分理解' },
    { word: 'spontaneously', definition: '自然流暢地；自發地' },
    { word: 'subtle', definition: '細微的' },
  ],
  dictationPractice: [
    {
      sentenceWithBlanks: 'The ability to ________ your thoughts clearly is essential.',
      blanks: ['articulate'],
      hint: '動詞，清晰表達',
    },
    {
      sentenceWithBlanks: 'Our brain needs to ________ grammatical structures before speaking.',
      blanks: ['comprehend'],
      hint: '動詞，充分理解',
    },
    {
      sentenceWithBlanks: 'Pay attention to ________ nuances in intonation.',
      blanks: ['subtle'],
      hint: '形容詞，細微微妙的',
    },
  ],
  comprehensionQuiz: [
    {
      question: 'According to the speaker, what is just as important as knowing thousands of words?',
      options: [
        'Memorizing a grammar dictionary',
        'The ability to articulate thoughts clearly',
        'Passing written exams',
        'Speaking as fast as possible',
      ],
      correctIndex: 1,
      explanationZh: '文章開篇即指出：清晰表達思想的能力與認識數千個單字一樣重要。',
    },
    {
      question: 'What does cognitive science suggest about speaking spontaneously?',
      options: [
        'It requires no grammar understanding',
        'The brain must first comprehend grammatical relationships',
        'It is impossible for adult learners',
        'It only depends on native accent',
      ],
      correctIndex: 1,
      explanationZh: '大腦在能隨興發言之前，必須先理解語法結構之間的關係。',
    },
  ],
};

export const ListeningLab: React.FC<Props> = ({ savedWords, prefilledWord }) => {
  const [currentMaterial, setCurrentMaterial] = useState<ListeningItem>(DEFAULT_LISTENING);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Dictation user inputs
  const [dictationAnswers, setDictationAnswers] = useState<{ [key: number]: string }>({});
  const [dictationChecked, setDictationChecked] = useState(false);

  // Quiz selections
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Play whole audio
  const handlePlayFull = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      setCurrentSentenceIndex(null);
      return;
    }

    setIsPlaying(true);
    speakText(currentMaterial.audioScript, {
      rate: playbackSpeed,
      onEnd: () => {
        setIsPlaying(false);
      },
      onError: () => {
        setIsPlaying(false);
      },
    });
  };

  // Play individual sentence
  const handlePlaySentence = (index: number) => {
    stopSpeaking();
    setCurrentSentenceIndex(index);
    setIsPlaying(true);
    speakText(currentMaterial.sentences[index].en, {
      rate: playbackSpeed,
      onEnd: () => {
        setIsPlaying(false);
        setCurrentSentenceIndex(null);
      },
    });
  };

  // Generate new listening passage with user vocabulary
  const handleGenerateListening = async () => {
    setIsGenerating(true);
    stopSpeaking();
    try {
      const vocabList = savedWords.map((w) => w.word);
      const res = await fetch('/api/gemini/generate-listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Daily Conversation and Professional Insight',
          level: 'B1-B2',
          vocabWords: vocabList.slice(0, 4),
        }),
      });

      if (!res.ok) throw new Error('生成失敗');
      const data = await res.json();
      setCurrentMaterial(data);
      setDictationAnswers({});
      setDictationChecked(false);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setShowTranscript(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Audio Player Controller */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-lg font-bold text-stone-900">{currentMaterial.title}</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                CEFR {currentMaterial.level}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              主題：{currentMaterial.topic} • 融入生字：
              {currentMaterial.vocabularyList.map((v) => v.word).join(', ')}
            </p>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateListening}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-400" />
            )}
            依我的生字生成新聽力篇章
          </button>
        </div>

        {/* Audio Player Bar */}
        <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Play/Pause Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayFull}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer shadow-xs ${
                isPlaying && currentSentenceIndex === null
                  ? 'bg-rose-500 text-white'
                  : 'bg-stone-900 text-white hover:bg-stone-800'
              }`}
            >
              {isPlaying && currentSentenceIndex === null ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <div>
              <span className="text-xs font-bold text-stone-900 block">
                {isPlaying ? '正在播放母語音頻...' : '點擊播放全文朗讀'}
              </span>
              <span className="text-[11px] text-stone-500">支援語速切換與逐句精聽</span>
            </div>
          </div>

          {/* Speed & Transcript Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 text-xs font-medium text-stone-600">
              {[0.75, 1.0, 1.25].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'hover:text-stone-900'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                showTranscript
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {showTranscript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showTranscript ? '隱藏原文' : '顯示原文與翻譯'}
            </button>
          </div>
        </div>

        {/* Transcript Area */}
        {showTranscript && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
              逐句精聽與生字對照 (Sentence-by-sentence Listening)
            </h3>
            <div className="space-y-2">
              {currentMaterial.sentences.map((st, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                    currentSentenceIndex === idx
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-stone-50/50 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-stone-900 leading-relaxed">{st.en}</p>
                    <p className="text-xs text-stone-500">{st.zh}</p>
                  </div>
                  <button
                    onClick={() => handlePlaySentence(idx)}
                    className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer shrink-0"
                    title="單句播放"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dictation (聽寫填空) & Comprehension Quiz (理解測驗) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dictation Practice */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900">聽寫填空練習 (Dictation Practice)</h3>
            <span className="text-xs text-stone-500">考驗耳朵對生字的敏感度</span>
          </div>

          <div className="space-y-4">
            {currentMaterial.dictationPractice.map((item, idx) => {
              const isCorrect =
                dictationChecked &&
                dictationAnswers[idx]?.trim().toLowerCase() === item.blanks[0].toLowerCase();

              return (
                <div key={idx} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-700">第 {idx + 1} 題</span>
                    <button
                      onClick={() => {
                        const targetSentence = item.sentenceWithBlanks.replace('________', item.blanks[0]);
                        speakText(targetSentence, { rate: playbackSpeed });
                      }}
                      className="text-stone-500 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> 聽提示音
                    </button>
                  </div>

                  <p className="text-sm font-mono text-stone-900">{item.sentenceWithBlanks}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="填入聽到的單字"
                      value={dictationAnswers[idx] || ''}
                      onChange={(e) =>
                        setDictationAnswers({ ...dictationAnswers, [idx]: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-stone-400"
                    />
                    <span className="text-[11px] text-stone-400">({item.hint})</span>
                  </div>

                  {dictationChecked && (
                    <div className="pt-1 flex items-center gap-1 font-semibold">
                      {isCorrect ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> 正確！
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> 正確答案：{item.blanks[0]}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              setDictationChecked(true);
              try {
                confetti({ particleCount: 40, spread: 50 });
              } catch (_) {}
            }}
            className="w-full py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition cursor-pointer"
          >
            檢查聽寫答案
          </button>
        </div>

        {/* Comprehension Quiz */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900">聽力理解測驗 (Comprehension Quiz)</h3>
            <span className="text-xs text-stone-500">檢驗篇章細節掌握</span>
          </div>

          <div className="space-y-4">
            {currentMaterial.comprehensionQuiz.map((quiz, qIdx) => (
              <div key={qIdx} className="space-y-2 text-xs">
                <p className="font-semibold text-stone-900 text-sm">{qIdx + 1}. {quiz.question}</p>
                <div className="space-y-1.5">
                  {quiz.options.map((opt, oIdx) => {
                    const isSelected = quizAnswers[qIdx] === oIdx;
                    const isCorrectAnswer = quiz.correctIndex === oIdx;

                    let btnStyle = 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300';
                    if (quizSubmitted) {
                      if (isCorrectAnswer) {
                        btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-50 border-rose-300 text-rose-800';
                      }
                    } else if (isSelected) {
                      btnStyle = 'bg-stone-900 border-stone-900 text-white font-medium';
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [qIdx]: oIdx })}
                        className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <p className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100">
                    解析：{quiz.explanationZh}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setQuizSubmitted(true)}
            className="w-full py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition cursor-pointer"
          >
            提交測驗
          </button>
        </div>
      </div>
    </div>
  );
};
