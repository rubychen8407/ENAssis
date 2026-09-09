// IELTS Liz Writing Methodology, Lessons, Preparation Tips & Essay Types
// Based on:
// Task 1: https://ieltsliz.com/ielts-writing-task-1-lessons-and-tips/
//         https://ieltsliz.com/ielts-writing-task-1-preparation-tips/
// Task 2: https://ieltsliz.com/types-of-ielts-essays/

export interface Task1VisualTypeInfo {
  id: 'line_graph' | 'bar_chart' | 'pie_chart' | 'table' | 'multiple_charts' | 'process' | 'map';
  titleZh: string;
  titleEn: string;
  description: string;
  overviewTips: string;
  bodyParagraphTips: string;
  keyVocabulary: { en: string; zh: string }[];
  lizGoldenRule: string;
}

export interface Task2EssayTypeInfo {
  id: 'opinion' | 'discussion' | 'advantages_disadvantages' | 'problem_solution' | 'direct_questions';
  titleZh: string;
  titleEn: string;
  questionKeywords: string[];
  description: string;
  lizStrategy: string;
  paragraphStructure: {
    paragraph: string;
    focus: string;
    tips: string;
  }[];
  sampleTemplatePhrases: { phase: string; phrases: string[] }[];
  lizGoldenRule: string;
}

export const LIZ_TASK1_PREPARATION_STEPS = [
  {
    step: 1,
    titleZh: '熟悉評分標準 (Assessment Criteria)',
    summaryZh: '寫作 Task 1 佔總分 1/3。考官依四項各佔 25% 評分：任務完成度 (TA)、連貫與銜接 (CC)、詞彙多樣性 (LR)、語法多樣性與準確性 (GRA)。',
  },
  {
    step: 2,
    titleZh: '掌握 Overview 總結段 (The Key to Band 7+)',
    summaryZh: 'Liz 強調 Overview 是 Task 1 最關鍵段落！若缺少總括性概述，TA 分數最高只能拿 Band 5。Overview 只需 2-3 句概括整體趨勢或最主要特徵，絕對不能包含具體數據！',
  },
  {
    step: 3,
    titleZh: '精熟改寫題目 (Paraphrasing the Prompt)',
    summaryZh: '首段必須用同義詞與句型改寫題目。例如將 "The graph shows the number of..." 改寫為 "The provided line chart illustrates changes in the proportion of..."。',
  },
  {
    step: 4,
    titleZh: '學會邏輯分組 (Grouping Information)',
    summaryZh: '切忌像電話簿般流水帳列出所有數字！應將圖表資訊分組為 Body 1 與 Body 2（如按類別、按相似趨勢、按年代或按圖表分組），各段有明確對比。',
  },
  {
    step: 5,
    titleZh: '累積高分專業詞彙庫 (Specialised Vocabulary)',
    summaryZh: '背誦趨勢詞（surge, plummet, plateau）、佔比與倍數（accounted for, twofold）、比較連接詞（whereas, in stark contrast）及流程/地圖專屬語彙。',
  },
];

export const LIZ_TASK1_FATAL_TRAPS = [
  {
    trap: '遺漏 Overview 總結段',
    impact: 'Task Achievement (TA) 評分被限制在 Band 5 以下，無法邁向高分。',
    solution: '在首段改寫後或全文最後單獨寫一段 2 句的高階總結，歸納最大趨勢或極值。',
  },
  {
    trap: '加入個人主觀意見或推測原因',
    impact: 'Task 1 為客觀報告，任何「推測為什麼上漲/下跌」都會直接失分。',
    solution: '只描述圖表上存在的客觀事實與數據，切勿加入 "because people were richer" 等推想。',
  },
  {
    trap: '逐項流水帳列出所有數據',
    impact: '缺乏挑選主要特徵 (select main features) 的能力，損害 TA 與 CC。',
    solution: '挑選起點、終點、最高點、最低點與交叉點，其餘數值作為背景對比即可。',
  },
  {
    trap: '字數不足 150 字或耗時過長',
    impact: '低於 150 字會被罰分；超過 20 分鐘會壓縮到分值兩倍的 Task 2！',
    solution: '目標字數鎖定在 170–190 字，嚴格限時在 20 分鐘內完成。',
  },
];

