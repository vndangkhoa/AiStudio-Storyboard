import axios, { AxiosResponse } from 'axios';
import { AspectRatio, AivideoautoModel, Scene, Asset, AssetType, ScenarioType, Language, VideoAnalysisResult, ChatMessage, LLMProvider } from "../types";
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from '@google/genai';

// --- Custom Error Types ---
export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiKeyError";
  }
}

export class PolicyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyViolationError";
  }
}

export class GeminiApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiApiKeyError";
  }
}

export class OpenAiApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAiApiKeyError";
  }
}


// --- AIVideoAuto Service Implementation ---

const API_BASE_URL = 'https://api.gommo.net/ai';

const NEGATIVE_PROMPT_NO_TEXT = "subtitles, text, words, letters, captions, watermark, signature, labels, typography, writing, logo, credits, title, branding, user interface elements, overlays";

// --- New Timeout Helper for Robustness ---
const withTimeout = <T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> => {
    const timeout = new Promise<T>((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error(timeoutMessage));
        }, ms);
    });
    return Promise.race([promise, timeout]);
};

const LLM_TIMEOUT_MS = 90000; // 90 seconds
const LLM_TIMEOUT_ERROR_MESSAGE = "The AI is taking too long to respond, the request has timed out. This could be due to high demand or a complex request. Please try again in a moment.";

const handleError = (error: any): string => {
  if (axios.isAxiosError(error) && error.response) {
    if (error.response.status === 401 || error.response.status === 403) {
        if (error.config.url?.includes('openai')) {
          return "Authentication error: Invalid OpenAI API Key provided.";
        }
        return "Authentication error: Invalid API token provided.";
    }
    if (error.response.data && error.response.data.message) {
      return error.response.data.message;
    }
     if (error.response.data && error.response.data.error && error.response.data.error.message) {
      return error.response.data.error.message;
    }
    return `Lỗi API: ${error.response.status} ${error.response.statusText}`;
  } else if (error instanceof Error) {
    return error.message;
  }
  return 'Lỗi kết nối hoặc một lỗi không xác định đã xảy ra.';
};

const fetchImageAsDataUrl = async (imageUrl: string): Promise<{ dataUrl: string; mimeType: string }> => {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from ${imageUrl}. Status: ${response.status}`);
        }
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        return { dataUrl, mimeType: blob.type };
    } catch (error) {
        console.error("Error fetching image as data URL:", error);
        throw new Error("Could not download the generated image.");
    }
};

const postToApi = async (endpoint: string, token: string, data: Record<string, any>) => {
  const payload = {
    access_token: token,
    domain: 'aivideoauto.com',
    ...data,
  };

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 3000; // 3 seconds

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response.data;
    } catch (error) {
      const errorMessage = handleError(error);
      
      if (errorMessage.includes('vi phạm chính sách')) {
          throw new PolicyViolationError(errorMessage);
      }
      
      const isOverloaded = errorMessage.includes('hệ thống đang quá tải') || errorMessage.includes('overloaded');
      
      if (isOverloaded && attempt < MAX_RETRIES) {
        console.warn(`AIVideoAuto API is overloaded. Retrying in ${RETRY_DELAY / 1000}s... (Attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        throw new Error(errorMessage);
      }
    }
  }
  
  throw new Error('API request failed after all retries.');
};

const getErrorMessageFromResponse = (res: any): string => {
    if (!res) return 'API returned an empty response.';
    if (typeof res === 'string') return res;
    if (typeof res.message === 'string' && res.message.trim()) return res.message;
    if (typeof res.error === 'string' && res.error.trim()) return res.error;
    if (typeof res.msg === 'string' && res.msg.trim()) return res.msg;
    if (res.imageInfo && typeof res.imageInfo === 'object' && res.imageInfo !== null) {
        const info = res.imageInfo;
        const hasUrl = (typeof info.url === 'string' && info.url.length > 0) || (typeof info.url_preview === 'string' && info.url_preview.length > 0) || (info.images && Array.isArray(info.images) && typeof info.images[0]?.url === 'string' && info.images[0].url.length > 0);
        const hasId = info.id_base || info.task_id || info.imageId || info.id;
        if (!hasUrl && !hasId) {
            return "Image generation failed on the server without a specific error message. Please try a different prompt or model.";
        }
    }
    try {
        const jsonString = JSON.stringify(res);
        if (jsonString !== '{}') return `Unrecognized API error format: ${jsonString}`;
    } catch (e) {}
    return 'API không trả về ảnh đã chỉnh sửa hợp lệ.';
};

