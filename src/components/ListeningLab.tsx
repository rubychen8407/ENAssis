import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  Clock,
  ArrowRight,
  Check,
  FileText,
  Youtube,
  PlusCircle,
  GraduationCap,
  ListFilter,
  Trash2,
  Radio,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { ListeningItem, VocabWord } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';
import confetti from 'canvas-confetti';
import { CURATED_IELTS_LISTENING_EXAMS, IELTSListeningExam } from '../data/ielts/curatedListeningExams';
import { calculateBandScore, getBandScoreDescriptor, saveIELTSRecord, saveIELTSMistakes } from '../utils/ielts';
import { addWordToVocabulary } from '../utils/storage';
import {
  selectBalancedVocabBatch,
  recordListeningVocabUsage,
} from '../utils/listeningRotation';
import { ListeningToolbar } from './ListeningToolbar';
import { ListeningImportDialog } from './ListeningImportDialog';
import { ListeningReviewFeedback } from './ListeningReviewFeedback';
import {
  analyzeListeningAnswer,
  ListeningItemFeedback,
} from '../utils/listeningErrorAnalysis';

interface Props {
  savedWords: VocabWord[];
  prefilledWord?: VocabWord | null;
  onRecordSaved?: () => void;
  onAddWord?: (word: Partial<VocabWord>) => void;
}

export type ListeningMainMode = 'exam' | 'study';
export type ListeningWorkflowStage = 'source' | 'listening' | 'review';

export interface StudyListeningItem extends Omit<ListeningItem, 'sourceType'> {
  sourceType: 'vocab' | 'imported' | 'curated';
  sourceLabel: string;
  youtubeId?: string;
  audioUrl?: string;
  createdAt?: string;
}

