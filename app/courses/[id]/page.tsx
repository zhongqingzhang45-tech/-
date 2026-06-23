'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Star,
  Clock,
  Users,
  Play,
  BookOpen,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Award,
  MessageSquare,
} from 'lucide-react';
import { courses, levels, languages } from '@/data/courses';
import { useCourseStore } from '@/store/useCourseStore';
import { useUserStore } from '@/store/useUserStore';
import { getLevelName } from '@/utils/helpers';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { isLoggedIn, user } = useUserStore();
  const { enrollCourse, getProgress, courseProgress } = useCourseStore();
  const [activeTab, setActiveTab] = useState('overview');

  const course = courses.find((c) => c.id === id);
  const progress = id ? getProgress(id as string) : undefined;
  const isEnrolled = !!progress;

  const relatedCourses = courses
    .filter((c) => c.id !== id && c.language === course?.language)
    .slice(0, 3);

  const lessons = [
    { id: 1, title: '课程介绍与学习方法', duration: '10 分钟', completed: true, free: true },
    { id: 2, title: '发音基础与口型示范', duration: '25 分钟', completed: true, free: true },
    { id: 3, title: '基础问候与自我介绍', duration: '20 分钟', completed: false, free: false },
    { id: 4, title: '数字、日期与时间', duration: '22 分钟', completed: false, free: false },
    { id: 5, title: '日常生活词汇', duration: '28 分钟', completed: false, free: false },
    { id: 6, title: '基本句型与语法', duration: '30 分钟', completed: false, free: false },
    { id: 7, title: '场景对话：餐厅点餐', duration: '25 分钟', completed: false, free: false },
    { id: 8, title: '场景对话：购物', duration: '22 分钟', completed: false, free: false },
  ];

  const reviews = [
    {
      id: 1,
      username: '小明同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
      rating: 5,
      date: '2024-01-10',
      content: '课程内容非常棒！老师讲解清晰易懂，从零基础开始学习，现在已经能进行简单的对话了。推荐给所有想入门的同学！',
    },
    {
      id: 2,
      username: '语言爱好者',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=language',
      rating: 5,
      date: '2024-01-08',
      content: '课程设计很科学，循序渐进，每个知识点都有对应的练习。特别是发音部分，老师讲得特别细致。',
    },
    {
      id: 3,
      username: '努力的小王',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      rating: 4,
      date: '2024-01-05',
      content: '整体课程质量很高，内容充实。希望以后能增加更多口语练习的内容。总体来说非常推荐！',
    },
  ];

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">课程不存在</h1>
          <Link
            href="/courses"
            className="btn-primary px-6 py-3 rounded-full inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回课程列表
          </Link>
        </div>
      </div>
    );
  }

  const langInfo = languages.find((l) => l.id === course.language);
  const levelInfo = levels.find((l) => l.id === course.level);

  const handleEnroll = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (id) {
      enrollCourse(id as string);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 text-white pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回课程列表
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${langInfo?.color}`}
                >
                  {langInfo?.flag} {langInfo?.name}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${levelInfo?.color}`}
                >
                  {getLevelName(course.level)}
                </span>
              </div>

              <h1 className="font-display text-3xl lg:text-4xl font-bold mb-4">
                {course.title}
              </h1>

              <p className="text-white/80 mb-6 max-w-2xl">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-white">{course.rating}</span>
                  <span>评分</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.studentsCount.toLocaleString()} 人学习</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration} 小时</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.lessonsCount} 节课</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
                <img
                  src={course.instructorAvatar}
                  alt={course.instructor}
                  className="w-12 h-12 rounded-full border-2 border-white/30"
                />
                <div>
                  <div className="font-semibold">{course.instructor}</div>
                  <div className="text-sm text-white/60">资深语言讲师</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative aspect-video bg-slate-800">
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-indigo-600 ml-1" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {isEnrolled ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-sm text-slate-500 mb-1">学习进度</div>
                        <div className="text-2xl font-bold text-indigo-600">
                          {progress?.progressPercent}%
                        </div>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-primary rounded-full"
                          style={{ width: `${progress?.progressPercent || 0}%` }}
                        />
                      </div>
                      <button className="w-full btn-primary py-3 rounded-xl font-semibold">
                        继续学习
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-sm text-slate-500 mb-1">课程价格</div>
                        <div className="text-3xl font-bold text-slate-900">
                          免费学习
                        </div>
                      </div>
                      <button
                        onClick={handleEnroll}
                        className="w-full btn-primary py-3.5 rounded-xl font-semibold"
                      >
                        立即开始学习
                      </button>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      永久访问所有课程内容
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      配套练习题和测验
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      学习进度跟踪
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      社区答疑服务
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100">
                {[
                  { id: 'overview', label: '课程介绍', icon: BookOpen },
                  { id: 'lessons', label: '课程大纲', icon: Play },
                  { id: 'reviews', label: '学员评价', icon: MessageSquare },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-6 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">
                        你将学到什么
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          '掌握基础发音和语音规则',
                          '积累 500+ 核心词汇',
                          '理解并运用基础语法',
                          '进行日常场景对话',
                          '听懂简单的听力材料',
                          '写出简单的句子和短文',
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 text-sm text-slate-600"
                          >
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">
                        课程简介
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {course.description}
                      </p>
                      <p className="text-slate-600 leading-relaxed mt-4">
                        本课程采用科学的语言学习方法，结合沉浸式教学理念，
                        从最基础的发音开始，循序渐进地带你掌握语言的核心技能。
                        每节课都配有丰富的练习和测验，帮助你巩固所学内容。
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">
                        适合人群
                      </h3>
                      <ul className="space-y-2 text-slate-600">
                        <li className="flex items-start gap-2">
                          <span className="text-indigo-500">•</span>
                          零基础或基础薄弱的语言学习者
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-indigo-500">•</span>
                          想要系统学习一门新语言的同学
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-indigo-500">•</span>
                          计划出国留学、工作或旅行的人士
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-indigo-500">•</span>
                          对目标语言文化感兴趣的爱好者
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'lessons' && (
                  <div className="space-y-2">
                    {lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                          lesson.completed
                            ? 'bg-emerald-50 border border-emerald-100'
                            : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            lesson.completed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white text-slate-400'
                          }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div
                            className={`font-medium ${
                              lesson.completed
                                ? 'text-emerald-700 line-through'
                                : 'text-slate-800'
                            }`}
                          >
                            第 {lesson.id} 课 · {lesson.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {lesson.duration}
                          </div>
                        </div>
                        {lesson.free && (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            免费试学
                          </span>
                        )}
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="pb-6 border-b border-slate-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <img
                            src={review.avatar}
                            alt={review.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-800">
                                {review.username}
                              </span>
                              <span className="text-xs text-slate-400">
                                {review.date}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed ml-13">
                          {review.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">相关课程</h3>
              <div className="space-y-4">
                {relatedCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}`}
                    className="flex gap-3 group"
                  >
                    <img
                      src={c.coverImage}
                      alt={c.title}
                      className="w-20 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {c.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {c.rating}
                        <span>·</span>
                        <span>{c.duration} 小时</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <Award className="w-10 h-10 mb-3" />
              <h3 className="font-semibold text-lg mb-2">完成课程获得证书</h3>
              <p className="text-white/80 text-sm mb-4">
                学完全部课程并通过考试后，即可获得官方认证的结业证书。
              </p>
              <button className="w-full bg-white text-indigo-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">
                了解详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
