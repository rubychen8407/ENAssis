import {
  IELTSRecord,
  IELTSMistakeItem,
  IELTSExam,
  IELTSWritingRecord,
  IELTSSpeakingRecord,
  IELTSListeningRecord,
  IELTSFourSkillsSummary,
  GeneralSettings,
} from '../types/ielts';

const IELTS_RECORDS_KEY = 'linguacraft_ielts_records_v1';
const IELTS_MISTAKES_KEY = 'linguacraft_ielts_mistakes_v1';
const IELTS_CUSTOM_EXAMS_KEY = 'linguacraft_ielts_custom_exams_v1';
const IELTS_WRITING_RECORDS_KEY = 'linguacraft_ielts_writing_records_v1';
const IELTS_SPEAKING_RECORDS_KEY = 'linguacraft_ielts_speaking_records_v1';
const IELTS_LISTENING_RECORDS_KEY = 'linguacraft_ielts_listening_records_v1';
const GENERAL_SETTINGS_KEY = 'linguacraft_general_settings_v1';

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  targetOverallBand: 7.0,
  targetScores: {
    listening: 7.5,
    reading: 7.5,
    writing: 7.0,
    speaking: 6.5,
  },
  currentScores: {
    listening: 7.0,
    reading: 7.0,
    writing: 6.5,
    speaking: 6.5,
  },
  scoreCalculationMode: 'auto',
  examDate: '',
  dailyVocabGoal: 15,
  weeklyWritingGoal: 3,
  feedbackLanguage: 'zh-TW',
  examinerStrictness: 'strict_liz',
  studyPlanTitle: '雅思 7.0+ 衝刺計劃',
};