// 預設內建的多樣化精聽教材
const INITIAL_CURATED_STUDY_ITEMS: StudyListeningItem[] = [
  {
    id: 'study_curated_1',
    title: 'Mastering Spoken Nuances & Spontaneous Articulation',
    level: 'B2',
    topic: 'Communication & Cognitive Science',
    sourceType: 'vocab',
    sourceLabel: '生字庫精選',
    audioScript:
      'When acquiring an advanced foreign language, the ability to articulate your thoughts clearly is just as vital as memorizing thousands of isolated terms. From the perspective of cognitive science, our working memory needs to comprehend structural relationships before we can speak spontaneously. By paying conscious attention to subtle variations in intonation, you can transform hesitant speech into fluent and confident communication.',
    sentences: [
      {
        en: 'When acquiring an advanced foreign language, the ability to articulate your thoughts clearly is just as vital as memorizing isolated terms.',
        zh: '在習得進階外語時，清晰表達思想的能力與死記硬背孤立的術語同等重要。',
        focusWords: ['articulate'],
      },
      {
        en: 'From the perspective of cognitive science, our working memory needs to comprehend structural relationships before we can speak spontaneously.',
        zh: '從認知科學的角度來看，我們的工作記憶在能夠自然流暢表達之前，需要先理解結構關係。',
        focusWords: ['perspective', 'comprehend', 'spontaneously'],
      },
      {
        en: 'By paying conscious attention to subtle variations in intonation, you can transform hesitant speech into fluent communication.',
        zh: '透過自覺關注語調中微妙的變化，你能將遲疑的表達轉變為流暢的溝通。',
        focusWords: ['subtle'],
      },
    ],
    vocabularyList: [
      { word: 'articulate', definition: '清晰表達；口齒伶俐地說明' },
      { word: 'perspective', definition: '視角；客觀觀點' },
      { word: 'comprehend', definition: '充分理解；領會' },
      { word: 'spontaneously', definition: '自然流暢地；自發地' },
      { word: 'subtle', definition: '微妙的；細微難察的' },
    ],
    dictationPractice: [
      {
        sentenceWithBlanks: 'The ability to ________ your thoughts clearly is essential in discussions.',
        blanks: ['articulate'],
        hint: '動詞，清晰表達',
      },
      {
        sentenceWithBlanks: 'Working memory needs to ________ structural patterns before speaking.',
        blanks: ['comprehend'],
        hint: '動詞，理解吸收',
      },
      {
        sentenceWithBlanks: 'Pay close attention to ________ variations in pitch and intonation.',
        blanks: ['subtle'],
        hint: '形容詞，微妙細緻的',
      },
    ],
    comprehensionQuiz: [
      {
        question: 'According to the passage, what is just as vital as memorizing isolated vocabulary?',
        options: [
          'Reading classical literature every evening',
          'The ability to articulate thoughts clearly',
          'Passing written grammar exams with high marks',
          'Speaking as fast as possible without pauses',
        ],
        correctIndex: 1,
        explanationZh: '文章第一句明確指出：清晰表達思想的能力與死記單字同等重要。',
      },
      {
        question: 'What does cognitive science suggest about speaking spontaneously?',
        options: [
          'It requires completely ignoring grammatical structure',
          'The working memory must first comprehend structural relationships',
          'Adult learners can never achieve natural fluency',
          'It only relies on memorized set phrases',
        ],
        correctIndex: 1,
        explanationZh: '認知科學指出大腦工作記憶需先掌握結構關係才能自發流暢表達。',
      },
    ],
  },
  {
    id: 'study_curated_2',
    title: 'BBC 6-Minute English: Adapting to Global Climate Shifts',
    level: 'B1',
    topic: 'Environment & Ecology',
    sourceType: 'curated',
    sourceLabel: 'BBC 外部精選',
    audioScript:
      'Welcome to 6 Minute English from BBC Learning English. Today we are discussing how coastal communities around the world are adapting to rising sea levels. Engineers are deploying innovative ecological barriers rather than standard concrete walls. By restoring mangrove forests and coastal wetlands, these regions mitigate flooding while fostering biological diversity. It proves that working with nature is often more effective than battling against it.',
    sentences: [
      {
        en: 'Welcome to 6 Minute English from BBC Learning English.',
        zh: '歡迎收聽 BBC 英語學習的 6 分鐘英語。',
        focusWords: [],
      },
      {
        en: 'Today we are discussing how coastal communities around the world are adapting to rising sea levels.',
        zh: '今天我們要探討世界各地的沿海社區如何適應海平面上升。',
        focusWords: ['adapting'],
      },
      {
        en: 'Engineers are deploying innovative ecological barriers rather than standard concrete walls.',
        zh: '工程師正部署創新的生態屏障，而非標準的水泥高牆。',
        focusWords: ['deploying', 'ecological'],
      },
      {
        en: 'By restoring mangrove forests and coastal wetlands, these regions mitigate flooding while fostering biological diversity.',
        zh: '透過復育紅樹林和沿海濕地，這些地區在減少水患的同時促進了生物多樣性。',
        focusWords: ['mitigate', 'fostering'],
      },
    ],
    vocabularyList: [
      { word: 'deploy', definition: '部署；配置運用' },
      { word: 'mitigate', definition: '緩和；減輕災害' },
      { word: 'foster', definition: '培養；促進' },
      { word: 'barrier', definition: '屏障；阻礙' },
    ],
    dictationPractice: [
      {
        sentenceWithBlanks: 'Engineers are ________ innovative ecological barriers along the shoreline.',
        blanks: ['deploying'],
        hint: '現在分詞，部署運用',
      },
      {
        sentenceWithBlanks: 'Restoring wetlands can ________ urban flood risks effectively.',
        blanks: ['mitigate'],
        hint: '動詞原形，減輕緩和',
      },
    ],
    comprehensionQuiz: [
      {
        question: 'What is the primary advantage of restoring mangrove forests according to the broadcast?',
        options: [
          'It costs much more than concrete barriers',
          'It mitigates flooding and fosters biological diversity',
          'It completely eliminates global sea level rise',
          'It replaces all maritime transport',
        ],
        correctIndex: 1,
        explanationZh: '廣播指出復育紅樹林能減輕水患，同時促進生物多樣性。',
      },
    ],
  },
  {
    id: 'study_curated_3',
    title: 'TED-Ed: The Neurological Power of Bilingualism',
    level: 'B2',
    topic: 'Neuroscience & Education',
    sourceType: 'curated',
    sourceLabel: 'TED 外部精選',
    youtubeId: 'MMmOLN5zBLY',
    audioScript:
      'Did you know that being bilingual can profoundly reshape your cognitive architecture? Decades ago, educators viewed bilingual education as a handicap that hindered child development. Modern neuroimaging, however, demonstrates that constantly switching between two languages strengthens executive function. The prefrontal cortex, which governs decision-making, flexible thinking, and focus, exhibits denser gray matter in multilingual individuals.',
    sentences: [
      {
        en: 'Did you know that being bilingual can profoundly reshape your cognitive architecture?',
        zh: '你知道掌握雙語能深刻重塑你的認知結構嗎？',
        focusWords: ['bilingual', 'profoundly'],
      },
      {
        en: 'Decades ago, educators viewed bilingual education as a handicap that hindered child development.',
        zh: '幾十年前，教育者曾認為雙語教育是一種阻礙孩童發展的障礙。',
        focusWords: ['handicap', 'hindered'],
      },
      {
        en: 'Modern neuroimaging demonstrates that constantly switching between two languages strengthens executive function.',
        zh: '然而現代神經影像學證實，在兩種語言間持續切換能增強大腦的執行功能。',
        focusWords: ['executive'],
      },
      {
        en: 'The prefrontal cortex, which governs decision-making, exhibits denser gray matter in multilingual individuals.',
        zh: '主管決策與專注的前額葉皮質在多語者體內呈現更高密度的灰質。',
        focusWords: ['governs', 'exhibits'],
      },
    ],
    vocabularyList: [
      { word: 'profoundly', definition: '深刻地；極大地' },
      { word: 'handicap', definition: '障礙；不利條件' },
      { word: 'hinder', definition: '阻礙；妨礙' },
      { word: 'executive', definition: '執行的；決策運作的' },
    ],
    dictationPractice: [
      {
        sentenceWithBlanks: 'Bilingual education was once falsely thought to ________ children’s development.',
        blanks: ['hinder'],
        hint: '動詞，阻礙妨害',
      },
      {
        sentenceWithBlanks: 'Switching languages frequently exercises our ________ function in the brain.',
        blanks: ['executive'],
        hint: '形容詞，執行的',
      },
    ],
    comprehensionQuiz: [
      {
        question: 'What does modern neuroimaging reveal about the bilingual brain?',
        options: [
          'It causes severe cognitive overload',
          'It strengthens executive function and prefrontal cortex density',
          'It permanently slows down response times',
          'It decreases grey matter volume',
        ],
        correctIndex: 1,
        explanationZh: '現代神經影像研究顯示，雙語轉換能顯著增強前額葉執行功能與灰質密度。',
      },
    ],
  },
  {
    id: 'study_curated_4',
    title: 'Cambridge Campus Guide: University Facilities & Services',
    level: 'B1',
    topic: 'Campus Life & Orientation',
    sourceType: 'curated',
    sourceLabel: '校園生活實用精選',
    audioScript:
      'Welcome to our campus orientation tour for international scholars. Our central library is accessible twenty-four hours a day with your electronic student pass. If you require interlibrary loan services or access to academic journals, the multimedia reference desk on the second floor can provide immediate guidance. Furthermore, private study pods are reservable up to one week in advance through the online portal.',
    sentences: [
      {
        en: 'Welcome to our campus orientation tour for international scholars.',
        zh: '歡迎參加我們為國際學者舉辦的校園迎新導覽。',
        focusWords: ['orientation'],
      },
      {
        en: 'Our central library is accessible twenty-four hours a day with your electronic student pass.',
        zh: '憑電子學生證即可全天候 24 小時出入中央圖書館。',
        focusWords: ['accessible'],
      },
      {
        en: 'If you require interlibrary loan services, the multimedia reference desk on the second floor can provide immediate guidance.',
        zh: '若您需要館際互借服務，二樓的多媒體諮詢櫃台可提供即時指導。',
        focusWords: ['guidance'],
      },
      {
        en: 'Private study pods are reservable up to one week in advance through the online portal.',
        zh: '個人獨立自習艙可透過線上系統最多提前一週預約。',
        focusWords: ['reservable'],
      },
    ],
    vocabularyList: [
      { word: 'orientation', definition: '新生訓練；迎新導覽' },
      { word: 'accessible', definition: '可使用的；可抵達的' },
      { word: 'guidance', definition: '指引；指導' },
      { word: 'reservable', definition: '可預訂的' },
    ],
    dictationPractice: [
      {
        sentenceWithBlanks: 'All digital library archives are readily ________ via student credentials.',
        blanks: ['accessible'],
        hint: '形容詞，可取用的',
      },
    ],
    comprehensionQuiz: [
      {
        question: 'How far in advance can students reserve private study pods?',
        options: ['One month', 'One week', 'Twenty-four hours', 'Only on the day of arrival'],
        correctIndex: 1,
        explanationZh: '導覽清楚說明個人自習艙可透過線上入口網站最多提前一週（one week in advance）預約。',
      },
    ],
  },
];

