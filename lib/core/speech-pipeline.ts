export type TTSProvider = "browser" | "edge" | "openai" | "glm";
export type ASRProvider = "browser" | "openai" | "glm";

export interface TTSOptions {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  speed?: number;
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
  asrLang?: string;
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
      this.processQueue().then(resolve).catch(() => resolve());
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    while (this.utteranceQueue.length > 0) {
      this.isProcessing = true;
      const text = this.utteranceQueue.shift()!;

      try {
        await this.speakSingle(text);
      } catch (err) {
        console.error("TTS error:", err);
      }
    }

    this.isProcessing = false;
  }

  private speakSingle(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error("Speech synthesis not available"));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.config.asrLang ?? "zh-CN";
      utterance.rate = this.config.ttsRate ?? 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      const voices = this.synthesis.getVoices();
      
      if (this.config.ttsVoice) {
        const voice = voices.find((v) => v.name === this.config.ttsVoice);
        if (voice) utterance.voice = voice;
      } else {
        const chineseFemaleVoice = this.findBestChineseFemaleVoice(voices);
        if (chineseFemaleVoice) {
          utterance.voice = chineseFemaleVoice;
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

  private findBestChineseFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const chineseVoices = voices.filter(v => v.lang.includes('zh') || v.lang.includes('cmn') || v.lang.includes('CN'));
    if (chineseVoices.length === 0) return null;

    const femaleKeywords = ['female', 'woman', 'girl', 'lady', '女', '小雅', '晓晓', '小美', '小燕', 'Tingting', 'Mei-Jia', 'Sin-ji', 'Yaoyao'];
    
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
