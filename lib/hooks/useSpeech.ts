import { useState, useEffect, useRef, useCallback } from "react";
import { SpeechPipeline, SpeechEvent, createSpeechPipeline } from "@/lib/core";

export function useSpeech() {
  const [pipeline, setPipeline] = useState<SpeechPipeline | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const pipelineRef = useRef<SpeechPipeline | null>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const p = createSpeechPipeline({
      ttsProvider: "browser",
      asrProvider: "browser",
      asrLang: "zh-CN",
    });

    pipelineRef.current = p;
    setPipeline(p);

    p.on((event: SpeechEvent) => {
      switch (event.type) {
        case "tts_start":
          setIsSpeaking(true);
          break;
        case "tts_end":
          setIsSpeaking(false);
          break;
        case "asr_start":
          setIsListening(true);
          break;
        case "asr_end":
          setIsListening(false);
          setTranscript(event.text);
          break;
        case "asr_partial":
          setPartialTranscript(event.text);
          break;
        case "error":
          console.error("Speech error:", event.error);
          break;
      }
    });

    if (window.speechSynthesis) {
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    const speechSupported =
      "speechSynthesis" in window ||
      "SpeechRecognition" in window ||
      "webkitSpeechRecognition" in window;
    setEnabled(speechSupported);

    return () => {
      p.destroy();
    };
  }, []);

  /**
   * 用户首次交互时调用，初始化语音引擎以满足浏览器自动播放策略。
   * 在用户点击发送按钮、语音按钮等交互行为时触发。
   */
  const handleFirstInteraction = useCallback(() => {
    if (hasInteractedRef.current) return;
    hasInteractedRef.current = true;
    setHasInteracted(true);

    // 通过空语句初始化 speechSynthesis，解除浏览器自动播放限制
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        const dummy = new SpeechSynthesisUtterance("");
        dummy.volume = 0;
        window.speechSynthesis.speak(dummy);
        window.speechSynthesis.cancel();
      } catch (e) {
        // 忽略初始化错误
      }
    }
  }, []);

  const speak = useCallback(
    async (text: string, options?: any) => {
      if (!pipelineRef.current) return;
      // 浏览器自动播放策略：未交互前不播放 TTS
      if (!hasInteractedRef.current) {
        console.warn("[Speech] Skipping TTS: waiting for user interaction");
        return;
      }
      try {
        await pipelineRef.current.speak(text, options);
      } catch (err) {
        console.error("Speak error:", err);
      }
    },
    []
  );

  const stopSpeaking = useCallback(() => {
    pipelineRef.current?.stopSpeaking();
  }, []);

  const startListening = useCallback((options?: any) => {
    // 语音识别也需要用户交互
    handleFirstInteraction();
    setTranscript("");
    setPartialTranscript("");
    pipelineRef.current?.startListening(options);
  }, [handleFirstInteraction]);

  const stopListening = useCallback(() => {
    pipelineRef.current?.stopListening();
  }, []);

  return {
    enabled,
    isSpeaking,
    isListening,
    transcript,
    partialTranscript,
    voices,
    hasInteracted,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    handleFirstInteraction,
  };
}
