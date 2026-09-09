import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
  Download,
  Filter,
  Check,
  RotateCcw,
  BookOpen,
  FileText,
  Layers,
} from 'lucide-react';
import { IELTSMistakeItem, IELTSRecord } from '../../types/ielts';
import {
  getIELTSMistakes,
  removeIELTSMistake,
  clearAllIELTSMistakes,
  getIELTSRecords,
  exportIELTSPracticeReportMarkdown,
} from '../../utils/ielts';

interface Props {
  onSelectExamForPractice?: (examId: string) => void;
}

export const IELTSMistakeNotebook: React.FC<Props> = ({ onSelectExamForPractice }) => {
  const [mistakes, setMistakes] = useState<IELTSMistakeItem[]>([]);
  const [records, setRecords] = useState<IELTSRecord[]>([]);
  const [filterKind, setFilterKind] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMistakes(getIELTSMistakes());
    setRecords(getIELTSRecords());
  }, []);

  const handleRemove = (examId: string, qId: string) => {
    removeIELTSMistake(examId, qId);
    setMistakes((prev) => prev.filter((m) => !(m.examId === examId && m.questionId === qId)));
  };

  const handleClearAll = () => {
    if (window.confirm('確定要清空所有錯題記錄嗎？')) {
      clearAllIELTSMistakes();
      setMistakes([]);
    }
  };

  const handleExportMarkdown = () => {
    const md = exportIELTSPracticeReportMarkdown(records, mistakes);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IELTS_Practice_Report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      records,
      mistakes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IELTS_Data_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Re-practice check
  const handleCheckRePractice = (item: IELTSMistakeItem) => {
    const ans = (practiceAnswers[item.id] || '').trim().toLowerCase();
    const standard = (item.correctAnswer || '').trim().toLowerCase();
    const isCorrect = ans === standard || ans.replace(/\s+/g, '') === standard.replace(/\s+/g, '');
    setPracticeFeedback((prev) => ({ ...prev, [item.id]: isCorrect }));

    if (isCorrect) {
      setTimeout(() => {
        handleRemove(item.examId, item.questionId);
      }, 1200);
    }
  };

  const filteredMistakes = mistakes.filter((m) => {
    if (filterKind === 'all') return true;
    return (m.kind || '').toLowerCase().includes(filterKind.toLowerCase());
  });

  return (
    <div className="space-y-6" id="ielts-mistake-notebook">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                雅思盲點消滅庫
              </span>
              <span className="text-xs text-stone-500 font-mono">
                未掌握錯題: {mistakes.length} 題
              </span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              雅思模考錯題本與題型分析 (Mistake Notebook)
            </h2>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl">
              在每次全真模考或背題練習後，系統會自動歸納做錯的題目。在此可重練、查看考點定位並將已掌握的錯題移出。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition flex items-center gap-1.5 cursor-pointer"
              title="導出為 Markdown 備考報告"
            >
              <Download className="w-3.5 h-3.5" />
              導出 Markdown 報告
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition flex items-center gap-1.5 cursor-pointer"
              title="備份練習數據為 JSON"
            >
              <FileText className="w-3.5 h-3.5" />
              備份 JSON
            </button>

            {mistakes.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空錯題
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Kind Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-stone-400 font-medium whitespace-nowrap pl-1">題型篩選:</span>
        {[
          { id: 'all', label: '全部題型' },
          { id: 'matching', label: '配對題 (Matching)' },
          { id: 'true_false', label: 'T / F / NG' },
          { id: 'single_choice', label: '單選題 (Choice)' },
          { id: 'completion', label: '填空題 (Completion)' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterKind(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterKind === f.id
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Mistakes List */}
      {filteredMistakes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-2xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">太棒了！目前沒有未解決的錯題</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            進行全真模考時若有答錯的題目，會自動收集於此處供您反覆精練與攻克盲點。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((item) => {
            const isExpanded = expandedId === item.id;
            const currentFeedback = practiceFeedback[item.id];

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs hover:border-stone-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 text-xs font-mono font-bold flex items-center justify-center">
                      Q{item.questionNumber}
                    </span>
                    <span className="font-bold text-stone-900 text-xs truncate max-w-sm">
                      {item.examTitle}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                      {item.kind}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <span>記錄於 {item.date}</span>
                    <button
                      onClick={() => handleRemove(item.examId, item.questionId)}
                      className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="已掌握，移除錯題"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Answers Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-rose-900">
                    <span className="text-[10px] font-bold uppercase text-rose-500 block mb-0.5">
                      您當時的作答:
                    </span>
                    <span className="font-mono font-bold text-sm">
                      {item.userAnswer || '(未填答)'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-900">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-0.5">
                      官方標準答案:
                    </span>
                    <span className="font-mono font-bold text-sm">{item.correctAnswer}</span>
                  </div>
                </div>

                {/* Quick Re-Practice Input */}
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row items-center gap-2">
                  <span className="text-xs font-semibold text-stone-700 whitespace-nowrap">
                    盲點重測：
                  </span>
                  <input
                    type="text"
                    value={practiceAnswers[item.id] || ''}
                    onChange={(e) =>
                      setPracticeAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="輸入正確答案進行重練..."
                    className="flex-1 w-full px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition"
                  />
                  <button
                    onClick={() => handleCheckRePractice(item)}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
                  >
                    驗證答案
                  </button>

                  {currentFeedback !== undefined && (
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        currentFeedback
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {currentFeedback ? '✓ 正確！已消除該盲點' : '✗ 仍不正確，請看詳解'}
                    </span>
                  )}
                </div>

                {/* Explanation accordion */}
                <div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="text-xs text-stone-600 hover:text-stone-900 font-semibold underline flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                    {isExpanded ? '收起考點精析' : '展開官方考點精析與原文定位'}
                  </button>

                  {isExpanded && item.explanation && (
                    <div className="mt-2.5 p-4 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                      {item.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
