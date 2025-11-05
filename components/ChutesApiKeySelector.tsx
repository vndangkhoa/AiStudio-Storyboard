import React, { useState, useEffect } from 'react';
import { KeyRound, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface ChutesApiKeySelectorProps {
  onKeySubmit: (key: string) => void;
  chutesApiKeyError: boolean;
  isOpen: boolean;
  onClose: () => void;
  initialKey: string | null;
}

const ChutesApiKeySelector: React.FC<ChutesApiKeySelectorProps> = ({ onKeySubmit, chutesApiKeyError, isOpen, onClose, initialKey }) => {
  const [token, setToken] = useState(initialKey || '');
  const { t } = useTranslation();

  useEffect(() => {
    setToken(initialKey || '');
  }, [initialKey]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onKeySubmit(token.trim());
    }
  };

  const isUpdateMode = !!initialKey;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center max-w-2xl mx-auto relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chutes-api-key-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          aria-label={t('cancel')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-6">
          <KeyRound className="h-8 w-8 text-green-500 dark:text-green-400" />
        </div>
        <h2 id="chutes-api-key-modal-title" className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isUpdateMode ? t('changeChutesApiKey') : t('chutesApiKeyRequiredTitle')}
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {isUpdateMode ? t('changeChutesApiKeySubtitle') : t('chutesApiKeyRequiredSubtitle')}
        </p>
        
        {chutesApiKeyError && (
          <div className="mt-6 flex items-center justify-center gap-3 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">{t('invalidChutesApiKeyError')}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="chutes-api-token" className="sr-only">Chutes.ai API Token</label>
            <input
              id="chutes-api-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="block w-full px-4 py-3 rounded-md bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-green-500 focus:border-green-500 transition text-center"
              placeholder={t('chutesApiTokenPlaceholder')}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-900 transition-transform transform hover:scale-105"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!token.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-900 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isUpdateMode ? t('updateApiKey') : t('saveAndContinue')}
            </button>
          </div>
          <a 
            href="https://chutes.ai" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center gap-2 text-green-600 dark:text-green-400 hover:underline text-sm font-medium mt-4"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{t('chutesApiKeyLink')}</span>
          </a>
        </form>
      </div>
    </div>
  );
};

export default ChutesApiKeySelector;
