import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  HelpCircle,
  Layers,
  Lightbulb,
  Maximize2,
  RefreshCw,
  Scissors,
  Sparkles,
  Target,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { WritingPromptTask } from '../../data/ielts/writingPrompts';
import {
  IELTS_PARAGRAPH_PEEL_FORMULA,
  IELTS_PLANNING_STEPS,
  IELTS_TASK1_FATAL_TRAPS,
  IELTS_TASK1_PREPARATION_STEPS,
  IELTS_TASK1_VISUAL_TYPES,
  IELTS_TASK2_ESSAY_TYPES,
} from '../../data/ielts/ieltsLizMethodology';
import { ModeBStepAdvice, ModeBStepStarters } from './IELTSWritingStudio';

export interface StepMeta {
  index: number;
  title: string;
  focus: string;
  tips: string;
  goldenRule: string;
}

export type CopilotTab = 'steps' | 'ideas' | 'guide' | 'vocab' | 'outline';

interface WritingCopilotPaneProps {
  task: WritingPromptTask;
  activeCategory: string;
  activeStep: number;
  onStepChange: (index: number) => void;
  stepMetas: StepMeta[];
  stepDrafts: Record<number, string>;
  onUpdateStepDraft: (index: number, text: string) => void;
  stepAdvices: Record<number, ModeBStepAdvice>;
  stepStarters: Record<number, ModeBStepStarters>;
  isLoadingAdvice: boolean;
  isLoadingStarters: boolean;
  onGetStepAdvice: (index: number) => void;
  onGetStepStarters: (index: number) => void;
  onRemoveFillers: (index: number) => void;
  onApplyPolished: (index: number) => void;
  onApplyStarter: (index: number, starterText: string) => void;
  onSyncStepToFullDraft: (index: number) => void;
  onClose: () => void;
  onMergeAll: () => void;
  defaultTab?: CopilotTab;
  currentTab?: CopilotTab;
  onTabChange?: (tab: CopilotTab) => void;
}

