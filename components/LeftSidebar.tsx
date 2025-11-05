import React from 'react';
import { AspectRatio, ScenarioType, Scene, OnboardingStep } from '../types';
import { Film, Image as ImageIcon, Sparkles, UserSquare, ChevronDown, CheckCircle, Circle, Clock, PlusCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import OnboardingChecklist from './OnboardingChecklist';

interface LeftSidebarProps {
    scenes: Scene[];
    onScenePromptChange: (sceneId: string, promptType: 'image' | 'video', newText: string) => void;
    onGenerateScenes: () => void;
    isGeneratingScenes: boolean;
    onAddScene: () => void;
    isAddingScene: boolean;
    aspectRatio: AspectRatio;
    onAspectRatioChange: (ratio: AspectRatio) => void;
    scenarioType: ScenarioType;
    onScenarioTypeChange: (type: ScenarioType) => void;
    // Onboarding
    showOnboarding: boolean;
    onboardingStatus: { product: boolean; scenario: boolean; storyboard: boolean; create: boolean };
    onDismissOnboarding: () => void;
    onHighlightStep: (step: OnboardingStep | null) => void;
    highlightedStep: OnboardingStep | null;
}

const NextStepIndicator: React.FC<{isComplete: boolean, isActive: boolean}> = ({ isComplete, isActive }) => {
    if (isComplete) {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (isActive) {
        return <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>;
    }
    return <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />;
}


const LeftSidebar: React.FC<LeftSidebarProps> = ({
    scenes, onScenePromptChange,
    onGenerateScenes, isGeneratingScenes,
    onAddScene, isAddingScene,
    aspectRatio, onAspectRatioChange,
    scenarioType, onScenarioTypeChange,
    showOnboarding, onboardingStatus, onDismissOnboarding, onHighlightStep, highlightedStep
}) => {
    const { t } = useTranslation();
    const [openSceneId, setOpenSceneId] = React.useState<string | null>(null);
    const totalDuration = scenes.reduce((acc, scene) => acc + scene.duration, 0);

    return (
        <aside className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col space-y-4 h-full">
            
            {showOnboarding && (
                <OnboardingChecklist 
                    status={onboardingStatus}
                    onDismiss={onDismissOnboarding}
                    onHighlightStep={onHighlightStep}
                />
            )}

            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-2">{t('storyboardTitle')}</h2>
            
            <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-4">
                {/* Controls */}
                <div className={`space-y-4 p-2 rounded-md transition-all duration-300 ${highlightedStep === 'scenario' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900' : ''}`}>
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {showOnboarding && <NextStepIndicator isComplete={onboardingStatus.scenario} isActive={onboardingStatus.product && !onboardingStatus.storyboard} />}
                            {t('scenarioType')}
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <button onClick={() => onScenarioTypeChange(ScenarioType.Review)} className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm transition ${scenarioType === ScenarioType.Review ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                <ImageIcon className="h-4 w-4" /> {t('review')}
                            </button>
                            <button onClick={() => onScenarioTypeChange(ScenarioType.Vlog)} className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm transition ${scenarioType === ScenarioType.Vlog ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                <Film className="h-4 w-4" /> {t('vlog')}
                            </button>
                            <button onClick={() => onScenarioTypeChange(ScenarioType.UGC)} className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm transition ${scenarioType === ScenarioType.UGC ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                <UserSquare className="h-4 w-4" /> {t('ugc')}
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('aspectRatio')}</h3>
                        <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => onAspectRatioChange(AspectRatio.Landscape)} className={`p-2 rounded-md text-sm transition ${aspectRatio === AspectRatio.Landscape ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                {t('landscape')}
                            </button>
                             <button onClick={() => onAspectRatioChange(AspectRatio.Portrait)} className={`p-2 rounded-md text-sm transition ${aspectRatio === AspectRatio.Portrait ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                {t('portrait')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scenes List */}
                <div className="space-y-2">
                    {scenes.map((scene, index) => (
                        <div key={scene.id} className="bg-slate-100 dark:bg-slate-700/50 rounded-md">
                            <button 
                                onClick={() => setOpenSceneId(openSceneId === scene.id ? null : scene.id)}
                                className="w-full flex justify-between items-center p-2 text-left"
                            >
                                <span className="font-semibold text-sm">Scene {index + 1}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${openSceneId === scene.id ? 'rotate-180' : ''}`} />
                            </button>
                            {openSceneId === scene.id && (
                                <div className="p-2 border-t border-slate-200 dark:border-slate-600 space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('imagePromptLabel')}</label>
                                        <textarea
                                            value={scene.imagePrompt}
                                            onChange={(e) => onScenePromptChange(scene.id, 'image', e.target.value)}
                                            rows={5}
                                            className="block w-full text-sm mt-1 px-3 py-2 rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('videoPromptLabel')}</label>
                                        <textarea
                                            value={scene.videoPrompt}
                                            onChange={(e) => onScenePromptChange(scene.id, 'video', e.target.value)}
                                            rows={5}
                                            className="block w-full text-sm mt-1 px-3 py-2 rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                     {scenes.length > 0 && (
                        <button 
                            onClick={onAddScene}
                            disabled={isAddingScene || isGeneratingScenes}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {isAddingScene ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4"/>}
                            <span>{isAddingScene ? t('addingScene') : t('addScene')}</span>
                        </button>
                    )}
                </div>
                {scenes.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {t('totalDuration').replace('{duration}', totalDuration.toString())}
                        </p>
                    </div>
                )}
            </div>

            <div className={`border-t border-slate-200 dark:border-slate-700 pt-4 p-2 rounded-md transition-all duration-300 ${highlightedStep === 'storyboard' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900' : ''}`}>
                 <button 
                    onClick={onGenerateScenes}
                    disabled={isGeneratingScenes || isAddingScene}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                 >
                    {showOnboarding && <div className="flex items-center"><NextStepIndicator isComplete={onboardingStatus.storyboard} isActive={onboardingStatus.product && onboardingStatus.scenario && !onboardingStatus.storyboard}/></div>}
                    <Sparkles className="h-4 w-4"/>
                    <span>{t('generateScenes')}</span>
                </button>
            </div>
        </aside>
    );
};

export default LeftSidebar;