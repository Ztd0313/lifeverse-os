/**
 * 记忆星球 Mock 数据
 *
 * 共 15 条记忆，分布在 5 个星球上（每个星球 3 条）。
 * 用于在记忆星球模块中展示与演示。
 *
 * 星球定义：
 * - forest  青春森林（校园 / 毕业 / 童年）
 * - ocean   爱情海洋（表白 / 约会 / 婚礼）
 * - town    家庭小镇（家庭聚会 / 父母 / 孩子）
 * - city    梦想之城（升职 / 创业 / 作品）
 * - mountain 成长山脉（失败 / 告别 / 蜕变）
 */

import type { MemoryItem } from '@/types';

export const MOCK_MEMORIES: MemoryItem[] = [
  // ===== 青春森林（forest）=====
  {
    id: 'mem-forest-1',
    title: '大学毕业典礼',
    type: 'photo',
    category: 'forest',
    content:
      '穿着学士服站在图书馆前，阳光透过梧桐叶洒下来。四年一晃而过，室友们约好十年后再回来看一次银杏。',
    emotion: 'warm',
    date: '2018-06-30T14:00:00+08:00',
    location: '北京·海淀区',
    people: ['自己', '父母', '室友'],
    tags: ['毕业', '仪式', '校园'],
    importance: 0.9,
  },
  {
    id: 'mem-forest-2',
    title: '第一次住校的夜晚',
    type: 'text',
    category: 'forest',
    content:
      '熄灯后躲在被子里给妈妈发短信，说想家。她回了一句"早点睡，明天还要军训"。那是第一次意识到，长大就是开始学会一个人面对夜晚。',
    emotion: 'cool',
    date: '2014-09-01T22:30:00+08:00',
    location: '上海·松江大学城',
    people: ['自己', '妈妈'],
    tags: ['校园', '童年', '成长'],
    importance: 0.6,
  },
  {
    id: 'mem-forest-3',
    title: '小学操场上的风筝',
    type: 'voice',
    category: 'forest',
    content:
      '录音里是十年前的自己，兴奋地喊"飞起来啦飞起来啦"。背景里有风声、有同学笑闹的声音，还有老师远远喊我们回去上课。',
    emotion: 'warm',
    date: '2005-04-12T15:20:00+08:00',
    location: '杭州·西湖区',
    people: ['自己', '小学同学', '班主任'],
    tags: ['童年', '游戏', '春天'],
    importance: 0.7,
  },

  // ===== 爱情海洋（ocean）=====
  {
    id: 'mem-ocean-1',
    title: '雨夜表白',
    type: 'text',
    category: 'ocean',
    content:
      '在便利店门口等了她两个小时，雨一直没停。她出现的时候我把伞递过去，说了一句"我喜欢你，比这场雨还久"。她笑了，没说话，但牵起了我的手。',
    emotion: 'warm',
    date: '2019-07-18T20:45:00+08:00',
    location: '成都·春熙路',
    people: ['自己', '她'],
    tags: ['表白', '雨夜', '心动'],
    importance: 0.95,
  },
  {
    id: 'mem-ocean-2',
    title: '海边的第一次约会',
    type: 'photo',
    category: 'ocean',
    content:
      '她光脚踩在沙滩上，裙摆被海风吹起来。我偷偷拍下这张照片，她回头看见时假装生气，却笑得比阳光还亮。',
    emotion: 'warm',
    date: '2019-08-24T17:10:00+08:00',
    location: '青岛·八大关',
    people: ['自己', '她'],
    tags: ['约会', '海边', '夏日'],
    importance: 0.8,
  },
  {
    id: 'mem-ocean-3',
    title: '婚礼上的誓言',
    type: 'video',
    category: 'ocean',
    content:
      '视频里我紧张得声音发抖，念完最后一句"我愿意"时，她眼里的泪光比任何灯光都耀眼。司仪说可以亲吻新娘，那一刻整个世界都安静了。',
    emotion: 'warm',
    date: '2022-10-05T11:30:00+08:00',
    location: '三亚·亚龙湾',
    people: ['自己', '她', '双方父母', '亲友'],
    tags: ['婚礼', '誓言', '仪式'],
    importance: 1.0,
  },

  // ===== 家庭小镇（town）=====
  {
    id: 'mem-town-1',
    title: '除夕夜的饺子',
    type: 'photo',
    category: 'town',
    content:
      '一家人围在桌前包饺子，妈妈负责擀皮，爸爸负责调馅，我负责把它们捏得歪歪扭扭。电视里春晚在放，窗外有零星的鞭炮声。',
    emotion: 'warm',
    date: '2021-02-11T19:30:00+08:00',
    location: '老家·客厅',
    people: ['自己', '爸爸', '妈妈'],
    tags: ['家庭', '春节', '团圆'],
    importance: 0.85,
  },
  {
    id: 'mem-town-2',
    title: '教爸爸用智能手机',
    type: 'text',
    category: 'town',
    content:
      '教了三遍他还是不会发语音，急得直挠头。我让他对着话筒说话，他像打电话一样把手机贴到耳朵边。我笑到肚子疼，他却认真地说"你别笑，再教我一遍"。',
    emotion: 'neutral',
    date: '2020-05-10T15:00:00+08:00',
    location: '老家·书房',
    people: ['自己', '爸爸'],
    tags: ['父母', '日常', '温情'],
    importance: 0.5,
  },
  {
    id: 'mem-town-3',
    title: '孩子第一次叫爸爸',
    type: 'voice',
    category: 'town',
    content:
      '录音是妻子偷偷录的。孩子在地板上爬着，突然抬头清晰地喊了一声"爸爸"。我愣了三秒，然后眼眶就湿了。',
    emotion: 'warm',
    date: '2024-03-15T10:20:00+08:00',
    location: '家·客厅',
    people: ['自己', '孩子', '妻子'],
    tags: ['孩子', '第一次', '家庭'],
    importance: 0.95,
  },

  // ===== 梦想之城（city）=====
  {
    id: 'mem-city-1',
    title: '第一次升职',
    type: 'text',
    category: 'city',
    content:
      '老板把我叫进办公室说"恭喜你升任组长"时，我表面平静地点头，回到工位却偷偷给妻子发了条消息。三年加班、无数个深夜，终于被看见。',
    emotion: 'warm',
    date: '2020-11-20T17:00:00+08:00',
    location: '公司·会议室',
    people: ['自己', '老板'],
    tags: ['升职', '事业', '里程碑'],
    importance: 0.85,
  },
  {
    id: 'mem-city-2',
    title: '产品上线那天',
    type: 'photo',
    category: 'city',
    content:
      '凌晨三点团队挤在会议室里盯着监控大屏，当 DAU 突破十万时所有人跳起来拥抱。这张合影里每个人眼睛都是红的，但笑得像孩子。',
    emotion: 'warm',
    date: '2023-06-08T03:15:00+08:00',
    location: '公司·会议室',
    people: ['自己', '团队成员'],
    tags: ['创业', '上线', '团队'],
    importance: 0.9,
  },
  {
    id: 'mem-city-3',
    title: '第一篇十万加',
    type: 'text',
    category: 'city',
    content:
      '写那篇文章时没抱任何期望，凌晨醒来发现阅读量已经破十万。评论区里有人说"谢谢你替我说出了心里话"，那一刻觉得写作这件事值得一直做下去。',
    emotion: 'neutral',
    date: '2022-04-12T08:00:00+08:00',
    location: '家·书房',
    people: ['自己'],
    tags: ['作品', '写作', '里程碑'],
    importance: 0.7,
  },

  // ===== 成长山脉（mountain）=====
  {
    id: 'mem-mountain-1',
    title: '创业失败的那天',
    type: 'text',
    category: 'mountain',
    content:
      '把公司账上最后一点钱结清工资后，我一个人坐在空荡荡的办公室里。窗外的城市灯火通明，却没有任何一盏是为我亮的。那天我学会了什么叫"体面地输"。',
    emotion: 'cool',
    date: '2021-12-30T23:50:00+08:00',
    location: '北京·中关村',
    people: ['自己'],
    tags: ['失败', '创业', '低谷'],
    importance: 0.9,
  },
  {
    id: 'mem-mountain-2',
    title: '和外公的告别',
    type: 'voice',
    category: 'mountain',
    content:
      '录音是外公住院时我偷偷录的，他虚弱地说"别哭，爷爷这辈子值了"。三天后他走了。这段录音我听了无数遍，每次都哭，但也每次都觉得他还在。',
    emotion: 'cool',
    date: '2019-03-08T14:00:00+08:00',
    location: '医院·病房',
    people: ['自己', '外公'],
    tags: ['告别', '亲人', ' loss'],
    importance: 1.0,
  },
  {
    id: 'mem-mountain-3',
    title: '独自完成第一次马拉松',
    type: 'photo',
    category: 'mountain',
    content:
      '冲过终点线时双腿发软，却笑得像个孩子。42 公里，4 小时 38 分。半年前那个连跑 1 公里都喘的人，原来真的可以做到。蜕变从来不是一夜之间。',
    emotion: 'neutral',
    date: '2023-11-19T11:30:00+08:00',
    location: '上海·外滩',
    people: ['自己'],
    tags: ['蜕变', '马拉松', '坚持'],
    importance: 0.8,
  },
];

