'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Sparkles, ChevronRight, Globe2 } from 'lucide-react';
import { languages } from '@/data/courses';
import { useLearningStore } from '@/store/useLearningStore';

export function Hero() {
  const [selectedLang, setSelectedLang] = useState('english');
  const { setLanguage } = useLearningStore();

  const handleSelectLang = (langId: string) => {
    setSelectedLang(langId);
    setLanguage(langId);
  };

  return (
    <section className="relative bg-gradient-hero pt-16 pb-24 overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-float-delayed" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up stagger-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-indigo-700">
                全新 AI 驱动的语言学习体验
              </span>
            </div>

            <h1 className="font-display text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              开启你的
              <span className="text-gradient block mt-2">
                语言学习之旅
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
              沉浸式多语种学习平台，支持英语、日语、韩语等主流语言。
              科学的分级课程体系，丰富的互动练习，让每一分钟学习都高效有趣。
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                href="/register"
                className="btn-primary px-8 py-4 rounded-full font-semibold flex items-center gap-2 group"
              >
                免费开始学习
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/courses"
                className="btn-secondary px-8 py-4 rounded-full font-semibold flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                浏览课程
              </Link>
            </div>

            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl font-bold text-slate-900">50K+</div>
                <div className="text-sm text-slate-500">活跃学习者</div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <div className="text-3xl font-bold text-slate-900">200+</div>
                <div className="text-sm text-slate-500">精品课程</div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <div className="text-3xl font-bold text-slate-900">4.9</div>
                <div className="text-sm text-slate-500">用户评分</div>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in-up stagger-2">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
              <div className="relative glass rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <Globe2 className="w-6 h-6 text-indigo-600" />
                  <h3 className="font-semibold text-slate-800">选择你想学习的语言</h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleSelectLang(lang.id)}
                      className={`p-6 rounded-2xl transition-all duration-300 card-hover ${
                        selectedLang === lang.id
                          ? `bg-gradient-to-br ${lang.color} text-white shadow-lg scale-105`
                          : 'bg-white/50 border border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="text-4xl mb-3">{lang.flag}</div>
                      <div
                        className={`font-semibold ${
                          selectedLang === lang.id ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {lang.name}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          selectedLang === lang.id
                            ? 'text-white/80'
                            : 'text-slate-500'
                        }`}
                      >
                        {lang.nativeName}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">学习进度</span>
                    <span className="text-sm font-semibold text-indigo-600">
                      {languages.find((l) => l.id === selectedLang)?.name}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary rounded-full transition-all duration-700"
                      style={{ width: `${selectedLang === 'english' ? 35 : selectedLang === 'japanese' ? 20 : 10}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>已学 12 课</span>
                    <span>共 48 课</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-lg animate-float">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-2xl">
                  🔥
                </div>
                <div>
                  <div className="font-bold text-slate-800">7 天连续</div>
                  <div className="text-xs text-slate-500">继续保持！</div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 glass rounded-2xl p-4 shadow-lg animate-float-delayed">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-2xl">
                  ⭐
                </div>
                <div>
                  <div className="font-bold text-slate-800">120 词汇</div>
                  <div className="text-xs text-slate-500">已掌握</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
