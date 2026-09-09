import React, { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, FileText, Lightbulb, MessageSquareText, RefreshCw, Sparkles } from 'lucide-react';
import { IELTSWritingPrompt, IELTS_WRITING_PROMPTS } from '../data/ielts/writingPrompts';

type PracticeStage = 'ideas' | 'text' | 'snippet' | 'structure';

interface Props {
  selectedPromptId: string;
  onPromptChange: (promptId: string) => void;
}

const STAGES: { id: PracticeStage; label: string; title: string }[] = [
  { id: 'ideas', label: 'Ideas', title: '拆解論點' },
  { id: 'text', label: 'Text', title: '寫立場句' },
  { id: 'snippet', label: 'Snippet', title: '寫一段理由' },
  { id: 'structure', label: 'Structure', title: '排文章骨架' },
];

function localFeedback(stage: PracticeStage, value: string): string[] {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  if (!value.trim()) return ['先輸入內容，再開始檢查。'];
  if (stage === 'ideas') return [words >= 20 ? '想法數量足夠，下一步可補上具體例子。' : '建議至少寫出兩個理由，並為每個理由補一個例子。'];
  if (stage === 'text') return [/[.!?]/.test(value) ? '已形成完整句子，檢查是否直接回應題目與你的立場。' : '請補上完整句號，並清楚表達 agree、disagree 或 partial agreement。'];
  if (stage === 'snippet') return [words >= 60 ? '段落長度適合進一步批改，檢查 Claim → Why → Example → Result。' : '建議補到約 60–90 字，並加入具體例子。'];
  return [value.includes('Body 1') && value.includes('Body 2') ? '兩個主體段落已規劃，確認每段只發展一個核心理由。' : '請列出 Introduction、Body 1、Body 2、Conclusion 四個區塊。'];
}

export const WritingPracticeLab: React.FC<Props> = ({ selectedPromptId, onPromptChange }) => {
  const [stage, setStage] = useState<PracticeStage>('ideas');
  const [drafts, setDrafts] = useState<Record<PracticeStage, string>>({ ideas: '', text: '', snippet: '', structure: '' });
  const [feedback, setFeedback] = useState<Record<PracticeStage, string[]>>({ ideas: [], text: [], snippet: [], structure: [] });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const allPrompts = useMemo(() => IELTS_WRITING_PROMPTS, []);
  const prompt: IELTSWritingPrompt = allPrompts.find((item) => item.id === selectedPromptId) || allPrompts.find((item) => item.task === 'task2')!;
  const task = prompt.task;
  const prompts = IELTS_WRITING_PROMPTS.filter((item) => item.task === task);
  const currentStage = STAGES.find((item) => item.id === stage) || STAGES[0];
  const value = drafts[stage];

  const updateDraft = (next: string) => setDrafts((previous) => ({ ...previous, [stage]: next }));
  const checkLocally = () => setFeedback((previous) => ({ ...previous, [stage]: localFeedback(stage, value) }));
  const askAiForFeedback = async () => {
    if (!value.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/gemini/polish-writing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: value.trim(), targetTopic: prompt.prompt, style: `IELTS Task 2 ${currentStage.label} practice`, ieltsTask: 'task2', targetBand: 7 }) });
      if (!response.ok) throw new Error('AI 回饋服務目前無法回應，請稍後再試。');
      const result = await response.json();
      setFeedback((previous) => ({ ...previous, [stage]: [result.ieltsActionPlan?.[0] || result.grammarIssues?.[0]?.explanationZh || 'AI 已完成這一階段的回饋，請對照建議修訂。'] }));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI 回饋失敗。');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-emerald-950 p-5 text-white">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300"><Sparkles className="h-4 w-4" /> Interactive Writing Studio</div>
        <h2 className="mt-2 text-xl font-semibold">一題到底：從想法走到文章骨架</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-100/75">只選一次 Task 2 題目，Ideas、Text、Snippet、Structure 四個階段都圍繞同一題完成。</p>
      </div>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700"><FileText className="h-4 w-4 text-emerald-700" /> 先選寫作題型與題目</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['task1', 'task2'] as const).map((nextTask) => {
            const firstPrompt = IELTS_WRITING_PROMPTS.find((item) => item.task === nextTask);
            return <button key={nextTask} onClick={() => firstPrompt && onPromptChange(firstPrompt.id)} className={`rounded-xl border p-3 text-left cursor-pointer ${task === nextTask ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200 hover:bg-stone-50'}`}><span className="block text-xs font-bold text-stone-500">IELTS</span><span className="mt-1 block text-sm font-semibold text-stone-900">{nextTask === 'task1' ? 'Task 1 圖表／地圖' : 'Task 2 論證作文'}</span></button>;
          })}
        </div>
        <select value={prompt.id} onChange={(event) => onPromptChange(event.target.value)} className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-semibold text-stone-900 focus:bg-white focus:outline-hidden focus:border-emerald-500">{prompts.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        <div className="mt-3 rounded-xl bg-stone-50 p-4"><p className="text-xs font-bold text-emerald-800">題型分析</p><p className="mt-1 text-sm leading-6 text-stone-700">{task === 'task1' ? '先寫 Overview，再比較主要趨勢、數據或位置變化。' : '先明確回應題目，再用兩個主體段落發展理由、解釋與例子。'}</p><p className="mt-3 text-xs font-bold text-emerald-800">Topic / 題目</p><p className="mt-1 text-sm leading-6 text-stone-700">{prompt.prompt}</p></div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-500"><span>{prompt.notes}</span>{prompt.sampleUrl && <a href={prompt.sampleUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900">查看 Band {prompt.sampleBand || 9} 範例 <ExternalLink className="h-3.5 w-3.5" /></a>}</div>
      </section>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{STAGES.map((item, index) => <button key={item.id} onClick={() => setStage(item.id)} className={`rounded-xl border p-3 text-left cursor-pointer ${stage === item.id ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}><span className="text-[10px] font-bold text-stone-400">0{index + 1}</span><span className="mt-1 block text-xs font-bold text-stone-500">{item.label}</span><span className="mt-1 block text-sm font-semibold text-stone-900">{item.title}</span></button>)}</div>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Step {STAGES.findIndex((item) => item.id === stage) + 1} · {currentStage.label}</p><h3 className="mt-1 text-lg font-bold text-stone-900">{currentStage.title}</h3></div><Lightbulb className="h-5 w-5 text-amber-500" /></div>
        <textarea value={value} onChange={(event) => updateDraft(event.target.value)} rows={stage === 'snippet' ? 8 : 5} placeholder={stage === 'ideas' ? '列出兩個理由、每個理由的 why 與 example...' : stage === 'text' ? '寫出你的立場句，直接回答題目...' : stage === 'snippet' ? 'Claim → Why → Example → Result...' : 'Introduction\nBody 1\nBody 2\nConclusion'} className="mt-4 w-full rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-7 focus:bg-white focus:outline-hidden focus:border-emerald-500" />
        <div className="mt-3 flex flex-wrap gap-2"><button onClick={checkLocally} className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 cursor-pointer"><CheckCircle2 className="h-4 w-4" /> 檢查結構</button><button onClick={askAiForFeedback} disabled={isAiLoading || !value.trim()} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-40 cursor-pointer">{isAiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />} AI 回饋</button></div>
        {feedback[stage].length > 0 && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{feedback[stage].map((item, index) => <p key={index}>{item}</p>)}</div>}
        {aiError && <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{aiError}</p>}
      </section>
    </div>
  );
};
