import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { TokenData } from '@/types';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface TokenChatProps {
    token: TokenData;
    isOpen: boolean;
    onClose: () => void;
    initialMessages?: Message[];
    onUpdateMessages?: (messages: Message[]) => void;
}

export const TokenChat: React.FC<TokenChatProps> = ({ token, isOpen, onClose, initialMessages = [], onUpdateMessages }) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        if (messages.length > 0) {
            onUpdateMessages?.(messages);
        }
    }, [messages, onUpdateMessages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Initial greeting
            const greeting: Message = {
                role: 'assistant',
                content: `Hello! I've analyzed **${token.name} ($${token.symbol})**. \n\nI have access to its security checks, holder distribution, and market metrics. What would you like to know?`
            };
            setMessages([greeting]);
            // We don't call onUpdateMessages here immediately to avoid unnecessary updates, it will trigger via the other effect
            setTimeout(() => inputRef.current?.focus(), 100);
        } else if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, token]); // Removed messages dependency to avoid loop, logic relies on mount state mostly

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: userMessage }],
                    tokenContext: token
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();

            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error connecting to the neural network. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-[350px] md:w-[400px] h-[500px] bg-[#0a0a0c] border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-900/40 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="p-4 border-b border-purple-500/20 bg-purple-900/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center border border-white/10">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white leading-tight">Neural Analyst</h3>
                        <div className="text-[10px] text-purple-300 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active: {token.symbol}
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0a0a0c]">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-neutral-700' : 'bg-purple-600/20 text-purple-400'}`}>
                            {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`rounded-2xl p-3 text-sm max-w-[85%] ${msg.role === 'user'
                            ? 'bg-neutral-800 text-white rounded-tr-sm'
                            : 'bg-purple-900/10 border border-purple-500/10 text-neutral-200 rounded-tl-sm'
                            }`}>
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {msg.content.split('**').map((part, i) =>
                                    i % 2 === 1 ? <strong key={i} className="text-purple-300 font-bold">{part}</strong> : part
                                )}
                            </div>

                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="bg-purple-900/5 border border-purple-500/5 rounded-2xl rounded-tl-sm p-3">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-purple-500/20 bg-purple-900/5">
                <div className="relative flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Ask about ${token.symbol}...`}
                        className="w-full bg-[#121215] border border-purple-500/20 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <div className="text-[9px] text-center mt-2 text-neutral-600 font-mono">
                    AI Analysis based on live metrics • <a href={`https://dexscreener.com/solana/${token.mint}`} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 underline decoration-dotted">View Chart</a>
                </div>
            </form>
        </div>
    );
};
