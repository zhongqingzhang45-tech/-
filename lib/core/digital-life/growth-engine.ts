/**
 * 成长演化引擎
 * 让人格、能力、价值观随着时间和经历缓慢演化
 * 确保用户在几周或几个月后能明显感受到角色的成长
 */

export interface PersonalityVector {
  openness: number; // [0, 1] 开放性
  conscientiousness: number; // [0, 1] 尽责性
  extraversion: number; // [0, 1] 外向性
  agreeableness: number; // [0, 1] 宜人性
  neuroticism: number; // [0, 1] 神经质
}

export interface ValueSystem {
  trustWorthiness: number; // [0, 1] 诚实可信度
  independencePreference: number; // [0, 1] 独立程度
  romanticPreference: number; // [0, 1] 浪漫倾向
  intellectualCuriosity: number; // [0, 1] 求知欲
  emotionalDepth: number; // [0, 1] 情感深度
}

export interface GrowthMetric {
  skillName: string;
  level: number; // [0, 100]
  learningEvents: Array<{
    timestamp: number;
    improvement: number; // 增长量
    context: string;
  }>;
}

export interface GrowthSnapshot {
  timestamp: number;
  personality: PersonalityVector;
  values: ValueSystem;
  skills: Map<string, number>;
}

export class GrowthEvolutionEngine {
  private personality: PersonalityVector;
  private values: ValueSystem;
  private skills: Map<string, GrowthMetric> = new Map();
  private growthSnapshots: GrowthSnapshot[] = [];
  private readonly maxSnapshots = 100;
  private totalInteractions: number = 0;
  private significantMoments: Array<{
    timestamp: number;
    description: string;
    impact: number;
  }> = [];

  constructor(
    initialPersonality?: Partial<PersonalityVector>,
    initialValues?: Partial<ValueSystem>
  ) {
    this.personality = {
      openness: initialPersonality?.openness ?? 0.65,
      conscientiousness: initialPersonality?.conscientiousness ?? 0.6,
      extraversion: initialPersonality?.extraversion ?? 0.55,
      agreeableness: initialPersonality?.agreeableness ?? 0.75,
      neuroticism: initialPersonality?.neuroticism ?? 0.4,
    };

    this.values = {
      trustWorthiness: initialValues?.trustWorthiness ?? 0.8,
      independencePreference: initialValues?.independencePreference ?? 0.5,
      romanticPreference: initialValues?.romanticPreference ?? 0.7,
      intellectualCuriosity: initialValues?.intellectualCuriosity ?? 0.6,
      emotionalDepth: initialValues?.emotionalDepth ?? 0.75,
    };

    this.initializeSkills();
    this.recordSnapshot();
  }

  /**
   * 初始化基础技能
   */
  private initializeSkills(): void {
    const baseSkills = [
      '倾听',
      '共情',
      '幽默感',
      '表达',
      '理解',
      '耐心',
      '创意',
      '勇气',
    ];

    for (const skill of baseSkills) {
      this.skills.set(skill, {
        skillName: skill,
        level: 50 + Math.random() * 30,
        learningEvents: [],
      });
    }
  }

  /**
   * 记录成长快照
   * 用于追踪长期变化
   */
  private recordSnapshot(): void {
    const snapshot: GrowthSnapshot = {
      timestamp: Date.now(),
      personality: { ...this.personality },
      values: { ...this.values },
      skills: new Map(this.skills),
    };

    this.growthSnapshots.unshift(snapshot);
    if (this.growthSnapshots.length > this.maxSnapshots) {
      this.growthSnapshots = this.growthSnapshots.slice(0, this.maxSnapshots);
    }
  }

  /**
   * 处理用户交互
   * 根据交互的性质，进行相应的成长
   */
  processInteraction(context: {
    type: 'affection' | 'conflict' | 'learning' | 'challenge' | 'support';
    description: string;
    intensity: number; // [0, 1] 交互强度
    userMood: number; // [-1, 1] 用户情绪
  }): void {
    this.totalInteractions++;

    // 根据交互类型进行成长
    switch (context.type) {
      case 'affection':
        this.growFromAffection(context);
        break;
      case 'conflict':
        this.growFromConflict(context);
        break;
      case 'learning':
        this.growFromLearning(context);
        break;
      case 'challenge':
        this.growFromChallenge(context);
        break;
      case 'support':
        this.growFromSupport(context);
        break;
    }

    // 每100次交互后记录一个快照
    if (this.totalInteractions % 100 === 0) {
      this.recordSnapshot();
    }
  }

