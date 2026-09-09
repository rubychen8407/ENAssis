import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  RefreshCw,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { WritingAnalysis } from '../types';
import { IELTS_WRITING_PROMPTS } from '../data/ielts/writingPrompts';

type WritingTask = 'task1' | 'task2';

interface Props {
  selectedPromptId: string;
  onPromptChange: (promptId: string) => void;
}

const TASKS: Record<WritingTask, { label: string; title: string; description: string; prompt: string; minWords: number }> = {
  task1: {
    label: 'Task 1',
    title: '圖表、流程圖與地圖',
    description: '先寫 Overview，再用關鍵比較支撐細節。避免逐項羅列資料。',
    prompt: 'The chart below shows information about ... Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    minWords: 150,
  },
  task2: {
    label: 'Task 2',
    title: '觀點與論證作文',
    description: '清楚回應題目、建立立場，並用具體理由與例子發展每個主體段落。',
    prompt: 'Some people believe that ... To what extent do you agree or disagree?',
    minWords: 250,
  },
};

const CRITERIA = [
  { key: 'taskResponse', label: 'Task Response', zh: '任務回應' },
  { key: 'coherenceCohesion', label: 'Coherence & Cohesion', zh: '連貫與銜接' },
  { key: 'lexicalResource', label: 'Lexical Resource', zh: '詞彙資源' },
  { key: 'grammar', label: 'Grammar Range & Accuracy', zh: '文法範圍與準確度' },
] as const;

