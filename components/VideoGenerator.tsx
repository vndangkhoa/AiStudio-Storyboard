import React, { useState, useEffect, useCallback } from 'react';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import CenterCanvas from './CenterCanvas';
import ApiKeySelector from './ApiKeySelector';
import GeminiKeyRequiredModal from './GeminiKeyRequiredModal';
import OpenAiApiKeySelector from './OpenAiApiKeySelector';
import ChatbotModal from './ChatbotModal';
import Header from './Header';
import PolicyErrorModal from './PolicyErrorModal';
import * as aivideoauto from '../services/aivideoautoService';
import { Scene, Asset, AssetType, ScenarioType, AspectRatio, AivideoautoModel, Language, OnboardingStep, VideoAnalysisResult, LLMProvider, ChatMessage } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import BottomNavBar from './BottomNavBar';
import ModelInfoModal from './ModelInfoModal';

const VideoGenerator: React.FC = () => {
    const { t: translate, language, setLanguage } = useTranslation();
    
    const [aivideoautoApiKey, setAivideoautoApiKey] = useState<string | null>(null);
    const [aivideoautoApiKeyError, setAivideoautoApiKeyError] = useState(false);
    const [showAivideoautoKeyModal, setShowAivideoautoKeyModal] = useState(false);
    const [aivideoautoCredits, setAivideoautoCredits] = useState<number | null>(null);

    const [llmProvider, setLlmProvider] = useState<LLMProvider>(LLMProvider.Gemini);
    
    const [hasGeminiApiKey, setHasGeminiApiKey] = useState(false);
    const [showGeminiKeyRequiredModal, setShowGeminiKeyRequiredModal] = useState(false);
    
    const [openAiApiKey, setOpenAiApiKey] = useState<string | null>(null);
    const [openAiApiKeyError, setOpenAiApiKeyError] = useState(false);
    const [showOpenAiKeyModal, setShowOpenAiKeyModal] = useState(false);


    const [isLoading, setIsLoading] = useState(true);
    const [policyError, setPolicyError] = useState<string | null>(null);
    
    const [models, setModels] = useState<AivideoautoModel[]>([]);
    const [selectedImageModelId, setSelectedImageModelId] = useState<string | null>(null);
    const [selectedVideoModelId, setSelectedVideoModelId] = useState<string | null>(null);
    

    const [scenes, setScenes] = useState<Scene[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [scenarioType, setScenarioType] = useState<ScenarioType>(ScenarioType.Review);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Landscape);
    const [productDescription, setProductDescription] = useState('');
    
    const [generatingImageIds, setGeneratingImageIds] = useState<Set<string>>(new Set());
    const [generatingVideoIds, setGeneratingVideoIds] = useState<Set<string>>(new Set());
    const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);
    const [isAddingScene, setIsAddingScene] = useState(false);
    const [progressMessages, setProgressMessages] = useState<Record<string, string>>({});

    const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('onboardingDismissed'));
    const [highlightedStep, setHighlightedStep] = useState<OnboardingStep | null>(null);
    
    const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
    const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
    const [videoAnalysisResult, setVideoAnalysisResult] = useState<VideoAnalysisResult | null>(null);
    const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
    const [sidebarActionProgress, setSidebarActionProgress] = useState<string>('');

    const [showChatbotModal, setShowChatbotModal] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatIsLoading, setChatIsLoading] = useState(false);

    const [showModelInfoModal, setShowModelInfoModal] = useState(false);

    const [paraphrasingSceneId, setParaphrasingSceneId] = useState<string | null>(null);
    const [queuedGeneration, setQueuedGeneration] = useState<{ type: 'image' | 'video', sceneId: string } | null>(null);

    const [mobileView, setMobileView] = useState<'storyboard' | 'canvas' | 'assets'>('canvas');


    const imageModels = models.filter(m => m.type === 'image');
    const videoModels = models.filter(m => m.type === 'video');

    const updateProgress = useCallback((id: string, message: string) => {
        setProgressMessages(prev => ({ ...prev, [id]: message }));
    }, []);

    useEffect(() => {
        const initApp = async () => {
            setIsLoading(true);

            const storedAivideoautoKey = localStorage.getItem('aivideoauto_api_key');
            if (storedAivideoautoKey) {
                setAivideoautoApiKey(storedAivideoautoKey);
                try {
                    const data = await aivideoauto.listModels();
                    setModels(data.models);
                    setAivideoautoCredits(data.credits);
                    setAivideoautoApiKeyError(false);
                } catch (err: any) {
                    console.error("AIVideoAuto API key failed:", err);
                    setAivideoautoApiKey(null);
                    localStorage.removeItem('aivideoauto_api_key');
                    setAivideoautoApiKeyError(true);
                    setShowAivideoautoKeyModal(true);
                }
            } else {
                setShowAivideoautoKeyModal(true);
            }
            
            const storedOpenAiKey = localStorage.getItem('openai_api_key');
            if (storedOpenAiKey) {
                setOpenAiApiKey(storedOpenAiKey);
            }

            if (window.aistudio) {
                const selected = await window.aistudio.hasSelectedApiKey();
                setHasGeminiApiKey(selected);
            } else {
                console.warn("window.aistudio is not available. Gemini API key selection feature disabled.");
            }

            setIsLoading(false);
        };
        initApp();
    }, []);
    
    useEffect(() => {
      if (models.length > 0) {
        if (!selectedImageModelId) {
            const nanoBanana = imageModels.find(m => m.name.toLowerCase().includes('nano banana'));
            const seedream4 = imageModels.find(m => m.name.toLowerCase().includes('seedream 4'));
            const imagen3Model = imageModels.find(m => m.name.toLowerCase().includes('imagen3'));
            setSelectedImageModelId(
                nanoBanana?.id || 
                seedream4?.id || 
                imagen3Model?.id || 
                (imageModels[0]?.id || null)
            );
        }
        if (!selectedVideoModelId) {
            const veoModel = videoModels.find(m => m.name.toLowerCase().includes('veo3.1'));
            const xImagineModel = videoModels.find(m => m.name.toLowerCase().includes('x- imagine 1'));
            setSelectedVideoModelId(
                veoModel?.id ||
                xImagineModel?.id ||
                (videoModels[0]?.id || null)
            );
        }
      }
    }, [models, imageModels, videoModels]);

    useEffect(() => {
        if (uploadedVideo) {
            const url = URL.createObjectURL(uploadedVideo);
            setUploadedVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setUploadedVideoUrl(null);
    }, [uploadedVideo]);

    const handleAivideoautoKeySubmit = async (key: string) => {
        localStorage.setItem('aivideoauto_api_key', key);
        setAivideoautoApiKey(key);
        setIsLoading(true);
        setAivideoautoApiKeyError(false);
        try {
            const data = await aivideoauto.listModels();
            setModels(data.models);
            setAivideoautoCredits(data.credits);
            setShowAivideoautoKeyModal(false);
        } catch (err: any) {
            console.error(err);
            setAivideoautoApiKey(null);
            localStorage.removeItem('aivideoauto_api_key');
            setAivideoautoApiKeyError(true);
            alert((err as unknown as Error).message || translate('invalidAivideoautoApiKeyError'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCloseAivideoautoKeyModal = () => {
        setShowAivideoautoKeyModal(false);
        setAivideoautoApiKeyError(false);
    };

    const handleOpenAivideoautoKeyModal = () => {
        setAivideoautoApiKeyError(false);
        setShowAivideoautoKeyModal(true);
    };
    
    const handleOpenAiKeySubmit = (key: string) => {
        localStorage.setItem('openai_api_key', key);
        setOpenAiApiKey(key);
        setOpenAiApiKeyError(false);
        setShowOpenAiKeyModal(false);
    };

    const handleCloseOpenAiKeyModal = () => {
        setShowOpenAiKeyModal(false);
        setOpenAiApiKeyError(false);
    };

    const handleOpenOpenAiKeyModal = () => {
        setOpenAiApiKeyError(false);
        setShowOpenAiKeyModal(true);
    };

    const handleGeminiKeySelection = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setHasGeminiApiKey(true); 
            setShowGeminiKeyRequiredModal(false);
        }
    };

    const handleOpenGeminiKeySelector = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            const selected = await window.aistudio.hasSelectedApiKey();
            setHasGeminiApiKey(selected);
            if (selected) {
               setShowGeminiKeyRequiredModal(false);
            }
        }
    };

    const handleAssetUpload = async (file: File, type: AssetType) => {
        const newAsset = await aivideoauto.uploadAsset(file, type);
        setAssets(prev => [...prev.filter(a => a.type !== type), newAsset]);
    };
    
    const handleGenerateScenes = async () => {
        if (llmProvider === LLMProvider.Gemini && !hasGeminiApiKey) {
            setShowGeminiKeyRequiredModal(true);
            return;
        }
        if (llmProvider === LLMProvider.OpenAI && !openAiApiKey) {
            setShowOpenAiKeyModal(true);
            return;
        }

        setIsGeneratingScenes(true);
        try {
            const suggestions = await aivideoauto.generateSceneSuggestions(
                scenarioType, 
                assets, 
                productDescription, 
                language as Language,
                llmProvider
            );
            setScenes(suggestions);
            setMobileView('canvas');
        } catch (error: any) {
            if (error instanceof aivideoauto.GeminiApiKeyError) {
                setHasGeminiApiKey(false);
                setShowGeminiKeyRequiredModal(true);
                alert(translate('geminiApiKeyErrorMessage'));
            } else if (error instanceof aivideoauto.OpenAiApiKeyError) {
                setOpenAiApiKey(null);
                localStorage.removeItem('openai_api_key');
                setOpenAiApiKeyError(true);
                setShowOpenAiKeyModal(true);
                alert(translate('invalidOpenAiApiKeyError'));
            } else {
                alert(`Scene generation failed: ${(error as unknown as Error).message}`);
            }
        } finally {
            setIsGeneratingScenes(false);
        }
    };

    const handleAddScene = async () => {
        if (llmProvider === LLMProvider.Gemini && !hasGeminiApiKey) {
            setShowGeminiKeyRequiredModal(true);
            return;
        }
        if (llmProvider === LLMProvider.OpenAI && !openAiApiKey) {
            setShowOpenAiKeyModal(true);
            return;
        }

        setIsAddingScene(true);
        try {
            const { imagePrompt, videoPrompt } = await aivideoauto.generateNextScene(
                scenes,
                assets,
                productDescription,
                language as Language,
                llmProvider
            );
            const newScene: Scene = {
                id: `scene_${Date.now()}_${scenes.length}`,
                imagePrompt,
                videoPrompt,
                tokens: [],
                duration: 5,
            };
            setScenes(prev => [...prev, newScene]);
        } catch (error: any) {
            if (error instanceof aivideoauto.GeminiApiKeyError) {
                setHasGeminiApiKey(false);
                setShowGeminiKeyRequiredModal(true);
                alert(translate('geminiApiKeyErrorMessage'));
            } else if (error instanceof aivideoauto.OpenAiApiKeyError) {
                setOpenAiApiKey(null);
                localStorage.removeItem('openai_api_key');
                setOpenAiApiKeyError(true);
                setShowOpenAiKeyModal(true);
                alert(translate('invalidOpenAiApiKeyError'));
            } else {
                alert(`Failed to add new scene: ${(error as unknown as Error).message}`);
            }
        } finally {
            setIsAddingScene(false);
        }
    };
    
    const handleScenePromptChange = (sceneId: string, promptType: 'image' | 'video', newText: string) => {
        setScenes(prevScenes =>
            prevScenes.map(scene => {
                if (scene.id === sceneId) {
                    if (promptType === 'image') {
                        return { ...scene, imagePrompt: newText };
                    } else {
                        return { ...scene, videoPrompt: newText };
                    }
                }
                return scene;
            })
        );
    };

    const handleGenerateImage = useCallback(async (sceneId: string, baseImageUrl?: string) => {
        if (!aivideoautoApiKey) {
            setShowAivideoautoKeyModal(true);
            return;
        }

        const scene = scenes.find(s => s.id === sceneId);
        const model = models.find(m => m.id === selectedImageModelId);
        if (!scene || !model) return;

        setGeneratingImageIds(prev => {
          const newSet = new Set(prev);
          newSet.add(sceneId);
          return newSet;
        });
        try {
            let base64Data: string | undefined = undefined;
            let mimeType: string | undefined = undefined;

            if (baseImageUrl && baseImageUrl.startsWith('data:')) {
                const parts = baseImageUrl.split(',');
                if (parts.length > 1 && parts[0]) {
                    const metaPart = parts[0].split(':')[1];
                    if (metaPart) {
                        mimeType = metaPart.split(';')[0];
                    }
                    base64Data = parts[1];
                }
            }

            const { url, imageInfo } = await aivideoauto.generateSceneImage(
                scene.imagePrompt,
                model.slug,
                aspectRatio,
                (msg) => updateProgress(sceneId, msg),
                assets.filter(a => a.locked),
                base64Data,
                mimeType
            );
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, imageUrl: url, imageInfo } : s));
        } catch (error: any) {
             if (error instanceof aivideoauto.PolicyViolationError) {
                setPolicyError(error.message);
            } else if (error instanceof aivideoauto.ApiKeyError) {
                setAivideoautoApiKey(null);
                localStorage.removeItem('aivideoauto_api_key');
                setAivideoautoApiKeyError(true);
                setShowAivideoautoKeyModal(true);
                alert(translate('invalidAivideoautoApiKeyError'));
            } else {
                alert(`Image generation failed for scene: ${(error as unknown as Error).message}`);
            }
        } finally {
            setGeneratingImageIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(sceneId);
                return newSet;
            });
            setProgressMessages(prev => { const next = {...prev}; delete next[sceneId]; return next; });
        }
    }, [scenes, models, selectedImageModelId, aspectRatio, assets, updateProgress, aivideoautoApiKey, translate]);

    const handleGenerateVideo = useCallback(async (sceneId: string) => {
        if (!aivideoautoApiKey) {
            setShowAivideoautoKeyModal(true);
            return;
        }

        const scene = scenes.find(s => s.id === sceneId);
        const model = models.find(m => m.id === selectedVideoModelId);
        if (!scene || !model || !scene.imageUrl) return;

        setGeneratingVideoIds(prev => {
          const newSet = new Set(prev);
          newSet.add(sceneId);
          return newSet;
        });
        try {
            const videoUrl = await aivideoauto.generateVideoForScene(
                scene,
                model.slug,
                (msg) => updateProgress(sceneId, msg)
            );
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, generatedVideoUrl: videoUrl } : s));
        } catch (error: any) {
            if (error instanceof aivideoauto.ApiKeyError) {
                setAivideoautoApiKey(null);
                localStorage.removeItem('aivideoauto_api_key');
                setAivideoautoApiKeyError(true);
                setShowAivideoautoKeyModal(true);
                alert(translate('invalidAivideoautoApiKeyError'));
            } else {
                alert(`Video generation failed for scene: ${(error as unknown as Error).message}`);
            }
        } finally {
            setGeneratingVideoIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(sceneId);
                return newSet;
            });
            setProgressMessages(prev => { const next = {...prev}; delete next[sceneId]; return next; });
        }
    }, [scenes, models, selectedVideoModelId, updateProgress, aivideoautoApiKey, translate]);

    useEffect(() => {
        if (queuedGeneration) {
            const generationTask = async () => {
                if (queuedGeneration.type === 'image') {
                    await handleGenerateImage(queuedGeneration.sceneId);
                } else {
                    await handleGenerateVideo(queuedGeneration.sceneId);
                }
                setQueuedGeneration(null);
            };
            setTimeout(generationTask, 0); 
        }
    }, [queuedGeneration, handleGenerateImage, handleGenerateVideo]);

    const handleParaphraseAndGenerateImage = useCallback(async (sceneId: string) => {
        if (llmProvider === LLMProvider.Gemini && !hasGeminiApiKey) { setShowGeminiKeyRequiredModal(true); return; }
        if (llmProvider === LLMProvider.OpenAI && !openAiApiKey) { setShowOpenAiKeyModal(true); return; }
        
        setParaphrasingSceneId(sceneId);
        try {
            const scene = scenes.find(s => s.id === sceneId);
            if (!scene) return;
            const newPrompt = await aivideoauto.paraphrasePrompt(scene.imagePrompt, language as Language, llmProvider);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, imagePrompt: newPrompt } : s));
            setQueuedGeneration({ type: 'image', sceneId });
        } catch (error: any) {
            if (error instanceof aivideoauto.GeminiApiKeyError) {
                setHasGeminiApiKey(false);
                setShowGeminiKeyRequiredModal(true);
                alert(translate('geminiApiKeyErrorMessage'));
            } else if (error instanceof aivideoauto.OpenAiApiKeyError) {
                setOpenAiApiKey(null);
                localStorage.removeItem('openai_api_key');
                setOpenAiApiKeyError(true);
                setShowOpenAiKeyModal(true);
                alert(translate('invalidOpenAiApiKeyError'));
            } else {
                alert(`Failed to paraphrase prompt: ${(error as unknown as Error).message}`);
            }
        } finally {
            setParaphrasingSceneId(null);
        }
    }, [scenes, language, hasGeminiApiKey, openAiApiKey, llmProvider, translate]);

    const handleParaphraseAndGenerateVideo = useCallback(async (sceneId: string) => {
        if (llmProvider === LLMProvider.Gemini && !hasGeminiApiKey) { setShowGeminiKeyRequiredModal(true); return; }
        if (llmProvider === LLMProvider.OpenAI && !openAiApiKey) { setShowOpenAiKeyModal(true); return; }
        
        setParaphrasingSceneId(sceneId);
        try {
            const scene = scenes.find(s => s.id === sceneId);
            if (!scene) return;
            const newPrompt = await aivideoauto.paraphrasePrompt(scene.videoPrompt, language as Language, llmProvider);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, videoPrompt: newPrompt } : s));
            setQueuedGeneration({ type: 'video', sceneId });
        } catch (error: any) {
             if (error instanceof aivideoauto.GeminiApiKeyError) {
                setHasGeminiApiKey(false);
                setShowGeminiKeyRequiredModal(true);
                alert(translate('geminiApiKeyErrorMessage'));
            } else if (error instanceof aivideoauto.OpenAiApiKeyError) {
                setOpenAiApiKey(null);
                localStorage.removeItem('openai_api_key');
                setOpenAiApiKeyError(true);
                setShowOpenAiKeyModal(true);
                alert(translate('invalidOpenAiApiKeyError'));
            } else {
                alert(`Failed to paraphrase prompt: ${(error as unknown as Error).message}`);
            }
        } finally {
            setParaphrasingSceneId(null);
        }
    }, [scenes, language, hasGeminiApiKey, openAiApiKey, llmProvider, translate]);


    const handleDismissOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('onboardingDismissed', 'true');
    };

    const handleHighlightStep = (step: OnboardingStep | null) => {
        setHighlightedStep(step);
    }
    
    const handleVideoUploadForAnalysis = (file: File) => {
        setUploadedVideo(file);
        setVideoAnalysisResult(null);
    };

    const handleAnalyzeVideo = async () => {
        if (llmProvider === LLMProvider.Gemini && !hasGeminiApiKey) {
            setShowGeminiKeyRequiredModal(true);
            return;
        }
        if (llmProvider === LLMProvider.OpenAI && !openAiApiKey) {
            setShowOpenAiKeyModal(true);
            return;
        }
        if (!uploadedVideo) return;
        setIsAnalyzingVideo(true);
        setVideoAnalysisResult(null);
        setSidebarActionProgress('');
        try {
            const result = await aivideoauto.analyzeVideo(
                uploadedVideo,
                language,
                (msg) => setSidebarActionProgress(msg),
                llmProvider
            );
            setVideoAnalysisResult(result);
        } catch (error: any) {
            if (error instanceof aivideoauto.GeminiApiKeyError) {
                setHasGeminiApiKey(false);
                setShowGeminiKeyRequiredModal(true);
                alert(translate('geminiApiKeyErrorMessage'));
            } else if (error instanceof aivideoauto.OpenAiApiKeyError) {
                setOpenAiApiKey(null);
                localStorage.removeItem('openai_api_key');
                setOpenAiApiKeyError(true);
                setShowOpenAiKeyModal(true);
                alert(translate('invalidOpenAiApiKeyError'));
            } else {
                alert((error as unknown as Error).message || 'Failed to analyze video.');
            }
        } finally {
            setIsAnalyzingVideo(false);
            setSidebarActionProgress('');
        }
    };
    
    const handleClearVideoAnalysis = () => {
        setUploadedVideo(null);
        setVideoAnalysisResult(null);
    };

    const handleChatSendMessage = async (message: string) => {
        if (!message.trim()) return;
        if (llmProvider === LLMProvider.Gemini && !hasGeminiApiKey) { setShowGeminiKeyRequiredModal(true); return; }
        if (llmProvider === LLMProvider.OpenAI && !openAiApiKey) { setShowOpenAiKeyModal(true); return; }

        const newUserMessage: ChatMessage = { role: 'user', content: message };
        const newMessages: ChatMessage[] = [...chatMessages, newUserMessage];
        setChatMessages(newMessages);
        setChatIsLoading(true);

        let aiResponseContent = '';
        try {
            const messageStream = aivideoauto.sendChatMessage(newMessages, llmProvider);
            for await (const chunk of messageStream) {
                aiResponseContent += chunk;
                setChatMessages(prev => {
                    const latest = prev[prev.length - 1];
                    if (latest && latest.role === 'ai') {
                        return prev.map((msg, idx) => (idx === prev.length - 1 ? { ...msg, content: aiResponseContent } : msg));
                    } else {
                        const newAIMessage: ChatMessage = { role: 'ai', content: aiResponseContent };
                        return [...prev, newAIMessage];
                    }
                });
            }
        } catch (error: any) {
            if (error instanceof aivideoauto.GeminiApiKeyError) {
                setHasGeminiApiKey(false);
                setShowGeminiKeyRequiredModal(true);
                alert(translate('geminiApiKeyErrorMessage'));
            } else if (error instanceof aivideoauto.OpenAiApiKeyError) {
                setOpenAiApiKey(null);
                localStorage.removeItem('openai_api_key');
                setOpenAiApiKeyError(true);
                setShowOpenAiKeyModal(true);
                alert(translate('invalidOpenAiApiKeyError'));
            } else {
                alert(`Chat failed: ${(error as unknown as Error).message}`);
                setChatMessages(prev => [...prev, { role: 'ai', content: `Error: ${(error as unknown as Error).message}` }]);
            }
        } finally {
            setChatIsLoading(false);
        }
    };

    const onboardingStatus = {
        product: assets.some(a => a.type === 'product'),
        scenario: true,
        storyboard: scenes.length > 0,
        create: scenes.some(s => s.imageUrl),
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen w-screen">{translate('checkingApiKey')}</div>
    }

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
             <ApiKeySelector
                isOpen={showAivideoautoKeyModal}
                onKeySubmit={handleAivideoautoKeySubmit}
                aivideoautoApiKeyError={aivideoautoApiKeyError}
                onClose={handleCloseAivideoautoKeyModal}
                initialKey={aivideoautoApiKey}
            />
            <GeminiKeyRequiredModal
                isOpen={showGeminiKeyRequiredModal}
                onSelectKey={handleGeminiKeySelection}
                onClose={() => setShowGeminiKeyRequiredModal(false)}
            />
            <OpenAiApiKeySelector
                isOpen={showOpenAiKeyModal}
                onKeySubmit={handleOpenAiKeySubmit}
                openAiApiKeyError={openAiApiKeyError}
                onClose={handleCloseOpenAiKeyModal}
                initialKey={openAiApiKey}
            />
             {policyError && <PolicyErrorModal onClose={() => setPolicyError(null)} />}
             <ChatbotModal
                isOpen={showChatbotModal}
                onClose={() => setShowChatbotModal(false)}
                messages={chatMessages}
                onSendMessage={handleChatSendMessage}
                isLoading={chatIsLoading}
             />
             <ModelInfoModal
                isOpen={showModelInfoModal}
                onClose={() => setShowModelInfoModal(false)}
                aivideoautoImageModels={imageModels}
                aivideoautoVideoModels={videoModels}
             />

            <div className="p-2 sm:p-4">
                 <Header
                    language={language}
                    onLanguageChange={setLanguage}
                    imageModels={imageModels}
                    videoModels={videoModels}
                    selectedImageModelId={selectedImageModelId}
                    onImageModelChange={setSelectedImageModelId}
                    selectedVideoModelId={selectedVideoModelId}
                    onVideoModelChange={setSelectedVideoModelId}
                    aivideoautoCredits={aivideoautoCredits}
                    onOpenAivideoautoKeyModal={handleOpenAivideoautoKeyModal}
                    onOpenGeminiKeySelector={handleOpenGeminiKeySelector}
                    onOpenModelInfoModal={() => setShowModelInfoModal(true)}
                    onOpenChatbotModal={() => setShowChatbotModal(true)}
                    llmProvider={llmProvider}
                    onLlmProviderChange={setLlmProvider}
                    onOpenOpenAiKeyModal={handleOpenOpenAiKeyModal}
                />
            </div>
            
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[350px_1fr_350px] gap-4 px-2 sm:px-4 pb-20 lg:pb-4 overflow-hidden">
                <div className={`lg:flex flex-col min-h-0 ${mobileView === 'assets' ? 'flex' : 'hidden'}`}>
                    <RightSidebar
                        assets={assets}
                        onAssetUpload={handleAssetUpload}
                        onAssetDelete={(id) => setAssets(p => p.filter(a => a.assetId !== id))}
                        onAssetLockToggle={(id) => setAssets(p => p.map(a => a.assetId === id ? {...a, locked: !a.locked } : a))}
                        productDescription={productDescription}
                        onProductDescriptionChange={setProductDescription}
                        highlightedStep={highlightedStep}
                        onboardingStatus={onboardingStatus}
                        onVideoUploadForAnalysis={handleVideoUploadForAnalysis}
                        uploadedVideoUrl={uploadedVideoUrl}
                        onAnalyzeVideo={handleAnalyzeVideo}
                        isAnalyzingVideo={isAnalyzingVideo}
                        videoAnalysisResult={videoAnalysisResult}
                        onClearVideoAnalysis={handleClearVideoAnalysis}
                        sidebarActionProgress={sidebarActionProgress}
                    />
                </div>
                <div className={`lg:flex flex-col overflow-hidden min-h-0 ${mobileView === 'canvas' ? 'flex' : 'hidden'}`}>
                    <CenterCanvas
                        scenes={scenes}
                        onGenerateImage={handleGenerateImage}
                        onGenerateVideo={handleGenerateVideo}
                        generatingImageIds={generatingImageIds}
                        generatingVideoIds={generatingVideoIds}
                        aspectRatio={aspectRatio}
                        progressMessages={progressMessages}
                        onboardingStatus={onboardingStatus}
                        highlightedStep={highlightedStep}
                        onParaphraseAndGenerateImage={handleParaphraseAndGenerateImage}
                        onParaphraseAndGenerateVideo={handleParaphraseAndGenerateVideo}
                        paraphrasingSceneId={paraphrasingSceneId}
                    />
                </div>
                <div className={`lg:flex flex-col min-h-0 ${mobileView === 'storyboard' ? 'flex' : 'hidden'}`}>
                    <LeftSidebar
                        scenes={scenes}
                        onScenePromptChange={handleScenePromptChange}
                        onGenerateScenes={handleGenerateScenes}
                        isGeneratingScenes={isGeneratingScenes}
                        onAddScene={handleAddScene}
                        isAddingScene={isAddingScene}
                        aspectRatio={aspectRatio}
                        onAspectRatioChange={setAspectRatio}
                        scenarioType={scenarioType}
                        onScenarioTypeChange={setScenarioType}
                        showOnboarding={showOnboarding}
                        onboardingStatus={onboardingStatus}
                        onDismissOnboarding={handleDismissOnboarding}
                        onHighlightStep={handleHighlightStep}
                        highlightedStep={highlightedStep}
                    />
                </div>
            </div>
            <BottomNavBar activeView={mobileView} onViewChange={setMobileView} />
        </div>
    );
};

export default VideoGenerator;