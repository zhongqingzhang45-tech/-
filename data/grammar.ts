import { GrammarQuiz } from '@/types';

export const englishGrammarQuizzes: GrammarQuiz[] = [
  {
    id: 'eng-g-1',
    question: 'She ___ to school every day.',
    options: ['go', 'goes', 'going', 'went'],
    answer: 1,
    explanation: '主语是第三人称单数 "She"，一般现在时动词需要加 s/es，所以用 goes。',
  },
  {
    id: 'eng-g-2',
    question: 'I have lived in Beijing ___ 2010.',
    options: ['for', 'since', 'at', 'in'],
    answer: 1,
    explanation: 'since 用于表示时间的起点（具体年份/日期），for 用于表示一段时间。',
  },
  {
    id: 'eng-g-3',
    question: 'The book ___ by Mark Twain.',
    options: ['wrote', 'was written', 'is writing', 'writes'],
    answer: 1,
    explanation: '被动语态结构：be + 过去分词。书是"被写"的，所以用 was written。',
  },
  {
    id: 'eng-g-4',
    question: 'If I ___ rich, I would travel around the world.',
    options: ['am', 'was', 'were', 'be'],
    answer: 2,
    explanation: '虚拟语气中，if 引导的非真实条件句，be 动词一律用 were。',
  },
  {
    id: 'eng-g-5',
    question: 'This is the girl ___ father is a doctor.',
    options: ['who', 'whose', 'which', 'whom'],
    answer: 1,
    explanation: 'whose 表示"谁的"，用来引导定语从句并在从句中作定语。',
  },
  {
    id: 'eng-g-6',
    question: 'He suggested that we ___ early.',
    options: ['start', 'started', 'starting', 'to start'],
    answer: 0,
    explanation: 'suggest 后的宾语从句用虚拟语气，谓语用 should + 动词原形，should 可以省略。',
  },
];

export const japaneseGrammarQuizzes: GrammarQuiz[] = [
  {
    id: 'jp-g-1',
    question: '私は学生___。',
    options: ['です', 'ます', 'だ', 'でした'],
    answer: 0,
    explanation: '名词谓语句的礼貌体现在时用「です」。「私は学生です」意为"我是学生"。',
  },
  {
    id: 'jp-g-2',
    question: '昨日、映画を___。',
    options: ['見ます', '見ました', '見て', '見よう'],
    answer: 1,
    explanation: '「昨日」是过去时间标志，动词用过去式。「見ました」是「見ます」的过去式。',
  },
  {
    id: 'jp-g-3',
    question: 'これは___本ですか。',
    options: ['なん', 'なに', 'どれ', 'どの'],
    answer: 3,
    explanation: '「どの」后接名词，表示"哪个..."。「どの本」意为"哪本书"。',
  },
  {
    id: 'jp-g-4',
    question: '雨が降って___。',
    options: ['います', 'あります', 'します', 'なります'],
    answer: 0,
    explanation: '「ています」表示动作正在进行。「降っています」意为"正在下（雨）"。',
  },
  {
    id: 'jp-g-5',
    question: '私はコーヒー___好きです。',
    options: ['を', 'が', 'に', 'で'],
    answer: 1,
    explanation: '表示喜好的对象用助词「が」。「～が好きです」意为"喜欢..."。',
  },
];

export const koreanGrammarQuizzes: GrammarQuiz[] = [
  {
    id: 'kr-g-1',
    question: '저는 학생___.',
    options: ['입니다', '습니까', '이다', '였습니다'],
    answer: 0,
    explanation: '名词后面接「입니다」表示"是..."，是敬体现在时。「저는 학생입니다」意为"我是学生"。',
  },
  {
    id: 'kr-g-2',
    question: '어제 영화를___.',
    options: ['봅니다', '봤습니다', '보고', '볼 거예요'],
    answer: 1,
    explanation: '「어제」是过去时间标志，动词用过去式。「봤습니다」是「보다」的过去式敬体。',
  },
  {
    id: 'kr-g-3',
    question: '이것은___책입니까?',
    options: ['무엇', '어느', '누구', '어디'],
    answer: 1,
    explanation: '「어느」后接名词，表示"哪个..."。「어느 책」意为"哪本书"。',
  },
  {
    id: 'kr-g-4',
    question: '비가 오고___.',
    options: ['있습니다', '합니다', '됩니다', '아닙니다'],
    answer: 0,
    explanation: '「-고 있다」表示动作正在进行。「오고 있습니다」意为"正在下（雨）"。',
  },
  {
    id: 'kr-g-5',
    question: '저는 커피___좋아합니다.',
    options: ['을', '가', '를', '이'],
    answer: 2,
    explanation: '「좋아하다」是他动词，前面的宾语用「를/을」。「커피」是开音节，接「를」。',
  },
];

export const getGrammarQuizzesByLanguage = (language: string): GrammarQuiz[] => {
  switch (language) {
    case 'english':
      return englishGrammarQuizzes;
    case 'japanese':
      return japaneseGrammarQuizzes;
    case 'korean':
      return koreanGrammarQuizzes;
    default:
      return englishGrammarQuizzes;
  }
};
