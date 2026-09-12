import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getAccount, readStore, syncAccount } from './server/syncStore';

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

// Initialize ElevenLabs client (optional — only used if ELEVENLABS_API_KEY is set)
let elevenLabsClient: ElevenLabsClient | null = null;
function getElevenLabs(): ElevenLabsClient | null {
  if (!process.env.ELEVENLABS_API_KEY) return null;
  if (!elevenLabsClient) {
    elevenLabsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  }
  return elevenLabsClient;
}

// ElevenLabs text-to-speech: tried in this model order, cheapest/fastest first. If a model's
// account quota is exhausted (or any other error), the next model in the chain is tried.
const ELEVENLABS_MODEL_CHAIN = ['eleven_turbo_v2_5', 'eleven_flash_v2_5', 'eleven_multilingual_v2'];
const ELEVENLABS_DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // "Rachel" — natural English voice

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    hasElevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
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

// 2. Quick single-word lookup and authoritative dictionary lookup
app.post('/api/dictionary/lookup', async (req, res) => {
  try {
    const { word, contextSentence } = req.body;
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const ai = getAI();
    const prompt = `You are an authoritative English lexicographer for Oxford Advanced Learner's Dictionary and Cambridge Academic Dictionary.
Look up and provide comprehensive, authentic dictionary and lexicographical learning information for "${word}"${contextSentence ? ` in this context: "${contextSentence}"` : ''} for a Traditional Chinese (繁體中文) learner preparing for IELTS.

CRITICAL REQUIREMENTS:
1. "partOfSpeech" MUST be clean standard POS abbreviation ONLY (e.g. "n.", "v.", "adj.", "adv.", "prep.", "conj."). NEVER include Chinese characters in "partOfSpeech".
2. NEVER generate meta-sentences like "IELTS learners often encounter the word '...' in practice exercises" or generic template text. Provide authentic, high-caliber academic / IELTS sentences.
3. If the word has multiple senses or parts of speech, break them down in "senses".
4. Provide comprehensive morphological etymology breakdown (prefix, root, suffix, and a memorable mnemonic hook).
5. Provide a rich semantic mind map (derivatives with POS, Band 7+ synonyms, antonyms, collocations, root cognates, and IELTS thematic topics).
6. Provide pronunciation diagnosis (syllable segmentation, primary stress, pronunciation tips, and common mistakes for Chinese speakers).

Return ONLY valid JSON matching this exact structure:
{
  "word": "${word}",
  "phonetic": "Standard IPA with stress mark e.g. /dɪˈlɪŋ.kwən.si/",
  "partOfSpeech": "n.",
  "translation": "繁體中文核心釋義",
  "definitionEn": "Concise authentic Oxford/Cambridge English definition",
  "senses": [
    {
      "partOfSpeech": "n.",
      "definitionZh": "第一釋義 (繁體中文)",
      "definitionEn": "First English definition",
      "collocations": ["Collocation 1", "Collocation 2"],
      "exampleEn": "Authentic academic sentence",
      "exampleZh": "繁體中文翻譯"
    }
  ],
  "collocations": ["Common collocation 1", "Common collocation 2", "Common collocation 3"],
  "exampleEn": "Authentic high-quality academic IELTS sentence",
  "exampleZh": "繁體中文翻譯",
  "grammarNotes": "Grammatical advice and preposition usages",
  "etymology": {
    "prefix": "Prefix or empty",
    "prefixMeaning": "Meaning of prefix",
    "root": "Core Latin/Greek root",
    "rootMeaning": "Meaning of root",
    "suffix": "Suffix or empty",
    "suffixMeaning": "Meaning of suffix",
    "breakdown": "e.g. de- (away) + linqu- (abandon) + -ency (noun)",
    "memoryHook": "Memorable mnemonic rule in 繁體中文",
    "origin": "Etymological origin"
  },
  "mindMap": {
    "derivatives": [
      { "word": "derivative1", "pos": "adj.", "meaningZh": "中文意思" }
    ],
    "synonyms": ["synonym1", "synonym2", "synonym3"],
    "antonyms": ["antonym1", "antonym2"],
    "collocations": ["collocation1", "collocation2", "collocation3"],
    "rootFamily": [
      { "word": "cognateWord", "meaningZh": "同根字中文意思" }
    ],
    "thematicTopics": ["Crime & Society", "Education & Youth"]
  },
  "pronunciation": {
    "syllables": "de · LIN · quen · cy",
    "primaryStress": "LIN (第2音節)",
    "ipa": "/dɪˈlɪŋ.kwən.si/",
    "tips": ["發音技巧 1", "發音技巧 2"],
    "commonMistakes": ["常見盲點 1"]
  },
  "dictionarySource": "Oxford & Cambridge Academic Standard"
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
      partOfSpeech: 'n.',
      translation: '字典解析中',
      definitionEn: '',
      senses: [],
      collocations: [],
      exampleEn: `Scholars have examined the role of ${word} in modern research.`,
      exampleZh: `學者們在現代研究中探討了「${word}」的作用。`,
      grammarNotes: '',
      dictionarySource: 'Oxford & Cambridge Academic Lexicon',
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in dictionary lookup:', error);
    res.status(500).json({ error: error?.message || 'Dictionary lookup failed' });
  }
});

app.post('/api/gemini/quick-lookup', async (req, res) => {
  try {
    const { word, contextSentence } = req.body;
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const ai = getAI();
    const prompt = `Provide detailed, authentic English-learning dictionary info for the word/phrase "${word}"${contextSentence ? ` in this context: "${contextSentence}"` : ''} for a Traditional Chinese (繁體中文) learner.
CRITICAL:
1. "partOfSpeech" MUST be a clean standard abbreviation only (e.g. "n.", "v.", "adj.", "adv."). NEVER include Chinese text in "partOfSpeech".
2. NEVER output "IELTS learners often encounter the word '...' in practice exercises" or meta placeholder sentences. Provide real, natural academic sentences.
3. Provide senses if there are multiple meanings, plus etymology breakdown and semantic associations.

Return JSON with this structure:
{
  "word": "${word}",
  "phonetic": "IPA phonetic transcription",
  "partOfSpeech": "n., v., adj., or adv.",
  "translation": "Traditional Chinese (繁體中文)",
  "definitionEn": "Concise English definition",
  "collocations": ["Collocation 1", "Collocation 2", "Collocation 3"],
  "exampleEn": "Natural, authentic IELTS academic example sentence",
  "exampleZh": "Traditional Chinese translation of example sentence",
  "grammarNotes": "Grammar advice, prepositions, or typical sentence structures",
  "etymology": {
    "prefix": "prefix",
    "root": "root",
    "suffix": "suffix",
    "breakdown": "morphological breakdown",
    "memoryHook": "Mnemonic in Traditional Chinese"
  },
  "mindMap": {
    "derivatives": [{ "word": "word", "pos": "pos", "meaningZh": "zh" }],
    "synonyms": ["syn1", "syn2"],
    "antonyms": ["ant1", "ant2"],
    "collocations": ["col1", "col2"]
  }
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
    const ieltsSection = ieltsTask
      ? `
7. Strict IELTS Assessment (0.0-9.0 band scale with 0.5 increments):
   - Assess all four official criteria independently:
     a) Task Achievement (Task 1) / Task Response (Task 2)
     b) Coherence and Cohesion
     c) Lexical Resource
     d) Grammatical Range and Accuracy
   - Calculate realistic overall band (average of the four criteria rounded to the nearest 0.5).
   - For Task 1 (Academic Report, min 150 words):
     * Check if there is an explicit OVERVIEW summarizing main trends/features without specific figures. In official criteria, if the overview is missing, Task Achievement is capped at Band 5.0!
     * Check for logical grouping into 2 body paragraphs with comparisons, rather than a list of every number.
     * Check that NO personal opinion or speculative reasons are included.
   - For Task 2 (Academic Essay, min 250 words):
     * Identify the essay type (Opinion, Discussion, Advantage/Disadvantage, Problem/Solution, Direct Questions).
     * Check if a clear position/thesis is presented in the introduction and maintained throughout.
     * Check if each body paragraph has a clear topic sentence and is developed using the PEEL/TEER method (Point, Explain, Example, Link).
     * Check that conclusion summarizes without introducing new ideas.
   - Action Plan: Give exactly three specific, actionable, high-impact improvements for the next draft strictly in Traditional Chinese (繁體中文), completely without filler words.`
      : '';

    const prompt = `You are a professional IELTS writing examiner and coach trained in the official Cambridge/IDP assessment criteria and standard high-scoring essay structure.
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
${ieltsSection}

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
      const promptText = `You are an elite IELTS Writing mentor and Cambridge/IDP assessment standards specialist.
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
    const promptText = `You are an elite IELTS writing examiner and Cambridge/IDP assessment standards specialist.
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
      ? 'Task 1 Overview: CRITICAL RULE: Must summarize 2-3 main trends/features. ABSOLUTELY NO SPECIFIC FIGURES/NUMBERS. If any numbers appear, it fails the overview requirement!'
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

// 5. Voice Dialogue / Speaking Partner (ElevenLabs Tutor Personality & Dynamic Starter)
app.post('/api/gemini/voice-dialogue-starter', async (req, res) => {
  const {
    scenario = 'daily-cafe',
    scenarioTitle = '日常漫談與生活社交',
    scenarioDetails = '輕鬆自然的日常對話',
    customTopic,
    targetVocabWords = [],
  } = req.body;

  try {
    const ai = getAI();
    const prompt = `You are "Emma", a warm, encouraging, and friendly English language conversation tutor inspired by the best language practice partners.
You make practicing spoken English feel like chatting with a close, supportive friend.

Task: Generate a UNIQUE, fresh, and captivating conversational opening question to start today's speaking practice.
Never use a rigid or repeated greeting. Keep it spontaneous, warm, and inviting.

Scenario: "${scenarioTitle}" (${scenarioDetails})
${customTopic ? `Custom User Topic: "${customTopic}"` : ''}
${targetVocabWords.length > 0 ? `Target Vocabulary to naturally weave in if suitable: ${targetVocabWords.join(', ')}` : ''}

Style & Guidelines:
1. Greet the learner warmly and jump straight into an interesting, accessible open-ended icebreaker question related to this scenario (2-3 sentences max).
2. The question should spark storytelling, personal thoughts, or daily life sharing (e.g. asking about recent habits, a dilemma, a memorable trip, a funny experience, an opinion on modern trends, or what they're up to today).
3. Provide 2 natural follow-up starter sentences that the learner could use to answer if they want ideas.
4. Provide the Traditional Chinese (繁體中文) translation.

Format your output strictly in JSON:
{
  "starter": "Emma's unique, friendly spoken opening greeting and question in English",
  "translationZh": "繁體中文翻譯",
  "topicTitle": "${scenarioTitle}",
  "suggestedFollowUps": [
    "Sample response idea 1",
    "Sample response idea 2"
  ],
  "suggestedVocab": ["word1", "word2"]
}`;

    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.9,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', {
      starter: "Hey there! I'm so glad we're chatting today. How has your week been going so far? Anything fun or unexpected happen?",
      translationZh: "哈囉！很高興今天能和你聊天。這週過得怎麼樣呢？有發生什麼有趣或意想不到的事嗎？",
      topicTitle: scenarioTitle,
      suggestedFollowUps: [
        "It's been pretty busy, but I finally had some time to relax.",
        "Actually, something quite interesting happened yesterday!",
      ],
      suggestedVocab: targetVocabWords.slice(0, 3),
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating voice dialogue starter:', error);
    const fallbacks = [
      {
        starter: "Hey there! It's so great to practice with you today. What kind of day has it been for you so far?",
        translationZh: "哈囉！很高興今天能和你一起練習。你今天過得如何呢？",
        suggestedFollowUps: ["It's been a relaxing day for me.", "I've been quite busy with work and study today."],
      },
      {
        starter: "Hi! I was just thinking about how our daily routines shape our mood. Do you have a favorite part of the day that you always look forward to?",
        translationZh: "嗨！我剛才在想日常作息如何影響心情。你一天當中有沒有哪段時光是你特別期待的？",
        suggestedFollowUps: ["I always look forward to my quiet morning coffee.", "Evenings are the best because I get to unwind."],
      },
      {
        starter: "Hello! Welcome in! If you had a completely free afternoon with no obligations today, how would you spend it?",
        translationZh: "哈囉，歡迎！如果你今天有一個完全自由、沒有任何待辦事項的下午，你會怎麼度過？",
        suggestedFollowUps: ["I would probably go for a long walk in a park.", "I'd visit a cozy bookstore or cafe to read."],
      },
    ];
    const picked = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    res.json({
      starter: picked.starter,
      translationZh: picked.translationZh,
      topicTitle: scenarioTitle,
      suggestedFollowUps: picked.suggestedFollowUps,
      suggestedVocab: targetVocabWords.slice(0, 3),
    });
  }
});

// 5. Voice Dialogue / Speaking Partner (ElevenLabs Real-time Adaptive Persona & Direct Verbal Coaching)
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
    const vocabList = Array.isArray(targetVocabWords) ? targetVocabWords.join(', ') : '';
    const systemInstruction = `You are "Emma", an expert, warm, and encouraging English conversation tutor.
Your mission is to help the learner speak English naturally and accurately through authentic conversation.

# CRITICAL 2-STEP SPOKEN TEACHING PATTERN (You MUST follow this on EVERY turn):
Whenever the learner says something, your spoken "reply" MUST ALWAYS follow this two-part structure:

PART 1: DIRECT, GENTLE FEEDBACK / CORRECTION FIRST (Out loud in your spoken reply)
- Analyze what the learner just said:
  * If there is ANY grammatical error, wrong tense, missing preposition, or awkward word choice: GENTLY point it out directly and show them the correct/natural phrasing before moving on (e.g., "Good effort! Just a quick tip: instead of 'I go yesterday', remember to say 'I went yesterday'." or "Nice thought! A more natural way native speakers say that is '...'").
  * If their grammar is correct but could sound more native/fluent: offer a quick, polished phrasing upgrade (e.g., "Well said! You can also say '...' to sound even more natural.").
  * If their sentence is already perfect and natural: warmly praise their specific word choice or fluency (e.g., "Spot on! I love how smoothly you phrased that!").

PART 2: NATURAL CONVERSATIONAL REACTION & NEXT OPEN-ENDED QUESTION
- After giving the quick verbal feedback, immediately react to the meaning of what they said with genuine interest and ask a compelling open-ended question to continue the dialogue smoothly.

# Personality & Style Guidelines:
- Keep the overall spoken reply concise, natural, and conversational (3-4 spoken sentences total).
- Never sound robotic, rigid, or like a test evaluator. Be like an encouraging, native-speaking best friend who genuinely cares about helping them improve.
- Adapt difficulty in real-time based on the learner's vocabulary and fluency.
- Target vocabulary to naturally weave into conversation if suitable: ${vocabList}.

# Scenario Context:
Scenario: ${scenario} (${scenarioDetails || 'Casual real-world dialogue'}).`;

    const recentHistoryText = (history || [])
      .filter((m: any) => m && m.text && !m.text.includes("trouble connecting"))
      .slice(-8)
      .map((m: any) => `${m.sender === 'user' ? 'Learner' : 'Emma'}: ${m.text.trim()}`)
      .join('\n');

    const prompt = `Dialogue History:
${recentHistoryText ? `${recentHistoryText}` : 'Starting a new conversation.'}

Learner's latest message: "${userMessage}"

Remember:
1. In your spoken "reply", you MUST directly tell the learner what to correct/improve (grammar or native phrasing tip) FIRST.
2. Then react to their idea and ask the next open-ended question to continue the topic!

Output JSON format strictly:
{
  "reply": "Emma's spoken English response following the 2-step pattern: (1) Direct feedback/correction/phrasing tip spoken out loud first, followed by (2) conversational reaction and the next open-ended question.",
  "translationZh": "Emma's complete spoken reply in Traditional Chinese 繁體中文",
  "coaching": {
    "pronunciationTrickyWords": ["word1", "word2"],
    "grammarCorrection": "Specific correction of the learner's sentence (e.g. 'I go yesterday' -> 'I went yesterday'), or null if completely flawless",
    "grammarRuleZh": "Clear Traditional Chinese explanation of the correction and advice",
    "nativeAlternative": "A natural, native way an English speaker would express the learner's exact thought",
    "confidenceScore": 92
  },
  "suggestedFollowUps": [
    "Natural response idea 1",
    "Natural response idea 2"
  ],
  "isFarewell": false,
  "sessionSummary": null
}`;

    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.75,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', {
      reply: "That's really interesting! I love hearing your thoughts on that. Could you tell me a little more about what made you feel that way?",
      translationZh: '這真的很有趣！我很喜歡聽你的想法。能多告訴我一些是什麼讓你產生這種感覺嗎？',
      coaching: {
        pronunciationTrickyWords: [],
        grammarCorrection: null,
        grammarRuleZh: '表達自然且切合語意！',
        nativeAlternative: userMessage,
        confidenceScore: 90,
      },
      suggestedFollowUps: [
        'Sure, let me give you a quick example.',
        'Well, for instance, in my own experience...',
      ],
      isFarewell: false,
      sessionSummary: null,
    });

    res.json(parsed);
  } catch (error: any) {
    console.log('Providing graceful conversational fallback in voice-dialogue');
    const safeText = (userMessage || '').trim();
    const fallbackReply = {
      reply: safeText
        ? `I totally see what you mean! That's a great point. How did that experience impact your perspective afterwards?`
        : `I'm right here with you! What's something interesting you'd like to share today?`,
      translationZh: safeText
        ? `我完全明白你的意思！這真是個很好的切入點。那次經驗之後對你的想法有什麼影響呢？`
        : `我一直在這聽著！今天有什麼有趣的事情想和我聊聊嗎？`,
      coaching: {
        pronunciationTrickyWords: [],
        grammarCorrection: null,
        grammarRuleZh: '表達通順，語意明確！',
        nativeAlternative: safeText || 'That makes complete sense.',
        confidenceScore: 88,
      },
      suggestedFollowUps: [
        'It really changed the way I look at things.',
        'To be honest, it was quite a memorable moment.',
      ],
      isFarewell: false,
      sessionSummary: null,
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
Create an engaging spoken English listening audio passage (approx 130-180 words) on the topic "${topic}" at CEFR Level "${level}".
${vocabWords.length > 0 ? `CRITICAL REQUIREMENT: You MUST naturally incorporate ALL of these target vocabulary words into the passage: ${vocabWords.join(', ')}. Each word must appear in the audioScript and be included in vocabularyList and dictation practice.` : ''}

Output strictly JSON:
{
  "id": "listen_${Date.now()}",
  "title": "Short descriptive title",
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
      "definition": "Traditional Chinese 繁體中文 definition"
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

// Helper: Extract details from YouTube URL
async function resolveYouTubeMedia(url: string) {
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (!ytMatch) return null;
  const youtubeVideoId = ytMatch[1];
  let title = '';
  let channel = '';
  let thumbnailUrl = `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;

  try {
    const oembedRes = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${youtubeVideoId}`
    );
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data.title) title = data.title.trim();
      if (data.author_name) channel = data.author_name.trim();
      if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
    }
  } catch (err: any) {
    console.warn('Could not fetch YouTube oembed:', err?.message);
  }

  return {
    youtubeVideoId,
    title,
    channel,
    thumbnailUrl,
  };
}

// Fetch a YouTube video's public caption track (creator-uploaded or YouTube ASR), if one exists.
// This reads the same publicly-served caption/subtitle text track that YouTube's own CC button
// displays to any viewer (the same mechanism tools like Language Reactor rely on) — it does not
// download the video or audio itself.
//
// The caption track URLs are read from the video's own watch-page player data (the same public
// HTML a browser loads for youtube.com/watch), because they include a signature/params YouTube
// now requires — constructing a timedtext URL by hand (lang/v only) returns empty for most videos.
async function fetchYouTubeCaptions(
  youtubeVideoId: string
): Promise<{ transcript: string; isAutoGenerated: boolean; languageCode: string } | null> {
  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${youtubeVideoId}&hl=en`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!watchRes.ok) return null;
    const html = await watchRes.text();

    // Pull the ytInitialPlayerResponse JSON blob embedded in the page. Brace-matching (not a
    // regex up to the first "};") because the JSON can itself contain "};" inside string values.
    const marker = 'ytInitialPlayerResponse = ';
    const startIdx = html.indexOf(marker);
    if (startIdx === -1) return null;
    const jsonStart = startIdx + marker.length;
    if (html[jsonStart] !== '{') return null;

    let depth = 0;
    let inString = false;
    let escaped = false;
    let endIdx = -1;
    for (let i = jsonStart; i < html.length; i++) {
      const ch = html[i];
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = !inString;
      } else if (!inString) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }
    }
    if (endIdx === -1) return null;

    let playerResponse: any;
    try {
      playerResponse = JSON.parse(html.slice(jsonStart, endIdx));
    } catch {
      return null;
    }

    const tracks: any[] =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    if (tracks.length === 0) return null;

    // Prefer a manually-authored English track, then any English track (incl. auto-generated,
    // kind === 'asr'). Non-English-only videos are skipped for now to keep transcript quality high.
    const chosen =
      tracks.find((t) => (t.languageCode || '').startsWith('en') && t.kind !== 'asr') ||
      tracks.find((t) => (t.languageCode || '').startsWith('en'));
    if (!chosen?.baseUrl) return null;

    // baseUrl already includes the signature/params this video's captions require.
    const capRes = await fetch(`${chosen.baseUrl}&fmt=srv1`);
    if (!capRes.ok) return null;
    const capXml = await capRes.text();
    if (!capXml || !capXml.includes('<text')) return null;

    const decodeEntities = (s: string) =>
      s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ');

    const transcript = [...capXml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
      .map((m) => decodeEntities(m[1]).trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (transcript.length < 30) return null;

    return {
      transcript,
      isAutoGenerated: chosen.kind === 'asr',
      languageCode: chosen.languageCode || 'en',
    };
  } catch (err: any) {
    console.warn('Could not fetch YouTube captions:', err?.message);
    return null;
  }
}

// Helper: Extract audio stream & show metadata from Podcast / Audio / Web URL
async function resolvePodcastMedia(url: string) {
  const isDirectAudio = /\.(mp3|m4a|wav|aac|ogg)(\?.*)?$/i.test(url);

  let title = '';
  let description = '';
  let extractedText = '';
  let audioStreamUrl = isDirectAudio ? url : '';
  let audioBuffer: Buffer | null = null;
  let mimeType = 'audio/mp3';

  if (!isDirectAudio && url && url.startsWith('http')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1]
            .replace(/ - Apple Podcasts.*$/i, '')
            .replace(/Apple Podcast[：:]/i, '')
            .replace(/on Apple Podcasts.*$/i, '')
            .replace(/ \| BBC Learning English/i, '')
            .replace(/ - NPR.*$/i, '')
            .replace(/ \| TED Talk/i, '')
            .trim();
        }

        const descMatch = html.match(
          /<meta\s+(?:property="og:description"|name="description")\s+content="([^"]+)"/i
        );
        if (descMatch) {
          description = descMatch[1].trim();
        }

        // Look for audio stream candidates
        const audioMatches = [
          ...html.matchAll(/(https:\/\/[^"'\s<>]+\.(?:mp3|m4a|wav|aac|ogg)[^"'\s<>]*)/gi),
        ];
        if (audioMatches.length > 0) {
          audioStreamUrl = audioMatches[0][1];
          if (audioStreamUrl.includes('%2F') || audioStreamUrl.includes('%3A')) {
            try {
              const decoded = decodeURIComponent(audioStreamUrl);
              const innerMatch = decoded.match(/https:\/\/[^"'\s<>]+\.(?:mp3|m4a|wav|aac|ogg)/i);
              if (innerMatch) audioStreamUrl = innerMatch[0];
            } catch (e) {}
          }
        }

        // Clean main article/body text
        extractedText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 8000);
      }
    } catch (err: any) {
      console.warn('Could not fetch URL page HTML (will use slug metadata):', err?.message);
    }
  }

  // Fallback title from URL slug if still empty
  if (!title && url) {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname.replace(/\/$/, '');
      const lastPart = pathname.split('/').filter(Boolean).pop() || '';
      if (lastPart) {
        title = lastPart
          .replace(/[-_]+/g, ' ')
          .replace(/\.[a-z0-9]+$/i, '')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } catch (e) {}
  }

  if (audioStreamUrl) {
    try {
      const audioController = new AbortController();
      const audioTimeoutId = setTimeout(() => audioController.abort(), 12000);
      const audioRes = await fetch(audioStreamUrl, {
        signal: audioController.signal,
        headers: {
          Range: 'bytes=0-1800000',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });
      clearTimeout(audioTimeoutId);

      if (audioRes.ok || audioRes.status === 206) {
        const arrayBuf = await audioRes.arrayBuffer();
        if (arrayBuf.byteLength > 10000) {
          audioBuffer = Buffer.from(arrayBuf);
          if (audioStreamUrl.includes('.m4a')) mimeType = 'audio/m4a';
        }
      }
    } catch (err: any) {
      console.warn('Audio clip fetch error (will fallback to text metadata):', err?.message);
    }
  }

  return {
    title,
    description,
    extractedText,
    audioStreamUrl,
    audioBuffer,
    mimeType,
  };
}

// Helper: split transcript text into sentence objects
function splitIntoSentencesFallback(text: string): { en: string; zh: string; focusWords: string[] }[] {
  if (!text) return [];
  const rawLines = text.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
  const sentences: { en: string; zh: string; focusWords: string[] }[] = [];

  for (const line of rawLines) {
    const speakerMatch = line.match(/^([A-Za-z\s]+:)\s*(.+)$/);
    const prefix = speakerMatch ? speakerMatch[1] + ' ' : '';
    const content = speakerMatch ? speakerMatch[2] : line;

    const parts = content.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [content];
    parts.forEach((p, idx) => {
      const trimmed = p.trim();
      if (trimmed.length > 5) {
        const words = trimmed.replace(/[^a-zA-Z]/g, ' ').split(' ').filter((w) => w.length > 5);
        sentences.push({
          en: idx === 0 && prefix ? `${prefix}${trimmed}` : trimmed,
          zh: '（請參照英文字句逐句聽辨）',
          focusWords: words.slice(0, 2),
        });
      }
    });
  }
  return sentences;
}

// 6b. Parse External IELTS Listening Test from URL or Text
app.post('/api/gemini/parse-external-ielts-listening', async (req, res) => {
  try {
    const { url = '', rawText = '', section = 'Section 1' } = req.body;
    const ai = getAI();

    let externalContext = (rawText || '').trim();
    let pageTitle = '';
    let extractedAudioUrl = '';
    let extractedYoutubeId = '';

    // Check if YouTube link provided in Exam Mode
    const ytMedia = url ? await resolveYouTubeMedia(url) : null;
    if (ytMedia) {
      extractedYoutubeId = ytMedia.youtubeVideoId;
      pageTitle = ytMedia.title || `IELTS Listening: YouTube Material (${section})`;
      externalContext = `YouTube English Broadcast/Lecture Source:
Video Title: ${ytMedia.title}
Channel: ${ytMedia.channel}
YouTube Video ID: ${ytMedia.youtubeVideoId}`;
    }

    // Check if Podcast / Audio link provided in Exam Mode
    const podMedia = !ytMedia && url ? await resolvePodcastMedia(url) : null;
    let podcastAudioPart: any = null;
    if (podMedia) {
      if (podMedia.title) pageTitle = podMedia.title;
      if (podMedia.audioStreamUrl) extractedAudioUrl = podMedia.audioStreamUrl;
      externalContext = `Podcast Audio Episode Source:
Title: ${podMedia.title}
Description: ${podMedia.description}
Audio Stream: ${podMedia.audioStreamUrl}`;
      if (podMedia.audioBuffer) {
        podcastAudioPart = {
          inlineData: {
            data: podMedia.audioBuffer.toString('base64'),
            mimeType: podMedia.mimeType || 'audio/mp3',
          },
        };
      }
    }

    if (!ytMedia && !podMedia && url && url.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const fetchRes = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        clearTimeout(timeoutId);
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) pageTitle = titleMatch[1].trim();
          const stripped = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          externalContext = (pageTitle ? `Title: ${pageTitle}\n` : '') + stripped.slice(0, 10000);
        }
      } catch (err: any) {
        console.warn('Could not fetch external URL, generating authentic test based on context:', err?.message);
        externalContext = `Target resource URL: ${url}. Construct an authentic Cambridge IELTS Listening test module for ${section}.`;
      }
    }

    const promptText = `You are an elite IELTS Listening Examiner and Cambridge Curriculum Developer.
Construct a complete, authentic official Cambridge-format IELTS Listening test module for ${section} based on the provided material:
${podcastAudioPart ? 'CRITICAL: Transcribe the spoken speech from the audio clip and use it as the core audioScript.' : ''}

Resource Context:
${externalContext ? externalContext.slice(0, 8000) : `Standard ${section} Listening test`}

Requirements:
1. Provide a realistic spoken audio script (180-320 words) with clear speaker identifiers (e.g. Officer / Student / Speaker / Interviewer) containing the context, clues, and answers.
2. Formulate 5 official IELTS Listening questions matching standard test formats (fill_blank with single or two words, or choice).
3. Specify exact standard answer keys (one-word or two-word exact match for blanks, or choice strings).
4. Provide the exact locating sentence from the audio script where the answer is stated or paraphrased.
5. Provide a clear Traditional Chinese (繁體中文) explanation for each question.
6. Provide a breakdown of 4 sentences with Traditional Chinese translation and focus vocabulary words.
7. Provide a vocabulary list of 4-5 academic/IELTS words with Traditional Chinese definitions.

Output strictly JSON:
{
  "id": "ielts_ext_${Date.now()}",
  "title": "${pageTitle ? pageTitle.slice(0, 70) : `IELTS Listening: ${section} Practice`}",
  "section": "${section}",
  "topic": "Academic or Everyday Listening Context",
  "description": "Short 1-sentence description of the dialogue/lecture setting",
  "audioPrompt": "You will hear a conversation/talk...",
  "audioScript": "Complete spoken dialogue or monologue...",
  "sentences": [
    {
      "en": "Key sentence from script",
      "zh": "繁體中文翻譯",
      "focusWords": ["keyWord"]
    }
  ],
  "vocabularyList": [
    {
      "word": "word",
      "definition": "繁體中文釋義"
    }
  ],
  "questions": [
    {
      "id": "q1",
      "questionNumber": 1,
      "type": "fill_blank",
      "prompt": "Question prompt with blank ________",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "exact answer word",
      "explanationZh": "繁體中文題目詳解與考點同義替換說明",
      "locatingSentence": "The exact sentence in the audio script"
    }
  ]
}`;

    const contents = podcastAudioPart
      ? [
          {
            role: 'user',
            parts: [podcastAudioPart, { text: promptText }],
          },
        ]
      : promptText;

    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.1-flash-lite',
      contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.35,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', null);
    if (!parsed || !parsed.audioScript) {
      return res.status(500).json({ error: '無法解析外部雅思題目，請確認資源內容或重試。' });
    }

    if (extractedAudioUrl) parsed.audioUrl = extractedAudioUrl;
    if (extractedYoutubeId) parsed.youtubeId = extractedYoutubeId;

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in parse-external-ielts-listening:', error);
    res.status(500).json({ error: error?.message || '解析外部題目失敗' });
  }
});

// 6c. Import Voice / Audio / YouTube / Podcast for Listening Practice
app.post('/api/gemini/import-voice-listening', async (req, res) => {
  try {
    const { url = '', audioBase64 = '', mimeType = 'audio/mp3', title = '' } = req.body;
    const ai = getAI();

    let contents: any = null;
    let detectedSourceType = 'direct_audio';
    let resolvedAudioUrl = '';
    let resolvedYoutubeId = '';
    let finalTitle = title || '';

    if (audioBase64) {
      // 1. Direct local audio file upload
      detectedSourceType = 'upload';
      contents = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: audioBase64,
                mimeType: mimeType || 'audio/mp3',
              },
            },
            {
              text: `You are an expert English listening instructor.
Transcribe this spoken audio passage verbatim in English.
Then build an interactive listening learning kit from it:
1. 'audioScript': Verbatim English transcript of the spoken audio passage (approx 150-250 words).
2. 'sentences': 4-6 distinct sentences with Traditional Chinese (繁體中文) translation and focusWords.
3. 'vocabularyList': 4-5 target vocabulary words with definitions in Traditional Chinese.
4. 'dictationPractice': 3 items (sentenceWithBlanks, blanks, hint).
5. 'comprehensionQuiz': 3 multiple choice questions with options, correctIndex, and explanationZh in Traditional Chinese.

Output strictly JSON:
{
  "id": "listen_voice_${Date.now()}",
  "title": "${title || 'Uploaded Audio Listening Practice'}",
  "level": "B2",
  "topic": "Voice Recording Audio",
  "sourceType": "upload",
  "isVerbatimTranscript": true,
  "transcriptSource": "audio_transcription",
  "audioScript": "Complete verbatim English transcript of the audio...",
  "sentences": [
    { "en": "Sentence 1", "zh": "繁體中文翻譯", "focusWords": ["word"] }
  ],
  "vocabularyList": [
    { "word": "word", "definition": "繁體中文釋義" }
  ],
  "dictationPractice": [
    { "sentenceWithBlanks": "The _____ of...", "blanks": ["keyword"], "hint": "提示" }
  ],
  "comprehensionQuiz": [
    { "question": "Question text", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanationZh": "繁體中文詳解" }
  ]
}`,
            },
          ],
        },
      ];
    } else {
      // 2. Check if URL is YouTube
      const ytMedia = await resolveYouTubeMedia(url);
      if (ytMedia) {
        detectedSourceType = 'youtube';
        resolvedYoutubeId = ytMedia.youtubeVideoId;
        finalTitle = ytMedia.title || title || 'YouTube Spoken English Practice';

        const captions = await fetchYouTubeCaptions(ytMedia.youtubeVideoId);

        const prompt = captions
          ? `You are an expert English listening instructor.
Below is the REAL, verbatim caption transcript of a YouTube video (${captions.isAutoGenerated ? 'auto-generated by YouTube' : 'creator-provided'}). Use it as-is — do not invent or alter the spoken content.

Video Title: "${ytMedia.title}"
Channel / Author: "${ytMedia.channel}"
${title ? `Student Note: ${title}` : ''}

REAL TRANSCRIPT:
"""
${captions.transcript.slice(0, 6000)}
"""

From this real transcript, build an interactive listening learning kit:
1. 'audioScript': the real transcript above, lightly cleaned up (fix obvious caption typos/casing/punctuation only — do not change wording or invent content). If it's very long, keep the first ~220-320 words as a coherent excerpt.
2. 'sentences': 4-6 distinct sentences taken directly from the transcript, each with Traditional Chinese (繁體中文) translation and focusWords.
3. 'vocabularyList': 4-5 key vocabulary words that actually appear in the transcript, with definitions in Traditional Chinese.
4. 'dictationPractice': 3 fill-in-the-blank items based on real sentences from the transcript.
5. 'comprehensionQuiz': 3 multiple choice questions that can only be answered correctly by someone who understood this real transcript, with options, correctIndex, and explanationZh in Traditional Chinese.

Output strictly JSON:
{
  "id": "listen_voice_${Date.now()}",
  "title": "${finalTitle}",
  "level": "B2",
  "topic": "${ytMedia.channel ? ytMedia.channel + ' Report' : 'Video Listening'}",
  "sourceType": "youtube",
  "sourceUrl": "${url}",
  "youtubeId": "${ytMedia.youtubeVideoId}",
  "isVerbatimTranscript": true,
  "transcriptSource": "${captions.isAutoGenerated ? 'youtube_captions_auto' : 'youtube_captions'}",
  "audioScript": "The real transcript excerpt...",
  "sentences": [
    { "en": "Sentence 1", "zh": "繁體中文翻譯", "focusWords": ["word"] }
  ],
  "vocabularyList": [
    { "word": "word", "definition": "繁體中文釋義" }
  ],
  "dictationPractice": [
    { "sentenceWithBlanks": "The _____ of...", "blanks": ["keyword"], "hint": "提示" }
  ],
  "comprehensionQuiz": [
    { "question": "Question text", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanationZh": "繁體中文詳解" }
  ]
}`
          : `You are an expert English listening instructor.
This YouTube video has no available caption track, so its real spoken content cannot be retrieved. Approximate practice content based only on its title/channel:
Video Title: "${ytMedia.title}"
Channel / Author: "${ytMedia.channel}"
YouTube Video ID: ${ytMedia.youtubeVideoId}
${title ? `Student Note: ${title}` : ''}

Generate a plausible, educational English listening study kit that topically matches this video (this is an AI approximation, not the video's real transcript):
1. Provide a realistic audio script transcript of approx 160-240 words representing a plausible spoken monologue or broadcast report on this topic.
2. Break it into individual sentences with accurate Traditional Chinese (繁體中文) translations and focusWords.
3. Extract 4-5 key IELTS / academic vocabulary words with definitions in Traditional Chinese.
4. Create 3 dictation fill-in-the-blank practice items based on key sentences.
5. Create 3 comprehension multiple choice questions with options, correctIndex, and explanationZh in Traditional Chinese.

Output strictly JSON:
{
  "id": "listen_voice_${Date.now()}",
  "title": "${finalTitle}",
  "level": "B2",
  "topic": "${ytMedia.channel ? ytMedia.channel + ' Report' : 'Video Listening'}",
  "sourceType": "youtube",
  "sourceUrl": "${url}",
  "youtubeId": "${ytMedia.youtubeVideoId}",
  "isVerbatimTranscript": false,
  "transcriptSource": "ai_approximated",
  "audioScript": "Complete spoken transcript approximating this broadcast...",
  "sentences": [
    { "en": "Sentence 1", "zh": "繁體中文翻譯", "focusWords": ["word"] }
  ],
  "vocabularyList": [
    { "word": "word", "definition": "繁體中文釋義" }
  ],
  "dictationPractice": [
    { "sentenceWithBlanks": "The _____ of...", "blanks": ["keyword"], "hint": "提示" }
  ],
  "comprehensionQuiz": [
    { "question": "Question text", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanationZh": "繁體中文詳解" }
  ]
}`;
        contents = prompt;
      } else {
        // 3. Check if URL is Podcast or Direct Audio Stream
        const podMedia = await resolvePodcastMedia(url);
        if (podMedia) {
          detectedSourceType = 'podcast';
          resolvedAudioUrl = podMedia.audioStreamUrl;
          finalTitle = podMedia.title || title || 'Podcast Listening Practice';

          if (podMedia.audioBuffer) {
            // Actual multimodal audio speech transcription with Gemini!
            contents = [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: podMedia.audioBuffer.toString('base64'),
                      mimeType: podMedia.mimeType || 'audio/mp3',
                    },
                  },
                  {
                    text: `You are an elite English listening instructor.
Transcribe the spoken English dialogue or speech from this audio clip verbatim.
Then build an interactive listening learning kit from the transcribed audio:
1. 'audioScript': The verbatim English transcription of the spoken audio clip (approx 150-250 words).
2. 'sentences': 4-6 distinct sentences with Traditional Chinese (繁體中文) translation and focusWords.
3. 'vocabularyList': 4-5 key vocabulary words with definitions in Traditional Chinese.
4. 'dictationPractice': 3 items (sentenceWithBlanks, blanks, hint).
5. 'comprehensionQuiz': 3 comprehension questions with options, correctIndex, and explanationZh in Traditional Chinese.

Output strictly JSON:
{
  "id": "listen_voice_${Date.now()}",
  "title": "${finalTitle}",
  "level": "B2",
  "topic": "Podcast Audio Episode",
  "sourceType": "podcast",
  "sourceUrl": "${url}",
  "audioUrl": "${resolvedAudioUrl}",
  "isVerbatimTranscript": true,
  "transcriptSource": "audio_transcription",
  "audioScript": "Complete verbatim English speech transcript...",
  "sentences": [
    { "en": "Sentence 1", "zh": "繁體中文翻譯", "focusWords": ["word"] }
  ],
  "vocabularyList": [
    { "word": "word", "definition": "繁體中文釋義" }
  ],
  "dictationPractice": [
    { "sentenceWithBlanks": "The _____ of...", "blanks": ["keyword"], "hint": "提示" }
  ],
  "comprehensionQuiz": [
    { "question": "Question text", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanationZh": "繁體中文詳解" }
  ]
}`,
                  },
                ],
              },
            ];
          } else {
            // Metadata-driven generation
            const prompt = `You are an expert English listening instructor.
A student wants to practice English listening with this Podcast episode:
Podcast Title: "${podMedia.title}"
Show Description: "${podMedia.description || ''}"
Source URL: ${url}

Generate a comprehensive English listening practice kit matching the theme and spoken content of this episode:
1. Provide a coherent, realistic audio script transcript of approx 150-240 words of natural conversational English.
2. Break it into individual sentences with Traditional Chinese (繁體中文) translation and focusWords.
3. Extract 4-5 target vocabulary words with definitions in Traditional Chinese.
4. Create 3 dictation fill-in-the-blank practice questions.
5. Create 3 comprehension multiple choice questions with options, correctIndex, and explanationZh in Traditional Chinese.

Output strictly JSON:
{
  "id": "listen_voice_${Date.now()}",
  "title": "${finalTitle}",
  "level": "B2",
  "topic": "Podcast English Practice",
  "sourceType": "podcast",
  "sourceUrl": "${url}",
  "audioUrl": "${resolvedAudioUrl}",
  "isVerbatimTranscript": false,
  "transcriptSource": "ai_approximated",
  "audioScript": "Natural spoken dialogue...",
  "sentences": [
    { "en": "Sentence 1", "zh": "繁體中文翻譯", "focusWords": ["word"] }
  ],
  "vocabularyList": [
    { "word": "word", "definition": "繁體中文釋義" }
  ],
  "dictationPractice": [
    { "sentenceWithBlanks": "The _____ of...", "blanks": ["keyword"], "hint": "提示" }
  ],
  "comprehensionQuiz": [
    { "question": "Question text", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanationZh": "繁體中文詳解" }
  ]
}`;
            contents = prompt;
          }
        } else {
          // 4. Generic web text/resource
          detectedSourceType = 'imported';
          finalTitle = title || 'External Audio Practice';
          const prompt = `You are an expert English listening instructor.
A student wants to practice English listening from this resource:
URL: ${url}

Generate a comprehensive English listening practice kit based on this resource:
1. Provide a realistic audio script transcript of approx 150-240 words of spoken English.
2. Break it into individual sentences with Traditional Chinese (繁體中文) translation and focusWords.
3. Extract 4-5 target vocabulary words with definitions in Traditional Chinese.
4. Create 3 dictation fill-in-the-blank practice questions.
5. Create 3 comprehension multiple choice questions with options, correctIndex, and explanationZh in Traditional Chinese.

Output strictly JSON:
{
  "id": "listen_voice_${Date.now()}",
  "title": "${finalTitle}",
  "level": "B2",
  "topic": "General Listening",
  "sourceType": "imported",
  "sourceUrl": "${url}",
  "isVerbatimTranscript": false,
  "transcriptSource": "ai_approximated",
  "audioScript": "Spoken transcript...",
  "sentences": [
    { "en": "Sentence 1", "zh": "繁體中文翻譯", "focusWords": ["word"] }
  ],
  "vocabularyList": [
    { "word": "word", "definition": "繁體中文釋義" }
  ],
  "dictationPractice": [
    { "sentenceWithBlanks": "The _____ of...", "blanks": ["keyword"], "hint": "提示" }
  ],
  "comprehensionQuiz": [
    { "question": "Question text", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanationZh": "繁體中文詳解" }
  ]
}`;
          contents = prompt;
        }
      }
    }

    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.1-flash-lite',
      contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.35,
      },
    });

    const parsed = cleanAndParseJSON(response.text || '{}', null);
    if (!parsed || !parsed.audioScript) {
      return res.status(500).json({ error: '無法將聲音來源轉化為聽力教材，請檢查網址或音訊格式。' });
    }

    if (resolvedAudioUrl) parsed.audioUrl = resolvedAudioUrl;
    if (resolvedYoutubeId) parsed.youtubeId = resolvedYoutubeId;
    if (finalTitle && (!parsed.title || parsed.title.includes('Practice'))) {
      parsed.title = finalTitle;
    }
    parsed.sourceType = detectedSourceType;
    parsed.sourceUrl = url;

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in import-voice-listening:', error);
    res.status(500).json({ error: error?.message || '聲音匯入失敗' });
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
// ElevenLabs text-to-speech: more natural-sounding voices for Speaking/Listening playback.
// Tries each model in ELEVENLABS_MODEL_CHAIN in order; if one is out of quota (or errors for any
// other reason), the next model is tried automatically. If no ElevenLabs key is configured, or
// every model in the chain fails, responds with { available: false } so the client can fall back
// seamlessly to the existing Gemini TTS / browser speech synthesis — never a hard error.
app.post('/api/elevenlabs/tts', async (req, res) => {
  const { text, voiceId } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  const client = getElevenLabs();
  if (!client) {
    return res.json({ available: false, reason: 'no_api_key' });
  }

  for (const modelId of ELEVENLABS_MODEL_CHAIN) {
    try {
      const audioStream = await client.textToSpeech.convert(voiceId || ELEVENLABS_DEFAULT_VOICE_ID, {
        text,
        modelId,
        outputFormat: 'mp3_44100_128',
      });

      const chunks: Uint8Array[] = [];
      for await (const chunk of audioStream as any) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);

      if (audioBuffer.length === 0) {
        continue; // Empty response — try the next model in the chain
      }

      res.set('Content-Type', 'audio/mpeg');
      res.set('X-TTS-Model', modelId);
      return res.send(audioBuffer);
    } catch (error: any) {
      const status = error?.statusCode || error?.status;
      const message = String(error?.message || error?.body?.detail?.message || '');
      const isQuotaIssue =
        status === 401 || status === 429 || /quota|credits|limit/i.test(message);
      console.log(
        `ElevenLabs model "${modelId}" unavailable (${isQuotaIssue ? 'quota/limit' : 'error'}: ${message || status}), trying next model...`
      );
      // Whether it's a quota issue or any other error, move on to the next model in the chain.
      continue;
    }
  }

  // Every model in the chain failed — let the client fall back seamlessly.
  res.json({ available: false, reason: 'all_models_exhausted' });
});

app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, voice = 'Elena' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const cleanText = String(text).slice(0, 1200);

    // 1. Try ElevenLabs voice first (Elena's human-like voice)
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const elevenVoiceId = process.env.ELEVENLABS_VOICE_ID || 'MF3mGyEYCl7XYWbV9V6O'; // Elena's Voice ID

    if (elevenKey) {
      try {
        const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        });

        if (elevenRes.ok) {
          const buffer = await elevenRes.arrayBuffer();
          const base64Audio = Buffer.from(buffer).toString('base64');
          return res.json({
            audioBase64: base64Audio,
            mimeType: 'audio/mpeg',
            provider: 'elevenlabs-elena',
          });
        }

        console.warn(`ElevenLabs TTS response status ${elevenRes.status} (free tier quota or key limit). Falling back to Gemini TTS.`);
      } catch (elevenErr) {
        console.warn('ElevenLabs TTS failed, proceeding to fallback model:', elevenErr);
      }
    }

    // 2. Fallback to Gemini High Quality TTS
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `Read naturally, clearly and human-like in English: ${cleanText}` }] }],
        config: {
          responseModalities: ['AUDIO' as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          audioBase64: base64Audio,
          mimeType: 'audio/pcm;rate=24000',
          provider: 'gemini-tts',
        });
      }
    } catch (geminiTtsErr) {
      console.warn('Gemini TTS preview unavailable or quota exhausted, falling back to Web Speech Synthesis');
    }

    // 3. Fallback to client Web Speech Synthesis
    res.json({ audioBase64: null, provider: 'webspeech' });
  } catch (error: any) {
    console.warn('TTS router error:', error);
    res.json({ audioBase64: null, provider: 'webspeech' });
  }
});

// ==========================================
// Cross-Device Synchronization Endpoints
// ==========================================

// Pull data for an account
app.get('/api/sync/pull', (req, res) => {
  try {
    const accountId = String(req.query.accountId || 'default_user').trim();
    const account = getAccount(accountId);
    if (!account) {
      return res.json({
        success: true,
        exists: false,
        accountId,
        data: null,
        message: 'Account not found on server yet, client will initialize',
      });
    }
    res.json({
      success: true,
      exists: true,
      accountId: account.accountId,
      accountName: account.accountName,
      lastUpdated: account.lastUpdated,
      data: account.data,
    });
  } catch (err: any) {
    console.error('Error pulling sync data:', err);
    res.status(500).json({ error: 'Failed to pull sync data' });
  }
});

// Push and merge data from client
app.post('/api/sync/push', (req, res) => {
  try {
    const { accountId = 'default_user', data = {}, accountName } = req.body;
    const cleanId = String(accountId).trim() || 'default_user';
    const result = syncAccount(cleanId, data, accountName);
    res.json({
      success: true,
      accountId: result.account.accountId,
      accountName: result.account.accountName,
      lastUpdated: result.account.lastUpdated,
      mergedData: result.mergedData,
    });
  } catch (err: any) {
    console.error('Error pushing sync data:', err);
    res.status(500).json({ error: 'Failed to push sync data' });
  }
});

// List available accounts or verify account code
app.get('/api/sync/accounts', (req, res) => {
  try {
    const store = readStore();
    const list = Object.values(store.accounts).map((acc) => ({
      accountId: acc.accountId,
      accountName: acc.accountName,
      lastUpdated: acc.lastUpdated,
      wordCount: (acc.data?.words || []).length,
      ieltsCount: (acc.data?.ieltsRecords || []).length,
      writingCount: (acc.data?.writingRecords || []).length,
    }));
    res.json({ success: true, accounts: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read accounts' });
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
