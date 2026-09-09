export type SkillTab = 'dashboard' | 'vocabulary' | 'speaking' | 'writing' | 'reading' | 'listening';

export interface VocabWord {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  translation: string;
  definitionEn: string;
  collocations: string[];
  exampleEn: string;
  exampleZh: string;
  grammarNotes: string;
  masteryLevel: 'new' | 'learning' | 'mastered';
  dateAdded: string;
  tags?: string[];
  speakingPassed?: boolean;
  writingPassed?: boolean;
  lastTestedAt?: string;
  examAttempts?: number;
  examCorrect?: number;
  examAccuracy?: number;
  examStatus?: 'learned' | 'review';
}

export interface GrammarPattern {
  name: string;
  structure: string;
  explanation: string;
  example: string;
}

export interface SentenceFeedback {
  originalSentence: string;
  isCorrect: boolean;
  score: number; // 0 - 100
  grammarExplanation: string;
  correctedSentence: string;
  nativeAlternatives: string[];
  grammarBreakdown: {
    part: string;
    role: string;
    tip: string;
  }[];
  collocationTips: string[];
  spokenDeliveryTip?: string;
}

export interface WritingAnalysis {
  originalText: string;
  correctedText: string;
  score: number;
  cefrLevel: string; // A1, A2, B1, B2, C1, C2
  strengths: string[];
  weaknesses?: string[];
  generalFeedbackZh?: string;
  grammarIssues: {
    original: string;
    correction: string;
    rule: string;
    explanationZh: string;
  }[];
  vocabularyEnhancements: {
    original: string;
    replacement: string;
    reason: string;
  }[];
  vocabularyUpgrades?: {
    original: string;
    better: string;
    reasonZh: string;
  }[];
  nativePolishedVersion: string;
  spokenPresentationOutline: {
    keyPoints: string[];
    openingPhrase: string;
    closingPhrase: string;
    transitionalTips: string[];
  };
  overallBand?: number;
  ieltsOverallBand?: number;
  ieltsScores?: {
    taskResponse: number;
    coherenceCohesion: number;
    lexicalResource: number;
    grammar: number;
  };
  criteriaScores?: {
    taskResponse?: { band: number; feedbackZh?: string; keyMissingElements?: string[] };
    coherenceCohesion?: { band: number; feedbackZh?: string; keyMissingElements?: string[] };
    lexicalResource?: { band: number; feedbackZh?: string; keyMissingElements?: string[] };
    grammar?: { band: number; feedbackZh?: string; keyMissingElements?: string[] };
  };
  ieltsActionPlan?: string[];
}

export interface VoiceMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  translationZh?: string;
  timestamp: number;
  audioBase64?: string;
  retryText?: string;
  coaching?: {
    pronunciationTrickyWords?: string[];
    grammarCorrection?: string;
    grammarRuleZh?: string;
    nativeAlternative?: string;
    confidenceScore?: number;
  };
  suggestedFollowUps?: string[];
}

export interface RoleplayScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  aiPersona: string;
  startingPrompt: string;
  suggestedVocab: string[];
}

export interface ListeningItem {
  id: string;
  title: string;
  level: string;
  topic: string;
  audioScript: string;
  sentences: {
    en: string;
    zh: string;
    focusWords: string[];
  }[];
  vocabularyList: {
    word: string;
    definition: string;
  }[];
  dictationPractice: {
    sentenceWithBlanks: string;
    blanks: string[];
    hint: string;
  }[];
  comprehensionQuiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanationZh: string;
  }[];
}

export interface ReadingItem {
  id: string;
  title: string;
  level: string;
  topic: string;
  content: string;
  summaryZh: string;
  targetVocab: {
    word: string;
    pos: string;
    meaningZh: string;
  }[];
  sentenceAnalyses: {
    sentence: string;
    grammarPoint: string;
    translationZh: string;
  }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanationZh: string;
  }[];
}
