import React from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface GeminiKeyRequiredModalProps {
  isOpen: boolean;
  onSelectKey: () => void;
  onClose: () => void; // Added for handling close when key is already selected
}

const GeminiKeyRequiredModal: React.FC<GeminiKeyRequiredModalProps> = ({ isOpen, onSelectKey, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSelectKeyClick = async () => {
    await onSelectKey();
    // Assuming onSelectKey (which calls window.aistudio.openSelectKey) will eventually lead to key selection.
    // The VideoGenerator component's useEffect will re-check `hasSelectedApiKey` later.
    // We can optimistically close the modal, or keep it open if hasSelectedApiKey is still false.
    // For now, let's allow it to close after the action, and VideoGenerator will re-open if needed.
    onClose(); 
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center max-w-2xl mx-auto relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gemini-key-modal-title"
      >
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900 mb-6">
          <KeyRound className="h-8 w-8 text-orange-500 dark:text-orange-400" />
        </div>
        <h2 id="gemini-key-modal-title" className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('geminiApiKeyRequiredTitle')}
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {t('geminiApiKeyRequiredSubtitle')}
        </p>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={handleSelectKeyClick}
            className="w-full inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-transform transform hover:scale-105"
          >
            {t('selectGeminiApiKey')}
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{t('geminiBillingLink')}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default GeminiKeyRequiredModal;