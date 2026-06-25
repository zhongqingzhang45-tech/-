"use client";

import { useState, useEffect } from "react";

interface GameModalProps {
  gameId: string;
  onClose: () => void;
  onMoodChange?: (mood: string) => void;
}

export function GameModal({ gameId, onClose, onMoodChange }: GameModalProps) {
  const [gameState, setGameState] = useState<any>({});

  useEffect(() => {
    if (gameId === "fortune") {
      setGameState({ result: null, revealed: false });
    } else if (gameId === "rps") {
      setGameState({ playerChoice: null, loverChoice: null, result: null, score: { win: 0, lose: 0, draw: 0 } });
    } else if (gameId === "truth") {
      setGameState({ currentQuestion: 0, answers: [] });
    } else if (gameId === "quiz") {
      setGameState({ currentQuestion: 0, score: 0, answered: false });
    }
  }, [gameId]);

  const truthQuestions = [
    "你第一次见到我是什么感觉？",
    "你最喜欢我身上的哪一点？",
    "你理想中的约会是什么样的？",
    "你最想和我一起做什么事？",
    "你会因为什么吃醋？",
    "你最难忘的一次经历是什么？",
  ];

  const quizQuestions = [
    { q: "我最喜欢的颜色是？", options: ["粉色", "蓝色", "紫色", "红色"], answer: 2 },
    { q: "我的生日是几月？", options: ["1月", "3月", "6月", "12月"], answer: 1 },
    { q: "我最喜欢吃什么？", options: ["火锅", "甜品", "日料", "烧烤"], answer: 1 },
    { q: "我平时喜欢做什么？", options: ["看电影", "看书", "打游戏", "散步"], answer: 0 },
  ];

  const fortuneResults = [
    { level: "大吉", message: "今天的恋爱运势超级好！TA会给你意想不到的惊喜哦～", color: "from-pink-500 to-rose-500" },
    { level: "吉", message: "今天运气不错呢，主动一点会有好事发生～", color: "from-violet-500 to-purple-500" },
    { level: "中吉", message: "平平淡淡的一天，但有你在就很幸福。", color: "from-blue-500 to-cyan-500" },
    { level: "小吉", message: "可能会有小误会，记得多沟通哦～", color: "from-amber-500 to-orange-500" },
    { level: "末吉", message: "今天要多哄哄TA哦，不然可要生气啦～", color: "from-rose-500 to-red-500" },
  ];

  const rpsOptions = [
    { id: "rock", name: "石头", icon: "✊" },
    { id: "scissors", name: "剪刀", icon: "✌️" },
    { id: "paper", name: "布", icon: "🖐️" },
  ];

  const getRpsResult = (player: string, lover: string) => {
    if (player === lover) return "draw";
    if (
      (player === "rock" && lover === "scissors") ||
      (player === "scissors" && lover === "paper") ||
      (player === "paper" && lover === "rock")
    ) return "win";
    return "lose";
  };

  const playRps = (playerChoice: string) => {
    const loverChoice = rpsOptions[Math.floor(Math.random() * rpsOptions.length)].id;
    const result = getRpsResult(playerChoice, loverChoice);
    setGameState((prev: any) => ({
      ...prev,
      playerChoice,
      loverChoice,
      result,
      score: {
        win: prev.score.win + (result === "win" ? 1 : 0),
        lose: prev.score.lose + (result === "lose" ? 1 : 0),
        draw: prev.score.draw + (result === "draw" ? 1 : 0),
      },
    }));
    if (result === "win") {
      onMoodChange?.("sad");
    } else if (result === "lose") {
      onMoodChange?.("playful");
    }
  };

  const drawFortune = () => {
    const result = fortuneResults[Math.floor(Math.random() * fortuneResults.length)];
    setGameState((prev: any) => ({ ...prev, result, revealed: true }));
  };

  const nextTruthQuestion = () => {
    setGameState((prev: any) => ({
      ...prev,
      currentQuestion: (prev.currentQuestion + 1) % truthQuestions.length,
    }));
  };

  const answerQuiz = (index: number) => {
    if (gameState.answered) return;
    const isCorrect = index === quizQuestions[gameState.currentQuestion].answer;
    setGameState((prev: any) => ({
      ...prev,
      answered: true,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));
    if (isCorrect) {
      onMoodChange?.("happy");
    } else {
      onMoodChange?.("playful");
    }
  };

  const nextQuizQuestion = () => {
    if (gameState.currentQuestion < quizQuestions.length - 1) {
      setGameState((prev: any) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        answered: false,
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md
        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
        backdrop-blur-2xl border border-white/10 rounded-2xl
        shadow-2xl shadow-pink-500/10
        flex flex-col overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent">
            {gameId === "truth" && "💭 真心话"}
            {gameId === "rps" && "✊ 猜拳对决"}
            {gameId === "quiz" && "🧩 默契考验"}
            {gameId === "fortune" && "🔮 今日运势"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10
              flex items-center justify-center transition-colors text-white/60"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {gameId === "fortune" && (
            <div className="text-center">
              {!gameState.revealed ? (
                <div className="py-8">
                  <div className="text-6xl mb-6 animate-bounce">🔮</div>
                  <p className="text-white/70 mb-6">静下心来，默念你的问题...</p>
                  <button
                    onClick={drawFortune}
                    className="px-8 py-3 rounded-xl
                      bg-gradient-to-r from-cyan-500 to-blue-500
                      hover:from-cyan-400 hover:to-blue-400
                      text-white font-medium shadow-lg shadow-cyan-500/25
                      transition-all duration-200"
                  >
                    抽取今日运势
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <div
                    className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center
                      text-4xl bg-gradient-to-br ${gameState.result.color}
                      shadow-2xl animate-bounce`}
                  >
                    {gameState.result.level === "大吉" ? "🌟" :
                     gameState.result.level === "吉" ? "✨" :
                     gameState.result.level === "中吉" ? "💫" :
                     gameState.result.level === "小吉" ? "🌙" : "💝"}
                  </div>
                  <p className="text-3xl font-bold text-white mb-3">{gameState.result.level}</p>
                  <p className="text-white/70 leading-relaxed">{gameState.result.message}</p>
                  <button
                    onClick={onClose}
                    className="mt-6 px-6 py-2 rounded-xl bg-white/5 border border-white/10
                      text-white/70 hover:bg-white/10 transition-colors"
                  >
                    收下运势
                  </button>
                </div>
              )}
            </div>
          )}

          {gameId === "rps" && (
            <div>
              <div className="flex justify-around mb-6 text-center">
                <div>
                  <div className="text-5xl mb-2 h-16 flex items-center justify-center">
                    {gameState.playerChoice
                      ? rpsOptions.find((o) => o.id === gameState.playerChoice)?.icon
                      : "❓"}
                  </div>
                  <p className="text-sm text-white/60">你</p>
                </div>
                <div className="text-2xl text-white/40 flex items-center">VS</div>
                <div>
                  <div className="text-5xl mb-2 h-16 flex items-center justify-center">
                    {gameState.loverChoice
                      ? rpsOptions.find((o) => o.id === gameState.loverChoice)?.icon
                      : "❓"}
                  </div>
                  <p className="text-sm text-white/60">TA</p>
                </div>
              </div>

              {gameState.result && (
                <div className="text-center mb-6">
                  <p className={`text-xl font-bold ${
                    gameState.result === "win" ? "text-emerald-400" :
                    gameState.result === "lose" ? "text-rose-400" : "text-amber-400"
                  }`}>
                    {gameState.result === "win" ? "🎉 你赢了！" :
                     gameState.result === "lose" ? "😜 你输了~" : "🤝 平局！"}
                  </p>
                </div>
              )}

              <div className="flex justify-around mb-4">
                {rpsOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => playRps(opt.id)}
                    className="w-20 h-20 rounded-2xl text-4xl
                      bg-white/5 border border-white/10
                      hover:bg-pink-500/10 hover:border-pink-400/30
                      transition-all duration-200 active:scale-95"
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>

              <div className="flex justify-center gap-6 text-xs text-white/50">
                <span>胜: {gameState.score?.win || 0}</span>
                <span>负: {gameState.score?.lose || 0}</span>
                <span>平: {gameState.score?.draw || 0}</span>
              </div>
            </div>
          )}

          {gameId === "truth" && (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">💭</div>
              <p className="text-xs text-white/50 mb-4">第 {gameState.currentQuestion + 1} 题</p>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 mb-6">
                <p className="text-lg text-white/90 leading-relaxed">
                  {truthQuestions[gameState.currentQuestion]}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm
                    bg-white/5 border border-white/10 text-white/70
                    hover:bg-white/10 transition-colors"
                >
                  我想想...
                </button>
                <button
                  onClick={nextTruthQuestion}
                  className="flex-1 py-2.5 rounded-xl text-sm
                    bg-gradient-to-r from-pink-500 to-violet-500 text-white
                    hover:from-pink-400 hover:to-violet-400
                    shadow-lg shadow-pink-500/25 transition-all"
                >
                  换一题
                </button>
              </div>
            </div>
          )}

          {gameId === "quiz" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-white/50">
                  {gameState.currentQuestion + 1} / {quizQuestions.length}
                </span>
                <span className="text-xs text-amber-400">
                  得分: {gameState.score || 0}
                </span>
              </div>

              <p className="text-white/90 mb-4">
                {quizQuestions[gameState.currentQuestion].q}
              </p>

              <div className="space-y-2 mb-6">
                {quizQuestions[gameState.currentQuestion].options.map((opt, i) => {
                  const isCorrect = i === quizQuestions[gameState.currentQuestion].answer;
                  const showResult = gameState.answered;
                  return (
                    <button
                      key={i}
                      onClick={() => answerQuiz(i)}
                      className={`w-full p-3 rounded-xl text-left text-sm transition-all
                        ${showResult
                          ? isCorrect
                            ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                            : "bg-white/5 border-white/10 text-white/40"
                          : "bg-white/5 border border-white/10 text-white/70 hover:bg-pink-500/10 hover:border-pink-400/30"
                        }
                        border`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {gameState.answered && (
                <button
                  onClick={gameState.currentQuestion < quizQuestions.length - 1 ? nextQuizQuestion : onClose}
                  className="w-full py-2.5 rounded-xl text-sm
                    bg-gradient-to-r from-pink-500 to-violet-500 text-white
                    hover:from-pink-400 hover:to-violet-400
                    shadow-lg shadow-pink-500/25 transition-all"
                >
                  {gameState.currentQuestion < quizQuestions.length - 1 ? "下一题" : "完成"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
