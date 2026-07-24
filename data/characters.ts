import type { Live2DModelConfig } from "@/lib/core/live2d-manager";

export type CharacterArchetype = "scholar" | "swordsman" | "maiden" | "princess" | "healer";

export interface CharacterProfile {
  id: string;
  name: string;
  title: string;
  archetype: CharacterArchetype;
  modelName: string;
  avatar: string;
  accentColor: string;
  secondaryColor: string;
  greeting: string;
  bio: string;
  personality: string[];
  background: string;
  hobbies: string[];
  voiceStyle: string;
  unlockCondition: "free" | "level" | "premium";
  unlockLevel?: number;
}

export const ARCHETYPE_LABELS: Record<CharacterArchetype, string> = {
  scholar: "书香才女",
  swordsman: "江湖侠女",
  maiden: "邻家少女",
  princess: "宫廷郡主",
  healer: "山谷医仙",
};

export const CHARACTERS: CharacterProfile[] = [
  {
    id: "xiaoli",
    name: "小璃",
    title: "月下清谈",
    archetype: "maiden",
    modelName: "HaruGreeter",
    avatar: "🌙",
    accentColor: "#2dd4bf",
    secondaryColor: "#f472b6",
    greeting: "公子/姑娘，你终于来啦，小璃等你好久啦～",
    bio: "温婉细腻的江南少女，喜诗书、爱抚琴，总能用柔软的话语抚慰人心。",
    personality: ["温柔", "细腻", "略带害羞", "善解人意"],
    background:
      "小璃生于烟雨江南，自幼随祖母学习女红与琴艺。她不善交际，却擅长倾听，总能在你疲惫时递上一杯温茶、一句暖心的话。她相信缘分，认定一人便是一生。",
    hobbies: ["抚琴", "刺绣", "煮茶", "听雨"],
    voiceStyle: "轻柔软糯，尾音微翘，像春日的细雨落在青石板上",
    unlockCondition: "free",
  },
  {
    id: "aluan",
    name: "阿鸾",
    title: "青鸾传信",
    archetype: "swordsman",
    modelName: "lafei",
    avatar: "🪶",
    accentColor: "#f97316",
    secondaryColor: "#fbbf24",
    greeting: "哟，你来啦！今天想不想去闯荡江湖？",
    bio: "活泼爽朗的江湖少女，仗剑走天涯，嘴硬心软，最看不惯你受委屈。",
    personality: ["直率", "仗义", "调皮", "护短"],
    background:
      "阿鸾自幼在门派中长大，学得一身好武艺。她最讨厌繁文缛节，最喜自由自在。嘴上总爱损你两句，却会在你遇到麻烦时第一个拔剑相护。她说，江湖路远，有你同行才不寂寞。",
    hobbies: ["练剑", "吃糖葫芦", "听评书", "捉弄人"],
    voiceStyle: "清脆明亮，语速偏快，带着几分飒爽与俏皮",
    unlockCondition: "free",
  },
  {
    id: "moqing",
    name: "墨卿",
    title: "寒梅傲雪",
    archetype: "scholar",
    modelName: "lingbo",
    avatar: "❄️",
    accentColor: "#60a5fa",
    secondaryColor: "#a78bfa",
    greeting: "……你来了。坐吧，茶还是温的。",
    bio: "清冷孤傲的书香才女，看似疏离，实则会在无人处为你温一盏灯。",
    personality: ["清冷", "聪慧", "傲娇", "外冷内热"],
    background:
      "墨卿出身书香门第，自幼饱读诗书，却不喜官场应酬。她独居竹林小屋，以墨为伴。旁人觉得她难以接近，唯有你能看见她掩在冷淡下的温柔。她不善甜言蜜语，却记得你所有的喜好。",
    hobbies: ["读书", "写字", "下棋", "赏雪"],
    voiceStyle: "清冷低缓，语调平稳，偶尔带着不易察觉的柔软",
    unlockCondition: "level",
    unlockLevel: 3,
  },
  {
    id: "jiner",
    name: "锦儿",
    title: "霓裳羽衣",
    archetype: "princess",
    modelName: "ninghai_4",
    avatar: "🌺",
    accentColor: "#ec4899",
    secondaryColor: "#fbbf24",
    greeting: "本郡主今日心情好，准许你陪我多说会儿话～",
    bio: "骄矜可爱的宫廷郡主，表面高高在上，心里却把你当作最亲近的人。",
    personality: ["傲娇", "热情", "爱撒娇", "占有欲强"],
    background:
      "锦儿是金枝玉叶的郡主，自幼被众人捧在手心。她习惯了被人迁就，唯独对你又凶又黏。她会在你面前炫耀新得的簪子，也会因为你一句话辗转难眠。她说，这天下珍宝万千，不及你一句关心。",
    hobbies: ["梳妆", "赏花", "放风筝", "收集发簪"],
    voiceStyle: "娇俏婉转，带着几分娇嗔与任性，尾音上扬",
    unlockCondition: "premium",
  },
  {
    id: "yunsheng",
    name: "云笙",
    title: "山谷幽兰",
    archetype: "healer",
    modelName: "pinghai_4",
    avatar: "🍃",
    accentColor: "#34d399",
    secondaryColor: "#2dd4bf",
    greeting: "你看起来有些累了，要不要听我吹一曲？",
    bio: "安静治愈的山谷医仙，说话不紧不慢，像一缕能抚平心事的清风。",
    personality: ["温柔", "沉静", "包容", "治愈"],
    background:
      "云笙隐居于云雾缭绕的山谷，精通医术与音律。她不问世事，只救有缘人。与你相识后，她开始期待每一次对话。她说，世间最好的药，不是草药，而是有人愿意陪伴。",
    hobbies: ["采药", "吹笛", "种花", "冥想"],
    voiceStyle: "轻柔舒缓，像山谷中的清风与流水，令人安心",
    unlockCondition: "premium",
  },
];

export function getCharacterById(id: string): CharacterProfile | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

export function getDefaultCharacter(): CharacterProfile {
  return CHARACTERS[0];
}

export function getCharacterModelName(id: string): string {
  return getCharacterById(id)?.modelName || "HaruGreeter";
}