export const INITIAL_SAMPLE_WRITING_RECORDS: IELTSWritingRecord[] = [
  {
    id: 'sample_write_1',
    timestamp: Date.now() - 86400000 * 2,
    date: '2026/03/07 14:20',
    task: 'task2',
    promptId: 'task2-opinion-practice',
    promptTitle: 'University Education: Free for Everyone vs. Student Funded',
    lizCategory: 'Opinion / Agree or Disagree',
    overallBand: 7.0,
    targetBand: 7.0,
    criteriaScores: {
      taskResponse: 7.0,
      coherenceCohesion: 7.0,
      lexicalResource: 7.0,
      grammar: 6.5,
    },
    criteriaFeedback: {
      taskResponse: '立場自始至終明確，回應了題目所有要求，兩大論點論證具體。',
      coherenceCohesion: '段落間轉折自然，PEEL 結構清晰，無過度堆砌模板詞。',
      lexicalResource: '運用了「higher education accessibility」、「fiscal allocation」等精準學術詞彙。',
      grammar: '複合句運用得當，少數關係代名詞與介系詞搭配微瑕，但不影響理解。',
    },
    wordCount: 284,
    timeSpentSeconds: 2100,
    generalFeedbackZh: '這是一篇架構非常扎實的 Band 7.0 Task 2 佳作。立場明確，論點拓展充分，完全符合 IELTS Liz 的論證要求。下一步請微調文法多樣性，力求邁向 7.5。',
    strengths: ['明確提出 Thesis Statement 並在各段貫徹', '避免空泛模板套話，直切論點核心', 'PEEL 結構非常鮮明'],
    weaknesses: ['GRA 需增加更多非限定關係子句與分詞構句以衝擊 7.5+'],
    ieltsActionPlan: ['在 Body 段落第二句嘗試使用分詞構句替代連續的 Simple Sentences', '持續保持零贅詞的寫作風格'],
    userDraft: 'In many nations, the question of whether tertiary education should be entirely state-funded remains a contentious debate. While opponents argue that universal free education places an unsustainable burden on public taxpayers, I firmly believe that governments should provide free higher education because it fosters socioeconomic mobility and accelerates national economic competitiveness.\n\nTo begin with, eliminating tuition fees ensures equal educational opportunities regardless of individuals\' socioeconomic backgrounds. In many developed and developing economies, talented youths from underprivileged households are frequently precluded from university degrees simply owing to financial constraints. When tertiary education is universally accessible, meritocracy flourishes, ultimately preventing social stratification from compounding across generations.\n\nFurthermore, state investment in university scholars generates long-term fiscal dividends that substantially outweigh initial expenditures. A university-educated demographic yields high-skilled professionals including software architects, medical practitioners, and environmental engineers. These professionals drive technological innovation and contribute higher tax revenues throughout their productive careers.\n\nIn conclusion, I firmly maintain that governments should fully subsidize university education. This strategic investment not only democratizes upward social mobility but also establishes the intellectual foundation for enduring economic prosperity.',
    polishedVersion: 'In many contemporary societies, the issue of whether tertiary education should be fully financed by the state remains a subject of intense debate. While opponents argue that universal free tuition places an unsustainable burden on taxpayers, I firmly maintain that governments ought to provide tuition-free university education because it promotes socioeconomic mobility and strengthens national productivity.',
  },
  {
    id: 'sample_write_2',
    timestamp: Date.now() - 86400000 * 5,
    date: '2026/03/04 10:45',
    task: 'task1',
    promptId: 'task1-line-graph',
    promptTitle: 'Renewable Energy Consumption in Four European Countries (2000-2020)',
    lizCategory: 'Line Graph (動態線圖)',
    overallBand: 6.5,
    targetBand: 7.0,
    criteriaScores: {
      taskResponse: 6.5,
      coherenceCohesion: 7.0,
      lexicalResource: 6.5,
      grammar: 6.5,
    },
    criteriaFeedback: {
      taskResponse: 'Overview 總結段清晰，正確指出了總體上升趨勢，但對個別交匯點的描述略微欠缺。',
      coherenceCohesion: '分組得當，依據上升幅度分組，段落銜接自然。',
      lexicalResource: '使用了「witnessed a steady upward trajectory」、「surpassed」等好詞，但數據描寫句型可更豐富。',
      grammar: '過去時態一致性良好，句型長短交替，有少數時態與主謂一致小問題。',
    },
    wordCount: 178,
    timeSpentSeconds: 1140,
    generalFeedbackZh: '這是一篇標準的 Task 1 報告。Overview 遵守了 Liz 準則（無提及任何具體數字），整體結構分明。若能在 Body 段落中加入更多對比表達（如 whereas, in stark contrast），即可穩固達到 Band 7.0。',
    strengths: ['Overview 總結段完全沒有誤寫具體數字，符合 Liz 核心要求', '四國數據分組合理，沒有流水帳'],
    weaknesses: ['對兩條線交叉點 (surpassed) 的描述可以更精確'],
    ieltsActionPlan: ['精練「相比、超越、保持穩定」的多種變體句型', '檢查數據描寫時的介系詞（at, by, to）精準度'],
    userDraft: 'The line graph illustrates the percentage of energy generated from renewable sources in four European nations between 2000 and 2020.\n\nOverall, renewable energy consumption experienced an upward trend across all surveyed countries over the twenty-year period. Furthermore, Sweden consistently recorded the highest proportion of renewable generation throughout the timeline, whereas Germany saw the most significant rate of increase.\n\nLooking at the higher-consumption nations, Sweden began at 38% in 2000 and rose steadily to peak at approximately 54% in 2020. Similarly, Norway started at 28% and climbed progressively, reaching 42% by the final year.\n\nIn contrast, Germany and the UK commenced at substantially lower figures, standing at 8% and 5% respectively in 2000. Germany witnessed continuous growth, surging sharply after 2010 to reach 29% in 2020, thereby overtaking Norway\'s early baseline. Finally, the UK showed modest progression until 2012, after which it escalated noticeably to conclude at 21%.',
    polishedVersion: 'The line chart details the proportion of energy produced from renewable resources across four European countries from 2000 to 2020. Overall, clean energy usage experienced a persistent upward trajectory in all four nations, with Sweden maintaining its dominant position throughout the timeframe.',
  },
];

export const INITIAL_SAMPLE_SPEAKING_RECORDS: IELTSSpeakingRecord[] = [
  {
    id: 'sample_speak_1',
    timestamp: Date.now() - 86400000 * 3,
    date: '2026/03/06 16:30',
    part: 'part2',
    topic: 'Describe an environmental challenge your city faces (環境議題)',
    overallBand: 6.5,
    criteriaScores: {
      fluencyCoherence: 6.5,
      lexicalResource: 7.0,
      grammarAccuracy: 6.0,
      pronunciation: 6.5,
    },
    feedbackZh: '論述連貫性佳，運用了 sustainable, ecological footprint 等精準詞彙。少數長複合句主謂一致與時態稍有頓挫，多練長句連貫可直衝 7.0。',
  },
  {
    id: 'sample_speak_2',
    timestamp: Date.now() - 86400000 * 6,
    date: '2026/03/03 11:15',
    part: 'part3',
    topic: 'Technology and Human Relationships (科技與人際關係)',
    overallBand: 6.0,
    criteriaScores: {
      fluencyCoherence: 6.0,
      lexicalResource: 6.5,
      grammarAccuracy: 6.0,
      pronunciation: 6.0,
    },
    feedbackZh: '觀點清晰，回答有深度。建議減少 "you know" 等口頭填充詞，加強關鍵字重音與語調起伏。',
  },
];