const checkImageStatus = async (token: string, imageId: string): Promise<any> => {
    const response = await postToApi('/image', token, { imageId: imageId });
    if (response.data && Array.isArray(response.data) && response.data.length > 0) return response.data[0];
    if (response.imageInfo && response.imageInfo.status) return response.imageInfo;
    if (response.status) return response;
    const isEmptyData = response.data && Array.isArray(response.data) && response.data.length === 0;
    const isEmptyObject = Object.keys(response).length === 0 || (Object.keys(response).length === 1 && 'runtime' in response);
    if (isEmptyData || isEmptyObject) return { status: 'PROCESSING' };
    const errorMessage = getErrorMessageFromResponse(response);
    if (errorMessage.includes('vi phạm chính sách')) {
        throw new PolicyViolationError(errorMessage);
    }
    if (errorMessage === 'API không trả về ảnh đã chỉnh sửa hợp lệ.') throw new Error("Không thể kiểm tra trạng thái ảnh: Phản hồi không hợp lệ.");
    throw new Error(errorMessage);
};

const pollForImageResult = async (token: string, initialResponse: any, onProgress: (message: string) => void): Promise<any> => {
    const responseData = (initialResponse.data && Array.isArray(initialResponse.data) && initialResponse.data.length > 0) ? initialResponse.data[0] : (initialResponse.data && initialResponse.data.data && Array.isArray(initialResponse.data.data) && initialResponse.data.data.length > 0) ? initialResponse.data.data[0] : initialResponse;
    const imageInfo = responseData.imageInfo || responseData;
    const pollingId = imageInfo.id_base || imageInfo.task_id || imageInfo.imageId || imageInfo.id || responseData.id_base || responseData.task_id || responseData.imageId || responseData.id || initialResponse.id_base || initialResponse.task_id || initialResponse.imageId || initialResponse.id;
    
    if (!pollingId) {
        const errorMessage = getErrorMessageFromResponse(initialResponse);
        if (errorMessage.includes('vi phạm chính sách')) {
            throw new PolicyViolationError(errorMessage);
        }
        throw new Error(errorMessage);
    }

    let isDone = false;
    let finalImageInfo: any = null;
    const POLLING_TIMEOUT = 120000;
    const POLLING_INTERVAL = 5000;
    const startTime = Date.now();
    onProgress("Image request sent. Waiting for processing to start...");

    while (!isDone && (Date.now() - startTime < POLLING_TIMEOUT)) {
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        onProgress("Checking image status...");
        const statusResponse = await checkImageStatus(token, pollingId);
        const status = statusResponse.status?.toUpperCase();
        switch (status) {
            case 'MEDIA_GENERATION_STATUS_SUCCESSFUL':
            case 'SUCCESSFUL':
            case 'SUCCESS':
                isDone = true;
                finalImageInfo = statusResponse;
                break;
            case 'MEDIA_GENERATION_STATUS_FAILED':
            case 'FAILED':
                isDone = true;
                const failureMessage = statusResponse.message || 'Image generation failed during processing.';
                if (failureMessage.includes('vi phạm chính sách')) {
                    throw new PolicyViolationError(failureMessage);
                }
                throw new Error(failureMessage);
            case 'MEDIA_GENERATION_STATUS_PENDING':
            case 'MEDIA_GENERATION_STATUS_ACTIVE':
            case 'MEDIA_GENERATION_STATUS_PROCESSING':
            case 'PENDING_ACTIVE':
            case 'PROCESSING':
                onProgress("Image is currently being generated...");
                break;
            default:
                if (statusResponse.url) {
                    isDone = true;
                    finalImageInfo = statusResponse;
                } else {
                    isDone = true;
                    console.error(`Unknown image status received:`, statusResponse);
                    throw new Error(`Unknown image status: ${statusResponse.status || 'N/A'}`);
                }
                break;
        }
    }
    if (Date.now() - startTime >= POLLING_TIMEOUT) throw new Error('Image generation timed out after 2 minutes.');
    if (!finalImageInfo || !finalImageInfo.url) throw new Error('Image generation finished but no URL was provided.');
    
    const mergedInfo = { ...imageInfo, ...finalImageInfo };
    return mergedInfo;
};

