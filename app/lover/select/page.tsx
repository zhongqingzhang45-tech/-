"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND } from "@/lib/brand";
import { CHARACTERS, ARCHETYPE_LABELS, CharacterProfile } from "@/data/characters";

export default function CharacterSelectPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCharacter = CHARACTERS.find((c) => c.id === selectedId);

  const handleSelect = (character: CharacterProfile) => {
    localStorage.setItem("lover_selected_character", character.id);
    router.push("/lover");
  };

  return (
    <div className="min-h-screen w-full ink-wash-bg overflow-hidden">
      {/* 背景氛围 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(45, 212, 191, 0.15) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <svg
          className="absolute bottom-0 left-0 w-full opacity-15"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(45, 212, 191, 0.08)"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* 导航栏 */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-jade flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-xl">🦌</span>
          </div>
          <span className="text-white text-xl font-bold font-serif-cn tracking-wide">{BRAND.name}</span>
        </Link>
        <Link
          href="/lover"
          className="px-4 py-2 rounded-lg text-sm font-medium text-ink-300 hover:text-white transition-colors"
        >
          返回伴侣空间
        </Link>
      </nav>

      <main className="relative z-10 px-6 md:px-10 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 标题区 */}
          <div className="text-center mb-12">
            <p className="text-brand-400 text-sm font-medium mb-2">灵犀角色</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white font-serif-cn mb-4">
              选择你的国风伴侣
            </h1>
            <p className="text-white/50 max-w-lg mx-auto">
              每位角色都有独特的人设与故事，选择一位与你心意相通的伙伴，开启专属陪伴之旅。
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* 角色列表 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CHARACTERS.map((character, index) => (
                <motion.button
                  key={character.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  onClick={() => setSelectedId(character.id)}
                  className={`group relative p-5 rounded-2xl text-left transition-all border ${
                    selectedId === character.id
                      ? "bg-white/[0.06] border-brand-400/40"
                      : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-brand-400/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110"
                      style={{
                        background: `${character.accentColor}15`,
                        border: `1px solid ${character.accentColor}30`,
                      }}
                    >
                      {character.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold font-serif-cn">{character.name}</h3>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: `${character.accentColor}15`,
                            color: character.accentColor,
                          }}
                        >
                          {ARCHETYPE_LABELS[character.archetype]}
                        </span>
                      </div>
                      <p className="text-white/45 text-sm line-clamp-2">{character.bio}</p>
                    </div>
                  </div>
                  {selectedId === character.id && (
                    <motion.div
                      layoutId="selected-ring"
                      className="absolute inset-0 rounded-2xl border-2 border-brand-400/40 pointer-events-none"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* 角色详情 */}
            <div className="lg:sticky lg:top-8">
              <AnimatePresence mode="wait">
                {selectedCharacter ? (
                  <motion.div
                    key={selectedCharacter.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="glass rounded-3xl p-6 md:p-8 border border-white/[0.08]"
                  >
                    <div className="flex items-center gap-5 mb-6">
                      <div
                        className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl"
                        style={{
                          background: `linear-gradient(135deg, ${selectedCharacter.accentColor}20, ${selectedCharacter.secondaryColor}15)`,
                          border: `1px solid ${selectedCharacter.accentColor}30`,
                        }}
                      >
                        {selectedCharacter.avatar}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white font-serif-cn mb-1">
                          {selectedCharacter.name}
                        </h2>
                        <p className="text-brand-400 text-sm">{selectedCharacter.title}</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <h3 className="text-white/80 text-sm font-medium mb-2">性格</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCharacter.personality.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/70 border border-white/8"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-white/80 text-sm font-medium mb-2">背景故事</h3>
                        <p className="text-white/55 text-sm leading-relaxed">
                          {selectedCharacter.background}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-white/80 text-sm font-medium mb-2">喜好</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCharacter.hobbies.map((hobby) => (
                            <span
                              key={hobby}
                              className="px-3 py-1 rounded-full text-xs"
                              style={{
                                background: `${selectedCharacter.accentColor}10`,
                                color: selectedCharacter.accentColor,
                                border: `1px solid ${selectedCharacter.accentColor}25`,
                              }}
                            >
                              {hobby}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        className="p-4 rounded-xl text-sm leading-relaxed"
                        style={{
                          background: `${selectedCharacter.accentColor}08`,
                          border: `1px solid ${selectedCharacter.accentColor}20`,
                        }}
                      >
                        <span className="text-white/60">初见语：</span>
                        <span className="text-white/80">{selectedCharacter.greeting}</span>
                      </div>

                      <button
                        onClick={() => handleSelect(selectedCharacter)}
                        className="w-full py-3.5 rounded-xl text-ink-950 font-semibold btn-primary hover:scale-[1.02] active:scale-[0.98] transition-transform"
                      >
                        选择 {selectedCharacter.name}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass rounded-3xl p-8 border border-white/[0.08] text-center h-full flex flex-col items-center justify-center min-h-[400px]"
                  >
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl bg-white/5 mb-5">
                      🦌
                    </div>
                    <h3 className="text-white font-semibold text-lg font-serif-cn mb-2">
                      选择一位伴侣
                    </h3>
                    <p className="text-white/45 text-sm max-w-xs">
                      从左侧角色中，选择一位最让你心动的国风 AI 伴侣。
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