export const INITIAL_SAMPLE_LISTENING_RECORDS: IELTSListeningRecord[] = [
  {
    id: 'sample_listen_1',
    timestamp: Date.now() - 86400000 * 1,
    date: '2026/03/08 09:30',
    title: 'Cambridge 18 Academic Test 1 (Full Sections 1-4)',
    score: 33,
    totalQuestions: 40,
    bandScore: 7.5,
  },
  {
    id: 'sample_listen_2',
    timestamp: Date.now() - 86400000 * 4,
    date: '2026/03/05 15:40',
    title: 'Cambridge 17 Academic Test 3 (Sections 3 & 4 Academic Talk)',
    score: 30,
    totalQuestions: 40,
    bandScore: 7.0,
  },
];

/**
 * Official IELTS Overall Band Score calculation based on British Council & Cambridge criteria
 * Average of the 4 skills:
 * - < .25 rounds DOWN to .0
 * - >= .25 and < .75 rounds to .5
 * - >= .75 rounds UP to next whole band
 */
export function calculateIELTSOverallBand(
  listening: number,
  speaking: number,
  reading: number,
  writing: number
): number {
  const avg = (listening + speaking + reading + writing) / 4;
  const whole = Math.floor(avg);
  const decimal = Math.round((avg - whole) * 1000) / 1000;

  if (decimal < 0.25) {
    return whole;
  } else if (decimal < 0.75) {
    return whole + 0.5;
  } else {
    return whole + 1.0;
  }
}

export function calculateFourSkillsSummary(
  listening: number,
  speaking: number,
  reading: number,
  writing: number,
  targetOverallBand: number = 7.0
): IELTSFourSkillsSummary {
  const rawAvg = Math.round(((listening + speaking + reading + writing) / 4) * 100) / 100;
  const overallBand = calculateIELTSOverallBand(listening, speaking, reading, writing);
  const targetGap = Math.round((overallBand - targetOverallBand) * 10) / 10;
  const isTargetMet = overallBand >= targetOverallBand;

  const nextBand = overallBand < 9.0 ? overallBand + 0.5 : 9.0;
  const currentSum = listening + speaking + reading + writing;
  const neededSum = (nextBand - 0.25) * 4;
  const rawGap = neededSum - currentSum;
  const pointsToNextBand = overallBand < 9.0 ? Math.max(0.5, Math.ceil(rawGap * 2) / 2) : 0;

  const skills = [
    { name: '聽力 (Listening)', band: listening, key: 'listening' as const },
    { name: '口說 (Speaking)', band: speaking, key: 'speaking' as const },
    { name: '閱讀 (Reading)', band: reading, key: 'reading' as const },
    { name: '寫作 (Writing)', band: writing, key: 'writing' as const },
  ];

  const sorted = [...skills].sort((a, b) => b.band - a.band);
  const strongestSkill = sorted[0];
  const weakestSkill = sorted[sorted.length - 1];

  return {
    listening,
    speaking,
    reading,
    writing,
    rawAverage: rawAvg,
    overallBand,
    targetOverallBand,
    targetGap,
    isTargetMet,
    pointsToNextBand,
    nextBand,
    strongestSkill,
    weakestSkill,
  };
}

/**
 * Converts a raw score to IELTS 9-band scale (Academic Reading standard)
 */
export function calculateBandScore(rawScore: number, total: number): number {
  if (total <= 0) return 0;
  // Normalize to 40 standard questions
  const normalized40 = Math.round((rawScore / total) * 40);

  if (normalized40 >= 39) return 9.0;
  if (normalized40 >= 37) return 8.5;
  if (normalized40 >= 35) return 8.0;
  if (normalized40 >= 33) return 7.5;
  if (normalized40 >= 30) return 7.0;
  if (normalized40 >= 27) return 6.5;
  if (normalized40 >= 23) return 6.0;
  if (normalized40 >= 19) return 5.5;
  if (normalized40 >= 15) return 5.0;
  if (normalized40 >= 13) return 4.5;
  if (normalized40 >= 10) return 4.0;
  if (normalized40 >= 8) return 3.5;
  if (normalized40 >= 6) return 3.0;
  if (normalized40 >= 4) return 2.5;
  return 2.0;
}