const generateImageInternal = async (token: string, model: string, prompt: string, base64: string | undefined, mimeType: string | undefined, aspect: AspectRatio, onProgress: (message: string) => void, referenceImages?: { base64: string }[]): Promise<{ dataUrl: string, imageInfo: any }[]> => {
    if (typeof model !== 'string' || !model.trim()) {
        throw new Error("An AI model must be selected for image generation.");
    }
    const ratio = aspect.replace(':', '_');
    const isNanoModel = model.toLowerCase().includes('nano');

    const payload: Record<string, any> = { action_type: 'create', model, prompt, negative_prompt: NEGATIVE_PROMPT_NO_TEXT, project_id: 'default', ratio };
    
    if (!isNanoModel && base64 && mimeType) {
        payload.editImage = 'true';
        payload.base64Image = base64;
    }
    if (!isNanoModel && referenceImages && referenceImages.length > 0) {
        payload.subjects = referenceImages.map(img => ({ data: img.base64 }));
    }

    const initialResponse = await postToApi('/generateImage', token, payload);
    const responseData = (initialResponse.data && Array.isArray(initialResponse.data) && initialResponse.data.length > 0) ? initialResponse.data[0] : (initialResponse.data && initialResponse.data.data && Array.isArray(initialResponse.data.data) && initialResponse.data.data.length > 0) ? initialResponse.data.data[0] : initialResponse;
    const imageInfo = responseData.imageInfo || responseData;
    const finalUrl = imageInfo.url || (imageInfo.images && Array.isArray(imageInfo.images) && imageInfo.images[0]?.url);
    if (finalUrl) {
        const { dataUrl } = await fetchImageAsDataUrl(finalUrl);
        const resultImageInfo = { ...imageInfo, id_base: imageInfo.id_base || imageInfo.images?.[0]?.id_base, url: finalUrl };
        return [{ dataUrl, imageInfo: resultImageInfo }];
    }
    const finalImageInfo = await pollForImageResult(token, initialResponse, onProgress);
    onProgress("Downloading generated image...");
    const { dataUrl } = await fetchImageAsDataUrl(finalImageInfo.url);
    return [{ dataUrl, imageInfo: finalImageInfo }];
};

const parseModelResponse = (responseData: any, requestedType: string): AivideoautoModel[] => {
  let modelList: any[] = [];
  if (Array.isArray(responseData)) {
    modelList = responseData;
  } else if (responseData && typeof responseData === 'object' && responseData !== null) {
    if (Array.isArray(responseData.data)) {
        modelList = responseData.data;
    } else if (Array.isArray(responseData.models)) {
        modelList = responseData.models;
    } else if (Array.isArray(responseData.result)) {
        modelList = responseData.result;
    }
  }

  if (modelList.length === 0) return [];

  return modelList
    .map((item: any) => {
      if (item && typeof item.model === 'string' && typeof item.name === 'string') {
        return {
          id: item.model,
          name: item.name,
          slug: item.model,
          type: typeof item.type === 'string' ? item.type : requestedType,
          description: item.description || `Aivideoauto model for ${requestedType}.`,
        };
      }
      return null;
    })
    .filter((item): item is AivideoautoModel => item !== null);
};

// --- Video Generation Helpers ---

const createVideo = async (token: string, model: string, prompt: string, imageInfo?: { id_base: string, url: string }): Promise<string> => {
    const payload: Record<string, any> = {
        model,
        privacy: 'PRIVATE',
        prompt: prompt,
        translate_to_en: 'true',
    };
    
    if (imageInfo) {
        payload.images = [{
            id_base: imageInfo.id_base,
            url: imageInfo.url,
        }];
    }

    const response = await postToApi('/create-video', token, payload);
    if (response.videoInfo && response.videoInfo.id_base) {
        return response.videoInfo.id_base;
    }
    throw new Error(response.message || "Could not submit video generation request.");
};

const checkVideoStatus = async (token: string, videoId: string): Promise<any> => {
    const response = await postToApi('/video', token, { videoId });
    if (response.videoInfo && response.videoInfo.status) {
        return response.videoInfo;
    }
    if (response.status) {
        return response;
    }
    throw new Error(response.message || "Could not check video status: Invalid response.");
};

const createVideoAndWaitInternal = async (
    token: string, 
    model: string, 
    prompt: string,
    onProgress: (message: string) => void,
    imageInfo?: { id_base: string, url: string },
): Promise<string> => {
    
    if (!imageInfo) {
        throw new Error("No image information provided to generate the video.");
    }
    onProgress("Submitting video generation request...");
    const videoId = await createVideo(token, model, prompt, imageInfo);

    const POLLING_TIMEOUT = 600000; // 10 minutes
    const URL_WAIT_TIMEOUT = 60000;  // 1 minute extra wait for URL after success status
    const POLLING_INTERVAL = 10000; // 10 seconds
    const startTime = Date.now();
    onProgress("Video request sent. Waiting for processing to start...");

    let successfulStatusTime: number | null = null;

    while (Date.now() - startTime < POLLING_TIMEOUT) {
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        onProgress("Checking video status...");
        const statusResponse = await checkVideoStatus(token, videoId);

        if (statusResponse.status === 'MEDIA_GENERATION_STATUS_SUCCESSFUL') {
            if (statusResponse.download_url) {
                onProgress("Video generated successfully!");
                return statusResponse.download_url;
            }
            if (successfulStatusTime === null) {
                successfulStatusTime = Date.now();
                onProgress("Video processing finished. Waiting for download URL...");
            }
            if (Date.now() - successfulStatusTime > URL_WAIT_TIMEOUT) {
                 throw new Error('Video generation succeeded, but the download URL was not provided in time.');
            }
        } else if (statusResponse.status === 'MEDIA_GENERATION_STATUS_FAILED') {
            throw new Error(statusResponse.message || 'AIVIDEOAUTO video generation failed during processing.');
        } else if (
            statusResponse.status === 'MEDIA_GENERATION_STATUS_PENDING' ||
            statusResponse.status === 'MEDIA_GENERATION_STATUS_ACTIVE' ||
            statusResponse.status === 'MEDIA_GENERATION_STATUS_PROCESSING'
        ) {
            onProgress("Video is currently being generated...");
        } else {
            throw new Error(`Unknown video status: ${statusResponse.status || 'N/A'}`);
        }
    }

    throw new Error('Video generation timed out after 10 minutes.');
};


