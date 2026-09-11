import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileEdit,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  PenTool,
  Play,
  RefreshCw,
  RotateCcw,
  Scissors,
  Search,
  Sparkles,
  Target,
  Wand2,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { WritingAnalysis } from '../../types';
import {
  IELTSWritingPrompt,
  IELTS_WRITING_PROMPTS,
  Task1LizCategory,
  Task2LizCategory,
  WritingPromptTask,
} from '../../data/ielts/writingPrompts';
import {
  IELTS_PARAGRAPH_PEEL_FORMULA,
  IELTS_PLANNING_STEPS,
  IELTS_TASK1_FATAL_TRAPS,
  IELTS_TASK1_PREPARATION_STEPS,
  IELTS_TASK1_VISUAL_TYPES,
  IELTS_TASK2_ESSAY_TYPES,
  Task1VisualTypeInfo,
  Task2EssayTypeInfo,
} from '../../data/ielts/ieltsLizMethodology';
import { toTraditionalChinese } from '../../utils/chineseConverter';
import { saveIELTSWritingRecord, getGeneralSettings } from '../../utils/ielts';
import { IELTSWritingRecord } from '../../types/ielts';
import { WritingCopilotPane, StepMeta } from './WritingCopilotPane';

export interface ModeBStepAdvice {
  stepIndex: number;
  stepName: string;
  conciseDiagnosis: string;
  wordinessVerdict: {
    hasFillers: boolean;
    fillers: {
      phrase: string;
      fix: string;
      reason: string;
    }[];
  };
  polishedText: string;
  lexicalUpgrades: {
    original: string;
    upgraded: string;
    note: string;
  }[];
  lizKeyRuleCheck: {
    passed: boolean;
    tip: string;
  };
  actionPoint: string;
}

export interface ModeBStepStarters {
  stepIndex: number;
  stepName: string;
  starters: {
    title: string;
    text: string;
    rationale: string;
  }[];
}

interface Props {
  selectedPromptId: string;
  onPromptChange: (promptId: string) => void;
}

export type WritingStage = 'select-task' | 'select-prompt' | 'writing' | 'feedback';

const CRITERIA_INFO = [
  { key: 'taskResponse', labelEn: 'Task Response / Achievement', labelZh: '任務回應與完成度', desc: 'Task 1 檢查是否具備無數據 Overview 與精確分組；Task 2 檢查立場一致性與論證充分度。' },
  { key: 'coherenceCohesion', labelEn: 'Coherence & Cohesion', labelZh: '連貫性與銜接結構', desc: '段落切分邏輯、主題句銜接、以及連接詞（Linking words）的自然多樣使用。' },
  { key: 'lexicalResource', labelEn: 'Lexical Resource', labelZh: '詞彙資源與多樣性', desc: '學術高分詞彙、搭配詞（Collocations）、精確語意與拼字正確度。' },
  { key: 'grammar', labelEn: 'Grammatical Range & Accuracy', labelZh: '語法範圍與準確度', desc: '複雜句構、被動語態、時態一致性與標點符號運用。' },
] as const;

