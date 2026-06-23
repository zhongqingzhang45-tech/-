'use client';

import { useState, useEffect } from 'react';
import {
  Volume2,
  RotateCcw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { getWordsByLanguage } from '@/data/vocabulary';
import { useLearningStore } from '@/store/useLearningStore';
import { shuffleArray } from '@/utils/helpers';

export default function VocabularyPage() {
  const { currentLanguage, addStudyTime, addWords } = useLearningStore();
  const words = getWordsByLanguage(currentLanguage);
  const [shuffledWords, setShuffledWords] = useState(words);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    setShuffledWords(shuffleArray(words));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setUnknownCount(0);
    setIsComplete(false);
  }, [currentLanguage]);

  const currentWord = shuffledWords[currentIndex];
  const progress = ((currentIndex + 1) / shuffledWords.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const goNext = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsComplete(true);
      const minutes = Math.max(
        1,
        Math.round((Date.now() - startTime) / 60000)
      );
      addStudyTime(minutes, 'vocabulary');
      addWords(knownCount + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleKnow = () => {
    setKnownCount((prev) => prev + 1);
    goNext();
  };

  const handleDontKnow = () => {
    setUnknownCount((prev) => prev + 1);
    goNext();
  };

  const handleRestart = () => {
    setShuffledWords(shuffleArray(words));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setUnknownCount(0);
    setIsComplete(false);
  };

  if (!currentWord) return null;

  if (isComplete) {
    const accuracy = Math.round((knownCount / shuffledWords.length) * 100);
    return (
      <div className="max-w-lg mx-auto">
        <div className="glass rounded-3xl p-10 text-center shadow-xl animate-celebration">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-5xl shadow-lg">
            🎉
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">
            太棒了！
          </h2>
          <p className="text-slate-500 mb-8">本轮单词学习已完成</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-600">
                {knownCount}
              </div>
              <div className="text-xs text-emerald-600">认识</div>
            </div>
            <div className="bg-rose-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-rose-500">
                {unknownCount}
              </div>
              <div className="text-xs text-rose-500">不认识</div>
            </div>
            <div className="bg-indigo-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-indigo-600">
                {accuracy}%
              </div>
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
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">
            第 {currentIndex + 1} / {shuffledWords.length} 个单词
          </span>
          <span className="text-sm text-slate-500">
            ✅ {knownCount} · ❌ {unknownCount}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        className="flip-card h-80 mb-8 cursor-pointer"
        onClick={handleFlip}
      >
        <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="flip-card-front">
            <div className="w-full h-full glass rounded-3xl p-8 flex flex-col items-center justify-center shadow-xl">
              <div className="text-sm text-slate-400 mb-4">点击卡片翻面</div>
              <h2 className="font-display text-5xl font-bold text-slate-900 mb-4 text-center">
                {currentWord.word}
              </h2>
              <p className="text-lg text-slate-500 mb-6">{currentWord.phonetic}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-200 transition-colors"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flip-card-back">
            <div className="w-full h-full glass rounded-3xl p-8 flex flex-col items-center justify-center shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="text-sm text-slate-400 mb-4">释义</div>
              <h3 className="text-3xl font-bold text-slate-900 mb-6 text-center">
                {currentWord.meaning}
              </h3>
              <div className="w-full max-w-sm">
                <div className="text-sm text-slate-400 mb-2">例句</div>
                <p className="text-slate-700 italic mb-1">{currentWord.example}</p>
                <p className="text-slate-500 text-sm">
                  {currentWord.exampleTranslation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="w-14 h-14 rounded-full glass flex items-center justify-center text-slate-600 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleDontKnow}
          className="flex-1 max-w-40 h-14 rounded-full bg-rose-50 border-2 border-rose-200 text-rose-500 font-semibold flex items-center justify-center gap-2 hover:bg-rose-100 transition-all"
        >
          <X className="w-5 h-5" />
          不认识
        </button>

        <button
          onClick={handleKnow}
          className="flex-1 max-w-40 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-500 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
        >
          <Check className="w-5 h-5" />
          认识
        </button>

        <button
          onClick={goNext}
          disabled={currentIndex === shuffledWords.length - 1}
          className="w-14 h-14 rounded-full glass flex items-center justify-center text-slate-600 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-400">
          <Sparkles className="inline w-4 h-4 mr-1" />
          小贴士：点击卡片查看释义，根据熟悉程度选择认识或不认识
        </p>
      </div>
    </div>
  );
}