export function getBandScoreDescriptor(band: number): string {
  if (band >= 9.0) return 'Expert User (專家級)';
  if (band >= 8.0) return 'Very Good User (優秀級)';
  if (band >= 7.0) return 'Good User (良好級)';
  if (band >= 6.0) return 'Competent User (合格級)';
  if (band >= 5.0) return 'Modest User (基礎級)';
  if (band >= 4.0) return 'Limited User (有限級)';
  return 'Intermittent User (入門級)';
}

export function getIELTSRecords(): IELTSRecord[] {
  try {
    const raw = localStorage.getItem(IELTS_RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveIELTSRecord(record: IELTSRecord): void {
  try {
    const list = getIELTSRecords();
    list.unshift(record);
    localStorage.setItem(IELTS_RECORDS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save IELTS record', e);
  }
}

export function getIELTSMistakes(): IELTSMistakeItem[] {
  try {
    const raw = localStorage.getItem(IELTS_MISTAKES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveIELTSMistakes(newMistakes: IELTSMistakeItem[]): void {
  try {
    const existing = getIELTSMistakes();
    const map = new Map<string, IELTSMistakeItem>();
    existing.forEach((m) => map.set(`${m.examId}_${m.questionId}`, m));
    newMistakes.forEach((m) => map.set(`${m.examId}_${m.questionId}`, m));
    const merged = Array.from(map.values());
    localStorage.setItem(IELTS_MISTAKES_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to save IELTS mistakes', e);
  }
}

export function removeIELTSMistake(examId: string, questionId: string): void {
  try {
    const existing = getIELTSMistakes();
    const filtered = existing.filter((m) => !(m.examId === examId && m.questionId === questionId));
    localStorage.setItem(IELTS_MISTAKES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to remove IELTS mistake', e);
  }
}

export function clearAllIELTSMistakes(): void {
  localStorage.removeItem(IELTS_MISTAKES_KEY);
}

export function getCustomExams(): IELTSExam[] {
  try {
    const raw = localStorage.getItem(IELTS_CUSTOM_EXAMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomExam(exam: IELTSExam): void {
  try {
    const existing = getCustomExams();
    const updated = [exam, ...existing.filter((e) => e.id !== exam.id)];
    localStorage.setItem(IELTS_CUSTOM_EXAMS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom exam', e);
  }
}

export function getIELTSWritingRecords(): IELTSWritingRecord[] {
  try {
    const raw = localStorage.getItem(IELTS_WRITING_RECORDS_KEY);
    if (!raw) {
      // Seed with initial sample records so dashboard displays past scores & averages out of the box
      localStorage.setItem(IELTS_WRITING_RECORDS_KEY, JSON.stringify(INITIAL_SAMPLE_WRITING_RECORDS));
      return INITIAL_SAMPLE_WRITING_RECORDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_WRITING_RECORDS;
  }
}

export function saveIELTSWritingRecord(record: IELTSWritingRecord): void {
  try {
    const list = getIELTSWritingRecords();
    list.unshift(record);
    localStorage.setItem(IELTS_WRITING_RECORDS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save IELTS writing record', e);
  }
}

export function deleteIELTSWritingRecord(id: string): void {
  try {
    const list = getIELTSWritingRecords().filter((r) => r.id !== id);
    localStorage.setItem(IELTS_WRITING_RECORDS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to delete IELTS writing record', e);
  }
}

export function clearAllIELTSWritingRecords(): void {
  try {
    localStorage.setItem(IELTS_WRITING_RECORDS_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear writing records', e);
  }
}

export function seedSampleWritingRecords(): IELTSWritingRecord[] {
  try {
    localStorage.setItem(IELTS_WRITING_RECORDS_KEY, JSON.stringify(INITIAL_SAMPLE_WRITING_RECORDS));
    return INITIAL_SAMPLE_WRITING_RECORDS;
  } catch {
    return INITIAL_SAMPLE_WRITING_RECORDS;
  }
}

export function getIELTSSpeakingRecords(): IELTSSpeakingRecord[] {
  try {
    const raw = localStorage.getItem(IELTS_SPEAKING_RECORDS_KEY);
    if (!raw) {
      localStorage.setItem(IELTS_SPEAKING_RECORDS_KEY, JSON.stringify(INITIAL_SAMPLE_SPEAKING_RECORDS));
      return INITIAL_SAMPLE_SPEAKING_RECORDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_SPEAKING_RECORDS;
  }
}

export function saveIELTSSpeakingRecord(record: IELTSSpeakingRecord): void {
  try {
    const list = getIELTSSpeakingRecords();
    list.unshift(record);
    localStorage.setItem(IELTS_SPEAKING_RECORDS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save IELTS speaking record', e);
  }
}

export function deleteIELTSSpeakingRecord(id: string): void {
  try {
    const list = getIELTSSpeakingRecords().filter((r) => r.id !== id);
    localStorage.setItem(IELTS_SPEAKING_RECORDS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to delete IELTS speaking record', e);
  }
}

export function getIELTSListeningRecords(): IELTSListeningRecord[] {
  try {
    const raw = localStorage.getItem(IELTS_LISTENING_RECORDS_KEY);
    if (!raw) {
      localStorage.setItem(IELTS_LISTENING_RECORDS_KEY, JSON.stringify(INITIAL_SAMPLE_LISTENING_RECORDS));
      return INITIAL_SAMPLE_LISTENING_RECORDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_LISTENING_RECORDS;
  }
}

export function saveIELTSListeningRecord(record: IELTSListeningRecord): void {
  try {
    const list = getIELTSListeningRecords();
    list.unshift(record);
    localStorage.setItem(IELTS_LISTENING_RECORDS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save IELTS listening record', e);
  }
}

export function deleteIELTSListeningRecord(id: string): void {
  try {
    const list = getIELTSListeningRecords().filter((r) => r.id !== id);
    localStorage.setItem(IELTS_LISTENING_RECORDS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to delete IELTS listening record', e);
  }
}

export function getGeneralSettings(): GeneralSettings {
  try {
    const raw = localStorage.getItem(GENERAL_SETTINGS_KEY);
    if (!raw) return DEFAULT_GENERAL_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_GENERAL_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_GENERAL_SETTINGS;
  }
}

export function saveGeneralSettings(settings: GeneralSettings): void {
  try {
    localStorage.setItem(GENERAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save general settings', e);
  }
}

export interface WritingStatsSummary {
  totalCount: number;
  task1Count: number;
  task2Count: number;
  averageBand: number | null;
  averageTR: number | null;
  averageCC: number | null;
  averageLR: number | null;
  averageGRA: number | null;
  highestBand: number | null;
  averageWordCount: number;
  recentScoreDiff: number | null; // diff between latest and previous
}

export function calculateWritingStats(records: IELTSWritingRecord[]): WritingStatsSummary {
  if (!records.length) {
    return {
      totalCount: 0,
      task1Count: 0,
      task2Count: 0,
      averageBand: null,
      averageTR: null,
      averageCC: null,
      averageLR: null,
      averageGRA: null,
      highestBand: null,
      averageWordCount: 0,
      recentScoreDiff: null,
    };
  }

  const totalCount = records.length;
  const task1Count = records.filter((r) => r.task === 'task1').length;
  const task2Count = records.filter((r) => r.task === 'task2').length;

  const totalBand = records.reduce((acc, r) => acc + (r.overallBand || 0), 0);
  const totalTR = records.reduce((acc, r) => acc + (r.criteriaScores?.taskResponse || 0), 0);
  const totalCC = records.reduce((acc, r) => acc + (r.criteriaScores?.coherenceCohesion || 0), 0);
  const totalLR = records.reduce((acc, r) => acc + (r.criteriaScores?.lexicalResource || 0), 0);
  const totalGRA = records.reduce((acc, r) => acc + (r.criteriaScores?.grammar || 0), 0);
  const totalWords = records.reduce((acc, r) => acc + (r.wordCount || 0), 0);

  const highestBand = Math.max(...records.map((r) => r.overallBand || 0));

  let recentScoreDiff: number | null = null;
  if (records.length >= 2) {
    recentScoreDiff = Math.round((records[0].overallBand - records[1].overallBand) * 10) / 10;
  }

  return {
    totalCount,
    task1Count,
    task2Count,
    averageBand: Math.round((totalBand / totalCount) * 10) / 10,
    averageTR: Math.round((totalTR / totalCount) * 10) / 10,
    averageCC: Math.round((totalCC / totalCount) * 10) / 10,
    averageLR: Math.round((totalLR / totalCount) * 10) / 10,
    averageGRA: Math.round((totalGRA / totalCount) * 10) / 10,
    highestBand: highestBand > 0 ? highestBand : null,
    averageWordCount: Math.round(totalWords / totalCount),
    recentScoreDiff,
  };
}

/**
 * Formats a clean Markdown export of IELTS practice history and mistakes
 */
export function exportIELTSPracticeReportMarkdown(
  records: IELTSRecord[],
  mistakes: IELTSMistakeItem[],
  writingRecords: IELTSWritingRecord[] = [],
  speakingRecords: IELTSSpeakingRecord[] = [],
  listeningRecords: IELTSListeningRecord[] = [],
  settings?: GeneralSettings
): string {
  const dateStr = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const totalExams = records.length;
  const avgReadingScore =
    totalExams > 0
      ? records.reduce((acc, r) => acc + r.bandScore, 0) / totalExams
      : (settings?.currentScores.reading ?? 7.0);

  const writingStats = calculateWritingStats(writingRecords);
  const avgWriting = writingStats.averageBand ?? (settings?.currentScores.writing ?? 6.5);

  const avgSpeaking =
    speakingRecords.length > 0
      ? speakingRecords.reduce((acc, s) => acc + s.overallBand, 0) / speakingRecords.length
      : (settings?.currentScores.speaking ?? 6.5);

  const avgListening =
    listeningRecords.length > 0
      ? listeningRecords.reduce((acc, l) => acc + l.bandScore, 0) / listeningRecords.length
      : (settings?.currentScores.listening ?? 7.0);

  const roundedL = Math.round(avgListening * 2) / 2;
  const roundedS = Math.round(avgSpeaking * 2) / 2;
  const roundedR = Math.round(avgReadingScore * 2) / 2;
  const roundedW = Math.round(avgWriting * 2) / 2;

  const fourSkills = calculateFourSkillsSummary(
    roundedL,
    roundedS,
    roundedR,
    roundedW,
    settings?.targetOverallBand ?? 7.0
  );

  let md = `# 雅思全科四維備考與總成績報告 (IELTS 4-Skills Master Report)\n\n`;
  md += `- **導出日期**：${dateStr}\n`;
  md += `- **🎯 當前雅思總成績 (Overall Band)**：**Band ${fourSkills.overallBand.toFixed(1)}** (算術平均 ${fourSkills.rawAverage.toFixed(2)})\n`;
  md += `- **🎯 目標總成績 (Target Band)**：Band ${fourSkills.targetOverallBand.toFixed(1)} (${fourSkills.isTargetMet ? '🎉 已達標！' : `差距 ${fourSkills.targetGap.toFixed(1)} 分`})\n\n`;

  md += `## 1. 聽說讀寫四科成績總覽 (Four Skills Scorecard)\n\n`;
  md += `| 科目 (Skill) | 當前實測/預估分 | 目標成績 | 達標狀態 |\n`;
  md += `| :--- | :---: | :---: | :---: |\n`;
  md += `| 🎧 聽力 (Listening) | **Band ${fourSkills.listening.toFixed(1)}** | Band ${(settings?.targetScores.listening ?? 7.5).toFixed(1)} | ${fourSkills.listening >= (settings?.targetScores.listening ?? 7.5) ? '✓ 已達標' : '進行中'} |\n`;
  md += `| 🗣️ 口說 (Speaking) | **Band ${fourSkills.speaking.toFixed(1)}** | Band ${(settings?.targetScores.speaking ?? 6.5).toFixed(1)} | ${fourSkills.speaking >= (settings?.targetScores.speaking ?? 6.5) ? '✓ 已達標' : '進行中'} |\n`;
  md += `| 📖 閱讀 (Reading) | **Band ${fourSkills.reading.toFixed(1)}** | Band ${(settings?.targetScores.reading ?? 7.5).toFixed(1)} | ${fourSkills.reading >= (settings?.targetScores.reading ?? 7.5) ? '✓ 已達標' : '進行中'} |\n`;
  md += `| ✍️ 寫作 (Writing) | **Band ${fourSkills.writing.toFixed(1)}** | Band ${(settings?.targetScores.writing ?? 7.0).toFixed(1)} | ${fourSkills.writing >= (settings?.targetScores.writing ?? 7.0) ? '✓ 已達標' : '進行中'} |\n`;
  md += `| **🏆 雅思總分 (Overall)** | **Band ${fourSkills.overallBand.toFixed(1)}** | **Band ${fourSkills.targetOverallBand.toFixed(1)}** | **${fourSkills.isTargetMet ? '🎉 達成目標' : '衝刺中'}** |\n\n`;
  md += `> **計分說明**：依據雅思官方計分進位準則，(聽 ${fourSkills.listening} + 說 ${fourSkills.speaking} + 讀 ${fourSkills.reading} + 寫 ${fourSkills.writing}) ÷ 4 = ${fourSkills.rawAverage.toFixed(2)}，最終換算為 **Band ${fourSkills.overallBand.toFixed(1)}**。\n\n`;

  md += `## 2. 雅思寫作評分歷史紀錄 (Writing Evaluation History)\n\n`;
  if (writingRecords.length === 0) {
    md += `*目前尚無寫作評分紀錄*\n\n`;
  } else {
    md += `| 日期 | 任務 | 題目 / 類別 | 總評分 | TR | CC | LR | GRA | 字數 |\n`;
    md += `| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    writingRecords.forEach((w) => {
      md += `| ${w.date} | ${w.task === 'task1' ? 'Task 1' : 'Task 2'} | ${w.promptTitle} (${w.lizCategory}) | **Band ${w.overallBand.toFixed(1)}** | ${w.criteriaScores.taskResponse} | ${w.criteriaScores.coherenceCohesion} | ${w.criteriaScores.lexicalResource} | ${w.criteriaScores.grammar} | ${w.wordCount} 字 |\n`;
    });
    md += `\n`;
  }

  md += `## 3. 聽力與口說測驗紀錄 (Listening & Speaking Records)\n\n`;
  if (speakingRecords.length > 0) {
    md += `### 口說練習與評分 (Speaking)\n`;
    speakingRecords.forEach((s) => {
      md += `- **${s.date} [${s.part.toUpperCase()}]**：${s.topic} → **Band ${s.overallBand.toFixed(1)}** (FC: ${s.criteriaScores.fluencyCoherence} / LR: ${s.criteriaScores.lexicalResource} / GRA: ${s.criteriaScores.grammarAccuracy} / PR: ${s.criteriaScores.pronunciation})\n`;
      if (s.feedbackZh) md += `  > 點評：${s.feedbackZh}\n`;
    });
    md += `\n`;
  }

  if (listeningRecords.length > 0) {
    md += `### 聽力模考紀錄 (Listening)\n`;
    listeningRecords.forEach((l) => {
      md += `- **${l.date}**：${l.title} → **Band ${l.bandScore.toFixed(1)}** (${l.score}/${l.totalQuestions})\n`;
    });
    md += `\n`;
  }

  md += `## 4. 閱讀模考練習記錄 (Reading Practice History)\n\n`;
  if (records.length === 0) {
    md += `*目前尚無練習記錄*\n\n`;
  } else {
    md += `| 日期 | 篇名/分類 | 答對題數 | 正確率 | 預估成績 (Band) | 耗時 |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :---: |\n`;
    records.forEach((r) => {
      const minutes = Math.floor(r.timeSpentSeconds / 60);
      const seconds = r.timeSpentSeconds % 60;
      md += `| ${r.date} | [${r.category}] ${r.examTitle} | ${r.score}/${r.totalQuestions} | ${r.percentage}% | **Band ${r.bandScore.toFixed(1)}** | ${minutes}m ${seconds}s |\n`;
    });
    md += `\n`;
  }

  md += `## 5. 核心錯題本 (Mistake Notebook)\n\n`;
  if (mistakes.length === 0) {
    md += `*太棒了！目前錯題本中沒有未解決的錯題。*\n\n`;
  } else {
    mistakes.forEach((m, idx) => {
      md += `### ${idx + 1}. [${m.examTitle}] 題目 ${m.questionNumber || m.questionId}\n`;
      md += `- **題型**：${m.kind || '雅思題型'}\n`;
      md += `- **您的作答**：\`${m.userAnswer || '(未填答)'}\`\n`;
      md += `- **標準答案**：**\`${m.correctAnswer}\`**\n`;
      if (m.explanation) {
        md += `- **題目精析與定位**：\n> ${m.explanation.replace(/\n/g, '\n> ')}\n`;
      }
      md += `\n---\n\n`;
    });
  }

  return md;
}