export const IELTSWritingStudio: React.FC<Props> = ({ selectedPromptId, onPromptChange }) => {
  // 4-Phase System State
  const [currentStage, setCurrentStage] = useState<WritingStage>('select-task');
  const [task, setTask] = useState<WritingPromptTask>('task1');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false); // Default collapsed toolbar
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [targetBand, setTargetBand] = useState<string>(() => {
    const settings = getGeneralSettings();
    return settings?.targetScores?.writing ? settings.targetScores.writing.toFixed(1) : '7.0';
  });
  const [recordSavedToast, setRecordSavedToast] = useState(false);

  // Custom Prompt support
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);
  const [customPromptTitle, setCustomPromptTitle] = useState('我的雅思自訂題目');
  const [customPromptText, setCustomPromptText] = useState('');

  // Prompts filter
  const taskPrompts = useMemo(() => {
    return IELTS_WRITING_PROMPTS.filter((p) => p.task === task);
  }, [task]);

  const filteredPrompts = useMemo(() => {
    return taskPrompts.filter((p) => {
      const matchCategory = categoryFilter === 'all' || p.lizCategory === categoryFilter;
      const matchSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lizCategory.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [taskPrompts, categoryFilter, searchQuery]);

  const activePrompt = useMemo(() => {
    const found = IELTS_WRITING_PROMPTS.find((p) => p.id === selectedPromptId);
    if (found && found.task === task) return found;
    return filteredPrompts[0] || taskPrompts[0] || IELTS_WRITING_PROMPTS[0];
  }, [selectedPromptId, task, filteredPrompts, taskPrompts]);

  // Keep selected prompt valid when task switches
  useEffect(() => {
    if (activePrompt && activePrompt.id !== selectedPromptId && !isCustomPrompt) {
      onPromptChange(activePrompt.id);
    }
  }, [task, activePrompt, selectedPromptId, isCustomPrompt, onPromptChange]);

  // Timed essay state
  const defaultSeconds = task === 'task1' ? 20 * 60 : 40 * 60;
  const [timerSeconds, setTimerSeconds] = useState(defaultSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [fullDraft, setFullDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
  const [copiedPolished, setCopiedPolished] = useState(false);

  // Step-by-step drafting state
  const [activeGuidedStep, setActiveGuidedStep] = useState(0);
  const [task1Steps, setTask1Steps] = useState({ 0: '', 1: '', 2: '', 3: '' });
  const [task2Steps, setTask2Steps] = useState({ 0: '', 1: '', 2: '', 3: '', 4: '' });
  const [modeBAdvices, setModeBAdvices] = useState<Record<number, ModeBStepAdvice>>({});
  const [modeBStarters, setModeBStarters] = useState<Record<number, ModeBStepStarters>>({});
  const [isModeBAdviceLoading, setIsModeBAdviceLoading] = useState(false);
  const [isModeBStartersLoading, setIsModeBStartersLoading] = useState(false);

  // Image Modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  // Reset timer on task switch
  useEffect(() => {
    setTimerSeconds(task === 'task1' ? 20 * 60 : 40 * 60);
    setIsTimerRunning(false);
    setActiveGuidedStep(0);
  }, [task]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const currentWordCount = useMemo(() => {
    if (!fullDraft.trim()) return 0;
    return fullDraft.trim().split(/\s+/).filter(Boolean).length;
  }, [fullDraft]);

  const paragraphCount = useMemo(() => {
    if (!fullDraft.trim()) return 0;
    return fullDraft.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  }, [fullDraft]);

  const minWordsRequired = task === 'task1' ? 150 : 250;
  const recommendedMaxWords = task === 'task1' ? 200 : 300;

  // Real-time wordiness filler detector
  const FILLER_PATTERNS = useMemo(
    () => [
      'in this modern world',
      'in this modern era',
      'it goes without saying that',
      'needless to say',
      'at the end of the day',
      'every coin has two sides',
      'with the rapid development of',
      'as far as i am concerned',
      'it is a well known fact that',
      'in a nutshell',
      'all in all',
      'in today’s society',
      'in todays society',
    ],
    []
  );

  const detectedFillers = useMemo(() => {
    if (!fullDraft) return [];
    const lower = fullDraft.toLowerCase();
    return FILLER_PATTERNS.filter((phrase) => lower.includes(phrase));
  }, [fullDraft, FILLER_PATTERNS]);

  // Step Metas for Task 1 and Task 2
  const currentTask1Info = useMemo(() => {
    return (
      IELTS_TASK1_VISUAL_TYPES.find((v) => v.id === activePrompt.lizCategory) ||
      IELTS_TASK1_VISUAL_TYPES[0]
    );
  }, [activePrompt]);

  const currentTask2Info = useMemo(() => {
    return (
      IELTS_TASK2_ESSAY_TYPES.find((e) => e.id === activePrompt.lizCategory) ||
      IELTS_TASK2_ESSAY_TYPES[0]
    );
  }, [activePrompt]);

  const stepMetas: StepMeta[] = useMemo(() => {
    if (task === 'task1') {
      return [
        {
          index: 0,
          title: '改寫題目 (Introduction)',
          focus: '題目改寫 (Paraphrasing)',
          tips: '用 1–2 句話換詞改寫題幹。點出圖表類型、描述的數據主體、對象與年份。',
          goldenRule: '嚴禁抄襲原題字眼，活用同義詞（shows -> illustrates, proportion of -> percentage of）。',
        },
        {
          index: 1,
          title: '總結主要特徵 (Overview)',
          focus: '核心概述 (Main Features / Trends)',
          tips: '概括 2–3 個整體最宏觀特徵（如整體上升趨勢、始終最高者、最大變更）。',
          goldenRule: '★ 絕對不能包含任何具體數值！若出現具體數字，TA 分數會被嚴重扣分。',
        },
        {
          index: 2,
          title: '第一組細節 (Detail Body 1)',
          focus: '第一組數據或較高類別',
          tips: `${currentTask1Info.bodyParagraphTips.split('；')[0] || '描述較高或上升趨勢的類別'}。提供精準起點與峰值。`,
          goldenRule: '必須有精確數據佐證，避免個人猜測原因。',
        },
        {
          index: 3,
          title: '第二組細節 (Detail Body 2)',
          focus: '第二組數據與鮮明對比',
          tips: `${currentTask1Info.bodyParagraphTips.split('；')[1] || '描述落後或相反趨勢的類別'}。善用 whereas, in contrast。`,
          goldenRule: '做好數據對比，避免流水帳報數字。',
        },
      ];
    } else {
      return [
        {
          index: 0,
          title: '5分鐘構思與大綱 (Planning & Stance)',
          focus: '審題、立場與 2 大論點',
          tips: '確定立場 (Agree / Disagree / Both sides)。構思 Body 1 與 Body 2 的核心理由與事例。',
          goldenRule: '立場必須自始至終完全一致，不可模稜兩可。',
        },
        {
          index: 1,
          title: '引言段 (Introduction)',
          focus: '改寫背景 + 宣示立場 (Thesis Statement)',
          tips: '第 1 句改寫題目話題背景；第 2 句開門見山表明立場 (I firmly agree that...)。',
          goldenRule: '引言段必須清晰亮出 Thesis Statement！',
        },
        {
          index: 2,
          title: '主體段 1 (Body 1 PEEL)',
          focus: '第一個核心論點與深入展開',
          tips: '遵循 PEEL：Point (主題句) → Explain (因果解釋) → Example (具體事例) → Link (扣題)。',
          goldenRule: '一單一段落只專注於 1 個深刻論點，並給出充分的 Why。',
        },
        {
          index: 3,
          title: '主體段 2 (Body 2 PEEL)',
          focus: '第二個核心論點或對立觀點探討',
          tips: '從另一角度（社會/經濟/個人）展開第二個論點，或探討雙邊觀點與深入駁斥。',
          goldenRule: '雙邊討論題必須公平深入討論兩方觀點。',
        },
        {
          index: 4,
          title: '結論段 (Conclusion)',
          focus: '重申立場 + 歸納要點',
          tips: '換句話說重申立場，濃縮 Body 1 與 Body 2 的主旨。',
          goldenRule: '嚴禁在結論段提出任何未曾討論過的新觀點！',
        },
      ];
    }
  }, [task, currentTask1Info]);

  const getCurrentStepText = (stepIdx: number) => {
    return task === 'task1' ? (task1Steps as any)[stepIdx] || '' : (task2Steps as any)[stepIdx] || '';
  };

  const updateCurrentStepText = (stepIdx: number, text: string) => {
    if (task === 'task1') {
      setTask1Steps((prev) => ({ ...prev, [stepIdx]: text }));
    } else {
      setTask2Steps((prev) => ({ ...prev, [stepIdx]: text }));
    }
  };

  const completedStepsCount = useMemo(() => {
    const drafts = task === 'task1' ? task1Steps : task2Steps;
    return stepMetas.filter((s) => Boolean((drafts as any)[s.index]?.trim())).length;
  }, [task, task1Steps, task2Steps, stepMetas]);

  const handleMergeGuidedDrafts = () => {
    if (task === 'task1') {
      const parts = [task1Steps[0], task1Steps[1], task1Steps[2], task1Steps[3]].filter((p) => p && p.trim());
      setFullDraft(parts.join('\n\n'));
    } else {
      const parts = [task2Steps[1], task2Steps[2], task2Steps[3], task2Steps[4]].filter((p) => p && p.trim());
      setFullDraft(parts.join('\n\n'));
    }
  };

  const handleSyncStepToFullDraft = (stepIdx: number) => {
    const text = getCurrentStepText(stepIdx).trim();
    if (!text) return;
    if (!fullDraft.trim()) {
      setFullDraft(text);
    } else {
      setFullDraft((prev) => prev.trim() + '\n\n' + text);
    }
  };

  // AI Step Advice handler
  const handleGetModeBAdvice = async (stepIdx: number) => {
    const text = getCurrentStepText(stepIdx).trim();
    if (!text) return;
    setErrorMessage(null);
    setIsModeBAdviceLoading(true);
    try {
      const stepMeta = stepMetas[stepIdx] || stepMetas[0];
      const res = await fetch('/api/gemini/ielts-mode-b-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'evaluate',
          ieltsTask: task,
          stepIndex: stepIdx,
          stepName: stepMeta.title,
          prompt: isCustomPrompt ? customPromptText : activePrompt.prompt,
          targetBand: Number(targetBand),
          draftText: text,
          visualType: task === 'task1' ? activePrompt.lizCategory : undefined,
          essayType: task === 'task2' ? activePrompt.lizCategory : undefined,
        }),
      });
      if (!res.ok) throw new Error('AI 考官單段診斷連線異常。');
      const data: ModeBStepAdvice = await res.json();
      const cleanData: ModeBStepAdvice = {
        stepIndex: data.stepIndex,
        stepName: data.stepName,
        conciseDiagnosis: toTraditionalChinese(data.conciseDiagnosis || ''),
        wordinessVerdict: {
          hasFillers: Boolean(data.wordinessVerdict?.hasFillers),
          fillers: (data.wordinessVerdict?.fillers || []).map((f) => ({
            phrase: f.phrase,
            fix: toTraditionalChinese(f.fix || ''),
            reason: toTraditionalChinese(f.reason || ''),
          })),
        },
        polishedText: data.polishedText || text,
        lexicalUpgrades: (data.lexicalUpgrades || []).map((u) => ({
          original: u.original,
          upgraded: u.upgraded,
          note: toTraditionalChinese(u.note || ''),
        })),
        lizKeyRuleCheck: {
          passed: Boolean(data.lizKeyRuleCheck?.passed),
          tip: toTraditionalChinese(data.lizKeyRuleCheck?.tip || ''),
        },
        actionPoint: toTraditionalChinese(data.actionPoint || ''),
      };
      setModeBAdvices((prev) => ({ ...prev, [stepIdx]: cleanData }));
    } catch (err: any) {
      setErrorMessage(err?.message || '取得單段建議失敗，請稍後重試。');
    } finally {
      setIsModeBAdviceLoading(false);
    }
  };

  // AI Step Starters handler
  const handleGetModeBStarters = async (stepIdx: number) => {
    setErrorMessage(null);
    setIsModeBStartersLoading(true);
    try {
      const stepMeta = stepMetas[stepIdx] || stepMetas[0];
      const res = await fetch('/api/gemini/ielts-mode-b-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'starters',
          ieltsTask: task,
          stepIndex: stepIdx,
          stepName: stepMeta.title,
          prompt: isCustomPrompt ? customPromptText : activePrompt.prompt,
          targetBand: Number(targetBand),
          draftText: getCurrentStepText(stepIdx),
          visualType: task === 'task1' ? activePrompt.lizCategory : undefined,
          essayType: task === 'task2' ? activePrompt.lizCategory : undefined,
        }),
      });
      if (!res.ok) throw new Error('AI 啟發生成暫時無法連線。');
      const data: ModeBStepStarters = await res.json();
      const cleanData: ModeBStepStarters = {
        stepIndex: data.stepIndex,
        stepName: data.stepName,
        starters: (data.starters || []).map((s) => ({
          title: toTraditionalChinese(s.title || ''),
          text: s.text || '',
          rationale: toTraditionalChinese(s.rationale || ''),
        })),
      };
      setModeBStarters((prev) => ({ ...prev, [stepIdx]: cleanData }));
    } catch (err: any) {
      setErrorMessage(err?.message || '取得句型啟發失敗，請稍後重試。');
    } finally {
      setIsModeBStartersLoading(false);
    }
  };

  const handleRemoveFillers = (stepIdx: number) => {
    const advice = modeBAdvices[stepIdx];
    if (!advice || !advice.wordinessVerdict.fillers.length) return;
    let text = getCurrentStepText(stepIdx);
    for (const item of advice.wordinessVerdict.fillers) {
      if (!item.phrase) continue;
      const regex = new RegExp(item.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      if (item.fix.includes('刪除') || item.fix === '') {
        text = text.replace(regex, '');
      } else {
        text = text.replace(regex, item.fix);
      }
    }
    text = text.replace(/\s{2,}/g, ' ').trim();
    updateCurrentStepText(stepIdx, text);
    setModeBAdvices((prev) => {
      const currentAdv = prev[stepIdx];
      if (!currentAdv) return prev;
      return {
        ...prev,
        [stepIdx]: {
          ...currentAdv,
          wordinessVerdict: {
            hasFillers: false,
            fillers: [],
          },
        },
      };
    });
  };

  const handleApplyPolishedVersion = (stepIdx: number) => {
    const advice = modeBAdvices[stepIdx];
    if (!advice?.polishedText) return;
    updateCurrentStepText(stepIdx, advice.polishedText);
  };

  const handleApplyStarter = (stepIdx: number, starterText: string) => {
    const current = getCurrentStepText(stepIdx).trim();
    if (!current) {
      updateCurrentStepText(stepIdx, starterText);
    } else {
      updateCurrentStepText(
        stepIdx,
        current + (current.endsWith('.') || current.endsWith('?') || current.endsWith('!') || current.endsWith('\n') ? ' ' : '. ') + starterText
      );
    }
  };

  // 1-Click clean fillers from full essay draft
  const handleCleanFullDraftFillers = () => {
    let text = fullDraft;
    for (const phrase of detectedFillers) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      text = text.replace(regex, '');
    }
    setFullDraft(text.replace(/\s{2,}/g, ' ').trim());
  };

  // Full Review Submission
  const handleFullReview = async () => {
    if (!fullDraft.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gemini/polish-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullDraft,
          style: 'academic',
          targetTopic: isCustomPrompt ? customPromptText : activePrompt.prompt,
          ieltsTask: task,
          targetBand: Number(targetBand),
        }),
      });

      if (!res.ok) {
        throw new Error('AI 考官批改服務暫時不可用，請稍後重試。');
      }

      const data = await res.json();

      const cleanAnalysis: WritingAnalysis = {
        originalText: fullDraft,
        correctedText: data.correctedText || fullDraft,
        score: typeof data.score === 'number' ? data.score : 75,
        cefrLevel: data.cefrLevel || 'B2',
        strengths: (data.strengths || []).map((s: string) => toTraditionalChinese(s)),
        grammarIssues: (data.grammarIssues || []).map((g: any) => ({
          original: g.original || '',
          correction: g.correction || '',
          rule: toTraditionalChinese(g.rule || ''),
          explanationZh: toTraditionalChinese(g.explanationZh || ''),
        })),
        vocabularyEnhancements: (data.vocabularyEnhancements || []).map((v: any) => ({
          original: v.original || '',
          replacement: v.replacement || '',
          reason: toTraditionalChinese(v.reason || ''),
        })),
        vocabularyUpgrades: (data.vocabularyUpgrades || []).map((v: any) => ({
          original: v.original || '',
          suggested: v.suggested || '',
          contextZh: toTraditionalChinese(v.contextZh || ''),
        })),
        nativePolishedVersion: data.nativePolishedVersion || '',
        spokenPresentationOutline: data.spokenPresentationOutline || {
          keyPoints: [],
          openingPhrase: '',
          closingPhrase: '',
          transitionalTips: [],
        },
        ieltsOverallBand: data.ieltsOverallBand,
        ieltsScores: data.ieltsScores,
        ieltsCriteriaFeedback: data.ieltsCriteriaFeedback
          ? {
              taskResponse: toTraditionalChinese(data.ieltsCriteriaFeedback.taskResponse || ''),
              coherenceCohesion: toTraditionalChinese(data.ieltsCriteriaFeedback.coherenceCohesion || ''),
              lexicalResource: toTraditionalChinese(data.ieltsCriteriaFeedback.lexicalResource || ''),
              grammar: toTraditionalChinese(data.ieltsCriteriaFeedback.grammar || ''),
            }
          : undefined,
        ieltsActionPlan: (data.ieltsActionPlan || []).map((a: string) => toTraditionalChinese(a)),
      };

      setAnalysis(cleanAnalysis);

      // Save to local writing records
      const timeSpent = (task === 'task1' ? 20 * 60 : 40 * 60) - timerSeconds;
      const newRecord: IELTSWritingRecord = {
        id: `writing_${Date.now()}`,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        task,
        promptId: isCustomPrompt ? 'custom' : activePrompt.id,
        promptTitle: isCustomPrompt ? customPromptTitle : activePrompt.title,
        lizCategory: isCustomPrompt ? 'custom' : activePrompt.lizCategory,
        overallBand: cleanAnalysis.ieltsOverallBand || Math.round((cleanAnalysis.score / 20) * 2) / 2,
        targetBand: Number(targetBand),
        criteriaScores: cleanAnalysis.ieltsScores || {
          taskResponse: 6.5,
          coherenceCohesion: 6.5,
          lexicalResource: 6.5,
          grammar: 6.5,
        },
        criteriaFeedback: cleanAnalysis.ieltsCriteriaFeedback,
        wordCount: currentWordCount,
        timeSpentSeconds: timeSpent > 0 ? timeSpent : defaultSeconds,
        generalFeedbackZh: cleanAnalysis.strengths[0] || '完成全篇作文評分',
        strengths: cleanAnalysis.strengths,
        weaknesses: cleanAnalysis.grammarIssues.map((g) => `${g.rule}: ${g.original} -> ${g.correction}`),
        ieltsActionPlan: cleanAnalysis.ieltsActionPlan,
        userDraft: fullDraft,
        polishedVersion: cleanAnalysis.nativePolishedVersion,
      };

      saveIELTSWritingRecord(newRecord);
      setRecordSavedToast(true);
      setTimeout(() => setRecordSavedToast(false), 4000);

      // Automatically transition to Feedback stage
      setCurrentStage('feedback');
    } catch (err: any) {
      setErrorMessage(err?.message || '批改過程發生錯誤，請檢查網路連線。');
    } finally {
      setIsLoading(false);
    }
  };

  const STAGES_NAV = [
    { id: 'select-task' as WritingStage, num: 1, title: '選擇 Task 類別', sub: 'Task 1 圖表 / Task 2 議論文' },
    { id: 'select-prompt' as WritingStage, num: 2, title: '挑選真題題庫', sub: `${taskPrompts.length} 題歷屆與自訂題` },
    { id: 'writing' as WritingStage, num: 3, title: '進入全真寫作', sub: '固定題目 + 輔助工坊 + 計時寫作' },
    { id: 'feedback' as WritingStage, num: 4, title: '考官診斷反饋', sub: analysis ? `Band ${analysis.ieltsOverallBand || '7.0'} 報告` : '四項準則批改' },
  ];

  return (
    <div className="space-y-6 relative text-stone-900 dark:text-stone-100">
      {/* Toast */}
      {recordSavedToast && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-stone-950 dark:bg-stone-900 text-white text-xs rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/50 animate-fade-in max-w-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-white">寫作評分完成並已儲存！</p>
            <p className="text-stone-300 text-xs mt-0.5">
              本次評分已同步登記至 Dashboard「今日進度與寫作歷史成績單」。
            </p>
          </div>
        </div>
      )}

      {/* 1. Stage Stepper Navigation Bar */}
      <section className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STAGES_NAV.map((s, idx) => {
            const isCurrent = currentStage === s.id;
            const isPassed =
              (s.id === 'select-task' && currentStage !== 'select-task') ||
              (s.id === 'select-prompt' && (currentStage === 'writing' || currentStage === 'feedback')) ||
              (s.id === 'writing' && currentStage === 'feedback');

            return (
              <button
                key={s.id}
                onClick={() => {
                  if (s.id === 'feedback' && !analysis) return;
                  setCurrentStage(s.id);
                }}
                disabled={s.id === 'feedback' && !analysis}
                className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl text-left transition cursor-pointer border ${
                  isCurrent
                    ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-xs font-bold'
                    : isPassed
                    ? 'bg-stone-50 dark:bg-stone-800/80 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                    : 'bg-transparent text-stone-400 dark:text-stone-400 border-transparent hover:bg-stone-50 dark:hover:bg-stone-800/50 opacity-70'
                } ${s.id === 'feedback' && !analysis ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    isCurrent
                      ? 'bg-stone-950 text-amber-300'
                      : isPassed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {isPassed ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{s.title}</p>
                  <p className={`text-[10px] truncate ${isCurrent ? 'text-stone-900 font-semibold' : 'text-stone-500 dark:text-stone-400'}`}>
                    {s.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* STAGE 1: SELECT TASK */}
      {currentStage === 'select-task' && (
        <section className="space-y-6 animate-fade-in">
          <div className="text-center max-w-2xl mx-auto space-y-2 py-2">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              請選擇本次寫作練習目標 (IELTS Task)
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              官方考試總長 60 分鐘，共包含 Task 1 學術圖表與 Task 2 大論文兩大任務。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Task 1 Card */}
            <div
              onClick={() => {
                setTask('task1');
                setCategoryFilter('all');
                setCurrentStage('select-prompt');
              }}
              className="rounded-3xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-7 shadow-sm hover:border-amber-400 dark:hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-5 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                      佔總分 33% (1/3)
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      20 分鐘
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                    Task 1 學術圖表報告 (Report)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    針對客觀圖表、曲線趨勢、流程圖或地圖進行客觀描述與對比。
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 space-y-1">
                    <span className="font-bold text-stone-800 dark:text-stone-200">★ 核心結構與字數：</span>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                      標準 4 段式（改寫題目 + 無數據 Overview + 2 個細節段）。最低 150 字（建議 160–190 字）。
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3 text-amber-950 dark:text-amber-200">
                    <span className="font-bold">★ 考官高分守則：</span>
                    <p className="mt-0.5 leading-relaxed text-[11px]">
                      Overview 嚴禁包含具體數值；必須做精準分組對比，嚴禁流水帳報數。
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-stone-900 dark:bg-stone-100 group-hover:bg-amber-400 dark:group-hover:bg-amber-400 text-white dark:text-stone-900 group-hover:text-stone-950 font-bold text-xs shadow-xs transition"
              >
                選擇 Task 1 開始挑選題目
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Task 2 Card */}
            <div
              onClick={() => {
                setTask('task2');
                setCategoryFilter('all');
                setCurrentStage('select-prompt');
              }}
              className="rounded-3xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-7 shadow-sm hover:border-amber-400 dark:hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-5 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
                    <FileEdit className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-400 text-stone-950 shadow-xs">
                      雙倍分值 · 佔總分 67% (2/3)
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      40 分鐘
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                    Task 2 學術議論文 (Academic Essay)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    針對社會、教育、科技、環境等爭議話題發表深入論證。
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 space-y-1">
                    <span className="font-bold text-stone-800 dark:text-stone-200">★ 核心結構與字數：</span>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                      PEEL 深度論證段落鏈（Point → Explain → Example → Link）。最低 250 字（建議 260–290 字）。
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3 text-amber-950 dark:text-amber-200">
                    <span className="font-bold">★ 考官高分守則：</span>
                    <p className="mt-0.5 leading-relaxed text-[11px]">
                      引言段必須清晰表明 Thesis Statement 立場；段落需具備完整邏輯因果推導。
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs transition"
              >
                選擇 Task 2 開始挑選題目
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STAGE 2: SELECT PROMPT */}
      {currentStage === 'select-prompt' && (
        <section className="space-y-5 animate-fade-in">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStage('select-task')}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> 返回重選 Task
              </button>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  挑選 {task === 'task1' ? 'Task 1 學術圖表題目' : 'Task 2 議論文題目'}
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                    共 {taskPrompts.length} 題可用
                  </span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  可依官方題型分類篩選，或直接自訂真實模考考題。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsCustomPrompt(!isCustomPrompt)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isCustomPrompt
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-white'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                }`}
              >
                {isCustomPrompt ? '切換回真題庫' : '+ 自訂題目 (Custom)'}
              </button>
            </div>
          </div>

          {/* Category Filter Chips & Search */}
          {!isCustomPrompt && (
            <div className="space-y-3 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋題幹關鍵字或分類..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden"
                  />
                </div>

                <div className="text-xs text-stone-500 dark:text-stone-400">
                  顯示 <strong className="text-stone-900 dark:text-stone-100">{filteredPrompts.length}</strong> / {taskPrompts.length} 題
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                    categoryFilter === 'all'
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-2xs'
                      : 'bg-stone-50 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  全部題型 ({taskPrompts.length})
                </button>
                {task === 'task1'
                  ? IELTS_TASK1_VISUAL_TYPES.map((v) => {
                      const count = taskPrompts.filter((p) => p.lizCategory === v.id).length;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setCategoryFilter(v.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                            categoryFilter === v.id
                              ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-2xs'
                              : 'bg-stone-50 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          {v.titleZh} ({count})
                        </button>
                      );
                    })
                  : IELTS_TASK2_ESSAY_TYPES.map((e) => {
                      const count = taskPrompts.filter((p) => p.lizCategory === e.id).length;
                      return (
                        <button
                          key={e.id}
                          onClick={() => setCategoryFilter(e.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                            categoryFilter === e.id
                              ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-2xs'
                              : 'bg-stone-50 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          {e.titleZh} ({count})
                        </button>
                      );
                    })}
              </div>
            </div>
          )}

          {/* Custom Prompt Form */}
          {isCustomPrompt ? (
            <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-500" />
                自訂寫作題目與情境
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300">自訂題目名稱 / 來源</label>
                  <input
                    type="text"
                    value={customPromptTitle}
                    onChange={(e) => setCustomPromptTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300">題目完整英文題幹 (Prompt)</label>
                  <textarea
                    rows={4}
                    value={customPromptText}
                    onChange={(e) => setCustomPromptText(e.target.value)}
                    placeholder="請在此貼上題目完整內容，例如：Some people argue that universities should focus on practical skills..."
                    className="mt-1 w-full rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-3.5 text-xs leading-relaxed text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={!customPromptText.trim()}
                  onClick={() => setCurrentStage('writing')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-40"
                >
                  確認並進入寫作階段 (Start Writing)
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Prompt Selection Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrompts.map((p) => {
                const isSelected = activePrompt.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => onPromptChange(p.id)}
                    className={`rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'border-amber-400 dark:border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-400/40'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-600 shadow-xs'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          {p.lizCategory}
                        </span>
                        {p.sampleUrl && (
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            Band {p.sampleBand || '8.5'} 範文
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-2">
                        {p.title}
                      </h3>

                      <p className="text-xs font-serif text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl">
                        "{p.prompt}"
                      </p>

                      {/* Chart thumbnail for Task 1 */}
                      {p.task === 'task1' && p.imageUrl && (
                        <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 h-28 flex items-center justify-center p-1">
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400">
                        {isSelected ? '✓ 目前已選擇' : '點擊選取此題'}
                      </span>
                      {isSelected ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentStage('writing');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs transition"
                        >
                          進入寫作
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-stone-600 dark:text-stone-300 group-hover:text-stone-900">
                          選取 →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Prompt Sticky Bar at Bottom if in Prompt Selection */}
          {!isCustomPrompt && (
            <div className="sticky bottom-4 z-20 rounded-3xl bg-stone-950 dark:bg-stone-800 text-white p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-stone-800">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  已選定寫作題目 ({activePrompt.task.toUpperCase()})
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                  [{activePrompt.lizCategory}] {activePrompt.title}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStage('writing')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-md transition cursor-pointer shrink-0"
              >
                進入全真寫作階段 (Start Writing)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* STAGE 3: WRITING WORKSPACE (FIXED LEFT PANE: PROMPT, RIGHT PANE: WRITING AREA, COLLAPSIBLE COPILOT OVERLAY) */}
      {currentStage === 'writing' && (
        <section className="space-y-5 animate-fade-in relative">
          {/* Top Control Bar */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Topic Badge & Change button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCurrentStage('select-prompt')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                重選題目
              </button>

              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                {task === 'task1' ? `Task 1 · ${activePrompt.lizCategory}` : `Task 2 · ${activePrompt.lizCategory}`}
              </span>

              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 hidden sm:inline">
                {task === 'task1' ? '建議 20 分鐘 · 佔比 33%' : '建議 40 分鐘 · 佔比 67% (雙倍分值)'}
              </span>
            </div>

            {/* Right: Toggle Copilot Button & Target Band */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isCopilotOpen
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
                    : 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-amber-500 shadow-xs'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                {isCopilotOpen ? '收合寫作智囊' : '展開寫作智囊 (Ideas/分步草稿)'}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-stone-900/15 dark:bg-white/15 font-bold">
                  {completedStepsCount}/{stepMetas.length}
                </span>
              </button>

              {/* Target Band */}
              <label className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 pl-1 border-l border-stone-200 dark:border-stone-700">
                目標
                <select
                  value={targetBand}
                  onChange={(e) => setTargetBand(e.target.value)}
                  className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2 py-1 text-xs font-bold text-stone-900 dark:text-stone-100 focus:bg-white"
                >
                  {['6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'].map((b) => (
                    <option key={b} value={b}>Band {b}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* 2-Pane Split View: Fixed Left Prompt Pane + Right Full Writing Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Fixed Prompt Card (Or Overlaid with WritingCopilotPane when open) */}
            <div className="lg:col-span-5 relative min-h-[550px]">
              {/* When Copilot is open, overlay and cover the prompt pane */}
              {isCopilotOpen ? (
                <div className="h-full">
                  <WritingCopilotPane
                    task={task}
                    activeCategory={activePrompt.lizCategory}
                    activeStep={activeGuidedStep}
                    onStepChange={setActiveGuidedStep}
                    stepMetas={stepMetas}
                    stepDrafts={task === 'task1' ? task1Steps : task2Steps}
                    onUpdateStepDraft={updateCurrentStepText}
                    stepAdvices={modeBAdvices}
                    stepStarters={modeBStarters}
                    isLoadingAdvice={isModeBAdviceLoading}
                    isLoadingStarters={isModeBStartersLoading}
                    onGetStepAdvice={handleGetModeBAdvice}
                    onGetStepStarters={handleGetModeBStarters}
                    onRemoveFillers={handleRemoveFillers}
                    onApplyPolished={handleApplyPolishedVersion}
                    onApplyStarter={handleApplyStarter}
                    onSyncStepToFullDraft={handleSyncStepToFullDraft}
                    onClose={() => setIsCopilotOpen(false)}
                    onMergeAll={handleMergeGuidedDrafts}
                  />
                </div>
              ) : (
                /* Fixed Left Prompt Details Card */
                <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm space-y-4">
                  {/* Topic Header */}
                  <div className="space-y-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-stone-900 dark:bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-white dark:text-stone-900 uppercase">
                          {activePrompt.task}
                        </span>
                        <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                          {activePrompt.lizCategory}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <a
                          href={activePrompt.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                        >
                          官方來源 <ExternalLink className="w-3 h-3" />
                        </a>
                        {activePrompt.sampleUrl && (
                          <a
                            href={activePrompt.sampleUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 hover:underline"
                          >
                            Band {activePrompt.sampleBand || 8.5} 範文 <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                      {isCustomPrompt ? customPromptTitle : activePrompt.title}
                    </h3>
                  </div>

                  {/* Full Prompt Text Quote */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      題目完整英文題幹 (Prompt)
                    </span>
                    <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 p-4 font-serif text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                      "{isCustomPrompt ? customPromptText : activePrompt.prompt}"
                    </div>
                  </div>

                  {/* Task 1 Chart Image Preview */}
                  {task === 'task1' && activePrompt.imageUrl && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400">
                        <span>圖表原圖 (Chart Visual)</span>
                        <button
                          type="button"
                          onClick={() => setIsImageModalOpen(true)}
                          className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" /> 放大檢視
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 p-2 relative group flex items-center justify-center max-h-56">
                        <img
                          src={activePrompt.imageUrl}
                          alt={activePrompt.title}
                          className="max-h-52 w-full object-contain cursor-zoom-in"
                          onClick={() => setIsImageModalOpen(true)}
                        />
                        <button
                          type="button"
                          onClick={() => setIsImageModalOpen(true)}
                          className="absolute bottom-2 right-2 rounded-xl bg-stone-900/80 hover:bg-stone-900 text-white px-2.5 py-1 text-xs font-bold flex items-center gap-1 backdrop-blur-xs cursor-pointer shadow-md"
                        >
                          <ZoomIn className="w-3.5 h-3.5" /> 放大圖表
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PDF Reference Note */}
                  {task === 'task1' && !activePrompt.imageUrl && activePrompt.pdfPage && (
                    <div className="flex items-center justify-between rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-[11px] text-amber-950 dark:text-amber-200">
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        收錄於劍橋圖表題大全 PDF 第 {activePrompt.pdfPage} 頁
                      </span>
                      <a
                        href={`${activePrompt.sourceUrl}#page=${activePrompt.pdfPage}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-amber-800 dark:text-amber-300 hover:text-amber-950 inline-flex items-center gap-1"
                      >
                        開啟第 {activePrompt.pdfPage} 頁 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Golden Rule Tip Card */}
                  <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 p-3.5 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      考官高分破題守則：
                    </div>
                    <p className="leading-relaxed text-[11px]">
                      {task === 'task1' ? currentTask1Info.goldenRule : currentTask2Info.goldenRule}
                    </p>
                  </div>

                  {/* Quick trigger for Copilot */}
                  <button
                    type="button"
                    onClick={() => setIsCopilotOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-stone-800 dark:text-stone-200 text-xs font-bold border border-stone-200 dark:border-stone-700 transition cursor-pointer shadow-2xs"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    展開寫作智囊與分步工坊 (覆蓋左側)
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Full Timed Writing Area */}
            <div className="lg:col-span-7 space-y-5">
              <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm space-y-4">
                {/* Top Control Bar: Timer + Word count info + Merge button */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 dark:bg-stone-800/70 rounded-2xl p-3 border border-stone-200 dark:border-stone-700">
                  {/* Countdown Timer */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold ${
                        timerSeconds <= 5 * 60 && timerSeconds > 0
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 animate-pulse border border-rose-300'
                          : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {formatTimer(timerSeconds)}
                    </div>
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer transition"
                      title={isTimerRunning ? '暫停計時' : '開始全真計時'}
                    >
                      {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSeconds(defaultSeconds);
                      }}
                      className="p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 cursor-pointer transition"
                      title="重設計時"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions: Merge and Clear */}
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleMergeGuidedDrafts}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="將左側分步撰寫的各段合併匯入此處"
                    >
                      <Copy className="w-3 h-3" />
                      一鍵匯入智囊草稿
                    </button>

                    <button
                      type="button"
                      onClick={() => setFullDraft('')}
                      className="px-2.5 py-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                      title="清空作文"
                    >
                      清空
                    </button>
                  </div>
                </div>

                {/* Wordiness Warning */}
                {detectedFillers.length > 0 && (
                  <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>
                        偵測到 <strong>{detectedFillers.length}</strong> 個模板套話（如 "{detectedFillers[0]}"），考官會扣分！
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCleanFullDraftFillers}
                      className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Scissors className="w-3 h-3" /> 一鍵去除
                    </button>
                  </div>
                )}

                {/* Main Essay Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
                    <span>全真作文寫作區（段落間請空一行）</span>
                    <span className={currentWordCount >= minWordsRequired ? 'text-emerald-800 dark:text-emerald-300 font-bold' : 'text-amber-800 dark:text-amber-300 font-bold'}>
                      {currentWordCount} 字 {currentWordCount < minWordsRequired ? `(尚缺 ${minWordsRequired - currentWordCount} 字)` : '✓ 達到字數門檻'}
                    </span>
                  </div>
                  <textarea
                    value={fullDraft}
                    onChange={(e) => setFullDraft(e.target.value)}
                    rows={17}
                    placeholder={
                      task === 'task1'
                        ? `[Paragraph 1: Introduction - 改寫題目]\nThe provided chart illustrates...\n\n[Paragraph 2: Overview - 總結主要特徵，不附數據]\nOverall, it is clear that...\n\n[Paragraph 3: Detail Paragraph 1 - 第一組特徵與數據]\nIn terms of...\n\n[Paragraph 4: Detail Paragraph 2 - 第二組對比特徵與數據]\nBy contrast...`
                        : `[Paragraph 1: Introduction - 改寫題目與明確立場]\nIt is often argued that... In my opinion, I firmly agree that...\n\n[Paragraph 2: Body 1 - 第一核心理由 (PEEL)]\nThe primary justification for my stance is that...\n\n[Paragraph 3: Body 2 - 第二核心理由 (PEEL)]\nFurthermore, another compelling argument is that...\n\n[Paragraph 4: Conclusion - 重申立場與要點總結]\nIn conclusion, while some argue that... I believe that...`
                    }
                    className="w-full resize-y rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 p-4 font-sans text-sm leading-7 text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400"
                  />
                </div>

                {/* Word Count Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentWordCount >= recommendedMaxWords
                          ? 'bg-amber-500'
                          : currentWordCount >= minWordsRequired
                          ? 'bg-emerald-500'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min(100, (currentWordCount / minWordsRequired) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                    <span>最低字數門檻: {minWordsRequired} 字</span>
                    <span>建議理想區間: {minWordsRequired}–{recommendedMaxWords} 字 (目前段落數: {paragraphCount})</span>
                  </div>
                </div>

                {/* Submit Assessment Button */}
                <div className="pt-2">
                  <button
                    disabled={isLoading || !fullDraft.trim()}
                    onClick={handleFullReview}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 dark:bg-stone-100 px-6 py-4 text-sm font-bold text-white dark:text-stone-900 shadow-md hover:bg-stone-800 dark:hover:bg-white disabled:opacity-40 cursor-pointer transition"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600" />}
                    {isLoading ? 'IELTS 考官依官方四項準則深度評分中...' : '送出由 AI 考官深度批改 (官方四項評分準則) →'}
                  </button>
                </div>

                {errorMessage && (
                  <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 p-3.5 text-xs text-rose-900 dark:text-rose-200">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom-Right Collapsible Toolbars Floating Widget (Default collapsed) */}
          <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCopilotOpen(!isCopilotOpen)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-stone-950 dark:bg-white text-white dark:text-stone-950 font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-400/60 ring-2 ring-amber-400/30"
              title="展開或收合左側輔助智囊工坊"
            >
              <Lightbulb className="w-4 h-4 text-amber-400 dark:text-amber-600" />
              <span>{isCopilotOpen ? '收合寫作智囊' : '寫作智囊與分步工坊'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold">
                {completedStepsCount}/{stepMetas.length}
              </span>
              {isCopilotOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </section>
      )}

      {/* STAGE 4: FEEDBACK & DIAGNOSTIC REPORT */}
      {currentStage === 'feedback' && analysis && (
        <section className="space-y-6 animate-fade-in">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStage('writing')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold cursor-pointer transition"
              >
                <ArrowLeft className="w-4 h-4" />
                返回修改作文 (繼續打磨)
              </button>
              <button
                type="button"
                onClick={() => setCurrentStage('select-prompt')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer transition"
              >
                挑選新題目
              </button>
            </div>

            <div className="flex items-center gap-2">
              {analysis.nativePolishedVersion && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(analysis.nativePolishedVersion || '');
                    setCopiedPolished(true);
                    setTimeout(() => setCopiedPolished(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold cursor-pointer transition shadow-2xs"
                >
                  {copiedPolished ? <Check className="w-4 h-4 text-stone-950" /> : <Copy className="w-4 h-4" />}
                  {copiedPolished ? '已複製範文' : '複製考官潤飾範文'}
                </button>
              )}
            </div>
          </div>

          {/* Overall Score Banner */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
              <div>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  雅思寫作預估總分 (Overall Band)
                </span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-5xl font-extrabold text-stone-900 dark:text-stone-100">
                    {analysis.ieltsOverallBand ? analysis.ieltsOverallBand.toFixed(1) : (analysis.score / 20).toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-stone-400">/ 9.0</span>
                  <span className="ml-3 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 px-3 py-1 text-xs font-bold">
                    CEFR 等級: {analysis.cefrLevel || 'B2'}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 ml-2">
                    目標: Band {targetBand}
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <Award className="w-7 h-7" />
              </div>
            </div>

            {/* 4 Official Criteria Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CRITERIA_INFO.map((c) => {
                const score = analysis.ieltsScores?.[c.key];
                return (
                  <div key={c.key} className="rounded-2xl bg-stone-50 dark:bg-stone-800/60 p-4 border border-stone-200/80 dark:border-stone-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-200">{c.labelZh}</p>
                      <span className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                        {score ? score.toFixed(1) : '—'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      {c.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3 High-Impact Action Items */}
          {analysis.ieltsActionPlan && analysis.ieltsActionPlan.length > 0 && (
            <div className="rounded-3xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-5 sm:p-6 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  考官診斷：三大關鍵提分行動 (High-Impact Action Items)
                </h3>
              </div>
              <ul className="space-y-2.5">
                {analysis.ieltsActionPlan.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs text-stone-800 dark:text-stone-200 leading-relaxed bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-800 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div className="rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 作文優勢與亮點
                </h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Grammar & Sentence Corrections */}
            {analysis.grammarIssues && analysis.grammarIssues.length > 0 && (
              <div className="rounded-3xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" /> 句子級語法錯誤修正 ({analysis.grammarIssues.length} 處)
                </h3>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {analysis.grammarIssues.map((issue, idx) => (
                    <div key={idx} className="rounded-2xl border border-rose-100 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-stone-500 dark:text-stone-400">{issue.rule}</span>
                        <span className="text-rose-600 dark:text-rose-400">修正</span>
                      </div>
                      <p className="line-through text-stone-400 font-mono text-[11px]">{issue.original}</p>
                      <p className="text-emerald-800 dark:text-emerald-300 font-semibold font-mono text-[11px]">➔ {issue.correction}</p>
                      <p className="text-stone-600 dark:text-stone-300 text-[11px] pt-1">
                        {issue.explanationZh}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Native Band 8.5+ Polished Essay */}
          {analysis.nativePolishedVersion && (
            <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  母語考官示範潤飾範文 (Band 8.5+ Polished Version)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(analysis.nativePolishedVersion || '');
                    setCopiedPolished(true);
                    setTimeout(() => setCopiedPolished(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-bold cursor-pointer"
                >
                  {copiedPolished ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPolished ? '已複製' : '複製範文'}
                </button>
              </div>

              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/60 p-5 font-serif text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap border border-stone-200/80 dark:border-stone-700">
                {analysis.nativePolishedVersion}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Image Modal for Task 1 Charts */}
      {isImageModalOpen && activePrompt.imageUrl && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col border border-stone-800">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">{activePrompt.title} - 圖表原圖</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImageZoom((prev) => Math.max(0.5, prev - 0.2))}
                  className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer"
                  title="縮小"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-stone-500">{Math.round(imageZoom * 100)}%</span>
                <button
                  onClick={() => setImageZoom((prev) => Math.min(2.5, prev + 0.2))}
                  className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer"
                  title="放大"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsImageModalOpen(false);
                    setImageZoom(1);
                  }}
                  className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer ml-2"
                  title="關閉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-auto flex-1 flex items-center justify-center p-2 bg-stone-50 dark:bg-stone-950 rounded-2xl">
              <img
                src={activePrompt.imageUrl}
                alt={activePrompt.title}
                style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
                className="transition-transform duration-200 max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