export const LIZ_TASK1_VISUAL_TYPES: Task1VisualTypeInfo[] = [
  {
    id: 'line_graph',
    titleZh: '折線圖 (Line Graph)',
    titleEn: 'Line Graph - Trends Over Time',
    description: '顯示一個或多個項目隨時間演變的趨勢、波動、最高峰與交會點。',
    overviewTips: '總結整體上升、下降或維持平穩的走勢，並指出起點到終點變化最顯著的線條，不附具體數值。',
    bodyParagraphTips: 'Body 1 描寫起始數值與前半期走勢；Body 2 描寫後半期、交叉點、最高點及最終數據。',
    keyVocabulary: [
      { en: 'soared / surged', zh: '急劇攀升' },
      { en: 'plummeted / dipped', zh: '暴跌 / 微幅下挫' },
      { en: 'fluctuated wildy', zh: '劇烈波動' },
      { en: 'levelled off / plateaued', zh: '趨於平穩' },
      { en: 'reached a peak of', zh: '達到最高峰' },
    ],
    lizGoldenRule: '折線圖首重「趨勢與變化程度」（如 dramatically, steadily, gradually），不可單純報數字。',
  },
  {
    id: 'bar_chart',
    titleZh: '柱狀圖 (Bar Chart)',
    titleEn: 'Bar Chart - Comparisons of Categories',
    description: '比較不同類別或群組在單一或多個時間點的數值差異與排名。',
    overviewTips: '指出哪個類別始終最高、哪個最低，或差距最顯著的群組。',
    bodyParagraphTips: '按排名或相似度分組：Body 1 描寫數值較高的前幾項；Body 2 描寫落後的項目並進行對比。',
    keyVocabulary: [
      { en: 'substantially higher than', zh: '大幅高於' },
      { en: 'in stark contrast to', zh: '形成鮮明對比' },
      { en: 'ranked first / was the dominant', zh: '名列第一 / 居於主導地位' },
      { en: 'lagged behind', zh: '落後於' },
      { en: 'was roughly equal to', zh: '大致相當於' },
    ],
    lizGoldenRule: '柱狀圖核心是「比較語言」（more than, twice as much, whereas, compared to），避免單一重複句式。',
  },
  {
    id: 'pie_chart',
    titleZh: '圓餅圖 (Pie Chart)',
    titleEn: 'Pie Chart - Proportions & Percentages',
    description: '呈現組成百分比與佔比份額（份額加總為 100%）。',
    overviewTips: '找出佔比最大的區塊 (largest share) 與微不足道的份額 (smallest fraction)。',
    bodyParagraphTips: '由大到小順序排列，並使用不同比例句型（如 fraction, proportion, percentage, quarter）。',
    keyVocabulary: [
      { en: 'accounted for / represented', zh: '佔了…的比例' },
      { en: 'comprised the largest share', zh: '佔據最大的份額' },
      { en: 'a negligible fraction', zh: '微不足道的比例' },
      { en: 'more than a third', zh: '超過三分之一' },
      { en: 'constituted roughly half', zh: '構成了大約一半' },
    ],
    lizGoldenRule: '千萬不要只用 "XX% is A, YY% is B"，多轉換分數（a quarter, one in five, the vast majority）。',
  },
  {
    id: 'table',
    titleZh: '數據表格 (Table)',
    titleEn: 'Table - Multi-variable Data Set',
    description: '以欄列呈現大量結構化數值，考驗篩選核心數據與分組歸納能力。',
    overviewTips: '指出整個表格中整體數值最高的一欄/列，或變化幅度最劇烈的項目。',
    bodyParagraphTips: '絕不能照格子從左到右讀！應依照總量高低或性質將表格拆成兩組分別在兩段敘述。',
    keyVocabulary: [
      { en: 'demonstrated an upward pattern', zh: '呈現上升態勢' },
      { en: 'in terms of', zh: '就…而言' },
      { en: 'respectively', zh: '分別地（置於句末）' },
      { en: 'outnumbered', zh: '數量超過' },
    ],
    lizGoldenRule: '表格切忌全報！考官評的是你「選擇主要特徵 (selecting key features)」的能力。',
  },
  {
    id: 'multiple_charts',
    titleZh: '組合圖 (Combined / Multiple Charts)',
    titleEn: 'Combined Charts - Two Different Data Sets',
    description: '同時給出兩種不同圖表（如一個餅圖 + 一個折線圖，或柱狀圖 + 表格）。',
    overviewTips: '必須同時包含圖表一的整體主要特徵，以及圖表二的整體主要特徵，並點出兩者可能關聯。',
    bodyParagraphTips: '結構最單純：Body 1 專注分析圖表一的細節；Body 2 專注分析圖表二，並在結尾作簡要對比。',
    keyVocabulary: [
      { en: 'Regarding the first chart', zh: '關於第一幅圖表' },
      { en: 'Turning to the accompanying graph', zh: '轉向隨附的圖表' },
      { en: 'correlated with', zh: '與…相關聯' },
    ],
    lizGoldenRule: '兩幅圖各用一段主體段最安全清晰，切勿在同一段裡跳躍交雜兩圖數據。',
  },
  {
    id: 'process',
    titleZh: '流程圖 / 循環圖 (Process Diagram)',
    titleEn: 'Process Diagram - Step-by-Step Stages',
    description: '展示工業製造、自然生命週期或系統運作的步驟流程。',
    overviewTips: '指出該流程共包含多少個階段（total steps），從何種原料/起點開始，到何種最終成品/終點結束。',
    bodyParagraphTips: 'Body 1 描寫前半段步驟；Body 2 描寫後半段直至完成。人為製造流程必須使用「被動語態」。',
    keyVocabulary: [
      { en: 'Initially / In the initial stage', zh: '最初階段' },
      { en: 'Following this / Subsequently', zh: '隨後 / 接著' },
      { en: 'is collected / is processed', zh: '被收集 / 被加工（被動）' },
      { en: 'culminates in / final output', zh: '最終產出為…' },
    ],
    lizGoldenRule: '人為流程務必用被動語態（is melted, is transported）；自然循環則多為主動語態。',
  },
  {
    id: 'map',
    titleZh: '地圖與城鎮變遷 (Map / Plans)',
    titleEn: 'Map - Development & Transformations Over Time',
    description: '對比城鎮、學校、港口或設施在不同年份（或過去與未來規劃）的變化。',
    overviewTips: '總結整體的現代化程度、擴建趨勢，或是由綠地/工業轉變為商業/住宅區的主軸。',
    bodyParagraphTips: '按地理方位（北區 vs 南區）或主副設施分兩段描寫；善用方位介詞與建築變更動詞。',
    keyVocabulary: [
      { en: 'was demolished / torn down', zh: '被拆除' },
      { en: 'was replaced by / gave way to', zh: '被…所取代' },
      { en: 'was converted into', zh: '被改造為' },
      { en: 'to the north-east of', zh: '在…的東北方' },
      { en: 'witnessed dramatic modernization', zh: '見證了劇烈的現代化' },
    ],
    lizGoldenRule: '方位詞要準確（in the north of vs to the north of），時態依年份判定（過去式或未來被動式）。',
  },
];

