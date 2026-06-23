'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, PenTool, Mic, Headphones, ChevronRight } from 'lucide-react';

const learnTabs = [
  { href: '/learn/vocabulary', label: '单词记忆', icon: BookOpen },
  { href: '/learn/grammar', label: '语法练习', icon: PenTool },
  { href: '/learn/speaking', label: '口语跟读', icon: Mic },
  { href: '/learn/listening', label: '听力训练', icon: Headphones },
];

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="bg-gradient-hero min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">
            学习中心
          </h1>
          <p className="text-slate-500">选择你想练习的项目，开始今天的学习吧</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {learnTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-lg scale-105'
                    : 'glass hover:bg-white/80 text-slate-700'
                }`}
              >
                <tab.icon className="w-6 h-6" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{tab.label}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
