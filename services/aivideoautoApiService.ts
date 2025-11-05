import axios from 'axios';
import { AspectRatio, AivideoautoModel, Scene, Asset, AssetType } from "../types";

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

// --- AIVideoAuto Service Implementation ---

const API_BASE_URL = 'https://api.gommo.net/ai';

const NEGATIVE_PROMPT_NO_TEXT = "subtitles, text, words, letters, captions, watermark, signature, labels, typography, writing, logo, credits, title, branding, user interface elements, overlays";

const handleError = (error: any): string => {
  if (axios.isAxiosError(error) && error.response) {
    if (error.response.status === 401 || error.response.status === 403) {
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

export const getAivideoautoToken = (): string => {
  const token = localStorage.getItem('aivideoauto_api_key');
  if (!token) {
    throw new ApiKeyError("AIVideoAuto API Token not found. Please provide your token.");
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
