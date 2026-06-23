'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import { getWordsByLanguage } from '@/data/vocabulary';
import { useLearningStore } from '@/store/useLearningStore';
import { shuffleArray } from '@/utils/helpers';

const listeningQuestions = [
  {
    id: 1,
    audio: '场景对话',
    question: '这段对话发生在什么地方？',
    options: ['餐厅', '商店', '学校', '办公室'],
    answer: 0,
    script: `A: 欢迎光临，请问几位？\nB: 两位，谢谢。\nA: 这边请。这是菜单。\nB: 好的，谢谢。`,
    translation: `A：欢迎光临，请问几位？\nB：两位，谢谢。\nA：这边请。这是菜单。\nB：好的，谢谢。`,
    explanation: '从"欢迎光临"、"菜单"等关键词可以判断对话发生在餐厅。',
  },
  {
    id: 2,
    audio: '数字听力',
    question: '电话号码是多少？',
    options: ['138-1234-5678', '139-4567-8901', '137-2345-6789', '136-3456-7890'],
    answer: 1,
    script: '我的电话号码是 139-4567-8901。',
    translation: '我的电话号码是 139-4567-8901。',
    explanation: '仔细听数字发音，注意区分相似的数字发音。',
  },
  {
    id: 3,
    audio: '时间表达',
    question: '会议几点开始？',
    options: ['上午9点', '上午10点', '下午2点', '下午3点'],
    answer: 2,
    script: `A: 会议是几点的来着？\nB: 下午两点，别忘了。\nA: 好的，我记一下。`,
    translation: `A：会议是几点的来着？\nB：下午两点，别忘了。\nA：好的，我记一下。`,
    explanation: '对话中明确提到"下午两点"，注意听时间相关的表达。',
  },
  {
    id: 4,
    audio: '问路场景',
    question: '男士要去哪里？',
    options: ['图书馆', '火车站', '超市', '医院'],
    answer: 1,
    script: `A: 请问，去火车站怎么走？\nB: 直走，在第二个路口右转就到了。\nA: 谢谢！`,
    translation: `A：请问，去火车站怎么走？\nB：直走，在第二个路口右转就到了。\nA：谢谢！`,
    explanation: '男士问"去火车站怎么走"，所以他要去火车站。',
  },
];

export default function ListeningPage() {
  const { currentLanguage, addStudyTime, incrementListeningPractices } = useLearningStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showScript, setShowScript] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const currentQuestion = listeningQuestions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.answer;
  const progress = ((currentIndex + 1) / listeningQuestions.length) * 100;

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000 / playbackSpeed);
  };

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    setShowScript(true);
    incrementListeningPractices();
    if (index === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < listeningQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setShowScript(false);
      setIsPlaying(false);
    } else {
      setIsComplete(true);
      const minutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      addStudyTime(minutes, 'listening');
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setShowScript(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowScript(false);
    setScore(0);
    setIsComplete(false);
  };

  if (isComplete) {
    const accuracy = Math.round((score / listeningQuestions.length) * 100);
    return (
      <div className="max-w-lg mx-auto">
        <div className="glass rounded-3xl p-10 text-center shadow-xl animate-celebration">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-5xl shadow-lg">
            🎧
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">
            听力练习完成！
          </h2>
          <p className="text-slate-500 mb-8">本轮听力练习已结束</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-600">{score}</div>
              <div className="text-xs text-emerald-600">答对</div>
            </div>
            <div className="bg-rose-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-rose-500">
                {listeningQuestions.length - score}
              </div>
              <div className="text-xs text-rose-500">答错</div>
            </div>
            <div className="bg-indigo-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-indigo-600">{accuracy}%</div>
              <div className="text-xs text-indigo-600">正确率</div>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="w-full btn-primary py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            再来一轮
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">
            第 {currentIndex + 1} / {listeningQuestions.length} 题
          </span>
          <span className="text-sm font-medium text-indigo-600">得分：{score}</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="glass rounded-3xl p-8 shadow-xl mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-600">
              🎧 {currentQuestion.audio}
            </span>
            <div className="flex items-center gap-2">
              {[0.75, 1, 1.25].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    playbackSpeed === speed
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-500 hover:bg-indigo-50'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => {
                setIsPlaying(true);
                setTimeout(() => setIsPlaying(false), 500);
              }}
              className="w-12 h-12 rounded-full bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-all"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={handlePlay}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isPlaying
                  ? 'bg-indigo-600 text-white scale-110 shadow-lg'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105 shadow-lg'
              }`}
            >
              {isPlaying ? (
                <Volume2 className="w-8 h-8 animate-pulse" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>

            <button
              onClick={handleRestart}
              className="w-12 h-12 rounded-full bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {isPlaying && (
            <div className="mt-4 flex items-center justify-center gap-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-indigo-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 30 + 10}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isAnswer = index === currentQuestion.answer;
            let optionClass = 'bg-white/50 border-slate-200 hover:border-indigo-300';

            if (showExplanation) {
              if (isAnswer) {
                optionClass = 'bg-emerald-50 border-emerald-400 border-2';
              } else if (isSelected && !isAnswer) {
                optionClass = 'bg-rose-50 border-rose-400 border-2';
              } else {
                optionClass = 'bg-slate-50 border-slate-200 opacity-60';
              }
            } else if (isSelected) {
              optionClass = 'bg-indigo-50 border-indigo-400 border-2';
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={showExplanation}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${optionClass}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
                    showExplanation && isAnswer
                      ? 'bg-emerald-500 text-white'
                      : showExplanation && isSelected && !isAnswer
                      ? 'bg-rose-500 text-white'
                      : isSelected
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {showExplanation && isAnswer ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : showExplanation && isSelected && !isAnswer ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </div>
                <span className="text-slate-700 font-medium">{option}</span>
              </button>
            );
          })}
        </div>

        {(showScript || showExplanation) && (
          <div className="bg-slate-50 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-600">听力原文</span>
              <button
                onClick={() => setShowScript(!showScript)}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                {showScript ? '隐藏' : '显示'}翻译
              </button>
            </div>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {currentQuestion.script}
            </pre>
            {showScript && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <pre className="text-sm text-slate-500 whitespace-pre-wrap font-sans leading-relaxed">
                  {currentQuestion.translation}
                </pre>
              </div>
            )}
          </div>
        )}

        {showExplanation && (
          <div
            className={`p-5 rounded-2xl ${
              isCorrect
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <Lightbulb
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  isCorrect ? 'text-emerald-600' : 'text-amber-600'
                }`}
              />
              <div>
                <div
                  className={`font-semibold mb-1 ${
                    isCorrect ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isCorrect ? '回答正确！' : '回答错误'}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="w-14 h-14 rounded-full glass flex items-center justify-center text-slate-600 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          disabled={!showExplanation}
          className="btn-primary px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentIndex < listeningQuestions.length - 1 ? '下一题' : '查看结果'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