export const IELTSWritingCoach: React.FC<Props> = ({ selectedPromptId, onPromptChange }) => {
  const [topic, setTopic] = useState('');
  const [draft, setDraft] = useState('');
  const [targetBand, setTargetBand] = useState('7.0');
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const selectedPrompt = IELTS_WRITING_PROMPTS.find((item) => item.id === selectedPromptId) || IELTS_WRITING_PROMPTS.find((item) => item.task === 'task2')!;
  const task = selectedPrompt.task;
  const taskInfo = TASKS[task];
  const wordCount = useMemo(() => draft.trim() ? draft.trim().split(/\s+/).length : 0, [draft]);

  useEffect(() => {
    const nextPrompt = IELTS_WRITING_PROMPTS.find((item) => item.id === selectedPromptId);
    if (!nextPrompt) return;
    setTopic(nextPrompt.prompt);
    setAnalysis(null);
  }, [selectedPromptId]);

  const selectedPromptIsPdf = selectedPrompt?.sourceUrl.toLowerCase().endsWith('.pdf') ?? false;

  const handleReview = async () => {
    if (!draft.trim()) return;
    setIsLoading(true);
    setReviewError(null);
    try {
      const response = await fetch('/api/gemini/polish-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: draft.trim(),
          targetTopic: topic,
          style: `IELTS Academic Writing ${taskInfo.label}, target band ${targetBand}`,
          ieltsTask: task,
          targetBand: Number(targetBand),
        }),
      });
      if (!response.ok) throw new Error('AI 批改服務目前無法回應，請確認 API 金鑰或稍後再試。');
      setAnalysis(await response.json());
    } catch (error) {
      console.error(error);
      setReviewError(error instanceof Error ? error.message : '批改失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-stone-900 text-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-widest">
              <ClipboardCheck className="w-4 h-4" /> IELTS Writing Review
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">把作文當成一次可追蹤的模考</h1>
            <p className="mt-2 text-sm text-stone-300 max-w-2xl">依照官方四項評分標準診斷，先看任務回應，再處理段落邏輯、詞彙與文法。AI 會保留你的原意，提供局部改寫與可執行的下一步。</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-5">
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-bold text-stone-700"><FileText className="w-4 h-4" /> Writing</div><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">{taskInfo.label}</span></div>
            <p className="mt-3 rounded-lg border border-stone-200 bg-white p-3 text-sm font-semibold text-stone-900">{selectedPrompt.title}</p>
            <textarea value={topic} onChange={(event) => setTopic(event.target.value)} rows={4} className="mt-3 w-full resize-y bg-white border border-stone-200 rounded-lg p-3 text-sm leading-relaxed focus:outline-hidden focus:border-amber-400" />
            <p className="mt-2 text-xs text-stone-500">{taskInfo.description}</p>
            {selectedPrompt?.imageUrl && <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-white"><button type="button" onClick={() => setIsImageOpen(true)} className="block w-full cursor-zoom-in" title="放大查看圖表"><img src={selectedPrompt.imageUrl} alt={`${selectedPrompt.title} 題目圖表`} className="max-h-72 w-full object-contain" /></button><div className="flex items-center justify-between border-t border-stone-100 px-3 py-2"><span className="text-[11px] text-stone-500">圖片較小？點擊放大查看</span><button type="button" onClick={() => setIsImageOpen(true)} className="text-xs font-semibold text-stone-700 hover:text-amber-700 cursor-pointer">放大圖表</button></div></div>}
            {task === 'task1' && !selectedPrompt?.imageUrl && selectedPromptIsPdf && selectedPrompt && <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-white"><iframe src={`${selectedPrompt.sourceUrl}#page=${selectedPrompt.pdfPage || 1}&view=FitH`} title={`${selectedPrompt.title} PDF 圖表預覽`} className="h-72 w-full" /><div className="flex items-center justify-between border-t border-stone-100 px-3 py-2"><span className="text-[11px] text-stone-500">圖表嵌在 PDF 第 {selectedPrompt.pdfPage || 1} 頁</span><a href={`${selectedPrompt.sourceUrl}#page=${selectedPrompt.pdfPage || 1}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-amber-700">放大查看 PDF <ExternalLink className="h-3 w-3" /></a></div></div>}
            {selectedPrompt && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-500"><span>{selectedPrompt.notes}</span><span className="flex items-center gap-3"><a href={selectedPrompt.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-semibold text-stone-700 hover:text-amber-700">查看來源 <ExternalLink className="h-3 w-3" /></a>{selectedPrompt.sampleUrl && <a href={selectedPrompt.sampleUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900">查看 Band {selectedPrompt.sampleBand || 9} 範例 <ExternalLink className="h-3 w-3" /></a>}</span></div>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-stone-800">你的答案</label>
              <span className={`text-xs font-medium ${wordCount >= taskInfo.minWords ? 'text-emerald-700' : 'text-amber-700'}`}>{wordCount} words / 建議至少 {taskInfo.minWords}</span>
            </div>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={15} placeholder={`貼上 ${taskInfo.label} 作文，讓批改從完整回應開始...`} className="w-full resize-y bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm leading-7 focus:outline-hidden focus:border-stone-500 focus:bg-white" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-semibold text-stone-600">目標 Band
              <select value={targetBand} onChange={(event) => setTargetBand(event.target.value)} className="ml-2 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-sm font-normal text-stone-900">
                {['6.0', '6.5', '7.0', '7.5', '8.0'].map((band) => <option key={band}>{band}</option>)}
              </select>
            </label>
            <button disabled={isLoading || !draft.trim()} onClick={handleReview} className="sm:ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-40 cursor-pointer">
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              {isLoading ? '正在依評分標準診斷...' : '開始 IELTS 寫作批改'}
            </button>
          </div>
          {reviewError && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">{reviewError}</p>}
        </section>

        <section className="lg:col-span-5 space-y-4">
          {analysis ? (
            <>
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
                <h2 className="text-sm font-bold text-stone-900">Feedback & Score</h2>
                <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                  <div><p className="text-xs text-stone-500">預估 Overall Band</p><p className="text-4xl font-bold text-stone-900 mt-1">{analysis.ieltsOverallBand ?? (analysis.score / 20).toFixed(1)}</p></div>
                  <BarChart3 className="w-6 h-6 text-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {CRITERIA.map((criterion) => <div key={criterion.key} className="rounded-xl bg-stone-50 p-3"><p className="text-[11px] text-stone-500">{criterion.zh}</p><p className="text-lg font-bold text-stone-900 mt-1">{analysis.ieltsScores?.[criterion.key] ?? '—'}</p><p className="text-[10px] text-stone-400">{criterion.label}</p></div>)}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-stone-900">老師式回饋</h2>
                <div><p className="text-xs font-semibold text-stone-600 mb-2">做得好的地方</p><ul className="space-y-2">{analysis.strengths.map((item, index) => <li key={index} className="flex gap-2 text-sm text-stone-700"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />{item}</li>)}</ul></div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-stone-800"><p className="text-xs font-bold text-amber-900 mb-1">建議改寫</p>{analysis.nativePolishedVersion}</div>
                {analysis.ieltsActionPlan?.length ? <div><p className="text-xs font-semibold text-stone-600 mb-2">下一輪只做這三件事</p><ol className="list-decimal list-inside space-y-1 text-sm text-stone-700">{analysis.ieltsActionPlan.map((item, index) => <li key={index}>{item}</li>)}</ol></div> : null}
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
                <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-emerald-950">Example</h2>{selectedPrompt.sampleBand && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800">Band {selectedPrompt.sampleBand}</span>}</div>
                <p className="mt-2 text-xs leading-5 text-emerald-900">保留原始範例連結，建議先比較文章的立場、段落發展與詞彙，再回到自己的草稿修訂。</p>
                <a href={selectedPrompt.sampleUrl || selectedPrompt.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950">開啟參考範例 <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[360px] rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 flex flex-col justify-center items-center text-center">
              <ClipboardCheck className="w-9 h-9 text-stone-300" />
              <p className="mt-4 text-sm font-semibold text-stone-700">你的評分報告會在這裡出現</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-stone-500">完成一篇完整答案後，會看到四項分數、優勢、局部修訂與下一輪練習清單。</p>
            </div>
          )}
        </section>
      </div>
      {isImageOpen && selectedPrompt?.imageUrl && <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 p-4" role="dialog" aria-modal="true" aria-label="放大查看 IELTS 題目圖表" onClick={() => setIsImageOpen(false)}><div className="flex h-full w-full flex-col" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between pb-3 text-white"><span className="text-sm font-semibold">{selectedPrompt.title}</span><div className="flex items-center gap-2"><button type="button" onClick={() => setImageScale((scale) => Math.max(0.75, scale - 0.25))} className="rounded-lg border border-white/30 p-2 hover:bg-white/10 cursor-pointer" title="縮小"><ZoomOut className="h-4 w-4" /></button><button type="button" onClick={() => setImageScale((scale) => Math.min(3, scale + 0.25))} className="rounded-lg border border-white/30 p-2 hover:bg-white/10 cursor-pointer" title="放大"><ZoomIn className="h-4 w-4" /></button><button type="button" onClick={() => setImageScale(1)} className="rounded-lg border border-white/30 px-3 py-2 text-xs hover:bg-white/10 cursor-pointer">重設</button><button type="button" onClick={() => setIsImageOpen(false)} className="rounded-lg border border-white/30 p-2 hover:bg-white/10 cursor-pointer" title="關閉"><X className="h-4 w-4" /></button></div></div><div className="min-h-0 flex-1 overflow-auto rounded-xl bg-white/5 p-4 text-center"><img src={selectedPrompt.imageUrl} alt={`${selectedPrompt.title} 放大圖表`} style={{ transform: `scale(${imageScale})`, transformOrigin: 'top center' }} className="mx-auto max-w-none rounded-lg transition-transform" /></div></div></div>}
    </div>
  );
};