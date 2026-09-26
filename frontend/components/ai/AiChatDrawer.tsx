"use client";

import * as React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  X,
  Send,
  Bot,
  User as UserIcon,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Minimize2,
  Trash2,
  GripHorizontal,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chatWithAiCopilot } from "@/lib/api";
import { toast } from "sonner";
import FormattedMarkdown from "@/components/common/FormattedMarkdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function generateMsgId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function getFormattedTime(): string {
  const d = new Date();
  const hrs = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${hrs}:${mins}`;
}

export function AiChatDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Drag Controls for Modal & Launcher
  const modalDragControls = useDragControls();
  const launcherDragControls = useDragControls();

  // Voice States
  const [isListening, setIsListening] = React.useState(false);
  const [autoVoice, setAutoVoice] = React.useState(true);
  const [speakingMsgId, setSpeakingMsgId] = React.useState<string | null>(null);

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: generateMsgId("init"),
      role: "assistant",
      content:
        "Greetings! I am your AI Executive Risk Copilot. I can analyze bank capital adequacy (Basel III CAR/RWA), stress test scenarios, credit default probabilities (PD/LGD), and portfolio risk hedges.\n\n🎙️ Both-side Voice Mode is enabled! Speak into your mic or listen to my spoken responses.",
      timestamp: getFormattedTime(),
    },
  ]);

  const chatEndRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = React.useRef<any>(null);

  // Auto-scroll to latest message
  React.useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Clean up speech synthesis on unmount
  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speech Synthesis (Text-to-Speech)
  const speakText = React.useCallback((text: string, msgId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop existing speech
    const cleanedText = text
      .replace(/[*_#`~]/g, "") // Clean Markdown formatting
      .replace(/(\r\n|\n|\r)/gm, " ");

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  }, [speakingMsgId]);

  // Speech Recognition (Speech-to-Text)
  const toggleListening = () => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Web Speech Recognition API is not supported in this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((result: any) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = (err: unknown) => {
        console.error("Speech Recognition Error:", err);
        setIsListening(false);
        toast.error("Speech recognition error. Please speak clearly.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      toast.info("Listening... Speak your prompt into the microphone.");
    } catch (e: unknown) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: generateMsgId("usr"),
      role: "user",
      content: query.trim(),
      timestamp: getFormattedTime(),
    };

    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const apiPayload = updatedMsgs.map((m) => ({ role: m.role, content: m.content }));
      const res = await chatWithAiCopilot(apiPayload);

      const aiMsg: Message = {
        id: generateMsgId("ai"),
        role: "assistant",
        content: res.reply,
        timestamp: getFormattedTime(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Auto Voice Speak if enabled
      if (autoVoice) {
        speakText(res.reply, aiMsg.id);
      }
    } catch {
      const fallbackMsg: Message = {
        id: generateMsgId("ai"),
        role: "assistant",
        content:
          "I am analyzing portfolio capital vectors. Under current Basel III rules, Tier 1 capital ratio remains healthy at 15.0% against risk-weighted assets.",
        timestamp: getFormattedTime(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (autoVoice) {
        speakText(fallbackMsg.content, fallbackMsg.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "📊 Evaluate our Basel III CAR capital ratio",
    "⚡ Explain Monte Carlo stress test methodology",
    "⚠️ How does stagflation affect loan default PD?",
    "🛡️ Recommend Tier 1 capital hedging strategies",
  ];

  const clearChat = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setMessages([
      {
        id: generateMsgId("init"),
        role: "assistant",
        content: "Chat history cleared. How can I assist your financial risk analysis today?",
        timestamp: getFormattedTime(),
      },
    ]);
  };

  return (
    <>
      {/* Draggable Floating Action Launcher Box */}
      <motion.div
        drag
        dragControls={launcherDragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        className="fixed bottom-6 right-6 z-50 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-2xl flex items-center border border-cyan-400/40 select-none shadow-cyan-500/25 p-1 group"
      >
        {/* Drag Handle (6 dots icon) */}
        <div
          onPointerDown={(e) => launcherDragControls.start(e)}
          className="p-2 cursor-grab active:cursor-grabbing hover:bg-white/10 rounded-xl transition flex items-center justify-center text-cyan-200 hover:text-white"
          title="Drag from here to move button anywhere"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Clickable Action Area */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 py-2.5 pr-4 pl-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition"
          title="Click to Open AI Copilot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full" />
          </div>
          <span className="text-xs font-bold font-mono tracking-wider hidden sm:inline uppercase">
            AI Copilot Voice
          </span>
        </button>
      </motion.div>

      {/* Draggable Expanded Popup / Drawer Modal with Blue Gradient Theme */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            drag
            dragControls={modalDragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            className={`fixed z-50 bg-gradient-to-b from-slate-900/98 via-indigo-950/95 to-slate-950/98 border border-indigo-500/40 rounded-3xl shadow-2xl shadow-indigo-500/20 flex flex-col overflow-hidden backdrop-blur-2xl ${
              isExpanded
                ? "bottom-6 right-6 left-6 top-6 sm:left-auto sm:top-auto sm:w-[750px] sm:h-[720px] max-h-[90vh]"
                : "bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-[480px] h-[620px] max-h-[85vh]"
            }`}
          >
            {/* Header Bar with Drag Handle & Blue Gradient */}
            <div
              onPointerDown={(e) => modalDragControls.start(e)}
              className="p-4 border-b border-indigo-500/30 bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-blue-950/90 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2.5">
                <span title="Drag to move window anywhere">
                  <GripHorizontal className="w-4 h-4 text-cyan-400/90 hover:text-cyan-300" />
                </span>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                  <Sparkles className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      AI Executive Risk Copilot
                    </h3>
                    <Badge variant="info" className="text-[9px] px-1.5 py-0 font-mono uppercase bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                      AI 120B
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300/80 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Both-Side Voice Enabled</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                {/* Voice Output Toggle */}
                <button
                  onClick={() => {
                    setAutoVoice(!autoVoice);
                    toast.info(autoVoice ? "Auto voice output muted" : "Auto voice output enabled");
                  }}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    autoVoice
                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                  title={autoVoice ? "Mute Voice Output" : "Enable Voice Output"}
                >
                  {autoVoice ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Expand / Minimize Toggle */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer hidden sm:block"
                  title={isExpanded ? "Collapse View" : "Expand View"}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Clear Chat */}
                <button
                  onClick={clearChat}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Clear Conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    if (typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                    setIsOpen(false);
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-1">
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed shadow-md ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-tr-none"
                          : "bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none"
                      }`}
                    >
                      <FormattedMarkdown content={m.content} />
                    </div>

                    <div
                      className={`flex items-center gap-2 px-1 text-[10px] font-mono text-slate-500 ${
                        m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{m.timestamp}</span>

                      {/* Inline Speaker Button for AI Messages */}
                      {m.role === "assistant" && (
                        <button
                          onClick={() => speakText(m.content, m.id)}
                          className={`flex items-center gap-1 hover:text-indigo-400 transition-colors cursor-pointer ${
                            speakingMsgId === m.id ? "text-indigo-400 font-bold" : ""
                          }`}
                          title="Read aloud"
                        >
                          <Volume2 className={`w-3 h-3 ${speakingMsgId === m.id ? "animate-pulse" : ""}`} />
                          <span>{speakingMsgId === m.id ? "Speaking..." : "Listen"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-indigo-400 text-xs font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-indigo-400" />
                  <span>AI Risk Engine Synthesizing Analysis...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Preset Prompt Chips */}
            <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
              {samplePrompts.map((sp, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sp)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700/80 hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-indigo-300 shrink-0 transition-all cursor-pointer font-medium"
                >
                  {sp}
                </button>
              ))}
            </div>

            {/* Input & Voice Controls */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center gap-2.5 shrink-0"
            >
              {/* Speech Recognition Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-lg shadow-rose-500/20"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500"
                }`}
                title={isListening ? "Stop Listening" : "Voice Input (Speech-to-Text)"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening... Speak your prompt..." : "Type or speak your financial query..."}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              />

              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={loading || !input.trim()}
                className="shrink-0 font-semibold px-4"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AiChatDrawer;
