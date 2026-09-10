import React, { useState } from 'react';
import {
  X,
  Target,
  Calendar,
  Sparkles,
  BookOpen,
  PenTool,
  Check,
  RotateCcw,
  Sliders,
  AlertCircle,
  Clock,
  ShieldCheck,
  Cloud,
  Copy,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { GeneralSettings } from '../types/ielts';
import { DEFAULT_GENERAL_SETTINGS } from '../utils/ielts';
import {
  getSyncAccountId,
  performCrossDeviceSync,
  switchAndPullAccount,
} from '../utils/syncManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: GeneralSettings;
  onSaveSettings: (settings: GeneralSettings) => void;
  onSeedSampleWriting?: () => void;
  onClearWritingRecords?: () => void;
}

export const GeneralSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onSeedSampleWriting,
  onClearWritingRecords,
}) => {
  const [formData, setFormData] = useState<GeneralSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'goals' | 'exam' | 'examiner' | 'data' | 'profile' | 'shortcuts'>('goals');

  if (!isOpen) return null;

  // Calculate days remaining to exam
  const calculateDaysRemaining = (dateStr: string): number | null => {
    if (!dateStr) return null;
    const exam = new Date(dateStr).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    const diff = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysLeft = calculateDaysRemaining(formData.examDate);

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetToDefault = () => {
    setFormData({ ...DEFAULT_GENERAL_SETTINGS });
  };

  const BAND_OPTIONS = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                雅思目標與通用設定 (General Settings)
              </h2>
              <p className="text-xs text-stone-500">自訂雅思總目標、四科分項成績、考試倒數與 AI 批改嚴格度</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation */}
        <div className="px-6 pt-3 flex gap-2 border-b border-stone-100 bg-white">
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'goals'
                ? 'border-stone-900 text-stone-900 bg-stone-50/80'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            🎯 雅思目標成績
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'exam'
                ? 'border-stone-900 text-stone-900 bg-stone-50/80'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            📅 考期與進度目標
          </button>
          <button
            onClick={() => setActiveTab('examiner')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'examiner'
                ? 'border-stone-900 text-stone-900 bg-stone-50/80'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            ⚖️ 考官與批改偏好
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'data'
                ? 'border-stone-900 text-stone-900 bg-stone-50/80'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            ⚙️ 資料管理
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-stone-900 text-stone-900 bg-stone-50/80'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            👤 Profile
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'shortcuts'
                ? 'border-stone-900 text-stone-900 bg-stone-50/80'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            ⌨️ Shortcut
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-800 text-sm">
          {activeTab === 'goals' && (
            <div className="space-y-6 animate-fade-in">
              {/* Overall Band Target */}
              <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-600" />
                    總目標成績 (Overall Target Band)
                  </label>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950">
                    目前設定: Band {formData.targetOverallBand.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mb-3">
                  儀表板將依據此總目標計算差距、設定各模考進度條與寫作建議要求。
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {BAND_OPTIONS.map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setFormData({ ...formData, targetOverallBand: band })}
                      className={`py-2.5 px-3 rounded-xl font-bold text-sm transition cursor-pointer text-center border ${
                        formData.targetOverallBand === band
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      Band {band.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-test Band Targets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
                  四科分項成績目標 (Sub-scores Target Bands)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Listening */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-stone-800">聽力 (Listening)</span>
                      <span className="text-[11px] text-stone-500">建議設定 7.0 - 8.0 穩固平均</span>
                    </div>
                    <select
                      value={formData.targetScores.listening}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetScores: { ...formData.targetScores, listening: Number(e.target.value) },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-400 cursor-pointer"
                    >
                      {[5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                        <option key={b} value={b}>
                          Band {b.toFixed(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reading */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-stone-800">閱讀 (Reading)</span>
                      <span className="text-[11px] text-stone-500">高分關鍵，真題正確率 30+ 題</span>
                    </div>
                    <select
                      value={formData.targetScores.reading}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetScores: { ...formData.targetScores, reading: Number(e.target.value) },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-400 cursor-pointer"
                    >
                      {[5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                        <option key={b} value={b}>
                          Band {b.toFixed(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Writing */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-amber-900 flex items-center gap-1">
                        <PenTool className="w-3.5 h-3.5 text-amber-600" />
                        寫作 (Writing)
                      </span>
                      <span className="text-[11px] text-amber-700/80">寫作練習室預設評核目標</span>
                    </div>
                    <select
                      value={formData.targetScores.writing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetScores: { ...formData.targetScores, writing: Number(e.target.value) },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-sm font-bold text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      {[5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5].map((b) => (
                        <option key={b} value={b}>
                          Band {b.toFixed(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speaking */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-stone-800">口說 (Speaking)</span>
                      <span className="text-[11px] text-stone-500">流利度、連貫性與發音</span>
                    </div>
                    <select
                      value={formData.targetScores.speaking}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetScores: { ...formData.targetScores, speaking: Number(e.target.value) },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-400 cursor-pointer"
                    >
                      {[5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5].map((b) => (
                        <option key={b} value={b}>
                          Band {b.toFixed(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exam' && (
            <div className="space-y-5 animate-fade-in">
              {/* Study Plan Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  衝刺計畫名稱 (Study Plan Title)
                </label>
                <input
                  type="text"
                  value={formData.studyPlanTitle || ''}
                  onChange={(e) => setFormData({ ...formData, studyPlanTitle: e.target.value })}
                  placeholder="例如：2026 雅思 Band 7.0+ 衝刺衝刺"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-400 text-sm font-medium"
                />
              </div>

              {/* Target Exam Date */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    預定考試日期 (Target Exam Date)
                  </label>
                  {daysLeft !== null && (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        daysLeft > 0
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {daysLeft > 0 ? `距離考試還有 ${daysLeft} 天` : '考試日已抵達或已過期'}
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-400 text-sm font-medium"
                />
                <p className="mt-2 text-xs text-stone-500">設定考期後，Dashboard 將顯示每日倒數與每週進度提醒。</p>
              </div>

              {/* Weekly and Daily Goals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-amber-600" />
                    每週寫作目標篇數
                  </label>
                  <p className="text-[11px] text-stone-500 mb-3">維持手感與時間控管</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={7}
                      step={1}
                      value={formData.weeklyWritingGoal}
                      onChange={(e) => setFormData({ ...formData, weeklyWritingGoal: Number(e.target.value) })}
                      className="flex-1 accent-amber-600"
                    />
                    <span className="font-bold text-base text-stone-900 w-12 text-right">
                      {formData.weeklyWritingGoal} 篇
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    每日生字記憶目標
                  </label>
                  <p className="text-[11px] text-stone-500 mb-3">搭配熟記測驗累積詞彙</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={5}
                      max={40}
                      step={5}
                      value={formData.dailyVocabGoal}
                      onChange={(e) => setFormData({ ...formData, dailyVocabGoal: Number(e.target.value) })}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="font-bold text-base text-stone-900 w-12 text-right">
                      {formData.dailyVocabGoal} 字
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examiner' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  AI 考官嚴格標準 (Examiner Strictness)
                </label>
                <div className="space-y-2.5">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      formData.examinerStrictness === 'strict_liz'
                        ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="examinerStrictness"
                      checked={formData.examinerStrictness === 'strict_liz'}
                      onChange={() => setFormData({ ...formData, examinerStrictness: 'strict_liz' })}
                      className="mt-1 accent-amber-600"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-stone-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        IELTS Liz 頂級嚴格標準（推薦）
                      </p>
                      <p className="text-stone-500 mt-0.5">
                        嚴格剔除所有無效空話與陳舊模板詞；Task 1 檢驗 Overview 是否避開具體數字，Task 2 檢驗 PEEL 邏輯。
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      formData.examinerStrictness === 'standard'
                        ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="examinerStrictness"
                      checked={formData.examinerStrictness === 'standard'}
                      onChange={() => setFormData({ ...formData, examinerStrictness: 'standard' })}
                      className="mt-1 accent-amber-600"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-stone-900">官方標準劍橋考官評分 (Cambridge Standard)</p>
                      <p className="text-stone-500 mt-0.5">
                        對照 IELTS 官方 4 準則 Descriptor（TR, CC, LR, GRA）進行客觀、中立的學術分析。
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      formData.examinerStrictness === 'encouraging'
                        ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="examinerStrictness"
                      checked={formData.examinerStrictness === 'encouraging'}
                      onChange={() => setFormData({ ...formData, examinerStrictness: 'encouraging' })}
                      className="mt-1 accent-amber-600"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-stone-900">溫和建構式指導 (Gentle & Encouraging)</p>
                      <p className="text-stone-500 mt-0.5">
                        先讚賞閃光點與好句，逐步引導文法糾錯與替換詞升級，適合初期建立寫作信心。
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  批改回饋語言偏好 (Feedback Language)
                </label>
                <div className="flex gap-3">
                  <label
                    className={`flex-1 p-3 rounded-xl border text-center cursor-pointer transition text-xs font-bold ${
                      formData.feedbackLanguage === 'zh-TW'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="feedbackLanguage"
                      checked={formData.feedbackLanguage === 'zh-TW'}
                      onChange={() => setFormData({ ...formData, feedbackLanguage: 'zh-TW' })}
                      className="sr-only"
                    />
                    繁體中文詳細解析 (推薦)
                  </label>
                  <label
                    className={`flex-1 p-3 rounded-xl border text-center cursor-pointer transition text-xs font-bold ${
                      formData.feedbackLanguage === 'en'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="feedbackLanguage"
                      checked={formData.feedbackLanguage === 'en'}
                      onChange={() => setFormData({ ...formData, feedbackLanguage: 'en' })}
                      className="sr-only"
                    />
                    全英文考官解析 (Full English)
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  寫作評分示範紀錄
                </h4>
                <p className="text-xs text-stone-500 mb-3">
                  若您尚未在寫作練習室送出批改，可一鍵載入官方 Liz 標準的 Task 1 與 Task 2 示範評分紀錄，在 Dashboard 立即查看成績與平均分走勢。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onSeedSampleWriting) {
                      onSeedSampleWriting();
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 1200);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-xs font-bold text-stone-800 transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  載入官方 Liz 示範寫作紀錄
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                    同帳號跨裝置同步 (Cross-Device Sync)
                  </h4>
                </div>
                <p className="text-xs text-sky-800/80 mb-3">
                  當前裝置綁定同步代碼：<code className="px-1.5 py-0.5 rounded bg-white font-mono font-bold text-sky-950 border border-sky-200">{getSyncAccountId()}</code>。在其他手機或電腦輸入相同代碼，即可隨時雙向同步生字庫與成績。
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getSyncAccountId());
                      alert('已複製同步代碼：' + getSyncAccountId());
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white border border-sky-300 hover:bg-sky-100 text-xs font-bold text-sky-700 transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    複製同步代碼
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await performCrossDeviceSync();
                      alert('雲端資料同步完成！');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-bold text-white transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    立即雲端同步
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 mb-2">
                  重置與清理紀錄
                </h4>
                <p className="text-xs text-rose-700/80 mb-3">
                  若您希望重新開始計算寫作平均成績，可清空本機的所有寫作評分歷史紀錄。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('確定要清空所有的寫作歷史紀錄嗎？此動作無法復原。')) {
                      if (onClearWritingRecords) {
                        onClearWritingRecords();
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-rose-300 hover:bg-rose-100 text-xs font-bold text-rose-700 transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  清空寫作評分紀錄
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">個人檔案 (Profile)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-600 mb-1 block">稱呼 / 名稱</label>
                    <input
                      value={formData.profileName || ''}
                      onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-900 focus:outline-hidden"
                      placeholder="學員"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 mb-1 block">圖像網址 (URL)</label>
                    <input
                      value={formData.avatarUrl || ''}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-900 focus:outline-hidden"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={formData.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt="avatar preview"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-stone-200"
                  />
                  <span className="text-xs text-stone-500">頭像會出現在頂部狀態欄</span>
                </div>
              </div>

              {/* Account Sync Card */}
              <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                    跨裝置同帳號同步
                  </h4>
                </div>
                <p className="text-xs text-sky-800/80 mb-3">
                  您的同步帳號代碼：<code className="px-1.5 py-0.5 rounded bg-white font-mono font-bold text-sky-950 border border-sky-200">{getSyncAccountId()}</code>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getSyncAccountId());
                    alert('已複製同步代碼：' + getSyncAccountId());
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-sky-300 hover:bg-sky-100 text-xs font-bold text-sky-700 transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  複製代碼至其他裝置登入
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">快捷鍵 (Shortcuts)</h4>
                <ul className="text-sm text-stone-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white text-xs font-bold">Z</kbd>
                    <span>Zen Mode（專注模式，隱藏四周導航）</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white text-xs font-bold">Esc</kbd>
                    <span>關閉彈窗視窗 (Modal)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <kbd className="px-2 py-0.5 rounded bg-stone-900 text-white text-xs font-bold">Ctrl + S</kbd>
                    <span>快速儲存設定</span>
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-stone-200/70 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, zenMode: !formData.zenMode })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      formData.zenMode ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {formData.zenMode ? 'Zen Mode 已開啟' : '切換為 Zen Mode'}
                  </button>
                  <span className="text-xs text-stone-500">隨時按鍵盤 Z 鍵亦可無縫切換</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 transition cursor-pointer"
          >
            恢復預設值
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200/60 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  已儲存設定！
                </>
              ) : (
                '儲存通用設定'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
