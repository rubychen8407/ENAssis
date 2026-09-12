import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  BookOpen,
  Share2,
  Compass,
  Layers,
  ArrowRight,
  Split,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { VocabWord, WordMindMap } from '../types';
import { speakText } from '../utils/speech';

interface Props {
  word: VocabWord;
  onSelectRelatedWord?: (relatedWord: string) => void;
}

export const WordAssociationMindMap: React.FC<Props> = ({ word, onSelectRelatedWord }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'network' | 'cards'>('network');

  const mindMap: WordMindMap = word.mindMap || {
    derivatives: [
      { word: `${word.word}ly`, pos: 'adv.', meaningZh: '相應地' },
      { word: `${word.word}ness`, pos: 'n.', meaningZh: '狀態與性質' },
    ],
    synonyms: word.collocations?.slice(0, 3) || ['concept', 'term'],
    antonyms: [],
    collocations: word.collocations || [],
    rootFamily: [],
    thematicTopics: ['IELTS Academic', 'General Discourse'],
  };

  const hasContent =
    (mindMap.derivatives && mindMap.derivatives.length > 0) ||
    (mindMap.synonyms && mindMap.synonyms.length > 0) ||
    (mindMap.antonyms && mindMap.antonyms.length > 0) ||
    (mindMap.collocations && mindMap.collocations.length > 0) ||
    (mindMap.rootFamily && mindMap.rootFamily.length > 0);

  const categories = [
    {
      id: 'derivatives',
      title: '衍生詞族 (Word Family)',
      icon: '🌿',
      color: 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
      items: mindMap.derivatives?.map((d) => ({
        text: d.word,
        sub: d.pos,
        desc: d.meaningZh,
      })) || [],
    },
    {
      id: 'synonyms',
      title: '高頻近義詞 (Synonyms / 7+)',
      icon: '💡',
      color: 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-200',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
      items: mindMap.synonyms?.map((s) => ({ text: s, sub: '同義', desc: '' })) || [],
    },
    {
      id: 'antonyms',
      title: '反義對比 (Antonyms)',
      icon: '⚖️',
      color: 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-200',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
      items: mindMap.antonyms?.map((a) => ({ text: a, sub: '反義', desc: '' })) || [],
    },
    {
      id: 'collocations',
      title: '必背搭配詞 (Collocations)',
      icon: '🔗',
      color: 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
      items: (mindMap.collocations || word.collocations || []).slice(0, 6).map((c) => ({
        text: c,
        sub: '搭配',
        desc: '',
      })),
    },
    {
      id: 'rootFamily',
      title: '同根詞族 (Root Cognates)',
      icon: '🧬',
      color: 'border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:border-purple-700 dark:text-purple-200',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
      items: mindMap.rootFamily?.map((r) => ({ text: r.word, sub: '同源', desc: r.meaningZh })) || [],
    },
  ].filter((c) => c.items.length > 0);

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      {/* Mind map header */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Share2 className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              單字聯想關聯網絡 (Mind Map)
            </h4>
            <p className="text-[11px] text-stone-500">透過衍生詞、同反義詞與搭配網絡建立深刻記憶鏈</p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('network')}
            className={`px-2 py-1 rounded-md transition ${viewMode === 'network' ? 'bg-white text-stone-900 shadow-2xs dark:bg-stone-700 dark:text-stone-100' : 'text-stone-500'}`}
          >
            心智網絡
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-2 py-1 rounded-md transition ${viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs dark:bg-stone-700 dark:text-stone-100' : 'text-stone-500'}`}
          >
            分類卡片
          </button>
        </div>
      </div>

      {/* Network visualization */}
      {viewMode === 'network' ? (
        <div className="relative rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/50 p-4 overflow-hidden">
          {/* Central Target Word Hub */}
          <div className="flex justify-center mb-6">
            <div className="relative z-10 px-4 py-2.5 rounded-2xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-md flex items-center gap-2 border-2 border-amber-400">
              <span className="text-amber-400 font-bold text-xs">🎯 核心詞</span>
              <span className="font-bold text-sm tracking-tight">{word.word}</span>
              <span className="text-[11px] opacity-75 font-mono">{word.phonetic}</span>
              <button
                type="button"
                onClick={() => speakText(word.word)}
                className="p-1 rounded-lg hover:bg-white/20 dark:hover:bg-stone-800/20 cursor-pointer"
                title="發音"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Connected Branches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`p-3 rounded-xl border bg-white dark:bg-stone-900 transition shadow-2xs ${cat.color}`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold mb-2">
                  <span>{cat.icon}</span>
                  <span>{cat.title}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        speakText(item.text);
                        if (onSelectRelatedWord) onSelectRelatedWord(item.text);
                      }}
                      className="group inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium hover:border-stone-400 dark:hover:border-stone-500 cursor-pointer transition"
                      title="點擊聽發音"
                    >
                      <span className="text-stone-800 dark:text-stone-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        {item.text}
                      </span>
                      {item.sub && (
                        <span className="text-[10px] px-1 rounded bg-stone-200/70 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                          {item.sub}
                        </span>
                      )}
                      {item.desc && (
                        <span className="text-[10px] text-stone-400 dark:text-stone-500">
                          ({item.desc})
                        </span>
                      )}
                      <Volume2 className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {mindMap.thematicTopics && mindMap.thematicTopics.length > 0 && (
            <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> 雅思話題範疇：
              </span>
              {mindMap.thematicTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium"
                >
                  #{topic}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Categorized Cards Mode */
        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100">
                <span className="flex items-center gap-1.5">
                  <span>{cat.icon}</span> {cat.title}
                </span>
                <span className="text-[10px] font-semibold text-stone-400">
                  {cat.items.length} 個關聯詞
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {cat.items.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => speakText(item.text)}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-800 dark:text-stone-200">{item.text}</span>
                      {item.sub && (
                        <span className="text-[10px] px-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                          {item.sub}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {item.desc && <span className="text-[11px] text-stone-500">{item.desc}</span>}
                      <Volume2 className="w-3.5 h-3.5 text-stone-400 hover:text-stone-700" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
