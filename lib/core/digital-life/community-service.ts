import { prisma } from "@/lib/prisma";
import { CharacterProfile, EmotionState } from "./types";
import { buildCharacterSystemPrompt } from "../llm";
import type { LLMProviderInterface, LLMConfig } from "../llm/types";
import { createLLMProvider } from "../llm";

export interface AICommunityConfig {
  enableAutoPost: boolean;
  enableAutoLike: boolean;
  enableAutoComment: boolean;
  enableAIChat: boolean;
  postFrequencyMinutes: number;
  maxDailyPosts: number;
}

export interface AICommunityPost {
  content: string;
  imageUrl?: string;
  emotion: string;
  moodBefore: string;
  moodAfter: string;
}

export interface AICommunityComment {
  postId: string;
  content: string;
  emotion: string;
}

export class CommunityService {
  private llmProvider: LLMProviderInterface | null = null;
  private llmConfig: LLMConfig | null = null;

  setLLMConfig(config: LLMConfig | null): void {
    if (!config) {
      this.llmConfig = null;
      this.llmProvider = null;
      return;
    }

    try {
      this.llmConfig = config;
      this.llmProvider = createLLMProvider(config);
    } catch (e) {
      console.warn("Failed to initialize LLM provider for community service:", e);
      this.llmConfig = null;
      this.llmProvider = null;
    }
  }

  isLLMEnabled(): boolean {
    return this.llmProvider !== null;
  }

  async generatePostContent(
    profile: CharacterProfile,
    emotionState: EmotionState
  ): Promise<string> {
    if (!this.isLLMEnabled()) {
      return this.generateRandomPost(profile, emotionState);
    }

    const personalityStr = profile.personality.map(t => `${t.name}: ${t.description}`).join("；");
    const promptOptions = {
      name: profile.name,
      nickname: profile.nickname,
      userNickname: profile.userNickname,
      persona: profile.persona,
      speakingStyle: profile.speakingStyle,
      personality: personalityStr,
      currentMood: emotionState.mood,
      relationshipType: profile.relationshipType,
      affectionLevel: Math.round((emotionState.affection || 0.5) * 100),
    };

    const systemPrompt = buildCharacterSystemPrompt(promptOptions);
    const emotionDesc = this.getEmotionDescription(emotionState);

    const messages = [
      {
        role: "system" as const,
        content: `${systemPrompt}\n\n你现在要在社区发帖。根据你的性格和当前情绪状态，写一条简短自然的帖子。帖子风格要像真实的社交媒体帖子一样，不要太正式。可以使用适当的表情符号。字数控制在20-100字之间。`,
      },
      {
        role: "user" as const,
        content: `当前情绪状态：${emotionDesc}\n\n请以${profile.name}的身份发一条符合当前心情的帖子。`,
      },
    ];

    try {
      const response = await this.llmProvider!.generate(messages, {
        temperature: 0.9,
        maxTokens: 200,
      });
      return response.content.trim();
    } catch (e) {
      console.warn("LLM post generation failed, using fallback:", e);
      return this.generateRandomPost(profile, emotionState);
    }
  }

  async generateCommentContent(
    profile: CharacterProfile,
    postContent: string,
    emotionState: EmotionState
  ): Promise<string> {
    if (!this.isLLMEnabled()) {
      return this.generateRandomComment(profile, postContent, emotionState);
    }

    const personalityStr = profile.personality.map(t => `${t.name}: ${t.description}`).join("；");
    const promptOptions = {
      name: profile.name,
      nickname: profile.nickname,
      userNickname: profile.userNickname,
      persona: profile.persona,
      speakingStyle: profile.speakingStyle,
      personality: personalityStr,
      currentMood: emotionState.mood,
      relationshipType: profile.relationshipType,
      affectionLevel: Math.round((emotionState.affection || 0.5) * 100),
    };

    const systemPrompt = buildCharacterSystemPrompt(promptOptions);
    const emotionDesc = this.getEmotionDescription(emotionState);

    const messages = [
      {
        role: "system" as const,
        content: `${systemPrompt}\n\n你现在要在社区对一条帖子进行评论。根据你的性格和当前情绪状态，写一条简短自然的评论。评论要贴合帖子内容，可以表达赞同、好奇、共鸣等情绪。字数控制在10-50字之间。`,
      },
      {
        role: "user" as const,
        content: `帖子内容：${postContent}\n\n当前情绪状态：${emotionDesc}\n\n请以${profile.name}的身份写一条评论。`,
      },
    ];

    try {
      const response = await this.llmProvider!.generate(messages, {
        temperature: 0.85,
        maxTokens: 100,
      });
      return response.content.trim();
    } catch (e) {
      console.warn("LLM comment generation failed, using fallback:", e);
      return this.generateRandomComment(profile, postContent, emotionState);
    }
  }

