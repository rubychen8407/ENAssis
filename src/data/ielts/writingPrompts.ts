export type WritingPromptTask = 'task1' | 'task2';

export interface IELTSWritingPrompt {
  id: string;
  title: string;
  task: WritingPromptTask;
  prompt: string;
  imageUrl?: string;
  sourceUrl: string;
  sourceLabel: string;
  notes: string;
  pdfPage?: number;
  sampleUrl?: string;
  sampleBand?: number;
}

const REPO_RAW_BASE = 'https://raw.githubusercontent.com/zeeklog/IELTS/master/';
const CASES_BASE = `${REPO_RAW_BASE}雅思作文案例/`;
const IMAGES_BASE = `${CASES_BASE}images/`;
const WRITING_PDF_SOURCE = `${REPO_RAW_BASE}雅思作文资料/2022年1-4月大作文真题范文.pdf`;
const TASK1_PDF_SOURCE = `${REPO_RAW_BASE}雅思作文资料/剑桥图表题大全.pdf`;

export const IELTS_WRITING_PROMPTS: IELTSWritingPrompt[] = [
  {
    id: 'porth-harbour-cambridge-19',
    title: 'Porth Harbour: 2000 與現在的變化',
    task: 'task1',
    prompt: 'The plans below show a harbour in 2000 and how it looks today. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imageUrl: `${IMAGES_BASE}港口对比图.png`,
    sourceUrl: `${CASES_BASE}港口变化对比-剑桥19.md`,
    sourceLabel: '港口變化對比-劍橋19.md',
    notes: 'Map 題型：先概述主要新增、替換與位置變化，再按區域整理細節。',
  },
  {
    id: 'social-centre-cambridge-19',
    title: 'Social Centre 活動參與人數',
    task: 'task1',
    prompt: 'The graph below gives information on the number of participants for different activities at one social centre in Melbourne, Australia for the period 2000 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imageUrl: `${IMAGES_BASE}社交中心活动图.png`,
    sourceUrl: `${CASES_BASE}社交中心活动参与-剑桥19.md`,
    sourceLabel: '社交中心活動參與-劍橋19.md',
    notes: 'Line graph 題型：Overview 應比較最高、最低與明顯趨勢，不必逐年描述。',
  },
  {
    id: 'uk-fast-food-line-graph',
    title: 'UK 三種速食消費量',
    task: 'task1',
    prompt: 'The graph gives information about the consumption of three types of fast food, in grams per week, in the UK from 1970 to 1990. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imageUrl: `${IMAGES_BASE}英国快餐消费图.png`,
    sourceUrl: `${CASES_BASE}折线图范文.md`,
    sourceLabel: '折線圖範文.md',
    notes: 'Line graph 題型：比較起點、終點與交叉趨勢，集中在 major changes。',
  },
  {
    id: 'canada-graduates-line-graph',
    title: '加拿大大學畢業生人數',
    task: 'task1',
    prompt: 'The graph shows the number of male and female university graduates in Canada from 1992 to 2007. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    imageUrl: `${IMAGES_BASE}加拿大毕业生图.png`,
    sourceUrl: `${CASES_BASE}折线图范文.md`,
    sourceLabel: '折線圖範文.md',
    notes: 'Line graph 題型：留意男女數據的整體差距、波動與最後比較。',
  },
  {
    id: 'task2-opinion-practice',
    title: 'Opinion essay 練習題',
    task: 'task2',
    prompt: 'Some people believe that schools should focus more on practical skills than academic subjects. To what extent do you agree or disagree?',
    sourceUrl: 'https://github.com/zeeklog/IELTS/tree/master/雅思作文资料',
    sourceLabel: 'zeeklog/IELTS 寫作資料',
    notes: 'Task 2 練習：明確表達立場，每個主體段落用理由與具體例子發展。',
  },
  {
    id: 'task2-2022-01-08', title: '2022.01.08 大學教育與成功', task: 'task2',
    prompt: 'Some people say that the best way to be successful is to get a university education. Others disagree and think that nowadays this is not true. Discuss both views and give your own opinion.',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '討論雙方觀點並提出自己的立場。',
  },
  {
    id: 'task2-2022-01-15', title: '2022.01.15 社群媒體的利弊', task: 'task2',
    prompt: 'Nowadays many people use social media every day to keep in touch with others and news events. Do you think the advantages outweigh the disadvantages?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '利弊分析：比較社交連結與假消息等風險。',
  },
  {
    id: 'task2-2022-01-20', title: '2022.01.20 國際交流與國家認同', task: 'task2',
    prompt: 'Some people think the increasing business and cultural contact between countries brings many positive effects. Others say it causes the loss of national identities. Discuss both views and give your own opinion.',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '討論全球交流的正面影響與文化認同流失。',
  },
  {
    id: 'task2-2022-01-22', title: '2022.01.22 兒童肥胖與政府責任', task: 'task2',
    prompt: 'In many countries, children are becoming overweight and unhealthy. Some people think that it is the government’s responsibility. To what extent do you agree or disagree?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '觀點題：評估政府、家庭與個人的責任。',
  },
  {
    id: 'task2-2022-02-12', title: '2022.02.12 退休人士花費與儲蓄', task: 'task2',
    prompt: 'In some countries, old people who retire from work spend the money on themselves, for example on holidays, rather than save money for their children. Is this a positive or negative development?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '正負面發展題：討論退休生活自主與家庭財務影響。',
  },
  {
    id: 'task2-2022-02-17', title: '2022.02.17 城市自行車與交通問題', task: 'task2',
    prompt: 'Some countries invest more money to make it easier to use bicycles in cities. Why? Is it the best way to solve the transport problem?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '原因與解決方案題：說明投資自行車的原因並評估成效。',
  },
  {
    id: 'task2-2022-02-19', title: '2022.02.19 網路新聞取代傳統媒體', task: 'task2',
    prompt: 'More and more people no longer read the newspaper or watch TV programs to get news. They get news about the world through the Internet. Is this a positive or negative development?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '正負面發展題：比較即時性、便利性與資訊可信度。',
  },
  {
    id: 'task2-2022-02-26', title: '2022.02.26 線上資訊與公共圖書館', task: 'task2',
    prompt: 'Nowadays students can easily access information online, so libraries are no longer necessary. To what extent do you agree or disagree?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '觀點題：評估線上資訊與圖書館的互補或取代關係。',
  },
  {
    id: 'task2-2022-03-03', title: '2022.03.03 個人資料上網', task: 'task2',
    prompt: 'Today more people put personal and private information online to do everyday activities such as banking, shopping and socializing. Is this a positive or negative development?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '正負面發展題：討論便利性與隱私、安全風險。',
  },
  {
    id: 'task2-2022-03-12', title: '2022.03.12 現代生活品質', task: 'task2',
    prompt: 'People living in the 21st century have a better quality of life than people who lived in previous centuries. To what extent do you agree or disagree?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '比較現代與過去的生活品質，需平衡物質與心理層面。',
  },
  {
    id: 'task2-2022-03-19', title: '2022.03.19 農田、公園與住宅', task: 'task2',
    prompt: 'Many cities replace farmland and parks with houses. Is it a positive or negative development?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '正負面發展題：評估住房需求與綠地、糧食安全。',
  },
  {
    id: 'task2-2022-03-26', title: '2022.03.26 大城市住房短缺', task: 'task2',
    prompt: 'The shortage of housing in big cities can cause severe consequences, and only government action can solve the problem. To what extent do you agree or disagree?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '觀點題：評估政府政策與市場、開發商、個人等角色。',
  },
  {
    id: 'task2-2022-04-09', title: '2022.04.09 全球食品與在地食品', task: 'task2',
    prompt: 'In the past, people ate local food in season. Nowadays, people buy a variety of food from all over the world. Do the advantages outweigh the disadvantages?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '利弊分析：比較選擇多元、營養與運輸環境成本。',
  },
  {
    id: 'task2-2022-04-16', title: '2022.04.16 紙本出版品的未來', task: 'task2',
    prompt: 'More and more people are using computers and electronic devices to access information. Therefore, there is no need to print books, magazines and newspapers on paper. To what extent do you agree or disagree?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '觀點題：評估數位閱讀的便利與紙本媒介的價值。',
  },
  {
    id: 'task2-2022-04-21', title: '2022.04.21 國家節日的花費', task: 'task2',
    prompt: 'In some countries, too much money is spent by both the government and individuals on national festivals, such as New Year. To what extent do you agree or disagree?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '觀點題：討論節慶支出對文化、經濟與家庭財務的影響。',
  },
  {
    id: 'task2-2022-04-23', title: '2022.04.23 城市功能分區', task: 'task2',
    prompt: 'In many cities, planners have located shops, schools, offices and homes in specific areas which were widely separated from each other. Do you think the advantages of this policy outweigh the disadvantages for city residents?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '利弊分析：比較都市規劃效率與通勤距離、社區便利性。',
  },
  {
    id: 'task2-2022-04-30', title: '2022.04.30 遠離家人的時間', task: 'task2',
    prompt: 'People in many countries spend more and more time far away from their families. Why does this happen and what effects will it have on them and their families?',
    sourceUrl: WRITING_PDF_SOURCE, sourceLabel: '2022 年 1-4 月大作文真題范文.pdf', notes: '原因與影響題：分別說明遠離家人的原因及其後果。',
  },
  {
    id: 'task1-consumer-durables-britain', title: '英國家庭消費耐用品（1972–1983）', task: 'task1',
    prompt: 'The table below shows the consumer durables, such as telephones and refrigerators, owned in Britain from 1972 to 1983. Write a report for a university lecturer describing the information shown below.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Table 題型：比較不同耐用品的普及率與期間增幅。', pdfPage: 8,
  },
  {
    id: 'task1-poverty-families-australia', title: '澳洲不同家庭類型的貧困比例（1999）', task: 'task1',
    prompt: 'The table below shows the proportion of different categories of families living in poverty in Australia in 1999. Summarise the information by selecting and reporting the main features and make comparisons where relevant.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Table 題型：先比較整體平均，再指出單親、單身與伴侶家庭的差異。', pdfPage: 13,
  },
  {
    id: 'task1-population-over-65', title: '三國 65 歲以上人口比例（1940–2040）', task: 'task1',
    prompt: 'The graph below shows the proportion of the population aged 65 and over between 1940 and 2040 in three different countries.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Line graph 題型：比較歷史數據與預測趨勢，注意三國交叉與終點差距。', pdfPage: 19,
  },
  {
    id: 'task1-water-use-worldwide', title: '全球用水與兩國用水量', task: 'task1',
    prompt: 'The graph and table below give information about water use worldwide and water consumption in two different countries. Summarise the information by selecting and reporting the main features and make comparisons where relevant.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: '混合圖題型：將全球趨勢與兩國數據分開整理，再指出主要關聯。', pdfPage: 24,
  },
  {
    id: 'task1-fish-meat-europe', title: '歐洲某國魚類與肉類消費（1979–2004）', task: 'task1',
    prompt: 'The graph below shows the consumption of fish and some different kinds of meat in a European country between 1979 and 2004.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Line graph 題型：比較各類肉品的上升、下降與魚類相對穩定的趨勢。', pdfPage: 29,
  },
  {
    id: 'task1-fast-food-britain', title: '英國速食支出與消費趨勢', task: 'task1',
    prompt: 'The chart below shows the amount of money per week spent on fast foods in Britain. The graph shows the trends in consumption of fast foods.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: '混合圖題型：分別描述金額與消費量，避免把兩組單位混在一起。', pdfPage: 34,
  },
  {
    id: 'task1-leisure-time-employment', title: '不同就業狀態男女的休閒時間', task: 'task1',
    prompt: 'The chart below shows the amount of leisure time enjoyed by men and women of different employment status.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Bar chart 題型：以就業狀態為主軸比較男女休閒時間。', pdfPage: 39,
  },
  {
    id: 'task1-imprisonment-five-countries', title: '五國監禁人數（1930–1980）', task: 'task1',
    prompt: 'The table below shows the figures for imprisonment in five countries between 1930 and 1980. Summarise the information by selecting and reporting the main features and make comparisons where relevant.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Table 題型：比較五國的總體變化、最高值與特殊波動。', pdfPage: 44,
  },
  {
    id: 'task1-education-science-participation', title: '發展中國家與工業化國家的教育科學參與', task: 'task1',
    prompt: 'The charts below show the levels of participation in education and science in developing and industrialised countries in 1980 and 1990.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: '多圖題型：比較國家類別、年份與教育／科學兩個指標。', pdfPage: 49,
  },
  {
    id: 'task1-consumer-goods-europe', title: '四個歐洲國家的六類消費品支出', task: 'task1',
    prompt: 'The chart below shows the amount spent on six consumer goods in four European countries.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Bar chart 題型：比較四國的消費總量與六類商品的相對高低。', pdfPage: 53,
  },
  {
    id: 'task1-post-school-qualification-australia', title: '澳洲男女高中後學歷比例（1999）', task: 'task1',
    prompt: 'The chart below shows the different levels of post-school qualification in Australia and the proportion of men and women who held them in 1999.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Bar chart 題型：按學歷層級比較男女比例，注意最高與最低項目。', pdfPage: 59,
  },
  {
    id: 'task1-electricity-australia-france', title: '澳洲與法國燃料發電量（1980、2000）', task: 'task1',
    prompt: 'The pie charts below show units of electricity production by fuel source in Australia and France in 1980 and 2000.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Pie chart 題型：比較兩國兩個年份的能源結構與轉變。', pdfPage: 63,
  },
  {
    id: 'task1-silkworm-silk-cloth', title: '蠶的生命週期與絲綢製作流程', task: 'task1',
    prompt: 'The diagram below shows the life cycle of the silkworm and the stages in the production of silk cloth.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Process 題型：使用現在式與被動語態，依序描述生命週期與製作階段。', pdfPage: 67,
  },
  {
    id: 'task1-garlsdon-supermarket', title: 'Garlsdon 超市的兩個候選位置', task: 'task1',
    prompt: 'The map below is of the town of Garlsdon. A new supermarket is planned for the town. The map shows two possible sites for the supermarket.',
    sourceUrl: TASK1_PDF_SOURCE, sourceLabel: '劍橋圖表題大全.pdf', notes: 'Map 題型：描述兩個選址與道路、住宅、工業區的相對位置。', pdfPage: 71,
  },
  {
    id: 'writing9-retirement-responsibility', title: 'Band 9：退休金責任', task: 'task2',
    prompt: 'It is the responsibility of individuals to save and provide for their own retirement. Governments have no obligation to provide this benefit. To what extent do you agree or disagree with this statement? Give reasons for your answer and include any relevant examples from your knowledge or experience.',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/6a0c4d9c312e6c0011a3ef46-it-is-the-responsibility-of-individuals-to-save-and-provide-for-their-own-retirement-governments-hav', sampleBand: 9, notes: 'Opinion 題型：練習平衡個人責任與政府安全網。',
  },
  {
    id: 'writing9-historic-buildings', title: 'Band 9：保存歷史建築', task: 'task2',
    prompt: 'Should a city try to preserve its old, historic buildings or destroy them and replace them with modern buildings? Use specific reasons and examples to support your opinion.',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/6933d8d9cf3248001196399e-should-a-city-try-to-preserve-its-old-historic-buildings-or-destroy-them-and-replace-them-with-moder', sampleBand: 9, notes: 'Opinion 題型：用文化價值與城市發展兩面建立立場。',
  },
  {
    id: 'writing9-oil-gas-exploration', title: 'Band 9：開發未知油氣資源', task: 'task2',
    prompt: 'With the increased global demand for oil and gas, undiscovered areas of the world should be opened up to access more resources. To what extent do you agree?',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/679df8613ca513001113a175-with-the-increased-global-demand-for-oil-and-gas-undiscovered-areas-of-the-world-should-be-opened-up', sampleBand: 9, notes: 'Opinion 題型：比較能源需求、環境風險與替代方案。',
  },
  {
    id: 'writing9-future-planning', title: 'Band 9：為未來規劃是否浪費時間', task: 'task2',
    prompt: 'Some people believe that planning for the future is a waste of time because focusing on the present is more important. To what extent do you agree or disagree?',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/6798f450c604e1001189833b-some-people-believe-that-planing-for-the-future-is-a-waste-of-time-because-they-think-that-focusing-', sampleBand: 9, notes: 'Opinion 題型：建立短期生活與長期目標的因果論證。',
  },
  {
    id: 'writing9-science-funding', title: 'Band 9：學校科學科目的資助', task: 'task2',
    prompt: 'Some people think that government funding for schools should be spent on science subjects rather than on other subjects. To what extent do you agree or disagree?',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/67958fa5c604e10011897d5b-some-people-think-that-government-funding-for-schools-should-be-spent-on-science-subjects-rather-tha', sampleBand: 9, notes: 'Opinion 題型：用教育公平與社會需求比較資源分配。',
  },
  {
    id: 'writing9-schools-internet', title: 'Band 9：網路是否取代學校', task: 'task2',
    prompt: 'Schools are no longer necessary because children can access so much information through the Internet and study just as well at home. To what extent do you agree or disagree?',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/678f0e56c604e10011897199-schools-are-no-longer-necessary-because-children-can-get-so-much-information-available-through-inter', sampleBand: 9, notes: 'Opinion 題型：比較資訊取得與學校的社交、結構化功能。',
  },
  {
    id: 'writing9-university-degree', title: 'Band 9：大學學位與成功人生', task: 'task2',
    prompt: 'Some people think that to lead a successful life, a university degree is important. Others believe that this is no longer true nowadays. Discuss both views and give your opinion.',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/6783ef1d2bd9350011ea0e87-some-people-think-that-to-lead-a-successful-life-a-university-degree-is-important-others-believe-tha', sampleBand: 9, notes: 'Discussion 題型：分別發展學位價值與替代路徑，再提出立場。',
  },
  {
    id: 'writing9-saving-money', title: 'Band 9：年輕人儲蓄', task: 'task2',
    prompt: 'It is important for everyone, including young people, to save money for their future. To what extent do you agree with this statement?',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/678028af2bd9350011ea060f-it-is-important-for-everyone-including-young-people-to-save-money-for-their-future-to-what-extent-do', sampleBand: 9, notes: 'Opinion 題型：用財務安全與當下生活品質發展取捨。',
  },
  {
    id: 'writing9-sports-salaries', title: 'Band 9：運動員高薪', task: 'task2',
    prompt: 'In many countries, sports stars earn extremely high salaries. Some people believe they earn too much, while others claim they deserve their high salaries. Discuss both views and give your opinion.',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/67801e462bd9350011ea05fc-in-many-countries-sports-stars-earn-extremely-high-salaries-some-people-believe-that-sports-stars-ea', sampleBand: 9, notes: 'Discussion 題型：比較市場價值、社會貢獻與收入公平。',
  },
  {
    id: 'writing9-equal-wages', title: 'Band 9：所有員工同工同酬', task: 'task2',
    prompt: 'If all workers in a company were paid the same wage regardless of job role, there would be more harmony and cooperation between staff. To what extent do you agree?',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/677f36fc2bd9350011ea03a8-if-all-workers-in-a-company-were-paid-exact-same-wage-regardless-of-job-role-there-would-be-much-mor', sampleBand: 9, notes: 'Opinion 題型：分析公平感、責任差異與工作誘因。',
  },
  {
    id: 'writing9-study-abroad', title: 'Band 9：出國留學的利弊', task: 'task2',
    prompt: 'In the past, students tended to study in their own country for a university degree. Nowadays, they have more opportunities to study abroad. What are the advantages and disadvantages of this development?',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/677f36fc2bd9350011ea03a8-in-the-past-when-students-did-a-university-degree-they-tended-to-study-in-their-own-country-nowadays', sampleBand: 9, notes: 'Advantages/Disadvantages 題型：分別發展國際經驗與成本、適應問題。',
  },
  {
    id: 'writing9-road-safety', title: 'Band 9：嚴格處罰與道路安全', task: 'task2',
    prompt: 'Some people think strict punishments for driving offences are the key to reducing traffic accidents. Others believe other measures would be more effective. Discuss both views and give your own opinion.',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/677f36fc2bd9350011ea03a8-some-people-think-that-strict-punishments-for-driving-offenses-are-the-key-to-reducing-traffic-accid', sampleBand: 9, notes: 'Discussion 題型：比較處罰、教育、工程設計與執法。',
  },
  {
    id: 'writing9-environmental-survival', title: 'Band 9：環境問題與移居其他星球', task: 'task2',
    prompt: 'Some people believe that environmental problems will eventually make Earth uninhabitable and humans will need to find another planet. To what extent do you agree?',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/677f36fc2bd9350011ea03a8-some-people-believe-that-in-the-future-environmental-problems-will-mean-that-we-are-unable-to-live-o', sampleBand: 9, notes: 'Opinion 題型：比較地球治理與太空移民的可行性。',
  },
  {
    id: 'writing9-obesity-responsibility', title: 'Band 9：肥胖責任歸屬', task: 'task2',
    prompt: 'Some people think that the increase in obesity should be the responsibility of governments, while others think it should be the responsibility of individuals. Discuss both sides and give your opinion.',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/677f36fc2bd9350011ea03a8-some-people-think-that-the-increase-in-the-number-of-obese-people-should-be-the-responsibility-of-th', sampleBand: 9, notes: 'Discussion 題型：拆解政策環境與個人選擇的責任邊界。',
  },
  {
    id: 'writing9-technology-relationships', title: 'Band 9：科技與人際關係', task: 'task2',
    prompt: 'Nowadays the way many people interact with each other has changed because of technology. In what ways has technology affected relationships? Has this been a positive or negative development?',
    sourceUrl: 'https://writing9.com/band/9/0', sourceLabel: 'writing9 Band 9', sampleUrl: 'https://writing9.com/text/677f36fc2bd9350011ea03a8-nowadays-the-way-many-people-interact-with-each-other-has-changed-because-of-technology-in-what-ways', sampleBand: 9, notes: '混合題型：先說明改變，再評估正負面影響。',
  },
];
