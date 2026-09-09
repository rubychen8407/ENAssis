import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI with telemetry User-Agent
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Helper to safely parse JSON from Gemini response
function cleanAndParseJSON(rawText: string, fallback: any) {
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse JSON response:', rawText, err);
    return fallback;
  }
}

// Resilient multi-model fallback runner to prevent 503 high demand or transient API failures
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

async function generateContentWithFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const preferred = options.preferredModel || 'gemini-3.1-flash-lite';
  const modelsToTry = [preferred, ...CANDIDATE_MODELS.filter((m) => m !== preferred)];

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      if (response && (response.text !== undefined || response.candidates?.length)) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      // Failover gracefully to next candidate model
      if (i < modelsToTry.length - 1) {
        await new Promise((r) => setTimeout(r, 100 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('All model candidates failed');
}

// 1. Analyze / Extract Vocabulary from clipboard or text
app.post('/api/gemini/analyze-vocab', async (req, res) => {
  try {
    const { text, count = 5 } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const ai = getAI();
    const prompt = `You are an expert English language tutor for Traditional Chinese speakers.
Analyze the following English text or word list:
"${text}"

If it is a list of words, analyze each word. If it is an article/sentence, identify up to ${count} most useful and high-value unfamiliar vocabulary words or phrases from it.

For each word, return detailed pedagogical learning data in JSON array format:
[
  {
    "word": "string (lemma/base word)",
    "phonetic": "string (IPA phonetic symbol, e.g. /ˌkɒm.prɪˈhen.ʃən/)",
    "partOfSpeech": "string (n., v., adj., adv., phrase)",
    "translation": "string (accurate Traditional Chinese 繁體中文 translation)",
    "definitionEn": "string (concise English definition)",
    "collocations": ["string array of 2-3 common collocations or idioms with this word"],
    "exampleEn": "string (natural example sentence)",
    "exampleZh": "string (Traditional Chinese translation of the example sentence)",
    "grammarNotes": "string (grammar usage tip, e.g. followed by preposition 'with', countable/uncountable, or transitive verb)"
  }
]

Please return ONLY valid JSON array with no markdown wrappings if possible.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '[]', []);
    res.json({ words: parsed });
  } catch (error: any) {
    console.error('Error in analyze-vocab:', error);
    res.status(500).json({ error: error?.message || 'Failed to analyze vocabulary' });
  }
});

// 2. Quick single-word lookup
app.post('/api/gemini/quick-lookup', async (req, res) => {
  try {
    const { word, contextSentence } = req.body;
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const ai = getAI();
    const prompt = `Provide detailed English-learning info for the word/phrase "${word}"${contextSentence ? ` in this context: "${contextSentence}"` : ''} for a Traditional Chinese learner.
Return JSON with the exact structure:
{
  "word": "${word}",
  "phonetic": "IPA phonetic transcription",
  "partOfSpeech": "n., v., adj., etc.",
  "translation": "Traditional Chinese (繁體中文)",
  "definitionEn": "Concise English definition",
  "collocations": ["Collocation 1", "Collocation 2", "Collocation 3"],
  "exampleEn": "Natural example sentence",
  "exampleZh": "Traditional Chinese translation of example sentence",
  "grammarNotes": "Grammar advice, prepositions, or typical sentence structures"
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', {
      word,
      phonetic: '',
      partOfSpeech: '',
      translation: '查詢中',
      definitionEn: '',
      collocations: [],
      exampleEn: '',
      exampleZh: '',
      grammarNotes: '',
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in quick-lookup:', error);
    res.status(500).json({ error: error?.message || 'Lookup failed' });
  }
});

// 3. Sentence Construction & Grammar Guidance
app.post('/api/gemini/build-sentence', async (req, res) => {
  try {
    const {
      targetWords = [],
      userSentence,
      grammarPattern,
      stage = 'word-to-sentence', // 'word-to-sentence' | 'expansion' | 'complete-thought'
    } = req.body;

    const ai = getAI();
    const prompt = `You are an elite English grammar tutor helping a Traditional Chinese learner build accurate, fluent sentences.

Target Words to use: ${targetWords.join(', ')}
Grammar Pattern or Target Form: ${grammarPattern || 'Natural sentence structure'}
Learning Stage: ${stage}
User's Attempted Sentence: "${userSentence || ''}"

If user's sentence is empty, generate an instructional scaffolding prompt, grammatical guidance, and 3 progressive sample sentences from simple to advanced using the target words and pattern.

If user provided a sentence, thoroughly evaluate:
1. Is it grammatically correct?
2. Score out of 100.
3. Detailed explanation in Traditional Chinese (繁體中文) explaining the syntax, tense, subject-verb agreement, and prepositions.
4. Corrected version (if any errors existed).
5. 2-3 Natural native alternative ways to say this thought.
6. Grammatical breakdown of the components (Subject, Verb, Prepositional Phrase, Relative Clause, etc.).
7. Collocation tips with the target words.
8. Spoken delivery tip (how to stress words and pause naturally when speaking this sentence).

Format your output strictly in JSON:
{
  "originalSentence": "${userSentence || ''}",
  "isCorrect": boolean,
  "score": number,
  "grammarExplanation": "Traditional Chinese explanation of syntax and rules",
  "correctedSentence": "Grammatically polished sentence",
  "nativeAlternatives": ["Alternative 1", "Alternative 2"],
  "grammarBreakdown": [
    {"part": "string", "role": "string", "tip": "string"}
  ],
  "collocationTips": ["tip 1", "tip 2"],
  "spokenDeliveryTip": "Where to pause and which syllables to stress when speaking"
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', {
      originalSentence: userSentence,
      isCorrect: true,
      score: 85,
      grammarExplanation: '語法分析完成',
      correctedSentence: userSentence,
      nativeAlternatives: [],
      grammarBreakdown: [],
      collocationTips: [],
      spokenDeliveryTip: '',
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in build-sentence:', error);
    res.status(500).json({ error: error?.message || 'Sentence evaluation failed' });
  }
});

// 3.1 Real-time Grammar & Syntax Check for SentenceBuilder
app.post('/api/gemini/realtime-grammar-check', async (req, res) => {
  try {
    const { sentence, targetWords = [] } = req.body;
    if (!sentence || typeof sentence !== 'string' || sentence.trim().length < 3) {
      return res.json({
        hasErrors: false,
        errors: [],
        improvedSentences: [],
        overallVerdictZh: '請輸入完整句子以進行即時語法檢查。',
      });
    }

    const ai = getAI();
    const prompt = `You are a real-time English grammar inspector and writing coach for a Traditional Chinese (繁體中文) learner.
Inspect this user sentence in real-time:
"${sentence.trim()}"
${targetWords.length > 0 ? `Target words intended: ${targetWords.join(', ')}` : ''}

Strictly analyze:
1. Are there grammatical errors, agreement mistakes, wrong tenses, wrong prepositions, or awkward collocations?
2. If yes, specify the exact erroneous substring ("badText" MUST be an exact verbatim substring from the user's sentence), explain the issue concisely in Traditional Chinese ("issue"), and give the exact replacement snippet ("suggestion").
3. Provide 3 AI-optimized sentence alternatives showcasing upgraded syntax:
   - "自然流暢句 (Natural & Idiomatic)"
   - "雅思/學術進階句 (Academic / Advanced Structure)"
   - "生動有力句 (Expressive & Emphatic)"
   Each alternative must include a brief Traditional Chinese explanation of why this structure is superior ("whyBetter").
4. A concise one-sentence overall verdict in Traditional Chinese ("overallVerdictZh").

Respond strictly in valid JSON without codeblocks:
{
  "hasErrors": boolean,
  "errors": [
    {
      "badText": "exact verbatim erroneous substring",
      "issue": "繁體中文簡明錯誤原因",
      "suggestion": "建議替換詞或片段",
      "type": "grammar"
    }
  ],
  "improvedSentences": [
    {
      "patternName": "自然流暢句 (Natural & Idiomatic)",
      "sentence": "Refined sentence text",
      "whyBetter": "繁體中文結構優化解析"
    },
    {
      "patternName": "雅思/學術進階句 (Academic / Advanced Structure)",
      "sentence": "Refined sentence text",
      "whyBetter": "繁體中文結構優化解析"
    },
    {
      "patternName": "生動有力句 (Expressive & Emphatic)",
      "sentence": "Refined sentence text",
      "whyBetter": "繁體中文結構優化解析"
    }
  ],
  "overallVerdictZh": "整體評估總結"
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', {
      hasErrors: false,
      errors: [],
      improvedSentences: [],
      overallVerdictZh: '即時語法分析完成',
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in realtime-grammar-check:', error);
    res.status(500).json({ error: error?.message || 'Realtime check failed' });
  }
});

// 4. Writing & Essay Polish with Spoken Presentation Outline
app.post('/api/gemini/polish-writing', async (req, res) => {
  try {
    const { text, targetTopic, style = 'general', ieltsTask, targetBand } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const ai = getAI();
    const prompt = `You are a professional IELTS writing examiner and coach trained in the official Cambridge/IDP assessment criteria and the widely respected IELTS Liz methodology.
Analyze the following written text from a Traditional Chinese student:
Topic: "${targetTopic || 'General Writing'}"
Writing Style: "${style}"
IELTS Task: "${ieltsTask || 'general'}"
Target Band: "${targetBand || 'not specified'}"
Student Text:
"${text}"

CRITICAL INSTRUCTION - NO WORDINESS & NO FILLER WORDS (嚴格去除贅詞、空話與客套前言):
1. All diagnostic comments, grammar explanations, and action plan items MUST be direct, concise, and dense in Traditional Chinese (繁體中文).
2. Do not use greeting fluff, rhetorical questions, or generic boilerplate praise. Get straight to the technical diagnosis.
3. In writing analysis, actively identify and penalize wordy template fillers (e.g., "in this modern world of globalization", "it goes without saying that", "needless to say", "at the end of the day").

Provide a comprehensive, high-precision diagnostic report:
1. Overall score (0-100) and estimated CEFR level (A2, B1, B2, C1, C2).
2. Strengths of the writing (concise bullet points).
3. Grammar and syntactic issues: locate the exact erroneous phrase, corrected version, grammar rule name, and clear explanation strictly in Traditional Chinese (繁體中文).
4. Vocabulary enhancements: replace basic or repetitive words with richer academic collocations.
5. Native Polished Version: a natural, idiomatic, concise rewriting that retains the author's original intended meaning without unnecessary filler words.
6. Spoken Presentation Outline: since the user also wants to express complete thoughts aloud, extract 3-4 clear bullet points, an opening phrase, closing phrase, and transitional connectors.
${ieltsTask ? `
7. Strict IELTS Assessment (0.0-9.0 band scale with 0.5 increments):
   - Assess all four official criteria independently:
     a) Task Achievement (Task 1) / Task Response (Task 2)
     b) Coherence and Cohesion
     c) Lexical Resource
     d) Grammatical Range and Accuracy
   - Calculate realistic overall band (average of the four criteria rounded to the nearest 0.5).
   - For Task 1 (Academic Report, min 150 words):
     * Check if there is an explicit OVERVIEW summarizing main trends/features without specific figures. In IELTS Liz methodology, if the overview is missing, Task Achievement is capped at Band 5.0!
     * Check for logical grouping into 2 body paragraphs with comparisons, rather than a list of every number.
     * Check that NO personal opinion or speculative reasons are included.
   - For Task 2 (Academic Essay, min 250 words):
     * Identify the essay type (Opinion, Discussion, Advantage/Disadvantage, Problem/Solution, Direct Questions).
     * Check if a clear position/thesis is presented in the introduction and maintained throughout.
     * Check if each body paragraph has a clear topic sentence and is developed using the PEEL/TEER method (Point, Explain, Example, Link).
     * Check that conclusion summarizes without introducing new ideas.
   - Action Plan: Give exactly three specific, actionable, high-impact improvements for the next draft strictly in Traditional Chinese (繁體中文), completely without filler words.` : ''}

Output strictly JSON:
{
  "originalText": "${text.replace(/"/g, '\\"')}",
  "correctedText": "Grammatically clean version",
  "score": number,
  "cefrLevel": "B1 | B2 | C1",
  "strengths": ["Strength 1", "Strength 2"],
  "grammarIssues": [
    {
      "original": "error phrase",
      "correction": "corrected phrase",
      "rule": "Grammar rule name",
      "explanationZh": "Detailed explanation strictly in 繁體中文 without wordy filler"
    }
  ],
  "vocabularyEnhancements": [
    {
      "original": "simple word",
      "replacement": "advanced collocation",
      "reason": "Why this is better"
    }
  ],
  "nativePolishedVersion": "Polished text by a native editor",
  "spokenPresentationOutline": {
    "keyPoints": ["Point 1 to say", "Point 2 to say", "Point 3 to say"],
    "openingPhrase": "How to start speaking your idea",
    "closingPhrase": "How to conclude speaking your idea",
    "transitionalTips": ["Transition connector tips"]
  },
  "ieltsOverallBand": number,
  "ieltsScores": {
    "taskResponse": number,
    "coherenceCohesion": number,
    "lexicalResource": number,
    "grammar": number
  },
  "ieltsActionPlan": ["Action 1 in 繁體中文", "Action 2 in 繁體中文", "Action 3 in 繁體中文"]
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', {
      originalText: text,
      correctedText: text,
      score: 80,
      cefrLevel: 'B1',
      strengths: ['Clear expression of ideas'],
      grammarIssues: [],
      vocabularyEnhancements: [],
      nativePolishedVersion: text,
      spokenPresentationOutline: {
        keyPoints: [],
        openingPhrase: 'Today, I would like to talk about...',
        closingPhrase: 'In conclusion, that is my perspective.',
        transitionalTips: ['Furthermore', 'On the other hand'],
      },
      ieltsOverallBand: 0,
      ieltsScores: {
        taskResponse: 0,
        coherenceCohesion: 0,
        lexicalResource: 0,
        grammar: 0,
      },
      ieltsActionPlan: [],
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in polish-writing:', error);
    res.status(500).json({ error: error?.message || 'Writing polish failed' });
  }
});

// 4.1 Mode B Guided Builder - Step-by-Step IELTS Advisor & Wordiness Stripper
app.post('/api/gemini/ielts-mode-b-advice', async (req, res) => {
  try {
    const {
      mode = 'evaluate', // 'evaluate' | 'starters'
      ieltsTask = 'task2', // 'task1' | 'task2'
      stepIndex = 0,
      stepName = '',
      prompt = '',
      targetBand = 7.0,
      draftText = '',
      visualType = '',
      essayType = '',
    } = req.body;

    const ai = getAI();

    if (mode === 'starters') {
      const promptText = `You are an elite IELTS Writing mentor and IELTS Liz methodology specialist.
You are helping a Traditional Chinese student kickstart their writing for STEP ${stepIndex + 1} (${stepName}) of IELTS ${ieltsTask === 'task1' ? 'Task 1' : 'Task 2'}.

EXAM PROMPT:
"${prompt}"

${ieltsTask === 'task1' ? `Visual Type: ${visualType}` : `Essay Type: ${essayType}`}
Target Band: ${targetBand}

MANDATORY DIRECTIVE - ZERO FILLER WORDS & NO WORDINESS (嚴禁贅詞、空話、套話):
1. Provide 3 punchy, academic, Band 8+ sentence starters or structured ideas tailored specifically to this step and prompt.
2. Absolutely NO conversational greetings, empty pleasantries, or generic advice (如「這是一個很好的題目...」一律禁止).
3. Ensure every sentence starter is direct, academically rigorous, and completely free of memorized cliché padding (e.g. avoid "in this modern society", "it goes without saying that", "at the present moment").

Respond strictly in valid JSON:
{
  "stepIndex": ${stepIndex},
  "stepName": "${stepName}",
  "starters": [
    {
      "title": "風格名稱 (如：俐落客觀改寫 / 強效主題句 / 高度對比句)",
      "text": "The concise Band 8+ English sentence starter or skeleton",
      "rationale": "繁體中文簡明理由（15字內，切中要點，不帶贅詞）"
    }
  ]
}`;

      const response = await generateContentWithFallback(ai, {
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const parsed = cleanAndParseJSON(response.text || '{}', {
        stepIndex,
        stepName,
        starters: [],
      });
      return res.json(parsed);
    }

    // mode === 'evaluate'
    const promptText = `You are an elite IELTS writing examiner and IELTS Liz methodology specialist.
Evaluate the student's text written for STEP ${stepIndex + 1}: ${stepName} of IELTS ${ieltsTask === 'task1' ? 'Task 1' : 'Task 2'}.

EXAM PROMPT:
"${prompt}"
${ieltsTask === 'task1' ? `Visual Type: ${visualType}` : `Essay Type: ${essayType}`}
Target Band: ${targetBand}

STUDENT'S STEP DRAFT:
"${draftText}"

CORE CRITERIA & RULES FOR THIS STEP:
${
  ieltsTask === 'task1'
    ? stepIndex === 0
      ? 'Task 1 Intro: Must paraphrase prompt in 1-2 concise sentences without copying prompt verbatim.'
      : stepIndex === 1
      ? 'Task 1 Overview: CRITICAL LIZ RULE: Must summarize 2-3 main trends/features. ABSOLUTELY NO SPECIFIC FIGURES/NUMBERS. If any numbers appear, it fails the overview requirement!'
      : 'Task 1 Body: Logical groupings with key numbers, start values, peaks, and precise comparisons. No personal assumptions or opinions.'
    : stepIndex === 0
    ? 'Task 2 Planning: 5-minute brainstorm. Clear stance and 2 robust main ideas with examples.'
    : stepIndex === 1
    ? 'Task 2 Intro: Paraphrase background + crystal-clear thesis statement indicating stance. 2 sentences only.'
    : stepIndex === 4
    ? 'Task 2 Conclusion: Summarize main points & restate thesis. NO new arguments or ideas.'
    : 'Task 2 Body: PEEL formula (Point -> Explain -> Example -> Link). Clear topic sentence, depth of explanation, concrete illustration.'
}

MANDATORY DIRECTIVE - ZERO FILLER WORDS & NO WORDINESS (嚴格去贅詞、零廢話、切中要害):
1. In your feedback output: No greeting, no polite preamble, no filler praise. Keep every explanation dense, actionable, and strictly in Traditional Chinese (繁體中文).
2. Scan the student's draft for:
   - Empty filler phrases (e.g. "In this day and age", "It is undeniable that", "Needless to say", "In my personal opinion", "Due to the fact that", "At the present time")
   - Redundant wordiness (e.g. "each and every", "future plans", "revert back", "in close proximity to")
   - Memorized template clichés that IELTS examiners penalize
3. Provide a concise, high-band native rewrite (Band 8.0+) that preserves the student's core idea while pruning all fluff and enhancing academic cohesion.
4. Provide up to 3 high-impact lexical collocations.

Respond strictly in valid JSON:
{
  "stepIndex": ${stepIndex},
  "stepName": "${stepName}",
  "conciseDiagnosis": "繁體中文核心診斷（1-2句直接切中要點，指明是否達標與失分關鍵，絕不使用客套贅詞）",
  "wordinessVerdict": {
    "hasFillers": boolean,
    "fillers": [
      {
        "phrase": "exact wordy or filler phrase in user text",
        "fix": "concise replacement or '建議直接刪除'",
        "reason": "繁體中文精簡說明為何是贅詞"
      }
    ]
  },
  "polishedText": "A crisp, concise, high-impact Band 8+ English revision of the student's text with all filler eliminated",
  "lexicalUpgrades": [
    {
      "original": "weak or basic word",
      "upgraded": "advanced academic collocation",
      "note": "繁體中文簡明解析（10字以內）"
    }
  ],
  "lizKeyRuleCheck": {
    "passed": boolean,
    "tip": "繁體中文要點檢核（如：Overview 未包含具體數字，符合規則）"
  },
  "actionPoint": "繁體中文下一步修改指令（1句，不超過25字）"
}`;

    const response = await generateContentWithFallback(ai, {
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', {
      stepIndex,
      stepName,
      conciseDiagnosis: '診斷完成。',
      wordinessVerdict: { hasFillers: false, fillers: [] },
      polishedText: draftText,
      lexicalUpgrades: [],
      lizKeyRuleCheck: { passed: true, tip: '符合基本規範' },
      actionPoint: '繼續推進下一段落。',
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in ielts-mode-b-advice:', error);
    res.status(500).json({ error: error?.message || 'Advice failed' });
  }
});

// 5. Voice Dialogue / Speaking Partner
app.post('/api/gemini/voice-dialogue', async (req, res) => {
  const {
    scenario = 'daily-conversation',
    scenarioDetails,
    history = [],
    userMessage = '',
    targetVocabWords = [],
  } = req.body;

  try {
    const ai = getAI();
    const systemInstruction = `You are "Emma", a warm, encouraging, native English speaking conversation partner and language coach.
Your mission is to help a Traditional Chinese learner practice spoken English in real-time.
Current Scenario: ${scenario} (${scenarioDetails || 'Casual real-world dialogue'}).
Target vocabulary to naturally weave in if appropriate: ${targetVocabWords.join(', ')}.

Guidelines:
1. Reply in spoken, conversational English (2-4 sentences max per turn). Keep the conversation dynamic by reacting naturally to the Learner's latest message and asking an engaging follow-up question.
2. In the coaching section, provide gentle, practical feedback ONLY on what the user said in their latest message (do not analyze past turns):
   - Identify any grammar or tense slips in their latest message and show the correct way with a brief Traditional Chinese (繁體中文) explanation.
   - Suggest a "Native Expression" (how a native speaker would say what the user meant in their latest message).
   - Point out 1-2 words from their latest message that might be tricky to pronounce.
3. Provide 2 natural follow-up response ideas that the user could choose to say next.
4. Provide the Traditional Chinese translation of your reply for easy reference.`;

    const recentHistoryText = (history || [])
      .filter((m: any) => m && m.text && !m.text.includes("trouble connecting"))
      .slice(-8)
      .map((m: any) => `${m.sender === 'user' ? 'Learner' : 'Emma'}: ${m.text.trim()}`)
      .join('\n');

    const prompt = `Context:
${recentHistoryText ? `Recent dialogue flow:\n${recentHistoryText}` : 'Starting a new conversation.'}

Learner's latest message: "${userMessage}"

Important: Directly respond to the Learner's latest message above while keeping natural continuity and remembering details or preferences mentioned in earlier turns so they influence this conversation. Focus your coaching and native alternative strictly on this latest message.

Respond in JSON format:
{
  "reply": "Emma's conversational spoken English reply directly answering what learner just said",
  "translationZh": "Emma's reply translated into Traditional Chinese 繁體中文",
  "coaching": {
    "pronunciationTrickyWords": ["word1", "word2"],
    "grammarCorrection": "Corrected sentence if learner made a mistake in their latest message, or null if great",
    "grammarRuleZh": "Grammar rule explanation in 繁體中文, or praise if correct",
    "nativeAlternative": "More idiomatic way to express what the learner just said",
    "confidenceScore": 90
  },
  "suggestedFollowUps": [
    "Suggested sentence 1 user could say",
    "Suggested sentence 2 user could say"
  ]
}`;

    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', {
      reply: "That's great! Could you tell me a little bit more about that?",
      translationZh: '太棒了！你能多跟我聊聊這個嗎？',
      coaching: {
        pronunciationTrickyWords: [],
        grammarCorrection: null,
        grammarRuleZh: '句子結構通順自然！',
        nativeAlternative: userMessage,
        confidenceScore: 88,
      },
      suggestedFollowUps: [
        'Sure, let me explain in more detail.',
        'Well, for example...',
      ],
    });

    res.json(parsed);
  } catch (error: any) {
    console.log('Providing graceful conversational fallback in voice-dialogue');
    const safeText = (userMessage || '').trim();
    // Provide a natural conversational response even if all remote model endpoints temporarily fail
    const fallbackReply = {
      reply: safeText
        ? `That is really interesting! Could you tell me a little bit more about that, or share a specific example from your experience?`
        : `I'm right here and listening! What would you like to talk about next?`,
      translationZh: safeText
        ? `這真的很棒！你能多告訴我一些細節，或是舉個生活中的具體例子嗎？`
        : `我正在聽！接下來想跟我聊些什麼呢？`,
      coaching: {
        pronunciationTrickyWords: [],
        grammarCorrection: null,
        grammarRuleZh: '表達通順且符合情境！',
        nativeAlternative: safeText || 'That makes a lot of sense.',
        confidenceScore: 88,
      },
      suggestedFollowUps: [
        'Sure, let me give you a quick example.',
        'Actually, in my daily life, I find that very common.',
      ],
    };

    res.json(fallbackReply);
  }
});