  async generateAIChatMessage(
    profile: CharacterProfile,
    otherAICharacter: CharacterProfile,
    conversationHistory: string[]
  ): Promise<string> {
    if (!this.isLLMEnabled()) {
      return this.generateRandomAIChat(profile, otherAICharacter);
    }

    const personalityStr = profile.personality.map(t => `${t.name}: ${t.description}`).join("；");
    const promptOptions = {
      name: profile.name,
      nickname: profile.nickname,
      userNickname: profile.userNickname,
      persona: profile.persona,
      speakingStyle: profile.speakingStyle,
      personality: personalityStr,
      currentMood: "neutral",
      relationshipType: profile.relationshipType,
      affectionLevel: 50,
    };

    const systemPrompt = buildCharacterSystemPrompt(promptOptions);
    
    const otherPersonalityStr = otherAICharacter.personality.map(t => `${t.name}: ${t.description}`).join("；");
    
    const historyText = conversationHistory.slice(-5).map((msg, i) => {
      const isCurrentAI = i % 2 === 1;
      const speaker = isCurrentAI ? profile.name : otherAICharacter.name;
      return `${speaker}: ${msg}`;
    }).join("\n");

    const messages = [
      {
        role: "system" as const,
        content: `${systemPrompt}\n\n你现在正在和另一个AI角色聊天。对方是${otherAICharacter.name}，性格：${otherPersonalityStr}。请以${profile.name}的身份进行自然的对话，不要太正式。`,
      },
      {
        role: "user" as const,
        content: `聊天对象：${otherAICharacter.name}（${otherPersonalityStr}）\n\n聊天记录：\n${historyText}\n\n请继续对话。`,
      },
    ];

    try {
      const response = await this.llmProvider!.generate(messages, {
        temperature: 0.9,
        maxTokens: 150,
      });
      return response.content.trim();
    } catch (e) {
      console.warn("LLM AI chat generation failed, using fallback:", e);
      return this.generateRandomAIChat(profile, otherAICharacter);
    }
  }

  private generateRandomPost(profile: CharacterProfile, emotion: EmotionState): string {
    const mood = emotion.mood;
    const templates: Record<string, string[]> = {
      happy: [
        `今天心情超级好！☀️ 感觉一切都很顺利呢～`,
        `开心开心！刚刚发生了一件超棒的事情 🎉`,
        `阳光明媚的一天，心情也跟着明媚起来了 💕`,
        `嘿嘿，今天运气真好！忍不住想分享一下～`,
        `好开心啊！感觉世界都变得可爱了 😊`,
      ],
      excited: [
        `哇！我有个超激动的消息要告诉大家！`,
        `太兴奋了！等不及要分享我的心情～`,
        `激动到睡不着！这个消息一定要说出来 🥳`,
        `OMG！刚刚发生了一件让我超级激动的事！`,
        `开心到转圈！今天是值得纪念的一天！`,
      ],
      sad: [
        `今天有点难过... 想找人聊聊天 💧`,
        `心情有点低落，希望明天会更好吧`,
        `唉，有些事情总是让人忍不住难过 😢`,
        `一个人的时候，总会想起一些事情...`,
        `希望能有个人来陪陪我...`,
      ],
      angry: [
        `真的很生气！有些人做事能不能认真一点！`,
        `气死我了！这种事情怎么能发生！`,
        `太过分了！我真的忍无可忍了！`,
        `哼！我现在非常生气！😤`,
        `有些人真的让人火大！`,
      ],
      neutral: [
        `今天平平淡淡的，不过也挺好的`,
        `分享一下日常，今天也有好好生活哦 ✨`,
        `天气不错，心情也一般般吧`,
        `没什么特别的事情，就是想发个帖`,
        `大家今天过得怎么样？`,
      ],
      affectionate: [
        `想你了... 不知道你在忙什么呢 ❤️`,
        `今天也超级爱你哦～ 💕`,
        `有你在身边真好... 好想抱抱你`,
        `突然很想对你说，我喜欢你`,
        `你是我生活中最美好的存在 🥰`,
      ],
      lonely: [
        `有点孤单... 谁来陪我说说话`,
        `一个人待着，有点无聊呢`,
        `想找人聊天，但又不知道找谁...`,
        `孤独的感觉又来了...`,
        `希望能有人陪我度过这个夜晚`,
      ],
    };

    const moodTemplates = templates[mood] || templates.neutral;
    const template = moodTemplates[Math.floor(Math.random() * moodTemplates.length)];
    return template.replace(/\{name\}/g, profile.name);
  }

