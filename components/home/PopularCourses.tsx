'use client';

import Link from 'next/link';
import { Star, Clock, Users, ChevronRight } from 'lucide-react';
import { courses } from '@/data/courses';
import { getLevelName } from '@/utils/helpers';

export function PopularCourses() {
  const popularCourses = courses.slice(0, 6);

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              精选课程
            </span>
            <h2 className="font-display text-4xl font-bold text-slate-900 mt-2">
              热门课程推荐
            </h2>
            <p className="text-slate-500 mt-3 max-w-lg">
              从零基础到精通，系统化的课程体系帮助你稳步提升语言能力
            </p>
          </div>
          <Link
            href="/courses"
            className="hidden md:flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold group"
          >
            查看全部课程
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularCourses.map((course, index) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 card-hover"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${
                      course.language === 'english'
                        ? 'from-blue-500 to-indigo-600'
                        : course.language === 'japanese'
                        ? 'from-red-400 to-pink-500'
                        : 'from-purple-500 to-fuchsia-600'
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

              <div className="p-6">
                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">
                  {course.title}
                </h3>

                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {course.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration} 小时</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.studentsCount.toLocaleString()} 人学习</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <img
                      src={course.instructorAvatar}
                      alt={course.instructor}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm text-slate-600">
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

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/courses"
            className="btn-secondary inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium"
          >
            查看全部课程
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
