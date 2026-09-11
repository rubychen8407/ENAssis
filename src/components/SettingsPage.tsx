import React, { useState } from 'react';
import {
  ArrowLeft,
  Target,
  Calendar,
  Scale,
  Database,
  User,
  Keyboard,
  Check,
  RotateCcw,
  Sliders,
  AlertCircle,
  Clock,
  ShieldCheck,
  Cloud,
  Copy,
  Sparkles,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  BookMarked,
  LayoutDashboard,
  ExternalLink,
  Volume2,
  VolumeX,
  Radio,
  Languages,
} from 'lucide-react';
import { GeneralSettings, SpeakingSettings } from '../types/ielts';
import { DEFAULT_GENERAL_SETTINGS, DEFAULT_SPEAKING_SETTINGS } from '../utils/ielts';
import { getSyncAccountId } from '../utils/syncManager';
import { SettingsSection } from './UserMenu';
import { SkillTab } from '../types';

interface Props {
  initialSection?: SettingsSection;
  settings: GeneralSettings;
  onSaveSettings: (settings: GeneralSettings) => void;
  onBack: () => void;
  onNavigateToTab?: (tab: SkillTab) => void;
  onSeedSampleWriting?: () => void;
  onClearWritingRecords?: () => void;
  onOpenSyncModal?: () => void;
}

