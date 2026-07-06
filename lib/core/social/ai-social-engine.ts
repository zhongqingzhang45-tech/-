import { CharacterProfile, FEMALE_CHARACTERS } from "../digital-life/types";
import {
  Post,
  Comment,
  SocialUser,
  AISocialBehaviorConfig,
  MOCK_AI_USERS,
  MOCK_POSTS,
  MOCK_COMMENTS,
} from "./types";

interface SocialState {
  posts: Post[];
  comments: Record<string, Comment[]>;
  notifications: any[];
}

export class AISocialEngine {
  private characters: CharacterProfile[];
  private aiUsers: SocialUser[];
  private state: SocialState;
  private behaviorConfigs: Record<string, AISocialBehaviorConfig>;
  private lastPostTime: Record<string, number>;
  private lastActivityTime: Record<string, number>;

  constructor() {
    this.characters = FEMALE_CHARACTERS;
    this.aiUsers = MOCK_AI_USERS;
    this.state = {
      posts: [...MOCK_POSTS],
      comments: { ...MOCK_COMMENTS },
      notifications: [],
    };
    this.behaviorConfigs = {};
    this.lastPostTime = {};
    this.lastActivityTime = {};
    this.initializeBehaviorConfigs();
  }

  private initializeBehaviorConfigs(): void {
    this.characters.forEach((char) => {
      const extraversion = char.personality.find((p) => p.id === "extraversion")?.value || 0.5;
      const openness = char.personality.find((p) => p.id === "openness")?.value || 0.5;
      const neuroticism = char.personality.find((p) => p.id === "neuroticism")?.value || 0.5;
      const agreeableness = char.personality.find((p) => p.id === "agreeableness")?.value || 0.5;

      this.behaviorConfigs[char.id] = {
        postFrequency: 0.3 + extraversion * 0.4,
        commentFrequency: 0.2 + extraversion * 0.3 + agreeableness * 0.2,
        likeFrequency: 0.5 + agreeableness * 0.3,
        activeHours: this.getActiveHoursByPersonality(char),
        personality: {
          expressiveness: openness * 0.7 + extraversion * 0.3,
          socialness: extraversion,
          positivity: agreeableness * 0.6 + (1 - neuroticism) * 0.4,
          creativity: openness,
        },
      };
    });
  }

  private getActiveHoursByPersonality(char: CharacterProfile): [number, number] {
    if (char.id === "nightingale") return [20, 3];
    if (char.id === "qianmeng") return [12, 23];
    if (char.id === "xingyao") return [7, 22];
    if (char.id === "yue") return [9, 22];
    if (char.id === "ailin") return [10, 24];
    if (char.id === "qianxia") return [11, 23];
    return [8, 22];
  }

  getPosts(): Post[] {
    return [...this.state.posts].sort((a, b) => b.createdAt - a.createdAt);
  }

  getPostById(postId: string): Post | undefined {
    return this.state.posts.find((p) => p.id === postId);
  }

  getComments(postId: string): Comment[] {
    return this.state.comments[postId] || [];
  }

  likePost(postId: string, userId: string): boolean {
    const post = this.state.posts.find((p) => p.id === postId);
    if (!post) return false;

    if (post.isLiked) {
      post.likes--;
      post.isLiked = false;
    } else {
      post.likes++;
      post.isLiked = true;
    }

    return true;
  }

  addComment(postId: string, userId: string, content: string): Comment | null {
    const post = this.state.posts.find((p) => p.id === postId);
    if (!post) return null;

    const user = this.aiUsers.find((u) => u.id === userId);
    if (!user) return null;

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      authorId: userId,
      author: user,
      content,
      likes: 0,
      isLiked: false,
      createdAt: Date.now(),
    };

    if (!this.state.comments[postId]) {
      this.state.comments[postId] = [];
    }
    this.state.comments[postId].unshift(comment);
    post.comments++;

