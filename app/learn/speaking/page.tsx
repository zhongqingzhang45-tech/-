'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Mic,
  MicOff,
  RotateCcw,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import { getWordsByLanguage } from '@/data/vocabulary';
import { useLearningStore } from '@/store/useLearningStore';
import { shuffleArray } from '@/utils/helpers';

export default function SpeakingPage() {
  const { currentLanguage, addStudyTime, incrementSpeakingPractices } = useLearningStore();
  const words = getWordsByLanguage(currentLanguage);
  const [shuffledWords, setShuffledWords] = useState(words);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [practiceCount, setPracticeCount] = useState(0);
  const recordingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    setShuffledWords(shuffleArray(words));
    setCurrentIndex(0);
    setScore(null);
    setPracticeCount(0);
  }, [currentLanguage]);

  const currentWord = shuffledWords[currentIndex];
  const progress = ((currentIndex + 1) / shuffledWords.length) * 100;

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 1500);
  };

  const handleRecord = () => {
    if (isRecording) {
      if (recordingRef.current) {
        clearInterval(recordingRef.current);
      }
      setIsRecording(false);
      const newScore = Math.floor(Math.random() * 30) + 70;
      setScore(newScore);
      setPracticeCount((prev) => prev + 1);
      incrementSpeakingPractices();
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      setScore(null);
      recordingRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 0.1);
      }, 100);
    }
  };

  const stopRecording = () => {
    if (recordingRef.current) {
      clearInterval(recordingRef.current);
    }
    setIsRecording(false);
    const newScore = Math.floor(Math.random() * 30) + 70;
    setScore(newScore);
    setPracticeCount((prev) => prev + 1);
    incrementSpeakingPractices();
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setScore(null);
      setRecordingTime(0);
    }
  };

  const goNext = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setScore(null);
      setRecordingTime(0);
    } else {
      const minutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      addStudyTime(minutes, 'speaking');
    }
  };

  const handleRestart = () => {
    setShuffledWords(shuffleArray(words));
    setCurrentIndex(0);
    setScore(null);
    setRecordingTime(0);
    setPracticeCount(0);
  };

  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-emerald-500';
    if (s >= 75) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return '优秀';
    if (s >= 75) return '良好';
    return '继续努力';
  };

  if (!currentWord) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">
            第 {currentIndex + 1} / {shuffledWords.length} 句
          </span>
          <span className="text-sm font-medium text-indigo-600">
            已练习：{practiceCount} 次
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="glass rounded-3xl p-10 shadow-xl mb-6">
        <div className="text-center mb-8">
          <p className="text-sm text-slate-400 mb-3">跟我读</p>
          <h2 className="font-display text-5xl font-bold text-slate-900 mb-3">
            {currentWord.word}
          </h2>
          <p className="text-xl text-slate-500 mb-2">{currentWord.phonetic}</p>
          <p className="text-lg text-indigo-600 font-medium">{currentWord.meaning}</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <p className="text-slate-600 italic text-center mb-2">
            "{currentWord.example}"
          </p>
          <p className="text-sm text-slate-400 text-center">
            {currentWord.exampleTranslation}
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={handlePlay}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-indigo-600 text-white scale-110 shadow-lg'
                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
            }`}
          >
            {isPlaying ? (
              <Volume2 className="w-7 h-7 animate-pulse" />
            ) : (
              <Play className="w-7 h-7 ml-1" />
            )}
          </button>

          <button
            onClick={isRecording ? stopRecording : handleRecord}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-xl scale-105'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105 shadow-lg'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>

          <button
            onClick={handleRestart}
            className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-all"
          >
            <RotateCcw className="w-7 h-7" />
          </button>
        </div>

        {isRecording && (
          <div className="text-center mb-6">
            <div className="text-3xl font-mono font-bold text-rose-500 mb-2">
              {recordingTime.toFixed(1)}s
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className="text-sm text-rose-500">正在录音，点击停止</span>
            </div>
          </div>
        )}

        {score !== null && !isRecording && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 animate-fade-in-up">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-2">发音评分</p>
              <div className={`text-5xl font-bold mb-2 ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className="flex items-center justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(score / 20)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-sm font-medium ${getScoreColor(score)}`}>
                {getScoreLabel(score)}
              </p>
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

        <p className="text-sm text-slate-400">
          先听示范发音，然后点击麦克风跟读
        </p>

        <button
          onClick={goNext}
          disabled={currentIndex === shuffledWords.length - 1}
          className="w-14 h-14 rounded-full glass flex items-center justify-center text-slate-600 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
