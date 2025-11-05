import { Scene, Asset, ScenarioType, Language, VideoAnalysisResult, ChatMessage, LLMProvider } from "../types";
import * as aivideoautoApi from './aivideoautoApiService';
import * as geminiApi from './geminiService';
import * as openAiApi from './openAiService';

// --- Re-export Custom Error Types ---
export { ApiKeyError, PolicyViolationError } from './aivideoautoApiService';
export { GeminiApiKeyError } from './geminiService';
export { OpenAiApiKeyError } from './openAiService';

// --- Re-export AIVideoAuto API functions directly ---
export const listModels = aivideoautoApi.listModels;
export const generateSceneImage = aivideoautoApi.generateSceneImage;
export const generateVideoForScene = aivideoautoApi.generateVideoForScene;
export const uploadAsset = aivideoautoApi.uploadAsset;


// --- LLM Orchestration Logic ---

export const generateSceneSuggestions = async (
    scenario: ScenarioType, 
    assets: Asset[], 
    productDescription: string, 
    language: Language,
    llmProvider: LLMProvider
): Promise<Scene[]> => {
    if (llmProvider === LLMProvider.Gemini) {
        return geminiApi.generateSceneSuggestions(scenario, assets, productDescription, language);
    } else {
        return openAiApi.generateSceneSuggestions(scenario, assets, productDescription, language);
    }
};

export const generateNextScene = async (
    scenes: Scene[],
    assets: Asset[],
    productDescription: string,
    language: Language,
    llmProvider: LLMProvider
): Promise<{ imagePrompt: string; videoPrompt: string; }> => {
    if (llmProvider === LLMProvider.Gemini) {
        return geminiApi.generateNextScene(scenes, assets, productDescription, language);
    } else {
        return openAiApi.generateNextScene(scenes, assets, productDescription, language);
    }
};

export const paraphrasePrompt = async (
    prompt: string, 
    language: Language, 
    llmProvider: LLMProvider
): Promise<string> => {
    if (llmProvider === LLMProvider.Gemini) {
        return geminiApi.paraphrasePrompt(prompt, language);
    } else {
        return openAiApi.paraphrasePrompt(prompt, language);
    }
};

export const sendChatMessage = (
    messages: ChatMessage[], 
    llmProvider: LLMProvider
): AsyncGenerator<string> => {
    if (llmProvider === LLMProvider.Gemini) {
        return geminiApi.sendChatMessage(messages);
    } else {
        return openAiApi.sendChatMessage(messages);
    }
};

// --- Video Analysis Orchestration with Frame Extraction ---

const extractFramesFromVideo = (videoFile: File, numFrames: number, onProgress: (message: string) => void): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    onProgress("Initializing video processing...");
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const objectUrl = URL.createObjectURL(videoFile);

    if (!ctx) {
      URL.revokeObjectURL(objectUrl);
      return reject(new Error("Could not create canvas context."));
    }

    video.preload = 'metadata';
    video.muted = true;
    video.src = objectUrl;

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      if (duration === 0 || !isFinite(duration)) {
        URL.revokeObjectURL(objectUrl);
        return reject(new Error("Video has no duration or could not be read."));
      }

      const frames: string[] = [];
      const interval = duration / numFrames;
      
      const seekAndCapture = (time: number): Promise<string | null> => {
        return new Promise((resolveSeek) => {
          video.currentTime = time;
          video.onseeked = () => {
            requestAnimationFrame(() => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              const base64Data = dataUrl.split(',')[1];
              resolveSeek(base64Data || null);
            });
          };
          video.onerror = () => resolveSeek(null);
        });
      };

      for (let i = 0; i < numFrames; i++) {
        onProgress(`Extracting frame ${i + 1} of ${numFrames}...`);
        const time = i * interval;
        const frameData = await seekAndCapture(time);
        if (frameData) {
            frames.push(frameData);
        } else {
            console.warn(`Could not capture frame at time ${time}`);
        }
      }
      
      URL.revokeObjectURL(objectUrl);
      resolve(frames);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Error loading video file for frame extraction."));
    };
  });
};


export const analyzeVideo = async (
    videoFile: File,
    language: Language,
    onProgress: (message: string) => void,
    llmProvider: LLMProvider
): Promise<VideoAnalysisResult> => {
    const base64Frames = await extractFramesFromVideo(videoFile, 10, onProgress);
    if (base64Frames.length === 0) {
        throw new Error("No frames could be extracted from the video for analysis.");
    }
    onProgress("Sending frames to AI for analysis...");

    if (llmProvider === LLMProvider.Gemini) {
        return geminiApi.analyzeVideo(base64Frames, language);
    } else {
        return openAiApi.analyzeVideo(base64Frames, language);
    }
};
