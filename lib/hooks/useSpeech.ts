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
  const pipelineRef = useRef<SpeechPipeline | null>(null);

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

  const speak = useCallback(
    async (text: string, options?: any) => {
      if (!pipelineRef.current) return;
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
    setTranscript("");
    setPartialTranscript("");
    pipelineRef.current?.startListening(options);
  }, []);

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
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
