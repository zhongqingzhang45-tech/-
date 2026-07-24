"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GuofengAmbient } from "@/components/GuofengAmbient";
import { GUOFENG_CHARACTERS, GuofengCharacter } from "@/data/characters";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedChar, setSelectedChar] = useState<GuofengCharacter | null>(null);
  const [petName, setPetName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const totalSteps = 4;

  const canProceed = () => {
    if (step === 1) return email && password.length >= 8;
    if (step === 2) return selectedChar !== null;
    if (step === 3) return birthDate;
    if (step === 4) return petName.trim().length > 0;
    return false;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed() || !selectedChar) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // 持久化 —— 供 useCharacterAgent 与 LoverApp 读取
      localStorage.setItem("lover_logged_in", "true");
      localStorage.setItem("lover_email", email);
      localStorage.setItem("lover_user_gender", "male");
      localStorage.setItem("lover_birth_date", birthDate);
      // 国风角色
      localStorage.setItem("lover_character_id", selectedChar.id);
      localStorage.setItem("lover_live2d_model", selectedChar.live2dModel);
      localStorage.setItem("lover_character_name", selectedChar.name);
      localStorage.setItem("lover_character_surname", "");
      localStorage.setItem("lover_character_nickname", petName.trim() || selectedChar.name);
      localStorage.setItem("lover_user_nickname", "公子");
      router.push("/lover");
    }, 1500);
  };

  const stepTitles = [
    "立字号",
    "择一人为伴",
    "问生辰",
    "唤一声君",
  ];
  const stepDescriptions = [
    "立一字号，开启你的国风陪伴之旅",
    "六位佳人，谁将入你心怀",
    "告知生辰，特殊日子自有惊喜",
    "给您的伴侣一个独属于你的称呼",
  ];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-8 gf-bg overflow-hidden">
      <div className="absolute inset-0 gf-grain" />
      <GuofengAmbient petals={12} clouds glow glowColor="rgba(200, 69, 60, 0.10)" />

      <div className="relative z-10 w-full max-w-lg">
        {/* 头部 */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="seal w-12 h-12 text-lg">君心</div>
            <div className="flex flex-col items-start leading-none">
              <span className="font-title text-paper-50 text-xl tracking-widest">君心</span>
              <span className="text-ink-500 text-[10px] tracking-[0.3em] mt-1">JUN XIN</span>
            </div>
          </Link>
          <h1 className="font-display text-3xl text-paper-50 mb-1.5">{stepTitles[step - 1]}</h1>
          <p className="text-ink-400 text-sm font-serif">{stepDescriptions[step - 1]}</p>
        </div>

        {/* 步骤指示器 —— 卷轴展开式 */}
        <div className="flex justify-center mb-6 gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i + 1 === step ? "36px" : "20px",
                background:
                  i + 1 <= step
                    ? "linear-gradient(90deg, #C8453C, #dcb363)"
                    : "rgba(201,169,97,0.12)",
              }}
            />
          ))}
        </div>

        <div className="scroll-card p-6">
          {/* 步骤 1：账户 */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-2 font-serif">邮箱地址</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all input-base font-serif"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-2 font-serif">设置密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 8 位字符"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all input-base font-serif"
                  required
                  minLength={8}
                />
                <p className="text-xs text-ink-500 mt-1.5 font-serif">密码至少 8 位字符</p>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="w-4 h-4 rounded mt-0.5" style={{ accentColor: "#C8453C" }} required />
                <span className="text-xs text-ink-400 leading-relaxed font-serif">
                  我已阅读并同意{" "}
                  <Link href="#" className="text-cinnabar-400 hover:text-cinnabar-300 transition-colors">服务条款</Link>
                  {" "}与{" "}
                  <Link href="#" className="text-cinnabar-400 hover:text-cinnabar-300 transition-colors">隐私政策</Link>
                </span>
              </div>
              <button
                type="submit"
                disabled={!canProceed()}
                className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-primary font-serif tracking-wider"
              >
                下一步
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full divider" /></div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-ink-500 text-xs glass-strong rounded-full font-serif">或</span>
                </div>
              </div>
              <div className="space-y-2.5">
                <button type="button" className="w-full py-3 rounded-lg font-medium text-ink-300 hover:text-paper-50 transition-all flex items-center justify-center gap-3 btn-secondary font-serif">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  使用 Google 注册
                </button>
              </div>
              <p className="text-center text-ink-400 text-sm mt-3 font-serif">
                已有缘？{" "}
                <Link href="/lover/login" className="text-cinnabar-400 hover:text-cinnabar-300 font-medium transition-colors">立即登录</Link>
              </p>
            </form>
          )}

          {/* 步骤 2：择伴 —— 国风角色选择 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {GUOFENG_CHARACTERS.map((c) => {
                  const active = selectedChar?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedChar(c)}
                      className="group relative scroll-card overflow-hidden aspect-[3/4] card-hover text-left transition-all"
                      style={{
                        borderColor: active ? c.accentColor : undefined,
                        boxShadow: active ? `0 0 0 1px ${c.accentColor}, 0 0 20px ${c.accentColor}40` : undefined,
                      }}
                    >
                      <img src={c.portrait} alt={c.name} className="absolute inset-0 w-full h-full object-cover" style={{ filter: "saturate(0.92)" }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
                      {c.premium && (
                        <span className="absolute top-2 right-2 seal w-7 h-7 text-[10px] z-10">尊</span>
                      )}
                      {active && (
                        <span
                          className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-paper-50 text-xs z-10 animate-seal-stamp"
                          style={{ background: c.accentColor }}
                        >
                          ✓
                        </span>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <span
                          className="inline-block text-[9px] px-1.5 py-0.5 rounded mb-1 font-serif"
                          style={{ backgroundColor: `${c.accentColor}30`, color: c.secondaryColor }}
                        >
                          {c.archetypeLabel}
                        </span>
                        <h4 className="font-display text-xl text-paper-50 leading-none">{c.name}</h4>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 选中角色详情 */}
              {selectedChar ? (
                <div
                  className="rounded-xl p-4 animate-slide-up"
                  style={{
                    background: `linear-gradient(135deg, ${selectedChar.accentColor}14 0%, rgba(28,22,16,0.6) 100%)`,
                    border: `1px solid ${selectedChar.accentColor}40`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-display text-2xl text-paper-50">{selectedChar.name}</h4>
                        <span className="text-gold-300 text-xs font-serif">· {selectedChar.title}</span>
                      </div>
                      <p className="text-ink-300 text-xs font-serif italic mb-2">「{selectedChar.poem}」</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedChar.traits.map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-serif" style={{ backgroundColor: `${selectedChar.accentColor}25`, color: selectedChar.secondaryColor }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-ink-400 text-[11px] font-serif leading-relaxed line-clamp-3">{selectedChar.background}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-ink-500 text-xs font-serif py-2">轻点佳人，与之结缘</p>
              )}

              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={handlePrev} className="px-5 py-3 rounded-lg font-medium transition-all btn-secondary font-serif">返回</button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 py-3 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-primary font-serif tracking-wider"
                >
                  与{selectedChar?.name ?? "TA"}结缘
                </button>
              </div>
            </div>
          )}

          {/* 步骤 3：生辰 */}
          {step === 3 && (
            <div className="space-y-5">
              {selectedChar && (
                <div className="flex items-center gap-3 p-3 rounded-xl glass">
                  <img src={selectedChar.portrait} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="text-ink-400 text-xs font-serif">将与您结缘</p>
                    <p className="font-display text-lg text-paper-50">{selectedChar.name}</p>
                  </div>
                </div>
              )}
              <p className="text-center text-ink-400 text-sm font-serif">告知生辰，TA 会在特殊日子为你备下惊喜</p>
              <div>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-4 rounded-lg outline-none transition-all input-base text-center text-lg font-serif"
                  style={{ colorScheme: "dark" }}
                  required
                />
              </div>
              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={handlePrev} className="px-5 py-3 rounded-lg font-medium transition-all btn-secondary font-serif">返回</button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 py-3 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-primary font-serif tracking-wider"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* 步骤 4：定名 */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedChar && (
                <div className="flex flex-col items-center mb-2">
                  <div className="relative">
                    <img src={selectedChar.portrait} alt={selectedChar.name} className="w-28 h-36 rounded-xl object-cover animate-breathe-soft" />
                    <span className="absolute -top-2 -right-2 seal w-8 h-8 text-[10px]">缘</span>
                  </div>
                  <p className="font-display text-2xl text-paper-50 mt-3">{selectedChar.name}</p>
                  <p className="text-gold-300 text-xs font-serif">{selectedChar.title}</p>
                </div>
              )}
              <p className="text-center text-ink-400 text-sm font-serif">给 TA 起一个独属于你的称呼</p>
              <div>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder={selectedChar ? `如：小${selectedChar.name.charAt(0)}、阿${selectedChar.name.charAt(0)}` : "给 TA 起个称呼吧"}
                  className="w-full px-4 py-4 rounded-lg outline-none transition-all input-base text-center text-xl font-display text-paper-50"
                  required
                  maxLength={20}
                />
              </div>
              {selectedChar && (
                <div className="flex gap-2 flex-wrap justify-center">
                  {[`小${selectedChar.name.charAt(0)}`, `阿${selectedChar.name.charAt(0)}`, selectedChar.name, selectedChar.archetypeLabel].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPetName(s)}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 font-serif"
                      style={{
                        background: petName === s ? `${selectedChar.accentColor}25` : "rgba(36,28,20,0.6)",
                        border: `1px solid ${petName === s ? `${selectedChar.accentColor}60` : "rgba(201,169,97,0.14)"}`,
                        color: petName === s ? selectedChar.secondaryColor : "#AE9876",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={handlePrev} className="px-5 py-3 rounded-lg font-medium transition-all btn-secondary font-serif">返回</button>
                <button
                  type="submit"
                  disabled={isLoading || !canProceed()}
                  className="flex-1 py-3 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-primary font-serif tracking-wider"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      正在结缘...
                    </span>
                  ) : "执伞相迎"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-ink-500 text-xs mt-5 font-serif">
          注册即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
