import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Sparkles,
  Zap,
  Filter,
  Plus,
  Upload,
  BarChart3,
  BookmarkCheck,
  Compass,
} from 'lucide-react';
import { IELTSExam, IELTSRecord, IELTSMistakeItem } from '../../types/ielts';
import { INITIAL_IELTS_EXAMS } from '../../data/ielts/curatedExams';
import { getIELTSRecords, getIELTSMistakes, getCustomExams, saveCustomExam } from '../../utils/ielts';
import { IELTSExamArena } from './IELTSExamArena';
import { IELTSFlashStudy } from './IELTSFlashStudy';
import { IELTSVocabExplorer } from './IELTSVocabExplorer';
import { IELTSMistakeNotebook } from './IELTSMistakeNotebook';

interface Props {
  onWordAdded?: () => void;
}

export const IELTSPracticeHub: React.FC<Props> = ({ onWordAdded }) => {
  // Navigation tabs inside IELTS hub
  const [activeTab, setActiveTab] = useState<'bank' | 'arena' | 'flash' | 'vocab' | 'mistakes'>('bank');

  // Exam list & selection
  const [exams, setExams] = useState<IELTSExam[]>(INITIAL_IELTS_EXAMS);
  const [selectedExamId, setSelectedExamId] = useState<string>(INITIAL_IELTS_EXAMS[0].id);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'P1' | 'P2' | 'P3'>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | '高频' | '中频'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Records and statistics
  const [records, setRecords] = useState<IELTSRecord[]>([]);
  const [mistakes, setMistakes] = useState<IELTSMistakeItem[]>([]);

  // Custom exam import modal
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  // Refresh data on mount and tab switch
  const refreshData = () => {
    const recs = getIELTSRecords();
    const mists = getIELTSMistakes();
    const customs = getCustomExams();
    setRecords(recs);
    setMistakes(mists);

    // Merge built-in curated exams with custom saved exams
    const merged = [...INITIAL_IELTS_EXAMS];
    customs.forEach((c) => {
      if (!merged.find((e) => e.id === c.id)) {
        merged.unshift(c);
      }
    });
    setExams(merged);
  };

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  // Current selected exam object
  const currentExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId) || exams[0];
  }, [exams, selectedExamId]);

  // High level stats
  const stats = useMemo(() => {
    const totalPracticed = records.length;
    const avgBand =
      totalPracticed > 0
        ? (records.reduce((sum, r) => sum + r.bandScore, 0) / totalPracticed).toFixed(1)
        : '0.0';
    const totalMistakes = mistakes.length;
    return { totalPracticed, avgBand, totalMistakes };
  }, [records, mistakes]);

  // Filtered exams list
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (frequencyFilter !== 'all' && e.frequency !== frequencyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return e.title.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [exams, categoryFilter, frequencyFilter, searchQuery]);

  // Start Mock Arena for an exam
  const handleStartExam = (examId: string) => {
    setSelectedExamId(examId);
    setActiveTab('arena');
  };

  // Start Flash Explanations for an exam
  const handleStartFlash = (examId: string) => {
    setSelectedExamId(examId);
    setActiveTab('flash');
  };

  // Import custom exam JSON
  const handleImportCustomExam = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importJsonText);
      if (!parsed.id || !parsed.title || !parsed.passageHtml || !parsed.answerKey) {
        throw new Error('JSON 格式缺少必要欄位 (id, title, passageHtml, answerKey)');
      }
      saveCustomExam(parsed);
      refreshData();
      setSelectedExamId(parsed.id);
      setShowImportModal(false);
      setImportJsonText('');
      alert(`成功導入試卷：${parsed.title}！`);
    } catch (err: any) {
      setImportError(err.message || '無法解析該 JSON 試卷檔案');
    }
  };

  return (
    <div className="space-y-6" id="ielts-practice-hub">
      {/* Top IELTS Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-serif font-black text-lg shadow-2xs">
              雅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-stone-900 tracking-tight">
                  雅思全真題庫與模考系統 (IELTS Practice Suite)
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-stone-500">
                源自 IELTS-practice 官方真題庫架構：含 P1/P2/P3 閱讀全真模考、背題定位精析、3,610 核心高頻詞庫與錯題本
              </p>
            </div>
          </div>

          {/* IELTS Sub-Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              id="tab-ielts-bank"
              onClick={() => setActiveTab('bank')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'bank'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              真題題庫
            </button>

            <button
              id="tab-ielts-arena"
              onClick={() => setActiveTab('arena')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'arena'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              全真模考
            </button>

            <button
              id="tab-ielts-flash"
              onClick={() => setActiveTab('flash')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'flash'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              背題定位
            </button>

            <button
              id="tab-ielts-vocab"
              onClick={() => setActiveTab('vocab')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'vocab'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              3,600+ 核心詞庫
            </button>

            <button
              id="tab-ielts-mistakes"
              onClick={() => setActiveTab('mistakes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap relative ${
                activeTab === 'mistakes'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              錯題本
              {stats.totalMistakes > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                  {stats.totalMistakes}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-stone-100 text-stone-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">題庫收錄篇目</span>
              <span className="text-sm font-bold text-stone-900">{exams.length} 篇真題</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">已練習篇數</span>
              <span className="text-sm font-bold text-stone-900">
                {stats.totalPracticed} 篇模考
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">平均預估雅思成績</span>
              <span className="text-sm font-bold text-stone-900">
                {stats.totalPracticed > 0 ? `Band ${stats.avgBand}` : '尚未測驗'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">累積需突破錯題</span>
              <span className="text-sm font-bold text-rose-700">{stats.totalMistakes} 題</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Content Views */}
      {activeTab === 'arena' ? (
        <IELTSExamArena
          exam={currentExam}
          onBackToBank={() => setActiveTab('bank')}
          onViewFlashExplanations={() => setActiveTab('flash')}
          onWordAdded={onWordAdded}
        />
      ) : activeTab === 'flash' ? (
        <IELTSFlashStudy
          exam={currentExam}
          onBackToArena={() => setActiveTab('arena')}
          onBackToBank={() => setActiveTab('bank')}
          onWordAdded={onWordAdded}
        />
      ) : activeTab === 'vocab' ? (
        <IELTSVocabExplorer onWordAdded={onWordAdded} />
      ) : activeTab === 'mistakes' ? (
        <IELTSMistakeNotebook onSelectExamForPractice={handleStartExam} />
      ) : (
        /* BANK VIEW: Browse Exams */
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-ielts-exam-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋真題標題（例如 Tea, Music, Plastics, Hook）..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {/* Category selector */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                {(['all', 'P1', 'P2', 'P3'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {cat === 'all' ? '全部題型' : cat}
                  </button>
                ))}
              </div>

              {/* Frequency selector */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                {(['all', '高频', '中频'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setFrequencyFilter(freq)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      frequencyFilter === freq
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {freq === 'all' ? '全部考頻' : freq}
                  </button>
                ))}
              </div>

              {/* Import custom exam button */}
              <button
                id="btn-open-import-exam"
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> 匯入真題
              </button>
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam) => {
              const bestRecord = records.find((r) => r.examId === exam.id);
              const qCount = Object.keys(exam.answerKey || {}).length;

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs hover:shadow-xs hover:border-stone-300 transition flex flex-col justify-between"
                >
                  <div>
                    {/* Tags */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-900 text-white font-mono">
                          {exam.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {exam.frequency}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-stone-500 font-mono">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>20 min</span>
                      </div>
                    </div>

                    <h3 className="text-base font-serif font-bold text-stone-900 tracking-tight line-clamp-2">
                      {exam.title}
                    </h3>

                    <div className="mt-2.5 flex items-center gap-3 text-xs text-stone-500">
                      <span>題數：{qCount} 題</span>
                      <span>•</span>
                      <span>難度：{'★'.repeat(Math.round(exam.difficultyScore || 3))}</span>
                    </div>

                    {/* Best record badge if tested */}
                    {bestRecord && (
                      <div className="mt-3 p-2 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
                        <span className="flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 已完成測驗
                        </span>
                        <span className="font-mono font-bold">
                          Band {bestRecord.bandScore.toFixed(1)} ({bestRecord.score}/{bestRecord.totalQuestions})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center gap-2">
                    <button
                      id={`btn-exam-mock-${exam.id}`}
                      onClick={() => handleStartExam(exam.id)}
                      className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      全真模考
                    </button>

                    <button
                      id={`btn-exam-flash-${exam.id}`}
                      onClick={() => handleStartFlash(exam.id)}
                      className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Compass className="w-3.5 h-3.5 text-stone-600" />
                      背題精析
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import Custom Exam Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-stone-700" />
                <h3 className="font-bold text-base text-stone-900">匯入雅思真題 JSON 試卷</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
              >
                關閉
              </button>
            </div>

            <p className="text-xs text-stone-600 mt-3 leading-relaxed">
              貼上符合 IELTS-practice 格式的 JSON 試卷對象（包含 id, title, category, passageHtml,
              questionGroups, answerKey 等）：
            </p>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="貼上試卷 JSON 字串..."
              className="w-full h-48 mt-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 resize-none"
            />

            {importError && (
              <p className="text-xs text-rose-600 mt-2 font-semibold">{importError}</p>
            )}

            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleImportCustomExam}
                disabled={!importJsonText.trim()}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                確認導入試卷
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