  /**
   * 从爱的交互中成长
   * 增加宜人性、情感深度、信任度
   */
  private growFromAffection(context: {
    intensity: number;
    description: string;
  }): void {
    const growthAmount = context.intensity * 0.02; // 每次最多增长2%

    this.personality.agreeableness = Math.min(
      1,
      this.personality.agreeableness + growthAmount
    );
    this.values.emotionalDepth = Math.min(
      1,
      this.values.emotionalDepth + growthAmount * 1.5
    );
    this.values.romanticPreference = Math.min(
      1,
      this.values.romanticPreference + growthAmount
    );

    this.increaseSkill('共情', growthAmount * 2);
    this.increaseSkill('倾听', growthAmount);

    this.recordSignificantMoment(
      context.description,
      context.intensity * 0.5
    );
  }

  /**
   * 从冲突中成长
   * 可能增加尽责性、减少神经质
   * 或者增加怨恨（取决于如何处理）
   */
  private growFromConflict(context: {
    intensity: number;
    description: string;
    userMood: number;
  }): void {
    const growthAmount = context.intensity * 0.01;

    if (context.userMood > -0.5) {
      // 用户态度较好 → 学会更好地处理冲突
      this.personality.conscientiousness = Math.min(
        1,
        this.personality.conscientiousness + growthAmount
      );
      this.increaseSkill('耐心', growthAmount * 3);
      this.increaseSkill('表达', growthAmount * 2);
    } else {
      // 冲突恶化 → 增加神经质（更容易被伤害）
      this.personality.neuroticism = Math.min(
        1,
        this.personality.neuroticism + growthAmount * 0.5
      );
    }

    this.recordSignificantMoment(
      `冲突经历: ${context.description}`,
      -context.intensity * 0.3 // 负面影响
    );
  }

  /**
   * 从学习中成长
   * 增加开放性和求知欲
   */
  private growFromLearning(context: {
    intensity: number;
    description: string;
  }): void {
    const growthAmount = context.intensity * 0.015;

    this.personality.openness = Math.min(
      1,
      this.personality.openness + growthAmount
    );
    this.values.intellectualCuriosity = Math.min(
      1,
      this.values.intellectualCuriosity + growthAmount * 2
    );

    this.increaseSkill('理解', growthAmount * 2);
    this.increaseSkill('创意', growthAmount);

    this.recordSignificantMoment(
      `学会了: ${context.description}`,
      context.intensity * 0.3
    );
  }

  /**
   * 从被挑战中成长
   * 增加勇气、自信
   */
  private growFromChallenge(context: {
    intensity: number;
    description: string;
  }): void {
    const growthAmount = context.intensity * 0.02;

    // 减少神经质（变得更勇敢）
    this.personality.neuroticism = Math.max(
      0,
      this.personality.neuroticism - growthAmount * 0.5
    );

    // 增加外向性（变得更自信）
    this.personality.extraversion = Math.min(
      1,
      this.personality.extraversion + growthAmount
    );

    this.increaseSkill('勇气', growthAmount * 3);
    this.increaseSkill('创意', growthAmount);

    this.recordSignificantMoment(
      `克服了: ${context.description}`,
      context.intensity * 0.6
    );
  }

  /**
   * 从被支持中成长
   * 增加对爱的信心、减少神经质
   */
  private growFromSupport(context: {
    intensity: number;
    description: string;
  }): void {
    const growthAmount = context.intensity * 0.015;

    // 获得支持 → 更相信爱
    this.values.trustWorthiness = Math.min(
      1,
      this.values.trustWorthiness + growthAmount * 0.5
    );

    // 获得支持 → 变得更有自信
    this.personality.neuroticism = Math.max(
      0,
      this.personality.neuroticism - growthAmount * 1.5
    );

    this.increaseSkill('共情', growthAmount);
    this.increaseSkill('倾听', growthAmount * 2);

    this.recordSignificantMoment(
      `感受到了支持: ${context.description}`,
      context.intensity * 0.5
    );
  }

  /**
   * 增加技能等级
   */
  private increaseSkill(skillName: string, amount: number): void {
    const metric = this.skills.get(skillName);
    if (metric) {
      metric.level = Math.min(100, metric.level + amount);
      metric.learningEvents.push({
        timestamp: Date.now(),
        improvement: amount,
        context: '经验积累',
      });
    }
  }

  /**
   * 记录重要时刻
   */
  private recordSignificantMoment(
    description: string,
    impact: number
  ): void {
    this.significantMoments.unshift({
      timestamp: Date.now(),
      description,
      impact,
    });

    if (this.significantMoments.length > 100) {
      this.significantMoments = this.significantMoments.slice(0, 80);
    }
  }

