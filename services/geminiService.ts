import { GoogleGenAI, Type, GenerateContentResponse, Chat } from '@google/genai';
import { Scene, Asset, ScenarioType, Language, VideoAnalysisResult, ChatMessage } from "../types";

// --- Custom Error Type ---
export class GeminiApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiApiKeyError";
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
};

export const paraphrasePrompt = async (prompt: string, language: Language): Promise<string> => {
    try {
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const languageInstruction = language === 'vi' ? 'Vietnamese' : 'English';
        const paraphrasePromise = genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Paraphrase this creative prompt to make it more evocative and visually detailed. Keep the core subject and intent the same. Respond only with the new prompt text, in ${languageInstruction}. Original prompt: "${prompt}"`
        });
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

export const analyzeVideo = async (
    base64Frames: string[],
    language: Language,
): Promise<VideoAnalysisResult> => {
    const imageParts = base64Frames.map((frame) => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: frame,
      },
    }));

    const languageInstruction = language === 'vi' ? 'Vietnamese' : 'English';
    const fullPrompt = `You are a video analysis expert. Analyze the provided sequence of video frames and respond with a JSON object. The JSON object must contain these exact keys: "hook", "storytelling", "sellingPoints" (an array of strings), and "scenes" (an array of objects). Each scene object must have "startTime", "endTime", "description", and "action". The response MUST be entirely in ${languageInstruction}. Describe the video's hook, its narrative, key selling points, and a breakdown of scenes with timestamps and descriptions. Do not wrap the JSON in markdown code fences.`;
    
    try {
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const allParts = [{ text: fullPrompt }, ...imageParts];
        
        const analysisPromise = genAI.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: [{ role: 'user', parts: allParts }],
        });
        const response: GenerateContentResponse = await withTimeout(analysisPromise, LLM_TIMEOUT_MS, LLM_TIMEOUT_ERROR_MESSAGE);
        
        let rawText = response.text.trim();
        if (rawText.startsWith("```json")) {
            rawText = rawText.substring(7, rawText.length - 3).trim();
        } else if (rawText.startsWith("```")) {
            rawText = rawText.substring(3, rawText.length - 3).trim();
        }

        const result = JSON.parse(rawText);
        return result as VideoAnalysisResult;
    } catch (error: any) {
        console.error("Gemini video analysis error:", error);
        if (error.message.includes("API key not valid")) {
            throw new GeminiApiKeyError("Invalid Gemini API Key.");
        }
        throw new Error(error.message);
    }
};

export async function* sendChatMessage(messages: ChatMessage[]): AsyncGenerator<string> {
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
