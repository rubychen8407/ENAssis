import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  Award,
  AlertCircle,
  HelpCircle,
  Check,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Volume2,
  Plus,
  FileText,
} from 'lucide-react';
import { IELTSExam, IELTSMistakeItem, IELTSRecord } from '../../types/ielts';
import { calculateBandScore, getBandScoreDescriptor, saveIELTSRecord, saveIELTSMistakes } from '../../utils/ielts';
import { speakText } from '../../utils/speech';
import { addWordToVocabulary } from '../../utils/storage';

interface Props {
  exam: IELTSExam;
  onBackToBank: () => void;
  onViewFlashExplanations: () => void;
  onWordAdded?: () => void;
}

export const IELTSExamArena: React.FC<Props> = ({
  exam,
  onBackToBank,
  onViewFlashExplanations,
  onWordAdded,
}) => {
  // Timer state (20 minutes = 1200 seconds for single passage)
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(1); // 0: sm, 1: base, 2: lg

  // User answers & flags
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // Highlighted spans in reading passage
  const [activeTabPanel, setActiveTabPanel] = useState<'split' | 'passage' | 'questions'>('split');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Score report modal state
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<IELTSRecord | null>(null);
  const [activeExplanationQ, setActiveExplanationQ] = useState<string | null>(null);

  // Passage container ref
  const passageRef = useRef<HTMLDivElement>(null);

  // Timer interval
  useEffect(() => {
    if (!isTimerRunning || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, isSubmitted]);

  // All question IDs
  const allQuestionIds = useMemo(() => {
    if (exam.questionOrder && exam.questionOrder.length > 0) {
      return exam.questionOrder;
    }
    return Object.keys(exam.answerKey);
  }, [exam]);

  // Clean passage HTML helper to remove legacy interactive dropzones and leave clean paragraph markers
  const sanitizedPassageHtml = useMemo(() => {
    let html = exam.passageHtml || '';
    // Replace legacy dropzones with clean paragraph indicators if needed
    html = html.replace(/<div class="paragraph-dropzone[^>]*>[\s\S]*?<\/div>/gi, '');
    return html;
  }, [exam.passageHtml]);

  // Handle Answer Change
  const handleAnswerChange = (qId: string, value: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: value.trim(),
    }));
  };

  // Toggle flag
  const toggleFlag = (qId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Submit test and grade
  const handleSubmitTest = () => {
    if (isSubmitted) return;

    let correctCount = 0;
    const wrongIds: string[] = [];
    const mistakes: IELTSMistakeItem[] = [];

    allQuestionIds.forEach((qId) => {
      const standardAns = (exam.answerKey[qId] || '').trim().toLowerCase();
      const userAns = (userAnswers[qId] || '').trim().toLowerCase();

      // Flexible matching for headings (e.g. "viii", "8", "VIII") or exact answers
      const isMatch = standardAns === userAns || standardAns.replace(/\s+/g, '') === userAns.replace(/\s+/g, '');

      if (isMatch && userAns.length > 0) {
        correctCount++;
      } else {
        wrongIds.push(qId);

        // Find explanation if available
        let explanationText = '本題考查關鍵詞定位與同義改寫理解。';
        if (exam.explanations) {
          for (const e of exam.explanations) {
            if (e.questionId === qId && e.text) {
              explanationText = e.text;
              break;
            }
            if (e.items && Array.isArray(e.items)) {
              const matchedItem = e.items.find((item: any) => item?.questionId === qId);
              if (matchedItem && (matchedItem.text || e.text)) {
                explanationText = matchedItem.text || e.text;
                break;
              }
            }
          }
        }

        mistakes.push({
          id: `${exam.id}_${qId}_${Date.now()}`,
          examId: exam.id,
          examTitle: exam.title,
          questionId: qId,
          questionNumber: exam.questionDisplayMap?.[qId] || qId.replace('q', ''),
          userAnswer: userAnswers[qId] || '(未填答)',
          correctAnswer: exam.answerKey[qId] || '',
          explanation: explanationText,
          kind: exam.questionGroups.find((g) => g.questionIds.includes(qId))?.kind || '雅思題型',
          date: new Date().toLocaleDateString('zh-TW'),
        });
      }
    });

    const total = allQuestionIds.length;
    const band = calculateBandScore(correctCount, total);
    const timeSpent = 20 * 60 - timeLeft;

    const record: IELTSRecord = {
      id: `record_${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      category: exam.category,
      date: new Date().toLocaleDateString('zh-TW'),
      score: correctCount,
      totalQuestions: total,
      percentage: Math.round((correctCount / total) * 100),
      bandScore: band,
      timeSpentSeconds: timeSpent > 0 ? timeSpent : 1,
      mode: 'mock',
      userAnswers: { ...userAnswers },
      wrongQuestionIds: wrongIds,
    };

    saveIELTSRecord(record);
    if (mistakes.length > 0) {
      saveIELTSMistakes(mistakes);
    }

    setScoreResult(record);
    setIsSubmitted(true);
    setIsTimerRunning(false);
  };

  // Quick word lookup from reading text
  const handlePassageMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      return;
    }
    const txt = sel.toString().trim();
    if (txt && txt.length > 1 && txt.length < 35 && !txt.includes('\n')) {
      setSelectedWord(txt);
    }
  };

  // Add selected word from text to vocab
  const handleAddSelectedWord = () => {
    if (!selectedWord) return;
    addWordToVocabulary({
      word: selectedWord,
      phonetic: '',
      partOfSpeech: 'n./v.',
      translation: '雅思真題閱讀生字',
      definitionEn: '',
      collocations: [],
      exampleEn: `From IELTS exam: ${exam.title}`,
      exampleZh: '',
      grammarNotes: `真題篇目：${exam.title}`,
      masteryLevel: 'new',
      tags: ['IELTS-Reading', exam.category],
    });
    if (onWordAdded) onWordAdded();
    setSelectedWord(null);
  };

  // Format time (mm:ss)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Font size class mapping
  const fontSizeClass =
    fontSizeLevel === 0 ? 'text-xs' : fontSizeLevel === 2 ? 'text-base leading-relaxed' : 'text-sm leading-relaxed';

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[640px] bg-stone-100/80 rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Top Header & Exam Controls */}
      <div className="bg-white px-5 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            id="btn-arena-back"
            onClick={onBackToBank}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition cursor-pointer"
            title="返回題庫"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-900 text-white font-mono">
                {exam.category}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                {exam.frequency}
              </span>
              <h2 className="text-sm font-bold text-stone-900 truncate max-w-xs sm:max-w-md">
                {exam.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Center Timer & Controls */}
        <div className="flex items-center gap-4">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
              timeLeft < 180
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                : 'bg-stone-50 text-stone-800 border-stone-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>{formatTime(timeLeft)}</span>
            {!isSubmitted && (
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-[10px] text-stone-500 hover:text-stone-900 underline ml-1 cursor-pointer"
              >
                {isTimerRunning ? '暫停' : '繼續'}
              </button>
            )}
          </div>

          {/* Font Zoom buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-stone-100 rounded-xl p-1 border border-stone-200">
            <button
              onClick={() => setFontSizeLevel((prev) => Math.max(0, prev - 1))}
              disabled={fontSizeLevel === 0}
              className="p-1 rounded text-stone-600 hover:text-stone-900 disabled:opacity-40 cursor-pointer"
              title="縮小字體"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 font-semibold text-stone-700">字級</span>
            <button
              onClick={() => setFontSizeLevel((prev) => Math.min(2, prev + 1))}
              disabled={fontSizeLevel === 2}
              className="p-1 rounded text-stone-600 hover:text-stone-900 disabled:opacity-40 cursor-pointer"
              title="放大字體"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Flash review shortcut */}
          <button
            id="btn-arena-flash-review"
            onClick={onViewFlashExplanations}
            className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            背題定位精析
          </button>

          {/* Submit Test Button */}
          {!isSubmitted ? (
            <button
              id="btn-arena-submit-test"
              onClick={handleSubmitTest}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              交卷判分
            </button>
          ) : (
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              檢視成績單
            </button>
          )}
        </div>
      </div>

      {/* Selected word popover helper */}
      {selectedWord && (
        <div className="bg-stone-900 text-white px-4 py-2 flex items-center justify-between text-xs z-30 shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-amber-300">“{selectedWord}”</span>
            <span className="text-stone-400 text-[11px]">已選取此詞彙</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => speakText(selectedWord, { rate: 0.85 })}
              className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3 h-3 text-stone-300" /> 發音
            </button>
            <button
              onClick={handleAddSelectedWord}
              className="px-2.5 py-1 rounded bg-amber-400 text-stone-950 font-bold hover:bg-amber-300 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> 加入生字庫
            </button>
            <button
              onClick={() => setSelectedWord(null)}
              className="text-stone-400 hover:text-white ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Mobile panel switcher */}
      <div className="flex md:hidden bg-stone-200 p-1 border-b border-stone-300 text-xs font-semibold">
        <button
          onClick={() => setActiveTabPanel('passage')}
          className={`flex-1 py-1.5 rounded-lg text-center ${
            activeTabPanel === 'passage' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
          }`}
        >
          閱讀原文 (Passage)
        </button>
        <button
          onClick={() => setActiveTabPanel('questions')}
          className={`flex-1 py-1.5 rounded-lg text-center ${
            activeTabPanel === 'questions' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
          }`}
        >
          答題面板 (Questions)
        </button>
      </div>

      {/* Main Split Body: Left Passage & Right Questions */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Reading Passage Panel */}
        <div
          ref={passageRef}
          onMouseUp={handlePassageMouseUp}
          className={`w-full md:w-1/2 h-full overflow-y-auto p-6 md:p-8 border-r border-stone-200/80 bg-white select-text ${
            activeTabPanel === 'questions' ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="pb-3 border-b border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 tracking-wider uppercase font-mono">
                READING PASSAGE
              </span>
              <h1 className="text-xl font-serif font-bold text-stone-900 mt-1">{exam.title}</h1>
              <p className="text-xs text-stone-500 mt-1">
                You should spend about 20 minutes on Questions 1–{allQuestionIds.length}, which are based on this Reading Passage.
              </p>
            </div>

            {/* Passage HTML Content with styles */}
            <div
              className={`prose prose-stone max-w-none text-stone-800 ${fontSizeClass} [&>div]:mb-5 [&_p]:mb-4 [&_strong]:text-stone-900 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3`}
              dangerouslySetInnerHTML={{ __html: sanitizedPassageHtml }}
            />
          </div>
        </div>

        {/* Right Questions Panel */}
        <div
          className={`w-full md:w-1/2 h-full overflow-y-auto p-6 md:p-8 bg-stone-50/70 ${
            activeTabPanel === 'passage' ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="max-w-xl mx-auto space-y-8 pb-20">
            {exam.questionGroups.map((group, gIdx) => {
              return (
                <div
                  key={group.groupId || gIdx}
                  className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-4"
                >
                  <div className="border-b border-stone-100 pb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 uppercase font-mono">
                      Question Group {gIdx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 mt-1">
                      {group.kind === 'matching'
                        ? 'Matching Questions (配對題)'
                        : group.kind === 'true_false_not_given'
                        ? 'True / False / Not Given (真假未提及判斷)'
                        : group.kind === 'yes_no_not_given'
                        ? 'Yes / No / Not Given (作者觀點判斷)'
                        : group.kind === 'single_choice'
                        ? 'Multiple Choice (單項選擇題)'
                        : 'Summary / Table Completion (填空題)'}
                    </h3>
                  </div>

                  {/* Group description / instruction text */}
                  {group.bodyHtml && (
                    <div
                      className="text-xs text-stone-700 leading-relaxed bg-stone-50/80 p-3.5 rounded-xl border border-stone-100 prose-sm [&_h4]:font-bold [&_h4]:text-stone-900 [&_ul]:list-disc [&_ul]:pl-4 [&_strong]:text-stone-900"
                      dangerouslySetInnerHTML={{
                        __html: group.bodyHtml
                          .replace(/<input[^>]*>/gi, '') // Strip inline HTML inputs so our custom inputs handle them cleanly
                          .replace(/<div class="tfng-options"[\s\S]*?<\/div>/gi, '')
                          .replace(/<div class="radio-options"[\s\S]*?<\/div>/gi, ''),
                      }}
                    />
                  )}

                  {/* Custom interactive answering controls for each question in this group */}
                  <div className="space-y-4 pt-2">
                    {group.questionIds.map((qId) => {
                      const displayNum = exam.questionDisplayMap?.[qId] || qId.replace('q', '');
                      const userAns = userAnswers[qId] || '';
                      const isFlagged = flaggedQuestions.has(qId);
                      const standardAns = exam.answerKey[qId] || '';

                      return (
                        <div
                          key={qId}
                          id={`question-item-${qId}`}
                          className={`p-4 rounded-xl border transition ${
                            isFlagged
                              ? 'bg-amber-50/60 border-amber-200'
                              : userAns
                              ? 'bg-white border-stone-300'
                              : 'bg-white border-stone-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                                {displayNum}
                              </span>
                              <span className="text-xs font-semibold text-stone-900">
                                題目 {displayNum}
                              </span>
                            </div>

                            <button
                              onClick={() => toggleFlag(qId)}
                              className={`p-1 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer ${
                                isFlagged
                                  ? 'text-amber-600 bg-amber-100/70 font-semibold'
                                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                              }`}
                              title="標記本題以便稍後檢查"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span className="text-[10px]">{isFlagged ? '已標記' : '標記'}</span>
                            </button>
                          </div>

                          {/* Render corresponding answer controls based on kind */}
                          {group.kind === 'true_false_not_given' ? (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAnswerChange(qId, opt)}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                                    userAns.toUpperCase() === opt
                                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          ) : group.kind === 'yes_no_not_given' ? (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {['YES', 'NO', 'NOT GIVEN'].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAnswerChange(qId, opt)}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                                    userAns.toUpperCase() === opt
                                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          ) : group.kind === 'single_choice' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                              {['A', 'B', 'C', 'D'].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAnswerChange(qId, opt)}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                                    userAns.toUpperCase() === opt
                                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                                  }`}
                                >
                                  選項 {opt}
                                </button>
                              ))}
                            </div>
                          ) : group.kind === 'matching' && standardAns.length <= 4 ? (
                            <div className="space-y-1.5 mt-2">
                              <label className="text-[11px] text-stone-500 font-medium">
                                選擇配對項目 (羅馬數字/字母選項)：
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(
                                  (opt) => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => handleAnswerChange(qId, opt)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                                        userAns.toLowerCase() === opt.toLowerCase()
                                          ? 'bg-stone-900 text-white border-stone-900'
                                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={userAns}
                                onChange={(e) => handleAnswerChange(qId, e.target.value)}
                                placeholder="在此輸入答案 (如 i, viii, 或單字填空)..."
                                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition"
                              />
                            </div>
                          )}

                          {/* Post-submit inline check */}
                          {isSubmitted && (
                            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                {userAns.toLowerCase() === standardAns.toLowerCase() ? (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 正確
                                  </span>
                                ) : (
                                  <span className="text-rose-700 font-bold flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> 答錯 (標準答案: {standardAns})
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => setActiveExplanationQ(qId)}
                                className="text-stone-600 hover:text-stone-900 underline text-[11px] font-medium cursor-pointer"
                              >
                                查看解析
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Question Navigator Bar */}
      <div className="bg-white border-t border-stone-200 px-4 py-2.5 flex items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[11px] font-mono text-stone-400 font-semibold shrink-0 hidden sm:inline">
            題號導航:
          </span>
          {allQuestionIds.map((qId, idx) => {
            const displayNum = exam.questionDisplayMap?.[qId] || String(idx + 1);
            const isAnswered = Boolean(userAnswers[qId]);
            const isFlagged = flaggedQuestions.has(qId);
            const standardAns = exam.answerKey[qId] || '';
            const isCorrect = isSubmitted && userAnswers[qId]?.toLowerCase() === standardAns.toLowerCase();

            return (
              <button
                key={qId}
                onClick={() => {
                  setActiveTabPanel('questions');
                  const el = document.getElementById(`question-item-${qId}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition cursor-pointer relative shrink-0 ${
                  isSubmitted
                    ? isCorrect
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                    : isFlagged
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : isAnswered
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
                }`}
                title={`題目 ${displayNum}${isAnswered ? ' (已答)' : ' (未答)'}${isFlagged ? ' (已標記)' : ''}`}
              >
                {displayNum}
                {isFlagged && !isSubmitted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-0.5 right-0.5" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-stone-500">
            已答：
            <strong className="text-stone-900">
              {Object.values(userAnswers).filter(Boolean).length}
            </strong>{' '}
            / {allQuestionIds.length}
          </span>
          {!isSubmitted && (
            <button
              onClick={handleSubmitTest}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              交卷
            </button>
          )}
        </div>
      </div>

      {/* Score Result Modal */}
      {isSubmitted && scoreResult && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center pb-6 border-b border-stone-100">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                雅思學術組閱讀成績換算
              </span>
              <h2 className="text-4xl font-serif font-black text-stone-900 mt-2">
                Band {scoreResult.bandScore.toFixed(1)}
              </h2>
              <p className="text-xs font-semibold text-emerald-700 mt-1">
                {getBandScoreDescriptor(scoreResult.bandScore)}
              </p>
            </div>

            {/* Score details grid */}
            <div className="grid grid-cols-3 gap-3 my-6 text-center">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                <span className="text-[10px] text-stone-500 block font-medium">答對題數</span>
                <span className="text-lg font-bold text-stone-900">
                  {scoreResult.score} / {scoreResult.totalQuestions}
                </span>
              </div>
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                <span className="text-[10px] text-stone-500 block font-medium">正確率</span>
                <span className="text-lg font-bold text-stone-900">{scoreResult.percentage}%</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                <span className="text-[10px] text-stone-500 block font-medium">耗時</span>
                <span className="text-lg font-bold text-stone-900 font-mono">
                  {Math.floor(scoreResult.timeSpentSeconds / 60)}m {scoreResult.timeSpentSeconds % 60}s
                </span>
              </div>
            </div>

            {scoreResult.wrongQuestionIds.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2 mb-6">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    已將 {scoreResult.wrongQuestionIds.length} 道錯題收錄至「錯題本」！
                  </span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    系統已標記錯題題型與考點，隨時可在錯題本進行針對性突破。
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center mb-6">
                🎉 全對滿分！您對該篇雅思題型的定位與替換詞把握極其精準。
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition cursor-pointer"
              >
                查看答題卷與試題
              </button>
              <button
                onClick={onViewFlashExplanations}
                className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                進入背題定位精析
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Question Explanation Modal */}
      {activeExplanationQ && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-stone-900">
                  題目 {exam.questionDisplayMap?.[activeExplanationQ] || activeExplanationQ} 解析
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold">
                  標準答案: {exam.answerKey[activeExplanationQ]}
                </span>
              </div>
              <button
                onClick={() => setActiveExplanationQ(null)}
                className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
              >
                關閉
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-stone-700">
              {(() => {
                const expl = exam.explanations?.find((e) => e.questionId === activeExplanationQ);
                if (expl && expl.text) {
                  return (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 whitespace-pre-line font-sans">
                      {expl.text}
                    </div>
                  );
                }
                return (
                  <p className="text-stone-500 italic">
                    本題標準答案為「{exam.answerKey[activeExplanationQ]}」。請在左側文章中檢視對應段落與關鍵詞替換。
                  </p>
                );
              })()}
            </div>

            <div className="mt-5 pt-3 border-t border-stone-100 text-right">
              <button
                onClick={() => setActiveExplanationQ(null)}
                className="px-4 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-semibold cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