export const WritingCopilotPane: React.FC<WritingCopilotPaneProps> = ({
  task,
  activeCategory,
  activeStep,
  onStepChange,
  stepMetas,
  stepDrafts,
  onUpdateStepDraft,
  stepAdvices,
  stepStarters,
  isLoadingAdvice,
  isLoadingStarters,
  onGetStepAdvice,
  onGetStepStarters,
  onRemoveFillers,
  onApplyPolished,
  onApplyStarter,
  onSyncStepToFullDraft,
  onClose,
  onMergeAll,
  defaultTab = 'steps',
  currentTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<CopilotTab>(defaultTab);
  const activeTab = currentTab || internalTab;
  const setActiveTab = (tab: CopilotTab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const currentTask1Info =
    IELTS_TASK1_VISUAL_TYPES.find((v) => v.id === activeCategory) || IELTS_TASK1_VISUAL_TYPES[0];
  const currentTask2Info =
    IELTS_TASK2_ESSAY_TYPES.find((e) => e.id === activeCategory) || IELTS_TASK2_ESSAY_TYPES[0];

  const currentMeta = stepMetas[activeStep] || stepMetas[0];
  const currentText = stepDrafts[activeStep] || '';
  const currentWordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
  const currentAdvice = stepAdvices[activeStep];
  const currentStarter = stepStarters[activeStep];

  const completedCount = stepMetas.filter((s) => Boolean(stepDrafts[s.index]?.trim())).length;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800/80 rounded-3xl shadow-xl overflow-hidden text-stone-900 dark:text-stone-100 animate-fade-in">
      {/* 1. Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/90 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                雅思寫作智庫與引導工坊 (Writing Master Hub)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shrink-0">
                {task === 'task1' ? `Task 1 · ${currentTask1Info.titleZh.split(' ')[0]}` : `Task 2 · ${currentTask2Info.titleZh.split(' ')[0]}`}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              整合寫作指南 · 靈感素材庫 · 分步打造工坊 · 詞彙搭配與避坑
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition cursor-pointer shrink-0 shadow-2xs"
          title="收合智庫面板以檢視固定題目"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">收合智庫 (檢視題目)</span>
        </button>
      </div>

      {/* 2. Unified Navigation Sub-tabs */}
      <div className="px-4 py-2 bg-stone-100/70 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('steps')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
            activeTab === 'steps'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          分步工坊
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-400/30 text-amber-900 dark:text-amber-300 font-bold">
            {completedCount}/{stepMetas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ideas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
            activeTab === 'ideas'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          思維與靈感庫 (Ideas)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
            activeTab === 'guide'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
          官方指南 (Guide)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vocab')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
            activeTab === 'vocab'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          詞彙搭配 (Vocab)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outline')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
            activeTab === 'outline'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-amber-500" />
          架構避坑 (Outline)
        </button>
      </div>

      {/* 3. Main Body Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* SUB-TAB 1: STEP-BY-STEP DRAFTER */}
        {activeTab === 'steps' && (
          <div className="space-y-4 animate-fade-in">
            {/* Step Selection Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700 dark:text-stone-300">
                  段落步驟選擇 ({stepMetas.length} 個標準段落)：
                </span>
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                  已完成 {completedCount} / {stepMetas.length} 段
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {stepMetas.map((s) => {
                  const isCurrent = activeStep === s.index;
                  const isDone = Boolean(stepDrafts[s.index]?.trim());

                  return (
                    <button
                      key={s.index}
                      type="button"
                      onClick={() => onStepChange(s.index)}
                      className={`p-2.5 rounded-2xl text-left transition cursor-pointer border flex flex-col justify-between gap-1.5 ${
                        isCurrent
                          ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-xs font-bold'
                          : isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                          : 'bg-stone-50 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-stone-900/10 dark:bg-white/10 font-bold">
                          Step {s.index + 1}
                        </span>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                      </div>
                      <p className="text-xs font-bold line-clamp-1 leading-snug">{s.title}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Step Guidance & Focus */}
            <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  當前重點：{currentMeta.focus}
                </span>
                <button
                  type="button"
                  disabled={isLoadingStarters}
                  onClick={() => onGetStepStarters(activeStep)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[11px] shadow-2xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  {isLoadingStarters ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  取得句型啟發
                </button>
              </div>

              <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[11px]">
                {currentMeta.tips}
              </p>

              <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 pt-1 border-t border-amber-200/80 dark:border-amber-800/80">
                {currentMeta.goldenRule}
              </div>
            </div>

            {/* AI Sentence Starters Carousel */}
            {currentStarter && currentStarter.starters && currentStarter.starters.length > 0 && (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5 space-y-2 text-xs animate-fade-in shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 考官推薦句型（點擊直接填入）：
                  </span>
                </div>
                <div className="space-y-1.5">
                  {currentStarter.starters.map((starter, sIdx) => (
                    <div
                      key={sIdx}
                      onClick={() => onApplyStarter(activeStep, starter.text)}
                      className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-stone-200 dark:border-stone-700 hover:border-amber-300 transition cursor-pointer space-y-1 text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-stone-800 dark:text-stone-200 group-hover:text-amber-900 dark:group-hover:text-amber-300">
                          {starter.title}
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold group-hover:underline">
                          + 填入
                        </span>
                      </div>
                      <p className="font-serif text-stone-900 dark:text-stone-100 text-[11px] leading-relaxed">
                        "{starter.text}"
                      </p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">
                        {starter.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
                <span>Step {activeStep + 1} 段落草稿</span>
                <span className={currentWordCount > 0 ? 'text-amber-800 dark:text-amber-300 font-bold' : ''}>
                  {currentWordCount} 字
                </span>
              </div>
              <textarea
                rows={5}
                value={currentText}
                onChange={(e) => onUpdateStepDraft(activeStep, e.target.value)}
                placeholder={`在此撰寫第 ${activeStep + 1} 步：${currentMeta.title}...`}
                className="w-full rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-3.5 text-xs font-sans leading-relaxed text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400"
              />
            </div>

            {/* Step Actions: AI Diagnose & Sync */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isLoadingAdvice || !currentText.trim()}
                onClick={() => onGetStepAdvice(activeStep)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-40"
              >
                {isLoadingAdvice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                {isLoadingAdvice ? 'AI 考官單段診斷中...' : 'AI 單段診斷與潤飾'}
              </button>

              <button
                type="button"
                disabled={!currentText.trim()}
                onClick={() => onSyncStepToFullDraft(activeStep)}
                className="inline-flex items-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold text-xs transition cursor-pointer disabled:opacity-40"
                title="將本段加入右側作文"
              >
                <Copy className="w-3.5 h-3.5" />
                同步至全篇
              </button>
            </div>

            {/* AI Single Step Diagnostic Feedback */}
            {currentAdvice && (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 p-4 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    考官單段反饋與潤飾
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                    Step {activeStep + 1}
                  </span>
                </div>

                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  {currentAdvice.conciseDiagnosis}
                </p>

                {/* Fillers warning */}
                {currentAdvice.wordinessVerdict?.hasFillers && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-rose-900 dark:text-rose-200">
                      ⚠️ 發現模板套話：{currentAdvice.wordinessVerdict.fillers.map((f) => `"${f.phrase}"`).join(', ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveFillers(activeStep)}
                      className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shrink-0 cursor-pointer"
                    >
                      <Scissors className="w-3 h-3 inline mr-1" /> 一鍵去除
                    </button>
                  </div>
                )}

                {/* Polished version */}
                {currentAdvice.polishedText && (
                  <div className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-amber-800 dark:text-amber-300">★ 考官示範潤飾：</span>
                      <button
                        type="button"
                        onClick={() => onApplyPolished(activeStep)}
                        className="text-emerald-800 dark:text-emerald-400 font-bold hover:underline"
                      >
                        套用此版本
                      </button>
                    </div>
                    <p className="font-serif text-stone-900 dark:text-stone-100 leading-relaxed text-[11px]">
                      "{currentAdvice.polishedText}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Merge All to Full Draft */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                全部完成後可一鍵整合至右側寫作區
              </span>
              <button
                type="button"
                onClick={onMergeAll}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                一鍵合併全部草稿
              </button>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: IDEAS & BRAINSTORMING */}
        {activeTab === 'ideas' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 space-y-2">
              <h3 className="font-bold text-amber-950 dark:text-amber-200 text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                {task === 'task1' ? `${currentTask1Info.titleZh} 核心思路發想` : `${currentTask2Info.titleZh} 萬用破題角度`}
              </h3>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                {task === 'task1'
                  ? 'Task 1 追求客觀精確：先抓整體最高/最低與宏觀趨勢（Overview），再依照走勢相似性將數據分為 2 大組（Body 1 與 Body 2）。'
                  : 'Task 2 著重深度論證：從「社會影響、經濟成本、個人福祉、環境永續、政府政策」五大維度快速腦力激盪 2 個可充分展開的論點。'}
              </p>
            </div>

            {task === 'task2' ? (
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1.5">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px] flex items-center justify-center">1</span>
                    維度一：個人發展與心理健康 (Individual & Well-being)
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[11px]">
                    思考話題對個人技能提昇、生活品質、工作壓力、身心健康與時間管理的正反面影響。
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1.5">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px] flex items-center justify-center">2</span>
                    維度二：社會穩定與公平性 (Society & Equality)
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[11px]">
                    思考貧富差距、公共安全、文化傳承、人際互動疏離與弱勢群體權益。
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1.5">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px] flex items-center justify-center">3</span>
                    維度三：經濟效率與政府資源分配 (Economy & Public Policy)
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[11px]">
                    思考財政預算負擔、稅收利用、就業機會創造、基礎設施建設與產業長期競爭力。
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">★ Overview 宏觀特徵提取清單：</h4>
                  <ul className="space-y-1.5 text-[11px] text-stone-700 dark:text-stone-300">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span><strong>總體走勢：</strong>大部分項目是呈現上升、下降、還是波動持平？</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span><strong>極值霸主：</strong>是否有某個項目在整個時期內始終佔據最高或最低？</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span><strong>最大變革：</strong>哪個項目經歷了最劇烈或逆轉性的變化（如反超）？</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB: OFFICIAL WRITING GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-4 animate-fade-in text-xs">
            {/* Header Banner */}
            <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-950 dark:text-amber-200 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  {task === 'task1' ? 'IELTS Task 1 官方高分寫作指南' : 'IELTS Task 2 官方學術議論文指南'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px]">
                  官方評分標準對齊
                </span>
              </div>
              <p className="text-stone-700 dark:text-stone-300 text-[11px] leading-relaxed">
                {task === 'task1'
                  ? '學術類 Task 1 是一篇客觀報告。核心目標是在 20 分鐘內挑選重要特徵 (select main features) 並清楚呈現趨勢對比。'
                  : 'Task 2 佔總分 2/3 (雙倍分值)。核心在於建立明確的立場 (Clear Position Throughout) 並展開充分的因果論證。'}
              </p>
            </div>

            {/* 5-Step Planning Process */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 space-y-3 shadow-xs">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" />
                考官推薦破題 5 步驟 (Planning Workflow)：
              </h4>

              <div className="space-y-2">
                {(task === 'task1' ? IELTS_TASK1_PREPARATION_STEPS : IELTS_PLANNING_STEPS).map((stepItem: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {stepItem.step || idx + 1}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-stone-900 dark:text-stone-100 text-[11px]">
                        {stepItem.titleZh || stepItem.title}
                      </p>
                      <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                        {stepItem.summaryZh || stepItem.desc || stepItem.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Allocation */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 space-y-3 shadow-xs">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                {task === 'task1' ? '20 分鐘限時精準分配節奏' : '40 分鐘全真節奏分配黃金表'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {task === 'task1' ? (
                  <>
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400">0–3 分鐘：</span>
                      <p className="text-stone-700 dark:text-stone-300 mt-0.5">審題、理解座標軸/單位、圈出最高點與宏觀趨勢。</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400">3–7 分鐘：</span>
                      <p className="text-stone-700 dark:text-stone-300 mt-0.5">改寫題幹 (Introduction) + 撰寫 2 句 Overview 總結段。</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400">7–17 分鐘：</span>
                      <p className="text-stone-700 dark:text-stone-300 mt-0.5">撰寫 Body 1 與 Body 2，嚴謹加入關鍵數據與倍數對比。</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400">17–20 分鐘：</span>
                      <p className="text-stone-700 dark:text-stone-300 mt-0.5">檢查單複數、介係詞 (in/by/at/to) 與數據抄寫正確性。</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400">0–5 分鐘：</span>
                      <p className="text-stone-700 dark:text-stone-300 mt-0.5">審題、畫出關鍵限制字、構思立場與 2 大核心論點。</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400">5–10 分鐘：</span>
                      <p className="text-stone-700 dark:text-stone-300 mt-0.5">引言段：改寫題目背景句 + 堅定清楚宣示 Thesis 立場。</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400">10–32 分鐘：</span>
                      <p className="text-stone-700 dark:text-stone-300 mt-0.5">主體兩大段 (Body 1 & 2)：依 PEEL 鏈深入因果推導與例證。</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400">32–40 分鐘：</span>
                      <p className="text-stone-700 dark:text-stone-300 mt-0.5">結論段重申立場 (不加新論點) + 3分鐘快速除錯防粗心。</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Official 4 Criteria Requirements */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 space-y-3 shadow-xs">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                官方四項評分準則 Band 7.5+ 達標關鍵：
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100">1. {task === 'task1' ? 'Task Achievement (TA)' : 'Task Response (TR)'}</span>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    {task === 'task1'
                      ? '必須有清晰 Overview！準確挑選最大特徵，不漏掉關鍵趨勢，且不臆測原因。'
                      : '必須完整回應題目所有問句，全文維持清晰統一的立場 (Clear Position Throughout)。'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100">2. Coherence & Cohesion (CC)</span>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    邏輯推進自然流暢。段落分明，連接詞使用得當（避免過度或機械式堆疊 On the one hand/Secondly）。
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100">3. Lexical Resource (LR)</span>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    精準學術搭配詞 (Collocations) 與同義改寫能力，詞彙使用自然，不硬塞生僻冷門詞。
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100">4. Grammatical Range & Accuracy (GRA)</span>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    靈活運用複合句、條件句、分詞構句與被動語態，大部分句子無拼寫與時態錯誤。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: VOCABULARY & COLLOCATIONS */}
        {activeTab === 'vocab' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3.5">
              <span className="font-bold text-amber-950 dark:text-amber-200">
                ★ 詞彙高分法則（Lexical Resource Band 8.0+）：
              </span>
              <p className="text-stone-700 dark:text-stone-300 text-[11px] mt-1 leading-relaxed">
                避免使用晦澀冷僻的生僻詞，重點在於<strong>精準搭配詞 (Collocations)</strong> 與<strong>同義改寫能力 (Paraphrasing)</strong>。
              </p>
            </div>

            {task === 'task1' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">趨勢動詞與副詞精準搭配：</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">大幅上升：</span>
                      <p className="text-stone-600 dark:text-stone-300 font-mono mt-0.5">surge / soar significantly</p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">平穩增長：</span>
                      <p className="text-stone-600 dark:text-stone-300 font-mono mt-0.5">increase steadily / climb</p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-rose-700 dark:text-rose-400">大幅驟降：</span>
                      <p className="text-stone-600 dark:text-stone-300 font-mono mt-0.5">plummet / plunge sharply</p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400">劇烈波動：</span>
                      <p className="text-stone-600 dark:text-stone-300 font-mono mt-0.5">fluctuate wildly / plateau</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">議論文萬用高分學術連接詞與搭配：</h4>
                  <div className="space-y-2 text-[11px]">
                    <div className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-stone-800 dark:text-stone-200">因果邏輯推導：</span>
                      <p className="text-stone-600 dark:text-stone-400 font-mono mt-0.5">
                        This can be attributed to... / Consequently, ... / As a direct corollary, ...
                      </p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-stone-800 dark:text-stone-200">強烈立場宣示：</span>
                      <p className="text-stone-600 dark:text-stone-400 font-mono mt-0.5">
                        I am firmly of the opinion that... / It is my conviction that...
                      </p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                      <span className="font-bold text-stone-800 dark:text-stone-200">雙邊讓步轉折：</span>
                      <p className="text-stone-600 dark:text-stone-400 font-mono mt-0.5">
                        While there are valid reasons to support..., I would contend that...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 4: OUTLINE & FATAL TRAPS */}
        {activeTab === 'outline' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 p-4 space-y-3">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" />
                {task === 'task1' ? 'Task 1 標準四段架構模型' : 'Task 2 PEEL 段落論證鏈'}
              </h4>

              {task === 'task2' ? (
                <div className="space-y-2 text-[11px]">
                  {Object.values(IELTS_PARAGRAPH_PEEL_FORMULA).map((step, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex items-start gap-2.5">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                        {step.letter}
                      </span>
                      <div>
                        <p className="font-bold text-stone-900 dark:text-stone-100">{step.name}</p>
                        <p className="text-stone-600 dark:text-stone-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <span className="font-bold text-stone-900 dark:text-stone-100">Paragraph 1: 改寫題目 (Introduction)</span>
                    <p className="text-stone-600 dark:text-stone-400 mt-0.5">換詞交代圖表主題、數據單位與時間範圍。</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <span className="font-bold text-amber-800 dark:text-amber-300">Paragraph 2: 宏觀概述 (Overview - 核心得分點)</span>
                    <p className="text-stone-600 dark:text-stone-400 mt-0.5">總結 2 個全局最明顯特徵，<strong>絕不寫具體數據</strong>。</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <span className="font-bold text-stone-900 dark:text-stone-100">Paragraph 3: 第一組數據細節 (Body 1)</span>
                    <p className="text-stone-600 dark:text-stone-400 mt-0.5">描述上升或主要項目，附精準數值。</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <span className="font-bold text-stone-900 dark:text-stone-100">Paragraph 4: 第二組數據細節 (Body 2)</span>
                    <p className="text-stone-600 dark:text-stone-400 mt-0.5">描述落後或相反項目，進行鮮明對比。</p>
                  </div>
                </div>
              )}
            </div>

            {/* Fatal Traps Alert */}
            <div className="rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3.5 space-y-2">
              <span className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                考官扣分致命陷阱 (Fatal Traps)：
              </span>
              <ul className="space-y-1 text-[11px] text-rose-800 dark:text-rose-300">
                {task === 'task1' ? (
                  <>
                    <li>• Overview 偷塞具體數值（TA 分數直接掉檔）。</li>
                    <li>• 未能覆蓋所有關鍵類別或遺漏數據主體。</li>
                    <li>• 照抄題幹單字未進行同義改寫。</li>
                  </>
                ) : (
                  <>
                    <li>• 引言段模稜兩可，沒有清楚宣告 Thesis Statement。</li>
                    <li>• 段落缺乏深入因果論證，變成列清單 (Listing)。</li>
                    <li>• 結論段突然拋出從未討論過的新觀點。</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
