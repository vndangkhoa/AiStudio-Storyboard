import React, { useRef, useState } from 'react';
import { Asset, AssetType, OnboardingStep, VideoAnalysisResult } from '../types';
import { Upload, Trash2, Lock, Unlock, Loader2, XCircle, CheckCircle, Circle, Eye, ChevronDown, Bot, ClipboardList, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface RightSidebarProps {
    assets: Asset[];
    onAssetUpload: (file: File, type: AssetType) => void;
    onAssetDelete: (assetId: string) => void;
    onAssetLockToggle: (assetId: string) => void;
    productDescription: string;
    onProductDescriptionChange: (description: string) => void;
    // Onboarding
    activeOnboardingStep: OnboardingStep | null;
    onboardingStatus: { product: boolean };
    // Video Analysis
    onVideoUploadForAnalysis: (file: File) => void;
    uploadedVideoUrl: string | null;
    onAnalyzeVideo: () => void;
    isAnalyzingVideo: boolean;
    videoAnalysisResult: VideoAnalysisResult | null;
    onClearVideoAnalysis: () => void;
    sidebarActionProgress: string;
}

const NextStepIndicator: React.FC<{isComplete: boolean, isActive: boolean}> = ({ isComplete, isActive }) => {
    if (isComplete) {
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (isActive) {
        return <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>;
    }
    return <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />;
}


const RightSidebar: React.FC<RightSidebarProps> = ({
    assets, onAssetUpload, onAssetDelete, onAssetLockToggle,
    productDescription, onProductDescriptionChange,
    activeOnboardingStep, onboardingStatus,
    onVideoUploadForAnalysis, uploadedVideoUrl, onAnalyzeVideo, isAnalyzingVideo,
    videoAnalysisResult, onClearVideoAnalysis,
    sidebarActionProgress,
}) => {
    const { t } = useTranslation();
    const productInputRef = useRef<HTMLInputElement>(null);
    const characterInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [isAnalysisVisible, setIsAnalysisVisible] = useState(true);


    const productAsset = assets.find(a => a.type === 'product');
    const characterAsset = assets.find(a => a.type === 'character');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: AssetType) => {
        if (e.target.files && e.target.files[0]) {
            onAssetUpload(e.target.files[0], type);
        }
    };
    
    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onVideoUploadForAnalysis(e.target.files[0]);
        }
    };

    const AssetCard: React.FC<{ asset: Asset }> = ({ asset }) => (
        <div className="relative group bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden">
            <img src={asset.url} alt={asset.filename} className="w-full h-24 object-cover" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onAssetLockToggle(asset.assetId)} className="p-2 bg-white/20 rounded-full hover:bg-white/40 text-white" title={asset.locked ? t('unlock') : t('locked')}>
                    {asset.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </button>
                <button onClick={() => onAssetDelete(asset.assetId)} className="p-2 bg-white/20 rounded-full hover:bg-white/40 text-white" title={t('delete')}>
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {asset.filename.length > 15 ? `${asset.filename.substring(0, 12)}...` : asset.filename}
            </div>
        </div>
    );
    
    const UploadPlaceholder: React.FC<{ onClick: () => void, text: string, showIndicator: boolean }> = ({ onClick, text, showIndicator }) => (
        <button onClick={onClick} className="w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition relative">
            {showIndicator && <div className="absolute top-2 right-2"><NextStepIndicator isComplete={false} isActive={true} /></div>}
            <Upload className="h-6 w-6 mb-1" />
            <span className="text-sm font-medium">{text}</span>
        </button>
    );

    return (
        <aside className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col space-y-4 h-full">
             <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-4">
                {/* Video Analysis Section */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
                    <button onClick={() => setIsAnalysisVisible(!isAnalysisVisible)} className="w-full flex justify-between items-center p-3 text-left">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Eye className="h-5 w-5 text-purple-500"/> {t('videoAnalysisTitle')}
                        </h2>
                        <ChevronDown className={`h-5 w-5 transition-transform ${isAnalysisVisible ? 'rotate-180' : ''}`} />
                    </button>
                    {isAnalysisVisible && (
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-4">
                            <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoFileChange} className="hidden" />
                            {!uploadedVideoUrl && (
                                <button onClick={() => videoInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                <Upload className="h-6 w-6 mb-1" />
                                <span className="text-sm font-medium">{t('uploadVideoForAnalysis')}</span>
                                </button>
                            )}
                            {uploadedVideoUrl && !videoAnalysisResult && (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <video src={uploadedVideoUrl} controls className="w-full rounded-md bg-black"></video>
                                        <button onClick={onClearVideoAnalysis} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/80 transition" title={t('clearVideo')}>
                                            <XCircle className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <button onClick={onAnalyzeVideo} disabled={isAnalyzingVideo} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition">
                                        {isAnalyzingVideo ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="h-4 w-4"/>}
                                        <span>{isAnalyzingVideo ? t('analyzingVideo') : t('analyzeVideo')}</span>
                                    </button>
                                    {isAnalyzingVideo && <p className="text-xs text-center text-slate-500">{sidebarActionProgress || t('analysisMayTakeTime')}</p>}
                                </div>
                            )}
                            {videoAnalysisResult && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                         <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('analysisResults')}</h3>
                                         <button onClick={onClearVideoAnalysis} className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">{t('clearVideo')}</button>
                                    </div>
                                    <div className="space-y-3 text-sm p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                                        <p><strong className="font-semibold text-slate-700 dark:text-slate-300">{t('hook')}:</strong> {videoAnalysisResult.hook}</p>
                                        <p><strong className="font-semibold text-slate-700 dark:text-slate-300">{t('storytelling')}:</strong> {videoAnalysisResult.storytelling}</p>
                                        <div>
                                            <strong className="font-semibold text-slate-700 dark:text-slate-300">{t('sellingPoints')}:</strong>
                                            <ul className="list-disc list-inside pl-2 mt-1">
                                                {videoAnalysisResult.sellingPoints.map((point, i) => <li key={i}>{point}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('scenes')}</h4>
                                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1 -mr-2 text-xs">
                                            {videoAnalysisResult.scenes.map((scene, i) => (
                                                <div key={i} className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                                   <p className="font-semibold">[{scene.startTime}s - {scene.endTime}s] <span className="font-normal">{scene.description}</span></p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Assets & Controls Section */}
                <div className={`transition-all duration-300 p-2 rounded-md ${activeOnboardingStep === 'product' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900' : ''}`}>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{t('assetsTitle')}</h2>
                    <div className="space-y-3">
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <NextStepIndicator isComplete={onboardingStatus.product} isActive={activeOnboardingStep === 'product'} />
                            {t('productTitle')}
                            </h3>
                            <input type="file" accept="image/*" ref={productInputRef} onChange={(e) => handleFileChange(e, 'product')} className="hidden" />
                            {productAsset ? <AssetCard asset={productAsset} /> : <UploadPlaceholder onClick={() => productInputRef.current?.click()} text={t('uploadProduct')} showIndicator={activeOnboardingStep === 'product'} />}
                            {productAsset && (
                                <div className="mt-2">
                                    <label htmlFor="product-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('productDescriptionLabel')}</label>
                                    <textarea 
                                        id="product-description"
                                        rows={4}
                                        value={productDescription}
                                        onChange={e => onProductDescriptionChange(e.target.value)}
                                        className="block w-full text-sm px-3 py-2 rounded bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder={t('productDescriptionPlaceholder')}
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('characterTitle')}</h3>
                            <input type="file" accept="image/*" ref={characterInputRef} onChange={(e) => handleFileChange(e, 'character')} className="hidden" />
                            {characterAsset ? <AssetCard asset={characterAsset} /> : <UploadPlaceholder onClick={() => characterInputRef.current?.click()} text={t('uploadCharacter')} showIndicator={false} />}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;