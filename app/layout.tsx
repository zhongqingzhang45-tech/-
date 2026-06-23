import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'LinguaVerse · 沉浸式多语种学习平台',
  description:
    'LinguaVerse 是一款沉浸式多语种在线学习平台，支持英语、日语、韩语等主流语言学习。通过科学的分级课程体系和互动学习模块，让语言学习变得更高效、更有趣。',
  keywords: [
    '语言学习',
    '英语学习',
    '日语学习',
    '韩语学习',
    '在线教育',
    '单词记忆',
    'LinguaVerse',
  ],
  openGraph: {
    title: 'LinguaVerse · 沉浸式多语种学习平台',
    description: '支持英语、日语、韩语等主流语言，科学的分级课程体系，让语言学习更高效有趣。',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <div className="noise-overlay" />
        <Header />
        <main className="relative z-10 pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
