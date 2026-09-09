export type IELTSResourceCategory = 'listening' | 'reading' | 'writing' | 'speaking' | 'vocabulary';

export interface IELTSResource {
  id: string;
  title: string;
  category: IELTSResourceCategory;
  description: string;
  url: string;
  source: string;
}

export interface IELTSPdfResource {
  id: string;
  title: string;
  category: 'reading' | 'listening' | 'writing' | 'other';
  path: string;
  url: string;
}

/** Curated links imported from zeeklog/IELTS (Awesome IELTS Resources). */
export const ZEEKLOG_IELTS_RESOURCES: IELTSResource[] = [
  {
    id: 'british-council-listening',
    title: 'British Council Listening Practice',
    category: 'listening',
    description: '官方免費聽力練習與題型資源。',
    url: 'https://takeielts.britishcouncil.org/prepare-your-test/free-ielts-practice-tests/listening-practice-test-1',
    source: 'zeeklog/IELTS',
  },
  {
    id: 'ielts-org-sample-tests',
    title: 'IELTS.org Sample Test Questions',
    category: 'listening',
    description: 'IELTS 官方樣題與考試格式說明。',
    url: 'https://www.ielts.org/about-the-test/sample-test-questions',
    source: 'zeeklog/IELTS',
  },
  {
    id: 'ielts-up-reading',
    title: 'IELTS Up Reading Tests',
    category: 'reading',
    description: '閱讀篇章與題型練習，適合限時訓練。',
    url: 'http://ielts-up.com/reading/ielts-reading-test.html',
    source: 'zeeklog/IELTS',
  },
  {
    id: 'ielts-up-writing',
    title: 'IELTS Up Writing Exercises',
    category: 'writing',
    description: 'Task 1 與 Task 2 寫作練習題與題型整理。',
    url: 'http://ielts-up.com/exercises/ielts-writing-exercises.html',
    source: 'zeeklog/IELTS',
  },
  {
    id: 'ielts-6-to-9-writing',
    title: 'IELTS 6 to 9',
    category: 'writing',
    description: '寫作與整體備考技巧、範例及策略。',
    url: 'https://ielts69.com/',
    source: 'zeeklog/IELTS',
  },
  {
    id: 'mini-ielts-writing',
    title: 'Mini IELTS',
    category: 'writing',
    description: '提供多科 IELTS 題型練習與線上測驗。',
    url: 'http://mini-ielts.com/',
    source: 'zeeklog/IELTS',
  },
  {
    id: 'verbling-speaking',
    title: 'Verbling Speaking Practice',
    category: 'speaking',
    description: '尋找線上語言教師與口說練習。',
    url: 'https://www.verbling.com/',
    source: 'zeeklog/IELTS',
  },
  {
    id: 'speaking-ielts',
    title: 'SpeakingIELTS.com',
    category: 'speaking',
    description: '口說模擬與 IELTS 口說練習資源。',
    url: 'http://www.speakingielts.com/',
    source: 'zeeklog/IELTS',
  },
  {
    id: 'quizlet-vocabulary',
    title: 'Quizlet Vocabulary',
    category: 'vocabulary',
    description: '使用字卡與測驗建立 IELTS 詞彙複習集。',
    url: 'https://quizlet.com/',
    source: 'zeeklog/IELTS',
  },
  {
    id: 'forvo-pronunciation',
    title: 'Forvo Pronunciation',
    category: 'vocabulary',
    description: '查詢不同母語者的單字發音。',
    url: 'http://forvo.com/',
    source: 'zeeklog/IELTS',
  },
];

const ZEEKLOG_REPO_RAW_BASE = 'https://raw.githubusercontent.com/zeeklog/IELTS/master/';

