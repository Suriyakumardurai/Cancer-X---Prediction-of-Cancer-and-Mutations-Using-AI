import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-stone-800">$1</strong>')
      .replace(/\* (.*?)(?=\n\*|\n\n|$)/g, '<li class="flex items-start"><span class="mr-2 mt-1 text-teal-500">&#8226;</span><span>$1</span></li>')
      .replace(/(\n|^)#{1,6}\s(.*)/g, (match, p1, p2) => `${p1}<h4 class="text-md font-bold mt-2 mb-1 text-stone-800">${p2}</h4>`)
      .replace(/(<li.*<\/li>)+/g, (match) => `<ul class="space-y-1">${match}</ul>`)
      .replace(/\n/g, '<br />')
      .replace(/<br \/>(<ul|<h4)/g, '$1')
      .replace(/(<\/ul>)<br \/>/g, '$1');
  };

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
        <div className="flex flex-col flex-grow min-h-0 bg-stone-50/50">
            <div className="flex-grow p-4 overflow-y-auto light-scrollbar">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-stone-400 pt-8 px-4">
                            <p className="text-sm">Ask a question about the analysis to get started.</p>
                            <p className="text-xs mt-2">e.g., "Are there any discrepancies between the scan and the report?"</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] px-4 py-2.5 rounded-xl ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white text-stone-700 rounded-bl-none border border-stone-200'}`}>
                                <div className="prose prose-sm max-w-none text-inherit" dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}></div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="px-4 py-2.5 rounded-xl bg-white rounded-bl-none border border-stone-200">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-pulse delay-75"></span>
                                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-stone-200 bg-white flex-shrink-0">
                <div className="relative">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask the AI..."
                        disabled={isLoading}
                        rows={1}
                        className="w-full pl-4 pr-12 py-3 bg-stone-100 border border-stone-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-stone-200 resize-none text-sm text-stone-700 placeholder-stone-400"
                        style={{maxHeight: '120px'}}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-stone-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-100 focus:ring-teal-500 transition-colors"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};