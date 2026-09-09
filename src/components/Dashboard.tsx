import React, { useMemo } from 'react';
import {
  ArrowRight,
  Award,
  BookMarked,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  PenTool,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { VocabWord } from '../types';
import { IELTSMistakeItem, IELTSRecord } from '../types/ielts';

interface Props {
  savedWords: VocabWord[];
  records: IELTSRecord[];
  mistakes: IELTSMistakeItem[];
  onNavigate: (tab: 'vocabulary' | 'ielts' | 'writing') => void;
}

export const Dashboard: React.FC<Props> = ({ savedWords, records, mistakes, onNavigate }) => {
  const stats = useMemo(() => {
    const averageBand = records.length
      ? (records.reduce((total, record) => total + record.bandScore, 0) / records.length).toFixed(1)
      : null;
    const latestRecord = records[0] || null;
    const masteredWords = savedWords.filter((word) => word.masteryLevel === 'mastered').length;
    return { averageBand, latestRecord, masteredWords };
  }, [records, savedWords]);

  const focus = mistakes.length > 0
    ? `先處理 ${mistakes[0].kind || '閱讀題型'} 錯題`
    : records.length === 0
      ? '完成第一回閱讀模考'
      : '寫一篇 Task 2，建立寫作基準分';

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-stone-900 px-6 py-8 text-white shadow-sm sm:px-8">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
            <Target className="h-4 w-4" /> IELTS preparation desk
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">今天，先完成一個可衡量的進步。</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">從上次結果接續練習，不必在功能之間迷路。你的模考、錯題、生字與寫作回饋會在這裡彙整。</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => onNavigate(records.length ? 'writing' : 'ielts')} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-stone-950 hover:bg-amber-300 cursor-pointer">
              <Zap className="h-4 w-4" /> {records.length ? '開始今日寫作' : '開始第一回模考'}
            </button>
            <button onClick={() => onNavigate(mistakes.length ? 'ielts' : 'vocabulary')} className="inline-flex items-center gap-2 rounded-xl border border-stone-600 px-4 py-3 text-sm font-semibold text-stone-200 hover:bg-stone-800 cursor-pointer">
              {mistakes.length ? <ClipboardCheck className="h-4 w-4" /> : <BookMarked className="h-4 w-4" />}
              {mistakes.length ? '複習錯題本' : '整理生字'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs"><TrendingUp className="h-4 w-4 text-amber-600" /><p className="mt-4 text-xs text-stone-500">平均預估 Band</p><p className="mt-1 text-2xl font-bold text-stone-900">{stats.averageBand || '—'}</p></div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs"><GraduationCap className="h-4 w-4 text-emerald-600" /><p className="mt-4 text-xs text-stone-500">完成模考</p><p className="mt-1 text-2xl font-bold text-stone-900">{records.length}<span className="ml-1 text-sm font-medium text-stone-400">回</span></p></div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs"><ClipboardCheck className="h-4 w-4 text-rose-600" /><p className="mt-4 text-xs text-stone-500">待複習錯題</p><p className="mt-1 text-2xl font-bold text-stone-900">{mistakes.length}<span className="ml-1 text-sm font-medium text-stone-400">題</span></p></div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs"><BookMarked className="h-4 w-4 text-sky-600" /><p className="mt-4 text-xs text-stone-500">熟記生字</p><p className="mt-1 text-2xl font-bold text-stone-900">{stats.masteredWords}<span className="ml-1 text-sm font-medium text-stone-400">個</span></p></div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Today&apos;s focus</p><h2 className="mt-1 text-xl font-bold text-stone-900">{focus}</h2><p className="mt-2 text-sm text-stone-500">用一個短任務讓今天的練習留下紀錄。</p></div><Award className="h-6 w-6 text-amber-500" /></div>
          <div className="mt-5 rounded-xl bg-stone-50 p-4"><p className="text-xs font-semibold text-stone-600">最近一次結果</p>{stats.latestRecord ? <div className="mt-2 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-stone-900">{stats.latestRecord.examTitle}</p><p className="mt-1 text-xs text-stone-500">{stats.latestRecord.date} · {stats.latestRecord.score}/{stats.latestRecord.totalQuestions} 題</p></div><span className="text-xl font-bold text-emerald-700">Band {stats.latestRecord.bandScore.toFixed(1)}</span></div> : <p className="mt-2 text-sm text-stone-600">尚未有練習紀錄，先完成一回閱讀模考。</p>}</div>
        </section>

        <section className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-stone-900">快速進入練習</h2>
          <div className="mt-3 space-y-2">
            <button onClick={() => onNavigate('ielts')} className="flex w-full items-center gap-3 rounded-xl border border-stone-200 p-3 text-left hover:border-amber-300 hover:bg-amber-50/40 cursor-pointer"><GraduationCap className="h-5 w-5 text-amber-600" /><span className="flex-1"><span className="block text-sm font-semibold text-stone-900">閱讀真題與模考</span><span className="block text-xs text-stone-500">計時、判分、錯題回顧</span></span><ArrowRight className="h-4 w-4 text-stone-400" /></button>
            <button onClick={() => onNavigate('writing')} className="flex w-full items-center gap-3 rounded-xl border border-stone-200 p-3 text-left hover:border-amber-300 hover:bg-amber-50/40 cursor-pointer"><PenTool className="h-5 w-5 text-rose-600" /><span className="flex-1"><span className="block text-sm font-semibold text-stone-900">IELTS 寫作批改</span><span className="block text-xs text-stone-500">Task 1/2 與四項 Band 評分</span></span><ArrowRight className="h-4 w-4 text-stone-400" /></button>
            <button onClick={() => onNavigate('vocabulary')} className="flex w-full items-center gap-3 rounded-xl border border-stone-200 p-3 text-left hover:border-amber-300 hover:bg-amber-50/40 cursor-pointer"><BookMarked className="h-5 w-5 text-sky-600" /><span className="flex-1"><span className="block text-sm font-semibold text-stone-900">生字與複習</span><span className="block text-xs text-stone-500">把模考與閱讀詞彙留下來</span></span><ArrowRight className="h-4 w-4 text-stone-400" /></button>
          </div>
          {records.length > 0 && <p className="mt-4 flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> 已建立你的練習軌跡</p>}
        </section>
      </div>
    </div>
  );
};