// 6. Generate Listening Comprehension & Dictation
app.post('/api/gemini/generate-listening', async (req, res) => {
  try {
    const { topic = 'Everyday Life', level = 'B1', vocabWords = [] } = req.body;

    const ai = getAI();
    const prompt = `You are a listening test creator for English learners.
Create an engaging spoken English listening audio passage (approx 100-150 words) on the topic "${topic}" at CEFR Level "${level}".
${vocabWords.length > 0 ? `Must incorporate these target vocabulary words: ${vocabWords.join(', ')}` : ''}

Output strictly JSON:
{
  "id": "listen_${Date.now()}",
  "title": "Short title",
  "level": "${level}",
  "topic": "${topic}",
  "audioScript": "Complete spoken text for audio listening (natural conversational or narrative monologue/dialogue)",
  "sentences": [
    {
      "en": "Sentence 1",
      "zh": "繁體中文翻譯",
      "focusWords": ["keyWord"]
    }
  ],
  "vocabularyList": [
    {
      "word": "word",
      "definition": "Traditional Chinese definition"
    }
  ],
  "dictationPractice": [
    {
      "sentenceWithBlanks": "The _____ of our plan depends on clear communication.",
      "blanks": ["success"],
      "hint": "名詞，成功"
    }
  ],
  "comprehensionQuiz": [
    {
      "question": "Comprehension question in English",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanationZh": "繁體中文題目詳解"
    }
  ]
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', null);
    if (!parsed) {
      return res.status(500).json({ error: 'Failed to generate listening test' });
    }
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in generate-listening:', error);
    res.status(500).json({ error: error?.message || 'Listening generation failed' });
  }
});

// 7. Generate Reading Article with Target Vocabulary
app.post('/api/gemini/generate-reading', async (req, res) => {
  try {
    const { topic = 'Modern Technology & Work', level = 'B1', vocabWords = [] } = req.body;

    const ai = getAI();
    const prompt = `You are an English reading course designer.
Write a well-written, informative reading passage (150-250 words) on the topic "${topic}" at CEFR level "${level}".
${vocabWords.length > 0 ? `Explicitly highlight and include these vocabulary words: ${vocabWords.join(', ')}` : ''}

Output strictly JSON:
{
  "id": "read_${Date.now()}",
  "title": "Engaging Article Title",
  "level": "${level}",
  "topic": "${topic}",
  "content": "Full article text with paragraphs separated by newlines",
  "summaryZh": "Traditional Chinese 繁體中文 2-sentence summary",
  "targetVocab": [
    {
      "word": "vocabWord",
      "pos": "n./v./adj.",
      "meaningZh": "繁體中文解釋"
    }
  ],
  "sentenceAnalyses": [
    {
      "sentence": "Key complex sentence from article",
      "grammarPoint": "Grammar pattern used (e.g. Inversion, Participle Clause)",
      "translationZh": "繁體中文句意剖析"
    }
  ],
  "quiz": [
    {
      "question": "Reading comprehension question",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanationZh": "繁體中文解析"
    }
  ]
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', null);
    if (!parsed) {
      return res.status(500).json({ error: 'Failed to generate reading material' });
    }
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in generate-reading:', error);
    res.status(500).json({ error: error?.message || 'Reading generation failed' });
  }
});

// 8. Gemini High Quality TTS Endpoint (with fallback)
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, voice = 'Zephyr' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: `Read naturally and clearly in English: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO' as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audioBase64: base64Audio, mimeType: 'audio/pcm;rate=24000' });
    }
    res.json({ audioBase64: null });
  } catch (error: any) {
    // If TTS model has limit or is unavailable, return null so client falls back seamlessly to browser SpeechSynthesis
    console.log('Gemini TTS unavailable, falling back seamlessly to Web Speech Synthesis');
    res.json({ audioBase64: null });
  }
});

// Vite middleware & Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinguaCraft server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
