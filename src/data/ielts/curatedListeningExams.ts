export interface IELTSListeningQuestion {
  id: string;
  questionNumber: number;
  type: 'fill_blank' | 'choice' | 'matching';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanationZh: string;
  locatingSentence: string;
}

export interface IELTSListeningExam {
  id: string;
  title: string;
  section: 'Section 1' | 'Section 2' | 'Section 3' | 'Section 4';
  topic: string;
  description: string;
  audioPrompt: string;
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
  questions: IELTSListeningQuestion[];
}

export const CURATED_IELTS_LISTENING_EXAMS: IELTSListeningExam[] = [
  {
    id: 'ielts_listen_sec1_rental',
    title: 'Cambridge Practice: Student Accommodation Registration',
    section: 'Section 1',
    topic: 'Everyday Social Context: Housing & Tenancy',
    description: 'A conversation between a university international student advisor and an overseas applicant booking student dormitory accommodation.',
    audioPrompt: 'You will hear a conversation between an accommodation officer and a student looking for a room. First you have some time to look at Questions 1 to 5.',
    audioScript: `Officer: Good morning. Welcome to the University Accommodation Service. How can I help you today?
Student: Hello. I am an incoming postgraduate student from Taiwan, and I would like to register for university-managed accommodation for the upcoming autumn term.
Officer: Certainly. Let me take down a few essential details first. Could I have your full name and student identification number, please?
Student: Yes, my name is Wei-Ling Chen, and my student ID is ST-84920.
Officer: Thank you. And what degree program will you be studying?
Student: I will be enrolled in the Master of Environmental Engineering program.
Officer: Excellent. Now, regarding room types, we offer three main categories: standard single rooms with shared bathroom, en-suite rooms with private shower, and studio apartments with individual kitchenettes. What would be your preference?
Student: I definitely prefer an en-suite room. Having a private shower is really important for my study habits.
Officer: Understood. Our en-suite halls are located primarily on West Campus and Meadow Park. Meadow Park is slightly closer to the engineering faculty, approximately a fifteen-minute walk or a five-minute bicycle ride.
Student: Meadow Park sounds very convenient. What is the weekly rental fee for that?
Officer: For the standard academic contract of 40 weeks, Meadow Park en-suite is 185 pounds per week, which includes all utility bills and high-speed internet access. However, please note that there is a refundable deposit of 300 pounds required upon contract signing.
Student: That fits within my monthly budget. Is there a communal kitchen on each floor?
Officer: Yes, every floor has a shared kitchen equipped with two ovens, two large refrigerators, and private lockable food storage cabinets. Also, laundry facilities are available in the basement operating via a smartphone application.
Student: That sounds wonderful. How soon will I receive the formal confirmation?
Officer: We will send an email notification with the tenancy agreement within three business days. Please ensure you confirm your acceptance within 48 hours.
Student: Thank you so much for your assistance!`,
    sentences: [
      {
        en: 'Good morning. Welcome to the University Accommodation Service.',
        zh: '早安，歡迎來到大學住宿服務中心。',
        focusWords: ['accommodation'],
      },
      {
        en: 'I definitely prefer an en-suite room with a private shower.',
        zh: '我非常偏好附有獨立衛浴的套房。',
        focusWords: ['en-suite', 'preference'],
      },
      {
        en: 'Meadow Park is approximately a fifteen-minute walk or a five-minute bicycle ride.',
        zh: 'Meadow Park 步行約 15 分鐘，或騎單車 5 分鐘。',
        focusWords: ['approximately', 'convenient'],
      },
      {
        en: 'Meadow Park en-suite is 185 pounds per week, which includes all utility bills.',
        zh: 'Meadow Park 套房每週 185 英鎊，已包含所有水電雜費。',
        focusWords: ['utility', 'deposit'],
      },
      {
        en: 'Please ensure you confirm your acceptance within 48 hours.',
        zh: '請確保您在 48 小時內確認接受。',
        focusWords: ['confirmation', 'tenancy'],
      },
    ],
    vocabularyList: [
      { word: 'accommodation', definition: '住宿；膳宿設施' },
      { word: 'en-suite', definition: '套房（附設獨立私人衛浴之臥房）' },
      { word: 'utility bills', definition: '水電瓦斯公用事業費用' },
      { word: 'refundable deposit', definition: '可退還的押金' },
      { word: 'tenancy agreement', definition: '租賃契約協議' },
    ],
    questions: [
      {
        id: 'q1',
        questionNumber: 1,
        type: 'fill_blank',
        prompt: 'Student ID number: ST-________',
        correctAnswer: '84920',
        explanationZh: '對話中學生清晰報出其學號為 ST-84920。',
        locatingSentence: 'Yes, my name is Wei-Ling Chen, and my student ID is ST-84920.',
      },
      {
        id: 'q2',
        questionNumber: 2,
        type: 'fill_blank',
        prompt: 'Preferred room type: ________ room (with private bathroom)',
        correctAnswer: 'en-suite',
        explanationZh: '學生明確表示偏好 en-suite（獨立套房）。',
        locatingSentence: 'I definitely prefer an en-suite room. Having a private shower is really important for my study habits.',
      },
      {
        id: 'q3',
        questionNumber: 3,
        type: 'fill_blank',
        prompt: 'Selected residential hall location: ________ Park',
        correctAnswer: 'Meadow',
        explanationZh: '宿舍區域名稱為 Meadow Park，距離工學院步行約 15 分鐘。',
        locatingSentence: 'Our en-suite halls are located primarily on West Campus and Meadow Park.',
      },
      {
        id: 'q4',
        questionNumber: 4,
        type: 'fill_blank',
        prompt: 'Weekly rent is £________ (all utility bills included)',
        correctAnswer: '185',
        explanationZh: '每週租金為 185 英鎊，包含所有水電雜費。',
        locatingSentence: 'Meadow Park en-suite is 185 pounds per week, which includes all utility bills.',
      },
      {
        id: 'q5',
        questionNumber: 5,
        type: 'choice',
        prompt: 'How must the student confirm the tenancy agreement upon receiving the notification?',
        options: [
          'Visit the housing office in person within 24 hours',
          'Confirm acceptance within 48 hours',
          'Pay the entire term rent in advance by cash',
          'Mail a physical handwritten agreement',
        ],
        correctAnswer: 'Confirm acceptance within 48 hours',
        explanationZh: '職員告知須在收到電郵後的 48 小時內確認接受。',
        locatingSentence: 'We will send an email notification with the tenancy agreement within three business days. Please ensure you confirm your acceptance within 48 hours.',
      },
    ],
  },
  {
    id: 'ielts_listen_sec2_campus_facility',
    title: 'Cambridge Practice: Community Green Energy Project',
    section: 'Section 2',
    topic: 'General Public Monologue: Sustainability & Public Infrastructure',
    description: 'A local project coordinator introducing an eco-friendly rooftop solar initiative and waste-reduction workshops to community members.',
    audioPrompt: 'You will hear a talk given by a local council representative introducing the new Community Eco-Hub project. Look at Questions 1 to 5.',
    audioScript: `Good evening everyone, and thank you for attending tonight's briefing on the Riverside Community Eco-Hub initiative. Over the past eighteen months, our municipal council has worked in collaboration with local environmental engineers to transform the former industrial warehouse near the canal into an educational and practical sustainability center.
Our primary achievement has been the installation of 120 high-efficiency solar photovoltaic panels on the south-facing roof. These panels generate sufficient electrical power to sustain not only the lighting and climate control systems of the entire hub, but also supply surplus renewable electricity back to the municipal power grid during peak summer daylight hours.
In addition to clean energy generation, the center provides community workshops every Saturday morning. The most popular workshop among families is our home composting course, which instructs residents on how to convert kitchen organic food scraps into nutrient-rich soil conditioner, reducing domestic landfill waste by up to 40 percent.
Furthermore, we have established a community repair cafe adjacent to the main foyer. Instead of discarding broken household appliances such as toasters, vacuum cleaners, and electronic gadgets, residents can bring them in, where volunteer technicians inspect and repair them free of charge. You only cover the minimal cost of replacement parts.
Finally, please note that admission to the exhibition gallery is free of charge all year round, while registration for specific weekend masterclasses opens on the first Monday of each month via our council website. We warmly invite all of you to become volunteer ambassadors for this greener tomorrow!`,
    sentences: [
      {
        en: 'Our primary achievement has been the installation of 120 high-efficiency solar panels.',
        zh: '我們最主要的成就是在朝南屋頂上安裝了 120 片高效太陽能板。',
        focusWords: ['photovoltaic', 'achievement'],
      },
      {
        en: 'The home composting course teaches residents how to convert food scraps into nutrient-rich soil.',
        zh: '家庭堆肥課程指導居民如何將廚餘轉化為富含有機質的土壤改良劑。',
        focusWords: ['composting', 'organic'],
      },
      {
        en: 'Volunteer technicians inspect and repair broken household appliances free of charge.',
        zh: '志工技術人員免費檢查並維修壞掉的家用電器。',
        focusWords: ['appliances', 'technicians'],
      },
      {
        en: 'Registration for specific weekend masterclasses opens on the first Monday of each month.',
        zh: '特定週末大師班的報名於每月第一個週一在官網開放。',
        focusWords: ['registration', 'masterclasses'],
      },
    ],
    vocabularyList: [
      { word: 'photovoltaic', definition: '太陽能光伏的' },
      { word: 'surplus', definition: '過剩的；盈餘的' },
      { word: 'composting', definition: '堆肥處理' },
      { word: 'landfill waste', definition: '垃圾掩埋場廢棄物' },
      { word: 'free of charge', definition: '免費' },
    ],
    questions: [
      {
        id: 'q1',
        questionNumber: 1,
        type: 'fill_blank',
        prompt: 'Number of solar photovoltaic panels installed on the roof: ________',
        correctAnswer: '120',
        explanationZh: '演講明確指出在朝南屋頂上安裝了 120 片高效太陽能光伏板。',
        locatingSentence: 'Our primary achievement has been the installation of 120 high-efficiency solar photovoltaic panels on the south-facing roof.',
      },
      {
        id: 'q2',
        questionNumber: 2,
        type: 'choice',
        prompt: 'What happens to the excess electricity generated during peak summer days?',
        options: [
          'It is stored solely in emergency underground batteries',
          'It is supplied back into the municipal power grid',
          'It is used to heat the community swimming pool',
          'It is sold to private foreign energy corporations',
        ],
        correctAnswer: 'It is supplied back into the municipal power grid',
        explanationZh: '演講提到剩餘的多餘再生電力會回饋輸送到市政電網。',
        locatingSentence: '...but also supply surplus renewable electricity back to the municipal power grid during peak summer daylight hours.',
      },
      {
        id: 'q3',
        questionNumber: 3,
        type: 'fill_blank',
        prompt: 'The home composting workshop can reduce domestic landfill waste by up to ________ percent.',
        correctAnswer: '40',
        explanationZh: '家庭廚餘堆肥課程可幫助家庭減少高達 40% 的掩埋場垃圾。',
        locatingSentence: '...reducing domestic landfill waste by up to 40 percent.',
      },
      {
        id: 'q4',
        questionNumber: 4,
        type: 'choice',
        prompt: 'What fee must residents pay when bringing broken appliances to the Repair Cafe?',
        options: [
          'A fixed hourly labor charge of twenty pounds',
          'Only the minimal cost of replacement parts',
          'An annual membership fee',
          'Nothing at all, all parts and labor are completely subsidized',
        ],
        correctAnswer: 'Only the minimal cost of replacement parts',
        explanationZh: '維修志工技術服務免費，居民僅需支付更換零件的最低成本。',
        locatingSentence: '...where volunteer technicians inspect and repair them free of charge. You only cover the minimal cost of replacement parts.',
      },
      {
        id: 'q5',
        questionNumber: 5,
        type: 'fill_blank',
        prompt: 'Registration for masterclasses opens on the first ________ of each month.',
        correctAnswer: 'Monday',
        explanationZh: '大師班每個月第一個「週一 (Monday)」於官網開放報名。',
        locatingSentence: '...while registration for specific weekend masterclasses opens on the first Monday of each month via our council website.',
      },
    ],
  },
  {
    id: 'ielts_listen_sec3_academic_research',
    title: 'Cambridge Practice: Cognitive Psychology Research Project',
    section: 'Section 3',
    topic: 'Academic Discussion: Memory Retention and Dual Coding Theory',
    description: 'Two undergraduate psychology students consulting their research supervisor about designing an experiment on bilingual memory encoding.',
    audioPrompt: 'You will hear two psychology students, Sarah and Marcus, discussing their experimental methodology with Professor Davies. Look at Questions 1 to 5.',
    audioScript: `Professor Davies: Come on in, Sarah and Marcus. I have reviewed the preliminary research proposal you submitted last Friday on visual-verbal dual coding in second-language acquisition. Overall, your theoretical framework is sound, but your experimental methodology requires several key refinements before ethics approval.
Sarah: Thank you, Professor. We were actually concerned about our participant sampling size. We originally planned to recruit 30 first-year undergraduates.
Professor Davies: Thirty is indeed marginally acceptable for a pilot run, but to achieve robust statistical significance in ANOVA testing, you really should aim for at least 60 participants, divided equally into experimental and control cohorts.
Marcus: That makes sense. Regarding the stimulus materials, we prepared flashcards with abstract vocabulary paired with either photographic images or line drawings.
Professor Davies: Good. But remember, the duration of stimulus exposure is critical. If participants view the word-image pair for too long—say ten seconds—they will engage in spontaneous rehearsal strategies that confound the retention measurement. I strongly recommend setting the presentation interval to exactly three seconds per slide.
Sarah: Three seconds, noted. And for the delayed recall test, should we administer it immediately or wait twenty-four hours?
Professor Davies: A split methodology is ideal. Administer a free-recall test fifteen minutes post-exposure to assess working memory encoding, followed by an unannounced recognition test 48 hours later to measure long-term semantic consolidation.
Marcus: What about confounding variables like prior language proficiency?
Professor Davies: That is the crucial caveat. You must screen all candidates using the standardized Oxford Placement Test before experimental trials. Anyone scoring above the C1 CEFR threshold must be excluded to prevent ceiling effects.
Sarah: Perfect. We will update the protocol document by Wednesday morning.`,
    sentences: [
      {
        en: 'Your theoretical framework is sound, but your experimental methodology requires several refinements.',
        zh: '你們的理論框架很扎實，但實驗方法在獲得倫理審批前需要幾項關鍵修正。',
        focusWords: ['methodology', 'refinements'],
      },
      {
        en: 'You really should aim for at least 60 participants, divided equally into two cohorts.',
        zh: '你們應該爭取至少 60 名受試者，均分為實驗組與對照組。',
        focusWords: ['cohorts', 'significance'],
      },
      {
        en: 'I strongly recommend setting the presentation interval to exactly three seconds per slide.',
        zh: '我強烈建議將每張投影片的呈現間隔精確設定為 3 秒。',
        focusWords: ['interval', 'stimulus'],
      },
      {
        en: 'Administer an unannounced recognition test 48 hours later to measure long-term consolidation.',
        zh: '48 小時後進行未事先通知的再認測驗，以衡量長期語義固化效果。',
        focusWords: ['consolidation', 'semantic'],
      },
    ],
    vocabularyList: [
      { word: 'methodology', definition: '方法論；實驗方法' },
      { word: 'statistical significance', definition: '統計顯著性' },
      { word: 'cohort', definition: '（統計或實驗中的）隊列；組群' },
      { word: 'confound', definition: '混淆；使混亂（實驗變數）' },
      { word: 'ceiling effect', definition: '天花板效應（分數太高無法區分差距）' },
    ],
    questions: [
      {
        id: 'q1',
        questionNumber: 1,
        type: 'fill_blank',
        prompt: 'Recommended total number of participants for robust statistical significance: ________',
        correctAnswer: '60',
        explanationZh: '教授建議受試者總數至少為 60 人，均分為實驗組與對照組。',
        locatingSentence: '...you really should aim for at least 60 participants, divided equally into experimental and control cohorts.',
      },
      {
        id: 'q2',
        questionNumber: 2,
        type: 'fill_blank',
        prompt: 'Stimulus exposure duration per slide: ________ seconds',
        correctAnswer: '3',
        explanationZh: '教授強烈建議將每張單字圖片投影片的呈現時間設定為 3 秒。',
        locatingSentence: 'I strongly recommend setting the presentation interval to exactly three seconds per slide.',
      },
      {
        id: 'q3',
        questionNumber: 3,
        type: 'choice',
        prompt: 'Why does Professor Davies advise against a 10-second stimulus display?',
        options: [
          'Participants will experience severe visual fatigue',
          'It will trigger spontaneous rehearsal strategies that bias retention data',
          'The computer software cannot record responses after 5 seconds',
          'It violates ethical laboratory guidelines',
        ],
        correctAnswer: 'It will trigger spontaneous rehearsal strategies that bias retention data',
        explanationZh: '若時間長達 10 秒，受試者會自發進行心智複誦，干擾實驗對記憶保留率的客觀測量。',
        locatingSentence: 'If participants view the word-image pair for too long—say ten seconds—they will engage in spontaneous rehearsal strategies that confound the retention measurement.',
      },
      {
        id: 'q4',
        questionNumber: 4,
        type: 'fill_blank',
        prompt: 'The delayed long-term semantic recognition test should be administered ________ hours after exposure.',
        correctAnswer: '48',
        explanationZh: '長期語義再認測驗應在 48 小時後無預警施測。',
        locatingSentence: '...followed by an unannounced recognition test 48 hours later to measure long-term semantic consolidation.',
      },
      {
        id: 'q5',
        questionNumber: 5,
        type: 'choice',
        prompt: 'Why must candidates scoring above C1 on the placement test be excluded?',
        options: [
          'To ensure all participants speak only English as native speakers',
          'To avoid ceiling effects that hinder differentiation',
          'Because higher level learners refuse to participate in research',
          'To comply with departmental scholarship rules',
        ],
        correctAnswer: 'To avoid ceiling effects that hinder differentiation',
        explanationZh: '排除 C1 以上的高能力學員是為了防止「天花板效應 (ceiling effects)」。',
        locatingSentence: 'Anyone scoring above the C1 CEFR threshold must be excluded to prevent ceiling effects.',
      },
    ],
  },
  {
    id: 'ielts_listen_sec4_marine_biomimicry',
    title: 'Cambridge Practice: Marine Biomimicry & Architectural Engineering',
    section: 'Section 4',
    topic: 'Academic Monologue: Biomimicry in Architecture',
    description: 'A university lecture exploring how modern structural engineering draws inspiration from deep-sea organisms and coral reef geometry.',
    audioPrompt: 'You will hear part of an architectural engineering lecture on biomimicry inspired by marine life. Look at Questions 1 to 5.',
    audioScript: `Good afternoon, students. Today we continue our series on biomimetic architecture by examining how structural engineers are looking to marine organisms to solve complex mechanical challenges on land. For decades, traditional architecture relied on brute strength—pouring thicker concrete slabs and anchoring heavier steel girders. However, marine creatures have evolved over hundreds of millions of years to achieve maximum structural resilience with minimal material volume.
Consider the venus flower basket, a deep-sea glass sponge that inhabits the abyssal Pacific depths. Despite being composed almost entirely of fragile amorphous silica, its skeleton can endure tremendous hydrostatic pressures exceeding 6,000 meters below sea level without buckling.
Microscopic analysis reveals that the sponge employs a hierarchical lattice framework. Rather than a simple square grid, its cylindrical wall features a diagonal cross-bracing pattern with alternating square chambers. Recent wind tunnel simulations conducted in Tokyo demonstrated that applying this identical diagonal lattice to skyscraper designs reduces aerodynamic drag and wind-induced sway by up to 25 percent compared to conventional tubular towers.
Another remarkable paradigm is found in coral reef calcification. Marine biologists and chemical engineers in San Francisco have synthesized a novel cement manufacturing technique that mimics the chemical process corals use to convert dissolved seawater carbon dioxide into solid calcium carbonate. While conventional Portland cement produces approximately one ton of greenhouse emissions for every ton manufactured, this bio-mimetic cement actively sequesters carbon during its curing process, essentially rendering building foundations a permanent carbon sink.
In next week's seminar, we will examine shark denticles and their application to hydraulic pipeline turbulence reduction. Please ensure you complete the reading on chapter 14 beforehand.`,
    sentences: [
      {
        en: 'Marine creatures have evolved to achieve maximum structural resilience with minimal material volume.',
        zh: '海洋生物歷經億萬年演化，以極小的材料體積實現了最大的結構彈性與韌性。',
        focusWords: ['resilience', 'biomimetic'],
      },
      {
        en: 'The sponge features a diagonal cross-bracing pattern that withstands tremendous hydrostatic pressure.',
        zh: '該海綿具有對角交叉支撐結構，能夠承受巨大的深海靜水壓力。',
        focusWords: ['hydrostatic', 'cross-bracing'],
      },
      {
        en: 'Applying this diagonal lattice to skyscraper designs reduces aerodynamic drag by 25 percent.',
        zh: '將這種對角晶格應用於摩天大樓設計，可將空氣動力阻力減少達 25%。',
        focusWords: ['aerodynamic', 'lattice'],
      },
      {
        en: 'This bio-mimetic cement actively sequesters carbon, making building foundations a permanent carbon sink.',
        zh: '這種仿生水泥在固化過程中能主動封存碳，使建築地基成為永久的碳匯。',
        focusWords: ['sequesters', 'calcification'],
      },
    ],
    vocabularyList: [
      { word: 'biomimicry', definition: '仿生學；仿生技術' },
      { word: 'hydrostatic pressure', definition: '流體靜力學壓力' },
      { word: 'aerodynamic drag', definition: '空氣動力學阻力' },
      { word: 'carbon sink', definition: '碳匯（吸收並儲存二氧化碳的機制）' },
      { word: 'cross-bracing', definition: '交叉支撐結構' },
    ],
    questions: [
      {
        id: 'q1',
        questionNumber: 1,
        type: 'fill_blank',
        prompt: 'The skeleton of the glass sponge withstands depths exceeding ________ meters.',
        correctAnswer: '6000',
        explanationZh: '演講說明玻璃海綿的骨架能承受超過 6,000 公尺深處的巨大靜水壓力。',
        locatingSentence: '...its skeleton can endure tremendous hydrostatic pressures exceeding 6,000 meters below sea level without buckling.',
      },
      {
        id: 'q2',
        questionNumber: 2,
        type: 'choice',
        prompt: 'What unique architectural pattern does the glass sponge cylindrical wall feature?',
        options: [
          'Solid concrete interlocking hexagonal blocks',
          'A diagonal cross-bracing lattice pattern',
          'Curved ceramic air-cushioned chambers',
          'Pure titanium horizontal beams',
        ],
        correctAnswer: 'A diagonal cross-bracing lattice pattern',
        explanationZh: '該海綿的圓柱外壁特點為對角交叉支撐晶格圖案 (diagonal cross-bracing pattern)。',
        locatingSentence: 'Rather than a simple square grid, its cylindrical wall features a diagonal cross-bracing pattern with alternating square chambers.',
      },
      {
        id: 'q3',
        questionNumber: 3,
        type: 'fill_blank',
        prompt: 'Applying the sponge structure to skyscrapers reduces aerodynamic drag and sway by up to ________ percent.',
        correctAnswer: '25',
        explanationZh: '將此結構應用於摩天大樓可將風阻與擺動幅度減少高達 25%。',
        locatingSentence: '...reduces aerodynamic drag and wind-induced sway by up to 25 percent compared to conventional tubular towers.',
      },
      {
        id: 'q4',
        questionNumber: 4,
        type: 'choice',
        prompt: 'How does the bio-mimetic cement process compare to traditional Portland cement?',
        options: [
          'It costs four times more to manufacture in factories',
          'It actively sequesters carbon dioxide rather than emitting tons of greenhouse gas',
          'It dissolves instantly in water',
          'It requires nuclear heat to cure properly',
        ],
        correctAnswer: 'It actively sequesters carbon dioxide rather than emitting tons of greenhouse gas',
        explanationZh: '傳統波特蘭水泥每生產一噸約產生一噸溫室氣體，而仿生水泥在固化過程中主動封存碳。',
        locatingSentence: 'While conventional Portland cement produces approximately one ton of greenhouse emissions for every ton manufactured, this bio-mimetic cement actively sequesters carbon...',
      },
      {
        id: 'q5',
        questionNumber: 5,
        type: 'fill_blank',
        prompt: 'Topic for next week seminar: shark denticles for reducing turbulence in hydraulic ________.',
        correctAnswer: 'pipeline',
        explanationZh: '下週研討會主題為鯊魚皮微齒在水力管道 (pipeline) 減少亂流的應用。',
        locatingSentence: "In next week's seminar, we will examine shark denticles and their application to hydraulic pipeline turbulence reduction.",
      },
    ],
  },
];