export const SettingsPage: React.FC<Props> = ({
  initialSection = 'goals',
  settings,
  onSaveSettings,
  onBack,
  onNavigateToTab,
  onSeedSampleWriting,
  onClearWritingRecords,
  onOpenSyncModal,
}) => {
  const [formData, setFormData] = useState<GeneralSettings>({ ...settings });
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const calculateDaysRemaining = (dateStr: string): number | null => {
    if (!dateStr) return null;
    const exam = new Date(dateStr).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    return Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysRemaining(formData.examDate);

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 1500);
  };

  const handleResetToDefault = () => {
    if (confirm('確定要恢復預設通用設定嗎？')) {
      setFormData({ ...DEFAULT_GENERAL_SETTINGS });
    }
  };

  const speaking: SpeakingSettings = formData.speakingSettings || DEFAULT_SPEAKING_SETTINGS;

  const updateSpeaking = (partial: Partial<SpeakingSettings>) => {
    setFormData({
      ...formData,
      speakingSettings: {
        ...speaking,
        ...partial,
      },
    });
  };

  const BAND_OPTIONS = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

  const sectionsList: { id: SettingsSection; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'goals', label: '雅思目標成績', icon: <Target className="w-4 h-4" />, desc: '總分與四科分項目標' },
    { id: 'exam', label: '考期與進度目標', icon: <Calendar className="w-4 h-4" />, desc: '倒數計時與每日任務' },
    { id: 'speaking', label: '口說與語音對話偏好', icon: <Mic className="w-4 h-4" />, desc: '語音朗讀、語速與自動送出' },
    { id: 'examiner', label: '考官與批改偏好', icon: <Scale className="w-4 h-4" />, desc: '嚴格度與回饋風格' },
    { id: 'data', label: '資料與字庫管理', icon: <Database className="w-4 h-4" />, desc: '備份與紀錄清理' },
    { id: 'profile', label: '個人檔案 (Profile)', icon: <User className="w-4 h-4" />, desc: '學員名稱與頭像' },
    { id: 'shortcuts', label: '快捷鍵與網站地圖', icon: <Keyboard className="w-4 h-4" />, desc: '操作指令與站點地圖' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            style={{ touchAction: 'manipulation' }}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition cursor-pointer"
            title="返回上一頁"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">系統設定與管理</span>
              <span className="text-xs text-stone-300 dark:text-stone-600">/</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {sectionsList.find((s) => s.id === activeSection)?.label}
              </span>
            </div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
              雅思目標與通用設定 (General Settings)
            </h1>
          </div>
        </div>

        {/* Quick Save Header Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition cursor-pointer"
          >
            恢復預設值
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{ touchAction: 'manipulation' }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold shadow hover:bg-stone-800 dark:hover:bg-stone-200 transition cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>已儲存設定！</span>
              </>
            ) : (
              <span>儲存設定</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Section Navigation + Content Panels */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left / Top Tabs Navigation */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="bg-white dark:bg-stone-900 p-2 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex md:flex-col gap-1 overflow-x-auto whitespace-nowrap">
            {sectionsList.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                style={{ touchAction: 'manipulation' }}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition cursor-pointer text-left shrink-0 md:w-full ${
                  activeSection === sec.id
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    activeSection === sec.id
                      ? 'bg-white/20 dark:bg-black/10 text-white dark:text-stone-950'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {sec.icon}
                </div>
                <div className="min-w-0">
                  <div className="truncate">{sec.label}</div>
                  <div
                    className={`text-[10px] hidden lg:block truncate ${
                      activeSection === sec.id ? 'opacity-80' : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    {sec.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-8 lg:col-span-9">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
            {/* 1. 雅思目標成績 */}
            {activeSection === 'goals' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    🎯 雅思目標成績 (Target Band Score)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    設定您的雅思整體目標總分與各科分項目標，AI 批改與進度分析將依此標準量身提供建議。
                  </p>
                </div>

                {/* Overall Band */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-amber-950 dark:text-amber-200">
                      雅思整體目標總分 (Overall Band Target)
                    </label>
                    <span className="text-2xl font-black font-mono text-amber-800 dark:text-amber-400">
                      Band {formData.targetOverallBand.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {BAND_OPTIONS.map((band) => (
                      <button
                        key={band}
                        type="button"
                        onClick={() => setFormData({ ...formData, targetOverallBand: band })}
                        className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                          formData.targetOverallBand === band
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-200/50 dark:border-stone-700'
                        }`}
                      >
                        {band.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Breakdown Targets */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    四科分項目標 (Individual Skill Targets)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'targetListeningBand' as const, label: '聽力 (Listening)', icon: '🎧' },
                      { key: 'targetReadingBand' as const, label: '閱讀 (Reading)', icon: '📖' },
                      { key: 'targetWritingBand' as const, label: '寫作 (Writing)', icon: '✍️' },
                      { key: 'targetSpeakingBand' as const, label: '口說 (Speaking)', icon: '🗣️' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                          <span>{item.icon}</span> {item.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100 mr-1">
                            Band
                          </span>
                          <select
                            value={formData[item.key]}
                            onChange={(e) =>
                              setFormData({ ...formData, [item.key]: parseFloat(e.target.value) })
                            }
                            className="px-2 py-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs font-mono font-bold text-stone-900 dark:text-stone-100 outline-none"
                          >
                            {BAND_OPTIONS.map((b) => (
                              <option key={b} value={b}>
                                {b.toFixed(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. 考期與進度目標 */}
            {activeSection === 'exam' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    📅 考期與進度目標 (Exam Schedule & Milestones)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    設定預定雅思考試日期，系統將自動計算倒數天數，並按進度調整練習節奏。
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <label className="text-xs font-bold text-sky-950 dark:text-sky-200 block mb-1">
                        預定考試日期 (Exam Date)
                      </label>
                      <input
                        type="date"
                        value={formData.examDate}
                        onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-sky-200 dark:border-stone-700 text-sm font-mono text-stone-900 dark:text-stone-100 outline-none"
                      />
                    </div>
                    {daysLeft !== null && (
                      <div className="text-right">
                        <span className="text-xs text-sky-700 dark:text-sky-300 block">考試倒數</span>
                        <span className="text-2xl font-black font-mono text-sky-900 dark:text-sky-200">
                          {daysLeft > 0 ? `${daysLeft} 天` : daysLeft === 0 ? '今天考試！' : `已過期 ${Math.abs(daysLeft)} 天`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    每日與每週進度目標 (Pacing Targets)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        每日目標新單字數 (Daily Vocab Goal)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={formData.dailyGoalVocabCount || 10}
                        onChange={(e) =>
                          setFormData({ ...formData, dailyGoalVocabCount: parseInt(e.target.value) || 10 })
                        }
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs font-mono font-bold text-stone-900 dark:text-stone-100 outline-none"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        每週寫作篇數目標 (Weekly Essay Target)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="14"
                        value={formData.targetWeeklyEssays || 3}
                        onChange={(e) =>
                          setFormData({ ...formData, targetWeeklyEssays: parseInt(e.target.value) || 3 })
                        }
                        className="w-full px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs font-mono font-bold text-stone-900 dark:text-stone-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 口說與語音對話偏好 */}
            {activeSection === 'speaking' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                      <Mic className="w-4 h-4" />
                    </span>
                    口說與語音對話偏好 (Speaking & Dialogue Settings)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    自訂 AI 語音口說練習時的語音朗讀、語速、自動停頓送出與連續免動手對話模式。
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">語音與自動送出設定</h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">免手動點擊送出，提供擬真即時口語對話體驗</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      即時生效
                    </span>
                  </div>

                  {/* Auto-send on silence toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">自動偵測停頓送出</span>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500">說完話靜音自動發送，不需手動按送出</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateSpeaking({ autoSendOnSilence: !speaking.autoSendOnSilence })}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                          speaking.autoSendOnSilence ? 'bg-stone-900 dark:bg-stone-100 justify-end' : 'bg-stone-200 dark:bg-stone-700 justify-start'
                        }`}
                      >
                        <span className="bg-white dark:bg-stone-900 w-4 h-4 rounded-full shadow-xs"></span>
                      </button>
                    </div>

                    {/* Silence pause threshold */}
                    {speaking.autoSendOnSilence && (
                      <div className="space-y-2 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 animate-fade-in">
                        <div className="flex justify-between text-xs text-stone-600 dark:text-stone-300">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            停頓偵測時間 (Pause Duration)
                          </span>
                          <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{speaking.silenceDelaySec} 秒</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { sec: 1.5, label: '1.5s 敏捷', desc: '節奏緊湊' },
                            { sec: 2.0, label: '2.0s 標準', desc: '推薦預設' },
                            { sec: 2.8, label: '2.8s 充裕', desc: '適合長句' },
                          ].map(({ sec, label, desc }) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => updateSpeaking({ silenceDelaySec: sec })}
                              className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition text-center ${
                                speaking.silenceDelaySec === sec
                                  ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                              }`}
                            >
                              <div>{label}</div>
                              <div className={`text-[10px] font-normal mt-0.5 ${speaking.silenceDelaySec === sec ? 'text-stone-300 dark:text-stone-600' : 'text-stone-400'}`}>
                                {desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hands-free continuous dialogue toggle */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                    <div>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200">
                        <Radio className="w-3.5 h-3.5 text-rose-500" />
                        免動手連續對話 (Hands-free Mode)
                      </span>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">AI 回答完後自動重啟麥克風聆聽，無需每次點擊按鈕</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSpeaking({ handsFreeMode: !speaking.handsFreeMode })}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                        speaking.handsFreeMode ? 'bg-rose-500 justify-end' : 'bg-stone-200 dark:bg-stone-700 justify-start'
                      }`}
                    >
                      <span className="bg-white w-4 h-4 rounded-full shadow-xs"></span>
                    </button>
                  </div>

                  {/* AI Auto Speak */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                    <div>
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">AI 自動語音朗讀 (Auto Speak)</span>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">收到 AI 回應時自動發音朗讀</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSpeaking({ autoSpeak: !speaking.autoSpeak })}
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        speaking.autoSpeak
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {speaking.autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Show translation */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                    <div>
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">顯示中文對照翻譯 (Show Translations)</span>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">在對話框中提供中文翻譯與更道地表達建議</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSpeaking({ showTranslations: !speaking.showTranslations })}
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        speaking.showTranslations
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <Languages className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Speech Rate */}
                  <div className="space-y-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex justify-between items-center text-xs text-stone-700 dark:text-stone-300">
                      <span className="font-bold">AI 語速 (Speech Rate)</span>
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{speaking.speechRate}x</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { rate: 0.8, label: '0.8x 慢速', desc: '清晰聽辨' },
                        { rate: 1.0, label: '1.0x 原速', desc: '標準語速' },
                        { rate: 1.2, label: '1.2x 快速', desc: '高分挑戰' },
                      ].map(({ rate, label, desc }) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => updateSpeaking({ speechRate: rate })}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition text-center ${
                            speaking.speechRate === rate
                              ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                              : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                          }`}
                        >
                          <div>{label}</div>
                          <div className={`text-[10px] font-normal mt-0.5 ${speaking.speechRate === rate ? 'text-stone-300 dark:text-stone-600' : 'text-stone-400'}`}>
                            {desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. 考官與批改偏好 */}
            {activeSection === 'examiner' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    ⚖️ 考官與批改偏好 (Examiner Persona & Feedback Strictness)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    自訂 AI 雅思考官的嚴格程度與批改風格，以符合不同衝刺階段的需求。
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                      批改嚴格程度 (Strictness Level)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'standard', label: '標準評分 (Standard)', desc: '依照官方標準嚴格對標' },
                        { id: 'strict', label: '嚴格考官 (Strict)', desc: '微小語法錯誤與搭配不當均會扣分' },
                        { id: 'encouraging', label: '鼓勵模式 (Supportive)', desc: '著重論點結構與寫作信心建立' },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, examinerStrictness: lvl.id as any })}
                          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                            formData.examinerStrictness === lvl.id
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                          }`}
                        >
                          <div className="text-xs font-bold">{lvl.label}</div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                            {lvl.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      首選英文拼寫與用詞體系 (Spelling & Lexical Preference)
                    </label>
                    <div className="flex gap-3 mt-2">
                      {[
                        { id: 'british', label: '英式英語 (British English - colour, centre)' },
                        { id: 'american', label: '美式英語 (American English - color, center)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, preferredDialect: item.id as any })}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            (formData.preferredDialect || 'british') === item.id
                              ? 'bg-purple-600 text-white'
                              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 資料與字庫管理 */}
            {activeSection === 'data' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    ⚙️ 資料與字庫管理 (Data & Storage Management)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    管理本機快取學習紀錄、範例寫作文章與跨裝置資料同步。
                  </p>
                </div>

                {/* Cloud Sync Status */}
                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-200">
                        跨裝置同帳號同步 (Cross-Device Sync)
                      </h4>
                    </div>
                    {onOpenSyncModal && (
                      <button
                        type="button"
                        onClick={onOpenSyncModal}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer"
                      >
                        切換或綁定帳號
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-sky-800 dark:text-sky-300 mb-3">
                    當前裝置同步代碼：
                    <code className="ml-1 px-2 py-0.5 rounded bg-white dark:bg-stone-900 font-mono font-bold text-sky-950 dark:text-sky-100 border border-sky-200 dark:border-sky-800">
                      {getSyncAccountId()}
                    </code>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getSyncAccountId());
                      alert('已複製同步代碼：' + getSyncAccountId());
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-sky-300 dark:border-sky-800 hover:bg-sky-100 text-xs font-bold text-sky-700 dark:text-sky-300 transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    複製代碼至其他裝置登入
                  </button>
                </div>

                {/* Writing & Sample Records */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    範例範文與演練資料
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {onSeedSampleWriting && (
                      <button
                        type="button"
                        onClick={() => {
                          onSeedSampleWriting();
                          alert('已成功載入雅思高分範文！');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold hover:bg-stone-800 transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        載入 Task 1 & 2 高分範例篇章
                      </button>
                    )}
                    {onClearWritingRecords && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('確定要清空所有寫作批改紀錄嗎？此動作不可撤銷。')) {
                            onClearWritingRecords();
                            alert('已清空寫作紀錄。');
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition cursor-pointer"
                      >
                        清空寫作批改歷史紀錄
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. 個人檔案 Profile */}
            {activeSection === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    👤 學員個人檔案 (Student Profile)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    設定學員暱稱、目標學校或移民組別，使 AI 對話與批改風格更具個人專屬感。
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      學員姓名 / 稱呼 (Display Name)
                    </label>
                    <input
                      type="text"
                      value={formData.profileName || ''}
                      onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                      placeholder="例如：Alex Chen"
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      頭像圖片網址 (Avatar Image URL)
                    </label>
                    <input
                      type="text"
                      value={formData.avatarUrl || ''}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      考試類別 (Exam Category)
                    </label>
                    <div className="flex gap-2">
                      {[
                        { id: 'academic', label: '學術組 (Academic)' },
                        { id: 'general', label: '一般訓練組 (General Training)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, targetStream: item.id as any })}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            (formData.targetStream || 'academic') === item.id
                              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. 快捷鍵與網站地圖 (Shortcuts & Site Map) */}
            {activeSection === 'shortcuts' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    ⌨️ 鍵盤快捷鍵與站點地圖 (Shortcuts & Site Map)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    完整的全域快捷鍵清單與功能架構地圖，協助您在電腦與行動裝置上流暢無阻地切換操作。
                  </p>
                </div>

                {/* Zen Mode Quick Control */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      禪模式 (Zen Mode 專注學習)
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                      隱藏頂部與底部導覽列，全螢幕沉浸練習。隨時按鍵盤 <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 font-mono font-bold text-amber-950 dark:text-amber-200 border border-amber-300">Z</kbd> 或右下角工具列按鈕即可無縫切換。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, zenMode: !formData.zenMode })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      formData.zenMode
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-200 text-stone-800 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-200'
                    }`}
                  >
                    {formData.zenMode ? 'Zen Mode 已開啟 ✓' : '切換為 Zen Mode'}
                  </button>
                </div>

                {/* Categorized Shortcuts Groups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Group 1: Global & System */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <LayoutDashboard className="w-4 h-4 text-stone-500" />
                      全域與視窗操作 (Global)
                    </h4>
                    <ul className="text-xs text-stone-700 dark:text-stone-300 space-y-2">
                      <li className="flex items-center justify-between gap-2 pb-1.5 border-b border-stone-200/50 dark:border-stone-700/50">
                        <span>專注模式切換 (Zen Mode)</span>
                        <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-mono font-bold">Z</kbd>
                      </li>
                      <li className="flex items-center justify-between gap-2 pb-1.5 border-b border-stone-200/50 dark:border-stone-700/50">
                        <span>關閉浮動選單或彈窗</span>
                        <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-mono font-bold">Esc</kbd>
                      </li>
                      <li className="flex items-center justify-between gap-2">
                        <span>儲存通用設定</span>
                        <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-mono font-bold">Ctrl + S</kbd>
                      </li>
                    </ul>
                  </div>

                  {/* Group 2: Vocabulary & Flashcards */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <BookMarked className="w-4 h-4 text-stone-500" />
                      生字庫與單字卡 (Vocabulary)
                    </h4>
                    <ul className="text-xs text-stone-700 dark:text-stone-300 space-y-2">
                      <li className="flex items-center justify-between gap-2 pb-1.5 border-b border-stone-200/50 dark:border-stone-700/50">
                        <span>翻轉字卡 / 進入說寫檢測</span>
                        <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-mono font-bold">Space (空白鍵)</kbd>
                      </li>
                      <li className="flex items-center justify-between gap-2 pb-1.5 border-b border-stone-200/50 dark:border-stone-700/50">
                        <span>切換上一張 / 下一張字卡</span>
                        <div className="flex gap-1">
                          <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-mono font-bold">←</kbd>
                          <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-mono font-bold">→</kbd>
                        </div>
                      </li>
                      <li className="flex items-center justify-between gap-2">
                        <span>手機端切換字卡</span>
                        <span className="font-mono text-stone-500">左右滑動 (Swipe)</span>
                      </li>
                    </ul>
                  </div>

                  {/* Group 3: Listening Lab */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Headphones className="w-4 h-4 text-stone-500" />
                      聽力實驗室 (Listening Lab)
                    </h4>
                    <ul className="text-xs text-stone-700 dark:text-stone-300 space-y-2">
                      <li className="flex items-center justify-between gap-2 pb-1.5 border-b border-stone-200/50 dark:border-stone-700/50">
                        <span>播放 / 暫停語音朗讀</span>
                        <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-mono font-bold">Space</kbd>
                      </li>
                      <li className="flex items-center justify-between gap-2">
                        <span>切換研讀 / 雅思模考模式</span>
                        <span className="font-mono text-stone-500">右下角浮動工具列</span>
                      </li>
                    </ul>
                  </div>

                  {/* Group 4: Writing & AI Polish */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-stone-500" />
                      寫作工坊 (Writing Studio)
                    </h4>
                    <ul className="text-xs text-stone-700 dark:text-stone-300 space-y-2">
                      <li className="flex items-center justify-between gap-2 pb-1.5 border-b border-stone-200/50 dark:border-stone-700/50">
                        <span>提交文章進行 AI 評分批改</span>
                        <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-mono font-bold">Ctrl + Enter</kbd>
                      </li>
                      <li className="flex items-center justify-between gap-2">
                        <span>採納 AI 推薦高階句型替換</span>
                        <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-mono font-bold">點擊替換</kbd>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Interactive Site Map (網站功能地圖) */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    🗺️ 完整功能站點地圖 (Functional Site Map)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { tab: 'dashboard' as const, title: '今日進度 (Dashboard)', desc: '倒數計時、四科技能儀表與每日任務清單', icon: <LayoutDashboard className="w-4 h-4 text-amber-500" /> },
                      { tab: 'vocabulary' as const, title: '生字庫 (Vocabulary)', desc: '單字卡重要度排序、AI 說寫檢測、批次匯入', icon: <BookMarked className="w-4 h-4 text-emerald-500" /> },
                      { tab: 'listening' as const, title: '聽力實驗室 (Listening)', desc: '生字篇章精聽、真實音訊教材、雅思聽力題組', icon: <Headphones className="w-4 h-4 text-sky-500" /> },
                      { tab: 'speaking' as const, title: '口說對話 (Speaking)', desc: 'Part 1/2/3 仿真雅思考官即時語音對話與糾錯', icon: <Mic className="w-4 h-4 text-rose-500" /> },
                      { tab: 'reading' as const, title: '閱讀中心 (Reading)', desc: '學術長文分析、生字一鍵採集與題型定位', icon: <BookOpen className="w-4 h-4 text-indigo-500" /> },
                      { tab: 'writing' as const, title: '寫作工坊 (Writing)', desc: 'Task 1 & 2 四大評分規準 AI 深度診斷與精修', icon: <PenTool className="w-4 h-4 text-purple-500" /> },
                    ].map((mod) => (
                      <button
                        key={mod.tab}
                        type="button"
                        onClick={() => {
                          if (onNavigateToTab) {
                            onNavigateToTab(mod.tab);
                          }
                        }}
                        style={{ touchAction: 'manipulation' }}
                        className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/70 text-left hover:border-amber-400 hover:shadow-xs transition cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {mod.icon}
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                              {mod.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                          {mod.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
