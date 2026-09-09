import { IELTSCoreVocab } from "../../types/ielts";
import { toTraditionalChinese } from "../../utils/chineseConverter";

let cachedVocab: IELTSCoreVocab[] | null = null;

const RAW_SAMPLE_IELTS_CORE_VOCAB: IELTSCoreVocab[] = [
  {
    "word": "emperor",
    "meaning": "n. 皇帝；君主",
    "example": "The emperor's wisdom and leadership united the diverse regions of his vast empire.",
    "freq": 1,
    "phonetic": "'empәrә"
  },
  {
    "word": "exact",
    "meaning": "a. 精确的；准确的",
    "example": "The scientist needed the exact measurements to ensure the experiment would yield accurate results.",
    "freq": 0.9997,
    "phonetic": "ig'zækt"
  },
  {
    "word": "traditional",
    "meaning": "a. 传统的，惯例的；口传的，传说的",
    "example": "During the festival, the villagers performed a traditional dance that had been passed down through generations.",
    "freq": 0.9994,
    "phonetic": "trә'diʃәnl"
  },
  {
    "word": "lack",
    "meaning": "n./vt. 缺乏，不足，没有 to have too little of something, be without",
    "example": "Without that morning meal, the body may lack the necessary fuel for energy",
    "freq": 0.9992,
    "phonetic": "læk"
  },
  {
    "word": "pardon",
    "meaning": "excl.（用于请求别人重复某事）什么，请再说一遍 n./vt. 原谅，宽恕；赦免",
    "example": "Afer accidentally stepping on his friend's foot, Jake quickly said, \"Pardon me, I didn't mean to hurt you.\"",
    "freq": 0.9989,
    "phonetic": "'pɑ:dn"
  },
  {
    "word": "regent",
    "meaning": "n. 摄政者（代国王统治者）",
    "example": "During the young king's minority, the regent managed the kingdom's affairs with wisdom and fairness.",
    "freq": 0.9986,
    "phonetic": "'ri:dʒәnt"
  },
  {
    "word": "burgeon",
    "meaning": "vi. 迅速成长；发展",
    "example": "With the arrival of spring, the garden begun to burgeon with vibrant flowers and lush greenery.",
    "freq": 0.9983,
    "phonetic": "'bә:dʒәn"
  },
  {
    "word": "argue",
    "meaning": "v. 争论；说服",
    "example": "Despite their best effort to remain calm, they continued to argue about the best approach to the project.",
    "freq": 0.9981,
    "phonetic": "'ɑ:gju"
  },
  {
    "word": "barely",
    "meaning": "ad. 仅仅，几乎不；赤裸裸地，无遮蔽地",
    "example": "She was so tired that she could barely keep her eyes open during the meeting.",
    "freq": 0.9978,
    "phonetic": "'bєәli"
  },
  {
    "word": "methane",
    "meaning": "n. 甲烷，沼气",
    "example": "Methane is potent greenhouse gas that is released during the decomposition of organic matter in landfills.",
    "freq": 0.9975,
    "phonetic": "'meθein"
  },
  {
    "word": "hierarchy",
    "meaning": "n. 领导层；层次，等级",
    "example": "In the new corporate hierarchy, communication is faster between teams.",
    "freq": 0.9972,
    "phonetic": "'haiәrɑ:ki"
  },
  {
    "word": "guidance",
    "meaning": "n. 指引，指导",
    "example": "She sought guidance from her mentor to help navigate the challenges of her new role at work.",
    "freq": 0.997,
    "phonetic": "'gaidns"
  },
  {
    "word": "easy-going",
    "meaning": "a. 脾气随和的，心平气和的；随便的",
    "example": "His easy-going made him a favorite among his colleagues, as he always remained calm and approachable under preesure.",
    "freq": 0.9967
  },
  {
    "word": "electrical",
    "meaning": "a. 电的，电学的，有关电的",
    "example": "The electrician was called to fix a problem with the building's electrical wiring to ensure all the lights and outlets were functioning properly.",
    "freq": 0.9964,
    "phonetic": "i'lektrikәl"
  },
  {
    "word": "electronic",
    "meaning": "a. 电子的",
    "example": "She prefers using electronic books because they are more convenient to carry and can be read on various devices.",
    "freq": 0.9961,
    "phonetic": ".ilek'trɒnik"
  },
  {
    "word": "roll-film",
    "meaning": "film 胶卷",
    "example": "The photographer loaded roll-film into the vintage camera before the shoot began.",
    "freq": 0.9958
  },
  {
    "word": "philosophy",
    "meaning": "n. 哲学；哲理",
    "example": "Her philosophy on life emphasizes the importance of kindness and living in the present monment.",
    "freq": 0.9956,
    "phonetic": "fi'lɒsәfi"
  },
  {
    "word": "chronic",
    "meaning": "a. （疾病）慢性的；积习难改的",
    "example": "He suffers from chronic back pain that has persisted for years despite various treatments.",
    "freq": 0.9953,
    "phonetic": "'krɒnik"
  },
  {
    "word": "desirable",
    "meaning": "a. 值得拥有的；合意的；可取的，有利的",
    "example": "Having a flexible work schedule is highly desirable to many employees as it allows for better work-life balance.",
    "freq": 0.995,
    "phonetic": "di'zairәbl"
  },
  {
    "word": "consortium",
    "meaning": "n. 集团；财团；社团，协会",
    "example": "The university formed a consortium with several leading technology companies to advance research in artificial intelligence.",
    "freq": 0.9947,
    "phonetic": "kәn'sɒ:tjәm"
  },
  {
    "word": "buckle",
    "meaning": "n. 皮带扣环 v. 扣紧；（使）变形；弯曲",
    "example": "Before starting the hike, make sure to buckle your backpack straps securely to avoid any discomfort on the trail.",
    "freq": 0.9945,
    "phonetic": "'bʌkl"
  },
  {
    "word": "curry",
    "meaning": "n. 咖喱，咖喱饭菜 vt. 把（肉、蔬菜等）做成咖喱食品；梳刷（马毛等）",
    "example": "Last night, I made a delicious chicken curry with a blend of aromatic spices and fresh vegetables.",
    "freq": 0.9942,
    "phonetic": "'kʌri. 'kә:ri"
  },
  {
    "word": "subliminal",
    "meaning": "a. 下意识的，潜意识的",
    "example": "The advert included a subliminal message that audiences barely noticed.",
    "freq": 0.9939,
    "phonetic": "sʌb'liminl"
  },
  {
    "word": "chamber",
    "meaning": "n. 室；洞穴；（枪）膛",
    "example": "The scientist carefully adjusted the pressure inside the vacuum chamber before conducting the experiment.",
    "freq": 0.9936,
    "phonetic": "'tʃeimbә"
  },
  {
    "word": "frequent",
    "meaning": "a. 频繁的，常见的，常用的",
    "example": "She made frequent visit to the library to study for her upcoming exams.",
    "freq": 0.9934,
    "phonetic": "'fri:kwәnt"
  },
  {
    "word": "prosperous",
    "meaning": "a. 繁荣的，兴旺的；成功的",
    "example": "Afer years of hard work and dedication, the small business became a prosperous enterprise with a growing customer base.",
    "freq": 0.9931,
    "phonetic": "'prɒspәrәs"
  },
  {
    "word": "purpose",
    "meaning": "n. 目的，意图；用途，效果 v. 打算，企图，决心",
    "example": "She approached her new role with a clear sense of purpose, determined to make a meaningful impact on the team.",
    "freq": 0.9928,
    "phonetic": "'pә:pәs"
  },
  {
    "word": "variety",
    "meaning": "n. 品种，种类；变化，多样化",
    "example": "The farmers's market offers a wide variety of fresh fruits and vegetables, ensuring that there's something for everyone.",
    "freq": 0.9925,
    "phonetic": "vә'raiәti"
  },
  {
    "word": "immigration",
    "meaning": "n. 外来的移民；移居",
    "example": "Immigration policies play a crucial role in shaping the demographic and economic landscape of a country.",
    "freq": 0.9922,
    "phonetic": ".imi'greiʃәn"
  },
  {
    "word": "natural",
    "meaning": "a. 正常的，普通的，自然的；自然界的，天然的；天赋的，固有的",
    "example": "She preferred using natural ingredients in her cooking to ensure the meals were both healthy and flavorful.",
    "freq": 0.992,
    "phonetic": "'nætʃәrәl"
  },
  {
    "word": "bet",
    "meaning": "v. 赌，打赌 n. 打赌，赌注",
    "example": "He placed a bet on the soccer match, hoping his favorite team would win.",
    "freq": 0.9917,
    "phonetic": "bet"
  },
  {
    "word": "consumer",
    "meaning": "n. 消费者；用户",
    "example": "Modern companies need to understand consumer preferences to tailor their products and marketing strategies effectively.",
    "freq": 0.9914,
    "phonetic": "kәn'sju:mә"
  },
  {
    "word": "physician",
    "meaning": "n. 内科医生，医师",
    "example": "The physician carefully reviewed the patient's medical history before recommending a treatment plan.",
    "freq": 0.9911,
    "phonetic": "fi'ziʃәn"
  },
  {
    "word": "equal",
    "meaning": "a. 相等的 vt. 比得上",
    "example": "Everyone in the team was given an equal opportunity to contribute ideas during the brainstorming session.",
    "freq": 0.9909,
    "phonetic": "'i:kwәl"
  },
  {
    "word": "resort",
    "meaning": "n. 求助；诉诸；胜地 vi. 求助；诉诸",
    "example": "After trying various treatments without success, she decided to resort to a more advanced medical procedure.",
    "freq": 0.9906,
    "phonetic": "ri'zɒ:t"
  },
  {
    "word": "leadership",
    "meaning": "n. 领导，领导层；领导能力",
    "example": "Effective leadership keeps the research team focused on the shared goal.",
    "freq": 0.9903,
    "phonetic": "'li:dәʃip"
  },
  {
    "word": "equity",
    "meaning": "n. 公平，公正",
    "example": "The company's commitment to equity is evident in its diverse hiring practices and equal opportunity policies.",
    "freq": 0.99,
    "phonetic": "'ekwiti"
  },
  {
    "word": "excavate",
    "meaning": "vt. 挖掘，开凿",
    "example": "The archaeologists worked diligently to excavate the ancient ruins and uncover artifacts from the past.",
    "freq": 0.9898,
    "phonetic": "'ekskәveit"
  },
  {
    "word": "nuclear",
    "meaning": "a. 核能的，原子能的",
    "example": "The nuclear reactor provides a significant portion of the country's energy needs.",
    "freq": 0.9895,
    "phonetic": "'nju:kliә"
  },
  {
    "word": "mutual",
    "meaning": "a. 相互的；共同的",
    "example": "Their decision to collaborate on he project was based on mutual trust and respect.",
    "freq": 0.9892,
    "phonetic": "'mju:tʃuәl"
  },
  {
    "word": "hectare",
    "meaning": "n. 公顷",
    "example": "The farm covers an area of 50 hectares, which allows for a diverse range of crops.",
    "freq": 0.9889,
    "phonetic": "'hektɑ:"
  },
  {
    "word": "density",
    "meaning": "n. 密集；浓度，密度",
    "example": "The density of the new material makes it ideal for use in lightweight, durable construction.",
    "freq": 0.9886,
    "phonetic": "'densiti"
  },
  {
    "word": "massive",
    "meaning": "a. 大而重的，厚实的，粗大的；大量的，大规模的 huge",
    "example": "one important similarity between Brazil and the United States is their massive size this memorial is home to a massive statue of President Abraham Lincoln and an engraved copy of Lincoln's famous speech, the Gettysburg Address",
    "freq": 0.9884,
    "phonetic": "'mæsiv"
  },
  {
    "word": "congratulate",
    "meaning": "vt. 祝贺",
    "example": "I want to congratulate you on your recent promotion' you truly deserve it!",
    "freq": 0.9881,
    "phonetic": "kәn'grætʃәleit"
  },
  {
    "word": "companion",
    "meaning": "n. 共事者；同伴",
    "example": "She brought her loyral dog along as her companion on the long road trip.",
    "freq": 0.9878,
    "phonetic": "kәm'pænjәn"
  },
  {
    "word": "rig",
    "meaning": "vt. 操纵，垄断 n. 船桅（或船帆等）的装置；成套器械",
    "example": "The crew worked quickly to rig the sailboat for the upcoming race.",
    "freq": 0.9875,
    "phonetic": "rig"
  },
  {
    "word": "input",
    "meaning": "n. 投入，输入；输入的数据 vt. 把……输入计算机",
    "example": "The software requires input to customize the settings according to individual preferences.",
    "freq": 0.9873,
    "phonetic": "'input"
  },
  {
    "word": "merely",
    "meaning": "ad. 仅仅，只不过",
    "example": "She was merely trying to help, but it was misunderstood as interference.",
    "freq": 0.987,
    "phonetic": "'miәli"
  },
  {
    "word": "impart",
    "meaning": "vt. 给予，赋予；传授；告知，透露",
    "example": "The teacher's goal is to impart knowledge and inspire curiosity in her students.",
    "freq": 0.9867,
    "phonetic": "im'pɑ:t"
  },
  {
    "word": "forfeit",
    "meaning": "v. （因犯规等而）丧失，失去 n. 罚款；代价",
    "example": "If you fail to attend the mandatory training session, you may forfeit your eligibility for the promotion.",
    "freq": 0.9864,
    "phonetic": "'fɒ:fit"
  },
  {
    "word": "calorie",
    "meaning": "n. 卡（路里）， 大卡（食物的热量）",
    "example": "To maintain a healthy weight, it's important to monitor your daily calorie intake and balance it with physical activity.",
    "freq": 0.9861,
    "phonetic": "'kælәri"
  },
  {
    "word": "van",
    "meaning": "n. 运货车",
    "example": "We rented a van for our family vacation to fill all our luggage and make the journey more comfortable.",
    "freq": 0.9859,
    "phonetic": "væn"
  },
  {
    "word": "ventilation",
    "meaning": "n. 空气流通；通风设备，通风方法",
    "example": "Proper ventilation in the office is essential to ensure a healtht and comfortable working environment.",
    "freq": 0.9856,
    "phonetic": ".venti'leiʃәn"
  },
  {
    "word": "intermediate",
    "meaning": "a. 中间的，中级的",
    "example": "She enrolled in an intermediate Spanish course to improve her language skills after completing the beginner level.",
    "freq": 0.9853,
    "phonetic": ".intә'mi:diәt"
  },
  {
    "word": "eternal",
    "meaning": "a. 永恒的",
    "example": "The poet described their love as eternal, lasting beyond the bounds of time and space.",
    "freq": 0.985,
    "phonetic": "i'tә:nl"
  },
  {
    "word": "invasion",
    "meaning": "n. 入侵，侵略",
    "example": "The historical records describe the invasion of Normandy as a pivotal moment in World War II.",
    "freq": 0.9848,
    "phonetic": "in'veiʒәn"
  },
  {
    "word": "nevertheless",
    "meaning": "ad. 仍然；然而 conj. 然而，不过",
    "example": "The weather was rainly and cold' nevertheless, the outdoor event was a great success.",
    "freq": 0.9845,
    "phonetic": ".nevәðә'les"
  },
  {
    "word": "celebrate",
    "meaning": "v. 赞扬，歌颂；庆祝",
    "example": "We gathered to celebrate her promotion with a surprise party and heartfelt toasts.",
    "freq": 0.9842,
    "phonetic": "'selibreit"
  },
  {
    "word": "inspiring",
    "meaning": "a. 鼓舞（或激励）人心的；启发灵感的",
    "example": "Her speech was incredibly inspiring and motivated everyone to pursue their dreams.",
    "freq": 0.9839,
    "phonetic": "in'spaiәriŋ"
  },
  {
    "word": "attendance",
    "meaning": "n. 到场，出席；出勤；伺候，照料",
    "example": "Regular attendance at the meetings is crucial for staying updated on the project's progress.",
    "freq": 0.9837,
    "phonetic": "ә'tendәns"
  },
  {
    "word": "optional",
    "meaning": "a. 可选择的，非强制的，随意的",
    "example": "Attending the workshop is optional, but it will greatly enhance your understanding of the topic.",
    "freq": 0.9834,
    "phonetic": "'ɒpʃәnl"
  },
  {
    "word": "enable",
    "meaning": "vt. 使能够，使成为可能",
    "example": "Advanced technology will enable us to complete the project more efficiently.",
    "freq": 0.9831,
    "phonetic": "i'neibl"
  },
  {
    "word": "departmental",
    "meaning": "a. 部门的",
    "example": "The compay held a departmental meeting to discuss the new policies and their implementation.",
    "freq": 0.9828,
    "phonetic": ".di:pɑ:t'mentәl"
  },
  {
    "word": "heal",
    "meaning": "v. 治愈，康复；调停",
    "example": "With time and proper care, the injured athlete was able to heal and return to the game.",
    "freq": 0.9825,
    "phonetic": "hi:l"
  },
  {
    "word": "dismantle",
    "meaning": "vt. 拆除；废除，取消",
    "example": "After the festival, the team worked to dismantle the stage and clean up the area.",
    "freq": 0.9823,
    "phonetic": "dis'mæntl"
  },
  {
    "word": "wage",
    "meaning": "n. 工资；[常 pl.] 报酬",
    "example": "The company decided to increase the minimum wage to attract more skilled workers.",
    "freq": 0.982,
    "phonetic": "weidʒ"
  },
  {
    "word": "landscape",
    "meaning": "n. 风景 vt. 对……作景观美化，美化（自然环境等）",
    "example": "The artist captured the breathtaking landscape of the mountains in his latest painting.",
    "freq": 0.9817,
    "phonetic": "'lændskeip"
  },
  {
    "word": "emotion",
    "meaning": "n. 感情；情绪",
    "example": "Her voice trembled with emotion as she described the experience.",
    "freq": 0.9814,
    "phonetic": "i'mәuʃәn"
  },
  {
    "word": "commonwealth",
    "meaning": "n. [the C-] 英联邦；联合体",
    "example": "The Commonwealth of Nations works together to promote economic development and cultural exchange among its member countries.",
    "freq": 0.9812,
    "phonetic": "'kɔmәnwelθ"
  },
  {
    "word": "newsletter",
    "meaning": "n. 时事通讯，业务通讯",
    "example": "Subscribers receive a monthly newsletter that includes updates on company news and upcoming events.",
    "freq": 0.9809,
    "phonetic": "'nju:z.letә"
  },
  {
    "word": "periodical",
    "meaning": "n. 期刊，杂志 a. 周期的，定期的",
    "example": "She enjoys reading the latest in her favorite periodical each month.",
    "freq": 0.9806,
    "phonetic": ".piәri'ɒdikl"
  },
  {
    "word": "receptionist",
    "meaning": "n. 接待员",
    "example": "The receptionist greeted visitors with a warm smile and directed them to the appropriate office.",
    "freq": 0.9803,
    "phonetic": "ri'sepʃәnist"
  },
  {
    "word": "security",
    "meaning": "n. 安全，保障；抵押品；[pl.]证券",
    "example": "The company invested in advanced security systems to protect sensitive information from unauthorized access.",
    "freq": 0.9801,
    "phonetic": "si'kjuriti"
  },
  {
    "word": "clip",
    "meaning": "n. （弹簧）夹子，回形针，别针；弹夹；修剪；剪报，电影（或电视）片断 v.（夹子、回形针等）夹住，扣住；剪，修剪",
    "example": "She used a paper clip to keep her notes together.",
    "freq": 0.9798,
    "phonetic": "klip"
  },
  {
    "word": "apace",
    "meaning": "ad. 快速地，急速地",
    "example": "The construction of the new highway is progressing apace, with the completion expected within a few months.",
    "freq": 0.9795,
    "phonetic": "ә'peis"
  },
  {
    "word": "yield",
    "meaning": "n. 产量 v. 出产；放弃",
    "example": "The new farming techniques increased the crop yield significantly.",
    "freq": 0.9792,
    "phonetic": "ji:ld"
  },
  {
    "word": "fair",
    "meaning": "a./ad. 公平的/地",
    "example": "The judge ensured that the trial was conducted in a fair and impartial manner.",
    "freq": 0.9789,
    "phonetic": "fєә"
  },
  {
    "word": "regional",
    "meaning": "a. 局部范围的；地方（性）的，区域性的；全地区的，整个地区的",
    "example": "IELTS learners often encounter the word 'regional' in practice exercises.",
    "freq": 0.9787,
    "phonetic": "'ri:dʒәnәl"
  },
  {
    "word": "secure",
    "meaning": "v. 得到某物，获得；防护，保卫 a. 安全的；可靠的，放心的",
    "example": "IELTS learners often encounter the word 'secure' in practice exercises.",
    "freq": 0.9784,
    "phonetic": "si'kjuә"
  },
  {
    "word": "preserve",
    "meaning": "vt. 保护；维持；保存，保藏；腌渍",
    "example": "IELTS learners often encounter the word 'preserve' in practice exercises.",
    "freq": 0.9781,
    "phonetic": "pri'zә:v"
  },
  {
    "word": "reject",
    "meaning": "vt. 拒绝 [ˈriːdʒekt] n. 被拒货品，不合格品",
    "example": "IELTS learners often encounter the word 'reject' in practice exercises.",
    "freq": 0.9778,
    "phonetic": "ri'dʒekt"
  },
  {
    "word": "code",
    "meaning": "n. 密码；代码 vt. 把……编码",
    "example": "IELTS learners often encounter the word 'code' in practice exercises.",
    "freq": 0.9776,
    "phonetic": "kәud"
  },
  {
    "word": "seek",
    "meaning": "v. 寻找；探索；追求",
    "example": "IELTS learners often encounter the word 'seek' in practice exercises.",
    "freq": 0.9773,
    "phonetic": "si:k"
  },
  {
    "word": "item",
    "meaning": "n. 条款，项目； （新闻等）一则",
    "example": "IELTS learners often encounter the word 'item' in practice exercises.",
    "freq": 0.977,
    "phonetic": "'aitәm"
  },
  {
    "word": "crown",
    "meaning": "n. 王冠；花冠；齿冠",
    "example": "IELTS learners often encounter the word 'crown' in practice exercises.",
    "freq": 0.9767,
    "phonetic": "kraun"
  },
  {
    "word": "effort",
    "meaning": "n. 努力，艰难的尝试；成就",
    "example": "IELTS learners often encounter the word 'effort' in practice exercises.",
    "freq": 0.9765,
    "phonetic": "'efәt"
  },
  {
    "word": "point",
    "meaning": "n. 尖，尖端；点，小数点；条款，细目；分数，得分；要点，论点，观点 v. 指，指向；表明；瞄准",
    "example": "IELTS learners often encounter the word 'point' in practice exercises.",
    "freq": 0.9762,
    "phonetic": "pɒint"
  },
  {
    "word": "review",
    "meaning": "vt. 回顾；自习；评论 n. 回顾；评论",
    "example": "IELTS learners often encounter the word 'review' in practice exercises.",
    "freq": 0.9759,
    "phonetic": "ri'vju:"
  },
  {
    "word": "fabrication",
    "meaning": "n. 捏造，伪造；制作；构成",
    "example": "IELTS learners often encounter the word 'fabrication' in practice exercises.",
    "freq": 0.9756,
    "phonetic": ".fæbri'keiʃәn"
  },
  {
    "word": "series",
    "meaning": "n. 一系列，连续；丛书",
    "example": "IELTS learners often encounter the word 'series' in practice exercises.",
    "freq": 0.9753,
    "phonetic": "'siәri:z"
  },
  {
    "word": "variation",
    "meaning": "n. 变化，变动；变种；变异；变更；变奏",
    "example": "IELTS learners often encounter the word 'variation' in practice exercises.",
    "freq": 0.9751,
    "phonetic": ".vєәri'eiʃәn"
  },
  {
    "word": "margin",
    "meaning": "n. 差额，差距；页边空白；边缘；余地；幅度 v. 加旁注于；加边于",
    "example": "IELTS learners often encounter the word 'margin' in practice exercises.",
    "freq": 0.9748,
    "phonetic": "'mɑ:dʒin"
  },
  {
    "word": "distraction",
    "meaning": "[dɪˈstrækʃn] n. 分散注意力的事；使人分心的事；娱乐，消遣 something that prevents someone from giving full attention",
    "example": "add to this an increased exposure to technology, and the distractions may feel almost insurmountable",
    "freq": 0.9745,
    "phonetic": "dis'trækʃәn"
  },
  {
    "word": "complicate",
    "meaning": "vt. 使变复杂",
    "example": "IELTS learners often encounter the word 'complicate' in practice exercises.",
    "freq": 0.9742,
    "phonetic": "'kɒmplikeit"
  },
  {
    "word": "tram",
    "meaning": "n. 有轨电车，电车轨道 v. 乘电车",
    "example": "IELTS learners often encounter the word 'tram' in practice exercises.",
    "freq": 0.974,
    "phonetic": "træm"
  },
  {
    "word": "maturity",
    "meaning": "n. 成熟；完善，完备，准备就绪；到期（应付款）",
    "example": "IELTS learners often encounter the word 'maturity' in practice exercises.",
    "freq": 0.9737,
    "phonetic": "mә'tjuәriti"
  },
  {
    "word": "download",
    "meaning": "v. 下载",
    "example": "IELTS learners often encounter the word 'download' in practice exercises.",
    "freq": 0.9734
  },
  {
    "word": "refer",
    "meaning": "v. 参考，查阅，查询；提到，谈及；引用；提交，上呈",
    "example": "IELTS learners often encounter the word 'refer' in practice exercises.",
    "freq": 0.9731,
    "phonetic": "ri'fә:"
  },
  {
    "word": "interview",
    "meaning": "v./n. 接见，会见；采访；面试",
    "example": "IELTS learners often encounter the word 'interview' in practice exercises.",
    "freq": 0.9729,
    "phonetic": "'intәvju:"
  },
  {
    "word": "extent",
    "meaning": "n. 范围；面积；广度，长度；程度",
    "example": "IELTS learners often encounter the word 'extent' in practice exercises.",
    "freq": 0.9726,
    "phonetic": "ik'stent"
  },
  {
    "word": "evacuate",
    "meaning": "v. 疏散；撤离",
    "example": "IELTS learners often encounter the word 'evacuate' in practice exercises.",
    "freq": 0.9723,
    "phonetic": "i'vækjueit"
  },
  {
    "word": "stint",
    "meaning": "n. 定量；限额",
    "example": "IELTS learners often encounter the word 'stint' in practice exercises.",
    "freq": 0.972,
    "phonetic": "stint"
  },
  {
    "word": "embankment",
    "meaning": "n. 筑堤；堤岸，路基",
    "example": "IELTS learners often encounter the word 'embankment' in practice exercises.",
    "freq": 0.9717,
    "phonetic": "im'bæŋkmәnt"
  },
  {
    "word": "squash",
    "meaning": "n. 软式墙网球，壁球 v. 压碎，挤压；挤进，塞入；镇住，镇压；制止",
    "example": "IELTS learners often encounter the word 'squash' in practice exercises.",
    "freq": 0.9715,
    "phonetic": "skwɒʃ"
  },
  {
    "word": "federation",
    "meaning": "n. 联邦；同盟",
    "example": "IELTS learners often encounter the word 'federation' in practice exercises.",
    "freq": 0.9712,
    "phonetic": "fedә'reiʃәn"
  },
  {
    "word": "surge",
    "meaning": "v. （人群等）蜂拥而出；波动，涌动 n. （感情等的）洋溢；猛增",
    "example": "IELTS learners often encounter the word 'surge' in practice exercises.",
    "freq": 0.9709,
    "phonetic": "sә:dʒ"
  },
  {
    "word": "physical",
    "meaning": "a. 身体的，肉体的；物理的，物理学的；物质的，有形的； n. 体检",
    "example": "IELTS learners often encounter the word 'physical' in practice exercises.",
    "freq": 0.9706,
    "phonetic": "'fizikl"
  },
  {
    "word": "justify",
    "meaning": "v. 证明……为正当的；为……辩护",
    "example": "IELTS learners often encounter the word 'justify' in practice exercises.",
    "freq": 0.9704,
    "phonetic": "'dʒʌstifai"
  },
  {
    "word": "score",
    "meaning": "v. 得分，记分；给（试卷等）打分，给……评分；刻痕于，画线于；获胜，成功 n. 得分，分数；乐谱；抓痕，划痕；二十",
    "example": "IELTS learners often encounter the word 'score' in practice exercises.",
    "freq": 0.9701,
    "phonetic": "skɒ:"
  },
  {
    "word": "persuade",
    "meaning": "v. 说服，劝说；使相信",
    "example": "IELTS learners often encounter the word 'persuade' in practice exercises.",
    "freq": 0.9698,
    "phonetic": "pә'sweid"
  },
  {
    "word": "migration",
    "meaning": "n. 迁徙，移居，移民",
    "example": "IELTS learners often encounter the word 'migration' in practice exercises.",
    "freq": 0.9695,
    "phonetic": "mai'greiʃәn"
  },
  {
    "word": "overweight",
    "meaning": "a. 超重的，过重的 n. 超重，过重 vt. 使负担过重",
    "example": "IELTS learners often encounter the word 'overweight' in practice exercises.",
    "freq": 0.9693,
    "phonetic": "'әuvә'weit"
  },
  {
    "word": "cooperation",
    "meaning": "n. 合作，协作；配合",
    "example": "IELTS learners often encounter the word 'cooperation' in practice exercises.",
    "freq": 0.969,
    "phonetic": "kәu.ɒpә'reiʃәn"
  },
  {
    "word": "zoological",
    "meaning": "a. 动物学的",
    "example": "IELTS learners often encounter the word 'zoological' in practice exercises.",
    "freq": 0.9687,
    "phonetic": ".zәuә'lɒdʒikl"
  },
  {
    "word": "stamp",
    "meaning": "v. 跺（脚），重踏；在……上盖（字样或图案等）；重步走 n. 邮票，印花；印，图章；标志，印记；跺脚，顿足",
    "example": "IELTS learners often encounter the word 'stamp' in practice exercises.",
    "freq": 0.9684,
    "phonetic": "stæmp"
  },
  {
    "word": "whistle",
    "meaning": "v. 吹口哨 n. 口哨；呼啸而过",
    "example": "IELTS learners often encounter the word 'whistle' in practice exercises.",
    "freq": 0.9681,
    "phonetic": "'hwisl"
  },
  {
    "word": "detective",
    "meaning": "n. 侦探 a. 侦探的",
    "example": "IELTS learners often encounter the word 'detective' in practice exercises.",
    "freq": 0.9679,
    "phonetic": "di'tektiv"
  },
  {
    "word": "occupy",
    "meaning": "vt. 占用，占领；（使）忙碌于；（使）从事",
    "example": "IELTS learners often encounter the word 'occupy' in practice exercises.",
    "freq": 0.9676,
    "phonetic": "'ɒkjupai"
  },
  {
    "word": "ceremony",
    "meaning": "n. 典礼；仪式",
    "example": "IELTS learners often encounter the word 'ceremony' in practice exercises.",
    "freq": 0.9673,
    "phonetic": "'serimәni"
  },
  {
    "word": "diagnose",
    "meaning": "v. 诊断；判断",
    "example": "IELTS learners often encounter the word 'diagnose' in practice exercises.",
    "freq": 0.967,
    "phonetic": "'daiәgnәuz"
  },
  {
    "word": "denote",
    "meaning": "v. 表示，指示；意味着",
    "example": "IELTS learners often encounter the word 'denote' in practice exercises.",
    "freq": 0.9668,
    "phonetic": "di'nәut"
  },
  {
    "word": "chink",
    "meaning": "n. 裂缝，裂口；一缕光；叮当声 v. （使）发出叮当声",
    "example": "IELTS learners often encounter the word 'chink' in practice exercises.",
    "freq": 0.9665,
    "phonetic": "tʃiŋk"
  },
  {
    "word": "iris",
    "meaning": "n. 虹；（眼球的）虹膜；复数常作 irides",
    "example": "IELTS learners often encounter the word 'iris' in practice exercises.",
    "freq": 0.9662,
    "phonetic": "'airis"
  },
  {
    "word": "resource",
    "meaning": "n. [pl.] 资源，财力；应付办法，谋略；应变之才 a supply; available amount",
    "example": "there are no more excuses as the government has provided adequate resources to reduce pollution on the mountain",
    "freq": 0.9659,
    "phonetic": "ri'sɒ:s"
  },
  {
    "word": "entire",
    "meaning": "a. 全部的，整个的 complete; whole",
    "example": "a tourist can easily spend an entire week visiting these 16 museums, which all have free admission",
    "freq": 0.9657,
    "phonetic": "in'taiә"
  },
  {
    "word": "epitomise",
    "meaning": "vt. 集中体现；概括",
    "example": "IELTS learners often encounter the word 'epitomise' in practice exercises.",
    "freq": 0.9654
  },
  {
    "word": "crocodile",
    "meaning": "n. 鳄鱼；鳄鱼皮",
    "example": "IELTS learners often encounter the word 'crocodile' in practice exercises.",
    "freq": 0.9651,
    "phonetic": "'krɒkәdail"
  },
  {
    "word": "summit",
    "meaning": "n. （山等的）最高点，峰顶",
    "example": "IELTS learners often encounter the word 'summit' in practice exercises.",
    "freq": 0.9648,
    "phonetic": "'sʌmit"
  },
  {
    "word": "ensure",
    "meaning": "vt. 确保，保证；担保；赋予",
    "example": "IELTS learners often encounter the word 'ensure' in practice exercises.",
    "freq": 0.9645,
    "phonetic": "in'ʃuә"
  },
  {
    "word": "odour",
    "meaning": "n. 气味",
    "example": "IELTS learners often encounter the word 'odour' in practice exercises.",
    "freq": 0.9643,
    "phonetic": "'әudә"
  },
  {
    "word": "accurate",
    "meaning": "a. 正确无误的；精确的",
    "example": "IELTS learners often encounter the word 'accurate' in practice exercises.",
    "freq": 0.964,
    "phonetic": "'ækjurәt"
  },
  {
    "word": "superior",
    "meaning": "a. 上级的，（在职位、地位等方面）较高的；优越的，优于……的，较……多的；优良的，卓越的；有优越感的，高傲的 n. 上级，长官",
    "example": "IELTS learners often encounter the word 'superior' in practice exercises.",
    "freq": 0.9637,
    "phonetic": "sju:'piәriә"
  },
  {
    "word": "tender",
    "meaning": "[ˈtendə(r)] a. 嫩的；脆弱的；温柔的",
    "example": "IELTS learners often encounter the word 'tender' in practice exercises.",
    "freq": 0.9634,
    "phonetic": "'tendә"
  },
  {
    "word": "willing",
    "meaning": "a. 愿意的，乐意的",
    "example": "IELTS learners often encounter the word 'willing' in practice exercises.",
    "freq": 0.9632,
    "phonetic": "'wiliŋ"
  },
  {
    "word": "perform",
    "meaning": "v. 履行，执行，完成；表演，演出；（机器）运作",
    "example": "IELTS learners often encounter the word 'perform' in practice exercises.",
    "freq": 0.9629,
    "phonetic": "pә'fɒ:m"
  },
  {
    "word": "seep",
    "meaning": "vi. 漏出，渗漏",
    "example": "IELTS learners often encounter the word 'seep' in practice exercises.",
    "freq": 0.9626,
    "phonetic": "si:p"
  },
  {
    "word": "ambassador",
    "meaning": "n. 大使，使节",
    "example": "IELTS learners often encounter the word 'ambassador' in practice exercises.",
    "freq": 0.9623,
    "phonetic": "æm'bæsәdә"
  },
  {
    "word": "delinquency",
    "meaning": "n. 失职；行为不良",
    "example": "IELTS learners often encounter the word 'delinquency' in practice exercises.",
    "freq": 0.962,
    "phonetic": "di'liŋkwәnsi"
  },
  {
    "word": "deliberate",
    "meaning": "a. 故意的；深思熟虑的；从容不迫的: [dɪˈlɪbəreɪt] v. 深思熟虑；审议",
    "example": "IELTS learners often encounter the word 'deliberate' in practice exercises.",
    "freq": 0.9618,
    "phonetic": "di'libәrәt"
  },
  {
    "word": "implication",
    "meaning": "n. 含意；暗示，暗指；卷入，牵连",
    "example": "IELTS learners often encounter the word 'implication' in practice exercises.",
    "freq": 0.9615,
    "phonetic": ".impli'keiʃәn"
  },
  {
    "word": "broom",
    "meaning": "n. 扫帚",
    "example": "IELTS learners often encounter the word 'broom' in practice exercises.",
    "freq": 0.9612,
    "phonetic": "bru:m"
  },
  {
    "word": "opponent",
    "meaning": "n. 敌手，对手；反对者 someone who disagree with a person or idea a. 对立的，对抗的",
    "example": "opponents of mandatory uniforms say that students who wear school uniforms cannot express their individuality",
    "freq": 0.9609,
    "phonetic": "ә'pәunәnt"
  },
  {
    "word": "sponsor",
    "meaning": "n. 发起者，赞助人，主办者；主顾 vt. 发起，主办；赞助，资助；惠顾",
    "example": "IELTS learners often encounter the word 'sponsor' in practice exercises.",
    "freq": 0.9607,
    "phonetic": "'spɒnsә"
  },
  {
    "word": "decisive",
    "meaning": "a. 决定性的；果断的",
    "example": "IELTS learners often encounter the word 'decisive' in practice exercises.",
    "freq": 0.9604,
    "phonetic": "di'saisiv"
  },
  {
    "word": "substantial",
    "meaning": "a. 可观的，大量的；坚固的，结实的；实质的；大体上的 large, considerable",
    "example": "insomnia, the inability to fall asleep or stay asleep, affects a substantial number of individuals",
    "freq": 0.9601,
    "phonetic": "sәb'stænʃәl"
  },
  {
    "word": "questionnaire",
    "meaning": "n. 问卷，调查表",
    "example": "IELTS learners often encounter the word 'questionnaire' in practice exercises.",
    "freq": 0.9598,
    "phonetic": "kwestʃә'nєә"
  },
  {
    "word": "viewpoint",
    "meaning": "n. 观点，看法",
    "example": "IELTS learners often encounter the word 'viewpoint' in practice exercises.",
    "freq": 0.9596,
    "phonetic": "'vju:pɒint"
  },
  {
    "word": "routine",
    "meaning": "n. 例行公事；惯例 a. 例行的；常规的",
    "example": "IELTS learners often encounter the word 'routine' in practice exercises.",
    "freq": 0.9593,
    "phonetic": "ru:'ti:n"
  },
  {
    "word": "nurture",
    "meaning": "vt. 培养；滋养 n. 营养品",
    "example": "IELTS learners often encounter the word 'nurture' in practice exercises.",
    "freq": 0.959,
    "phonetic": "'nә:tʃә"
  },
  {
    "word": "slight",
    "meaning": "a. 轻微的，不足道的；纤细的，瘦弱的 small vt./n. 轻视，藐视，轻蔑",
    "example": "speckers can look at the faces of the audience and search for that small nod of agreement or the slight smile, which often enough to make even the most fearful specker relax",
    "freq": 0.9587,
    "phonetic": "slait"
  }
];

export const SAMPLE_IELTS_CORE_VOCAB: IELTSCoreVocab[] = RAW_SAMPLE_IELTS_CORE_VOCAB.map((item) => ({
  ...item,
  meaning: toTraditionalChinese(item.meaning),
  example: item.example ? toTraditionalChinese(item.example) : '',
}));

export async function loadFullIELTSCoreVocab(): Promise<IELTSCoreVocab[]> {
  if (cachedVocab && cachedVocab.length > 0) {
    return cachedVocab;
  }

  let rawList: IELTSCoreVocab[] = SAMPLE_IELTS_CORE_VOCAB;
  try {
    const res = await fetch("/ielts/ielts_core.json");
    if (res.ok) {
      rawList = await res.json();
    }
  } catch (e) {
    console.warn("Failed to load full /ielts/ielts_core.json, using fallback sample", e);
  }

  // Ensure all meanings and examples are converted to Traditional Chinese
  cachedVocab = rawList.map((item) => ({
    ...item,
    meaning: toTraditionalChinese(item.meaning),
    example: item.example ? toTraditionalChinese(item.example) : '',
  }));

  return cachedVocab;
}
