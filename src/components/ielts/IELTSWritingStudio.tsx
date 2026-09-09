import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
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
  Pause,
  PenTool,
  Play,
  RefreshCw,
  RotateCcw,
  Scissors,
  Sparkles,
  Volume2,
  Wand2,
  X,
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
  LIZ_PARAGRAPH_PEEL_FORMULA,
  LIZ_PLANNING_STEPS,
  LIZ_TASK1_FATAL_TRAPS,
  LIZ_TASK1_PREPARATION_STEPS,
  LIZ_TASK1_VISUAL_TYPES,
  LIZ_TASK2_ESSAY_TYPES,
  Task1VisualTypeInfo,
  Task2EssayTypeInfo,
} from '../../data/ielts/ieltsLizMethodology';
import { toTraditionalChinese } from '../../utils/chineseConverter';
import { saveIELTSWritingRecord, getGeneralSettings } from '../../utils/ielts';
import { IELTSWritingRecord } from '../../types/ielts';

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

type StudioMode = 'full_essay' | 'guided_steps' | 'liz_guide';

interface Props {
  selectedPromptId: string;
  onPromptChange: (promptId: string) => void;
}

const CRITERIA_INFO = [
  { key: 'taskResponse', labelEn: 'Task Response / Achievement', labelZh: '任務回應與完成度', desc: 'Task 1 檢查是否具備無數據 Overview 與精確分組；Task 2 檢查立場一致性與論證充分度。' },
  { key: 'coherenceCohesion', labelEn: 'Coherence & Cohesion', labelZh: '連貫性與銜接結構', desc: '段落切分邏輯、主題句銜接、以及連接詞（Linking words）的自然多樣使用。' },
  { key: 'lexicalResource', labelEn: 'Lexical Resource', labelZh: '詞彙資源與多樣性', desc: '學術高分詞彙、搭配詞（Collocations）、精確語意與拼字正確度。' },
  { key: 'grammar', labelEn: 'Grammatical Range & Accuracy', labelZh: '語法範圍與準確度', desc: '複雜句構、被動語態、時態一致性與標點符號運用。' },
] as const;

