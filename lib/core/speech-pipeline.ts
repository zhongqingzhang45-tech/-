export type TTSProvider = "browser" | "edge" | "openai" | "glm";
export type ASRProvider = "browser" | "openai" | "glm";

export interface TTSOptions {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  speed?: number;
  emotion?: "happy" | "sad" | "angry" | "affectionate" | "neutral" | "shy" | "sleepy" | "thoughtful";
  isSinging?: boolean;
}

export interface ASROptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface SpeechPipelineConfig {
  ttsProvider: TTSProvider;
  asrProvider: ASRProvider;
  ttsVoice?: string;
  ttsRate?: number;
  ttsPitch?: number;
  asrLang?: string;
  characterGender?: "male" | "female";
}

export type SpeechEvent =
  | { type: "tts_start"; text: string }
  | { type: "tts_end"; text: string }
  | { type: "asr_start" }
  | { type: "asr_end"; text: string }
  | { type: "asr_partial"; text: string }
  | { type: "error"; error: string };

export class SpeechPipeline {
  private config: SpeechPipelineConfig;
  private synthesis: SpeechSynthesis | null = null;
  private recognition: any = null;
  private listeners: ((event: SpeechEvent) => void) = () => {};
  private isSpeaking: boolean = false;
  private isListening: boolean = false;
  private utteranceQueue: string[] = [];
  private isProcessing: boolean = false;

  constructor(config?: Partial<SpeechPipelineConfig>) {
    this.config = {
      ttsProvider: "browser",
      asrProvider: "browser",
      ...config,
    };

    if (typeof window !== "undefined") {
      this.synthesis = window.speechSynthesis ?? null;
      this.initASR();
    }
  }

  private initASR(): void {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.config.asrLang ?? "zh-CN";

      this.recognition.onstart = () => {
        this.isListening = true;
        this.emit({ type: "asr_start" });
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.onerror = (event: any) => {
        this.emit({ type: "error", error: event.error });
      };

      this.recognition.onresult = (event: any) => {
        let finalText = "";
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (interimText) {
          this.emit({ type: "asr_partial", text: interimText });
        }

        if (finalText) {
          this.emit({ type: "asr_end", text: finalText });
          this.stopListening();
        }
      };
    }
  }

  speak(text: string, options?: Partial<TTSOptions>): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synthesis) {
        console.warn("Speech synthesis not available");
        resolve();
        return;
      }

      this.utteranceQueue.push(text);
      this.processQueue(options).then(resolve).catch(() => resolve());
    });
  }

  private async processQueue(options?: Partial<TTSOptions>): Promise<void> {
    if (this.isProcessing) return;

    while (this.utteranceQueue.length > 0) {
      this.isProcessing = true;
      const text = this.utteranceQueue.shift()!;

      try {
        await this.speakSingle(text, options);
      } catch (err) {
        console.error("TTS error:", err);
      }
    }

    this.isProcessing = false;
  }

  private speakSingle(text: string, options?: Partial<TTSOptions>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error("Speech synthesis not available"));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.config.asrLang ?? "zh-CN";
      utterance.volume = 1;

      const emotion = options?.emotion ?? "neutral";
      const isSinging = options?.isSinging ?? false;
      const { rate, pitch } = this.getVoiceParams(emotion, isSinging);
      
      utterance.rate = options?.rate ?? rate;
      utterance.pitch = options?.pitch ?? pitch;

      const voices = this.synthesis.getVoices();
      
      if (options?.voice) {
        const voice = voices.find((v) => v.name === options.voice);
        if (voice) utterance.voice = voice;
      } else if (this.config.ttsVoice) {
        const voice = voices.find((v) => v.name === this.config.ttsVoice);
        if (voice) utterance.voice = voice;
      } else {
        const bestVoice = this.config.characterGender === "male"
          ? this.findBestChineseMaleVoice(voices)
          : this.findBestChineseFemaleVoice(voices);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.emit({ type: "tts_start", text });
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.emit({ type: "tts_end", text });
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        console.warn("TTS utterance error:", event);
        resolve();
      };

      try {
        this.synthesis.speak(utterance);
      } catch (err) {
        console.warn("TTS speak error:", err);
        resolve();
      }
    });
  }

  private getVoiceParams(emotion: string, isSinging: boolean): { rate: number; pitch: number } {
    if (isSinging) {
      return { rate: 0.85, pitch: 1.25 };
    }

    switch (emotion) {
      case "happy":
        return { rate: 1.0, pitch: 1.15 };
      case "sad":
        return { rate: 0.85, pitch: 0.9 };
      case "angry":
        return { rate: 1.1, pitch: 0.95 };
      case "affectionate":
        return { rate: 0.9, pitch: 1.1 };
      case "shy":
        return { rate: 0.85, pitch: 1.05 };
      case "sleepy":
        return { rate: 0.75, pitch: 0.9 };
      case "thoughtful":
        return { rate: 0.9, pitch: 1.0 };
      default:
        return { rate: this.config.ttsRate ?? 0.95, pitch: this.config.ttsPitch ?? 1.05 };
    }
  }

  private findBestChineseFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const chineseVoices = voices.filter(v => v.lang.includes('zh') || v.lang.includes('cmn') || v.lang.includes('CN'));
    if (chineseVoices.length === 0) return null;

    const femaleKeywords = ['female', 'woman', 'girl', 'lady', '女', '小雅', '晓晓', '小美', '小燕', 'Tingting', 'Mei-Jia', 'Sin-ji', 'Yaoyao', 'xiaoxiao', 'xiaoyan', 'xiaomei'];
    
    for (const keyword of femaleKeywords) {
      const voice = chineseVoices.find(v => 
        v.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (voice) return voice;
    }

    const defaultVoice = chineseVoices.find(v => v.default);
    if (defaultVoice) return defaultVoice;

    return chineseVoices[0] || null;
  }

  private findBestChineseMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const chineseVoices = voices.filter(v => v.lang.includes('zh') || v.lang.includes('cmn') || v.lang.includes('CN'));
    if (chineseVoices.length === 0) return null;

    const maleKeywords = ['male', 'man', 'boy', '男', '云希', '云扬', '小云', '小强', 'Kangkang', 'Yunxi', 'Yunyang'];
    
    for (const keyword of maleKeywords) {
      const voice = chineseVoices.find(v => 
        v.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (voice) return voice;
    }

    const defaultVoice = chineseVoices.find(v => v.default);
    if (defaultVoice) return defaultVoice;

    return chineseVoices[0] || null;
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.utteranceQueue = [];
      this.isProcessing = false;
      this.isSpeaking = false;
    }
  }

  startListening(options?: Partial<ASROptions>): void {
    if (!this.recognition) {
      this.emit({ type: "error", error: "Speech recognition not available" });
      return;
    }

    if (this.isListening) return;

    try {
      if (options?.lang) {
        this.recognition.lang = options.lang;
      }
      this.recognition.start();
    } catch (err) {
      console.error("ASR start error:", err);
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  isListeningNow(): boolean {
    return this.isListening;
  }

  on(event: (event: SpeechEvent) => void): void {
    this.listeners = event;
  }

  private emit(event: SpeechEvent): void {
    if (this.listeners) {
      this.listeners(event);
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  setConfig(config: Partial<SpeechPipelineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SpeechPipelineConfig {
    return { ...this.config };
  }

  destroy(): void {
    this.stopSpeaking();
    this.stopListening();
    this.listeners = () => {};
  }
}

export function createSpeechPipeline(config?: Partial<SpeechPipelineConfig>) {
  return new SpeechPipeline(config);
}
