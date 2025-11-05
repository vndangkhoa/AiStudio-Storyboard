import axios, { AxiosResponse } from 'axios';
import { Scene, Asset, ScenarioType, Language, VideoAnalysisResult, ChatMessage } from "../types";

// --- Custom Error Type ---
export class OpenAiApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAiApiKeyError";
  }
}

// --- Timeout Helper ---
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

// --- Service Implementation ---
const getOpenAiToken = (): string => {
  const token = localStorage.getItem('openai_api_key');
  if (!token) {
    throw new OpenAiApiKeyError("OpenAI API Key not found. Please provide your key.");
  }
  return token;
};

const handleError = (error: any): string => {
  if (axios.isAxiosError(error) && error.response) {
    if (error.response.status === 401 || error.response.status === 403) {
      return "Authentication error: Invalid OpenAI API Key provided.";
    }
    if (error.response.data && error.response.data.error && error.response.data.error.message) {
      return error.response.data.error.message;
    }
    return `API Error: ${error.response.status} ${error.response.statusText}`;
  } else if (error instanceof Error) {
    return error.message;
  }
  return 'Connection error or an unknown error occurred.';
};

export const generateSceneSuggestions = async (scenario: ScenarioType, assets: Asset[], productDescription: string, language: Language): Promise<Scene[]> => {
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
};

export const generateNextScene = async (scenes: Scene[], assets: Asset[], productDescription: string, language: Language): Promise<{ imagePrompt: string; videoPrompt: string; }> => {
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
};

export const paraphrasePrompt = async (prompt: string, language: Language): Promise<string> => {
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

export const analyzeVideo = async (
    base64Frames: string[],
    language: Language,
): Promise<VideoAnalysisResult> => {
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
        const analysisPromise = axios.post(openAIUrl, visionPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiApiKey}`,
            },
        });

        const response: AxiosResponse = await withTimeout(analysisPromise, LLM_TIMEOUT_MS, LLM_TIMEOUT_ERROR_MESSAGE);
        
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

export async function* sendChatMessage(messages: ChatMessage[]): AsyncGenerator<string> {
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
