import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Loader2, MessageSquare } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { ChatMessage, LLMProvider } from '../types';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatbotModal: React.FC<ChatbotModalProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading }) => {
  const [inputMessage, setInputMessage] = useState('');
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col w-full max-w-xl mx-auto h-[90vh] relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatbot-modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="chatbot-modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-500" /> {t('chatbotTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            aria-label={t('cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
              <Bot className="h-12 w-12 mb-4" />
              <p>{t('chatbotEmptyState')}</p> {/* Add this translation */}
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                }`}
              >
                <p className="font-semibold text-xs mb-1">
                  {msg.role === 'user' ? t('you') : t('ai')}
                </p>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
                <div className="max-w-[75%] p-3 rounded-lg shadow-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span>AI is thinking...</span> {/* Add this translation */}
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder={t('chatInputPlaceholder')}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
            aria-label={t('sendMessage')}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotModal;