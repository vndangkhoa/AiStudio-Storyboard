
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface LoadingIndicatorProps {
  messages: string[];
  currentMessage: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ messages, currentMessage }) => {
  const [displayedMessage, setDisplayedMessage] = useState(messages[0]);
  const { t } = useTranslation();

  useEffect(() => {
    let messageIndex = 0;
    const intervalId = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setDisplayedMessage(messages[messageIndex]);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [messages]);

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center min-h-[300px]">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-blue-500 border-l-blue-500 border-b-transparent border-r-transparent rounded-full animate-spin"></div>
      </div>
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{t('generatingVideoTitle')}</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2 transition-opacity duration-500">
        {currentMessage || displayedMessage}
      </p>
    </div>
  );
};

export default LoadingIndicator;
