import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Layers,
  Lightbulb,
  RefreshCw,
  Scissors,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { WritingPromptTask } from '../../data/ielts/writingPrompts';
import { ModeBStepAdvice, ModeBStepStarters } from './IELTSWritingStudio';

interface StepMeta {
  index: number;
  title: string;
  focus: string;
  tips: string;
  goldenRule: string;
}

interface StepBreakdownSectionProps {
  task: WritingPromptTask;
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
  onClose?: () => void;
  onMergeAll?: () => void;
}

export const StepBreakdownSection: React.FC<StepBreakdownSectionProps> = ({
  task,
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
}) => {
  const currentMeta = stepMetas[activeStep] || stepMetas[0];
  const currentText = stepDrafts[activeStep] || '';
  const currentWordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
  const currentAdvice = stepAdvices[activeStep];
  const currentStarter = stepStarters[activeStep];

  const completedCount = stepMetas.filter((s) => Boolean(stepDrafts[s.index]?.trim())).length;

  return (
    <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-sm space-y-4 text-stone-900 dark:text-stone-100">
      {/* Step Navigation Header */}
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 font-bold flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              寫作分步拆解與段落打造
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                {completedCount}/{stepMetas.length} 段已擬定
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {task === 'task1' ? '按 4 大標準段落逐段建構' : '按 5 大構思步驟逐段推展'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">
            Step {activeStep + 1} / {stepMetas.length}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition cursor-pointer"
              title="收合分步面板"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Step Selector Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {stepMetas.map((s) => {
          const hasText = Boolean(stepDrafts[s.index]?.trim());
          const isSelected = activeStep === s.index;
          return (
            <button
              key={s.index}
              onClick={() => onStepChange(s.index)}
              className={`flex-1 min-w-[105px] py-2 px-2.5 rounded-xl text-left transition cursor-pointer border ${
                isSelected
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-2xs font-bold'
                  : 'bg-stone-50 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-amber-300 dark:text-amber-600' : 'text-stone-400 dark:text-stone-400'}`}>
                  Step {s.index + 1}
                </span>
                {hasText && (
                  <Check className={`w-3 h-3 ${isSelected ? 'text-emerald-400 dark:text-emerald-600' : 'text-emerald-500'}`} />
                )}
              </div>
              <p className="text-xs font-bold truncate mt-0.5">{s.title.split(' ')[0]}</p>
            </button>
          );
        })}
      </div>

      {/* Active Step Context Card */}
      <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            {currentMeta.title}
          </span>
          <span className="text-[11px] text-amber-900 dark:text-amber-300 font-semibold">{currentMeta.focus}</span>
        </div>
        <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{currentMeta.tips}</p>
        <div className="text-[11px] text-amber-950 dark:text-amber-200 font-medium bg-white/90 dark:bg-stone-800/90 rounded-lg p-2 border border-amber-200 dark:border-amber-800/60">
          ★ 關鍵準則：{currentMeta.goldenRule}
        </div>
      </div>

      {/* Step Draft Input Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
          <span>撰寫此步驟內容：</span>
          <span className="font-mono font-semibold">{currentWordCount} 字</span>
        </div>
        <textarea
          value={currentText}
          onChange={(e) => onUpdateStepDraft(activeStep, e.target.value)}
          rows={5}
          placeholder={`在此輸入 ${currentMeta.title} 的草稿或要點...`}
          className="w-full resize-y rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800/50 p-3.5 font-sans text-xs leading-6 text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:border-stone-400"
        />
      </div>

      {/* Step Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isLoadingStarters}
            onClick={() => onGetStepStarters(activeStep)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            {isLoadingStarters ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
            AI 句型啟發
          </button>

          <button
            type="button"
            disabled={isLoadingAdvice || !currentText.trim()}
            onClick={() => onGetStepAdvice(activeStep)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-bold transition cursor-pointer disabled:opacity-40"
          >
            {isLoadingAdvice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-indigo-500" />}
            AI 單段診斷
          </button>
        </div>

        <button
          type="button"
          disabled={!currentText.trim()}
          onClick={() => onSyncStepToFullDraft(activeStep)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold transition cursor-pointer disabled:opacity-40"
          title="將此段內容插入至完整作文編輯器"
        >
          <ArrowRight className="w-3.5 h-3.5 text-amber-300 dark:text-amber-600" />
          同步至寫作區
        </button>
      </div>

      {/* AI Starters Section */}
      {currentStarter && currentStarter.starters.length > 0 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 p-3.5 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Band 8+ 推薦高分句型與開展框架
            </span>
          </div>
          <div className="space-y-2">
            {currentStarter.starters.map((s, idx) => (
              <div key={idx} className="rounded-xl bg-white dark:bg-stone-800 p-3 border border-amber-200/80 dark:border-stone-700 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-[11px]">{s.title}</span>
                  <button
                    type="button"
                    onClick={() => onApplyStarter(activeStep, s.text)}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> 套用至草稿
                  </button>
                </div>
                <p className="font-serif text-stone-800 dark:text-stone-200 italic bg-stone-50 dark:bg-stone-900/60 p-2 rounded-lg border border-stone-100 dark:border-stone-700">
                  "{s.text}"
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">{s.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Single Step Diagnostic Feedback */}
      {currentAdvice && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 p-3.5 space-y-3 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
            <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-indigo-500" />
              單段診斷反饋 ({currentAdvice.stepName})
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                currentAdvice.lizKeyRuleCheck.passed
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200'
              }`}
            >
              {currentAdvice.lizKeyRuleCheck.passed ? '✓ 核心準則合規' : '! 需注意準則'}
            </span>
          </div>

          {/* Diagnosis & Rule Check */}
          <div className="space-y-1">
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-medium">{currentAdvice.conciseDiagnosis}</p>
            {currentAdvice.lizKeyRuleCheck.tip && (
              <p className="text-[11px] text-amber-950 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                ★ 準則提醒：{currentAdvice.lizKeyRuleCheck.tip}
              </p>
            )}
          </div>

          {/* Wordiness Verdict */}
          {currentAdvice.wordinessVerdict.hasFillers && currentAdvice.wordinessVerdict.fillers.length > 0 && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  偵測到 {currentAdvice.wordinessVerdict.fillers.length} 處空話贅詞 / 模板套話
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveFillers(activeStep)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Scissors className="w-3 h-3" /> 一鍵剔除贅詞
                </button>
              </div>
              <div className="space-y-1">
                {currentAdvice.wordinessVerdict.fillers.map((f, fIdx) => (
                  <div key={fIdx} className="text-[11px] text-rose-950 dark:text-rose-200 flex items-start gap-1.5">
                    <span className="font-mono line-through text-rose-600 dark:text-rose-400">"{f.phrase}"</span>
                    <span>➔</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">{f.fix || '直接刪除'}</span>
                    <span className="text-stone-500 dark:text-stone-400">({f.reason})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Polished Rewrite */}
          {currentAdvice.polishedText && (
            <div className="rounded-xl bg-white dark:bg-stone-800 p-3 border border-stone-200 dark:border-stone-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 dark:text-stone-100 text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> 母語潤飾推薦 (Polished)
                </span>
                <button
                  type="button"
                  onClick={() => onApplyPolished(activeStep)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  替換為此版本
                </button>
              </div>
              <p className="font-serif text-stone-800 dark:text-stone-200 leading-relaxed bg-stone-50 dark:bg-stone-900/60 p-2 rounded-lg">
                {currentAdvice.polishedText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Merge All Button */}
      {onMergeAll && (
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={onMergeAll}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            一鍵合併匯入所有分步草稿至主寫作區
          </button>
        </div>
      )}
    </div>
  );
};

