import { IELTSRecord, IELTSMistakeItem, IELTSExam } from '../types/ielts';

const IELTS_RECORDS_KEY = 'linguacraft_ielts_records_v1';
const IELTS_MISTAKES_KEY = 'linguacraft_ielts_mistakes_v1';
const IELTS_CUSTOM_EXAMS_KEY = 'linguacraft_ielts_custom_exams_v1';

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

/**
 * Formats a clean Markdown export of IELTS practice history and mistakes
 */
export function exportIELTSPracticeReportMarkdown(
  records: IELTSRecord[],
  mistakes: IELTSMistakeItem[]
): string {
  const dateStr = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const totalExams = records.length;
  const avgScore =
    totalExams > 0
      ? (records.reduce((acc, r) => acc + r.bandScore, 0) / totalExams).toFixed(1)
      : '0.0';

  let md = `# 雅思備考練習與錯題報告 (IELTS Practice Report)\n\n`;
  md += `- **導出日期**：${dateStr}\n`;
  md += `- **已完成模考/練習篇數**：${totalExams} 篇\n`;
  md += `- **平均預估雅思成績**：Band ${avgScore}\n`;
  md += `- **累積未掌握錯題**：${mistakes.length} 題\n\n`;

  md += `## 1. 模考練習記錄 (Practice History)\n\n`;
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

  md += `## 2. 核心錯題本 (Mistake Notebook)\n\n`;
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
