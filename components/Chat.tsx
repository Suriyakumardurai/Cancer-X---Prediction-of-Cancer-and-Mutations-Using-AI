
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { renderMarkdown } from '../utils/markdownUtils';

interface ChatProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col flex-grow min-h-0 bg-white">
            <div className="flex-grow p-4 overflow-y-auto light-scrollbar">
                <div className="space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-400 pt-12 px-4">
                            <p className="text-base">Ask a question about the analysis to get started.</p>
                            <p className="text-sm mt-2">e.g., "Are there any discrepancies between the scan and the report?"</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] px-5 py-3.5 rounded-3xl ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-xl' : 'bg-slate-100 text-[var(--text-color)] rounded-bl-xl border border-slate-200'}`}>
                                <div className="prose-custom prose-sm max-w-none text-inherit" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}></div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="px-4 py-3 rounded-3xl bg-slate-100 rounded-bl-xl border border-slate-200">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse delay-75"></span>
                                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
                <div className="relative flex items-center">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask the AI..."
                        disabled={isLoading}
                        rows={1}
                        className="w-full pl-5 pr-14 py-3 bg-slate-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-200 resize-none text-base text-[var(--text-color)] placeholder:text-[var(--text-muted-color)] transition-shadow"
                        style={{maxHeight: '120px'}}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-teal-500 transition-colors"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};