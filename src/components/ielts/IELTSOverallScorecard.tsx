import React, { useState, useMemo } from 'react';
import {
  Award,
  Headphones,
  Mic,
  BookOpen,
  PenTool,
  TrendingUp,
  Target,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  RefreshCw,
  ArrowRight,
  Info,
} from 'lucide-react';
import { SkillTab } from '../../types';
import {
  GeneralSettings,
  IELTSRecord,
  IELTSWritingRecord,
  IELTSSpeakingRecord,
  IELTSListeningRecord,
} from '../../types/ielts';
import {
  calculateFourSkillsSummary,
  calculateIELTSOverallBand,
  getBandScoreDescriptor,
} from '../../utils/ielts';

interface Props {
  records: IELTSRecord[];
  writingRecords: IELTSWritingRecord[];
  speakingRecords: IELTSSpeakingRecord[];
  listeningRecords: IELTSListeningRecord[];
  settings: GeneralSettings;
  onUpdateSettings: (updated: GeneralSettings) => void;
  onNavigate: (tab: SkillTab, promptId?: string) => void;
  onOpenSettings: () => void;
}

export const IELTSOverallScorecard: React.FC<Props> = ({
  records,
  writingRecords,
  speakingRecords,
  listeningRecords,
  settings,
  onUpdateSettings,
  onNavigate,
  onOpenSettings,
}) => {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  // Dynamic scores from actual practice
  const practiceAverages = useMemo(() => {
    const avgWriting =
      writingRecords.length > 0
        ? writingRecords.reduce((acc, r) => acc + (r.overallBand || 0), 0) / writingRecords.length
        : settings.currentScores.writing;

    const avgReading =
      records.length > 0
        ? records.reduce((acc, r) => acc + (r.bandScore || 0), 0) / records.length
        : settings.currentScores.reading;

    const avgSpeaking =
      speakingRecords.length > 0
        ? speakingRecords.reduce((acc, s) => acc + (s.overallBand || 0), 0) / speakingRecords.length
        : settings.currentScores.speaking;

    const avgListening =
      listeningRecords.length > 0
        ? listeningRecords.reduce((acc, l) => acc + (l.bandScore || 0), 0) / listeningRecords.length
        : settings.currentScores.listening;

    return {
      writing: Math.round(avgWriting * 2) / 2,
      reading: Math.round(avgReading * 2) / 2,
      speaking: Math.round(avgSpeaking * 2) / 2,
      listening: Math.round(avgListening * 2) / 2,
    };
  }, [writingRecords, records, speakingRecords, listeningRecords, settings.currentScores]);

  // Current active scores depending on mode
  const activeScores = useMemo(() => {
    if (settings.scoreCalculationMode === 'auto') {
      return practiceAverages;
    }
    return settings.currentScores;
  }, [settings.scoreCalculationMode, practiceAverages, settings.currentScores]);

  // Calculate 4-skills master summary
  const summary = useMemo(() => {
    return calculateFourSkillsSummary(
      activeScores.listening,
      activeScores.speaking,
      activeScores.reading,
      activeScores.writing,
      settings.targetOverallBand
    );
  }, [activeScores, settings.targetOverallBand]);

  // Simulator local draft scores
  const [simScores, setSimScores] = useState({
    listening: activeScores.listening,
    speaking: activeScores.speaking,
    reading: activeScores.reading,
    writing: activeScores.writing,
  });

  const simOverallBand = useMemo(() => {
    return calculateIELTSOverallBand(
      simScores.listening,
      simScores.speaking,
      simScores.reading,
      simScores.writing
    );
  }, [simScores]);

  const simRawAvg = useMemo(() => {
    return (
      Math.round(((simScores.listening + simScores.speaking + simScores.reading + simScores.writing) / 4) * 100) /
      100
    );
  }, [simScores]);

  const handleOpenSimulator = () => {
    setSimScores({
      listening: activeScores.listening,
      speaking: activeScores.speaking,
      reading: activeScores.reading,
      writing: activeScores.writing,
    });
    setIsSimulatorOpen(true);
  };

  const handleSaveSimulatorAsCurrent = () => {
    onUpdateSettings({
      ...settings,
      scoreCalculationMode: 'manual',
      currentScores: { ...simScores },
    });
    setIsSimulatorOpen(false);
  };

  const handleSyncPracticeIntoSimulator = () => {
    setSimScores({ ...practiceAverages });
  };

  const handleToggleMode = () => {
    const nextMode = settings.scoreCalculationMode === 'auto' ? 'manual' : 'auto';
    onUpdateSettings({
      ...settings,
      scoreCalculationMode: nextMode,
    });
  };

  const skillCards = [
    {
      key: 'listening' as const,
      name: '聽力',
      enName: 'Listening',
      icon: Headphones,
      iconColor: 'text-sky-600',
      bgLight: 'bg-sky-50/70 border-sky-200',
      pillColor: 'bg-sky-100 text-sky-800',
      progressColor: 'bg-sky-500',
      current: activeScores.listening,
      target: settings.targetScores.listening,
      recordsCount: listeningRecords.length,
      tab: 'listening' as SkillTab,
      practiceLabel: '聽力精聽',
    },
    {
      key: 'speaking' as const,
      name: '口說',
      enName: 'Speaking',
      icon: Mic,
      iconColor: 'text-rose-600',
      bgLight: 'bg-rose-50/70 border-rose-200',
      pillColor: 'bg-rose-100 text-rose-800',
      progressColor: 'bg-rose-500',
      current: activeScores.speaking,
      target: settings.targetScores.speaking,
      recordsCount: speakingRecords.length,
      tab: 'speaking' as SkillTab,
      practiceLabel: 'AI語音對話',
    },
    {
      key: 'reading' as const,
      name: '閱讀',
      enName: 'Reading',
      icon: BookOpen,
      iconColor: 'text-emerald-600',
      bgLight: 'bg-emerald-50/70 border-emerald-200',
      pillColor: 'bg-emerald-100 text-emerald-800',
      progressColor: 'bg-emerald-500',
      current: activeScores.reading,
      target: settings.targetScores.reading,
      recordsCount: records.length,
      tab: 'reading' as SkillTab,
      practiceLabel: '閱讀真題',
    },
    {
      key: 'writing' as const,
      name: '寫作',
      enName: 'Writing',
      icon: PenTool,
      iconColor: 'text-amber-600',
      bgLight: 'bg-amber-50/70 border-amber-200',
      pillColor: 'bg-amber-100 text-amber-800',
      progressColor: 'bg-amber-500',
      current: activeScores.writing,
      target: settings.targetScores.writing,
      recordsCount: writingRecords.length,
      tab: 'writing' as SkillTab,
      practiceLabel: 'Liz寫作工坊',
    },
  ];

  return (
    <div id="ielts-overall-scorecard" className="space-y-4">
      {/* Hero Master Score Banner */}
      <div className="rounded-3xl bg-linear-to-br from-stone-900 via-stone-850 to-stone-900 text-white p-6 sm:p-7 shadow-xl relative overflow-hidden border border-stone-800">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="relative z-10 space-y-6">
          {/* Header Row: Title, Mode Badges, Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  IELTS 聽說讀寫全科總成績
                </span>
                <button
                  onClick={handleToggleMode}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 transition cursor-pointer flex items-center gap-1.5"
                  title="點擊切換計算模式"
                >
                  <RefreshCw className="w-3 h-3 text-stone-400" />
                  模式：{settings.scoreCalculationMode === 'auto' ? '實戰練習動態加權' : '手動基準校準'}
                </button>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>四維總成績單</span>
                <span className="text-xs font-normal text-stone-400">
                  (British Council & Cambridge 官方進位計算)
                </span>
              </h2>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="btn-open-score-simulator"
                onClick={handleOpenSimulator}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>試算與調整成績</span>
              </button>
              <button
                id="btn-toggle-formula-info"
                onClick={() => setShowFormulaInfo(!showFormulaInfo)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition cursor-pointer"
                title="查看雅思官方總分計分規則"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Formula Info Collapse */}
          {showFormulaInfo && (
            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 text-xs text-stone-300 space-y-2 animate-fade-in">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Info className="w-4 h-4 text-amber-400" />
                <span>雅思官方總分計算與進位規則 (Official Rounding Rule)</span>
              </div>
              <p className="leading-relaxed text-stone-300">
                雅思總成績 (Overall Band Score) 為「聽力、口說、閱讀、寫作」四科成績的<strong>算術平均數</strong>。
                官方採用精確至 0.25 的進位標準：
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <li className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                  小數點 &lt; .25 ➔ <strong>捨去至整數</strong> (例: 6.125 ➔ 6.0)
                </li>
                <li className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                  小數點 ≥ .25 且 &lt; .75 ➔ <strong>進位至 .5</strong> (例: 6.25, 6.375, 6.625 ➔ 6.5)
                </li>
                <li className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                  小數點 ≥ .75 ➔ <strong>進位至下一整數</strong> (例: 6.75 ➔ 7.0)
                </li>
              </ul>
            </div>
          )}

          {/* Centerpiece: Score Numbers & Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Big Overall Band Display */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start p-4 sm:p-5 rounded-2xl bg-stone-800/60 border border-stone-750">
              <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">
                當前雅思官方總分 (Overall Band)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight font-serif">
                  {summary.overallBand.toFixed(1)}
                </span>
                <span className="text-sm text-stone-400 font-medium">/ 9.0</span>
              </div>
              <div className="mt-2 text-xs text-stone-300 font-medium">
                {getBandScoreDescriptor(summary.overallBand)}
              </div>
              <div className="mt-2 text-[11px] text-stone-400 font-mono">
                四科平均: {summary.rawAverage.toFixed(2)} 分
              </div>
            </div>

            {/* Target Comparison & Advancement Strategy */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-800/40 border border-stone-750">
                <div>
                  <div className="text-xs text-stone-400">總體目標成績 (Target Overall)</div>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>Band {summary.targetOverallBand.toFixed(1)}</span>
                    {summary.isTargetMet ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        已達目標
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-semibold">
                        距目標差距 {summary.targetGap.toFixed(1)} 分
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={onOpenSettings}
                  className="px-3 py-1.5 rounded-xl bg-stone-750 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-650 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>調整考期與目標</span>
                </button>
              </div>

              {/* Exact Formula String Display */}
              <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-750 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-mono text-stone-300 flex items-center gap-1.5 flex-wrap">
                  <span className="text-stone-400 font-sans">公式算式：</span>
                  <span>(聽 {summary.listening.toFixed(1)} + 說 {summary.speaking.toFixed(1)} + 讀 {summary.reading.toFixed(1)} + 寫 {summary.writing.toFixed(1)}) ÷ 4</span>
                  <span className="text-stone-500">=</span>
                  <span className="text-stone-300">{summary.rawAverage.toFixed(2)}</span>
                  <span className="text-amber-400">➔ Band {summary.overallBand.toFixed(1)}</span>
                </div>

                {summary.overallBand < 9.0 && (
                  <div className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      再 +{summary.pointsToNextBand.toFixed(1)} 分即晉升 Band {summary.nextBand.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Smart Tip for fast score jump */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">💡 提分突破口：</span>
                  <span>
                    目前優勢科目為<strong>「{summary.strongestSkill.name}」</strong>(Band {summary.strongestSkill.band.toFixed(1)})，
                    需加強突破<strong>「{summary.weakestSkill.name}」</strong>(Band {summary.weakestSkill.band.toFixed(1)})。
                    {summary.overallBand < summary.targetOverallBand && (
                      <span>
                        若將 {summary.weakestSkill.name.slice(0, 2)} 提升至 {(summary.weakestSkill.band + 0.5).toFixed(1)}，總分即有望直接躍升！
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Skill Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {skillCards.map((skill) => {
          const Icon = skill.icon;
          const diff = Math.round((skill.current - skill.target) * 10) / 10;
          const isMet = skill.current >= skill.target;
          const progressPercent = Math.min(100, Math.max(10, Math.round((skill.current / 9.0) * 100)));

          return (
            <div
              key={skill.key}
              className={`p-4 rounded-2xl bg-white border ${skill.bgLight} transition-all duration-200 hover:shadow-md flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl bg-white border border-stone-200/80 shadow-2xs ${skill.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">{skill.name}</h3>
                      <span className="text-[11px] text-stone-500">{skill.enName}</span>
                    </div>
                  </div>

                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${skill.pillColor}`}>
                    Band {skill.current.toFixed(1)}
                  </span>
                </div>

                {/* Score vs Target Info */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">目標：Band {skill.target.toFixed(1)}</span>
                    <span className={`font-semibold ${isMet ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isMet ? '已達標 ✓' : `差 ${Math.abs(diff).toFixed(1)}`}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${skill.progressColor}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-stone-400 pt-1 flex items-center justify-between">
                    <span>累計練習：{skill.recordsCount} 篇/次</span>
                    <span>滿分 9.0</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onNavigate(skill.tab)}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>前往{skill.practiceLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Interactive Simulator / Calibration Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-600" />
                  <span>雅思四科總成績試算與調整</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  即時調整聽、說、讀、寫分數，檢視官方進位總分變化
                </p>
              </div>
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Result Preview Banner */}
            <div className="p-4 rounded-2xl bg-stone-900 text-white flex items-center justify-between shadow-inner">
              <div>
                <span className="text-xs text-stone-400 block">試算官方總成績 (Overall Band)</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-amber-400 font-serif">
                    Band {simOverallBand.toFixed(1)}
                  </span>
                  <span className="text-xs text-stone-300 font-mono">
                    (平均 {simRawAvg.toFixed(2)})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-400 block">目標 Band {settings.targetOverallBand.toFixed(1)}</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                    simOverallBand >= settings.targetOverallBand
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {simOverallBand >= settings.targetOverallBand
                    ? '✓ 達成目標'
                    : `差距 ${(settings.targetOverallBand - simOverallBand).toFixed(1)}`}
                </span>
              </div>
            </div>

            {/* Quick sync button */}
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>四科成績調整 (4.0 ~ 9.0 分，步進 0.5)：</span>
              <button
                type="button"
                onClick={handleSyncPracticeIntoSimulator}
                className="text-amber-700 hover:text-amber-800 font-semibold cursor-pointer flex items-center gap-1 underline"
              >
                <RotateCcw className="w-3 h-3" />
                帶入實測練習平均
              </button>
            </div>

            {/* 4 Skill Steppers / Sliders */}
            <div className="space-y-4">
              {[
                { label: '聽力 (Listening)', key: 'listening' as const, color: 'text-sky-700' },
                { label: '口說 (Speaking)', key: 'speaking' as const, color: 'text-rose-700' },
                { label: '閱讀 (Reading)', key: 'reading' as const, color: 'text-emerald-700' },
                { label: '寫作 (Writing)', key: 'writing' as const, color: 'text-amber-700' },
              ].map((item) => (
                <div key={item.key} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${item.color}`}>{item.label}</span>
                    <span className="text-sm font-black text-stone-900 bg-white px-2.5 py-0.5 rounded-lg border border-stone-200">
                      Band {simScores[item.key].toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="4.0"
                      max="9.0"
                      step="0.5"
                      value={simScores[item.key]}
                      onChange={(e) =>
                        setSimScores({
                          ...simScores,
                          [item.key]: Number(e.target.value),
                        })
                      }
                      className="w-full accent-amber-600 h-2 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
                    <span>4.0</span>
                    <span>5.5</span>
                    <span>7.0</span>
                    <span>8.5</span>
                    <span>9.0</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveSimulatorAsCurrent}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>儲存為當前基準分</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
