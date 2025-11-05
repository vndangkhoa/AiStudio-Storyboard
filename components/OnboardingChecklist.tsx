import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { CheckCircle, Circle, Rocket, X } from 'lucide-react';
import { OnboardingStep } from '../types';

interface OnboardingChecklistProps {
  status: {
    product: boolean;
    scenario: boolean;
    storyboard: boolean;
    create: boolean;
  };
  onDismiss: () => void;
  onHighlightStep: (step: OnboardingStep | null) => void;
}

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ status, onDismiss, onHighlightStep }) => {
  const { t } = useTranslation();

  const checklistItems = [
    { key: 'product', isComplete: status.product, title: t('onboardingStep1') },
    { key: 'scenario', isComplete: status.scenario, title: t('onboardingStep2') },
    { key: 'storyboard', isComplete: status.storyboard, title: t('onboardingStep3') },
    { key: 'create', isComplete: status.create, title: t('onboardingStep4') },
  ];

  const ListItem: React.FC<{ isComplete: boolean; title: string; stepKey: OnboardingStep }> = ({ isComplete, title, stepKey }) => (
    <button 
      className="flex items-center gap-3 w-full text-left p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
      onClick={() => onHighlightStep(stepKey)}
      onMouseLeave={() => onHighlightStep(null)}
      onMouseEnter={() => onHighlightStep(stepKey)}
    >
      <div>
        {isComplete ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-slate-400" />
        )}
      </div>
      <div>
        <p className={`font-semibold text-sm ${isComplete ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
          {title}
        </p>
      </div>
    </button>
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
          <ListItem key={item.key} {...item} stepKey={item.key as OnboardingStep} />
        ))}
      </div>
    </div>
  );
};

export default OnboardingChecklist;