const TITLE_ZH_TRADITIONAL_MAP: Record<string, string> = {
  '剑桥雅思真题4': '劍橋雅思真題 4',
  '剑桥雅思真题5': '劍橋雅思真題 5',
  '剑桥雅思真题6': '劍橋雅思真題 6',
  '剑桥雅思真题7': '劍橋雅思真題 7',
  '剑桥雅思真题8': '劍橋雅思真題 8',
  '剑桥雅思真题9': '劍橋雅思真題 9',
  '剑桥雅思真题10': '劍橋雅思真題 10',
  '剑桥雅思真题11': '劍橋雅思真題 11',
  '剑桥雅思真题12': '劍橋雅思真題 12',
  '剑桥雅思真题13': '劍橋雅思真題 13',
  '剑桥雅思真题14': '劍橋雅思真題 14',
  '剑桥雅思真题15': '劍橋雅思真題 15',
  '剑桥雅思真题16': '劍橋雅思真題 16',
  '剑桥雅思真题17': '劍橋雅思真題 17',
  '剑桥雅思真题18': '劍橋雅思真題 18',
  '4周攻克雅思听力': '4 週攻克雅思聽力',
  '剑桥雅思听力考点词': '劍橋雅思聽力考點詞',
  '雅思听力词汇小伴侣': '雅思聽力詞彙小伴侶',
  '雅思词汇精讲-听力': '雅思詞彙精講 - 聽力篇',
  '2022年1-4月大作文真题范文': '2022 年 1-4 月大作文真題範文',
  '7周突破雅思写作7分-杨凡': '7 週突破雅思寫作 7 分 - 楊凡',
  'Ideas-for-IELTS-Topics': 'Ideas for IELTS Topics (論點素材庫)',
  '剑桥图表题大全': '劍橋圖表題大全 (Task 1 題庫)',
  '剑桥雅思写作高分范文': '劍橋雅思寫作高分範文',
  '过雅思写作6.5': '過雅思寫作 6.5 分指南',
  '雅思写作7分288词': '雅思寫作 7 分核心 288 詞',
  '雅思写作7范文': '雅思寫作 7 分範文合輯',
  '雅思写作真经': '雅思寫作真經精選',
  '雅思写作词汇': '雅思寫作必備詞彙',
  '黑眼睛雅思写作教程': '黑眼睛雅思寫作教程',
  'IELTS16_体验版': 'IELTS 16 體驗版',
};

function createPdfResource(path: string, category: IELTSPdfResource['category']): IELTSPdfResource {
  const fileName = path.split('/').pop() || path;
  const baseName = fileName.replace(/\.pdf$/i, '');
  const displayTitle = TITLE_ZH_TRADITIONAL_MAP[baseName] || baseName;
  const encodedPath = path.split('/').map((part) => encodeURIComponent(part)).join('/');
  return {
    id: `zeeklog-pdf-${path}`,
    title: displayTitle,
    category,
    path,
    url: `${ZEEKLOG_REPO_RAW_BASE}${encodedPath}`,
  };
}

/** PDF files indexed by zeeklog/IELTS/path.json (31 files). */
export const ZEEKLOG_IELTS_PDFS: IELTSPdfResource[] = [
  ...[
    '剑桥雅思真题4.pdf',
    '剑桥雅思真题5.pdf',
    '剑桥雅思真题6.pdf',
    '剑桥雅思真题7.pdf',
    '剑桥雅思真题8.pdf',
    '剑桥雅思真题9.pdf',
    '剑桥雅思真题10.pdf',
    '剑桥雅思真题11.pdf',
    '剑桥雅思真题12.pdf',
    '剑桥雅思真题13.pdf',
    '剑桥雅思真题14.pdf',
    '剑桥雅思真题15.pdf',
    '剑桥雅思真题16.pdf',
    '剑桥雅思真题17.pdf',
    '剑桥雅思真题18.pdf',
  ].map((path) => createPdfResource(path, 'reading')),
  ...[
    '雅思听力资料/4周攻克雅思听力.pdf',
    '雅思听力资料/剑桥雅思听力考点词.pdf',
    '雅思听力资料/雅思听力词汇小伴侣.pdf',
    '雅思听力资料/雅思词汇精讲-听力.pdf',
  ].map((path) => createPdfResource(path, 'listening')),
  ...[
    '雅思作文资料/2022年1-4月大作文真题范文.pdf',
    '雅思作文资料/7周突破雅思写作7分-杨凡.pdf',
    '雅思作文资料/Ideas-for-IELTS-Topics.pdf',
    '雅思作文资料/剑桥图表题大全.pdf',
    '雅思作文资料/剑桥雅思写作高分范文.pdf',
    '雅思作文资料/过雅思写作6.5.pdf',
    '雅思作文资料/雅思写作7分288词.pdf',
    '雅思作文资料/雅思写作7范文.pdf',
    '雅思作文资料/雅思写作真经.pdf',
    '雅思作文资料/雅思写作词汇.pdf',
    '雅思作文资料/黑眼睛雅思写作教程.pdf',
  ].map((path) => createPdfResource(path, 'writing')),
  createPdfResource('IELTS16_体验版.pdf', 'other'),
];
