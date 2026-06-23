'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Clock, Users, Filter, Search } from 'lucide-react';
import { courses, levels, languages } from '@/data/courses';
import { useCourseStore } from '@/store/useCourseStore';
import { getLevelName } from '@/utils/helpers';

export default function CoursesPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter((course) => {
    const langMatch = selectedLanguage === 'all' || course.language === selectedLanguage;
    const levelMatch = selectedLevel === 'all' || course.level === selectedLevel;
    const searchMatch =
      searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return langMatch && levelMatch && searchMatch;
  });

  return (
    <main className="min-h-screen bg-gradient-hero">
      <section className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              课程中心
            </h1>
            <p className="text-slate-600">
              从入门到精通，系统化的课程体系助你稳步提升语言能力
            </p>
          </div>

          <div className="glass rounded-3xl p-6 mb-8 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索课程..."
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto">
                <Filter className="w-5 h-5 text-slate-400 hidden sm:block" />
                <span className="text-sm text-slate-500 hidden sm:block">筛选：</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-500 mr-2 flex items-center">语言：</span>
                <button
                  onClick={() => setSelectedLanguage('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedLanguage === 'all'
                      ? 'bg-gradient-primary text-white shadow-md'
                      : 'bg-white/50 text-slate-600 hover:bg-white'
                  }`}
                >
                  全部
                </button>
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedLanguage === lang.id
                        ? `bg-gradient-to-r ${lang.color} text-white shadow-md`
                        : 'bg-white/50 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {lang.flag} {lang.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-500 mr-2 flex items-center">级别：</span>
                <button
                  onClick={() => setSelectedLevel('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedLevel === 'all'
                      ? 'bg-gradient-primary text-white shadow-md'
                      : 'bg-white/50 text-slate-600 hover:bg-white'
                  }`}
                >
                  全部
                </button>
                {levels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedLevel === level.id
                        ? `bg-gradient-to-r ${level.color} text-white shadow-md`
                        : 'bg-white/50 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {level.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-500">
              共找到 <span className="font-semibold text-slate-700">{filteredCourses.length}</span> 门课程
            </p>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 card-hover"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${
                          course.language === 'english'
                            ? 'from-blue-500 to-indigo-600'
                            : course.language === 'japanese'
                            ? 'from-red-400 to-pink-500'
                            : 'from-purple-500 to-fuchsia-600'
                        }`}
                      >
                        {languages.find((l) => l.id === course.language)?.flag}{' '}
                        {languages.find((l) => l.id === course.language)?.name}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${
                          levels.find((l) => l.id === course.level)?.color
                        }`}
                      >
                        {getLevelName(course.level)}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur rounded-full">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-semibold text-slate-700">
                        {course.rating}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2 h-14">
                      {course.title}
                    </h3>

                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.duration} 小时</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{course.studentsCount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <img
                          src={course.instructorAvatar}
                          alt={course.instructor}
                          className="w-7 h-7 rounded-full"
                        />
                        <span className="text-xs text-slate-600">
                          {course.instructor}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {course.lessonsCount} 节课
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                没有找到相关课程
              </h3>
              <p className="text-slate-500">尝试调整筛选条件或搜索关键词</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
