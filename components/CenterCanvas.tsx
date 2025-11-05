import React from 'react';
import { Scene, AspectRatio, OnboardingStep } from '../types';
import { Loader2, Image as ImageIconLucide, Film, Sparkles, Download, CheckCircle, Circle, Play } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface CenterCanvasProps {
    scenes: Scene[];
    onGenerateImage: (sceneId: string, baseImageUrl?: string) => void;
    onGenerateVideo: (sceneId: string) => void;
    onPreviewVideo: (sceneId: string) => void;
    generatingImageIds: Set<string>;
    generatingVideoIds: Set<string>;
    aspectRatio: AspectRatio;
    progressMessages: Record<string, string>;
    // Onboarding
    onboardingStatus: { product: boolean; storyboard: boolean; create: boolean };
    activeOnboardingStep: OnboardingStep | null;
    // New Paraphrasing Props
    onParaphraseAndGenerateImage: (sceneId: string) => void;
    onParaphraseAndGenerateVideo: (sceneId: string) => void;
    paraphrasingSceneId: string | null;
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


const CenterCanvas: React.FC<CenterCanvasProps> = ({ 
    scenes, onGenerateImage, onGenerateVideo, onPreviewVideo, generatingImageIds, generatingVideoIds, aspectRatio, progressMessages,
    onboardingStatus, activeOnboardingStep,
    onParaphraseAndGenerateImage, onParaphraseAndGenerateVideo, paraphrasingSceneId
}) => {
    const { t } = useTranslation();
    
    const getButtonState = (scene: Scene, isFirstScene: boolean) => {
        const isThisImageLoading = generatingImageIds.has(scene.id) || paraphrasingSceneId === scene.id;
        const isThisVideoLoading = generatingVideoIds.has(scene.id) || paraphrasingSceneId === scene.id;
        const showOnboardingIndicator = activeOnboardingStep === 'create' && isFirstScene;
        
        const nextStepIcon = <div className="flex items-center mr-1"><NextStepIndicator isComplete={false} isActive={true} /></div>;

        if (isThisImageLoading) return { text: t('generatingImage'), icon: <Loader2 className="h-4 w-4 animate-spin"/>, action: () => {}, disabled: true };
        if (isThisVideoLoading) return { text: t('generatingVideo'), icon: <Loader2 className="h-4 w-4 animate-spin"/>, action: () => {}, disabled: true };
        if (scene.generatedVideoUrl) return { text: t('generateVideo'), icon: <Film className="h-4 w-4"/>, action: () => onGenerateVideo(scene.id), disabled: false, isComplete: true };
        if (scene.imageUrl) return { text: t('generateVideo'), icon: <Film className="h-4 w-4"/>, action: () => onGenerateVideo(scene.id), disabled: false };
        return { 
            text: t('generateImage'), 
            icon: showOnboardingIndicator ? nextStepIcon : <Sparkles className="h-4 w-4"/>, 
            action: () => onGenerateImage(scene.id), 
            disabled: false 
        };
    }

    const aspectClass = aspectRatio === AspectRatio.Landscape ? 'aspect-video' : 'aspect-[9/16]';

    return (
        <main className={`p-4 rounded-lg shadow-inner overflow-y-auto transition-all duration-300 h-full ${activeOnboardingStep === 'create' ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-100 dark:ring-offset-slate-900' : 'bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}`}>
            <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">🎨 {t('canvasTitle')}</h2>
            {scenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                    <ImageIconLucide className="h-12 w-12 mb-4" />
                    <h3 className="font-semibold text-lg">{t('canvasEmptyTitle')}</h3>
                    <p className="max-w-xs">{t('canvasEmptySubtitle')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {scenes.map((scene, index) => {
                    const buttonState = getButtonState(scene, index === 0);
                    const isParaphrasing = paraphrasingSceneId === scene.id;
                    const isImageLoading = generatingImageIds.has(scene.id) || isParaphrasing;
                    const isVideoLoading = generatingVideoIds.has(scene.id) || isParaphrasing;
                    const progressMessage = progressMessages[scene.id] || (isParaphrasing ? t('paraphrasingPrompt') : undefined);

                    return (
                        <div key={scene.id} className={`${aspectClass} bg-white dark:bg-slate-900/50 rounded-md flex flex-col items-center justify-center p-2 relative group border-2 border-slate-200 dark:border-slate-700`}>
                            {scene.imageUrl ? (
                                <img src={scene.imageUrl} alt={scene.imagePrompt} className="w-full h-full object-cover rounded"/>
                            ) : (
                                <div className="text-center">
                                    <ImageIconLucide className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('noImageGenerated')}</p>
                                </div>
                            )}

                            {scene.generatedVideoUrl && !isVideoLoading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                    <button 
                                        onClick={() => onPreviewVideo(scene.id)}
                                        title={t('previewVideo')}
                                        className="p-4 bg-white/80 backdrop-blur-sm rounded-full text-slate-900 hover:bg-white scale-100 hover:scale-110 transition-transform"
                                    >
                                        <Play className="h-6 w-6 fill-current"/>
                                    </button>
                                </div>
                            )}
                            
                            {(isImageLoading || isVideoLoading) && (
                                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                                     <div className="text-center text-white p-2">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto"/>
                                        <p className="text-sm mt-2">{progressMessage || (isImageLoading && !isParaphrasing ? t('generatingImage') : t('generatingVideo'))}</p>
                                     </div>
                                 </div>
                            )}

                            {!(isImageLoading || isVideoLoading) && !scene.generatedVideoUrl && (
                                <div className="absolute inset-0 bg-black/50 flex flex-wrap items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded p-2">
                                    <div className="flex items-center justify-center gap-2">
                                        {scene.imageUrl && (
                                            <button 
                                                onClick={() => onParaphraseAndGenerateImage(scene.id)} 
                                                title={t('paraphraseAndRegenerateImage')}
                                                className="p-2 text-sm font-medium rounded-full bg-white/80 backdrop-blur-sm text-slate-900 hover:bg-white disabled:bg-slate-200 disabled:cursor-wait">
                                                <Sparkles className="h-4 w-4"/>
                                            </button>
                                        )}
                                        <button 
                                            onClick={buttonState.action} 
                                            disabled={buttonState.disabled}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-white/80 backdrop-blur-sm text-slate-900 hover:bg-white disabled:bg-slate-200 disabled:cursor-wait">
                                            {buttonState.icon}
                                            <span>{buttonState.text}</span>
                                        </button>
                                        {scene.generatedVideoUrl && (
                                            <button 
                                                onClick={() => onParaphraseAndGenerateVideo(scene.id)} 
                                                title={t('paraphraseAndRegenerateVideo')}
                                                className="p-2 text-sm font-medium rounded-full bg-white/80 backdrop-blur-sm text-slate-900 hover:bg-white disabled:bg-slate-200 disabled:cursor-wait">
                                                <Sparkles className="h-4 w-4"/>
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        {scene.imageUrl && (
                                            <a 
                                                href={scene.imageUrl}
                                                download={`scene_${scene.id}_image.png`}
                                                title={t('downloadImage')}
                                                className="p-2 text-sm font-medium rounded-full bg-white/80 backdrop-blur-sm text-slate-900 hover:bg-white">
                                                <Download className="h-4 w-4"/>
                                            </a>
                                        )}
                                        {scene.generatedVideoUrl && (
                                            <a 
                                                href={scene.generatedVideoUrl}
                                                download={`scene_${scene.id}_video.mp4`}
                                                title={t('downloadVideo')}
                                                className="p-2 text-sm font-medium rounded-full bg-white/80 backdrop-blur-sm text-slate-900 hover:bg-white">
                                                <Download className="h-4 w-4"/>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                </div>
            )}
        </main>
    );
};

export default CenterCanvas;