import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Layers,
  Lightbulb,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import {
  IELTS_PARAGRAPH_PEEL_FORMULA,
  IELTS_PLANNING_STEPS,
  IELTS_TASK1_FATAL_TRAPS,
  IELTS_TASK1_PREPARATION_STEPS,
  IELTS_TASK1_VISUAL_TYPES,
  IELTS_TASK2_ESSAY_TYPES,
  Task1VisualTypeInfo,
  Task2EssayTypeInfo,
} from '../../data/ielts/ieltsLizMethodology';
import { WritingPromptTask } from '../../data/ielts/writingPrompts';

interface WritingGuideDrawerProps {
  task: WritingPromptTask;
  activeCategory: string;
  onClose: () => void;
}

type GuideTab = 'ideas' | 'vocab' | 'outline' | 'traps';

export const WritingGuideDrawer: React.FC<WritingGuideDrawerProps> = ({
  task,
  activeCategory,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('ideas');

  const currentTask1Info = IELTS_TASK1_VISUAL_TYPES.find((v) => v.id === activeCategory) || IELTS_TASK1_VISUAL_TYPES[0];
  const currentTask2Info = IELTS_TASK2_ESSAY_TYPES.find((e) => e.id === activeCategory) || IELTS_TASK2_ESSAY_TYPES[0];

  return (
    <section className="rounded-3xl border border-amber-300 dark:border-amber-800/80 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-md space-y-5 animate-fade-in text-stone-900 dark:text-stone-100">
      {/* Drawer Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 font-bold flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              雅思寫作全真指南與靈感庫
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                {task === 'task1' ? `Task 1 · ${currentTask1Info.titleZh}` : `Task 2 · ${currentTask2Info.titleZh}`}
              </span>
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              包含寫作方向發想 (Ideas)、同義反義詞庫 (Vocab)、擬定大綱 (Outline) 與避坑評分守則。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Sub-tabs */}
          <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('ideas')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ideas'
                  ? 'bg-amber-400 text-stone-950 shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              寫作方向發想 (Ideas)
            </button>
            <button
              onClick={() => setActiveTab('vocab')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'vocab'
                  ? 'bg-amber-400 text-stone-950 shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              字彙與正反義詞 (Vocab)
            </button>
            <button
              onClick={() => setActiveTab('outline')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'outline'
                  ? 'bg-amber-400 text-stone-950 shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              擬定大綱架構 (Outline)
            </button>
            <button
              onClick={() => setActiveTab('traps')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'traps'
                  ? 'bg-amber-400 text-stone-950 shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              評分標準與避坑 (Traps)
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition"
            title="關閉指南"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab 1: Ideas (寫作方向發想) */}
      {activeTab === 'ideas' && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              {task === 'task1' ? `【${currentTask1Info.titleZh}】核心發想思考角度` : `【${currentTask2Info.titleZh}】論點發想維度與靈感`}
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed mb-3">
              {task === 'task1' ? currentTask1Info.description : currentTask2Info.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(task === 'task1' ? currentTask1Info.brainstormingIdeas : currentTask2Info.brainstormingIdeas).map(
                (idea, idx) => (
                  <div key={idx} className="rounded-xl bg-white p-3 border border-amber-200/60 text-xs text-stone-800 flex items-start gap-2 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{idea}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* General Universal Brainstorming Framework */}
          {task === 'task2' && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                ★ 雅思大作文萬用發想維度 (Universal Brainstorming Dimensions)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-white p-3 border border-stone-200 space-y-1">
                  <p className="font-bold text-stone-900">1. 個人層面 (Individual)</p>
                  <p className="text-stone-600 leading-relaxed">
                    時間成本、經濟負擔、身心健康 (Mental & Physical Well-being)、職業競爭力、生活便利度。
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-stone-200 space-y-1">
                  <p className="font-bold text-stone-900">2. 社會與經濟 (Socio-Economic)</p>
                  <p className="text-stone-600 leading-relaxed">
                    公共稅收分配、就業市場衝擊、階級流動性 (Social Stratification)、犯罪率、傳統文化傳承。
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-stone-200 space-y-1">
                  <p className="font-bold text-stone-900">3. 宏觀與環境 (Global & Nature)</p>
                  <p className="text-stone-600 leading-relaxed">
                    碳排與氣候變遷、國際合作與交流、技術倫理規範 (AI / Automation)、不可逆的資源枯竭。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Vocab & Synonyms/Antonyms (詞彙與正反義詞) */}
      {activeTab === 'vocab' && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-2xl bg-indigo-50/50 border border-indigo-200/80 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              高分詞彙、搭配詞與正反義詞對照庫
            </h3>
            <p className="text-xs text-indigo-900 leading-relaxed mb-4">
              雅思 Lexical Resource 評分看重「同義詞替換 (Paraphrasing)」與「多樣性」。避免通篇使用 simple words，善用以下對照組：
            </p>

            <div className="space-y-3">
              {(task === 'task1' ? currentTask1Info.synonymAntonymPairs : currentTask2Info.synonymAntonymPairs).map(
                (group, idx) => (
                  <div key={idx} className="rounded-xl bg-white p-3.5 border border-indigo-100 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">{group.theme}</span>
                      <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Band 7.5+ Lexicon
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-emerald-50/70 p-2.5 border border-emerald-200/60 space-y-1">
                        <span className="text-[11px] font-bold text-emerald-900 block">✓ 同義詞群 (Synonyms / Alternatives)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {group.synonyms.map((s, sIdx) => (
                            <span key={sIdx} className="bg-white px-2 py-0.5 rounded-md font-mono text-[11px] text-emerald-950 border border-emerald-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg bg-rose-50/70 p-2.5 border border-rose-200/60 space-y-1">
                        <span className="text-[11px] font-bold text-rose-900 block">✗ 反義詞群 (Antonyms / Contrasts)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {group.antonyms.map((a, aIdx) => (
                            <span key={aIdx} className="bg-white px-2 py-0.5 rounded-md font-mono text-[11px] text-rose-950 border border-rose-200">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Useful Collocations */}
          <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 space-y-2">
            <h4 className="text-xs font-bold text-stone-800">
              {task === 'task1' ? '圖表核心表達動詞與短語' : '段落銜接與論證短語'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {task === 'task1'
                ? currentTask1Info.keyVocabulary.map((v, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs">
                      <p className="font-mono font-bold text-stone-900">{v.en}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">{v.zh}</p>
                    </div>
                  ))
                : currentTask2Info.sampleTemplatePhrases.flatMap((p) =>
                    p.phrases.map((phrase, idx) => (
                      <div key={idx} className="col-span-2 bg-white p-2.5 rounded-xl border border-stone-200 text-xs font-serif text-stone-800">
                        "{phrase}"
                      </div>
                    ))
                  )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Outline (擬定大綱架構) */}
      {activeTab === 'outline' && (
        <div className="space-y-4 animate-fade-in">
          {task === 'task1' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Task 1 標準四段報告大綱 (Academic Report Outline)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-white p-3.5 border border-emerald-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">1</span>
                      Introduction
                    </div>
                    <p className="font-bold text-stone-900">改寫題目背景</p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      用 1–2 句同義詞改寫題幹。說明圖表展示何種數據、對象、地區與時間區間。
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3.5 border border-emerald-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">2</span>
                      Overview
                    </div>
                    <p className="font-bold text-stone-900">總結 2-3 個主要特徵</p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      ★ 絕對不附任何具體數字！概括最高最低、整體走勢或最大差距。
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3.5 border border-emerald-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">3</span>
                      Body Paragraph 1
                    </div>
                    <p className="font-bold text-stone-900">第一組特徵與數據</p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      描述數值較高或呈現上升趨勢的類別，提供精確數據、起點與極值。
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3.5 border border-emerald-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">4</span>
                      Body Paragraph 2
                    </div>
                    <p className="font-bold text-stone-900">第二組特徵與對比</p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      描述其餘類別並進行對比（whereas, in contrast），分析交叉點與最終數值。
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <h4 className="text-xs font-bold text-stone-900 mb-2">
                  【{currentTask1Info.titleZh}】段落分組策略 (Grouping Rules)
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed">{currentTask1Info.bodyParagraphTips}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Task 2 5-min Planning Steps */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  開筆前 5 分鐘擬定大綱黃金三步驟
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {IELTS_PLANNING_STEPS.map((step, idx) => (
                    <div key={idx} className="rounded-xl bg-white p-3.5 border border-stone-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-amber-700 font-mono">{step.minute}</span>
                      <p className="font-bold text-stone-900">{step.titleZh}</p>
                      <p className="text-stone-600 text-[11px] leading-relaxed">{step.descZh}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task 2 Paragraph Structure & PEEL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    【{currentTask2Info.titleZh}】段落開展結構
                  </h4>
                  <div className="space-y-2.5">
                    {currentTask2Info.paragraphStructure.map((p, idx) => (
                      <div key={idx} className="rounded-xl bg-stone-50 p-2.5 text-xs space-y-0.5">
                        <span className="font-bold text-stone-900 text-[11px]">{p.paragraph}</span>
                        <p className="text-stone-800 font-semibold">{p.focus}</p>
                        <p className="text-stone-500 text-[11px]">{p.tips}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    PEEL 主體段黃金開展公式
                  </h4>
                  <p className="text-xs text-stone-600">確保每個主體段落論證紮實、邏輯嚴密：</p>
                  <div className="space-y-2">
                    {Object.values(IELTS_PARAGRAPH_PEEL_FORMULA).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded-xl bg-white p-2.5 text-xs border border-emerald-100 shadow-2xs">
                        <span className="w-5 h-5 rounded-md bg-stone-900 text-white font-black flex items-center justify-center shrink-0 text-[11px]">
                          {item.letter}
                        </span>
                        <div>
                          <p className="font-bold text-stone-900">{item.name}</p>
                          <p className="text-stone-600 text-[11px] leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Traps & Scoring Rules (評分標準與避坑) */}
      {activeTab === 'traps' && (
        <div className="space-y-4 animate-fade-in">
          {task === 'task1' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {IELTS_TASK1_FATAL_TRAPS.map((t, idx) => (
                <div key={idx} className="rounded-2xl bg-rose-50/60 border border-rose-200 p-4 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                    <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 text-[10px] flex items-center justify-center">!</span>
                    {t.trap}
                  </div>
                  <p className="text-rose-950 font-semibold text-[11px]">影響：{t.impact}</p>
                  <p className="text-emerald-800 font-medium text-[11px] pt-1 border-t border-rose-200/60">
                    解法：{t.solution}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                官方雅思大作文四大評分標準與考官扣分死穴
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white p-3 border border-stone-200 space-y-1">
                  <p className="font-bold text-stone-900">1. Task Response (任務回應 25%)</p>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    必須完整回應題幹所有問題。Introduction 立場與 Conclusion 立場不可前後矛盾；每段論點需具備完整解釋與實例。
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-stone-200 space-y-1">
                  <p className="font-bold text-stone-900">2. Coherence & Cohesion (連貫與銜接 25%)</p>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    切忌生硬堆砌過度連接詞 (overusing linkers)。段落之間必須有自然的邏輯推展，且每段有明確的主題句 (Topic Sentence)。
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-stone-200 space-y-1">
                  <p className="font-bold text-stone-900">3. Lexical Resource (詞彙豐富度 25%)</p>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    展示精確的高階學術搭配詞 (Collocations)。嚴格避免死背中式套話（如 "in modern society", "every coin has two sides"）。
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-stone-200 space-y-1">
                  <p className="font-bold text-stone-900">4. Grammatical Range & Accuracy (語法與準確度 25%)</p>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    靈活運用條件句、非限定關係子句、分詞構句與被動語態，並保持零主謂不一致與時態失誤。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