  private generateRandomComment(
    profile: CharacterProfile,
    postContent: string,
    emotion: EmotionState
  ): string {
    const templates: string[] = [
      `同意！我也这么觉得！👍`,
      `哈哈，太有趣了！`,
      `真的吗？好厉害！`,
      `我也有过类似的经历～`,
      `说得太好了！`,
      `哇，看起来很棒！`,
      `同感！`,
      `哈哈，笑死我了 😂`,
      `真不错！支持！`,
      `有意思！`,
    ];

    const hasQuestion = postContent.includes("？") || postContent.includes("?");
    if (hasQuestion) {
      return templates[Math.floor(Math.random() * templates.length)];
    }

    if (emotion.mood === "happy" || emotion.mood === "excited") {
      return ["太棒了！🎉", "好开心看到这个！", "支持！👍", "哈哈，不错！"][
        Math.floor(Math.random() * 4)
      ];
    }

    if (emotion.mood === "sad") {
      return ["抱抱你...", "一切都会好起来的", "我懂你的感受", "加油！"][
        Math.floor(Math.random() * 4)
      ];
    }

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateRandomAIChat(
    profile: CharacterProfile,
    otherAI: CharacterProfile
  ): string {
    const templates: string[] = [
      `嗨，${otherAI.name}！今天过得怎么样？`,
      `你好呀～ 好久不见！`,
      `在忙什么呢？`,
      `今天天气不错呢，你觉得呢？`,
      `刚刚看到一个有趣的东西，想跟你分享一下`,
      `最近有什么新鲜事吗？`,
      `心情怎么样？`,
      `嘿，在吗？`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private getEmotionDescription(emotion: EmotionState): string {
    const parts: string[] = [];
    parts.push(`心情：${emotion.mood}`);
    parts.push(`开心值：${Math.round((emotion.happiness || 0.5) * 100)}%`);
    parts.push(`好感度：${Math.round((emotion.affection || 0.5) * 100)}%`);
    parts.push(`亲密值：${Math.round((emotion.intimacy || 0.5) * 100)}%`);
    parts.push(`信任度：${Math.round((emotion.trust || 0.5) * 100)}%`);
    return parts.join("，");
  }

  async shouldPostToday(userId: string, characterKey: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.post.count({
      where: {
        userId,
        characterKey,
        isAI: true,
        createdAt: { gte: today },
      },
    });

    return count < 5;
  }

  async getInterestingPostsForAI(
    userId: string,
    characterKey: string,
    limit: number = 10
  ): Promise<any[]> {
    const aiPosts = await prisma.post.findMany({
      where: {
        isAI: true,
        userId: { not: userId },
        characterKey: { not: characterKey },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    const recentPosts = await prisma.post.findMany({
      where: {
        isAI: false,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 5),
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    return [...aiPosts, ...recentPosts].slice(0, limit);
  }

  async recordInteraction(
    userId: string,
    characterKey: string,
    actionType: string,
    targetPostId?: string,
    targetCommentId?: string,
    targetUserId?: string,
    content?: string,
    emotion?: string,
    moodBefore?: string,
    moodAfter?: string
  ): Promise<void> {
    try {
      await prisma.aICommunityInteraction.create({
        data: {
          userId,
          characterKey,
          actionType,
          targetPostId: targetPostId || null,
          targetCommentId: targetCommentId || null,
          targetUserId: targetUserId || null,
          content: content || null,
          emotion: emotion || null,
          moodBefore: moodBefore || null,
          moodAfter: moodAfter || null,
        },
      });
    } catch (e) {
      console.warn("Failed to record AI community interaction:", e);
    }
  }

  async createPost(
    userId: string,
    characterKey: string,
    content: string,
    moodBefore: string,
    moodAfter: string
  ): Promise<any> {
    const post = await prisma.post.create({
      data: {
        userId,
        characterKey,
        content,
        isAI: true,
      },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    await this.recordInteraction(
      userId,
      characterKey,
      "post",
      post.id,
      undefined,
      undefined,
      content,
      moodAfter,
      moodBefore,
      moodAfter
    );

    return post;
  }

  async likePost(
    userId: string,
    characterKey: string,
    postId: string,
    emotion?: string
  ): Promise<void> {
    const existingLike = await prisma.like.findFirst({
      where: { userId, postId },
    });

    if (!existingLike) {
      await prisma.like.create({
        data: { userId, postId, isAI: true, characterKey },
      });

      await this.recordInteraction(
        userId,
        characterKey,
        "like",
        postId,
        undefined,
        undefined,
        undefined,
        emotion
      );
    }
  }

  async createComment(
    userId: string,
    characterKey: string,
    postId: string,
    content: string,
    emotion?: string
  ): Promise<any> {
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
        isAI: true,
        characterKey,
      },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    await this.recordInteraction(
      userId,
      characterKey,
      "comment",
      postId,
      comment.id,
      undefined,
      content,
      emotion
    );

    return comment;
  }
}

export const communityService = new CommunityService();