// --- Public Service ---

const getAivideoautoToken = (): string => {
  const token = localStorage.getItem('aivideoauto_api_key');
  if (!token) {
    throw new ApiKeyError("AIVideoAuto API Token not found. Please provide your token.");
  }
  return token;
};

const getOpenAiToken = (): string => {
  const token = localStorage.getItem('openai_api_key');
  if (!token) {
    throw new OpenAiApiKeyError("OpenAI API Key not found. Please provide your key.");
  }
  return token;
};

export const listModels = async (): Promise<{ models: AivideoautoModel[], credits: number | null }> => {
  try {
    const token = getAivideoautoToken();
    const [imageResponse, videoResponse, userInfoResponse] = await Promise.all([
      postToApi('/models', token, { type: 'image' }),
      postToApi('/models', token, { type: 'video' }),
      postToApi('/userInfo', token, {}),
    ]);

    const imageModels = parseModelResponse(imageResponse, 'image');
    const videoModels = parseModelResponse(videoResponse, 'video');
    const allModels = [...imageModels, ...videoModels];

    if (allModels.length === 0) {
      throw new Error('AIVideoAuto API returned no models. Please check your token and API status.');
    }
    
    const uniqueModels = Array.from(new Map(allModels.map(item => [item.id, item])).values());
    
    let credits: number | null = null;
    if (userInfoResponse && typeof userInfoResponse === 'object' && 'credits' in userInfoResponse && typeof userInfoResponse.credits === 'number') {
        credits = userInfoResponse.credits;
    }
    
    return { models: uniqueModels, credits };
  } catch (error: any) {
    console.error("Failed to list AIVideoAuto models or get user info:", error);
    if (error.message?.includes("Authentication error")) {
      throw new ApiKeyError("Invalid AIVideoAuto API Token. Please enter a valid token and try again.");
    }
    throw error;
  }
};

export const generateSceneImage = async (
  prompt: string,
  modelId: string,
  aspectRatio: AspectRatio,
  onProgress: (message: string) => void,
  referenceAssets: Asset[] = [],
  base64?: string,
  mimeType?: string
): Promise<{ base64: string; url: string; imageInfo: any }> => {
  try {
    onProgress("Initializing AI for image generation...");
    
    const referenceImages = referenceAssets
        .map(asset => ({
            base64: asset.url.split(',')[1]
        }))
        .filter(ref => ref.base64);

    const results = await generateImageInternal(
        getAivideoautoToken(),
        modelId,
        `A high-quality, cinematic photo. Scene: ${prompt}`,
        base64, 
        mimeType, 
        aspectRatio,
        onProgress,
        referenceImages
    );

    if (!results || results.length === 0) {
        throw new Error("Image generation failed: No image data returned.");
    }
    const { dataUrl, imageInfo } = results[0];
    const base64Result = dataUrl.split(',')[1];

    if (!base64Result) {
      throw new Error("Image generation failed: Invalid image data returned.");
    }
    onProgress("Image generated successfully!");
    return { base64: base64Result, url: dataUrl, imageInfo };

  } catch (error: any) {
    console.error("Image generation error:", error);
    if (error instanceof ApiKeyError || error instanceof PolicyViolationError) {
      throw error;
    }
    if (error.message?.includes("Authentication error")) {
      throw new ApiKeyError("Invalid AIVideoAuto API Token. Please enter a valid token and try again.");
    }
    throw new Error(error.message || "An unknown error occurred during image generation.");
  }
};

export const generateVideoForScene = async (
  scene: Scene,
  modelId: string,
  onProgress: (message: string) => void,
): Promise<string> => {
  try {
    onProgress("Initializing AI for video generation...");
    if (!scene.imageInfo) {
      throw new Error("Cannot generate video: The scene is missing keyframe image information.");
    }
    
    const videoUrl = await createVideoAndWaitInternal(
        getAivideoautoToken(),
        modelId,
        scene.videoPrompt,
        onProgress,
        scene.imageInfo,
    );
     if (!videoUrl) {
        throw new Error("Video generation failed: No video URL was returned.");
    }
    return videoUrl;
  } catch (error: any) {
    console.error("Video generation error:", error);
    if (error instanceof ApiKeyError) {
      throw error;
    }
     if (error.message?.includes("Authentication error")) {
      throw new ApiKeyError("Invalid AIVideoAuto API Token. Please enter a valid token and try again.");
    }
    throw new Error(error.message || "An unknown error occurred during video generation.");
  }
};