export const LIZ_TASK2_ESSAY_TYPES: Task2EssayTypeInfo[] = [
  {
    id: 'opinion',
    titleZh: '觀點題 (Opinion / Agree or Disagree)',
    titleEn: 'Opinion Essay (To what extent do you agree or disagree?)',
    questionKeywords: ['agree or disagree', 'to what extent do you agree', 'what is your opinion'],
    description: '題目給出一個單一論點，要求你明確回答贊成、反對或有條件的立場。',
    lizStrategy: 'Liz 黃金法則：立場必須從頭到尾完全一致！在首段 Introduction 即給出明確 Thesis Statement，主體兩段分別給出兩個支撐你立場的獨立有力論點，結論段再次重申。',
    paragraphStructure: [
      {
        paragraph: 'Paragraph 1: Introduction',
        focus: '題目改寫 + 明確立場 (Thesis Statement)',
        tips: '改寫題幹背景，並用一句話清楚表明 "I completely agree/disagree that..."，切忌在此曖昧不清。',
      },
      {
        paragraph: 'Paragraph 2: Body Paragraph 1',
        focus: '第一個支持立場的核心理由 (PEEL)',
        tips: '主題句 (Topic sentence) -> 深入解釋 (Explanation) -> 具體事例 (Example) -> 結論扣題 (Link)。',
      },
      {
        paragraph: 'Paragraph 3: Body Paragraph 2',
        focus: '第二個支持立場的核心理由 (PEEL)',
        tips: '從另一個維度（如經濟、個人發展或社會效益）提供第二個強而有力的論證與實例。',
      },
      {
        paragraph: 'Paragraph 4: Conclusion',
        focus: '重申立場與歸納兩個理由',
        tips: '換句話說重申你的觀點，濃縮 Body 1 & 2 的主旨，絕對不要提出任何未討論過的新論點！',
      },
    ],
    sampleTemplatePhrases: [
      {
        phase: '表達立場',
        phrases: [
          'I firmly agree with this view because...',
          'I completely disagree with this assertion for two main reasons.',
          'While there are certain merits to this perspective, I largely disagree that...',
        ],
      },
      {
        phase: '展開論點',
        phrases: [
          'The primary justification for my stance is that...',
          'Furthermore, another compelling factor is...',
          'A prime illustration of this can be seen in...',
        ],
      },
    ],
    lizGoldenRule: '永遠不要到了結論段才第一次表態！Liz 提醒：若 Introduction 沒有給出 clear position，TA 分數將被拉低。',
  },
  {
    id: 'discussion',
    titleZh: '雙邊討論題 (Discuss Both Views and Give Your Opinion)',
    titleEn: 'Discussion Essay (Discuss both views and give your opinion)',
    questionKeywords: ['discuss both views and give your opinion', 'discuss both sides'],
    description: '題幹給出兩種不同（甚至對立）的群體觀點，要求你客觀探討兩造論點，並給出你自己的選擇與立場。',
    lizStrategy: 'Liz 黃金法則：必須「公平且深入地討論兩方觀點」！不能只花兩句帶過你不贊成的一方。在首段表明立場，Body 1 探討 View A 為何有人支持，Body 2 探討 View B 為何有人支持以及為何你偏向該側，結論段總結。',
    paragraphStructure: [
      {
        paragraph: 'Paragraph 1: Introduction',
        focus: '改寫題目雙方觀點 + 透露個人立場',
        tips: '指出社會上對該議題存在兩種觀點，並點明你支持哪一方（或認為兩者需取得平衡）。',
      },
      {
        paragraph: 'Paragraph 2: Body Paragraph 1',
        focus: '探討觀點 A (View A) 及支持者理由',
        tips: '以 "On the one hand, proponents of ... argue that..." 開頭，深入闡述對方的合理根據與事例。',
      },
      {
        paragraph: 'Paragraph 3: Body Paragraph 2',
        focus: '探討觀點 B (View B) 及為何你支持它',
        tips: '以 "On the other hand, I side with those who believe..." 開頭，提出更強大的論據壓過 View A。',
      },
      {
        paragraph: 'Paragraph 4: Conclusion',
        focus: '平衡總結兩派視角 + 堅定重申立場',
        tips: '總結 View A 雖有其價值，但 View B 長遠更為關鍵，完成雙邊討論。',
      },
    ],
    sampleTemplatePhrases: [
      {
        phase: '探討第一方',
        phrases: [
          'On the one hand, supporters of this notion maintain that...',
          'This perspective is grounded in the belief that...',
        ],
      },
      {
        phase: '探討第二方及個人立場',
        phrases: [
          'On the other hand, it is argued that... and I concur with this viewpoint.',
          'Nevertheless, I would argue that the benefits of ... are far more substantial.',
        ],
      },
    ],
    lizGoldenRule: '「雙邊都必須有充足論證」！若只花篇幅寫自己的一方，考官會判定為未完全回應題目 (Incomplete task response)。',
  },
  {
    id: 'advantages_disadvantages',
    titleZh: '利弊題 (Advantages & Disadvantages)',
    titleEn: 'Advantages and Disadvantages Essay',
    questionKeywords: ['advantages and disadvantages', 'outweigh the disadvantages', 'positive or negative development'],
    description: '探討某種現象或趨勢所帶來的正面與負面效應。分為「單純列舉利弊」與「權衡是否利大於弊」兩種變體。',
    lizStrategy: 'Liz 黃金法則：如果是 "Do advantages outweigh disadvantages?"，你必須明確選邊（例如利大於弊），並在主體段落透過深度的對比論證，讓讀者看出優勢確實壓倒劣勢。',
    paragraphStructure: [
      {
        paragraph: 'Paragraph 1: Introduction',
        focus: '改寫題幹趨勢 + 宣示利弊權衡結果',
        tips: '明確點出該趨勢雖有缺點，但我堅信優點更為深遠（或反之）。',
      },
      {
        paragraph: 'Paragraph 2: Body Paragraph 1',
        focus: '分析缺點 / 負面影響 (Drawbacks)',
        tips: '探討 1-2 個不可忽視的缺點（如成本過高或隱私顧慮），展現客觀思辨。',
      },
      {
        paragraph: 'Paragraph 3: Body Paragraph 2',
        focus: '分析更顯著的優勢 / 正面價值 (Advantages)',
        tips: '提出 2 個更具決定性的優勢，論證為何這些優點長遠來看勝過上述缺點。',
      },
      {
        paragraph: 'Paragraph 4: Conclusion',
        focus: '總結利弊對照 + 判定勝出側',
        tips: '總括雙邊影響，給出最終定論。',
      },
    ],
    sampleTemplatePhrases: [
      {
        phase: '引導句型',
        phrases: [
          'While there are noticeable drawbacks associated with ..., I firmly believe that the merits far outweigh them.',
          'One major downside of this trend is...',
          'In contrast, the advantages in terms of ... are much more profound.',
        ],
      },
    ],
    lizGoldenRule: '若題目問 "outweigh"，切勿寫成各打五十大板的五五開！必須展現一方重於另一方的論述力量。',
  },
  {
    id: 'problem_solution',
    titleZh: '問題與解決方案題 (Causes / Problems & Solutions)',
    titleEn: 'Problem & Solution / Cause & Effect Essay',
    questionKeywords: ['what problems does this cause', 'what solutions', 'what are the causes', 'how to solve'],
    description: '針對社會問題，要求剖析背後的肇因 (Causes) 或引發的後果 (Problems)，並提出可行的應對策略 (Solutions)。',
    lizStrategy: 'Liz 黃金法則：Body 2 提出的解決方案，必須「100% 精準對應」Body 1 提到的具體肇因！切勿 Body 1 說原因 A，Body 2 卻提出了解決原因 B 的空泛口號。',
    paragraphStructure: [
      {
        paragraph: 'Paragraph 1: Introduction',
        focus: '改寫問題現象 + 概述有成因與有效對策',
        tips: '指出該問題已日趨嚴峻，其背後有諸多主因，但可透過針對性措施加以緩解。',
      },
      {
        paragraph: 'Paragraph 2: Body Paragraph 1',
        focus: '分析 1–2 個關鍵肇因或嚴重問題',
        tips: '具體剖析成因（如政策不足、生活型態改變），說明為何導致此危機。',
      },
      {
        paragraph: 'Paragraph 3: Body Paragraph 2',
        focus: '提出精準對應的 1–2 個具體解方',
        tips: '明確責任歸屬（政府立法、學校教育、科技引進、個人意識），直接破解 Body 1 的痛點。',
      },
      {
        paragraph: 'Paragraph 4: Conclusion',
        focus: '總結問題的緊迫性與對策展望',
        tips: '重申若能落實上述對策，該難題將可得到妥善解決。',
      },
    ],
    sampleTemplatePhrases: [
      {
        phase: '分析原因與解方',
        phrases: [
          'A leading factor contributing to this crisis is...',
          'To tackle this issue effectively, governments must implement...',
          'Another viable solution lies in raising public awareness through...',
        ],
      },
    ],
    lizGoldenRule: '解決方案不可過度天馬行空！Liz 建議提出「務實、可操作、有主詞」（如 local authorities should...）的解方。',
  },
  {
    id: 'direct_questions',
    titleZh: '雙問號 / 複合直接提問 (Two-Part Direct Questions)',
    titleEn: 'Two-Part Questions (Double Question Essay)',
    questionKeywords: ['two questions', 'why is this', 'is this a positive', 'how can'],
    description: '題目包含兩個獨立的問號（如「為什麼會發生這種情況？這是一件好事還是壞事？」）。',
    lizStrategy: 'Liz 黃金法則：一問一段！Body 1 完整回答 Question 1；Body 2 完整回答 Question 2。兩段篇幅務必均等，首尾段都必須簡述兩個問題的解答。',
    paragraphStructure: [
      {
        paragraph: 'Paragraph 1: Introduction',
        focus: '改寫情境背景 + 用一句話同時回應兩個問題',
        tips: '提供清晰的 Roadmap，向考官預告文章將如何分別解答這兩道提問。',
      },
      {
        paragraph: 'Paragraph 2: Body Paragraph 1',
        focus: '深入且完整回答第 1 個問題',
        tips: '提出核心原因或背景解釋，搭配說明與例證，完全聚焦在 Question 1。',
      },
      {
        paragraph: 'Paragraph 3: Body Paragraph 2',
        focus: '深入且完整回答第 2 個問題',
        tips: '明確回答 Question 2（如正面還是負面發展），並給出完整論證與例子。',
      },
      {
        paragraph: 'Paragraph 4: Conclusion',
        focus: '分別重申兩個問題的答案',
        tips: '兩句話分別濃縮 Q1 與 Q2 的解答核心，完美收尾。',
      },
    ],
    sampleTemplatePhrases: [
      {
        phase: '回答兩部問題',
        phrases: [
          'This essay will examine the reasons behind this phenomenon and evaluate why it represents a beneficial shift.',
          'Regarding the causes of this situation, it primarily stems from...',
          'In terms of its broader impact, I consider this to be predominantly positive because...',
        ],
      },
    ],
    lizGoldenRule: '切記不可漏答其中任何一個問號！漏答任何一問，Task Response 將直接被判不及格。',
  },
];

