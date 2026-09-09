import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Award,
  BookMarked,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  ExternalLink,
  GraduationCap,
  Layers,
  Lightbulb,
  PenTool,
  RotateCcw,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { SkillTab, VocabWord } from '../types';
import {
  GeneralSettings,
  IELTSMistakeItem,
  IELTSRecord,
  IELTSWritingRecord,
  IELTSSpeakingRecord,
  IELTSListeningRecord,
} from '../types/ielts';
import {
  calculateWritingStats,
  deleteIELTSWritingRecord,
  exportIELTSPracticeReportMarkdown,
  seedSampleWritingRecords,
} from '../utils/ielts';
import { IELTSOverallScorecard } from './ielts/IELTSOverallScorecard';

interface Props {
  savedWords: VocabWord[];
  records: IELTSRecord[];
  mistakes: IELTSMistakeItem[];
  writingRecords: IELTSWritingRecord[];
  speakingRecords: IELTSSpeakingRecord[];
  listeningRecords: IELTSListeningRecord[];
  settings: GeneralSettings;
  onOpenSettings: () => void;
  onUpdateSettings: (updated: GeneralSettings) => void;
  onNavigate: (tab: SkillTab, promptId?: string) => void;
  onRefreshRecords: () => void;
}

export const Dashboard: React.FC<Props> = ({
  savedWords,
  records,
  mistakes,
  writingRecords,
  speakingRecords,
  listeningRecords,
  settings,
  onOpenSettings,
  onUpdateSettings,
  onNavigate,
  onRefreshRecords,
}) => {
  // Filter for writing records
  const [taskFilter, setTaskFilter] = useState<'all' | 'task1' | 'task2'>('all');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [copiedRecordId, setCopiedRecordId] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);

  // Calculate statistics
  const writingStats = useMemo(() => calculateWritingStats(writingRecords), [writingRecords]);

  const readingStats = useMemo(() => {
    const averageBand = records.length
      ? (records.reduce((total, record) => total + record.bandScore, 0) / records.length).toFixed(1)
      : null;
    const latestRecord = records[0] || null;
    return { averageBand, latestRecord };
  }, [records]);

  const masteredWords = useMemo(
    () => savedWords.filter((word) => word.masteryLevel === 'mastered').length,
    [savedWords]
  );

  // Exam countdown
  const examCountdown = useMemo(() => {
    if (!settings.examDate) return null;
    const target = new Date(settings.examDate).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  }, [settings.examDate]);

  // Target difference for writing
  const writingTargetDiff = useMemo(() => {
    if (writingStats.averageBand === null) return null;
    const diff = Math.round((writingStats.averageBand - settings.targetScores.writing) * 10) / 10;
    return diff;
  }, [writingStats.averageBand, settings.targetScores.writing]);

  // Filtered writing records
  const filteredWritingRecords = useMemo(() => {
    if (taskFilter === 'all') return writingRecords;
    return writingRecords.filter((r) => r.task === taskFilter);
  }, [writingRecords, taskFilter]);

  // Handle delete writing record
  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('確定要刪除這筆寫作評分紀錄嗎？')) {
      deleteIELTSWritingRecord(id);
      onRefreshRecords();
      if (expandedRecordId === id) setExpandedRecordId(null);
    }
  };

  // Handle seed sample records
  const handleSeedSamples = () => {
    seedSampleWritingRecords();
    onRefreshRecords();
  };

  // Handle export markdown
  const handleExportMarkdown = () => {
    const md = exportIELTSPracticeReportMarkdown(
      records,
      mistakes,
      writingRecords,
      speakingRecords,
      listeningRecords,
      settings
    );
    navigator.clipboard.writeText(md);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 3000);
  };

  // Copy polished version
  const handleCopyText = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedRecordId(id);
    setTimeout(() => setCopiedRecordId(null), 2500);
  };

  // Identify lowest sub-criteria in writing for smart tip
  const weakestWritingCriteria = useMemo(() => {
    if (!writingStats.averageBand) return null;
    const items = [
      { name: 'TR/TA 審題與立場', score: writingStats.averageTR ?? 0, key: 'TR' },
      { name: 'CC 銜接與連貫', score: writingStats.averageCC ?? 0, key: 'CC' },
      { name: 'LR 詞彙資源', score: writingStats.averageLR ?? 0, key: 'LR' },
      { name: 'GRA 文法多樣性', score: writingStats.averageGRA ?? 0, key: 'GRA' },
    ];
    items.sort((a, b) => a.score - b.score);
    return items[0];
  }, [writingStats]);

  return (
    <div className="space-y-6">
      {/* 0. Comprehensive 4-Skills Overall Scorecard (聽說讀寫四科總成績) */}
      <IELTSOverallScorecard
        records={records}
        writingRecords={writingRecords}
        speakingRecords={speakingRecords}
        listeningRecords={listeningRecords}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onNavigate={onNavigate}
        onOpenSettings={onOpenSettings}
      />

      {/* 1. Target & Exam Countdown Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-stone-900 px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
              <Target className="h-4 w-4" />
              <span>{settings.studyPlanTitle || 'IELTS Preparation Desk'}</span>
              <span className="text-stone-500">•</span>
              <span className="text-stone-300">雅思總目標 Band {settings.targetOverallBand.toFixed(1)}</span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {writingRecords.length > 0 ? (
                <>
                  目前寫作平均 <span className="text-amber-300 font-extrabold">Band {writingStats.averageBand?.toFixed(1) || '—'}</span>
                  {writingTargetDiff !== null && (
                    <span className="text-sm font-normal text-stone-300 ml-2">
                      (目標 Band {settings.targetScores.writing.toFixed(1)}，
                      {writingTargetDiff >= 0
                        ? `🎉 已達標 +${writingTargetDiff.toFixed(1)}`
                        : `差距 ${Math.abs(writingTargetDiff).toFixed(1)} 分`}
                      )
                    </span>
                  )}
                </>
              ) : (
                '開始建立你的雅思寫作基準分'
              )}
            </h1>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-300">
              即時追蹤寫作 4 項官方評分（TR / CC / LR / GRA）、真題模考進度與錯題本。掌握個人化數據走向高分。
            </p>

            {/* Quick Action Badges */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('writing')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-stone-950 hover:bg-amber-300 transition cursor-pointer shadow-xs"
              >
                <PenTool className="h-4 w-4" />
                前往寫作練習室批改
              </button>

              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-800/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-200 hover:bg-stone-800 hover:text-white transition cursor-pointer"
              >
                <Sliders className="h-4 w-4 text-amber-400" />
                設定總目標與考期
              </button>

              {writingRecords.length === 0 && (
                <button
                  onClick={handleSeedSamples}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed border-stone-600 px-3.5 py-2.5 text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800/50 transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  載入示範寫作紀錄
                </button>
              )}
            </div>
          </div>

          {/* Countdown & Goal Pill on Right */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 sm:border-l border-stone-800 pt-4 sm:pt-0 sm:pl-8">
            <div className="text-left sm:text-right">
              <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
                目標考試日
              </span>
              {examCountdown !== null ? (
                <div className="mt-1 flex items-baseline sm:justify-end gap-1.5">
                  <Calendar className="w-4 h-4 text-rose-400" />
                  <span className="text-xl sm:text-2xl font-black text-rose-400">
                    {examCountdown > 0 ? `倒數 ${examCountdown} 天` : '今日考試'}
                  </span>
                </div>
              ) : (
                <button
                  onClick={onOpenSettings}
                  className="mt-1 text-xs text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" /> 點擊設定考試日期
                </button>
              )}
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
                本週寫作進度
              </span>
              <div className="mt-1 flex items-center justify-end gap-2">
                <span className="text-lg font-bold text-white">
                  {writingRecords.length} / {settings.weeklyWritingGoal} 篇
                </span>
                <span className="text-xs text-stone-400 font-medium">目標</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Metrics Grid */}
      <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {/* Metric 1: Writing Average Band */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">寫作平均成績</span>
            <PenTool className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900">
              {writingStats.averageBand !== null ? `Band ${writingStats.averageBand.toFixed(1)}` : '—'}
            </span>
            {writingStats.highestBand && (
              <span className="text-xs text-stone-500">最高 {writingStats.highestBand.toFixed(1)}</span>
            )}
          </div>
          <div className="mt-2 text-xs text-stone-500 flex items-center justify-between">
            <span>已完成 {writingStats.totalCount} 篇批改</span>
            <span className="text-stone-400">
              T1: {writingStats.task1Count} | T2: {writingStats.task2Count}
            </span>
          </div>
        </div>

        {/* Metric 2: Writing Sub-criteria Highlight */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">寫作四項指標</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          {writingStats.averageBand !== null ? (
            <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-stone-500">TR/TA:</span>
                <span className="font-bold text-stone-900">{writingStats.averageTR?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-stone-500">CC:</span>
                <span className="font-bold text-stone-900">{writingStats.averageCC?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-stone-500">LR:</span>
                <span className="font-bold text-stone-900">{writingStats.averageLR?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-stone-500">GRA:</span>
                <span className="font-bold text-stone-900">{writingStats.averageGRA?.toFixed(1)}</span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-stone-500">尚未有寫作評分數據</p>
          )}
          <div className="mt-2 text-[11px] text-amber-700 truncate font-medium">
            {weakestWritingCriteria
              ? `突破點：加強 ${weakestWritingCriteria.name}`
              : '完成寫作後取得四項分析'}
          </div>
        </div>

        {/* Metric 3: Reading Mock Exams */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">聽讀模考平均</span>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900">
              {readingStats.averageBand ? `Band ${readingStats.averageBand}` : '—'}
            </span>
            <span className="text-xs text-stone-500">完成 {records.length} 回</span>
          </div>
          <div className="mt-2 text-xs text-stone-500 flex items-center justify-between">
            <span>錯題本：{mistakes.length} 題</span>
            <button
              onClick={() => onNavigate('ielts')}
              className="text-amber-700 hover:underline font-medium text-[11px] cursor-pointer"
            >
              進入題庫 →
            </button>
          </div>
        </div>

        {/* Metric 4: Vocabulary Progress */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">生字記憶進度</span>
            <BookMarked className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900">{masteredWords}</span>
            <span className="text-xs text-stone-500">/ {savedWords.length} 熟記</span>
          </div>
          <div className="mt-2 text-xs text-stone-500 flex items-center justify-between">
            <span>每日目標 {settings.dailyVocabGoal} 字</span>
            <button
              onClick={() => onNavigate('vocabulary')}
              className="text-sky-700 hover:underline font-medium text-[11px] cursor-pointer"
            >
              生字庫 →
            </button>
          </div>
        </div>
      </section>

      {/* 3. Writing Score History & Average Breakdown (Primary Requested Feature) */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                雅思寫作評分歷史與平均成績 (Writing History)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-bold">
                {writingRecords.length} 篇
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              包含每篇作答之 Task 1 / Task 2 題目、考官 Overall Band、四項準則得分與診斷回饋
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl bg-stone-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  taskFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                全部 ({writingRecords.length})
              </button>
              <button
                onClick={() => setTaskFilter('task1')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  taskFilter === 'task1' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Task 1 ({writingStats.task1Count})
              </button>
              <button
                onClick={() => setTaskFilter('task2')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  taskFilter === 'task2' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Task 2 ({writingStats.task2Count})
              </button>
            </div>

            {/* Markdown Export Button */}
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer shadow-2xs"
              title="匯出 Markdown 練習報告"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>{exportCopied ? '已複製 Markdown 報告！' : '匯出歷史成績單'}</span>
            </button>
          </div>
        </div>

        {/* Average Breakdown Card (When records exist) */}
        {writingRecords.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-amber-200/80 pb-3 md:pb-0 md:pr-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                寫作整體平均表現
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-stone-950">
                  Band {writingStats.averageBand?.toFixed(1) || '—'}
                </span>
                <span className="text-xs font-semibold text-stone-600">
                  (共評析 {writingRecords.length} 篇，平均 {writingStats.averageWordCount} 字)
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-600">
                目標 Band {settings.targetScores.writing.toFixed(1)} •{' '}
                {writingStats.averageBand !== null && writingStats.averageBand >= settings.targetScores.writing ? (
                  <span className="text-emerald-700 font-bold">已達成設定目標！</span>
                ) : (
                  <span className="text-amber-800 font-medium">
                    距離目標差距 -{Math.abs((settings.targetScores.writing - (writingStats.averageBand || 0))).toFixed(1)}
                  </span>
                )}
              </p>
            </div>

            {/* 4 Criteria Sub-scores */}
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white border border-amber-200/60 text-center">
                <span className="text-[11px] font-bold text-stone-500 block">TR / TA</span>
                <span className="text-lg font-black text-stone-900">
                  {writingStats.averageTR?.toFixed(1) || '—'}
                </span>
                <span className="text-[10px] text-stone-400 block">審題與立場</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-amber-200/60 text-center">
                <span className="text-[11px] font-bold text-stone-500 block">CC</span>
                <span className="text-lg font-black text-stone-900">
                  {writingStats.averageCC?.toFixed(1) || '—'}
                </span>
                <span className="text-[10px] text-stone-400 block">連貫與銜接</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-amber-200/60 text-center">
                <span className="text-[11px] font-bold text-stone-500 block">LR</span>
                <span className="text-lg font-black text-stone-900">
                  {writingStats.averageLR?.toFixed(1) || '—'}
                </span>
                <span className="text-[10px] text-stone-400 block">詞彙多樣性</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-amber-200/60 text-center">
                <span className="text-[11px] font-bold text-stone-500 block">GRA</span>
                <span className="text-lg font-black text-stone-900">
                  {writingStats.averageGRA?.toFixed(1) || '—'}
                </span>
                <span className="text-[10px] text-stone-400 block">文法與精確</span>
              </div>
            </div>
          </div>
        )}

        {/* Writing Records List */}
        {filteredWritingRecords.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <PenTool className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">尚無符合篩選條件的寫作評分紀錄</h3>
            <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto">
              在寫作練習室完成任一篇 Task 1 或 Task 2 並送出批改後，AI 考官的評分與診斷將自動歸檔在此處。
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              <button
                onClick={() => onNavigate('writing')}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
              >
                前往寫作練習室開始第一次批改
              </button>
              <button
                onClick={handleSeedSamples}
                className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 transition cursor-pointer"
              >
                載入雅思寫作示範評分紀錄
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWritingRecords.map((record) => {
              const isExpanded = expandedRecordId === record.id;
              const isTargetReached = record.overallBand >= settings.targetScores.writing;

              return (
                <div
                  key={record.id}
                  className={`rounded-2xl border transition overflow-hidden ${
                    isExpanded
                      ? 'border-amber-300 bg-white shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-2xs'
                  }`}
                >
                  {/* Record Header Summary Bar */}
                  <div
                    onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            record.task === 'task1'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {record.task === 'task1' ? 'Task 1 (Report)' : 'Task 2 (Essay)'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium">
                          {record.lizCategory}
                        </span>
                        <span className="text-xs text-stone-400">• {record.date}</span>
                        <span className="text-xs text-stone-400">• {record.wordCount} 字</span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-stone-900 truncate">
                        {record.promptTitle}
                      </h4>

                      {record.generalFeedbackZh && !isExpanded && (
                        <p className="mt-1 text-xs text-stone-500 line-clamp-1">
                          {record.generalFeedbackZh}
                        </p>
                      )}
                    </div>

                    {/* Band Badge & Sub-criteria Preview */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Sub-scores chips */}
                      <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200">
                        <span>TR: <b>{record.criteriaScores.taskResponse}</b></span>
                        <span className="text-stone-300">|</span>
                        <span>CC: <b>{record.criteriaScores.coherenceCohesion}</b></span>
                        <span className="text-stone-300">|</span>
                        <span>LR: <b>{record.criteriaScores.lexicalResource}</b></span>
                        <span className="text-stone-300">|</span>
                        <span>GRA: <b>{record.criteriaScores.grammar}</b></span>
                      </div>

                      {/* Overall Band Pill */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`px-3 py-1.5 rounded-xl font-black text-sm sm:text-base flex items-center gap-1 shadow-2xs ${
                            record.overallBand >= 7.0
                              ? 'bg-emerald-600 text-white'
                              : record.overallBand >= 6.5
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-stone-700 text-white'
                          }`}
                        >
                          <Award className="w-4 h-4" />
                          Band {record.overallBand.toFixed(1)}
                        </div>

                        {isTargetReached && (
                          <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            達標
                          </span>
                        )}
                      </div>

                      {/* Expand Chevron */}
                      <button
                        type="button"
                        className="p-1 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                        title={isExpanded ? '收合評析' : '展開完整評析'}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Accordion */}
                  {isExpanded && (
                    <div className="border-t border-stone-100 bg-stone-50/50 p-5 sm:p-6 space-y-5 animate-fade-in text-xs sm:text-sm">
                      {/* 1. Examiner General Feedback */}
                      {record.generalFeedbackZh && (
                        <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            AI 考官總評
                          </span>
                          <p className="text-stone-700 leading-relaxed text-xs sm:text-sm mt-1">
                            {record.generalFeedbackZh}
                          </p>
                        </div>
                      )}

                      {/* 2. Four Criteria Breakdown Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* TR */}
                        <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-stone-900 text-xs">TR / TA (審題與回應)</span>
                            <span className="font-extrabold text-amber-700 text-sm">
                              Band {record.criteriaScores.taskResponse}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-normal">
                            {record.criteriaFeedback?.taskResponse || '立場明確，完整覆蓋題目所有指引要求。'}
                          </p>
                        </div>

                        {/* CC */}
                        <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-stone-900 text-xs">CC (連貫與銜接)</span>
                            <span className="font-extrabold text-amber-700 text-sm">
                              Band {record.criteriaScores.coherenceCohesion}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-normal">
                            {record.criteriaFeedback?.coherenceCohesion || 'PEEL 段落開展順暢，無過多冗贅空話。'}
                          </p>
                        </div>

                        {/* LR */}
                        <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-stone-900 text-xs">LR (詞彙資源)</span>
                            <span className="font-extrabold text-amber-700 text-sm">
                              Band {record.criteriaScores.lexicalResource}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-normal">
                            {record.criteriaFeedback?.lexicalResource || '運用準確的學術主題詞彙與專業搭配詞。'}
                          </p>
                        </div>

                        {/* GRA */}
                        <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-stone-900 text-xs">GRA (文法多樣與準確)</span>
                            <span className="font-extrabold text-amber-700 text-sm">
                              Band {record.criteriaScores.grammar}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-normal">
                            {record.criteriaFeedback?.grammar || '複合句型結構多樣，時態與語法結構穩固。'}
                          </p>
                        </div>
                      </div>

                      {/* 3. Strengths & Action Plan */}
                      {(record.strengths?.length || record.ieltsActionPlan?.length) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {record.strengths && record.strengths.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                              <span className="text-xs font-bold text-emerald-900 block mb-1.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                優勢與亮點
                              </span>
                              <ul className="space-y-1 text-xs text-emerald-950">
                                {record.strengths.map((s, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-500">•</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {record.ieltsActionPlan && record.ieltsActionPlan.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                              <span className="text-xs font-bold text-amber-900 block mb-1.5 flex items-center gap-1">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                                下一步雅思提分行動方針
                              </span>
                              <ul className="space-y-1 text-xs text-amber-950">
                                {record.ieltsActionPlan.map((plan, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-amber-500">•</span>
                                    <span>{plan}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4. Student Draft vs. Polished Version Preview */}
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-white border border-stone-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-stone-800">
                              學生原始作文 ({record.wordCount} 字)
                            </span>
                            <button
                              onClick={(e) => handleCopyText(record.userDraft, record.id + '_draft', e)}
                              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              {copiedRecordId === record.id + '_draft' ? '已複製！' : '複製作文'}
                            </button>
                          </div>
                          <p className="text-xs text-stone-700 whitespace-pre-wrap font-serif leading-relaxed max-h-48 overflow-y-auto bg-stone-50/70 p-3 rounded-lg">
                            {record.userDraft}
                          </p>
                        </div>

                        {record.polishedVersion && (
                          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                AI 考官母語精修版本 (Band 8.0+)
                              </span>
                              <button
                                onClick={(e) => handleCopyText(record.polishedVersion!, record.id + '_polish', e)}
                                className="text-xs text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer font-semibold"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                {copiedRecordId === record.id + '_polish' ? '已複製！' : '複製精修版'}
                              </button>
                            </div>
                            <p className="text-xs text-stone-800 whitespace-pre-wrap font-serif leading-relaxed max-h-48 overflow-y-auto bg-white p-3 rounded-lg border border-emerald-100">
                              {record.polishedVersion}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Record Footer Actions */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/60">
                        <button
                          onClick={() => {
                            if (record.promptId) {
                              onNavigate('writing', record.promptId);
                            } else {
                              onNavigate('writing');
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          以此題目再次練習
                        </button>

                        <button
                          onClick={(e) => handleDeleteRecord(record.id, e)}
                          className="px-3 py-1.5 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          刪除此篇紀錄
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Reading & Listening Mock Exams + Mistakes Review */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Today&apos;s Focus</p>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-stone-900">
                {mistakes.length > 0
                  ? `先處理 ${mistakes[0].kind || '閱讀題型'} 錯題（共 ${mistakes.length} 題）`
                  : records.length === 0
                  ? '完成第一回閱讀模考'
                  : '針對寫作弱點（GRA / 連貫性）進行一次段落強化'}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-stone-500">
                按部就班穩固分數，錯題與寫作評析能幫助你精準避開雅思考試雷區。
              </p>
            </div>
            <Award className="h-6 w-6 text-amber-500 shrink-0" />
          </div>

          <div className="mt-5 rounded-2xl bg-stone-50 p-4 border border-stone-100">
            <p className="text-xs font-semibold text-stone-600">最近一次閱讀模考紀錄</p>
            {readingStats.latestRecord ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{readingStats.latestRecord.examTitle}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {readingStats.latestRecord.date} · 答對 {readingStats.latestRecord.score}/
                    {readingStats.latestRecord.totalQuestions} 題 ({readingStats.latestRecord.percentage}%)
                  </p>
                </div>
                <span className="text-xl font-bold text-emerald-700">
                  Band {readingStats.latestRecord.bandScore.toFixed(1)}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-stone-600">尚未有聽讀模考紀錄，建議先完成一回真題測試。</p>
            )}
          </div>
        </section>

        {/* Quick Launch Hub */}
        <section className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900 mb-3">各模組快捷導航</h2>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('writing')}
                className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-3 text-left hover:bg-amber-100/50 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                  <PenTool className="h-4 w-4" />
                </div>
                <span className="flex-1">
                  <span className="block text-xs font-bold text-stone-900">雅思寫作工坊 (Task 1 & 2)</span>
                  <span className="block text-[11px] text-stone-500">Liz 零贅詞引導與四項考官批改</span>
                </span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </button>

              <button
                onClick={() => onNavigate('ielts')}
                className="flex w-full items-center gap-3 rounded-2xl border border-stone-200 p-3 text-left hover:border-stone-300 hover:bg-stone-50 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="flex-1">
                  <span className="block text-xs font-bold text-stone-900">真題模考與錯題本</span>
                  <span className="block text-[11px] text-stone-500">計時模考、自動判分與詳解</span>
                </span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </button>

              <button
                onClick={() => onNavigate('vocabulary')}
                className="flex w-full items-center gap-3 rounded-2xl border border-stone-200 p-3 text-left hover:border-stone-300 hover:bg-stone-50 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-800 flex items-center justify-center">
                  <BookMarked className="h-4 w-4" />
                </div>
                <span className="flex-1">
                  <span className="block text-xs font-bold text-stone-900">核心雅思生字庫</span>
                  <span className="block text-[11px] text-stone-500">熟記測驗與剪貼簿快速讀取</span>
                </span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> 系統已即時備份學習進度
            </span>
            <button
              onClick={onOpenSettings}
              className="text-stone-600 hover:text-stone-900 underline cursor-pointer"
            >
              調整設定
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
