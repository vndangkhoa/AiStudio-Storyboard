import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { CheckCircle, Circle, Rocket, X } from 'lucide-react';
import { OnboardingStep } from '../types';

interface OnboardingChecklistProps {
  status: {
    product: boolean;
    storyboard: boolean;
    create: boolean;
  };
  onDismiss: () => void;
  activeStep: OnboardingStep | null;
}

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ status, onDismiss, activeStep }) => {
  const { t } = useTranslation();

  const checklistItems = [
    { key: 'product', isComplete: status.product, title: t('onboardingStep1') },
    { key: 'storyboard', isComplete: status.storyboard, title: t('onboardingStep3') },
    { key: 'create', isComplete: status.create, title: t('onboardingStep4') },
  ];

  const ListItem: React.FC<{ isComplete: boolean; title: string; isActive: boolean }> = ({ isComplete, title, isActive }) => (
    <div className={`flex items-center gap-3 w-full text-left p-1 rounded-md transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}>
      <div>
        {isComplete ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
           isActive ? (
             <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
             </div>
           ) : (
             <Circle className="h-5 w-5 text-slate-400" />
           )
        )}
      </div>
      <div>
        <p className={`font-semibold text-sm ${isComplete ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
          {title}
        </p>
      </div>
    </div>
  );
  
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <Rocket className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('onboardingTitle')}</h3>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600" title={t('onboardingDismiss')}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {checklistItems.map(item => (
          <ListItem key={item.key} {...item} isActive={activeStep === item.key} />
        ))}
      </div>
    </div>
  );
};

export default OnboardingChecklist;