const LOCAL_STORAGE_KEY_STUDY_ITEMS = 'ielts_study_listening_materials';

export const ListeningLab: React.FC<Props> = ({
  savedWords,
  onRecordSaved,
}) => {
  // 1. 主模式 (Exam Mode vs Study Mode)
  const [mainMode, setMainMode] = useState<ListeningMainMode>('exam');

  // 2. 階段工作流 (來源選擇階段 -> 正式聆聽與作答階段 -> 檢查答案與全文解析反饋)
  const [workflowStage, setWorkflowStage] = useState<ListeningWorkflowStage>('source');

  // 3. 右下角垂直懸浮工具列觸發之 Dialog
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // 4. 音訊播放共用狀態
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const nativeAudioRef = useRef<HTMLAudioElement>(null);

  // 隨手加入生字回饋
  const [addedWordSuccess, setAddedWordSuccess] = useState<string | null>(null);
  const [quickVocabInput, setQuickVocabInput] = useState('');

  // ----------------------------------------------------
  // Exam Mode State
  // ----------------------------------------------------
  const [selectedExamId, setSelectedExamId] = useState<string>(CURATED_IELTS_LISTENING_EXAMS[0].id);
  const [customExams, setCustomExams] = useState<IELTSListeningExam[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examSectionFilter, setExamSectionFilter] = useState<string>('all');
  const [examTimer, setExamTimer] = useState<number>(600); // 10 minutes
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [examFeedbacks, setExamFeedbacks] = useState<ListeningItemFeedback[]>([]);
  const [examScoreResult, setExamScoreResult] = useState<{
    correctCount: number;
    totalCount: number;
    bandScore: number;
    timeSpentSeconds: number;
  } | null>(null);

  const allExams = useMemo(() => {
    return [...customExams, ...CURATED_IELTS_LISTENING_EXAMS];
  }, [customExams]);

  const currentExam = useMemo(() => {
    return allExams.find((e) => e.id === selectedExamId) || allExams[0];
  }, [allExams, selectedExamId]);

  // ----------------------------------------------------
  // Study Mode State
  // ----------------------------------------------------
  const [studyItems, setStudyItems] = useState<StudyListeningItem[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_STUDY_ITEMS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((item) => item.id));
          const additions = INITIAL_CURATED_STUDY_ITEMS.filter((item) => !existingIds.has(item.id));
          return [...parsed, ...additions];
        }
      }
    } catch (e) {
      console.error('Failed to load stored study listenings', e);
    }
    return INITIAL_CURATED_STUDY_ITEMS;
  });

  const [selectedStudyId, setSelectedStudyId] = useState<string>(INITIAL_CURATED_STUDY_ITEMS[0].id);
  const [studyFilter, setStudyFilter] = useState<'all' | 'vocab' | 'imported' | 'curated'>('all');
  const [vocabBatchOffset, setVocabBatchOffset] = useState<number>(0);

  // 聽寫與測驗作答
  const [studyDictationAnswers, setStudyDictationAnswers] = useState<Record<number, string>>({});
  const [studyQuizAnswers, setStudyQuizAnswers] = useState<Record<number, number>>({});
  const [studyFeedbacks, setStudyFeedbacks] = useState<ListeningItemFeedback[]>([]);
  const [studyScoreResult, setStudyScoreResult] = useState<{
    correctCount: number;
    totalCount: number;
    accuracyPercentage: number;
  } | null>(null);

  const currentStudyItem = useMemo(() => {
    return studyItems.find((item) => item.id === selectedStudyId) || studyItems[0];
  }, [studyItems, selectedStudyId]);

  // 生字庫輪轉計算
  const { selectedWords: currentTargetWords, stats: vocabCoverageStats } = useMemo(() => {
    return selectBalancedVocabBatch(savedWords, 4, vocabBatchOffset);
  }, [savedWords, vocabBatchOffset]);

  // 清除播放
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const stopAllAudio = () => {
    stopSpeaking();
    setIsPlaying(false);
    setCurrentSentenceIndex(null);
    if (nativeAudioRef.current) {
      nativeAudioRef.current.pause();
    }
  };

  // 計時器
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && examTimer > 0 && workflowStage === 'listening') {
      interval = setInterval(() => {
        setExamTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, examTimer, workflowStage]);

  // 模式切換
  const handleToggleMainMode = () => {
    stopAllAudio();
    setMainMode((prev) => (prev === 'exam' ? 'study' : 'exam'));
    setWorkflowStage('source'); // 換模式時回到來源選擇階段
  };

  // 持久化儲存 Study Items
  const saveStudyItemsList = (items: StudyListeningItem[]) => {
    setStudyItems(items);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_STUDY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save study items', e);
    }
  };

  // 刪除自訂篇章
  const handleDeleteStudyItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = studyItems.filter((it) => it.id !== id);
    saveStudyItemsList(filtered);
    if (selectedStudyId === id && filtered.length > 0) {
      setSelectedStudyId(filtered[0].id);
    }
  };

  // 隨手加入生字
  const handleSaveWordToVocab = (word: string, def: string) => {
    if (!word.trim()) return;
    addWordToVocabulary({
      word: word.trim(),
      phonetic: '',
      partOfSpeech: 'n./v./adj.',
      translation: def.trim() || '聽力練習中記錄之生字',
      definitionEn: def.trim() || 'Saved during listening practice session',
      collocations: [],
      exampleEn: `Extracted from listening session: "${mainMode === 'exam' ? currentExam.title : currentStudyItem.title}"`,
      exampleZh: '',
      grammarNotes: 'Extracted from listening practice',
      masteryLevel: 'new',
    });
    setAddedWordSuccess(word.trim());
    setTimeout(() => setAddedWordSuccess(null), 2500);
    onRecordSaved?.();
  };

  const handleQuickAddWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickVocabInput.trim()) return;
    handleSaveWordToVocab(quickVocabInput.trim(), '隨堂快速標註生字');
    setQuickVocabInput('');
  };

  // ----------------------------------------------------
  // 音訊播放控制
  // ----------------------------------------------------
  const handleTogglePlayExam = () => {
    if (isPlaying) {
      stopAllAudio();
      return;
    }
    setIsPlaying(true);
    if (!isTimerRunning) setIsTimerRunning(true);

    const fullScript = `${currentExam.audioPrompt}\n\n${currentExam.audioScript}`;
    speakText(fullScript, {
      rate: playbackSpeed,
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const handleTogglePlayStudy = () => {
    if (isPlaying) {
      stopAllAudio();
      return;
    }
    if (currentStudyItem.audioUrl && nativeAudioRef.current) {
      nativeAudioRef.current.playbackRate = playbackSpeed;
      nativeAudioRef.current.play();
      setIsPlaying(true);
      return;
    }
    setIsPlaying(true);
    speakText(currentStudyItem.audioScript, {
      rate: playbackSpeed,
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const handlePlaySentence = (text: string, index: number) => {
    stopSpeaking();
    setCurrentSentenceIndex(index);
    setIsPlaying(true);
    speakText(text, {
      rate: playbackSpeed,
      onEnd: () => {
        setIsPlaying(false);
        setCurrentSentenceIndex(null);
      },
    });
  };

  // ----------------------------------------------------
  // 流程推進：從來源階段進到正式聆聽階段
  // ----------------------------------------------------
  const handleEnterListeningStage = () => {
    stopAllAudio();
    if (mainMode === 'exam') {
      setExamAnswers({});
      setExamTimer(600);
      setIsTimerRunning(false);
      setExamFeedbacks([]);
    } else {
      setStudyDictationAnswers({});
      setStudyQuizAnswers({});
      setStudyFeedbacks([]);
    }
    setWorkflowStage('listening');
  };

  // ----------------------------------------------------
  // 流程推進：下一步（交卷或檢查聽寫，解析正確與錯誤類型）
  // ----------------------------------------------------
  const handleExamNextSubmitAndReview = () => {
    stopAllAudio();
    setIsTimerRunning(false);

    let correctCount = 0;
    const feedbacks: ListeningItemFeedback[] = [];
    const wrongIds: string[] = [];

    currentExam.questions.forEach((q) => {
      const userAns = examAnswers[q.id] || '';
      const fb = analyzeListeningAnswer(
        q.id,
        q.questionNumber,
        userAns,
        q.correctAnswer,
        q.prompt,
        q.locatingSentence,
        q.explanationZh
      );

      if (fb.isCorrect) {
        correctCount += 1;
      } else {
        wrongIds.push(q.id);
      }
      feedbacks.push(fb);
    });

    const totalCount = currentExam.questions.length;
    const bandScore = calculateBandScore(correctCount, totalCount);
    const timeSpentSeconds = Math.max(10, 600 - examTimer);

    setExamScoreResult({
      correctCount,
      totalCount,
      bandScore,
      timeSpentSeconds,
    });
    setExamFeedbacks(feedbacks);

    // 儲存至 Dashboard
    saveIELTSRecord({
      id: `ielts_listen_${Date.now()}`,
      examId: currentExam.id,
      examTitle: `[IELTS 聽力] ${currentExam.title}`,
      category: 'Listening',
      date: new Date().toLocaleDateString('zh-TW'),
      score: correctCount,
      totalQuestions: totalCount,
      percentage: Math.round((correctCount / totalCount) * 100),
      bandScore,
      timeSpentSeconds,
      mode: 'mock',
      userAnswers: examAnswers,
      wrongQuestionIds: wrongIds,
    });

    // 錯題本儲存
    if (wrongIds.length > 0) {
      const mistakesToSave = currentExam.questions
        .filter((q) => wrongIds.includes(q.id))
        .map((q) => ({
          id: `mistake_listen_${Date.now()}_${q.id}`,
          examId: currentExam.id,
          examTitle: `[IELTS 聽力] ${currentExam.title}`,
          questionId: q.id,
          questionNumber: String(q.questionNumber),
          userAnswer: examAnswers[q.id] || '（未填寫）',
          correctAnswer: q.correctAnswer,
          explanation: `${q.explanationZh} 定位句: "${q.locatingSentence}"`,
          kind: `${currentExam.section} 聽力題`,
          date: new Date().toLocaleDateString('zh-TW'),
        }));
      saveIELTSMistakes(mistakesToSave);
    }

    onRecordSaved?.();
    setWorkflowStage('review');

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handleStudyNextCheckAndReview = () => {
    stopAllAudio();

    let correctCount = 0;
    const feedbacks: ListeningItemFeedback[] = [];
    const dictationList = currentStudyItem.dictationPractice || [];

    dictationList.forEach((d, idx) => {
      const userAns = studyDictationAnswers[idx] || '';
      const targetAns = d.blanks[0] || '';
      const fb = analyzeListeningAnswer(
        `dictation_${idx}`,
        idx + 1,
        userAns,
        targetAns,
        d.sentenceWithBlanks,
        undefined,
        d.hint ? `提示：${d.hint}` : undefined
      );

      if (fb.isCorrect) correctCount += 1;
      feedbacks.push(fb);
    });

    // 若有 Quiz 題目也納入分析
    const quizList = currentStudyItem.comprehensionQuiz || [];
    quizList.forEach((q, qIdx) => {
      const chosenIdx = studyQuizAnswers[qIdx];
      const isAnsCorrect = chosenIdx === q.correctIndex;
      const userChoiceText = chosenIdx !== undefined ? q.options[chosenIdx] : '';
      const correctChoiceText = q.options[q.correctIndex];

      if (isAnsCorrect) correctCount += 1;

      feedbacks.push({
        id: `quiz_${qIdx}`,
        itemNumber: `Q${qIdx + 1}`,
        prompt: q.question,
        userAnswer: userChoiceText || '（未選取）',
        correctAnswer: correctChoiceText,
        isCorrect: isAnsCorrect,
        errorType: isAnsCorrect ? 'correct' : 'distractor_trap',
        errorTypeLabel: isAnsCorrect ? '完全正確' : '干擾項陷阱 / 細節理解錯誤',
        badgeColor: isAnsCorrect
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
          : 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300 border-red-300',
        coachFeedback: isAnsCorrect
          ? '優秀！準確掌握了聽力全文的主旨與深層含義。'
          : '理解偏差或受干擾選項誤導。請參閱解析並重新回顧該段落上下文。',
        explanationZh: q.explanationZh,
      });
    });

    const totalCount = dictationList.length + quizList.length;
    const accuracyPercentage = Math.round((correctCount / Math.max(1, totalCount)) * 100);

    setStudyScoreResult({
      correctCount,
      totalCount,
      accuracyPercentage,
    });
    setStudyFeedbacks(feedbacks);
    setWorkflowStage('review');

    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.7 },
    });
  };

  // ----------------------------------------------------
  // 篩選考試或研讀來源
  // ----------------------------------------------------
  const filteredExams = useMemo(() => {
    if (examSectionFilter === 'all') return allExams;
    if (examSectionFilter === 'custom') return customExams;
    return allExams.filter((ex) => ex.section === examSectionFilter);
  }, [allExams, customExams, examSectionFilter]);

  const filteredStudyItems = useMemo(() => {
    if (studyFilter === 'all') return studyItems;
    return studyItems.filter((it) => it.sourceType === studyFilter);
  }, [studyItems, studyFilter]);

  return (
    <div className="space-y-6 pb-20">
      {/* ======================================================== */}
      {/* 階段一：選擇來源階段 (Source Selection Stage) */}
      {/* 注意：此階段只顯示來源選擇，先不要顯示題目或練習！ */}
      {/* ======================================================== */}
      {workflowStage === 'source' && (
        <div className="space-y-6 animate-fade-in">
          {/* 階段提示指示器 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  階段 1 / 3 · 選擇題庫與教材來源
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                {mainMode === 'exam' ? '選擇雅思聽力考卷套卷' : '選擇精聽教材篇章'}
              </h2>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* Exam Mode 來源選擇清單 */}
          {/* ---------------------------------------------------- */}
          {mainMode === 'exam' && (
            <div className="space-y-4">
              {/* Section 快速分類標籤 */}
              <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 dark:bg-stone-800/60 p-1.5 rounded-2xl">
                {[
                  { id: 'all', label: '全部考卷' },
                  { id: 'Section 1', label: 'Section 1 (生活諮詢)' },
                  { id: 'Section 2', label: 'Section 2 (公共設施)' },
                  { id: 'Section 3', label: 'Section 3 (學術討論)' },
                  { id: 'Section 4', label: 'Section 4 (學術演講)' },
                  { id: 'custom', label: '外部抓取題組' },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setExamSectionFilter(sec.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      examSectionFilter === sec.id
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>

              {/* 考卷卡片格線 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExams.map((ex) => {
                  const isSelected = ex.id === selectedExamId;
                  return (
                    <div
                      key={ex.id}
                      onClick={() => setSelectedExamId(ex.id)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-500 shadow-md ring-2 ring-amber-500/20'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                            {ex.section}
                          </span>
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> 建議 10-15 分鐘
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                          {ex.title}
                        </h3>

                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                          {ex.topic} · {ex.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-600 dark:text-stone-400">
                          題目數：<b>{ex.questions.length} 題</b>
                        </span>
                        {isSelected && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> 已選定此卷
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 底部確認按鈕條 (選完來源後點按進到正式聆聽階段) */}
              <div className="p-4 rounded-2xl bg-stone-900 text-white dark:bg-stone-800 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div>
                  <span className="text-xs text-stone-400">已選定考卷：</span>
                  <p className="text-sm font-bold text-stone-100">
                    {currentExam.section} · {currentExam.title} (共 {currentExam.questions.length} 題)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleEnterListeningStage}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm shadow-md transition cursor-pointer"
                >
                  確認選擇，進入正式聆聽階段
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* Study Mode 來源選擇清單 */}
          {/* ---------------------------------------------------- */}
          {mainMode === 'study' && (
            <div className="space-y-4">
              {/* 頂部分類與生字覆蓋率提示 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 dark:bg-stone-800/60 p-1.5 rounded-2xl">
                  {[
                    { id: 'all', label: '全部篇章' },
                    { id: 'vocab', label: '生字庫生成' },
                    { id: 'curated', label: '官方精選' },
                    { id: 'imported', label: '外部匯入' },
                  ].map((flt) => (
                    <button
                      key={flt.id}
                      type="button"
                      onClick={() => setStudyFilter(flt.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        studyFilter === flt.id
                          ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>

                {/* 生字庫覆蓋率簡報 */}
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 self-start sm:self-auto">
                  <Sparkles className="w-3.5 h-3.5" />
                  生字庫聽力覆蓋率：{vocabCoverageStats.coveredWordsCount}/{vocabCoverageStats.totalWords} ({vocabCoverageStats.coveragePercentage}%)
                </div>
              </div>

              {/* 篇章卡片格線 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudyItems.map((item) => {
                  const isSelected = item.id === selectedStudyId;
                  const isCustom = item.sourceType !== 'curated';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedStudyId(item.id)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-500 shadow-md ring-2 ring-amber-500/20'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                              {item.sourceLabel}
                            </span>
                            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                              CEFR {item.level}
                            </span>
                          </div>

                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteStudyItem(item.id, e)}
                              className="p-1 text-stone-400 hover:text-rose-500 transition cursor-pointer"
                              title="刪除此自訂篇章"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                          {item.title}
                        </h3>

                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                          主題：{item.topic}
                        </p>

                        {/* 涵蓋重點單字 Chips */}
                        {item.vocabularyList && item.vocabularyList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.vocabularyList.slice(0, 4).map((w, wIdx) => (
                              <span
                                key={wIdx}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                              >
                                {w.word}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                        <span className="text-stone-500 dark:text-stone-400">
                          句數：{item.sentences?.length || 0} 句 · 聽寫：{item.dictationPractice?.length || 0} 題
                        </span>
                        {isSelected && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> 已選定此篇
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 底部確認按鈕條 (選完來源後點按進到正式聆聽階段) */}
              <div className="p-4 rounded-2xl bg-stone-900 text-white dark:bg-stone-800 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div>
                  <span className="text-xs text-stone-400">已選定篇章：</span>
                  <p className="text-sm font-bold text-stone-100">
                    {currentStudyItem.title} ({currentStudyItem.sourceLabel})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleEnterListeningStage}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm shadow-md transition cursor-pointer"
                >
                  確認選擇，進入正式聆聽階段
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 階段二：正式聆聽階段 (Formal Listening Stage) */}
      {/* 聆聽階段會有播放器跟調速器，下面會有題目跟生字加入！ */}
      {/* ======================================================== */}
      {workflowStage === 'listening' && (
        <div className="space-y-6 animate-fade-in">
          {/* 頂部導航條：可返回更換來源 */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                stopAllAudio();
                setWorkflowStage('source');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              返回更換來源清單
            </button>

            <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
              階段 2 / 3 · 正式聆聽與作答中
            </div>
          </div>

          {/* 1. 頂部核心：播放器跟調速器 (Player & Speed Controller) */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                    {mainMode === 'exam' ? currentExam.section : currentStudyItem.sourceLabel}
                  </span>
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                    {mainMode === 'exam' ? '考場音訊控制台' : `CEFR ${currentStudyItem.level}`}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {mainMode === 'exam' ? currentExam.title : currentStudyItem.title}
                </h2>
              </div>

              {/* Exam Mode 計時器 */}
              {mainMode === 'exam' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0 self-start sm:self-auto">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-mono font-black text-stone-900 dark:text-stone-100">
                    {Math.floor(examTimer / 60)}:{String(examTimer % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* 若為 YouTube 影片 */}
            {mainMode === 'study' && currentStudyItem.youtubeId && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xs bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${currentStudyItem.youtubeId}?rel=0`}
                  title={currentStudyItem.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* 若有自帶原生音訊 URL */}
            {mainMode === 'study' && currentStudyItem.audioUrl && !currentStudyItem.youtubeId && (
              <audio
                ref={nativeAudioRef}
                controls
                src={currentStudyItem.audioUrl}
                className="w-full h-10 rounded-xl outline-none"
              />
            )}

            {/* 播放按鈕與調速器整合面板 */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={mainMode === 'exam' ? handleTogglePlayExam : handleTogglePlayStudy}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer shadow-md ${
                    isPlaying
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-amber-400 hover:bg-amber-300 text-stone-950 font-black'
                  }`}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                    {isPlaying ? '音訊播送中...' : '點擊播放音訊'}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    一邊聆聽，一邊在下方作答並標記生字
                  </span>
                </div>
              </div>

              {/* 調速器 (Speed Controller) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                  播放調速器：
                </span>
                <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-800 p-1 rounded-xl">
                  {[0.75, 0.9, 1.0, 1.1, 1.25].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => {
                        setPlaybackSpeed(spd);
                        if (nativeAudioRef.current) {
                          nativeAudioRef.current.playbackRate = spd;
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 shadow-xs'
                          : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 下面會有題目跟生字加入 (Questions & Add Vocab Below) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 左側欄 (Col 7)：題目作答區 */}
            <div className="lg:col-span-7 space-y-5">
              {/* Exam Mode 題目作答 */}
              {mainMode === 'exam' && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      考卷題目 (Questions 1 - {currentExam.questions.length})
                    </h3>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      作答完成後點按下方下一步進行校對
                    </span>
                  </div>

                  <div className="space-y-4">
                    {currentExam.questions.map((q) => {
                      const userVal = examAnswers[q.id] || '';

                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 dark:bg-stone-800/40 dark:border-stone-700 space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-stone-900 text-white dark:bg-amber-400 dark:text-stone-950 text-xs font-black flex items-center justify-center shrink-0">
                              {q.questionNumber}
                            </span>
                            <div className="flex-1 space-y-3">
                              <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                                {q.prompt}
                              </p>

                              {/* 填空題輸入 */}
                              {q.type === 'fill_blank' && (
                                <input
                                  type="text"
                                  placeholder="輸入你聽到的答案..."
                                  value={userVal}
                                  onChange={(e) =>
                                    setExamAnswers({ ...examAnswers, [q.id]: e.target.value })
                                  }
                                  className="w-full max-w-sm px-3.5 py-2 rounded-xl text-xs font-bold outline-none border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-400"
                                />
                              )}

                              {/* 選擇題選項 */}
                              {q.type === 'choice' && q.options && (
                                <div className="grid grid-cols-1 gap-2">
                                  {q.options.map((opt, oIdx) => {
                                    const isSelected = userVal === opt;
                                    return (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        onClick={() =>
                                          setExamAnswers({ ...examAnswers, [q.id]: opt })
                                        }
                                        className={`px-3.5 py-2.5 rounded-xl text-xs text-left font-medium transition cursor-pointer ${
                                          isSelected
                                            ? 'bg-stone-900 text-white dark:bg-amber-400 dark:text-stone-950 font-bold shadow-xs'
                                            : 'bg-white border border-stone-200 hover:border-stone-300 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 下一步按鈕 */}
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      下一步將檢查作答、核算成績，並顯示全文解析。
                    </span>
                    <button
                      type="button"
                      onClick={handleExamNextSubmitAndReview}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm shadow-md transition cursor-pointer"
                    >
                      下一步：檢查答案並顯示全文解析
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Study Mode 題目練習 (聽寫填空與理解測驗) */}
              {mainMode === 'study' && (
                <div className="space-y-5">
                  {/* 1. 聽寫練習 (Dictation Cloze) */}
                  {currentStudyItem.dictationPractice && currentStudyItem.dictationPractice.length > 0 && (
                    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-500" />
                          聽寫練習 (Dictation Practice)
                        </h3>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          依據音訊內容將挖空單字拼出
                        </span>
                      </div>

                      <div className="space-y-3">
                        {currentStudyItem.dictationPractice.map((item, idx) => {
                          return (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2"
                            >
                              <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                                {idx + 1}. {item.sentenceWithBlanks}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="輸入聽到的單字..."
                                  value={studyDictationAnswers[idx] || ''}
                                  onChange={(e) =>
                                    setStudyDictationAnswers({
                                      ...studyDictationAnswers,
                                      [idx]: e.target.value,
                                    })
                                  }
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold outline-none border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-400"
                                />
                                {item.hint && (
                                  <span className="text-[11px] text-stone-400">
                                    提示：{item.hint}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. 篇章理解測驗 (Comprehension Quiz) */}
                  {currentStudyItem.comprehensionQuiz && currentStudyItem.comprehensionQuiz.length > 0 && (
                    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-500" />
                          篇章理解測驗 (Comprehension Quiz)
                        </h3>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          測試文章主旨與關鍵細節
                        </span>
                      </div>

                      <div className="space-y-3">
                        {currentStudyItem.comprehensionQuiz.map((q, qIdx) => {
                          const selectedOptIdx = studyQuizAnswers[qIdx];

                          return (
                            <div
                              key={qIdx}
                              className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2.5"
                            >
                              <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                {qIdx + 1}. {q.question}
                              </p>

                              <div className="grid grid-cols-1 gap-1.5">
                                {q.options.map((opt, oIdx) => {
                                  const isChosen = selectedOptIdx === oIdx;

                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      onClick={() =>
                                        setStudyQuizAnswers({
                                          ...studyQuizAnswers,
                                          [qIdx]: oIdx,
                                        })
                                      }
                                      className={`px-3 py-2 rounded-xl text-xs text-left transition cursor-pointer flex items-center justify-between ${
                                        isChosen
                                          ? 'bg-stone-900 text-white font-bold dark:bg-amber-400 dark:text-stone-950'
                                          : 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                                      }`}
                                    >
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 下一步按鈕 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      完成後進入下一步，核對聽寫拼寫並查看全文詳細解析。
                    </span>
                    <button
                      type="button"
                      onClick={handleStudyNextCheckAndReview}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm shadow-md transition cursor-pointer"
                    >
                      下一步：檢查聽寫答案並顯示全文內容
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 右側欄 (Col 5)：生字即時加入面板 */}
            <div className="lg:col-span-5 space-y-5">
              {/* 1. 隨手記錄陌生生字快速輸入列 */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    隨聽隨記陌生生字
                  </h3>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  聆聽過程中聽到不熟悉的單字，可立即鍵入並收錄至個人生字本。
                </p>

                <form onSubmit={handleQuickAddWordSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={quickVocabInput}
                    onChange={(e) => setQuickVocabInput(e.target.value)}
                    placeholder="輸入聽到的英文單字..."
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-stone-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    加入生字本
                  </button>
                </form>

                {addedWordSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 animate-fade-in">
                    <Check className="w-3.5 h-3.5" />
                    單字 &ldquo;{addedWordSuccess}&rdquo; 已成功收錄至生字簿！
                  </div>
                )}
              </div>

              {/* 2. 本篇目標生字列表 (Study Mode 目標生字或 Exam 核心考點) */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    本篇核心關鍵字與生詞
                  </h3>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {(mainMode === 'exam'
                    ? [
                        { word: 'accommodation', definition: '住宿；膳宿設施' },
                        { word: 'reservation', definition: '預約；保留' },
                        { word: 'reference', definition: '推薦信；參考' },
                      ]
                    : currentStudyItem.vocabularyList || []
                  ).map((voc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {voc.word}
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 ml-2">
                          {voc.definition}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveWordToVocab(voc.word, voc.definition)}
                        className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-stone-950 font-bold shrink-0 cursor-pointer text-[11px] inline-flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" /> 加入
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 階段三：檢查答案並顯示全文內容，解析正確與錯誤類型反饋 */}
      {/* (Review, Full Transcript & Pedagogical Error Breakdown) */}
      {/* ======================================================== */}
      {workflowStage === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setWorkflowStage('listening')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              返回重聽音訊與檢查
            </button>

            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              階段 3 / 3 · 全文解析與錯誤診斷
            </span>
          </div>

          <ListeningReviewFeedback
            mode={mainMode}
            title={mainMode === 'exam' ? currentExam.title : currentStudyItem.title}
            topic={mainMode === 'exam' ? currentExam.topic : currentStudyItem.topic}
            sectionOrSourceLabel={
              mainMode === 'exam' ? currentExam.section : currentStudyItem.sourceLabel
            }
            bandScore={examScoreResult?.bandScore}
            correctCount={
              mainMode === 'exam'
                ? examScoreResult?.correctCount || 0
                : studyScoreResult?.correctCount || 0
            }
            totalCount={
              mainMode === 'exam'
                ? examScoreResult?.totalCount || currentExam.questions.length
                : studyScoreResult?.totalCount || 1
            }
            timeSpentSeconds={examScoreResult?.timeSpentSeconds}
            accuracyPercentage={studyScoreResult?.accuracyPercentage}
            feedbacks={mainMode === 'exam' ? examFeedbacks : studyFeedbacks}
            fullScript={
              mainMode === 'exam' ? currentExam.audioScript : currentStudyItem.audioScript
            }
            sentences={
              mainMode === 'exam'
                ? undefined
                : currentStudyItem.sentences
            }
            vocabularyList={
              mainMode === 'study'
                ? currentStudyItem.vocabularyList
                : undefined
            }
            onPlaySentence={handlePlaySentence}
            playingSentenceIndex={currentSentenceIndex}
            onSaveWordToVocab={handleSaveWordToVocab}
            addedWordSuccess={addedWordSuccess}
            onReListen={() => {
              stopAllAudio();
              setWorkflowStage('listening');
            }}
            onBackToSources={() => {
              stopAllAudio();
              setWorkflowStage('source');
            }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 外部匯入 / 生成工具 Dialog (點按右下角 Floating Toolbar 時出現) */}
      {/* ======================================================== */}
      <ListeningImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        mode={mainMode}
        savedWords={savedWords}
        targetVocabBatch={currentTargetWords}
        vocabCoverageStats={vocabCoverageStats}
        onNextVocabBatch={() => setVocabBatchOffset((prev) => prev + 1)}
        onVocabGenerated={(newItem) => {
          recordListeningVocabUsage(newItem.targetWords || []);
          const updated = [newItem, ...studyItems];
          saveStudyItemsList(updated);
          setSelectedStudyId(newItem.id);
          setWorkflowStage('source');
        }}
        onSourceImported={(newItem) => {
          const updated = [newItem, ...studyItems];
          saveStudyItemsList(updated);
          setSelectedStudyId(newItem.id);
          setWorkflowStage('source');
        }}
        onExamCreated={(newExam) => {
          setCustomExams((prev) => [newExam, ...prev]);
          setSelectedExamId(newExam.id);
          setWorkflowStage('source');
        }}
      />

      {/* ======================================================== */}
      {/* Material Design 3 右下角垂直懸浮工具列 (與 VocabToolbar 樣式保持一致) */}
      {/* ======================================================== */}
      <ListeningToolbar
        mode={mainMode}
        onToggleMode={handleToggleMainMode}
        onOpenImportDialog={() => setIsImportDialogOpen(true)}
        stage={workflowStage}
        onBackToSources={() => {
          stopAllAudio();
          setWorkflowStage('source');
        }}
      />
    </div>
  );
};
