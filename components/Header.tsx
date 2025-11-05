import React from 'react';
import { AivideoautoModel, Language, LLMProvider } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { Languages, Video, Image as ImageIcon, Info, KeyRound, MessageSquare, BrainCircuit } from 'lucide-react';

interface HeaderProps {
    language: Language;
    onLanguageChange: (lang: Language) => void;
    imageModels: AivideoautoModel[];
    videoModels: AivideoautoModel[];
    selectedImageModelId: string | null;
    onImageModelChange: (id: string) => void;
    selectedVideoModelId: string | null;
    onVideoModelChange: (id: string) => void;
    aivideoautoCredits: number | null;
    onOpenAivideoautoKeyModal: () => void;
    onOpenGeminiKeySelector: () => void;
    onOpenModelInfoModal: () => void;
    onOpenChatbotModal: () => void;
    llmProvider: LLMProvider;
    onLlmProviderChange: (provider: LLMProvider) => void;
    onOpenOpenAiKeyModal: () => void;
}

const Header: React.FC<HeaderProps> = ({
    language, onLanguageChange,
    imageModels, videoModels,
    selectedImageModelId, onImageModelChange,
    selectedVideoModelId, onVideoModelChange,
    aivideoautoCredits,
    onOpenAivideoautoKeyModal,
    onOpenGeminiKeySelector,
    onOpenModelInfoModal,
    onOpenChatbotModal,
    llmProvider,
    onLlmProviderChange,
    onOpenOpenAiKeyModal,
}) => {
    const { t } = useTranslation();

    const ModelSelect: React.FC<{
        icon: React.ReactNode;
        label: string;
        models: AivideoautoModel[];
        selectedValue: string | null;
        onChange: (id: string) => void;
    }> = ({ icon, label, models, selectedValue, onChange }) => (
        <div className="flex items-center gap-2">
            {icon}
            <label htmlFor={label} className="text-sm font-medium text-slate-700 dark:text-slate-300 sr-only">{label}</label>
            <select
                id={label}
                value={selectedValue || ''}
                onChange={(e) => onChange(e.target.value)}
                className="block w-full text-sm pl-2 pr-8 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition"
            >
                <option value="" disabled>{t('selectModelPlaceholder')}</option>
                {models.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                ))}
            </select>
        </div>
    );
    
    return (
        <header className="bg-white dark:bg-slate-800/50 p-3 sm:p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{t('appTitle')}</h1>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                     <div className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-slate-500"/>
                        <label htmlFor="llm-provider" className="text-sm font-medium text-slate-700 dark:text-slate-300 sr-only">{t('llmProvider')}</label>
                        <select
                            id="llm-provider"
                            value={llmProvider}
                            onChange={(e) => onLlmProviderChange(e.target.value as LLMProvider)}
                            className="block w-full text-sm pl-2 pr-8 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                            <option value={LLMProvider.Gemini}>{t(LLMProvider.Gemini)}</option>
                            <option value={LLMProvider.OpenAI}>{t(LLMProvider.OpenAI)}</option>
                        </select>
                    </div>
                    {aivideoautoCredits !== null && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" aria-label={t('remainingCredits')}>
                            <span className="text-sm font-semibold">{t('remainingCredits')}:</span>
                            <span className="text-sm font-bold">{aivideoautoCredits}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={onOpenAivideoautoKeyModal} 
                            className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            aria-label={t('changeAivideoautoApiKey')}
                            title={t('changeAivideoautoApiKey')}
                        >
                           <KeyRound className="h-5 w-5 text-slate-500"/>
                        </button>
                        <button 
                            onClick={onOpenGeminiKeySelector} 
                            className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            aria-label={t('changeGeminiApiKey')}
                            title={t('changeGeminiApiKey')}
                        >
                           <KeyRound className="h-5 w-5 text-purple-500"/>
                        </button>
                         <button 
                            onClick={onOpenOpenAiKeyModal} 
                            className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            aria-label={t('changeOpenAiApiKey')}
                            title={t('changeOpenAiApiKey')}
                        >
                           <KeyRound className="h-5 w-5 text-green-500"/>
                        </button>
                        <button 
                            onClick={onOpenChatbotModal}
                            className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            aria-label={t('chatbotTitle')}
                            title={t('chatbotTitle')}
                        >
                           <MessageSquare className="h-5 w-5 text-blue-500"/>
                        </button>
                        <button 
                            onClick={onOpenModelInfoModal}
                            className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            aria-label={t('modelInfoTitle')}
                            title={t('modelInfoTitle')}
                        >
                           <Info className="h-5 w-5 text-slate-500"/>
                        </button>
                        <button 
                            onClick={() => onLanguageChange(language === Language.English ? Language.Vietnamese : Language.English)} 
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                           <Languages className="h-5 w-5 text-slate-500"/>
                           <span className="font-semibold text-sm">{language.toUpperCase()}</span>
                        </button>
                    </div>
                </div>
            </div>
             <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex flex-col sm:flex-row gap-2">
                <ModelSelect 
                    icon={<ImageIcon className="h-5 w-5 text-slate-500"/>}
                    label={t('imageModelLabel')}
                    models={imageModels}
                    selectedValue={selectedImageModelId}
                    onChange={onImageModelChange}
                />
                 <ModelSelect 
                    icon={<Video className="h-5 w-5 text-slate-500"/>}
                    label={t('videoModelLabel')}
                    models={videoModels}
                    selectedValue={selectedVideoModelId}
                    onChange={onVideoModelChange}
                />
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <div className="flex items-start gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-900/30">
                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5"/>
                    <p dangerouslySetInnerHTML={{ __html: `<b class="font-semibold text-slate-800 dark:text-slate-200">${t('imageConsistencyNoteTitle')}:</b> ${t('imageConsistencyNote')}` }} />
                </div>
                 <div className="flex items-start gap-2 p-2 rounded-md bg-purple-50 dark:bg-purple-900/30">
                    <Info className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5"/>
                    <p dangerouslySetInnerHTML={{ __html: `<b class="font-semibold text-slate-800 dark:text-slate-200">${t('videoConsistencyNoteTitle')}:</b> ${t('videoConsistencyNote')}` }} />
                </div>
            </div>
        </header>
    );
};

export default Header;