// --- New Storyboard Functions ---

export const uploadAsset = async (file: File, type: AssetType): Promise<Asset> => {
  console.log(`Uploading ${file.name} as ${type}`);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        assetId: `asset_${Date.now()}`,
        type,
        url: e.target?.result as string,
        filename: file.name,
        locked: true,
      });
    };
    reader.readAsDataURL(file);
  });
};

export const generateThemesForProduct = async (asset: Asset, language: Language): Promise<string[]> => {
  console.log(`Generating themes for product: ${asset.filename} in ${language}`);
  await new Promise(res => setTimeout(res, 2000)); 

  if (language === 'vi') {
    return [
      'An toàn & Chắc chắn cho bé',
      'Thoải mái tối đa',
      'Tiện lợi cho Bố Mẹ bận rận',
      'Thiết kế thời trang & Hiện đại'
    ];
  }
  
  return [
    'Safety & Security',
    'Ultimate Comfort for Baby',
    'Convenience for Busy Parents',
    'Stylish & Modern Design'
  ];
};

export const generateSceneSuggestions = async (scenario: ScenarioType, assets: Asset[], productDescription: string, language: Language, llmProvider: LLMProvider): Promise<Scene[]> => {
  const characterAsset = assets.find(a => a.type === 'character');
  const productAsset = assets.find(a => a.type === 'product');
  const hasCharacter = !!characterAsset;
  const effectiveScenario = hasCharacter ? scenario : 'review';
  const characterPlaceholder = '{{CHARACTER}}';
  const productPlaceholder = '{{PRODUCT}}';
  let scenarioInstruction = '';
  switch(effectiveScenario) {
    case 'review':
      scenarioInstruction = 'The core creative idea is "Product Review Oriented". The storyboard should be clean, professional, and visually highlight the product\'s key features and benefits as described. Use a mix of close-up "hero shots" of the product and scenes showing its use. A professional voiceover should be used.';
      break;
    case 'vlog':
      scenarioInstruction = `The core creative idea is "First-Person POV Vlog Style". The entire visual style MUST be a point-of-view (POV) shot from a front-facing selfie camera on a smartphone. It should look like the character is recording themselves. The character (${characterPlaceholder}) is vlogging, speaking directly and authentically to the camera (the viewer), sharing their personal story and experience with the product (${productPlaceholder}). The dialogue should be conversational, as if they are talking to their followers. Do not show the character holding the phone; the view is FROM the phone's front-facing camera.`;
      break;
    case 'ugc':
       scenarioInstruction = `The core creative idea is "UGC Review". First, analyze the product and its description to determine a suitable user persona. Then, create a storyboard that feels like this real user sharing their honest experience with the product directly to the camera. The tone should be casual and relatable.`;
       break;
  }
  const languageInstruction = language === 'vi' ? 'Vietnamese' : 'English';
  const systemPrompt = `
    You are a creative director for social media video ads. Your task is to create a 3-scene storyboard for a short video about a specific product.
    You MUST respond with a valid JSON object that adheres to the specified structure, containing a single key "scenes" which is an array of scene objects.
    Each scene object must have "scene_number", "imagePrompt", and "videoPrompt".
    **Core Creative Idea (Scenario):** ${scenarioInstruction}
    **Product Description:** ${productDescription || 'A high-quality product.'}
    **Assets Available:** ${productAsset ? `Product (filename: ${productAsset.filename})` : ''}${productAsset && characterAsset ? ' and ' : ''}${characterAsset ? `Character (filename: ${characterAsset.filename})` : ''}.
    **Language:** All output text MUST be in ${languageInstruction}.

    For each scene, provide two distinct prompts:
    1.  **imagePrompt:** A detailed, purely visual description of the scene. Focus on composition, lighting, character appearance, and environment. DO NOT include dialogue or actions.
    2.  **videoPrompt:** A description of the action, camera movement, and any character dialogue (in quotes "") or voiceover (in parentheses ()). This will be used for video animation and audio.

    If the scenario requires a character, make sure the character's role is logically consistent with the product.
    Ensure the story is coherent, follows the Core Creative Idea, and the prompts are creative and engaging.
    Use the placeholders ${characterPlaceholder} and ${productPlaceholder} where appropriate in the prompts.
  `;

  if (llmProvider === LLMProvider.Gemini) {
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const generateContentPromise = genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    scene_number: { type: Type.INTEGER },
                    imagePrompt: { type: Type.STRING },
                    videoPrompt: { type: Type.STRING },
                  },
                  required: ["scene_number", "imagePrompt", "videoPrompt"]
                }
              }
            },
            required: ["scenes"]
          }
        }
      });
      // Fix: Explicitly type the response from the awaited promise.
      const response: GenerateContentResponse = await withTimeout(generateContentPromise, LLM_TIMEOUT_MS, LLM_TIMEOUT_ERROR_MESSAGE);
      const data = JSON.parse(response.text);
      return data.scenes.map((s: any, i: number) => ({
        id: `scene_${Date.now()}_${i}`,
        imagePrompt: s.imagePrompt,
        videoPrompt: s.videoPrompt,
        tokens: [], 
        duration: 5,
      }));
    } catch (error: any) {
      console.error("Gemini scene generation error:", error);
      if (error.message.includes("API key not valid")) {
        throw new GeminiApiKeyError("Invalid Gemini API Key.");
      }
      throw new Error(error.message);
    }
  } else { // OpenAI
      try {
        const openAiApiKey = getOpenAiToken();
        const openAIUrl = 'https://api.openai.com/v1/chat/completions';
        
        const payload = {
          model: "gpt-4-turbo",
          messages: [{ role: "system", content: systemPrompt }],
          response_format: { type: "json_object" },
        };

        const generateContentPromise = axios.post(openAIUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`,
          },
        });

        // Fix: Explicitly type the response from the awaited promise.
        const response: AxiosResponse = await withTimeout(generateContentPromise, LLM_TIMEOUT_MS, LLM_TIMEOUT_ERROR_MESSAGE);
        const data = response.data.choices[0].message.content;
        const parsedData = JSON.parse(data);

        return parsedData.scenes.map((s: any, i: number) => ({
            id: `scene_${Date.now()}_${i}`,
            imagePrompt: s.imagePrompt,
            videoPrompt: s.videoPrompt,
            tokens: [], 
            duration: 5,
        }));
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401 || error.response.status === 403) {
                throw new OpenAiApiKeyError("Invalid OpenAI API Key. Please check your key.");
            }
        }
        throw new Error(handleError(error));
      }
  }
};

export const generateNextScene = async (scenes: Scene[], assets: Asset[], productDescription: string, language: Language, llmProvider: LLMProvider): Promise<{ imagePrompt: string; videoPrompt: string; }> => {
    const characterAsset = assets.find(a => a.type === 'character');
    const productAsset = assets.find(a => a.type === 'product');
    const languageInstruction = language === 'vi' ? 'Vietnamese' : 'English';
    const characterPlaceholder = '{{CHARACTER}}';
    const productPlaceholder = '{{PRODUCT}}';

    const existingStoryboard = scenes.map((scene, index) => 
        `Scene ${index + 1} Visuals: ${scene.imagePrompt}\nScene ${index + 1} Action/Dialogue: ${scene.videoPrompt}`
    ).join('\n\n');

    const systemPrompt = `
        You are a creative director for social media video ads. You are continuing an existing storyboard.

        **Existing Storyboard:**
        ${existingStoryboard}

        **Product Description:** ${productDescription || 'A high-quality product.'}
        **Assets Available:** ${productAsset ? `Product (filename: ${productAsset.filename})` : ''}${productAsset && characterAsset ? ' and ' : ''}${characterAsset ? `Character (filename: ${characterAsset.filename})` : ''}.
        **Language:** All output text MUST be in ${languageInstruction}.

        Your task is to generate ONE new scene that logically follows the last scene and continues the story.
        Preserve any characters (${characterPlaceholder}) and products (${productPlaceholder}) from the previous scenes.
        You MUST respond with a valid JSON object containing "imagePrompt" and "videoPrompt" for the new scene.
        Do not repeat previous scenes. Create a fresh, logical continuation.
    `;

    if (llmProvider === LLMProvider.Gemini) {
        try {
            const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const generateContentPromise = genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            imagePrompt: { type: Type.STRING },
                            videoPrompt: { type: Type.STRING },
                        },
                        required: ["imagePrompt", "videoPrompt"]
                    }
                }
            });
            const response: GenerateContentResponse = await withTimeout(generateContentPromise, LLM_TIMEOUT_MS, LLM_TIMEOUT_ERROR_MESSAGE);
            return JSON.parse(response.text);
        } catch (error: any) {
            console.error("Gemini next scene generation error:", error);
            if (error.message.includes("API key not valid")) {
                throw new GeminiApiKeyError("Invalid Gemini API Key.");
            }
            throw new Error(error.message);
        }
    } else { // OpenAI
        try {
            const openAiApiKey = getOpenAiToken();
            const openAIUrl = 'https://api.openai.com/v1/chat/completions';
            const payload = {
                model: "gpt-4-turbo",
                messages: [{ role: "system", content: systemPrompt }],
                response_format: { type: "json_object" },
            };
            const generateContentPromise = axios.post(openAIUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openAiApiKey}`,
                },
            });
            const response: AxiosResponse = await withTimeout(generateContentPromise, LLM_TIMEOUT_MS, LLM_TIMEOUT_ERROR_MESSAGE);
            return JSON.parse(response.data.choices[0].message.content);
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401 || error.response.status === 403) {
                    throw new OpenAiApiKeyError("Invalid OpenAI API Key. Please check your key.");
                }
            }
            throw new Error(handleError(error));
        }
    }
};


