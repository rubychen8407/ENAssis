import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MessageSquare,
  Coffee,
  Briefcase,
  GraduationCap,
  Globe,
  BrainCircuit,
  BookMarked,
  Check,
  Search,
  Dice5,
  Send,
} from 'lucide-react';
import { RoleplayScenario } from '../types';

export interface SpeakingScenarioCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  scenarios: RoleplayScenario[];
}

export const SPEAKING_SCENARIOS: RoleplayScenario[] = [
  // 1. 日常漫談與生活社交
  {
    id: 'daily-cafe',
    title: '咖啡館與日常生活漫談 (Cafe & Casual Talk)',
    category: 'Daily Life',
    description: '輕鬆自然的日常對話，練習生活點滴、週末計劃、個人嗜好與休閒話題。',
    aiPersona: 'Emma (Friendly Barista & Friend)',
    startingPrompt: '',
    suggestedVocab: ['spontaneous', 'subtle', 'unwind'],
  },
  {
    id: 'hobbies-passions',
    title: '興趣愛好與週末活動 (Hobbies & Leisure)',
    category: 'Daily Life',
    description: '分享音樂、電影、運動或烹飪心得，練習豐富細膩的個人情感與細節描述。',
    aiPersona: 'Emma (Curious Friend)',
    startingPrompt: '',
    suggestedVocab: ['passionate', 'fascinating', 'recreation'],
  },
  {
    id: 'food-dining',
    title: '美食探訪與飲食文化 (Food, Dining & Culinary)',
    category: 'Daily Life',
    description: '暢聊各國美食、私房餐廳推薦、家鄉菜餚與獨特料理體驗。',
    aiPersona: 'Emma (Food Enthusiast)',
    startingPrompt: '',
    suggestedVocab: ['delicacy', 'flavorful', 'authenticity'],
  },

  // 2. 雅思口說模擬
  {
    id: 'ielts-part1',
    title: '雅思 Part 1: 日常熱身與個人問答 (IELTS Part 1)',
    category: 'IELTS Speaking',
    description: '模擬雅思考試 Part 1 節奏，回答家鄉、工作、科技使用、交通等廣泛話題。',
    aiPersona: 'Emma (Supportive IELTS Coach)',
    startingPrompt: '',
    suggestedVocab: ['convenient', 'preferable', 'accustomed'],
  },
  {
    id: 'ielts-part2-story',
    title: '雅思 Part 2: 故事敘述與經歷描述 (IELTS Part 2 Cue Card)',
    category: 'IELTS Speaking',
    description: '練習連貫陳述個人難忘經歷、重要人物、喜愛的城市或克服挑戰的故事。',
    aiPersona: 'Emma (IELTS Speaking Mentor)',
    startingPrompt: '',
    suggestedVocab: ['memorable', 'significant', 'transformative'],
  },
  {
    id: 'ielts-part3-discussion',
    title: '雅思 Part 3: 抽象深度探討 (IELTS Part 3 In-depth)',
    category: 'IELTS Speaking',
    description: '挑戰高分思辨，探討社會趨勢、環境保護、教育科技等抽象與全球性議題。',
    aiPersona: 'Emma (Academic Discussion Partner)',
    startingPrompt: '',
    suggestedVocab: ['perspective', 'consequence', 'sustainable'],
  },

  // 3. 職場與商務
  {
    id: 'job-interview',
    title: '職場商務與求職面試 (Career & Job Interview)',
    category: 'Career',
    description: '模擬外商面試與專業自我介紹，練習應對專案挑戰、領導力與團隊合作。',
    aiPersona: 'Emma (Senior Interviewer)',
    startingPrompt: '',
    suggestedVocab: ['articulate', 'comprehend', 'collaborate'],
  },
  {
    id: 'workplace-meeting',
    title: '商務會議與專案討論 (Business Meeting & Collaboration)',
    category: 'Career',
    description: '練習在跨國會議中提議想法、溝通進度、協商資源與達成共識。',
    aiPersona: 'Emma (Project Partner)',
    startingPrompt: '',
    suggestedVocab: ['timeline', 'prioritize', 'feasibility'],
  },

  // 4. 旅行與異國文化
  {
    id: 'travel-adventures',
    title: '旅行回憶與異國探索 (Travel & Global Adventures)',
    category: 'Travel & Culture',
    description: '聊聊去過的城市、文化衝擊、獨自旅行趣事或未來夢想景點。',
    aiPersona: 'Emma (Globetrotter)',
    startingPrompt: '',
    suggestedVocab: ['breathtaking', 'hospitality', 'itinerary'],
  },
  {
    id: 'cultural-differences',
    title: '跨文化交流與生活習慣 (Cross-cultural Insights)',
    category: 'Travel & Culture',
    description: '探討東西方文化差異、社交禮儀、節慶習俗與生活節奏。',
    aiPersona: 'Emma (Cultural Explorer)',
    startingPrompt: '',
    suggestedVocab: ['tradition', 'diversity', 'adaptation'],
  },

  // 5. 深度觀點與哲思
  {
    id: 'opinions-debate',
    title: '深度觀點與科技思辨 (In-depth Thoughts & AI Trends)',
    category: 'Philosophy & Tech',
    description: '探討人工智慧、社群媒體、遠端工作與未來生活型態的利弊得失。',
    aiPersona: 'Emma (Thoughtful Discussion Partner)',
    startingPrompt: '',
    suggestedVocab: ['perspective', 'articulate', 'spontaneous'],
  },
  {
    id: 'life-philosophy',
    title: '生活態度與心靈成長 (Mindset, Growth & Happiness)',
    category: 'Philosophy & Tech',
    description: '探討工作生活平衡、壓力調適、人生重要轉折點與自我實現。',
    aiPersona: 'Emma (Mindful Coach)',
    startingPrompt: '',
    suggestedVocab: ['resilience', 'fulfillment', 'mindfulness'],
  },

  // 6. 生字庫活用
  {
    id: 'vocab-practice',
    title: '我的生字庫專屬口說實戰 (My Vocabulary Talk)',
    category: 'Vocabulary Immersion',
    description: '專門針對您個人儲存的生字，AI 特別設計日常對話讓您在口說中自然說出來。',
    aiPersona: 'Emma (Vocabulary Coach)',
    startingPrompt: '',
    suggestedVocab: [],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentScenario: RoleplayScenario;
  onSelectScenario: (scenario: RoleplayScenario, customTopic?: string) => void;
  onSurpriseTopic: () => void;
}

export const SpeakingScenarioModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentScenario,
  onSelectScenario,
  onSurpriseTopic,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customTopicInput, setCustomTopicInput] = useState<string>('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: '全部話題', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'Daily Life', label: '日常社交', icon: <Coffee className="w-3.5 h-3.5" /> },
    { id: 'IELTS Speaking', label: '雅思模擬', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'Career', label: '職場商務', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'Travel & Culture', label: '旅行文化', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'Philosophy & Tech', label: '深度思辨', icon: <BrainCircuit className="w-3.5 h-3.5" /> },
    { id: 'Vocabulary Immersion', label: '生字實戰', icon: <BookMarked className="w-3.5 h-3.5" /> },
  ];

  const filteredScenarios = SPEAKING_SCENARIOS.filter((sc) => {
    const matchesCategory = activeCategory === 'all' || sc.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      sc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCustomTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicInput.trim()) return;
    const customScenario: RoleplayScenario = {
      id: `custom_${Date.now()}`,
      title: `自訂話題: ${customTopicInput.trim()}`,
      category: 'Custom Topic',
      description: `圍繞「${customTopicInput.trim()}」展開的專屬對話練習。`,
      aiPersona: 'Emma (Encouraging Partner)',
      startingPrompt: '',
      suggestedVocab: [],
    };
    onSelectScenario(customScenario, customTopicInput.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="speaking-scenario-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 id="speaking-scenario-modal-title" className="text-base font-bold text-stone-900 dark:text-stone-100">
                選擇口說練習情境與話題
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                每次練習均自動生成全新啟發性開場問答，告別重複題目
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Surprise Topic Quick Action Banner */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>不知道聊什麼？讓 AI 推薦一個令人驚喜的開場話題！</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onSurpriseTopic();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Dice5 className="w-3.5 h-3.5" />
            隨機換個新話題
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋話題或情境關鍵字 (如：雅思、咖啡、面試、旅行)..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scenarios List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[420px]">
          {filteredScenarios.map((sc) => {
            const isSelected = currentScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  onSelectScenario(sc);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-stone-900 dark:border-stone-100 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-md'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">{sc.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isSelected
                          ? 'bg-white/20 text-white dark:bg-stone-900/20 dark:text-stone-900'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {sc.category}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed line-clamp-2 ${
                      isSelected ? 'text-stone-200 dark:text-stone-700' : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {sc.description}
                  </p>
                </div>

                <div className="shrink-0 mt-0.5">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-white text-stone-900 dark:bg-stone-900 dark:text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-stone-300 dark:border-stone-600" />
                  )}
                </div>
              </button>
            );
          })}

          {filteredScenarios.length === 0 && (
            <div className="py-8 text-center text-stone-400 text-xs">
              沒有找到符合的話題，您可以嘗試輸入自訂話題直接開始！
            </div>
          )}
        </div>

        {/* Custom Topic Input Section */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
          <form onSubmit={handleCustomTopicSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              placeholder="輸入任何您想聊的自訂主題 (如：宇宙太空、馬拉松訓練、AI藝術)..."
              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
            />
            <button
              type="submit"
              disabled={!customTopicInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white disabled:opacity-40 transition cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              開聊此主題
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
