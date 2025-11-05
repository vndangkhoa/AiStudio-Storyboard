

export enum Language {
  English = 'en',
  Vietnamese = 'vi',
}

export enum AspectRatio {
  Landscape = '16:9',
  Portrait = '9:16',
}

export enum LLMProvider {
  Gemini = 'gemini',
  OpenAI = 'openai',
}

export interface AivideoautoModel {
  id: string;
  name: string;
  type: 'image' | 'video';
  slug: string; // The model identifier slug for API calls, e.g., "veo_3_fast"
  description: string;
}

export interface SceneToken {
    type: 'text' | 'asset';
    value: string; // text content or assetId
}

export interface Scene {
  id:string;
  imagePrompt: string;
  videoPrompt: string; // New field for video-specific instructions
  tokens: SceneToken[];
  duration: number; // in seconds
  imageUrl?: string;
  imageInfo?: any; // To store id_base, url from API
  generatedVideoUrl?: string;
}

export type AssetType = 'product' | 'character' | 'other';

export interface Asset {
  assetId: string;
  type: AssetType;
  url: string; // data URL
  filename: string;
  locked: boolean;
}

export enum ScenarioType {
  Review = 'review',
  Vlog = 'vlog',
  UGC = 'ugc',
}

export type OnboardingStep = 'product' | 'scenario' | 'storyboard' | 'create';

export interface AnalyzedScene {
  startTime: number;
  endTime: number;
  description: string; // for image prompt
  action: string; // for video prompt
}

export interface VideoAnalysisResult {
  hook: string;
  storytelling: string;
  sellingPoints: string[];
  scenes: AnalyzedScene[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}