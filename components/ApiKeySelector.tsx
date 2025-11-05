import React, { useState, useEffect } from 'react';
import { KeyRound, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface ApiKeySelectorProps {
  onKeySubmit: (key: string) => void;
  aivideoautoApiKeyError: boolean; // Renamed
  isOpen: boolean;
  onClose: () => void;
  initialKey: string | null;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySubmit, aivideoautoApiKeyError, isOpen, onClose, initialKey }) => { // Renamed
  const [token, setToken] = useState(initialKey || '');
  const { t } = useTranslation();

  useEffect(() => {
    // Update internal token state if initialKey changes (e.g., when modal opens with a pre-filled key)
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
        aria-labelledby="api-key-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          aria-label={t('cancel')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
          <KeyRound className="h-8 w-8 text-blue-500 dark:text-blue-400" />
        </div>
        <h2 id="api-key-modal-title" className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isUpdateMode ? t('changeAivideoautoApiKey') : t('aivideoautoApiKeyRequiredTitle')}
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {isUpdateMode ? t('changeAivideoautoApiKeySubtitle') : t('aivideoautoApiKeyRequiredSubtitle')}
        </p>
        
        {aivideoautoApiKeyError && ( // Renamed
          <div className="mt-6 flex items-center justify-center gap-3 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">{t('invalidAivideoautoApiKeyError')}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="api-token" className="sr-only">API Token</label>
            <input
              id="api-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="block w-full px-4 py-3 rounded-md bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition text-center"
              placeholder={t('aivideoautoApiTokenPlaceholder')}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-transform transform hover:scale-105"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!token.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isUpdateMode ? t('updateApiKey') : t('saveAndContinue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeySelector;