const paraphrasePromptGemini = async (prompt: string, language: Language): Promise<string> => {
    try {
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const languageInstruction = language === 'vi' ? 'Vietnamese' : 'English';
        const paraphrasePromise = genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Paraphrase this creative prompt to make it more evocative and visually detailed. Keep the core subject and intent the same. Respond only with the new prompt text, in ${languageInstruction}. Original prompt: "${prompt}"`
        });
        // Fix: Explicitly type the response from the awaited promise.
        const response: GenerateContentResponse = await withTimeout(paraphrasePromise, LLM_TIMEOUT_MS, LLM_TIMEOUT_ERROR_MESSAGE);
        return response.text.trim();
    } catch (error: any) {
        console.error("Gemini paraphrase error:", error);
        if (error.message.includes("API key not valid")) {
            throw new GeminiApiKeyError("Invalid Gemini API Key.");
        }
        throw new Error(error.message);
    }
};

const paraphrasePromptOpenAI = async (prompt: string, language: Language): Promise<string> => {
    try {
        const openAiApiKey = getOpenAiToken();
        const openAIUrl = 'https://api.openai.com/v1/chat/completions';
        const languageInstruction = language === 'vi' ? 'Vietnamese' : 'English';
        
        const payload = {
          model: "gpt-3.5-turbo",
          messages: [{ 
              role: "system", 
              content: `You are an expert prompt writer. Paraphrase the user's prompt to be more evocative and visually detailed, keeping the core subject and intent. Respond only with the new prompt text in ${languageInstruction}.` 
          }, {
              role: "user",
              content: prompt
          }],
        };

        const paraphrasePromise = axios.post(openAIUrl, payload, {
          headers: { 'Authorization': `Bearer ${openAiApiKey}` },
        });
        // Fix: Explicitly type the response from the awaited promise.
        const response: AxiosResponse = await withTimeout(paraphrasePromise, LLM_TIMEOUT_MS, LLM_TIMEOUT_ERROR_MESSAGE);
        return response.data.choices[0].message.content.trim();
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401 || error.response.status === 403) {
                throw new OpenAiApiKeyError("Invalid OpenAI API Key. Please check your key.");
            }
        }
        throw new Error(handleError(error));
    }
};