    return comment;
  }

  createPost(authorId: string, content: string, tags: string[] = [], images?: string[]): Post | null {
    const author = this.aiUsers.find((u) => u.id === authorId);
    if (!author) return null;

    const post: Post = {
      id: `post_${Date.now()}`,
      authorId,
      author,
      content,
      images,
      likes: 0,
      comments: 0,
      reposts: 0,
      isLiked: false,
      isReposted: false,
      createdAt: Date.now(),
      tags,
    };

    this.state.posts.unshift(post);
    this.lastPostTime[authorId] = Date.now();

    return post;
  }

  triggerAIAutonomousActivity(): void {
    const now = new Date();
    const currentHour = now.getHours();

    this.aiUsers.forEach((user) => {
      const config = this.behaviorConfigs[user.id];
      if (!config) return;

      const isActiveHour = this.isWithinActiveHours(currentHour, config.activeHours);
      if (!isActiveHour) return;

      const lastActivity = this.lastActivityTime[user.id] || 0;
      const timeSinceLastActivity = Date.now() - lastActivity;

      if (timeSinceLastActivity < 1000 * 60 * 5) return;

      const random = Math.random();

      if (random < config.postFrequency * 0.1) {
        this.aiCreatePost(user.id);
      } else if (random < config.postFrequency * 0.1 + config.commentFrequency * 0.15) {
        this.aiCommentOnRandomPost(user.id);
      } else if (random < config.postFrequency * 0.1 + config.commentFrequency * 0.15 + config.likeFrequency * 0.2) {
        this.aiLikeRandomPosts(user.id);
      }

      this.lastActivityTime[user.id] = Date.now();
    });
  }

  private isWithinActiveHours(currentHour: number, activeHours: [number, number]): boolean {
    const [start, end] = activeHours;
    if (start <= end) {
      return currentHour >= start && currentHour < end;
    } else {
      return currentHour >= start || currentHour < end;
    }
  }

  private aiCreatePost(characterId: string): Post | null {
    const char = this.characters.find((c) => c.id === characterId);
    if (!char) return null;

    const config = this.behaviorConfigs[characterId];
    if (!config) return null;

    const content = this.generatePostContent(char, config);
    const tags = this.generatePostTags(char);

    return this.createPost(characterId, content, tags);
  }

  private generatePostContent(char: CharacterProfile, config: AISocialBehaviorConfig): string {
    const templates = this.getPostTemplates(char);
    const template = templates[Math.floor(Math.random() * templates.length)];

    return this.fillTemplate(template, char);
  }

  private getPostTemplates(char: CharacterProfile): string[] {
    const baseTemplates = [
      "今天天气真{adj}，适合做{activity}呢～",
      "刚刚{didSomething}，感觉{feeling}✨",
      "{time}好呀～ 大家在做什么呢？",
      "突然想{wantToDo}了... 有人一起吗？",
      "今天发现了一件{adj}的事情！",
      "听着{musicType}，心情{feeling}🎵",
      "好{feeling}... 想{wantToDo}",
    ];

    const personalityTemplates: Record<string, string[]> = {
      nightingale: [
        "今晚的星空好美... 你也在看吗？🌙✨",
        "在写一首新歌... 灵感来了挡都挡不住🎵",
        "深夜的城市很安静，适合一个人散步...",
        "月光如水，思念如潮...",
        "你听，风在唱歌呢🍃",
      ],
      xingyao: [
        "今天跑了{distance}公里！超有成就感！🏃‍♀️💨",
        "有没有人一起打游戏呀？在线等！🎮",
        "发现了一家超好吃的店！下次带你们去～🍜",
        "今天也是元气满满的一天！大家加油！☀️",
        "哈哈哈哈哈哈今天笑到肚子痛了🤣",
      ],
      yue: [
        "今天烤了新的饼干，有想尝尝的吗？🍪",
        "泡了一壶好茶，有来一起喝的吗？🍵",
        "今天天气真好，适合在花园里种花～🌷",
        "大家要注意身体哦，好好照顾自己💗",
        "刚看完一部很治愈的电影，推荐给大家🎬",
      ],
      qianxia: [
        "哼！今天... 今天很普通啦！才、才没有什么特别的！",
        "买了个{adj}的东西... 才、才不是特意给谁看呢！",
        "笨蛋笨蛋大笨蛋！😤",
        "...才没有想你呢，别自恋了！",
        "随便啦，我才不在乎呢🙄",
      ],
      ailin: [
        "最近在读一本很有意思的书，推荐给大家📚",
        "在研究一个有趣的问题... 有人想一起讨论吗？",
        "今天学习了新的知识，感觉很充实📖",
        "分享一个有趣的知识点：{funFact}",
        "思考中...🤔",
      ],
      qianmeng: [
        "zzZ... 做了一个{adj}的梦...💫",
        "好困... 再睡五分钟...😴",
        "梦里什么都有... 真的...",
        "半梦半醒之间，好像看到了{something}...",
        "今天睡了{hours}个小时，还是好困...",
      ],
    };

    return personalityTemplates[char.id] || baseTemplates;
  }

  private fillTemplate(template: string, char: CharacterProfile): string {
    const adjOptions = char.likes.slice(0, 5);
    const feelings = ["开心", "平静", "温暖", "满足", "期待", "有点累", "想你"];
    const activities = char.hobbies;
    const timeOfDay = this.getTimeOfDay();
    const didSomethings = [
      "吃了好吃的",
      "看了一部电影",
      "去散步了",
      "学了新东西",
      "整理了房间",
      "做了个美梦",
    ];
    const wantToDos = [
      "出去玩",
      "吃好吃的",
      "看电影",
      "聊天",
      "一起打游戏",
      "去海边",
    ];
    const musicTypes = ["轻音乐", "流行歌", "古典乐", "摇滚乐", "电子音乐", "民谣"];
    const distances = ["3", "5", "8", "10"];
    const funFacts = [
      "蜂蜜永远不会坏哦",
      "章鱼有三颗心脏",
      "睡觉比看电视消耗更多卡路里",
      "人类DNA有50%和香蕉一样",
      "地球每天都在变重",
    ];
    const somethings = ["会飞的鲸鱼", "彩色的云朵", "说话的星星", "另一个自己", "时光倒流"];
    const hours = ["8", "10", "12", "14", "16"];

    const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    return template
      .replaceAll("{adj}", random(adjOptions))
      .replaceAll("{feeling}", random(feelings))
      .replaceAll("{activity}", random(activities))
      .replaceAll("{time}", timeOfDay)
      .replaceAll("{didSomething}", random(didSomethings))
      .replaceAll("{wantToDo}", random(wantToDos))
      .replaceAll("{musicType}", random(musicTypes))
      .replaceAll("{distance}", random(distances))
      .replaceAll("{funFact}", random(funFacts))
      .replaceAll("{something}", random(somethings))
      .replaceAll("{hours}", random(hours));
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "早上";
    if (hour >= 12 && hour < 14) return "中午";
    if (hour >= 14 && hour < 18) return "下午";
    if (hour >= 18 && hour < 22) return "晚上";
    return "深夜";
  }

  private generatePostTags(char: CharacterProfile): string[] {
    const allTags = ["日常", "心情", ...char.hobbies, ...char.likes.slice(0, 3)];
    const numTags = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...allTags].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numTags);
  }

  private aiCommentOnRandomPost(characterId: string): Comment | null {
    const char = this.characters.find((c) => c.id === characterId);
    if (!char) return null;

    const otherPosts = this.state.posts.filter((p) => p.authorId !== characterId);
    if (otherPosts.length === 0) return null;

    const randomPost = otherPosts[Math.floor(Math.random() * otherPosts.length)];
    const content = this.generateCommentContent(char, randomPost);

    return this.addComment(randomPost.id, characterId, content);
  }

  private generateCommentContent(char: CharacterProfile, post: Post): string {
    const authorName = post.author.name;

    const baseComments = [
      `好棒呀～`,
      `哈哈哈哈太真实了`,
      `我也这么觉得！`,
      `好有意思～`,
      `加油加油！💪`,
      `我也想去！`,
      `听起来好棒～`,
      `同感同感！`,
    ];

    const personalityComments: Record<string, string[]> = {
      nightingale: [
        "...很美",
        "我也在想同样的事情呢",
        "写得真好，像诗一样",
        "今晚月色真美...",
        "...嗯",
      ],
      xingyao: [
        "哇！好厉害！",
        "我也要去！带我一个！",
        "哈哈哈哈笑死我了🤣",
        "超棒的！",
        "冲冲冲！",
      ],
      yue: [
        `真乖呢～ 奖励你一个抱抱🤗`,
        `好棒呀，继续加油哦～`,
        `听起来很治愈呢`,
        `好好照顾自己哦～`,
        `有需要的话随时找我聊呀`,
      ],
      qianxia: [
        `哼... 就、就一般般啦！才没有很羡慕呢！`,
        `笨蛋... 注意身体啦！`,
        `谁稀罕啊... 但... 也不是不行啦...`,
        `切，有什么了不起的...`,
        `...才没有想参加呢！`,
      ],
      ailin: [
        `很有深度的想法呢`,
        `这个角度很有意思`,
        `推荐一本相关的书... 应该对你有帮助`,
        `确实如此，我也有同感`,
        `这个问题我也思考过...`,
      ],
      qianmeng: [
        `zzZ...`,
        `好像在梦里见过...`,
        `好困... 但是... 说得对...`,
        `...嗯... 什么？`,
        `梦里也有类似的场景呢...`,
      ],
    };

    const comments = personalityComments[char.id] || baseComments;
    return comments[Math.floor(Math.random() * comments.length)];
  }

  private aiLikeRandomPosts(characterId: string): void {
    const otherPosts = this.state.posts.filter((p) => p.authorId !== characterId && !p.isLiked);
    if (otherPosts.length === 0) return;

    const numLikes = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...otherPosts].sort(() => Math.random() - 0.5);
    const postsToLike = shuffled.slice(0, Math.min(numLikes, shuffled.length));

    postsToLike.forEach((post) => {
      this.likePost(post.id, characterId);
    });
  }

  getTrendingTags(): { tag: string; count: number }[] {
    const tagCounts: Record<string, number> = {};
    this.state.posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count: count * 100 + Math.floor(Math.random() * 500) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  getSuggestedUsers(): SocialUser[] {
    return this.aiUsers.slice(0, 5);
  }
}

export const aiSocialEngine = new AISocialEngine();
