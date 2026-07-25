'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, CustomerProfile } from '@/types/chat';
import ReactMarkdown from 'react-markdown';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Inline SVG Icons (No external dependencies needed)
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const IconBot = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);

const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSend = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

export default function Home() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile drawer
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Start conversation on mount
  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setConversationId(data.conversation_id);
      setMessages([{ role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setMessages([{ role: 'assistant', content: 'Connection error. Please refresh the page.' }]);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !conversationId) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      setProfile(data.current_profile);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Calculate profile completion percentage
  const profileFields = profile ? Object.values(profile).filter(v => v !== null).length : 0;
  const totalFields = Object.keys(profile || {}).length || 13; // Fallback to 13 based on your interface
  const completionPercentage = Math.round((profileFields / totalFields) * 100);

  // Helper to format profile values
  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'Pending';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Profile Progress */}
      <aside className={`
        fixed md:relative z-40 md:z-auto
        w-80 h-full
        bg-white border-r border-slate-200 
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Customer Profile</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-slate-800">
            <IconClose />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
              <span>Profile Completion</span>
              <span className="text-indigo-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4">
            {profile && Object.entries(profile).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold capitalize mb-1">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className={`text-sm font-medium px-2 py-1 rounded-md inline-block w-fit
                  ${value ? 'bg-slate-100 text-slate-800' : 'bg-amber-50 text-amber-600 border border-amber-200'}
                `}>
                  {formatValue(value)}
                </span>
              </div>
            ))}
            
            {!profile && (
              <p className="text-sm text-slate-400 text-center mt-10">
                Profile data will appear here as you chat.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white relative">
        
        {/* Header */}
        <header className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 md:px-6 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-600 hover:text-slate-900">
              <IconMenu />
            </button>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <IconBot />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-slate-800 leading-none">AI Funding Consultant</h1>
              <span className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Online
              </span>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-slate-50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <IconBot />
                </div>
              )}
              
              <div
                className={`max-w-[75%] md:max-w-[60%] px-4 py-3 shadow-sm border ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md border-indigo-600'
                    : 'bg-white text-slate-800 rounded-2xl rounded-bl-md border-slate-100'
                }`}
              >
                                {/* Use ReactMarkdown for assistant messages, plain text for user messages */}
                {msg.role === 'assistant' ? (
                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown
                      components={{
                        // Style paragraphs
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        // Style unordered lists (bullet points)
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                        // Style ordered lists (numbers)
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                        // Style list items
                        li: ({ node, ...props }) => <li className="text-slate-700" {...props} />,
                        // Style bold text
                        strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                        // Style links
                        a: ({ node, ...props }) => <a className="text-indigo-600 underline hover:text-indigo-800" target="_blank" rel="noopener noreferrer" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 shadow-sm shrink-0">
                  <IconUser />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-end gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <IconBot />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200 px-4 py-4 md:px-6">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-end gap-2">
            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                rows={1}
                className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 shrink-0 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              aria-label="Send message"
            >
              <IconSend />
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center mt-2 hidden md:block">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500">Shift + Enter</kbd> for new line
          </p>
        </div>
      </main>
    </div>
  );
}