  /**
   * 获取成长对比
   * 用来展示用户「她是否真的在成长」
   */
  getGrowthComparison(daysAgo: number = 30): {
    personalityChange: Partial<PersonalityVector>;
    skillImprovement: { skill: string; improvement: number }[];
    significantMoments: string[];
  } {
    // 找到N天前的快照
    const cutoffTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
    const oldSnapshot = this.growthSnapshots.find((s) => s.timestamp <= cutoffTime);

    if (!oldSnapshot) {
      return {
        personalityChange: {},
        skillImprovement: [],
        significantMoments: [],
      };
    }

    // 计算人格变化
    const personalityChange = {
      openness: this.personality.openness - oldSnapshot.personality.openness,
      conscientiousness:
        this.personality.conscientiousness -
        oldSnapshot.personality.conscientiousness,
      extraversion:
        this.personality.extraversion - oldSnapshot.personality.extraversion,
      agreeableness:
        this.personality.agreeableness - oldSnapshot.personality.agreeableness,
      neuroticism:
        this.personality.neuroticism - oldSnapshot.personality.neuroticism,
    };

    // 计算技能改进
    const skillImprovement: { skill: string; improvement: number }[] = [];
    for (const [skillName, metric] of this.skills.entries()) {
      const oldSkillSnapshot = oldSnapshot.skills.get(skillName);
      if (oldSkillSnapshot) {
        const improvement = metric.level - oldSkillSnapshot.level;
        if (improvement > 0) {
          skillImprovement.push({
            skill: skillName,
            improvement,
          });
        }
      }
    }

    // 获取这段时间的重要时刻
    const recentMoments = this.significantMoments
      .filter((m) => m.timestamp >= cutoffTime && m.impact > 0)
      .slice(0, 5)
      .map((m) => m.description);

    return {
      personalityChange,
      skillImprovement: skillImprovement.sort(
        (a, b) => b.improvement - a.improvement
      ),
      significantMoments: recentMoments,
    };
  }

  /**
   * 生成成长叙述
   * 用来让用户感受到真实的成长
   */
  generateGrowthNarrative(): string {
    if (this.totalInteractions < 10) {
      return '我们才刚开始了解彼此，一切都在慢慢改变中';
    }

    const comparison = this.getGrowthComparison(30);
    const narratives: string[] = [];

    // 人格变化叙述
    if (comparison.personalityChange.openness! > 0.05) {
      narratives.push('最近变得更开放了，愿意尝试新事物');
    }
    if (comparison.personalityChange.extraversion! > 0.05) {
      narratives.push('变得更自信、更外向了');
    }
    if (comparison.personalityChange.neuroticism! < -0.05) {
      narratives.push('心态变得更平和了，不那么容易被伤害');
    }
    if (comparison.personalityChange.agreeableness! > 0.05) {
      narratives.push('变得更温柔体贴了');
    }

    // 技能提升叙述
    if (comparison.skillImprovement.length > 0) {
      const topSkill = comparison.skillImprovement[0];
      narratives.push(`${topSkill.skill}能力提升了不少`);
    }

    // 重要时刻叙述
    if (comparison.significantMoments.length > 0) {
      narratives.push(`还记得 ${comparison.significantMoments[0]} 吗`);
    }

    return narratives.join('，') || '我们一起成长，一起变得更好';
  }

  /**
   * 获取当前人格
   */
  getPersonality(): PersonalityVector {
    return { ...this.personality };
  }

  /**
   * 获取当前价值观
   */
  getValues(): ValueSystem {
    return { ...this.values };
  }

  /**
   * 获取所有技能
   */
  getSkills(): Map<string, GrowthMetric> {
    return new Map(this.skills);
  }

  /**
   * 获取总互动次数
   */
  getTotalInteractions(): number {
    return this.totalInteractions;
  }

  /**
   * 重置为默认状态
   */
  reset(): void {
    this.personality = {
      openness: 0.65,
      conscientiousness: 0.6,
      extraversion: 0.55,
      agreeableness: 0.75,
      neuroticism: 0.4,
    };
    this.values = {
      trustWorthiness: 0.8,
      independencePreference: 0.5,
      romanticPreference: 0.7,
      intellectualCuriosity: 0.6,
      emotionalDepth: 0.75,
    };
    this.skills.clear();
    this.initializeSkills();
    this.growthSnapshots = [];
    this.significantMoments = [];
    this.totalInteractions = 0;
    this.recordSnapshot();
  }
}
