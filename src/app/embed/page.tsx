"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Message, CustomerProfile } from "@/types/chat";
import ReactMarkdown from "react-markdown";

// Icons
const IconSend = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
  </svg>
);

const IconWarning = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-10 h-10 mb-4"
  >
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function EmbedChat() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") || "demo";
  const primaryColor = searchParams.get("color") || "#4f46e5";
  const botName = searchParams.get("botName") || "AI Consultant";
  const botAvatar = searchParams.get("avatar") || "/default-bot.png";
  const welcomeMsg =
    searchParams.get("welcomeMsg") || "Hello! How can I help you today?";

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);
  
  // Pro & Limit State
  const [isPro, setIsPro] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = async () => {
    try {
      const res = await fetch(`/api/v1/chat/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-ID": clientId,
        },
      });

      if (res.status === 403) {
        setIsAuthorized(false);
        return;
      }

      const data = await res.json();
      setConversationId(data.conversation_id);
      
      // Capture Pro status and Message Limit
      setIsPro(data.is_pro);
      if (!data.is_pro && data.message_limit > 0) {
        setMessagesRemaining(data.message_limit);
      }

      // OVERRIDE: Use the custom welcome message passed from the script tag!
      setMessages([{ role: "assistant", content: welcomeMsg }]);
    } catch (error) {
      setMessages([{ role: "assistant", content: "Connection error." }]);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    // Stop if limit is reached
    if (!input.trim() || !conversationId || isLoading || limitReached) return;
    
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/v1/chat/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-ID": clientId,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      // Handle 402 Payment Required for Free Users
      if (res.status === 402) {
        setLimitReached(true);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "🚀 You have reached your free message limit! Please upgrade to our **Pro Plan** to continue chatting with the AI Consultant." },
        ]);
        return;
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      setProfile(data.current_profile);

      // Decrement remaining messages for free users
      if (!isPro && messagesRemaining !== null) {
        setMessagesRemaining((prev) => (prev !== null ? prev - 1 : null));
      }

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error. Try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Error State UI
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-slate-50 p-6 text-center">
        <div className="text-red-500">
          <IconWarning />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-sm text-red-500 font-medium">
          Domain not authorized. Please check your SaaS subscription.
        </p>
      </div>
    );
  }

  // Main Chat UI
  return (
    <div className="flex flex-col h-[100dvh] bg-slate-100 overflow-hidden font-sans antialiased">
      
      {/* Header */}
      <header 
        className="relative flex items-center gap-3 px-4 py-3 text-white shadow-md shrink-0 z-10"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Premium subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        
        <div className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30 overflow-hidden">
          <img 
            src={botAvatar} 
            alt={`${botName} avatar`} 
            className="w-full h-full object-cover" 
          />
        </div>
        
        <div className="relative flex-1">
          <h1 className="text-sm font-semibold leading-tight">{botName}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[11px] opacity-90 leading-tight text-white/90">Online</span>
          </div>
        </div>

        {/* Show remaining messages badge for Free Users */}
        {!isPro && messagesRemaining !== null && !limitReached && (
          <div className="relative bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
            {messagesRemaining} left
          </div>
        )}
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 scroll-smooth">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 shadow-sm border ${
                msg.role === "user"
                  ? "text-white rounded-2xl rounded-br-sm border-transparent"
                  : "bg-white text-slate-800 rounded-2xl rounded-bl-sm border-slate-100"
              }`}
              style={
                msg.role === "user"
                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                  : {}
              }
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-slate-800 prose-headings:text-slate-800">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-3 shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={limitReached ? "Upgrade to continue..." : "Type a message..."}
            className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
            disabled={isLoading || limitReached}
            aria-label="Message input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || limitReached}
            className="w-10 h-10 shrink-0 flex items-center justify-center text-white rounded-full transition-colors duration-200 disabled:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: !input.trim() || isLoading || limitReached ? undefined : primaryColor 
            }}
            aria-label="Send message"
          >
            <IconSend />
          </button>
        </form>
      </div>

      {/* PRO FEATURE: Hide Footer if they are Pro OR if they hit the limit */}
      {!isPro && !limitReached && (
        <div className="bg-slate-50 text-center py-2 border-t border-slate-200 shrink-0">
          <p className="text-xs text-slate-500">
            Powered by{" "}
            <a 
              href="https://your-saas-domain.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-bold text-indigo-600 hover:underline"
            >
              FundingAI
            </a>
          </p>
        </div>
      )}
    </div>
  );
}