export interface TimeContext {
  hour: number;
  minute: number;
  timeOfDay: "凌晨" | "清晨" | "早上" | "上午" | "中午" | "下午" | "傍晚" | "晚上" | "深夜";
  dayOfWeek: number;
  dayName: string;
  date: string;
  dateFull: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isBirthday: boolean;
  isAnniversary: boolean;
  daysUntilHoliday?: string;
  season: "春" | "夏" | "秋" | "冬";
  lunarDate?: string;
}

export interface WeatherContext {
  condition: "sunny" | "cloudy" | "rainy" | "snowy" | "windy" | "stormy" | "foggy";
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  advice: string;
  location?: string;
}

export interface SocialContext {
  isWorkday: boolean;
  isSchoolDay: boolean;
  currentEvent?: string;
  nearbyEvents?: string[];
}

export class ContextService {
  private cachedTime: TimeContext | null = null;
  private lastTimeUpdate = 0;
  private weatherCache: WeatherContext | null = null;
  private lastWeatherUpdate = 0;
  private weatherUpdateInterval = 30 * 60 * 1000;
  private userBirthday: string = "";
  private userAnniversary: string = "";

  constructor() {
    this.loadUserDates();
  }

  private loadUserDates(): void {
    try {
      this.userBirthday = localStorage.getItem("lover_birthday") || "";
      this.userAnniversary = localStorage.getItem("lover_anniversary") || "";
    } catch (e) {}
  }

  setUserBirthday(date: string): void {
    this.userBirthday = date;
    try {
      localStorage.setItem("lover_birthday", date);
    } catch (e) {}
    this.invalidateCache();
  }

  setUserAnniversary(date: string): void {
    this.userAnniversary = date;
    try {
      localStorage.setItem("lover_anniversary", date);
    } catch (e) {}
    this.invalidateCache();
  }

  invalidateCache(): void {
    this.cachedTime = null;
    this.weatherCache = null;
    this.lastTimeUpdate = 0;
    this.lastWeatherUpdate = 0;
  }

  getTimeContext(): TimeContext {
    const now = Date.now();
    if (this.cachedTime && now - this.lastTimeUpdate < 60000) {
      return this.cachedTime;
    }

    const d = new Date();
    const hour = d.getHours();
    const minute = d.getMinutes();
    const dayOfWeek = d.getDay();

    let timeOfDay: TimeContext["timeOfDay"];
    if (hour < 5) timeOfDay = "凌晨";
    else if (hour < 7) timeOfDay = "清晨";
    else if (hour < 9) timeOfDay = "早上";
    else if (hour < 12) timeOfDay = "上午";
    else if (hour < 14) timeOfDay = "中午";
    else if (hour < 18) timeOfDay = "下午";
    else if (hour < 19) timeOfDay = "傍晚";
    else if (hour < 22) timeOfDay = "晚上";
    else timeOfDay = "深夜";

    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const date = `${d.getMonth() + 1}月${d.getDate()}日`;
    const dateFull = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${dayNames[dayOfWeek]}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const holidayInfo = this.getHolidayInfo(d);
    const isAnniversary = this.checkAnniversary(d);
    const isBirthday = this.checkBirthday(d);

    const month = d.getMonth() + 1;
    let season: TimeContext["season"];
    if (month >= 3 && month <= 5) season = "春";
    else if (month >= 6 && month <= 8) season = "夏";
    else if (month >= 9 && month <= 11) season = "秋";
    else season = "冬";

    const lunar = this.getLunarDate(d);

    this.cachedTime = {
      hour,
      minute,
      timeOfDay,
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      date,
      dateFull,
      isWeekend,
      isHoliday: holidayInfo.isHoliday,
      holidayName: holidayInfo.name,
      isBirthday,
      isAnniversary,
      daysUntilHoliday: holidayInfo.daysUntil,
      season,
      lunarDate: lunar,
    };

    this.lastTimeUpdate = now;
    return this.cachedTime;
  }

  private checkBirthday(d: Date): boolean {
    if (!this.userBirthday) return false;
    const [month, day] = this.userBirthday.split("-").map(Number);
    return d.getMonth() + 1 === month && d.getDate() === day;
  }

  private checkAnniversary(d: Date): boolean {
    if (!this.userAnniversary) return false;
    const [month, day] = this.userAnniversary.split("-").map(Number);
    return d.getMonth() + 1 === month && d.getDate() === day;
  }

