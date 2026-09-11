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
  Headphones,
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
} from '../types/ielts';
import {
  calculateWritingStats,
  deleteIELTSWritingRecord,
  exportIELTSPracticeReportMarkdown,
  seedSampleWritingRecords,
} from '../utils/ielts';

interface Props {
  savedWords: VocabWord[];
  records: IELTSRecord[];
  mistakes: IELTSMistakeItem[];
  writingRecords: IELTSWritingRecord[];
  settings: GeneralSettings;
  onOpenSettings: () => void;
  onNavigate: (tab: SkillTab, promptId?: string) => void;
  onRefreshRecords: () => void;
}

export const Dashboard: React.FC<Props> = ({
  savedWords,
  records,
  mistakes,
  writingRecords,
  settings,
  onOpenSettings,
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

  const listeningRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          r.category?.toLowerCase().includes('listening') ||
          r.examId.startsWith('ielts_listen_') ||
          r.examTitle.includes('聽力')
      ),
    [records]
  );

  const readingRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          !(
            r.category?.toLowerCase().includes('listening') ||
            r.examId.startsWith('ielts_listen_') ||
            r.examTitle.includes('聽力')
          )
      ),
    [records]
  );

  const examStats = useMemo(() => {
    const averageBand = records.length
      ? (records.reduce((total, record) => total + record.bandScore, 0) / records.length).toFixed(1)
      : null;
    const listeningAvg = listeningRecords.length
      ? (
          listeningRecords.reduce((total, record) => total + record.bandScore, 0) /
          listeningRecords.length
        ).toFixed(1)
      : null;
    const readingAvg = readingRecords.length
      ? (
          readingRecords.reduce((total, record) => total + record.bandScore, 0) /
          readingRecords.length
        ).toFixed(1)
      : null;
    const latestRecord = records[0] || null;
    return { averageBand, listeningAvg, readingAvg, latestRecord };
  }, [records, listeningRecords, readingRecords]);

  const readingStats = examStats; // Backwards compatibility for existing references

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
    const md = exportIELTSPracticeReportMarkdown(records, mistakes, writingRecords);
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
      {/* 2. Key Metrics Grid */}

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-stone-600">最新模考歷程 (聽力 / 閱讀)</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {examStats.listeningAvg && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    聽力均分 Band {examStats.listeningAvg}
                  </span>
                )}
                {examStats.readingAvg && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                    閱讀均分 Band {examStats.readingAvg}
                  </span>
                )}
              </div>
            </div>

            {examStats.latestRecord ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        examStats.latestRecord.category?.toLowerCase().includes('listening') ||
                        examStats.latestRecord.examId.startsWith('ielts_listen_') ||
                        examStats.latestRecord.examTitle.includes('聽力')
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {examStats.latestRecord.category?.toLowerCase().includes('listening') ||
                      examStats.latestRecord.examId.startsWith('ielts_listen_') ||
                      examStats.latestRecord.examTitle.includes('聽力')
                        ? '聽力 Listening'
                        : '閱讀 Reading'}
                    </span>
                    <p className="text-sm font-semibold text-stone-900">{examStats.latestRecord.examTitle}</p>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {examStats.latestRecord.date} · 答對 {examStats.latestRecord.score}/
                    {examStats.latestRecord.totalQuestions} 題 ({examStats.latestRecord.percentage}%)
                  </p>
                </div>
                <span className="text-xl font-black text-emerald-700">
                  Band {examStats.latestRecord.bandScore.toFixed(1)}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-stone-600">尚未有聽讀模考紀錄，建議前往聽力實驗室或真題模考完成一次測試。</p>
            )}
          </div>
        </section>

        {/* Quick Launch Hub */}
        <section className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900 mb-3">各模組快捷導航</h2>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('listening')}
                className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-3 text-left hover:bg-amber-100/50 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                  <Headphones className="h-4 w-4" />
                </div>
                <span className="flex-1">
                  <span className="block text-xs font-bold text-stone-900">聽力實驗室 (Listening Lab)</span>
                  <span className="block text-[11px] text-stone-500">IELTS 聽力模考、生字篇章與語音匯入</span>
                </span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </button>

              <button
                onClick={() => onNavigate('writing')}
                className="flex w-full items-center gap-3 rounded-2xl border border-stone-200 p-3 text-left hover:border-stone-300 hover:bg-stone-50 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                  <PenTool className="h-4 w-4" />
                </div>
                <span className="flex-1">
                  <span className="block text-xs font-bold text-stone-900">雅思寫作工坊 (Task 1 & 2)</span>
                  <span className="block text-[11px] text-stone-500">官方高分思維引導與四項考官批改</span>
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
                  <span className="block text-xs font-bold text-stone-900">真題閱讀模考與錯題本</span>
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
