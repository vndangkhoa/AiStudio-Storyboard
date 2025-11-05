import React from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface PolicyErrorModalProps {
  onClose: () => void;
}

const PolicyErrorModal: React.FC<PolicyErrorModalProps> = ({ onClose }) => {
  const { t } = useTranslation();

  const suggestions = [
    t('policyErrorSuggestion1'),
    t('policyErrorSuggestion2'),
    t('policyErrorSuggestion3'),
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg m-4 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-5">
          <AlertTriangle className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('policyErrorTitle')}
        </h2>
        
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {t('policyErrorMessage')}
        </p>
        
        <div className="mt-6 text-left space-y-3 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p 
                className="text-sm text-slate-700 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: suggestion }}
              />
            </div>
          ))}
        </div>
        
        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
          >
            {t('policyErrorAcknowledge')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyErrorModal;
