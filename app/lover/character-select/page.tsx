"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FEMALE_CHARACTERS, MALE_CHARACTERS, CharacterProfile } from "@/lib/core/digital-life/types";

export default function CharacterSelectPage() {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState<"female" | "male">("female");
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile | null>(null);
  const [step, setStep] = useState<"select" | "confirm">("select");

  const characters = selectedGender === "female" ? FEMALE_CHARACTERS : MALE_CHARACTERS;

  const handleSelectCharacter = (character: CharacterProfile) => {
    setSelectedCharacter(character);
  };

  const handleConfirm = () => {
    if (!selectedCharacter) return;
    setStep("confirm");
  };

  const handleBind = () => {
    if (!selectedCharacter) return;
    localStorage.setItem("selected_character_id", selectedCharacter.id);
    localStorage.setItem("selected_character_name", selectedCharacter.name);
    router.push("/lover");
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("select");
    } else {
      router.back();
    }
  };

  const getAvatarGradient = (character: CharacterProfile) => {
    return `linear-gradient(135deg, ${character.accentColor} 0%, ${character.secondaryColor} 100%)`;
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8"
      style={{
        background: "radial-gradient(ellipse at 50% 80%, #1e1a2e 0%, #14111e 50%, #0a0a0f 100%)",
      }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === "select" ? "选择你的生命体" : "确认绑定"}
          </h1>
          <p className="text-ink-400 text-sm">
            {step === "select"
              ? "每个生命体都是独一无二的存在"
              : "一旦绑定将成为你唯一的生命体，无法更改，请确认"}
          </p>
        </div>

        {step === "select" ? (
          <>
            {/* 性别切换 */}
            <div className="flex justify-center gap-2 mb-6">
              <button
                onClick={() => setSelectedGender("female")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGender === "female"
                    ? "text-white"
                    : "text-ink-400 hover:text-white"
                }`}
                style={{
                  background:
                    selectedGender === "female"
                      ? "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2))"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${
                    selectedGender === "female"
                      ? "rgba(139,92,246,0.4)"
                      : "rgba(255,255,255,0.08)"
                  }`,
                }}
              >
                女生
              </button>
              <button
                onClick={() => setSelectedGender("male")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGender === "male"
                    ? "text-white"
                    : "text-ink-400 hover:text-white"
                }`}
                style={{
                  background:
                    selectedGender === "male"
                      ? "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.2))"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${
                    selectedGender === "male"
                      ? "rgba(59,130,246,0.4)"
                      : "rgba(255,255,255,0.08)"
                  }`,
                }}
              >
                男生
              </button>
            </div>

            {/* 角色网格 */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {characters.map((character, index) => (
                <button
                  key={character.id}
                  onClick={() => handleSelectCharacter(character)}
                  className="relative p-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
                  style={{
                    background:
                      selectedCharacter?.id === character.id
                        ? `linear-gradient(135deg, ${character.accentColor}20, ${character.secondaryColor}10)`
                        : "rgba(30,30,40,0.6)",
                    border: `2px solid ${
                      selectedCharacter?.id === character.id
                        ? character.accentColor
                        : "rgba(255,255,255,0.08)"
                    }`,
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  {/* 头像 */}
                  <div
                    className="w-full aspect-square rounded-xl mb-2 flex items-center justify-center overflow-hidden"
                    style={{ background: getAvatarGradient(character) }}
                  >
                    <span className="text-4xl">
                      {character.gender === "female" ? "👩" : "👨"}
                    </span>
                  </div>
                  {/* 名字 */}
                  <p className="text-white text-sm font-medium text-center">
                    {character.name}
                  </p>
                  {/* MBTI标签 */}
                  <p
                    className="text-xs text-center mt-0.5"
                    style={{ color: character.accentColor }}
                  >
                    {character.mbti}
                  </p>
                  {/* 选中标记 */}
                  {selectedCharacter?.id === character.id && (
                    <div
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: character.accentColor }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 选中角色详情 */}
            {selectedCharacter && (
              <div
                className="p-5 rounded-2xl mb-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{ background: getAvatarGradient(selectedCharacter) }}
                  >
                    <span className="text-3xl">
                      {selectedCharacter.gender === "female" ? "👩" : "👨"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">
                      {selectedCharacter.name}
                    </h3>
                    <p className="text-ink-400 text-sm">
                      {selectedCharacter.age}岁 · {selectedCharacter.mbti}
                    </p>
                    <div className="flex gap-1.5 mt-1.5">
                      {selectedCharacter.likes.slice(0, 3).map((like, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: `${selectedCharacter.accentColor}15`,
                            color: selectedCharacter.accentColor,
                          }}
                        >
                          {like}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-ink-300 text-sm leading-relaxed">
                  {selectedCharacter.persona.substring(0, 80)}...
                </p>
              </div>
            )}

            {/* 确认按钮 */}
            <button
              onClick={handleConfirm}
              disabled={!selectedCharacter}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: selectedCharacter
                  ? getAvatarGradient(selectedCharacter)
                  : "rgba(255,255,255,0.1)",
                boxShadow: selectedCharacter
                  ? `0 8px 32px ${selectedCharacter.accentColor}40`
                  : "none",
              }}
            >
              确认选择
            </button>

            <p className="text-center text-ink-500 text-xs mt-4">
              确认后将与你绑定，成为你独一无二的生命体
            </p>
          </>
        ) : (
          <div className="text-center">
            {/* 大头像 */}
            <div className="relative inline-block mb-6">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center mx-auto"
                style={{
                  background: getAvatarGradient(selectedCharacter!),
                  boxShadow: `0 0 60px ${selectedCharacter!.accentColor}40`,
                }}
              >
                <span className="text-6xl">
                  {selectedCharacter!.gender === "female" ? "👩" : "👨"}
                </span>
              </div>
              {/* 光环效果 */}
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  border: `2px solid ${selectedCharacter!.accentColor}`,
                  opacity: 0.5,
                }}
              />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              你将与 {selectedCharacter?.name} 绑定
            </h2>
            <p className="text-ink-400 text-sm mb-6">
              一旦绑定将成为你唯一的生命体
              <br />
              无法更改，请确认
            </p>

            <div className="space-y-3">
              <button
                onClick={handleBind}
                className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: getAvatarGradient(selectedCharacter!),
                  boxShadow: `0 8px 32px ${selectedCharacter!.accentColor}40`,
                }}
              >
                确认绑定
              </button>

              <button
                onClick={handleBack}
                className="w-full py-3 rounded-xl font-medium text-ink-300 hover:text-white transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                返回重新选择
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
