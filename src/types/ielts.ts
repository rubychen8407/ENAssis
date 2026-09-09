export interface IELTSExamMeta {
  id: string;
  title: string;
  category: 'P1' | 'P2' | 'P3' | 'P4' | string;
  frequency: '高频' | '中频' | '低频' | string;
  difficultyScore: number;
  questionCount?: number;
  type?: 'reading' | 'listening';
}

export interface IELTSQuestionGroup {
  groupId: string;
  kind: string; // matching, single_choice, true_false_not_given, yes_no_not_given, table_completion, etc.
  questionIds: string[];
  bodyHtml: string;
  leadHtml?: string;
  allowOptionReuse?: boolean;
}

export interface IELTSQuestionExplanation {
  questionId?: string;
  questionNumber?: number;
  text?: string;
  locatingSentence?: string;
  sectionTitle?: string;
  mode?: string;
  items?: any[];
  [key: string]: any;
}

export interface IELTSExam {
  id: string;
  title: string;
  category: 'P1' | 'P2' | 'P3' | 'P4' | string;
  frequency: '高频' | '中频' | '低频' | string;
  difficultyScore: number;
  passageHtml: string;
  questionGroups: IELTSQuestionGroup[];
  answerKey: Record<string, string>;
  questionOrder: string[];
  questionDisplayMap: Record<string, string>;
  explanations?: IELTSQuestionExplanation[];
  passageNotes?: any;
}

export interface IELTSCoreVocab {
  word: string;
  meaning: string;
  example: string;
  freq: number;
  phonetic?: string;
}

export interface IELTSRecord {
  id: string;
  examId: string;
  examTitle: string;
  category: string;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  bandScore: number;
  timeSpentSeconds: number;
  mode: 'mock' | 'practice' | 'flash';
  userAnswers: Record<string, string>;
  wrongQuestionIds: string[];
}

export interface IELTSMistakeItem {
  id: string;
  examId: string;
  examTitle: string;
  questionId: string;
  questionNumber: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  kind: string;
  date: string;
}

export interface BandScoreConversion {
  rawScore: number;
  total: number;
  band: number;
}
