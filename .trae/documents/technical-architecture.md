# 多语种在线教育平台技术架构文档

## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层 (Next.js 14 + React 18)"
        A["页面层 Pages"]
        B["组件层 Components"]
        C["状态管理 Zustand"]
        D["样式层 TailwindCSS"]
    end

    subgraph "数据层"
        E["本地存储 LocalStorage"]
        F["Mock 数据"]
        G["静态资源 Public"]
    end

    subgraph "服务层"
        H["Next.js API Routes"]
        I["认证服务"]
        J["学习数据服务"]
    end

    A --> B
    B --> C
    B --> D
    C --> E
    C --> H
    H --> I
    H --> J
    J --> F
```

## 2. 技术栈说明

- **前端框架**：Next.js 14 (App Router) + React 18 + TypeScript
- **样式方案**：TailwindCSS 3.4 + CSS Variables
- **状态管理**：Zustand
- **图标库**：lucide-react
- **数据可视化**：recharts
- **数据持久化**：LocalStorage + IndexedDB
- **后端接口**：Next.js API Routes（模拟数据）
- **部署方式**：Vercel / Docker

## 3. 路由定义

| 路由路径 | 页面名称 | 功能说明 |
|----------|----------|----------|
| `/` | 首页 | 平台展示、语言选择、学习概览、热门课程 |
| `/courses` | 课程中心 | 分级课程列表、课程筛选 |
| `/courses/[id]` | 课程详情 | 课程信息、大纲、开始学习 |
| `/learn/vocabulary` | 单词记忆 | 闪卡学习、拼写练习 |
| `/learn/grammar` | 语法练习 | 语法题目、错题解析 |
| `/learn/speaking` | 口语跟读 | 发音示范、录音评分 |
| `/learn/listening` | 听力训练 | 场景听力、听写模式 |
| `/progress` | 学习进度 | 学习日历、数据统计、能力雷达 |
| `/community` | 社区广场 | 动态流、排行榜、话题讨论 |
| `/profile` | 个人中心 | 用户资料、成就徽章、学习路径 |
| `/login` | 登录页 | 用户登录 |
| `/register` | 注册页 | 用户注册 |

## 4. 数据模型

### 4.1 实体关系图

```mermaid
erDiagram
    USER ||--o{ COURSE_PROGRESS : has
    USER ||--o{ ACHIEVEMENT : earns
    USER ||--o{ STUDY_RECORD : creates
    USER ||--o{ POST : publishes
    COURSE ||--o{ LESSON : contains
    COURSE ||--o{ COURSE_PROGRESS : tracks
    LESSON ||--o{ WORD : has
    LESSON ||--o{ GRAMMAR_QUIZ : has
    VOCABULARY_SET ||--o{ WORD : contains
    ACHIEVEMENT ||--o{ USER_ACHIEVEMENT : "unlocked by"

    USER {
        string id PK
        string username
        string email
        string avatar
        string targetLanguage
        string level
        int streakDays
        int totalMinutes
        date createdAt
    }

    COURSE {
        string id PK
        string language
        string level
        string title
        string description
        string coverImage
        int duration
        int lessonsCount
        float rating
    }

    LESSON {
        string id PK
        string courseId FK
        string title
        int orderIndex
        string content
    }

    WORD {
        string id PK
        string lessonId FK
        string word
        string phonetic
        string meaning
        string example
        string audioUrl
    }

    GRAMMAR_QUIZ {
        string id PK
        string lessonId FK
        string question
        json options
        string answer
        string explanation
    }

    COURSE_PROGRESS {
        string id PK
        string userId FK
        string courseId FK
        int completedLessons
        float progressPercent
        date lastStudyDate
    }

    STUDY_RECORD {
        string id PK
        string userId FK
        date date
        int minutes
        int wordsLearned
        int accuracy
        string studyType
    }

    ACHIEVEMENT {
        string id PK
        string name
        string description
        string icon
        string conditionType
        int conditionValue
    }

    POST {
        string id PK
        string userId FK
        string content
        string type
        int likes
        int comments
        date createdAt
    }
```

### 4.2 状态管理

```typescript
// 用户状态
interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

// 学习状态
interface LearningState {
  currentLanguage: string;
  currentLevel: string;
  dailyGoal: number;
  todayMinutes: number;
  wordsLearned: number;
  streakDays: number;
  studyRecords: StudyRecord[];
  achievements: UserAchievement[];
  addStudyTime: (minutes: number) => void;
  completeLesson: (lessonId: string) => void;
  checkAchievements: () => void;
}

// 课程状态
interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  courseProgress: CourseProgress[];
  fetchCourses: (language?: string, level?: string) => void;
  enrollCourse: (courseId: string) => void;
}
```

## 5. 核心组件结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   ├── globals.css         # 全局样式
│   ├── courses/            # 课程模块
│   ├── learn/              # 学习模块
│   ├── progress/           # 进度模块
│   ├── community/          # 社区模块
│   ├── profile/            # 个人中心
│   ├── login/              # 登录
│   └── register/           # 注册
├── components/
│   ├── layout/             # 布局组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   ├── common/             # 通用组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ProgressRing.tsx
│   │   └── Badge.tsx
│   ├── home/               # 首页组件
│   ├── courses/            # 课程组件
│   ├── learn/              # 学习组件
│   ├── progress/           # 进度组件
│   ├── community/          # 社区组件
│   └── profile/            # 个人中心组件
├── store/                  # 状态管理
│   ├── useUserStore.ts
│   ├── useLearningStore.ts
│   └── useCourseStore.ts
├── data/                   # Mock 数据
│   ├── courses.ts
│   ├── vocabulary.ts
│   ├── grammar.ts
│   ├── achievements.ts
│   └── community.ts
├── types/                  # 类型定义
│   ├── index.ts
│   └── models.ts
└── utils/                  # 工具函数
    ├── storage.ts
    ├── helpers.ts
    └── date.ts
```

## 6. 认证流程

```mermaid
sequenceDiagram
    participant 用户
    participant 前端
    participant API
    participant LocalStorage

    用户->>前端: 输入邮箱密码
    前端->>API: POST /api/auth/login
    API->>API: 验证用户信息
    alt 验证成功
        API-->>前端: 返回用户数据 + token
        前端->>LocalStorage: 存储用户信息
        前端->>前端: 更新用户状态
        前端-->>用户: 跳转首页
    else 验证失败
        API-->>前端: 返回错误信息
        前端-->>用户: 显示错误提示
    end
```

## 7. 性能优化策略

1. **代码分割**：基于路由的代码分割，首屏加载优化
2. **图片优化**：Next.js Image 组件自动优化
3. **状态持久化**：学习数据本地缓存，减少重复请求
4. **动画优化**：CSS transforms + opacity，避免重排重绘
5. **虚拟列表**：长列表数据虚拟化渲染
6. **预加载**：关键资源预加载，提升后续页面切换速度
