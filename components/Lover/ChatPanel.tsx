"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, MoodType, LOVER_RESPONSES, MOOD_CONFIG } from "@/data/lover";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  currentMood: MoodType;
}

export function ChatPanel({ messages, onSendMessage, isTyping, currentMood }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickReplies = [
    { text: "想你了", icon: "💕" },
    { text: "今天好累", icon: "😮‍💨" },
    { text: "你在干嘛", icon: "🤔" },
    { text: "我爱你", icon: "❤️" },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scroll-mask-top p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}
              animate-fade-in`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {msg.sender === "lover" && (
              <div className="w-8 h-8 rounded-full mr-2 flex-shrink-0
                bg-gradient-to-br from-pink-400/20 to-violet-400/20
                border border-white/10 flex items-center justify-center text-sm">
                {MOOD_CONFIG[msg.mood].emoji}
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl
                ${msg.sender === "user"
                  ? "bg-gradient-to-br from-violet-500/80 to-pink-500/80 text-white rounded-br-md"
                  : "bg-white/5 backdrop-blur-sm border border-white/10 text-white/90 rounded-bl-md"
                }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p
                className={`text-[10px] mt-1
                  ${msg.sender === "user" ? "text-white/50 text-right" : "text-white/40"}`}
              >
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full mr-2 flex-shrink-0
              bg-gradient-to-br from-pink-400/20 to-violet-400/20
              border border-white/10 flex items-center justify-center text-sm">
              {MOOD_CONFIG[currentMood].emoji}
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10
              px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {quickReplies.map((reply) => (
            <button
              key={reply.text}
              onClick={() => onSendMessage(reply.text)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs
                bg-white/5 border border-white/10 text-white/70
                hover:bg-white/10 hover:border-pink-400/30 hover:text-white
                transition-all duration-200"
            >
              {reply.icon} {reply.text}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <button className="w-10 h-10 rounded-full flex-shrink-0
            bg-white/5 border border-white/10
            hover:bg-white/10 hover:border-pink-400/30
            transition-all duration-200 flex items-center justify-center">
            <span className="text-lg">🎤</span>
          </button>

          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="跟我说点什么吧..."
              rows={1}
              className="w-full px-4 py-2.5 rounded-2xl resize-none
                bg-white/5 border border-white/10
                text-white placeholder-white/30 text-sm
                focus:outline-none focus:border-pink-400/40 focus:bg-white/[0.07]
                transition-all duration-200"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full flex-shrink-0
              bg-gradient-to-br from-pink-500 to-violet-500
              hover:from-pink-400 hover:to-violet-400
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center justify-center
              shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40"
          >
            <span className="text-sm">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