export const IELTSWritingStudio: React.FC<Props> = ({ selectedPromptId, onPromptChange }) => {
  // Navigation & View state
  const [task, setTask] = useState<WritingPromptTask>('task1');
  const [mode, setMode] = useState<StudioMode>('full_essay');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [targetBand, setTargetBand] = useState<string>(() => {
    const settings = getGeneralSettings();
    return settings?.targetScores?.writing ? settings.targetScores.writing.toFixed(1) : '7.0';
  });
  const [recordSavedToast, setRecordSavedToast] = useState(false);

  // Custom Prompt support
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [customPromptTitle, setCustomPromptTitle] = useState('自訂寫作題目');

  // Active Prompt
  const activePrompt: IELTSWritingPrompt = useMemo(() => {
    const found = IELTS_WRITING_PROMPTS.find((item) => item.id === selectedPromptId);
    if (found && found.task === task) return found;
    const fallback = IELTS_WRITING_PROMPTS.find((item) => item.task === task) || IELTS_WRITING_PROMPTS[0];
    return fallback;
  }, [selectedPromptId, task]);

  // Image Modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageScale, setImageScale] = useState(1);

  // Timer State
  const defaultSeconds = task === 'task1' ? 20 * 60 : 40 * 60;
  const [timerSeconds, setTimerSeconds] = useState(defaultSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Full Essay Draft
  const [fullDraft, setFullDraft] = useState('');

  // Guided Steps Drafts
  const [guidedDraftsTask1, setGuidedDraftsTask1] = useState<{
    intro: string;
    overview: string;
    body1: string;
    body2: string;
  }>({
    intro: '',
    overview: '',
    body1: '',
    body2: '',
  });

  const [guidedDraftsTask2, setGuidedDraftsTask2] = useState<{
    planning: string;
    intro: string;
    body1: string;
    body2: string;
    conclusion: string;
  }>({
    planning: '',
    intro: '',
    body1: '',
    body2: '',
    conclusion: '',
  });

  const [activeGuidedStep, setActiveGuidedStep] = useState<number>(0);

  // AI Review State
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stepAiFeedback, setStepAiFeedback] = useState<string | null>(null);
  const [isStepAiLoading, setIsStepAiLoading] = useState(false);

  // Mode B AI Advice & Starters
  const [modeBAdvices, setModeBAdvices] = useState<Record<number, ModeBStepAdvice | null>>({});
  const [modeBStarters, setModeBStarters] = useState<Record<number, ModeBStepStarters | null>>({});
  const [isModeBAdviceLoading, setIsModeBAdviceLoading] = useState(false);
  const [isModeBStartersLoading, setIsModeBStartersLoading] = useState(false);
  const [modeBError, setModeBError] = useState<string | null>(null);
  const [copiedStepPolish, setCopiedStepPolish] = useState<number | null>(null);

  // Word count & paragraph calculations
  const currentWordCount = useMemo(() => {
    const trimmed = fullDraft.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [fullDraft]);

  const paragraphCount = useMemo(() => {
    const blocks = fullDraft
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return blocks.length;
  }, [fullDraft]);

  const minWordsRequired = task === 'task1' ? 150 : 250;
  const recommendedMaxWords = task === 'task1' ? 190 : 285;

  // Sync timer when task changes
  useEffect(() => {
    setIsTimerRunning(false);
    setTimerSeconds(task === 'task1' ? 20 * 60 : 40 * 60);
    setAnalysis(null);
    setErrorMessage(null);
    setActiveGuidedStep(0);
  }, [task]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Filtered prompts for the current task
  const taskPrompts = useMemo(() => {
    return IELTS_WRITING_PROMPTS.filter((p) => p.task === task);
  }, [task]);

  const filteredPrompts = useMemo(() => {
    if (categoryFilter === 'all') return taskPrompts;
    return taskPrompts.filter((p) => p.lizCategory === categoryFilter);
  }, [taskPrompts, categoryFilter]);

  // Find active Liz category metadata
  const currentLizTask1Info: Task1VisualTypeInfo | undefined = useMemo(() => {
    if (task !== 'task1') return undefined;
    const cat = activePrompt.lizCategory as Task1LizCategory;
    return LIZ_TASK1_VISUAL_TYPES.find((v) => v.id === cat) || LIZ_TASK1_VISUAL_TYPES[0];
  }, [task, activePrompt]);

  const currentLizTask2Info: Task2EssayTypeInfo | undefined = useMemo(() => {
    if (task !== 'task2') return undefined;
    const cat = activePrompt.lizCategory as Task2LizCategory;
    return LIZ_TASK2_ESSAY_TYPES.find((e) => e.id === cat) || LIZ_TASK2_ESSAY_TYPES[0];
  }, [task, activePrompt]);

  // Handle Review submission
  const handleFullReview = async () => {
    if (!fullDraft.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const topicText = isCustomPrompt ? customPromptText : activePrompt.prompt;
      const response = await fetch('/api/gemini/polish-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullDraft.trim(),
          targetTopic: topicText,
          style: `IELTS Academic Writing ${task === 'task1' ? 'Task 1 (Report)' : 'Task 2 (Essay)'}, Category: ${activePrompt.lizCategory}`,
          ieltsTask: task,
          targetBand: Number(targetBand),
        }),
      });

      if (!response.ok) {
        throw new Error('AI 考官服務目前無回應，請確認伺服器連線或稍後再試。');
      }

      const rawData: WritingAnalysis = await response.json();
      const cleanData: WritingAnalysis = {
        ...rawData,
        generalFeedbackZh: toTraditionalChinese(rawData.generalFeedbackZh || ''),
        strengths: (rawData.strengths || []).map(toTraditionalChinese),
        weaknesses: (rawData.weaknesses || []).map(toTraditionalChinese),
        ieltsActionPlan: (rawData.ieltsActionPlan || []).map(toTraditionalChinese),
        criteriaScores: rawData.criteriaScores ? {
          taskResponse: {
            band: rawData.criteriaScores.taskResponse?.band || 0,
            feedbackZh: toTraditionalChinese(rawData.criteriaScores.taskResponse?.feedbackZh || ''),
            keyMissingElements: (rawData.criteriaScores.taskResponse?.keyMissingElements || []).map(toTraditionalChinese),
          },
          coherenceCohesion: {
            band: rawData.criteriaScores.coherenceCohesion?.band || 0,
            feedbackZh: toTraditionalChinese(rawData.criteriaScores.coherenceCohesion?.feedbackZh || ''),
            keyMissingElements: (rawData.criteriaScores.coherenceCohesion?.keyMissingElements || []).map(toTraditionalChinese),
          },
          lexicalResource: {
            band: rawData.criteriaScores.lexicalResource?.band || 0,
            feedbackZh: toTraditionalChinese(rawData.criteriaScores.lexicalResource?.feedbackZh || ''),
            keyMissingElements: (rawData.criteriaScores.lexicalResource?.keyMissingElements || []).map(toTraditionalChinese),
          },
          grammar: {
            band: rawData.criteriaScores.grammar?.band || 0,
            feedbackZh: toTraditionalChinese(rawData.criteriaScores.grammar?.feedbackZh || ''),
            keyMissingElements: (rawData.criteriaScores.grammar?.keyMissingElements || []).map(toTraditionalChinese),
          },
        } : undefined,
        grammarIssues: (rawData.grammarIssues || []).map((g) => ({
          ...g,
          explanationZh: toTraditionalChinese(g.explanationZh || ''),
        })),
        vocabularyUpgrades: (rawData.vocabularyUpgrades || []).map((v) => ({
          ...v,
          reasonZh: toTraditionalChinese(v.reasonZh || ''),
        })),
      };
      setAnalysis(cleanData);

      // Save writing record to persistent history for Dashboard
      try {
        const calculatedBand =
          cleanData.ieltsOverallBand ||
          cleanData.overallBand ||
          (cleanData.criteriaScores
            ? (cleanData.criteriaScores.taskResponse.band +
                cleanData.criteriaScores.coherenceCohesion.band +
                cleanData.criteriaScores.lexicalResource.band +
                cleanData.criteriaScores.grammar.band) /
              4
            : Number(targetBand) || 6.5);
        const roundedBand = Math.round(calculatedBand * 2) / 2;

        const newRecord: IELTSWritingRecord = {
          id: 'writing_' + Date.now(),
          timestamp: Date.now(),
          date: new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          task,
          promptId: activePrompt.id,
          promptTitle: isCustomPrompt ? (customPromptText.slice(0, 50) + '...') : activePrompt.title,
          lizCategory: activePrompt.lizCategory,
          overallBand: roundedBand,
          targetBand: Number(targetBand),
          criteriaScores: {
            taskResponse: cleanData.criteriaScores?.taskResponse?.band || roundedBand,
            coherenceCohesion: cleanData.criteriaScores?.coherenceCohesion?.band || roundedBand,
            lexicalResource: cleanData.criteriaScores?.lexicalResource?.band || roundedBand,
            grammar: cleanData.criteriaScores?.grammar?.band || roundedBand,
          },
          criteriaFeedback: {
            taskResponse: cleanData.criteriaScores?.taskResponse?.feedbackZh,
            coherenceCohesion: cleanData.criteriaScores?.coherenceCohesion?.feedbackZh,
            lexicalResource: cleanData.criteriaScores?.lexicalResource?.feedbackZh,
            grammar: cleanData.criteriaScores?.grammar?.feedbackZh,
          },
          wordCount: currentWordCount,
          timeSpentSeconds: defaultSeconds - timerSeconds > 0 ? defaultSeconds - timerSeconds : 1200,
          generalFeedbackZh: cleanData.generalFeedbackZh,
          strengths: cleanData.strengths,
          weaknesses: cleanData.weaknesses,
          ieltsActionPlan: cleanData.ieltsActionPlan,
          userDraft: fullDraft.trim(),
          polishedVersion: cleanData.nativePolishedVersion,
        };

        saveIELTSWritingRecord(newRecord);
        setRecordSavedToast(true);
        setTimeout(() => setRecordSavedToast(false), 6000);
      } catch (saveErr) {
        console.error('Failed to save writing record to dashboard:', saveErr);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : '批改失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  // Merge guided paragraphs into full essay
  const handleMergeGuidedDrafts = () => {
    if (task === 'task1') {
      const parts = [
        guidedDraftsTask1.intro.trim(),
        guidedDraftsTask1.overview.trim(),
        guidedDraftsTask1.body1.trim(),
        guidedDraftsTask1.body2.trim(),
      ].filter((p) => p.length > 0);
      setFullDraft(parts.join('\n\n'));
    } else {
      const parts = [
        guidedDraftsTask2.intro.trim(),
        guidedDraftsTask2.body1.trim(),
        guidedDraftsTask2.body2.trim(),
        guidedDraftsTask2.conclusion.trim(),
      ].filter((p) => p.length > 0);
      setFullDraft(parts.join('\n\n'));
    }
    setMode('full_essay');
  };

  const stepCount = task === 'task1' ? 4 : 5;

  const getStepInfo = (stepIdx: number) => {
    if (task === 'task1') {
      const steps = [
        { id: 0, title: '段落 1: 改寫題目', subtitle: 'Paraphrase Prompt (1-2句)' },
        { id: 1, title: '段落 2: Overview 總結', subtitle: 'The Vital Overview (嚴禁數字)' },
        { id: 2, title: '段落 3: 主體段 1', subtitle: 'Body 1 (分組特徵與細節)' },
        { id: 3, title: '段落 4: 主體段 2', subtitle: 'Body 2 (對比特徵與細節)' },
      ];
      return steps[stepIdx] || steps[0];
    } else {
      const steps = [
        { id: 0, title: '步驟 1: 5分鐘構思', subtitle: 'Analyze, Stance & 2 Ideas' },
        { id: 1, title: '段落 1: 引言段', subtitle: 'Paraphrase + Thesis (2句)' },
        { id: 2, title: '段落 2: 主體段 1', subtitle: 'PEEL Formula (核心理由 1)' },
        { id: 3, title: '段落 3: 主體段 2', subtitle: 'PEEL Formula (核心理由 2)' },
        { id: 4, title: '段落 4: 結論段', subtitle: 'Conclusion (重申立場無新點)' },
      ];
      return steps[stepIdx] || steps[0];
    }
  };

  const getCurrentStepText = (stepIdx: number): string => {
    if (task === 'task1') {
      if (stepIdx === 0) return guidedDraftsTask1.intro;
      if (stepIdx === 1) return guidedDraftsTask1.overview;
      if (stepIdx === 2) return guidedDraftsTask1.body1;
      return guidedDraftsTask1.body2;
    } else {
      if (stepIdx === 0) return guidedDraftsTask2.planning;
      if (stepIdx === 1) return guidedDraftsTask2.intro;
      if (stepIdx === 2) return guidedDraftsTask2.body1;
      if (stepIdx === 3) return guidedDraftsTask2.body2;
      return guidedDraftsTask2.conclusion;
    }
  };

  const updateCurrentStepText = (stepIdx: number, newText: string) => {
    if (task === 'task1') {
      setGuidedDraftsTask1((prev) => {
        if (stepIdx === 0) return { ...prev, intro: newText };
        if (stepIdx === 1) return { ...prev, overview: newText };
        if (stepIdx === 2) return { ...prev, body1: newText };
        return { ...prev, body2: newText };
      });
    } else {
      setGuidedDraftsTask2((prev) => {
        if (stepIdx === 0) return { ...prev, planning: newText };
        if (stepIdx === 1) return { ...prev, intro: newText };
        if (stepIdx === 2) return { ...prev, body1: newText };
        if (stepIdx === 3) return { ...prev, body2: newText };
        return { ...prev, conclusion: newText };
      });
    }
  };

  const handleGetModeBAdvice = async (stepIdx: number) => {
    const text = getCurrentStepText(stepIdx).trim();
    if (!text) {
      setModeBError('請先在本步驟填寫草稿內容，或點擊「AI 思路/句型啟發」獲取起步範本。');
      return;
    }
    setModeBError(null);
    setIsModeBAdviceLoading(true);
    try {
      const stepMeta = getStepInfo(stepIdx);
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
      if (!res.ok) throw new Error('AI 考官評析暫時無法連線。');
      const data: ModeBStepAdvice = await res.json();
      const cleanData: ModeBStepAdvice = {
        ...data,
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
      setModeBError(err?.message || '取得 AI 考官建議失敗，請稍後重試。');
    } finally {
      setIsModeBAdviceLoading(false);
    }
  };

  const handleGetModeBStarters = async (stepIdx: number) => {
    setModeBError(null);
    setIsModeBStartersLoading(true);
    try {
      const stepMeta = getStepInfo(stepIdx);
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
      setModeBError(err?.message || '取得句型啟發失敗，請稍後重試。');
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

  // Ask AI for single guided step feedback (backward compatibility)
  const handleStepAiCheck = async (stepText: string, stepName: string) => {
    if (!stepText.trim()) return;
    handleGetModeBAdvice(activeGuidedStep);
  };

  return (
    <div className="space-y-6 relative">
      {/* Floating Toast when writing assessment is saved to Dashboard */}
      {recordSavedToast && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-stone-900 text-white text-xs rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/40 animate-fade-in max-w-md">
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

      {/* 1. Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-stone-900 via-stone-850 to-stone-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
                <PenTool className="w-3.5 h-3.5" /> IELTS Liz Writing Studio
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                四項官方評分準則 × Liz 權威架構
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              雅思寫作工坊：高分思維與段落拆解
            </h1>
            <p className="text-sm text-stone-300 max-w-2xl leading-relaxed">
              整合 IELTS Liz 權威寫作技法——Task 1 客觀圖表報告（無數據 Overview 核心）與 Task 2 議論文五大題型（PEEL 段落開展）。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setMode(mode === 'liz_guide' ? 'full_essay' : 'liz_guide')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'liz_guide'
                  ? 'bg-amber-400 text-stone-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              {mode === 'liz_guide' ? '關閉 Liz 秘訣庫' : '查看 Liz 寫作技巧庫'}
            </button>
          </div>
        </div>

        {/* Task Switcher Pill in Header */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex p-1 rounded-2xl bg-stone-950/80 border border-white/10">
            <button
              onClick={() => {
                setTask('task1');
                setCategoryFilter('all');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                task === 'task1'
                  ? 'bg-amber-400 text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Task 1 學術圖表 (150+ 字 · 20分)
            </button>
            <button
              onClick={() => {
                setTask('task2');
                setCategoryFilter('all');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                task === 'task2'
                  ? 'bg-amber-400 text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <FileEdit className="w-4 h-4" />
              Task 2 論證作文 (250+ 字 · 40分 · 雙倍分值)
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              建議用時：{task === 'task1' ? '20 分鐘' : '40 分鐘'}
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              總分佔比：{task === 'task1' ? '33% (1/3)' : '67% (2/3)'}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Liz Lessons & Strategy Guide Drawer (Collapsible) */}
      {mode === 'liz_guide' && (
        <section className="rounded-3xl border border-amber-300/60 bg-amber-50/40 p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700" />
              <h2 className="text-lg font-bold text-stone-900">
                IELTS Liz {task === 'task1' ? 'Task 1 核心教戰與圖表全解' : 'Task 2 五大題型與論證秘訣'}
              </h2>
            </div>
            <button
              onClick={() => setMode('full_essay')}
              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded-lg cursor-pointer"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {task === 'task1' ? (
            <div className="space-y-6">
              {/* Task 1 Steps */}
              <div>
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3">
                  Liz Task 1 五大備考關鍵步驟 (Preparation Steps)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {LIZ_TASK1_PREPARATION_STEPS.map((item) => (
                    <div key={item.step} className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-xs">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                          {item.step}
                        </span>
                        <h4 className="text-xs font-bold text-stone-900 leading-tight">{item.titleZh}</h4>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{item.summaryZh}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task 1 Fatal Traps */}
              <div>
                <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" /> Liz 提醒：Task 1 四大常見致命失分陷阱
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LIZ_TASK1_FATAL_TRAPS.map((trap, idx) => (
                    <div key={idx} className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                        <span className="rounded-md bg-rose-200 px-1.5 py-0.5 text-[10px] text-rose-800">陷阱</span>
                        {trap.trap}
                      </div>
                      <p className="text-xs text-rose-700"><strong>後果：</strong>{trap.impact}</p>
                      <p className="text-xs text-emerald-800"><strong>Liz 應對解方：</strong>{trap.solution}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task 1 Visual Types Quick Guide */}
              <div>
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3">
                  Liz 7 大學術圖表類型速查 (7 Visual Types Breakdown)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {LIZ_TASK1_VISUAL_TYPES.map((v) => (
                    <div key={v.id} className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2 hover:border-amber-400 transition">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-stone-900">{v.titleZh}</h4>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                          {v.id}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600">{v.description}</p>
                      <div className="rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-900">
                        <strong>Overview 秘訣：</strong>{v.overviewTips}
                      </div>
                      <div className="rounded-xl bg-stone-50 p-2.5 text-[11px] text-stone-700">
                        <strong>Liz 黃金法則：</strong>{v.lizGoldenRule}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Task 2 Essay Types Breakdown */}
              <div>
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3">
                  Liz 5 大議論文題型深度解析 (5 IELTS Essay Types)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {LIZ_TASK2_ESSAY_TYPES.map((type) => (
                    <div key={type.id} className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-stone-900">{type.titleZh}</h4>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                          {type.titleEn.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{type.description}</p>
                      <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-3 text-xs text-emerald-950">
                        <strong>Liz 核心策略：</strong>{type.lizStrategy}
                      </div>
                      <div className="space-y-1.5 border-t border-stone-100 pt-2 text-xs">
                        <p className="font-bold text-stone-700">標準 4 段結構：</p>
                        {type.paragraphStructure.map((p, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-stone-600">
                            <span className="font-bold text-amber-700 shrink-0">{p.paragraph.split(':')[0]}:</span>
                            <span>{p.focus}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liz 5-min Planning & PEEL Formula */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" /> Liz 5 分鐘審題構思法 (5-Minute Planning)
                  </h4>
                  <p className="text-xs text-stone-500">動筆前花 5 分鐘構思，是避免偏題與停滯的最佳保障：</p>
                  <div className="space-y-2">
                    {LIZ_PLANNING_STEPS.map((step, idx) => (
                      <div key={idx} className="rounded-xl bg-stone-50 p-3 text-xs space-y-1">
                        <div className="font-bold text-stone-900">{step.minute} · {step.titleZh}</div>
                        <div className="text-stone-600">{step.descZh}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" /> Liz PEEL 主體段發展公式
                  </h4>
                  <p className="text-xs text-stone-500">主體段落嚴格遵循 PEEL 架構，確保連貫性與深度：</p>
                  <div className="space-y-2">
                    {Object.values(LIZ_PARAGRAPH_PEEL_FORMULA).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-xl bg-stone-50 p-3 text-xs">
                        <span className="w-6 h-6 rounded-lg bg-stone-900 text-white font-black flex items-center justify-center shrink-0">
                          {item.letter}
                        </span>
                        <div>
                          <p className="font-bold text-stone-900">{item.name}</p>
                          <p className="text-stone-600">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. Prompt & Category Selector */}
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">
              選擇題型與真題題庫 ({taskPrompts.length} 題可用)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomPrompt(!isCustomPrompt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isCustomPrompt
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {isCustomPrompt ? '使用真題庫' : '+ 自訂題目 / 歷屆真題'}
            </button>
          </div>
        </div>

        {/* Liz Category Filter Pills */}
        {!isCustomPrompt && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
            <span className="text-xs font-semibold text-stone-500 mr-1">Liz 題型篩選：</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              全部 ({taskPrompts.length})
            </button>

            {task === 'task1'
              ? LIZ_TASK1_VISUAL_TYPES.map((v) => {
                  const count = taskPrompts.filter((p) => p.lizCategory === v.id).length;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setCategoryFilter(v.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                        categoryFilter === v.id
                          ? 'bg-amber-400 text-stone-950'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {v.titleZh.split(' ')[0]} ({count})
                    </button>
                  );
                })
              : LIZ_TASK2_ESSAY_TYPES.map((e) => {
                  const count = taskPrompts.filter((p) => p.lizCategory === e.id).length;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setCategoryFilter(e.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                        categoryFilter === e.id
                          ? 'bg-amber-400 text-stone-950'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {e.titleZh.split(' ')[0]} ({count})
                    </button>
                  );
                })}
          </div>
        )}

        {/* Prompt Selector Dropdown or Custom Input */}
        {isCustomPrompt ? (
          <div className="space-y-3 rounded-2xl bg-stone-50 p-4 border border-stone-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700">自訂標題</label>
                <input
                  type="text"
                  value={customPromptTitle}
                  onChange={(e) => setCustomPromptTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700">目標分數 (Band Score)</label>
                <select
                  value={targetBand}
                  onChange={(e) => setTargetBand(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-hidden"
                >
                  {['6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'].map((b) => (
                    <option key={b} value={b}>Band {b}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-700">題目完整內容 (Topic Prompt)</label>
              <textarea
                value={customPromptText}
                onChange={(e) => setCustomPromptText(e.target.value)}
                placeholder="貼上你的真題題目，例如：Some people believe that..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm leading-relaxed focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={activePrompt.id}
              onChange={(e) => onPromptChange(e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-sm font-semibold text-stone-900 focus:bg-white focus:outline-hidden focus:border-amber-400"
            >
              {filteredPrompts.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.task === 'task1' ? 'Task 1' : 'Task 2'} - {p.lizCategory}] {p.title}
                </option>
              ))}
            </select>

            {/* Prompt Detail Box */}
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-bold text-white">
                    {activePrompt.task.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                    {activePrompt.lizCategory}
                  </span>
                  <span className="text-xs font-bold text-stone-700">{activePrompt.title}</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <a
                    href={activePrompt.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-stone-600 hover:text-amber-700"
                  >
                    題源來源 <ExternalLink className="w-3 h-3" />
                  </a>
                  {activePrompt.sampleUrl && (
                    <a
                      href={activePrompt.sampleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      查看 Band {activePrompt.sampleBand || 9} 官方範文 <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white border border-stone-200 p-3.5 text-sm text-stone-800 leading-relaxed font-serif">
                "{activePrompt.prompt}"
              </div>

              {/* Task 1 Visual Preview if available */}
              {task === 'task1' && activePrompt.imageUrl && (
                <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                  <div className="relative group">
                    <img
                      src={activePrompt.imageUrl}
                      alt={activePrompt.title}
                      className="max-h-60 w-full object-contain p-2 cursor-zoom-in"
                      onClick={() => setIsImageModalOpen(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsImageModalOpen(true)}
                      className="absolute top-2 right-2 rounded-lg bg-stone-900/80 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-xs flex items-center gap-1.5 hover:bg-stone-900 cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> 放大查看圖表
                    </button>
                  </div>
                </div>
              )}

              {/* Task 1 PDF note */}
              {task === 'task1' && !activePrompt.imageUrl && activePrompt.pdfPage && (
                <div className="flex items-center justify-between rounded-xl bg-amber-50/70 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900">
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    圖表收錄於劍橋圖表題大全 PDF 第 {activePrompt.pdfPage} 頁
                  </span>
                  <a
                    href={`${activePrompt.sourceUrl}#page=${activePrompt.pdfPage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-amber-800 hover:text-amber-950 inline-flex items-center gap-1"
                  >
                    開啟 PDF 第 {activePrompt.pdfPage} 頁 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Liz Contextual Advice Banner */}
              <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Liz 題型策略：{task === 'task1' ? currentLizTask1Info?.titleZh : currentLizTask2Info?.titleZh}
                </div>
                <p className="leading-relaxed">
                  {task === 'task1' ? currentLizTask1Info?.lizGoldenRule : currentLizTask2Info?.lizGoldenRule}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Practice Mode Switcher (Full Essay vs Guided 4-Paragraphs) */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('full_essay')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              mode === 'full_essay'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            模式 A：全真計時寫作 (Full Timed Essay)
          </button>
          <button
            onClick={() => setMode('guided_steps')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              mode === 'guided_steps'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-500" />
            模式 B：Liz 四段分步拆解 (Guided Builder)
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-stone-500">
          <span>
            目前字數：<strong className={currentWordCount >= minWordsRequired ? 'text-emerald-700' : 'text-amber-700'}>{currentWordCount}</strong> / 建議 {minWordsRequired}–{recommendedMaxWords} 字
          </span>
          <span>•</span>
          <span>
            段落數：<strong className={paragraphCount === 4 ? 'text-emerald-700' : 'text-stone-700'}>{paragraphCount}</strong> / 建議標準 4 段
          </span>
        </div>
      </div>

      {/* 5. Mode A: Full Timed Essay Practice */}
      {mode === 'full_essay' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Writing Area (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
              {/* Controls Bar: Timer + Word Count + Band Target */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 rounded-2xl p-3 border border-stone-200">
                {/* Timer */}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${
                      timerSeconds <= 5 * 60 && timerSeconds > 0
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : 'bg-white text-stone-800 border border-stone-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {formatTimer(timerSeconds)}
                  </div>
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer"
                    title={isTimerRunning ? '暫停計時' : '開始計時'}
                  >
                    {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimerSeconds(defaultSeconds);
                    }}
                    className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-500 cursor-pointer"
                    title="重設計時"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Target Band & Quick Actions */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                    目標 Band
                    <select
                      value={targetBand}
                      onChange={(e) => setTargetBand(e.target.value)}
                      className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-bold text-stone-800"
                    >
                      {['6.0', '6.5', '7.0', '7.5', '8.0', '8.5'].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={handleMergeGuidedDrafts}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                    title="將模式 B 寫的各段合併匯入此處"
                  >
                    匯入引導草稿
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                  <span>貼上或在此輸入完整作文（建議標準 4 段結構）</span>
                  <span className={currentWordCount >= minWordsRequired ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {currentWordCount} 字 {currentWordCount < minWordsRequired ? `(尚缺 ${minWordsRequired - currentWordCount} 字)` : '✓ 達標'}
                  </span>
                </div>
                <textarea
                  value={fullDraft}
                  onChange={(e) => setFullDraft(e.target.value)}
                  rows={16}
                  placeholder={
                    task === 'task1'
                      ? `[Paragraph 1: Introduction - 改寫題目]\nThe provided chart illustrates...\n\n[Paragraph 2: Overview - 總結主要特徵，不附數據]\nOverall, it is clear that...\n\n[Paragraph 3: Detail Paragraph 1 - 第一組特徵與數據]\nIn terms of...\n\n[Paragraph 4: Detail Paragraph 2 - 第二組對比特徵與數據]\nBy contrast...`
                      : `[Paragraph 1: Introduction - 改寫題目與明確立場]\nIt is often argued that... In my opinion, I firmly agree that...\n\n[Paragraph 2: Body 1 - 第一核心理由 (PEEL)]\nThe primary justification for my stance is that...\n\n[Paragraph 3: Body 2 - 第二核心理由 (PEEL)]\nFurthermore, another compelling argument is that...\n\n[Paragraph 4: Conclusion - 重申立場與要點總結]\nIn conclusion, while some argue that... I believe that...`
                  }
                  className="w-full resize-y rounded-2xl border border-stone-200 bg-stone-50/50 p-4 font-sans text-sm leading-7 text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-400 focus:ring-1 focus:ring-stone-300"
                />
              </div>

              {/* Word Count Progress Bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
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
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>最低門檻: {minWordsRequired} 字</span>
                  <span>建議理想區間: {minWordsRequired}–{recommendedMaxWords} 字</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={isLoading || !fullDraft.trim()}
                  onClick={handleFullReview}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-stone-800 disabled:opacity-40 cursor-pointer transition"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  {isLoading ? 'IELTS 考官依四項評分準則診斷中...' : '送出由 AI 考官深度批改'}
                </button>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          {/* Feedback Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {analysis ? (
              <div className="space-y-4 animate-fade-in">
                {/* Score Summary Card */}
                <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-stone-500">預估 Overall Band</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-extrabold text-stone-900">
                          {analysis.ieltsOverallBand ? analysis.ieltsOverallBand.toFixed(1) : (analysis.score / 20).toFixed(1)}
                        </span>
                        <span className="text-xs font-semibold text-stone-500">/ 9.0</span>
                        <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          CEFR {analysis.cefrLevel || 'B2'}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>

                  {/* 4 Official Criteria Scores */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {CRITERIA_INFO.map((c) => {
                      const score = analysis.ieltsScores?.[c.key];
                      return (
                        <div key={c.key} className="rounded-2xl bg-stone-50 p-3 space-y-1">
                          <p className="text-[11px] font-bold text-stone-600 truncate">{c.labelZh}</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xl font-bold text-stone-900">{score ? score.toFixed(1) : '—'}</span>
                            <span className="text-[10px] text-stone-400 font-mono">Band</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Liz High-Impact Action Plan */}
                {analysis.ieltsActionPlan && analysis.ieltsActionPlan.length > 0 && (
                  <div className="rounded-3xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <h3 className="text-sm font-bold text-stone-900">Liz 考官建議：三大關鍵提分行動</h3>
                    </div>
                    <ul className="space-y-2">
                      {analysis.ieltsActionPlan.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-stone-800 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 作文做得好的亮點
                    </h3>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-stone-700">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Grammar & Vocabulary Issues */}
                {analysis.grammarIssues && analysis.grammarIssues.length > 0 && (
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" /> 句子級語法錯誤與修改 ({analysis.grammarIssues.length} 處)
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {analysis.grammarIssues.map((issue, idx) => (
                        <div key={idx} className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-stone-500">{issue.rule}</span>
                            <span className="text-rose-600 font-semibold">修改建議</span>
                          </div>
                          <p className="line-through text-stone-400 font-mono text-[11px]">{issue.original}</p>
                          <p className="text-emerald-700 font-semibold font-mono text-[12px]">➔ {issue.correction}</p>
                          <p className="text-stone-600 text-[11px] leading-relaxed pt-1 border-t border-stone-200/60">
                            {issue.explanationZh}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Native Polished Rewrite */}
                {analysis.nativePolishedVersion && (
                  <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> 母語考官潤飾範文 (Band 8.5+ 範式)
                    </h3>
                    <div className="rounded-2xl bg-stone-50 p-4 text-xs font-serif leading-relaxed text-stone-800 whitespace-pre-wrap">
                      {analysis.nativePolishedVersion}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-400 mx-auto">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-stone-800">等待提交作文</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                  在左側編輯器貼上你的 {task === 'task1' ? 'Task 1 圖表作文' : 'Task 2 議論文'}，點擊「送出由 AI 考官深度批改」，即可獲得完整四項指標報告與 Liz 行動清單。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Mode B: Liz Guided 4-Paragraph Builder */}
      {mode === 'guided_steps' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-amber-300/60 bg-linear-to-r from-amber-50/60 via-amber-100/30 to-stone-50 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">IELTS Liz Guided Method</span>
              <h2 className="text-lg font-bold text-stone-900 mt-0.5">
                {task === 'task1' ? 'Task 1 四段結構分步打造' : 'Task 2 五步構思與段落打造'}
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                逐段攻克！每段均配有 Liz 專屬提示與句型，完成後可一鍵「合併匯入全篇模考」。
              </p>
            </div>
            <button
              onClick={handleMergeGuidedDrafts}
              className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-stone-800 cursor-pointer shrink-0"
            >
              合併匯入全篇模考 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step Navigation Tabs */}
          <div className={`grid gap-2 ${task === 'task1' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>
            {task === 'task1' ? (
              [
                { id: 0, title: '段落 1: 改寫題目', subtitle: 'Paraphrase Prompt (1-2句)' },
                { id: 1, title: '段落 2: Overview 總結', subtitle: 'The Vital Overview (嚴禁數字)' },
                { id: 2, title: '段落 3: 主體段 1', subtitle: 'Body 1 (分組特徵與細節)' },
                { id: 3, title: '段落 4: 主體段 2', subtitle: 'Body 2 (對比特徵與細節)' },
              ].map((s) => {
                const text = getCurrentStepText(s.id);
                const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
                const hasAdvice = Boolean(modeBAdvices[s.id]);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveGuidedStep(s.id)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                      activeGuidedStep === s.id
                        ? 'border-amber-400 bg-amber-50/90 shadow-xs ring-1 ring-amber-300'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-700">STEP 0{s.id + 1}</span>
                      {wc > 0 && (
                        <span className="text-[10px] font-mono font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">
                          {wc} 字
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-stone-900 mt-1">{s.title}</p>
                    <p className="text-[11px] text-stone-500 truncate">{s.subtitle}</p>
                    {hasAdvice && (
                      <span className="absolute bottom-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              [
                { id: 0, title: '步驟 1: 5分鐘構思', subtitle: 'Analyze, Stance & 2 Ideas' },
                { id: 1, title: '段落 1: 引言段', subtitle: 'Paraphrase + Thesis (2句)' },
                { id: 2, title: '段落 2: 主體段 1', subtitle: 'PEEL Formula (核心理由 1)' },
                { id: 3, title: '段落 3: 主體段 2', subtitle: 'PEEL Formula (核心理由 2)' },
                { id: 4, title: '段落 4: 結論段', subtitle: 'Conclusion (重申立場無新點)' },
              ].map((s) => {
                const text = getCurrentStepText(s.id);
                const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
                const hasAdvice = Boolean(modeBAdvices[s.id]);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveGuidedStep(s.id)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                      activeGuidedStep === s.id
                        ? 'border-amber-400 bg-amber-50/90 shadow-xs ring-1 ring-amber-300'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-700">STEP 0{s.id + 1}</span>
                      {wc > 0 && (
                        <span className="text-[10px] font-mono font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">
                          {wc} 字
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-stone-900 mt-1">{s.title}</p>
                    <p className="text-[11px] text-stone-500 truncate">{s.subtitle}</p>
                    {hasAdvice && (
                      <span className="absolute bottom-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Active Step Workspace */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
            {/* Step Action Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                  {getStepInfo(activeGuidedStep).title}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  目前字數：<strong className="text-stone-800 font-mono">{getCurrentStepText(activeGuidedStep).trim() ? getCurrentStepText(activeGuidedStep).trim().split(/\s+/).length : 0}</strong> 字
                </span>
              </div>

              {/* AI Guidance Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGetModeBStarters(activeGuidedStep)}
                  disabled={isModeBStartersLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/80 px-3.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100/80 disabled:opacity-50 cursor-pointer shadow-2xs transition"
                >
                  {isModeBStartersLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" /> : <Lightbulb className="w-3.5 h-3.5 text-amber-600" />}
                  AI 思路/句型啟發 (零贅詞)
                </button>
                <button
                  type="button"
                  onClick={() => handleGetModeBAdvice(activeGuidedStep)}
                  disabled={isModeBAdviceLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 cursor-pointer shadow-xs transition"
                >
                  {isModeBAdviceLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  AI 考官即時診斷與建議 (去贅詞)
                </button>
              </div>
            </div>

            {/* Error Message */}
            {modeBError && (
              <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modeBError}</span>
                </div>
                <button
                  onClick={() => setModeBError(null)}
                  className="text-rose-600 hover:text-rose-900 text-xs font-bold underline cursor-pointer"
                >
                  關閉
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {(isModeBAdviceLoading || isModeBStartersLoading) && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                <span>
                  {isModeBStartersLoading
                    ? 'AI 導師正在以 IELTS Liz 高分題型準則，生成 3 組去贅詞精準開頭與論點骨架...'
                    : 'AI 考官正嚴格檢視本段：剔除贅詞、檢查 Liz 核心規則、升級學術搭配與生成精煉示範...'}
                </span>
              </div>
            )}

            {/* AI Starters Card */}
            {modeBStarters[activeGuidedStep] && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    本段 AI 思路與高分開頭建議（無贅詞骨架）
                  </span>
                  <button
                    onClick={() =>
                      setModeBStarters((prev) => ({ ...prev, [activeGuidedStep]: null }))
                    }
                    className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                    title="關閉"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {modeBStarters[activeGuidedStep]?.starters.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-amber-200/80 bg-white p-3 shadow-2xs space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {item.title}
                        </span>
                        <p className="text-xs font-semibold text-stone-900 leading-snug font-mono">
                          "{item.text}"
                        </p>
                        <p className="text-[11px] text-stone-600 leading-tight">
                          {item.rationale}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyStarter(activeGuidedStep, item.text)}
                        className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-amber-50 py-1.5 text-[11px] font-bold text-amber-900 border border-amber-200 hover:bg-amber-100 cursor-pointer transition mt-2"
                      >
                        <Wand2 className="w-3 h-3 text-amber-600" /> 帶入本段草稿
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Advice Card */}
            {modeBAdvices[activeGuidedStep] && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      AI 考官本段診斷與建議（嚴格去贅詞）
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      setModeBAdvices((prev) => ({ ...prev, [activeGuidedStep]: null }))
                    }
                    className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                    title="關閉"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1. Concise Verdict & Liz Rule */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-stone-700" /> 考官核心診斷（直切要點）
                    </span>
                    <p className="text-xs font-medium text-stone-800 leading-relaxed">
                      {modeBAdvices[activeGuidedStep]?.conciseDiagnosis}
                    </p>
                  </div>

                  <div className={`rounded-xl border p-3.5 space-y-1 ${
                    modeBAdvices[activeGuidedStep]?.lizKeyRuleCheck.passed
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-amber-200 bg-amber-50/50'
                  }`}>
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${
                      modeBAdvices[activeGuidedStep]?.lizKeyRuleCheck.passed ? 'text-emerald-800' : 'text-amber-800'
                    }`}>
                      {modeBAdvices[activeGuidedStep]?.lizKeyRuleCheck.passed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      Liz 核心準則檢核
                    </span>
                    <p className="text-xs font-medium text-stone-800 leading-relaxed">
                      {modeBAdvices[activeGuidedStep]?.lizKeyRuleCheck.tip}
                    </p>
                  </div>
                </div>

                {/* 2. Wordiness Verdict (去贅詞亮點) */}
                <div className="rounded-xl border border-rose-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-rose-600" /> 去贅詞與空話檢測（避免冗長模板詞）
                    </span>
                    {modeBAdvices[activeGuidedStep]?.wordinessVerdict.hasFillers && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFillers(activeGuidedStep)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-700 cursor-pointer transition shadow-2xs"
                      >
                        <Scissors className="w-3 h-3" /> 一鍵清除本段贅詞
                      </button>
                    )}
                  </div>

                  {modeBAdvices[activeGuidedStep]?.wordinessVerdict.hasFillers ? (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] text-stone-600">
                        檢測到以下模板贅詞或無效套話，雅思考官強烈建議精簡：
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {modeBAdvices[activeGuidedStep]?.wordinessVerdict.fillers.map((f, fIdx) => (
                          <div
                            key={fIdx}
                            className="rounded-lg border border-rose-100 bg-rose-50/60 p-2.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="line-through font-mono text-rose-700 font-semibold">
                                "{f.phrase}"
                              </span>
                              <span className="rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-bold text-rose-900">
                                ➔ {f.fix}
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-900 leading-snug">{f.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2 border border-emerald-200/60">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>語句精簡扎實，未檢測到模板贅詞或空泛套話，符合母語學術寫作要求。</span>
                    </div>
                  )}
                </div>

                {/* 3. Native Polished Version */}
                <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-amber-500" /> AI 精煉示範（Band 8+ 無贅詞重寫）
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (modeBAdvices[activeGuidedStep]?.polishedText) {
                            navigator.clipboard.writeText(modeBAdvices[activeGuidedStep]!.polishedText);
                            setCopiedStepPolish(activeGuidedStep);
                            setTimeout(() => setCopiedStepPolish(null), 2000);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
                      >
                        {copiedStepPolish === activeGuidedStep ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> 已複製
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> 複製
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPolishedVersion(activeGuidedStep)}
                        className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1 text-[11px] font-bold text-white hover:bg-stone-800 cursor-pointer shadow-2xs transition"
                      >
                        <Wand2 className="w-3 h-3 text-amber-400" /> 套用至本段草稿
                      </button>
                    </div>
                  </div>
                  <p className="rounded-xl bg-stone-50 p-3.5 text-xs text-stone-900 leading-relaxed font-mono border border-stone-200/80">
                    {modeBAdvices[activeGuidedStep]?.polishedText}
                  </p>
                </div>

                {/* 4. Lexical Upgrades & Action Point */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2 rounded-xl border border-stone-200 bg-white p-3.5 space-y-2">
                    <span className="text-[11px] font-bold text-stone-600">💎 高分學術搭配詞（精準替換）</span>
                    <div className="flex flex-wrap gap-2">
                      {(modeBAdvices[activeGuidedStep]?.lexicalUpgrades || []).map((u, uIdx) => (
                        <div
                          key={uIdx}
                          className="rounded-lg bg-stone-100 px-2.5 py-1 text-[11px] text-stone-800 border border-stone-200 flex items-center gap-1"
                        >
                          <span className="line-through text-stone-400">{u.original}</span>
                          <span className="font-bold text-stone-900">➔ {u.upgraded}</span>
                          <span className="text-[10px] text-stone-500">({u.note})</span>
                        </div>
                      ))}
                      {(!modeBAdvices[activeGuidedStep]?.lexicalUpgrades ||
                        modeBAdvices[activeGuidedStep]!.lexicalUpgrades.length === 0) && (
                        <span className="text-xs text-stone-500">詞彙使用得當。</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-amber-900">⚡ 下一步行動指令</span>
                    <p className="text-xs font-semibold text-amber-950 leading-relaxed">
                      {modeBAdvices[activeGuidedStep]?.actionPoint}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step Guidance & Editor Area */}
            {task === 'task1' ? (
              // Task 1 Steps Content
              activeGuidedStep === 0 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-amber-50/60 p-4 text-xs text-amber-950 space-y-2 border border-amber-200/60">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <Lightbulb className="w-4 h-4 text-amber-600" /> Liz 秘訣：第一段改寫題幹 (Paraphrasing)
                    </p>
                    <p className="leading-relaxed">
                      用 1–2 句話換言改寫題目。不要照抄原題單字！善用動詞轉換（shows ➔ illustrates / depicts / reveals），名詞轉換（number of ➔ proportion of / figure for）。
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px] text-amber-900">
                      <span className="bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">The provided line graph illustrates...</span>
                      <span className="bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">The chart presents data regarding...</span>
                    </div>
                  </div>
                  <textarea
                    value={guidedDraftsTask1.intro}
                    onChange={(e) => setGuidedDraftsTask1({ ...guidedDraftsTask1, intro: e.target.value })}
                    rows={4}
                    placeholder="寫下你的改寫段落（1-2 句話）..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed focus:bg-white focus:outline-hidden focus:border-amber-400 font-sans"
                  />
                </div>
              ) : activeGuidedStep === 1 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-rose-50/60 p-4 text-xs text-rose-950 space-y-2 border border-rose-200/60">
                    <p className="font-bold flex items-center gap-1.5 text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600" /> Liz 嚴正提醒：Overview 總結段（決定 Band 7+ 的生死段）
                    </p>
                    <p className="leading-relaxed">
                      1. <strong>絕對不能包含具體數字！</strong>一旦包含數字，就退化成細節段，Overview 視為缺失。<br />
                      2. 歸納 2 到 3 個最宏觀的趨勢（整體上升還是下降？哪個項目始終最高/最低？）。
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px] text-rose-900">
                      <span className="bg-white/80 px-2 py-0.5 rounded-md border border-rose-200">Overall, it is immediately apparent that...</span>
                      <span className="bg-white/80 px-2 py-0.5 rounded-md border border-rose-200">In general, while X witnessed a steady rise, Y declined significantly.</span>
                    </div>
                  </div>
                  <textarea
                    value={guidedDraftsTask1.overview}
                    onChange={(e) => setGuidedDraftsTask1({ ...guidedDraftsTask1, overview: e.target.value })}
                    rows={4}
                    placeholder="寫下你的 Overview 概述（2-3 句，無任何具體數字）..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed focus:bg-white focus:outline-hidden focus:border-amber-400 font-sans"
                  />
                </div>
              ) : activeGuidedStep === 2 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-stone-50 p-4 text-xs text-stone-800 space-y-2 border border-stone-200">
                    <p className="font-bold flex items-center gap-1.5 text-stone-900">
                      <Layers className="w-4 h-4 text-stone-700" /> Liz 秘訣：Body 1 邏輯分組與關鍵數據
                    </p>
                    <p className="leading-relaxed">
                      挑選第一組關鍵資訊（例如走勢相同的類別，或年代的前半期，或數值最高的項目）。標出起始數值、峰值、並進行精確對比。
                    </p>
                  </div>
                  <textarea
                    value={guidedDraftsTask1.body1}
                    onChange={(e) => setGuidedDraftsTask1({ ...guidedDraftsTask1, body1: e.target.value })}
                    rows={6}
                    placeholder="描寫第一組特徵與具體數值..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed focus:bg-white focus:outline-hidden focus:border-amber-400 font-sans"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-stone-50 p-4 text-xs text-stone-800 space-y-2 border border-stone-200">
                    <p className="font-bold flex items-center gap-1.5 text-stone-900">
                      <Layers className="w-4 h-4 text-stone-700" /> Liz 秘訣：Body 2 剩餘特徵與深入對比
                    </p>
                    <p className="leading-relaxed">
                      描寫剩餘類別或後半期變化，使用強烈的對比連接詞（By contrast, In stark comparison, Whereas, Meanwhile）。
                    </p>
                  </div>
                  <textarea
                    value={guidedDraftsTask1.body2}
                    onChange={(e) => setGuidedDraftsTask1({ ...guidedDraftsTask1, body2: e.target.value })}
                    rows={6}
                    placeholder="描寫第二組對比特徵與具體數值..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed focus:bg-white focus:outline-hidden focus:border-amber-400 font-sans"
                  />
                </div>
              )
            ) : (
              // Task 2 Steps Content
              activeGuidedStep === 0 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-amber-50/60 p-4 text-xs text-amber-950 space-y-2 border border-amber-200/60">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <Clock className="w-4 h-4 text-amber-600" /> Liz 5 分鐘構思：審題、立場與 2 個主要論點
                    </p>
                    <p className="leading-relaxed">
                      1. 題目屬於 Liz 5 大題型的哪一種？（{currentLizTask2Info?.titleZh}）<br />
                      2. 你的明確立場是什麼？<br />
                      3. 構思 2 個最容易用英文論證的 Main Ideas，並為每個 Idea 想好一個例子。
                    </p>
                  </div>
                  <textarea
                    value={guidedDraftsTask2.planning}
                    onChange={(e) => setGuidedDraftsTask2({ ...guidedDraftsTask2, planning: e.target.value })}
                    rows={5}
                    placeholder="大綱筆記：&#10;- 題型：Opinion / Discussion...&#10;- 我的立場：Agree / Disagree...&#10;- Idea 1 + Example: ...&#10;- Idea 2 + Example: ..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed focus:bg-white focus:outline-hidden focus:border-amber-400 font-sans"
                  />
                </div>
              ) : activeGuidedStep === 1 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-emerald-50/60 p-4 text-xs text-emerald-950 space-y-2 border border-emerald-200/60">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <Lightbulb className="w-4 h-4 text-emerald-600" /> Liz 秘訣：引言段 (Introduction & Thesis Statement)
                    </p>
                    <p className="leading-relaxed">
                      首段 2 句話足矣：<br />
                      第 1 句：改寫題目背景。<br />
                      第 2 句：清楚表明立場 (Thesis Statement)，向考官預告文章基調。
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px] text-emerald-900">
                      <span className="bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">It is commonly believed that... However, I firmly agree that...</span>
                    </div>
                  </div>
                  <textarea
                    value={guidedDraftsTask2.intro}
                    onChange={(e) => setGuidedDraftsTask2({ ...guidedDraftsTask2, intro: e.target.value })}
                    rows={4}
                    placeholder="寫下 Introduction 改寫句與立場句..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed focus:bg-white focus:outline-hidden focus:border-amber-400 font-sans"
                  />
                </div>
              ) : activeGuidedStep === 2 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-stone-50 p-4 text-xs text-stone-800 space-y-2 border border-stone-200">
                    <p className="font-bold flex items-center gap-1.5 text-stone-900">
                      <Layers className="w-4 h-4 text-stone-700" /> Liz 秘訣：Body 1 核心論點 (PEEL Formula)
                    </p>
                    <p className="leading-relaxed">
                      <strong>P</strong>oint（主題句）➔ <strong>E</strong>xplain（深入解釋原因）➔ <strong>E</strong>xample（真實/典型實例）➔ <strong>L</strong>ink（總結扣回題目）。
                    </p>
                  </div>
                  <textarea
                    value={guidedDraftsTask2.body1}
                    onChange={(e) => setGuidedDraftsTask2({ ...guidedDraftsTask2, body1: e.target.value })}
                    rows={7}
                    placeholder="Body 1: 主題句 ➔ 原因解釋 ➔ 實例 ➔ 小結扣題..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed focus:bg-white focus:outline-hidden focus:border-amber-400 font-sans"
                  />
                </div>
              ) : activeGuidedStep === 3 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-stone-50 p-4 text-xs text-stone-800 space-y-2 border border-stone-200">
                    <p className="font-bold flex items-center gap-1.5 text-stone-900">
                      <Layers className="w-4 h-4 text-stone-700" /> Liz 秘訣：Body 2 第二核心論點 (PEEL Formula)
                    </p>
                    <p className="leading-relaxed">
                      提出另一個維度的獨立論點（如社會效益、經濟成本、心理發展等），重複 PEEL 開展步驟。
                    </p>
                  </div>
                  <textarea
                    value={guidedDraftsTask2.body2}
                    onChange={(e) => setGuidedDraftsTask2({ ...guidedDraftsTask2, body2: e.target.value })}
                    rows={7}
                    placeholder="Body 2: 第二論點主題句 ➔ 原因解釋 ➔ 實例 ➔ 小結扣題..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed focus:bg-white focus:outline-hidden focus:border-amber-400 font-sans"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-amber-50/60 p-4 text-xs text-amber-950 space-y-2 border border-amber-200/60">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <CheckCircle2 className="w-4 h-4 text-amber-600" /> Liz 秘訣：結論段 (Conclusion - 總結要點，絕不引進新論點)
                    </p>
                    <p className="leading-relaxed">
                      1. <strong>重申立場</strong>：用不同的詞彙再次肯定 Introduction 中的立場。<br />
                      2. <strong>概括主要論點</strong>：用 1–2 句話簡潔總結 Body 1 和 Body 2 的核心要點。<br />
                      3. <strong>嚴格去贅詞</strong>：切勿引入全新論點或冗長廢話。
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px] text-amber-900">
                      <span className="bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">In conclusion, I firmly maintain that... because... and...</span>
                    </div>
                  </div>
                  <textarea
                    value={guidedDraftsTask2.conclusion}
                    onChange={(e) => setGuidedDraftsTask2({ ...guidedDraftsTask2, conclusion: e.target.value })}
                    rows={5}
                    placeholder="寫下你的結論段（重申立場 + 概括兩大論點，無新論據）..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed focus:bg-white focus:outline-hidden focus:border-amber-400 font-sans"
                  />
                </div>
              )
            )}

            {/* Step Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2">
                {activeGuidedStep > 0 && (
                  <button
                    onClick={() => setActiveGuidedStep(activeGuidedStep - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 cursor-pointer transition"
                  >
                    ← 上一步 ({getStepInfo(activeGuidedStep - 1).title})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeGuidedStep < (task === 'task1' ? 3 : 4) ? (
                  <button
                    onClick={() => setActiveGuidedStep(activeGuidedStep + 1)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 cursor-pointer transition shadow-xs flex items-center gap-1.5"
                  >
                    下一步 ({getStepInfo(activeGuidedStep + 1).title}) →
                  </button>
                ) : (
                  <button
                    onClick={handleMergeGuidedDrafts}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer transition shadow-xs flex items-center gap-1.5"
                  >
                    完成所有步驟，合併匯入全篇模考 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Fullscreen Visual Modal (for Task 1 diagrams) */}
      {isImageModalOpen && activePrompt.imageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">{activePrompt.title} · 圖表原圖</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImageScale((prev) => Math.min(2.5, prev + 0.2))}
                  className="p-2 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer"
                  title="放大"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setImageScale((prev) => Math.max(0.5, prev - 0.2))}
                  className="p-2 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer"
                  title="縮小"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setImageScale(1)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  100%
                </button>
                <button
                  onClick={() => setIsImageModalOpen(false)}
                  className="p-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 cursor-pointer ml-2"
                  title="關閉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1 p-6 flex items-center justify-center bg-stone-100/50">
              <img
                src={activePrompt.imageUrl}
                alt={activePrompt.title}
                style={{ transform: `scale(${imageScale})`, transformOrigin: 'center center' }}
                className="transition-transform duration-150 max-h-[70vh] object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