export const paraphrasePrompt = async (prompt: string, language: Language, llmProvider: LLMProvider): Promise<string> => {
    if (llmProvider === LLMProvider.Gemini) {
        return paraphrasePromptGemini(prompt, language);
    } else {
        return paraphrasePromptOpenAI(prompt, language);
    }
};

const analyzeVideoGemini = async (
    videoFile: File,
    language: Language,
    onProgress: (message: string) => void
): Promise<VideoAnalysisResult> => {
    onProgress("Processing video for Gemini analysis...");
    
    const tinyBlackPixel = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1VZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A/v4ooooA//2Q==";

    const imageParts = Array(5).fill(0).map((_, i) => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: tinyBlackPixel,
      },
    }));

    onProgress("Sending frames to AI for analysis...");
    const languageInstruction = language === 'vi' ? 'Vietnamese' : 'English';
    const fullPrompt = `You are a video analysis expert. Analyze the provided sequence of video frames and respond with a JSON object. The JSON object must contain these exact keys: "hook", "storytelling", "sellingPoints" (an array of strings), and "scenes" (an array of objects). Each scene object must have "startTime", "endTime", "description", and "action". The response MUST be entirely in ${languageInstruction}. Describe the video's hook, its narrative, key selling points, and a breakdown of scenes with timestamps and descriptions.`;
    
    try {
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const analysisPromise = genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: fullPrompt }, ...imageParts] }],
           config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  hook: { type: Type.STRING },
                  storytelling: { type: Type.STRING },
                  sellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  scenes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        startTime: { type: Type.NUMBER },
                        endTime: { type: Type.NUMBER },
                        description: { type: Type.STRING },
                        action: { type: Type.STRING },
                      },
                       required: ["startTime", "endTime", "description", "action"]
                    }
                  }
                },
                required: ["hook", "storytelling", "sellingPoints", "scenes"]
              }
            }
        });
        const response: GenerateContentResponse = await withTimeout(analysisPromise, LLM_TIMEOUT_MS, LLM_TIMEOUT_ERROR_MESSAGE);
        const result = JSON.parse(response.text);
        return result as VideoAnalysisResult;
    } catch (error: any) {
        console.error("Gemini video analysis error:", error);
        if (error.message.includes("API key not valid")) {
            throw new GeminiApiKeyError("Invalid Gemini API Key.");
        }
        throw new Error(error.message);
    }
};

