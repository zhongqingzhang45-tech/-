const SURNAMES = [
  "李", "王", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴",
  "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗",
  "梁", "宋", "郑", "谢", "韩", "唐", "冯", "于", "董", "萧",
  "程", "曹", "袁", "邓", "许", "傅", "沈", "曾", "彭", "吕",
];

const FEMALE_NAMES = [
  "语嫣", "梦瑶", "诗涵", "梓萱", "欣怡", "佳琪", "雨桐", "思琪",
  "若曦", "婉清", "芷若", "晓萱", "雅琴", "书瑶", "雪琪", "月婵",
  "静怡", "晨曦", "紫涵", "嫣然", "瑾萱", "雨薇", "沐雪", "婧琪",
  "可馨", "慧妍", "乐瑶", "婉柔", "思雨", "语琴",
];

const MALE_NAMES = [
  "子轩", "浩宇", "浩然", "宇辰", "瑾瑜", "明远", "修远", "子墨",
  "云飞", "清风", "慕白", "逸尘", "泽宇", "景行", "思远", "知许",
  "承宇", "柏舟", "其琛", "之恒", "君浩", "伟祺", "睿渊", "昊焱",
  "卓宇", "博涛", "明辉", "德佑", "承安", "修齐",
];

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  
  return function() {
    hash = Math.sin(hash) * 10000;
    return hash - Math.floor(hash);
  };
}

export function generateName(gender: "male" | "female", seed?: string): {
  fullName: string;
  givenName: string;
  surname: string;
  nickname: string;
} {
  const random = seed ? seededRandom(seed) : Math.random;
  
  const surname = SURNAMES[Math.floor(random() * SURNAMES.length)];
  const nameList = gender === "female" ? FEMALE_NAMES : MALE_NAMES;
  const givenName = nameList[Math.floor(random() * nameList.length)];
  const fullName = surname + givenName;
  
  const nickname = givenName.slice(-1).repeat(2);
  
  return {
    fullName,
    givenName,
    surname,
    nickname,
  };
}

export function generateNickname(gender: "male" | "female"): string {
  if (gender === "female") {
    const nicknames = ["宝贝", "亲爱的", "笨蛋", "傻瓜", "小朋友", "小可爱", "乖乖", "老公"];
    return nicknames[Math.floor(Math.random() * nicknames.length)];
  } else {
    const nicknames = ["宝贝", "亲爱的", "小家伙", "小笨蛋", "傻瓜", "小朋友", "丫头", "老婆"];
    return nicknames[Math.floor(Math.random() * nicknames.length)];
  }
}
