import Link from 'next/link';
import { BookOpen, X, Globe, Code2, Mail } from 'lucide-react';

export function Footer() {
  const links = {
    product: [
      { label: '课程中心', href: '/courses' },
      { label: '单词记忆', href: '/learn/vocabulary' },
      { label: '语法练习', href: '/learn/grammar' },
      { label: '听力训练', href: '/learn/listening' },
    ],
    company: [
      { label: '关于我们', href: '#' },
      { label: '联系我们', href: '#' },
      { label: '加入我们', href: '#' },
      { label: '新闻动态', href: '#' },
    ],
    support: [
      { label: '帮助中心', href: '#' },
      { label: '常见问题', href: '#' },
      { label: '用户协议', href: '#' },
      { label: '隐私政策', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: X, href: '#', label: 'Twitter' },
    { icon: Globe, href: '#', label: 'Website' },
    { icon: Code2, href: '#', label: 'Github' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                LinguaVerse
              </span>
            </Link>
            <p className="text-sm text-slate-400 mb-6 max-w-sm leading-relaxed">
              沉浸式多语种在线学习平台，让语言学习变得更高效、更有趣。
              支持英语、日语、韩语等主流语言，助你开启语言学习之旅。
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">产品</h4>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">公司</h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">支持</h4>
            <ul className="space-y-3">
              {links.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © 2024 LinguaVerse. 保留所有权利。
          </p>
          <p className="text-sm text-slate-500">
            用心做好每一门语言课程 ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}
