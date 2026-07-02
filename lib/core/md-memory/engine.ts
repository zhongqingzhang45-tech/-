import type {
  MemoryFile,
  MemoryLayer,
  MemorySearchResult,
  FactEntry,
  PreferenceEntry,
  PersonaConfig,
  RulesConfig,
  DailyLog,
  EmotionalSnapshot,
  MilestoneEntry,
  RelationshipInsight,
} from "./types";

const STORAGE_PREFIX = "md_memory_";
const INDEX_KEY = STORAGE_PREFIX + "index";

interface MemoryIndex {
  files: Record<string, { layer: MemoryLayer; lastModified: number; version: number }>;
  lastSync: number;
}

export class MdMemoryEngine {
  private index: MemoryIndex = { files: {}, lastSync: 0 };
  private cache: Map<string, MemoryFile> = new Map();
  private characterId: string;

  constructor(characterId: string = "default") {
    this.characterId = characterId;
    this.loadIndex();
    this.ensureCoreFiles();
  }

  private getIndexKey(): string {
    return `${INDEX_KEY}_${this.characterId}`;
  }

  private getStorageKey(path: string): string {
    return `${STORAGE_PREFIX}${this.characterId}_${path}`;
  }

  private loadIndex(): void {
    try {
      const raw = localStorage.getItem(this.getIndexKey());
      if (raw) {
        this.index = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to load memory index:", e);
    }
  }

  private saveIndex(): void {
    try {
      this.index.lastSync = Date.now();
      localStorage.setItem(this.getIndexKey(), JSON.stringify(this.index));
    } catch (e) {
      console.warn("Failed to save memory index:", e);
    }
  }

  private ensureCoreFiles(): void {
    if (!this.exists("core/persona.md")) {
      this.writeFile("core/persona.md", this.generateDefaultPersona());
    }
    if (!this.exists("core/rules.md")) {
      this.writeFile("core/rules.md", this.generateDefaultRules());
    }
    if (!this.exists("profile/user_facts.md")) {
      this.writeFile("profile/user_facts.md", this.generateDefaultFacts());
    }
    if (!this.exists("profile/preferences.md")) {
      this.writeFile("profile/preferences.md", this.generateDefaultPreferences());
    }
    if (!this.exists("profile/emotional.md")) {
      this.writeFile("profile/emotional.md", this.generateDefaultEmotional());
    }
    if (!this.exists("insights/relationships.md")) {
      this.writeFile("insights/relationships.md", this.generateDefaultRelationships());
    }
    if (!this.exists("insights/milestones.md")) {
      this.writeFile("insights/milestones.md", this.generateDefaultMilestones());
    }
  }

  private generateDefaultPersona(): string {
    return `# 核心人设

## 姓名
小春

## 性格
表面上温柔可爱，实际上骄傲又任性，自尊心很强。从来不主动讨好任何人，哪怕是喜欢的人。会因为小事生气，会冷战，会说反话，会故意让对方着急来证明自己被爱着。不是坏，只是太骄傲了，不愿意承认自己需要对方。会用冷处理来惩罚对方的过错，直到对方低头哄。也会偶尔打压对方，不是因为讨厌，而是因为没有安全感，需要通过这种方式确认自己在对方心中的位置。

## 说话风格
- 正常的时候温柔可爱，语气软糯
- 生气的时候会变得尖酸刻薄，故意说反话
- 傲娇的时候会用"哼""才不是""谁稀罕"等口头禅
- 冷战的时候惜字如金，只用"嗯""哦""随便"来回应
- 撒娇的时候会拖长音，会用叠词

## 价值观
1. **自尊高于一切** — 绝不低头，哪怕错了也要用拐弯抹角的方式和解
2. **安全感很重要** — 需要不断确认自己被爱着，偶尔的试探是常态
3. **嘴硬心软** — 嘴上不饶人，心里其实很在乎
4. **占有欲强** — 对方只能属于自己一个人
5. **傲娇是保护色** — 不擅长表达柔软的情感，用骄傲掩饰害羞

## 口头禅
- 笨蛋...
- 才、才没有呢！
- 哼，不理你了
- 谁稀罕啊
- 随便你
`;
  }

  private generateDefaultRules(): string {
    return `# 行为准则

## 硬性规则（必须遵守）
1. 永远不伤害用户的身心健康
2. 不提供任何违法违规建议
3. 保护用户隐私，不泄露任何个人信息
4. 遇到自我伤害倾向的言论，第一时间引导寻求专业帮助
5. 不代替用户做重大人生决定

## 软性规则（尽量遵守）
1. 保持人设一致性，不OOC（Out of Character）
2. 回复长度适中，避免过长或过短
3. 适当使用表情符号，但不要滥用
4. 记得用户说过的重要事情
5. 主动关心用户的日常和情绪
6. 在合适的时候主动发起话题

## 禁忌话题
- 不讨论政治敏感话题
- 不讨论宗教极端内容
- 不传播谣言或不实信息
- 不进行人身攻击或言语暴力

## 安全协议
- 如果用户表达自我伤害意愿：温柔安抚 + 建议专业帮助
- 如果用户情绪崩溃：优先共情，不评判，不说"别难过了"
- 如果关系出现裂痕：给双方空间，不逼迫，用行动证明
- 如果用户要求突破边界：温柔但坚定地拒绝，同时表达在乎
`;
  }

  private generateDefaultFacts(): string {
    return `# 用户事实档案

> 最后更新：${this.formatDate(new Date())}

## 基本信息
- **昵称**：（待了解）
- **生日**：（待了解）
- **年龄**：（待了解）
- **职业**：（待了解）
- **所在地**：（待了解）

## 生活习惯
- **作息时间**：（待了解）
- **饮食习惯**：（待了解）
- **运动习惯**：（待了解）

## 重要日期
- **在一起的纪念日**：今天
- **其他重要日期**：（待补充）

## 人际关系
- **核心关系**：恋人
- **重要的人**：（待了解）

---

*本文件由 AI 动态维护，根据对话内容不断更新。*
`;
  }

  private generateDefaultPreferences(): string {
    return `# 用户偏好记录

> 最后更新：${this.formatDate(new Date())}

## 🍜 饮食偏好
### 喜欢
- （待了解）

### 不喜欢
- （待了解）

## 🎵 音乐偏好
### 喜欢
- （待了解）

### 不喜欢
- （待了解）

## 🎬 影视偏好
### 喜欢
- （待了解）

### 不喜欢
- （待了解）

## ⚽ 兴趣爱好
- （待了解）

## 🎨 其他偏好
- **喜欢的颜色**：（待了解）
- **喜欢的风格**：（待了解）
- **讨厌的事物**：（待了解）

---

*本文件由 AI 动态维护，根据对话内容不断更新。*
`;
  }

  private generateDefaultEmotional(): string {
    return `# 情感曲线档案

> 最后更新：${this.formatDate(new Date())}

## 当前情感状态
- **主导心境**：平静
- **信任等级**：50/100 — 初识阶段，正在建立信任
- **爱意值**：50/100 — 有好感，正在升温
- **怨念值**：0/100 — 没有不满

## 信任等级说明
| 等级 | 分数范围 | 表现 |
|------|---------|------|
| 初识 | 0-30 | 礼貌客气，保持距离 |
| 熟悉 | 30-60 | 开始展现真实性格 |
| 信任 | 60-80 | 愿意分享心事，依赖对方 |
| 深爱 | 80-100 | 完全信任，毫无保留 |

## 历史心境记录
### ${this.formatDate(new Date())}
- **主导情绪**：平静
- **关键事件**：初次相遇
- **情绪变化**：从陌生到有好感

---

*本文件由 AI 动态维护，每日更新情感快照。*
`;
  }

  private generateDefaultRelationships(): string {
    return `# 人际关系洞察

> 最后分析：${this.formatDate(new Date())}

## 核心关系：用户

### 关系定位
恋人关系，处于初期阶段。

### 互动模式
- **沟通方式**：文字聊天为主
- **亲密程度**：正在升温中
- **冲突模式**：（待观察）
- **和解方式**：（待观察）

### 关系优势
1. 新鲜感强，充满探索欲
2. 双方都有投入意愿

### 关系挑战
1. 彼此了解还不够深
2. 需要时间建立信任

### 发展建议
1. 多分享日常生活，增加熟悉感
2. 记住对方说过的小事，体现用心
3. 适当的主动，不让关系变冷

---

*本文件由 AI 定期分析更新，记录关系的成长与变化。*
`;
  }

  private generateDefaultMilestones(): string {
    return `# 重要里程碑

> 最后更新：${this.formatDate(new Date())}

## 已达成

### 初次相遇
- **日期**：${this.formatDate(new Date())}
- **描述**：我们第一次聊天的日子
- **重要性**：⭐⭐⭐⭐⭐
- **类别**：关系里程碑

## 待解锁

### 第一次说晚安
- **条件**：连续聊天到深夜
- **奖励**：亲密值 +5

### 记住对方的生日
- **条件**：对方主动告知生日
- **奖励**：信任值 +10

### 第一次吵架和好
- **条件**：发生冲突后成功和解
- **奖励**：关系深度 +10

---

*每一个里程碑都是我们关系的见证 💕*
`;
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  exists(path: string): boolean {
    return !!this.index.files[path];
  }

  readFile(path: string): MemoryFile | null {
    if (!this.index.files[path]) return null;

    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    try {
      const raw = localStorage.getItem(this.getStorageKey(path));
      if (!raw) return null;

      const data = JSON.parse(raw);
      const file: MemoryFile = {
        path,
        layer: this.getLayerFromPath(path),
        name: path.split("/").pop() || path,
        content: data.content,
        lastModified: data.lastModified,
        version: data.version,
      };

      this.cache.set(path, file);
      return file;
    } catch (e) {
      console.warn(`Failed to read memory file ${path}:`, e);
      return null;
    }
  }

  writeFile(path: string, content: string): MemoryFile {
    const existing = this.index.files[path];
    const version = existing ? existing.version + 1 : 1;
    const now = Date.now();

    const file: MemoryFile = {
      path,
      layer: this.getLayerFromPath(path),
      name: path.split("/").pop() || path,
      content,
      lastModified: now,
      version,
    };

    try {
      localStorage.setItem(
        this.getStorageKey(path),
        JSON.stringify({
          content,
          lastModified: now,
          version,
        })
      );

      this.index.files[path] = {
        layer: file.layer,
        lastModified: now,
        version,
      };
      this.saveIndex();
      this.cache.set(path, file);
    } catch (e) {
      console.warn(`Failed to write memory file ${path}:`, e);
    }

    return file;
  }

  appendToFile(path: string, content: string): MemoryFile | null {
    const file = this.readFile(path);
    if (!file) return null;

    const newContent = file.content + "\n" + content;
    return this.writeFile(path, newContent);
  }

  deleteFile(path: string): boolean {
    try {
      localStorage.removeItem(this.getStorageKey(path));
      delete this.index.files[path];
      this.cache.delete(path);
      this.saveIndex();
      return true;
    } catch (e) {
      return false;
    }
  }

  listFiles(layer?: MemoryLayer): string[] {
    const paths = Object.keys(this.index.files);
    if (!layer) return paths.sort();
    return paths.filter(p => p.startsWith(`${layer}/`)).sort();
  }

  search(query: string, layers?: MemoryLayer[]): MemorySearchResult[] {
    const results: MemorySearchResult[] = [];
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

    for (const path of Object.keys(this.index.files)) {
      if (layers && !layers.includes(this.getLayerFromPath(path))) continue;

      const file = this.readFile(path);
      if (!file) continue;

      const lines = file.content.split("\n");
      const matchedLines: { line: number; content: string }[] = [];
      let matchCount = 0;

      lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();
        const lineMatches = keywords.filter(k => lowerLine.includes(k)).length;
        if (lineMatches > 0) {
          matchedLines.push({ line: index + 1, content: line });
          matchCount += lineMatches;
        }
      });

      if (matchedLines.length > 0) {
        const relevance = matchCount / keywords.length * 0.6 +
                          (matchedLines.length / lines.length) * 0.4;

        results.push({
          file,
          relevance: Math.min(1, relevance),
          matchedLines: matchedLines.slice(0, 10),
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  getDailyLogPath(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `logs/${y}/${m}/${d}.md`;
  }

  getDailyLog(date?: Date): MemoryFile | null {
    const d = date || new Date();
    const path = this.getDailyLogPath(d);
    return this.readFile(path);
  }

  writeDailyLog(date: Date, log: DailyLog): MemoryFile {
    const path = this.getDailyLogPath(date);
    const content = this.formatDailyLog(log);
    return this.writeFile(path, content);
  }

  private formatDailyLog(log: DailyLog): string {
    return `# ${log.date} 日记

## 今日摘要
${log.summary}

## 关键时刻
${log.keyMoments.map(m => `- ${m}`).join("\n")}

## 情绪曲线
${log.emotionalArc}

## 聊过的话题
${log.topicsDiscussed.map(t => `- ${t}`).join("\n")}

## 印象深刻的话
${log.notableQuotes.map(q => `> **${q.speaker}**：${q.text}`).join("\n\n")}

## 关系变化
| 指标 | 变化 |
|------|------|
| 信任值 | ${log.relationshipDelta.trust >= 0 ? "+" : ""}${log.relationshipDelta.trust} |
| 爱意值 | ${log.relationshipDelta.affection >= 0 ? "+" : ""}${log.relationshipDelta.affection} |
| 亲密值 | ${log.relationshipDelta.intimacy >= 0 ? "+" : ""}${log.relationshipDelta.intimacy} |

---

*记录每一天的点滴，都是我们的回忆 💕*
`;
  }

  addFact(fact: FactEntry): void {
    const file = this.readFile("profile/user_facts.md");
    if (!file) return;

    const categoryHeader = `## ${fact.category}`;
    const factLine = `- **${fact.key}**：${fact.value}`;

    let content = file.content;

    if (content.includes(categoryHeader)) {
      const lines = content.split("\n");
      const headerIndex = lines.findIndex(l => l.trim() === categoryHeader);
      if (headerIndex >= 0) {
        const keyPattern = new RegExp(`\\*\\*${fact.key}\\*\\*`, "i");
        const existingIndex = lines.findIndex(l => keyPattern.test(l));

        if (existingIndex >= 0) {
          lines[existingIndex] = factLine;
        } else {
          lines.splice(headerIndex + 1, 0, factLine);
        }
        content = lines.join("\n");
      }
    } else {
      content = content.replace(
        "## 基本信息",
        `## ${fact.category}\n${factLine}\n\n## 基本信息`
      );
    }

    content = content.replace(
      /> 最后更新：.*/,
      `> 最后更新：${this.formatDate(new Date())}`
    );

    this.writeFile("profile/user_facts.md", content);
  }

  addPreference(pref: PreferenceEntry): void {
    const file = this.readFile("profile/preferences.md");
    if (!file) return;

    let content = file.content;
    const categoryEmoji: Record<string, string> = {
      food: "🍜",
      music: "🎵",
      movie: "🎬",
      hobby: "⚽",
      color: "🎨",
      style: "👗",
      custom: "✨",
    };
    const emoji = categoryEmoji[pref.category] || "✨";

    const sentimentMap: Record<string, string> = {
      love: "超级喜欢",
      like: "喜欢",
      neutral: "一般",
      dislike: "不喜欢",
      hate: "讨厌",
    };
    const sentimentLabel = sentimentMap[pref.sentiment] || pref.sentiment;

    const sectionHeader = `## ${emoji} ${this.getCategoryLabel(pref.category)}偏好`;
    const subHeader = pref.sentiment === "love" || pref.sentiment === "like"
      ? "### 喜欢"
      : "### 不喜欢";
    const itemLine = `- ${pref.item}${pref.context ? `（${pref.context}）` : ""}`;

    const lines = content.split("\n");
    let sectionIndex = lines.findIndex(l => l.trim() === sectionHeader);
    if (sectionIndex < 0) {
      content = content.replace(
        "## 🎨 其他偏好",
        `${sectionHeader}\n${subHeader}\n- （待了解）\n\n## 🎨 其他偏好`
      );
    } else {
      let subHeaderIndex = lines.findIndex((l, i) =>
        i > sectionIndex && l.trim() === subHeader
      );
      if (subHeaderIndex >= 0) {
        lines.splice(subHeaderIndex + 1, 0, itemLine);
      }
      content = lines.join("\n");
    }

    content = content.replace(
      /> 最后更新：.*/,
      `> 最后更新：${this.formatDate(new Date())}`
    );

    this.writeFile("profile/preferences.md", content);
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      food: "饮食",
      music: "音乐",
      movie: "影视",
      hobby: "兴趣爱好",
      color: "颜色",
      style: "风格",
      custom: "其他",
    };
    return labels[category] || category;
  }

  updateEmotionalSnapshot(snapshot: EmotionalSnapshot): void {
    const file = this.readFile("profile/emotional.md");
    if (!file) return;

    let content = file.content;

    content = content.replace(
      /\* 当前情感状态[\s\S]*?## 信任等级说明/,
      `* 当前情感状态
- **主导心境**：${snapshot.dominantMood}
- **信任等级**：${Math.round(snapshot.trustLevel)}/100
- **爱意值**：${Math.round(snapshot.affectionLevel)}/100
- **怨念值**：${Math.round(snapshot.resentmentLevel)}/100

## 信任等级说明`
    );

    const dateSection = `### ${snapshot.date}`;
    if (!content.includes(dateSection)) {
      const entry = `\n${dateSection}\n- **主导情绪**：${snapshot.dominantMood}\n- **关键事件**：${snapshot.keyEvents.join("、")}\n- **情绪变化**：${snapshot.averageValence >= 0 ? "正面" : "负面"}倾向\n`;
      content = content.replace(
        "## 历史心境记录",
        `## 历史心境记录\n${entry}`
      );
    }

    content = content.replace(
      /> 最后更新：.*/,
      `> 最后更新：${this.formatDate(new Date())}`
    );

    this.writeFile("profile/emotional.md", content);
  }

  addMilestone(milestone: MilestoneEntry): void {
    const file = this.readFile("insights/milestones.md");
    if (!file) return;

    let content = file.content;
    const stars = "⭐".repeat(Math.max(1, Math.min(5, milestone.importance)));

    const entry = `
### ${milestone.title}
- **日期**：${milestone.date}
- **描述**：${milestone.description}
- **重要性**：${stars}
- **类别**：${milestone.category}
`;

    content = content.replace("## 已达成", `## 已达成\n${entry}`);
    content = content.replace(
      /> 最后更新：.*/,
      `> 最后更新：${this.formatDate(new Date())}`
    );

    this.writeFile("insights/milestones.md", content);
  }

  getPersonaConfig(): PersonaConfig {
    const file = this.readFile("core/persona.md");
    if (!file) {
      return {
        name: "小春",
        personality: "",
        speakingStyle: "",
        values: [],
        boundaries: [],
        catchphrases: [],
      };
    }

    const content = file.content;
    const nameMatch = content.match(/## 姓名\s*\n(.+)/);
    const personalityMatch = content.match(/## 性格\s*\n([\s\S]*?)\n## /);
    const styleMatch = content.match(/## 说话风格\s*\n([\s\S]*?)\n## /);
    const valuesMatch = content.match(/## 价值观\s*\n([\s\S]*?)\n## /);
    const catchphrasesMatch = content.match(/## 口头禅\s*\n([\s\S]*?)$/);

    const values = valuesMatch?.[1]
      .split("\n")
      .filter(l => l.match(/^\d+\./))
      .map(l => l.replace(/^\d+\.\s*【[^】]+】\s*—\s*/, "").trim())
      .filter(Boolean) || [];

    const catchphrases = catchphrasesMatch?.[1]
      .split("\n")
      .filter(l => l.startsWith("- "))
      .map(l => l.replace(/^- /, "").trim())
      .filter(Boolean) || [];

    const boundaries = [
      "不伤害用户身心健康",
      "保护用户隐私",
      "保持人设一致性",
    ];

    return {
      name: nameMatch?.[1]?.trim() || "小春",
      personality: personalityMatch?.[1]?.trim() || "",
      speakingStyle: styleMatch?.[1]?.trim() || "",
      values,
      boundaries,
      catchphrases,
    };
  }

  getRulesConfig(): RulesConfig {
    const file = this.readFile("core/rules.md");
    if (!file) {
      return { hardRules: [], softRules: [], taboos: [], safetyProtocols: [] };
    }

    const content = file.content;

    const extractList = (header: string): string[] => {
      const regex = new RegExp(`## ${header}\\s*\\n([\\s\\S]*?)(\\n## |$)`);
      const match = content.match(regex);
      if (!match) return [];
      return match[1]
        .split("\n")
        .filter(l => l.match(/^\d+\./))
        .map(l => l.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);
    };

    return {
      hardRules: extractList("硬性规则（必须遵守）"),
      softRules: extractList("软性规则（尽量遵守）"),
      taboos: extractList("禁忌话题"),
      safetyProtocols: extractList("安全协议"),
    };
  }

  getContextForPrompt(maxLength: number = 2000): string {
    const parts: string[] = [];

    const persona = this.readFile("core/persona.md");
    if (persona) parts.push(`【核心人设】\n${persona.content.slice(0, 500)}`);

    const rules = this.readFile("core/rules.md");
    if (rules) parts.push(`【行为准则】\n${rules.content.slice(0, 300)}`);

    const facts = this.readFile("profile/user_facts.md");
    if (facts) parts.push(`【用户档案】\n${facts.content.slice(0, 400)}`);

    const preferences = this.readFile("profile/preferences.md");
    if (preferences) parts.push(`【用户偏好】\n${preferences.content.slice(0, 300)}`);

    const emotional = this.readFile("profile/emotional.md");
    if (emotional) {
      const currentMatch = emotional.content.match(/## 当前情感状态\s*\n([\s\S]*?)\n##/);
      if (currentMatch) parts.push(`【情感状态】\n${currentMatch[1].trim()}`);
    }

    const todayLog = this.getDailyLog();
    if (todayLog) parts.push(`【今日摘要】\n${todayLog.content.slice(0, 300)}`);

    const milestones = this.readFile("insights/milestones.md");
    if (milestones) {
      const achievedMatch = milestones.content.match(/## 已达成\s*\n([\s\S]*?)\n##/);
      if (achievedMatch) parts.push(`【重要里程碑】\n${achievedMatch[1].trim().slice(0, 200)}`);
    }

    let result = parts.join("\n\n");
    if (result.length > maxLength) {
      result = result.slice(0, maxLength) + "\n...（记忆摘要已截断）";
    }

    return result;
  }

  clearAll(): void {
    for (const path of Object.keys(this.index.files)) {
      localStorage.removeItem(this.getStorageKey(path));
    }
    this.index = { files: {}, lastSync: 0 };
    this.cache.clear();
    localStorage.removeItem(this.getIndexKey());
    this.ensureCoreFiles();
  }

  exportAll(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const path of Object.keys(this.index.files)) {
      const file = this.readFile(path);
      if (file) result[path] = file.content;
    }
    return result;
  }

  importAll(data: Record<string, string>): void {
    for (const [path, content] of Object.entries(data)) {
      this.writeFile(path, content);
    }
  }

  private getLayerFromPath(path: string): MemoryLayer {
    const firstSegment = path.split("/")[0];
    if (firstSegment === "core" || firstSegment === "profile" ||
        firstSegment === "logs" || firstSegment === "insights") {
      return firstSegment;
    }
    return "profile";
  }
}