/**
 * 5 个星球的元信息定义
 *
 * 用于星球导航与卡片展示，统一管理名称、配色、图标与描述。
 */
export interface PlanetMeta {
  id: MemoryItem['category'];
  name: string;
  nameEn: string;
  color: string;
  description: string;
  icon: 'TreePine' | 'Waves' | 'Home' | 'Building2' | 'Mountain';
}

export const PLANETS: PlanetMeta[] = [
  {
    id: 'forest',
    name: '青春森林',
    nameEn: 'Forest',
    color: '#5de8a0',
    description: '校园 / 毕业 / 童年',
    icon: 'TreePine',
  },
  {
    id: 'ocean',
    name: '爱情海洋',
    nameEn: 'Ocean',
    color: '#5da0e8',
    description: '表白 / 约会 / 婚礼',
    icon: 'Waves',
  },
  {
    id: 'town',
    name: '家庭小镇',
    nameEn: 'Town',
    color: '#e8a05d',
    description: '家庭聚会 / 父母 / 孩子',
    icon: 'Home',
  },
  {
    id: 'city',
    name: '梦想之城',
    nameEn: 'City',
    color: '#b8a0c8',
    description: '升职 / 创业 / 作品',
    icon: 'Building2',
  },
  {
    id: 'mountain',
    name: '成长山脉',
    nameEn: 'Mountain',
    color: '#eae8e3',
    description: '失败 / 告别 / 蜕变',
    icon: 'Mountain',
  },
];

/**
 * 情感色调元信息
 */
export interface EmotionMeta {
  id: MemoryItem['emotion'];
  label: string;
  color: string;
  borderClass: string;
}

export const EMOTIONS: EmotionMeta[] = [
  {
    id: 'warm',
    label: '暖',
    color: '#c9a84c',
    borderClass: 'border-gold',
  },
  {
    id: 'cool',
    label: '冷',
    color: '#5da0e8',
    borderClass: 'border-blue',
  },
  {
    id: 'neutral',
    label: '中性',
    color: '#9a9a9a',
    borderClass: 'border-border',
  },
];

/**
 * 根据星球 id 获取星球元信息
 */
export function getPlanetMeta(id: MemoryItem['category']): PlanetMeta | undefined {
  return PLANETS.find((p) => p.id === id);
}

/**
 * 根据情感 id 获取情感元信息
 */
export function getEmotionMeta(id: MemoryItem['emotion']): EmotionMeta | undefined {
  return EMOTIONS.find((e) => e.id === id);
}