export const LIZ_PLANNING_STEPS = [
  {
    minute: '第 1-2 分鐘',
    titleZh: '審題與劃關鍵字 (Analyze & Highlight)',
    descZh: '仔細閱讀題幹，圈出核心話題 (Topic)、限制條件 (Focus/Context) 及提問指令 (Question words)。立即判定屬於 Liz 5 大題型中的哪一種！',
  },
  {
    minute: '第 3-4 分鐘',
    titleZh: '腦力激盪 2 個優質論點 (Brainstorm 2 Main Ideas)',
    descZh: '不要想太多論點！每段只需要 1 個深刻且容易用英文解釋的 Main Idea。為每個論點配上具體的 Why (原因) 與 Example (例子)。',
  },
  {
    minute: '第 5 分鐘',
    titleZh: '確認立場與大綱架構 (Decide Stance & Structure)',
    descZh: '決定 Introduction 的立場句。確認 Body 1 與 Body 2 的主題句與銜接詞。大綱完成後才動筆，下筆如有神！',
  },
];

export const LIZ_PARAGRAPH_PEEL_FORMULA = {
  p: { letter: 'P', name: 'Point (主題句)', desc: '第一句開門見山，指出該段的核心論點。' },
  e1: { letter: 'E', name: 'Explain (深入解釋)', desc: '第二、三句解釋「為什麼會這樣」、「邏輯因果是什麼」。' },
  e2: { letter: 'E', name: 'Example (具體實例)', desc: '第四句舉出生活、學術或具體調查案例來佐證。' },
  l: { letter: 'L', name: 'Link (小結扣題)', desc: '最後一句將論點重新連結回題目的核心問題。' },
};
