'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, ArrowRight, Lightbulb } from 'lucide-react';
import { getGrammarQuizzesByLanguage } from '@/data/grammar';
import { useLearningStore } from '@/store/useLearningStore';
import { shuffleArray } from '@/utils/helpers';

export default function GrammarPage() {
  const { currentLanguage, addStudyTime, incrementGrammarQuizzes } = useLearningStore();
  const quizzes = getGrammarQuizzesByLanguage(currentLanguage);
  const [shuffledQuizzes, setShuffledQuizzes] = useState(quizzes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    setShuffledQuizzes(shuffleArray(quizzes).slice(0, 6));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setIsComplete(false);
  }, [currentLanguage]);

  const currentQuiz = shuffledQuizzes[currentIndex];
  const isCorrect = selectedAnswer === currentQuiz?.answer;
  const progress = ((currentIndex + 1) / shuffledQuizzes.length) * 100;

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    incrementGrammarQuizzes();
    if (index === currentQuiz.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < shuffledQuizzes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setIsComplete(true);
      const minutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      addStudyTime(minutes, 'grammar');
    }
  };

  const handleRestart = () => {
    setShuffledQuizzes(shuffleArray(quizzes).slice(0, 6));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setIsComplete(false);
  };

  if (!currentQuiz) return null;

  if (isComplete) {
    const accuracy = Math.round((score / shuffledQuizzes.length) * 100);
    return (
      <div className="max-w-lg mx-auto">
        <div className="glass rounded-3xl p-10 text-center shadow-xl animate-celebration">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl shadow-lg">
            🏆
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">
            练习完成！
          </h2>
          <p className="text-slate-500 mb-8">本轮语法练习已结束</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-600">{score}</div>
              <div className="text-xs text-emerald-600">答对</div>
            </div>
            <div className="bg-rose-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-rose-500">
                {shuffledQuizzes.length - score}
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
            第 {currentIndex + 1} / {shuffledQuizzes.length} 题
          </span>
          <span className="text-sm font-medium text-indigo-600">
            得分：{score}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="glass rounded-3xl p-8 shadow-xl mb-6">
        <div className="flex items-start gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            {currentIndex + 1}
          </div>
          <h3 className="text-xl font-semibold text-slate-800 pt-1">
            {currentQuiz.question}
          </h3>
        </div>

        <div className="space-y-3">
          {currentQuiz.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isAnswer = index === currentQuiz.answer;
            let optionClass = 'bg-white/50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50';

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

        {showExplanation && (
          <div
            className={`mt-6 p-5 rounded-2xl ${
              isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
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
                  {currentQuiz.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!showExplanation}
          className="btn-primary px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentIndex < shuffledQuizzes.length - 1 ? '下一题' : '查看结果'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