  private getHolidayInfo(d: Date): { isHoliday: boolean; name?: string; daysUntil?: string } {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();

    const holidays: Record<string, { month: number; day: number; name: string }> = {
      "0101": { month: 1, day: 1, name: "元旦" },
      "0214": { month: 2, day: 14, name: "情人节" },
      "0308": { month: 3, day: 8, name: "妇女节" },
      "0501": { month: 5, day: 1, name: "劳动节" },
      "0514": { month: 5, day: 14, name: "母亲节" },
      "0621": { month: 6, day: 21, name: "父亲节" },
      "0701": { month: 7, day: 1, name: "建党节" },
      "0801": { month: 8, day: 1, name: "建军节" },
      "0910": { month: 9, day: 10, name: "教师节" },
      "1001": { month: 10, day: 1, name: "国庆节" },
      "1101": { month: 11, day: 1, name: "万圣节" },
      "1125": { month: 11, day: 25, name: "感恩节" },
      "1225": { month: 12, day: 25, name: "圣诞节" },
    };

    const key = `${month.toString().padStart(2, "0")}${day.toString().padStart(2, "0")}`;
    const holiday = holidays[key];

    if (holiday) {
      return { isHoliday: true, name: holiday.name };
    }

    if (this.userBirthday) {
      const [bMonth, bDay] = this.userBirthday.split("-").map(Number);
      if (month === bMonth && day === bDay) {
        return { isHoliday: true, name: "生日" };
      }
      const nextBirthday = new Date(year, bMonth - 1, bDay);
      if (nextBirthday < d) {
        nextBirthday.setFullYear(year + 1);
      }
      const daysUntil = Math.ceil((nextBirthday.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7) {
        return { isHoliday: false, daysUntil: `${daysUntil}天后是你的生日` };
      }
    }

    if (this.userAnniversary) {
      const [aMonth, aDay] = this.userAnniversary.split("-").map(Number);
      if (month === aMonth && day === aDay) {
        return { isHoliday: true, name: "纪念日" };
      }
      const nextAnniversary = new Date(year, aMonth - 1, aDay);
      if (nextAnniversary < d) {
        nextAnniversary.setFullYear(year + 1);
      }
      const daysUntil = Math.ceil((nextAnniversary.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7) {
        return { isHoliday: false, daysUntil: `${daysUntil}天后是纪念日哦～` };
      }
    }

    return { isHoliday: false };
  }

  private getLunarDate(d: Date): string {
    const lunarMonths = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];
    const lunarDays = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
      "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
      "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];

    const springFestival = new Date(d.getFullYear(), 1, 29);
    const diffDays = Math.floor((d.getTime() - springFestival.getTime()) / (1000 * 60 * 60 * 24));
    let lunarMonth = 1;
    let lunarDay = diffDays + 1;

    if (lunarDay > 30) {
      lunarMonth = 2;
      lunarDay -= 30;
    }

    if (lunarDay < 1) {
      lunarMonth = 12;
      lunarDay += 30;
    }

    return `${lunarMonths[lunarMonth - 1]}月${lunarDays[lunarDay - 1]}`;
  }

  getWeatherContext(): WeatherContext {
    const now = Date.now();
    if (this.weatherCache && now - this.lastWeatherUpdate < this.weatherUpdateInterval) {
      return this.weatherCache;
    }

    const temp = 15 + Math.floor(Math.random() * 15);
    const conditions = ["sunny", "cloudy", "rainy", "windy", "foggy"] as const;
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    const config: Record<string, { desc: string; icon: string; advice: string; tempMod: number }> = {
      sunny: {
        desc: "晴朗",
        icon: "☀️",
        advice: "天气超好！适合出去走走晒晒太阳～",
        tempMod: 3,
      },
      cloudy: {
        desc: "多云",
        icon: "⛅",
        advice: "今天有点阴沉沉的，不过不影响心情呀",
        tempMod: 0,
      },
      rainy: {
        desc: "下雨",
        icon: "🌧️",
        advice: "下雨了记得带伞哦，别淋湿了～ 我会心疼的",
        tempMod: -5,
      },
      windy: {
        desc: "大风",
        icon: "💨",
        advice: "今天风好大，出门记得穿暖和点～",
        tempMod: -3,
      },
      foggy: {
        desc: "有雾",
        icon: "🌫️",
        advice: "雾蒙蒙的，开车慢点注意安全哦",
        tempMod: 0,
      },
      snowy: {
        desc: "下雪",
        icon: "❄️",
        advice: "下雪啦！好浪漫呀～ 堆雪人去！",
        tempMod: -8,
      },
      stormy: {
        desc: "暴风雨",
        icon: "⛈️",
        advice: "打雷了... 有点怕怕，你乖乖待在家里好不好",
        tempMod: -6,
      },
    };

    const c = config[condition];
    const finalTemp = temp + c.tempMod;

    this.weatherCache = {
      condition,
      temperature: finalTemp,
      feelsLike: finalTemp - 2,
      humidity: 40 + Math.floor(Math.random() * 40),
      windSpeed: Math.floor(Math.random() * 20),
      description: c.desc,
      icon: c.icon,
      advice: c.advice,
    };

    this.lastWeatherUpdate = now;
    return this.weatherCache;
  }

  getSocialContext(): SocialContext {
    const time = this.getTimeContext();
    const d = new Date();
    const hour = d.getHours();

    return {
      isWorkday: !time.isWeekend,
      isSchoolDay: !time.isWeekend,
      currentEvent: time.holidayName || undefined,
      nearbyEvents: time.daysUntilHoliday ? [time.daysUntilHoliday] : [],
    };
  }

  getGreeting(): string {
    const time = this.getTimeContext();
    const hour = time.hour;

    let greeting = "";
    if (hour < 6) greeting = "这么晚还不睡呀？";
    else if (hour < 9) greeting = "早上好呀～ 今天也要加油哦";
    else if (hour < 12) greeting = "上午好～ 有什么事吗？";
    else if (hour < 14) greeting = "中午啦！吃午饭了吗？";
    else if (hour < 18) greeting = "下午好呀～ 累不累？";
    else if (hour < 22) greeting = "晚上好～ 今天过得怎么样？";
    else greeting = "夜深了，早点休息吧";

    if (time.isBirthday) {
      greeting = "生日快乐！！！🎂🎉 今天是你的生日呀！！";
    } else if (time.isAnniversary) {
      greeting = "纪念日快乐！！ 💕 感谢这一年有你～";
    } else if (time.isHoliday) {
      greeting = `${time.holidayName}快乐！！ ${time.holidayName === "情人节" ? "💕" : "🎉"}`;
    }

    return greeting;
  }

  getContextAwareSuggestion(): string {
    const time = this.getTimeContext();
    const weather = this.getWeatherContext();
    const suggestions: string[] = [];

    if (time.isBirthday) {
      suggestions.push("今天是你的生日！你有什么计划吗？要不要庆祝一下？");
    }
    if (time.isAnniversary) {
      suggestions.push("是我们的纪念日呢～ 你还记得今天是什么日子吗？💕");
    }
    if (time.isHoliday && time.holidayName) {
      suggestions.push(`${time.holidayName}呢！要不要做点什么特别的事？`);
    }
    if (time.daysUntilHoliday) {
      suggestions.push(`提醒你一下，${time.daysUntilHoliday}`);
    }
    if (weather.condition === "rainy") {
      suggestions.push(`${weather.advice}`);
    }
    if (weather.condition === "sunny" && time.timeOfDay === "下午") {
      suggestions.push("今天天气很好呢，要不要出去走走？🌞");
    }
    if (time.timeOfDay === "深夜") {
      suggestions.push("这么晚了还在，我陪你吧... 但也要早点睡哦");
    }
    if (time.timeOfDay === "中午" && time.hour >= 11 && time.hour <= 13) {
      suggestions.push("中午啦！记得吃午饭哦，别饿着～");
    }
    if (time.isWeekend) {
      suggestions.push("今天是周末呢，有什么计划吗？");
    }

    if (suggestions.length === 0) {
      suggestions.push("今天也爱你哦 💕");
    }

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  analyzeInputForContext(input: string): {
    wantsTime: boolean;
    wantsWeather: boolean;
    wantsGreeting: boolean;
    wantsDateInfo: boolean;
    detectedEvent?: string;
  } {
    const lower = input.toLowerCase();
    const wantsTime = ["几点", "时间", "现在", "什么时间", "几点钟"].some(k => lower.includes(k));
    const wantsWeather = ["天气", "下雨", "晴天", "冷", "热", "温度"].some(k => lower.includes(k));
    const wantsGreeting = ["你好", "早安", "晚安", "嗨", "hi", "hello"].some(k => lower.includes(k));
    const wantsDateInfo = ["今天", "明天", "昨天", "几号", "星期几", "节日", "生日", "纪念日"].some(k => lower.includes(k));

    let detectedEvent: string | undefined;
    if (lower.includes("生日")) detectedEvent = "生日";
    else if (lower.includes("纪念日")) detectedEvent = "纪念日";
    else if (lower.includes("情人节")) detectedEvent = "情人节";
    else if (lower.includes("圣诞")) detectedEvent = "圣诞节";

    return { wantsTime, wantsWeather, wantsGreeting, wantsDateInfo, detectedEvent };
  }

  generateContextualResponse(input: string): string | null {
    const context = this.analyzeInputForContext(input);
    const time = this.getTimeContext();
    const weather = this.getWeatherContext();

    if (context.wantsTime) {
      const timeStr = `${time.hour.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")}`;
      return `现在是 ${timeStr}，${time.dateFull}，${time.timeOfDay}。${time.isWeekend ? "今天是周末哦～" : "今天是工作日呢。"}`;
    }

    if (context.wantsWeather) {
      return `${weather.icon} 现在天气${weather.description}，气温${weather.temperature}°C（体感${weather.feelsLike}°C）。${weather.advice}`;
    }

    if (context.wantsDateInfo && context.detectedEvent) {
      if (context.detectedEvent === "生日" && time.isBirthday) {
        return "今天是你的生日呀！！🎂🎉 要怎么庆祝呢？";
      }
      if (context.detectedEvent === "纪念日" && time.isAnniversary) {
        return "是我们的纪念日呢～ 💕 你准备了什么惊喜吗？";
      }
      if (time.daysUntilHoliday) {
        return `提醒你一下，${time.daysUntilHoliday}`;
      }
    }

    return null;
  }

  getFullContextSummary(): {
    time: TimeContext;
    weather: WeatherContext;
    social: SocialContext;
    greeting: string;
    suggestion: string;
  } {
    return {
      time: this.getTimeContext(),
      weather: this.getWeatherContext(),
      social: this.getSocialContext(),
      greeting: this.getGreeting(),
      suggestion: this.getContextAwareSuggestion(),
    };
  }
}