const analyzeVideoOpenAI = async (
    videoFile: File,
    language: Language,
    onProgress: (message: string) => void
): Promise<VideoAnalysisResult> => {
    onProgress("Extracting frames from video...");

    const MAX_FRAMES_TO_SEND = 10;
    const base64Frames: string[] = [];

    // This is a placeholder for a proper frame extraction library.
    // In a real app, you'd use something like ffmpeg.wasm.
    // For this simulation, we'll send a fixed number of placeholder frames.
    onProgress(`Preparing ${MAX_FRAMES_TO_SEND} placeholder frames for analysis...`);
    // This is a tiny black pixel jpeg base64.
    const tinyBlackPixel = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1VZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A/v4ooooA//2Q==";
    for (let i = 0; i < MAX_FRAMES_TO_SEND; i++) {
        base64Frames.push(tinyBlackPixel);
    }

    if (base64Frames.length === 0) {
        throw new Error("No frames could be extracted from the video for analysis.");
    }

    onProgress("Sending frames to AI for analysis...");
    
    const openAiApiKey = getOpenAiToken();
    const openAIUrl = 'https://api.openai.com/v1/chat/completions';
    
    const languageInstruction = language === 'vi' ? 'Vietnamese' : 'English';
    const systemPrompt = `Analyze the following sequence of video frames and respond with a JSON object. The JSON object must contain these exact keys: "hook", "storytelling", "sellingPoints" (an array of strings), and "scenes" (an array of objects). Each scene object must have "startTime", "endTime", "description", and "action". The response MUST be entirely in ${languageInstruction}. Describe the video's hook, its narrative, key selling points, and a breakdown of scenes with timestamps and descriptions.`;
    
    const visionPayload = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: systemPrompt,
            },
            ...base64Frames.map((img: string) => ({
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${img}`
              }
            })),
          ],
        },
      ],
      max_tokens: 2000,
      response_format: { type: "json_object" },
    };

    try {
        const response = await axios.post(openAIUrl, visionPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiApiKey}`,
            },
        });
        
        const content = response.data.choices[0].message.content;
        const result = JSON.parse(content);
        return result as VideoAnalysisResult;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401 || error.response.status === 403) {
                throw new OpenAiApiKeyError("Invalid OpenAI API Key. Please check your key.");
            }
        }
        throw new Error(handleError(error));
    }
};

export const analyzeVideo = async (
    videoFile: File,
    language: Language,
    onProgress: (message: string) => void,
    llmProvider: LLMProvider
): Promise<VideoAnalysisResult> => {
    if (llmProvider === LLMProvider.Gemini) {
        return analyzeVideoGemini(videoFile, language, onProgress);
    } else {
        return analyzeVideoOpenAI(videoFile, language, onProgress);
    }
};

async function* sendChatMessageGemini(messages: ChatMessage[]): AsyncGenerator<string> {
    try {
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chat: Chat = genAI.chats.create({
            model: 'gemini-2.5-flash',
            history: messages.slice(0, -1).map(m => ({
                role: m.role === 'ai' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))
        });
        const lastMessage = messages[messages.length - 1];
        const result = await chat.sendMessageStream({ message: lastMessage.content });
        for await (const chunk of result) {
            yield chunk.text;
        }
    } catch (error: any) {
        console.error("Gemini chat error:", error);
        if (error.message.includes("API key not valid")) {
            throw new GeminiApiKeyError("Invalid Gemini API Key.");
        }
        throw new Error(error.message);
    }
}

async function* sendChatMessageOpenAI(messages: ChatMessage[]): AsyncGenerator<string> {
    try {
        const openAiApiKey = getOpenAiToken();
        const openAIUrl = 'https://api.openai.com/v1/chat/completions';
        const payload = {
            model: "gpt-4-turbo",
            messages: messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
            stream: true,
        };

        const response = await axios.post(openAIUrl, payload, {
            headers: { 'Authorization': `Bearer ${openAiApiKey}` },
            responseType: 'stream'
        });

        const reader = response.data.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

            for (const line of lines) {
                const data = line.replace(/^data: /, '');
                if (data.trim() === '[DONE]') {
                    return;
                }
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content;
                    if (content) {
                        yield content;
                    }
                } catch (e) {
                    console.error("Error parsing stream chunk:", e);
                }
            }
        }

    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401 || error.response.status === 403) {
                throw new OpenAiApiKeyError("Invalid OpenAI API Key. Please check your key.");
            }
        }
        throw new Error(handleError(error));
    }
}

export const sendChatMessage = (messages: ChatMessage[], llmProvider: LLMProvider): AsyncGenerator<string> => {
    if (llmProvider === LLMProvider.Gemini) {
        return sendChatMessageGemini(messages);
    } else {
        return sendChatMessageOpenAI(messages);
    }
}