import { LLMProvider } from "../types";

export const translations: Record<string, Record<string, string>> = {
  en: {
    // ApiKeySelector (for AIVideoAuto)
    aivideoautoApiKeyRequiredTitle: 'AIVideoAuto API Token Required',
    aivideoautoApiKeyRequiredSubtitle: 'Please enter your AIVideoAuto API Token to continue. Your token is stored locally and not shared.',
    invalidAivideoautoApiKeyError: 'Invalid AIVideoAuto API Token. Please check and try again.',
    aivideoautoApiTokenPlaceholder: 'Enter your AIVideoAuto API Token',
    saveAndContinue: 'Save & Continue',
    changeAivideoautoApiKey: 'Update AIVideoAuto API Token',
    changeAivideoautoApiKeySubtitle: 'Enter your new AIVideoAuto API Token to update. Your token is stored locally and not shared.',
    updateApiKey: 'Update API Key',
    cancel: 'Cancel',

    // OpenAiApiKeySelector
    openAiApiKeyRequiredTitle: 'OpenAI API Key Required',
    openAiApiKeyRequiredSubtitle: 'Please enter your OpenAI API key to use ChatGPT models. Your key is stored locally and not shared.',
    invalidOpenAiApiKeyError: 'Invalid OpenAI API Key. Please check and try again.',
    openAiApiTokenPlaceholder: 'Enter your OpenAI API Key (sk-...)',
    changeOpenAiApiKey: 'Update OpenAI API Key',
    changeOpenAiApiKeySubtitle: 'Enter your new OpenAI API Key to update.',

    // GeminiKeyRequiredModal
    geminiApiKeyRequiredTitle: 'Gemini API Key Required',
    geminiApiKeyRequiredSubtitle: 'To use AI features, please select a Gemini API key. This key will be managed by the AI Studio platform and is not stored in your browser.',
    selectGeminiApiKey: 'Select Gemini API Key',
    geminiBillingLink: 'Gemini API Billing Information',
    geminiApiKeyErrorMessage: 'Your Gemini API key might be invalid or not selected. Please select your API key again.',
    changeGeminiApiKey: 'Change Gemini API Key',

    // ChatbotModal
    chatbotTitle: 'AI Chatbot',
    chatInputPlaceholder: 'Type your message...',
    sendMessage: 'Send',
    you: 'You',
    ai: 'AI',
    chatbotEmptyState: 'Start a conversation with the AI.', // New
    aiIsThinking: 'AI is thinking...', // New

    // LoadingIndicator
    generatingVideoTitle: 'Generating Your Masterpiece...',

    // VideoPlayer
    videoReadyTitle: 'Your Video is Ready!',
    downloadVideo: 'Download Video',
    generateAnother: 'Generate Another',
    
    // CenterCanvas
    generatingImage: 'Generating image...',
    generatingVideo: 'Generating video...',
    generateVideo: 'Generate Video',
    generateImage: 'Generate Image',
    canvasTitle: 'Canvas',
    canvasEmptyTitle: 'Your storyboard is empty',
    canvasEmptySubtitle: 'Use the sidebar to define your scenario and generate scenes.',
    noImageGenerated: 'No image generated yet.',
    paraphraseAndRegenerateImage: 'Paraphrase & Regenerate Image',
    paraphraseAndRegenerateVideo: 'Paraphrase & Regenerate Video',
    paraphrasingPrompt: 'Paraphrasing prompt...',
    downloadImage: 'Download Image',
    previewVideo: 'Preview Video',


    // RightSidebar
    assetsTitle: 'Assets & Controls',
    productTitle: 'Product',
    uploadProduct: 'Upload Product Image',
    productDescriptionLabel: 'Product Description (Optional)',
    productDescriptionPlaceholder: 'Describe key features of the product to guide the AI...',
    characterTitle: 'Character / Presenter',
    uploadCharacter: 'Upload Character Image',
    unlock: 'Unlock Asset',
    locked: 'Lock Asset',
    delete: 'Delete Asset',
    videoAnalysisTitle: 'Video Analysis',
    uploadVideoForAnalysis: 'Upload Video for Analysis',
    analyzeVideo: 'Analyze Video',
    analyzingVideo: 'Analyzing Video...',
    analysisMayTakeTime: 'This may take a few minutes.',
    clearVideo: 'Clear Video',
    analysisResults: 'Analysis Results',
    hook: 'Hook',
    storytelling: 'Storytelling',
    sellingPoints: 'Selling Points',
    scenes: 'Scenes',
    applyToStoryboard: 'Adapt & Create Storyboard',
    storyboardUpdated: 'Storyboard has been adapted from video analysis.',
    
    // LeftSidebar
    storyboardTitle: 'Storyboard',
    scenarioType: 'Scenario Type',
    review: 'Product Review',
    vlog: 'Vlog Style',
    ugc: 'UGC Review',
    themes: 'Key Themes',
    selectThemes: 'Select or add themes...',
    aspectRatio: 'Aspect Ratio',
    landscape: 'Landscape (16:9)',
    portrait: 'Portrait (9:16)',
    generateScenes: 'Generate Scene Suggestions',
    imagePromptLabel: 'Image Prompt (Visuals)',
    videoPromptLabel: 'Video Prompt (Action/Dialogue)',
    totalDuration: 'Total Duration: {duration}s',
    addScene: 'Add Scene',
    addingScene: 'Adding Scene...',


    // App/VideoGenerator/Header
    appTitle: 'AI Video Auto Storyboard',
    checkingApiKey: 'Checking API key...',
    generatingThemes: 'Generating themes...',
    generatingScenes: 'Generating scenes...',
    errorOccurred: 'An error occurred',
    allVideosGenerated: 'All videos have been generated!',
    imageModelLabel: 'Image Model',
    videoModelLabel: 'Video Model',
    selectModelPlaceholder: 'Select a model...',
    imageConsistencyNoteTitle: 'Image Consistency',
    imageConsistencyNote: 'For best results with your assets, use <strong>Nano banana</strong> or <strong>Seedream 4</strong> models.',
    videoConsistencyNoteTitle: 'Video Consistency',
    videoConsistencyNote: 'To maintain character consistency from images, use <strong>Veo3.1</strong> models in a <strong>horizontal (16:9)</strong> aspect ratio.',
    remainingCredits: 'Credits Remaining',
    llmProvider: 'AI Provider',
    [LLMProvider.Gemini]: 'Google Gemini',
    [LLMProvider.OpenAI]: 'OpenAI ChatGPT',
    // FIX: Removed duplicate `changeOpenAiApiKey` property. The other instance of this key is defined above.


    // PolicyErrorModal
    policyErrorTitle: 'Content Policy Alert',
    policyErrorMessage: "The AI has flagged the prompt or a reference image for this scene as potentially violating its safety policy.",
    policyErrorSuggestion1: "Try rephrasing the **Image Prompt**. Avoid words that could be misinterpreted by the AI.",
    policyErrorSuggestion2: "If using a **Character** or **Product** image, ensure it is neutral and policy-compliant.",
    policyErrorSuggestion3: "Simplifying the scene description can often help.",
    policyErrorAcknowledge: "Okay, I'll review it",
    
    // OnboardingChecklist
    onboardingTitle: 'Getting Started',
    onboardingDismiss: 'Dismiss',
    onboardingStep1: 'Define Your Product',
    onboardingStep3: 'Generate Storyboard',
    onboardingStep4: 'Bring it to Life',

    // Bottom Nav
    navStoryboard: 'Storyboard',
    navCanvas: 'Canvas',
    navAssets: 'Assets',

    // ModelInfoModal
    modelInfoTitle: 'Available AI Models',
    aivideoautoImageModels: 'AIVideoAuto - Image Models',
    aivideoautoVideoModels: 'AIVideoAuto - Video Models',
    noModelsFound: 'No models were found. This could be due to an invalid API key or network issue.',
    fetchingModels: 'Fetching models...',
    modelName: 'Model Name',
    modelSize: 'Size',
    lastUpdated: 'Last Updated',
    modelDescription: 'Description',
    modelId: 'Model ID',
  },
  vi: {
    // ApiKeySelector (for AIVideoAuto)
    aivideoautoApiKeyRequiredTitle: 'Yêu cầu API Token AIVideoAuto',
    aivideoautoApiKeyRequiredSubtitle: 'Vui lòng nhập AIVideoAuto API Token của bạn để tiếp tục. Token được lưu trữ cục bộ và không được chia sẻ.',
    invalidAivideoautoApiKeyError: 'API Token AIVideoAuto không hợp lệ. Vui lòng kiểm tra lại.',
    aivideoautoApiTokenPlaceholder: 'Nhập AIVideoAuto API Token của bạn',
    saveAndContinue: 'Lưu & Tiếp tục',
    changeAivideoautoApiKey: 'Cập nhật API Token AIVideoAuto',
    changeAivideoautoApiKeySubtitle: 'Vui lòng nhập API Token AIVideoAuto mới của bạn để cập nhật. Token được lưu trữ cục bộ và không được chia sẻ.',
    updateApiKey: 'Cập nhật API Key',
    cancel: 'Hủy',

    // OpenAiApiKeySelector
    openAiApiKeyRequiredTitle: 'Yêu cầu khóa API OpenAI',
    openAiApiKeyRequiredSubtitle: 'Vui lòng nhập khóa API OpenAI của bạn để sử dụng các mô hình ChatGPT. Khóa của bạn được lưu trữ cục bộ và không được chia sẻ.',
    invalidOpenAiApiKeyError: 'Khóa API OpenAI không hợp lệ. Vui lòng kiểm tra lại.',
    openAiApiTokenPlaceholder: 'Nhập khóa API OpenAI của bạn (sk-...)',
    changeOpenAiApiKey: 'Cập nhật khóa API OpenAI',
    changeOpenAiApiKeySubtitle: 'Nhập khóa API OpenAI mới của bạn để cập nhật.',

    // GeminiKeyRequiredModal
    geminiApiKeyRequiredTitle: 'Yêu cầu khóa API Gemini',
    geminiApiKeyRequiredSubtitle: 'Để sử dụng các tính năng AI, vui lòng chọn khóa API Gemini. Khóa này sẽ được quản lý bởi nền tảng AI Studio và không được lưu trữ trong trình duyệt của bạn.',
    selectGeminiApiKey: 'Chọn khóa API Gemini',
    geminiBillingLink: 'Thông tin thanh toán API Gemini',
    geminiApiKeyErrorMessage: 'Khóa API Gemini của bạn có thể không hợp lệ hoặc chưa được chọn. Vui lòng chọn lại khóa API của bạn.',
    changeGeminiApiKey: 'Thay đổi khóa API Gemini',

    // ChatbotModal
    chatbotTitle: 'Chatbot AI',
    chatInputPlaceholder: 'Nhập tin nhắn của bạn...',
    sendMessage: 'Gửi',
    you: 'Bạn',
    ai: 'AI',
    chatbotEmptyState: 'Bắt đầu cuộc trò chuyện với AI.', // New
    aiIsThinking: 'AI đang suy nghĩ...', // New
    
    // LoadingIndicator
    generatingVideoTitle: 'Đang tạo nên tuyệt tác của bạn...',
    
    // VideoPlayer
    videoReadyTitle: 'Video của bạn đã sẵn sàng!',
    downloadVideo: 'Tải Video',
    generateAnother: 'Tạo video khác',

    // CenterCanvas
    generatingImage: 'Đang tạo ảnh...',
    generatingVideo: 'Đang tạo video...',
    generateVideo: 'Tạo Video',
    generateImage: 'Tạo ảnh',
    canvasTitle: 'Khung vẽ',
    canvasEmptyTitle: 'Bảng phân cảnh của bạn đang trống',
    canvasEmptySubtitle: 'Sử dụng thanh bên để xác định kịch bản và tạo các cảnh.',
    noImageGenerated: 'Chưa có ảnh nào được tạo.',
    paraphraseAndRegenerateImage: 'Diễn giải & Tạo lại ảnh',
    paraphraseAndRegenerateVideo: 'Diễn giải & Tạo lại video',
    paraphrasingPrompt: 'Đang diễn giải lại prompt...',
    downloadImage: 'Tải xuống ảnh',
    previewVideo: 'Xem trước Video',
    
    // RightSidebar
    assetsTitle: 'Tài sản & Điều khiển',
    productTitle: 'Sản phẩm',
    uploadProduct: 'Tải ảnh sản phẩm',
    productDescriptionLabel: 'Mô tả sản phẩm (Tùy chọn)',
    productDescriptionPlaceholder: 'Mô tả các tính năng chính của sản phẩm để AI hiểu rõ hơn...',
    characterTitle: 'Nhân vật / Người thuyết trình',
    uploadCharacter: 'Tải ảnh nhân vật',
    unlock: 'Mở khóa tài sản',
    locked: 'Khóa tài sản',
    delete: 'Xóa tài sản',
    videoAnalysisTitle: 'Phân tích Video',
    uploadVideoForAnalysis: 'Tải Video để phân tích',
    analyzeVideo: 'Phân tích Video',
    analyzingVideo: 'Đang phân tích...',
    analysisMayTakeTime: 'Quá trình này có thể mất vài phút.',
    clearVideo: 'Xóa Video',
    analysisResults: 'Kết quả Phân tích',
    hook: 'Điểm nhấn (Hook)',
    storytelling: 'Câu chuyện',
    sellingPoints: 'Điểm bán hàng',
    scenes: 'Các cảnh',
    applyToStoryboard: 'Chuyển thể & Tạo Storyboard',
    storyboardUpdated: 'Bảng phân cảnh đã được chuyển thể từ phân tích video.',

    // LeftSidebar
    storyboardTitle: 'Bảng phân cảnh',
    scenarioType: 'Loại kịch bản',
    review: 'Đánh giá sản phẩm',
    vlog: 'Phong cách Vlog',
    ugc: 'Đánh giá UGC',
    themes: 'Chủ đề chính',
    selectThemes: 'Chọn hoặc thêm chủ đề...',
    aspectRatio: 'Tỷ lệ khung hình',
    landscape: 'Ngang (16:9)',
    portrait: 'Dọc (9:16)',
    generateScenes: 'Tạo gợi ý cảnh',
    imagePromptLabel: 'Lời nhắc ảnh (Hình ảnh)',
    videoPromptLabel: 'Lời nhắc video (Hành động/Lời thoại)',
    totalDuration: 'Tổng thời lượng: {duration}s',
    addScene: 'Thêm cảnh',
    addingScene: 'Đang thêm cảnh...',

    // App/VideoGenerator/Header
    appTitle: 'Storyboard AI Video Auto',
    checkingApiKey: 'Đang kiểm tra API key...',
    generatingThemes: 'Đang tạo chủ đề...',
    generatingScenes: 'Đang tạo cảnh...',
    errorOccurred: 'Đã xảy ra lỗi',
    allVideosGenerated: 'Tất cả video đã được tạo!',
    imageModelLabel: 'Mẫu Ảnh',
    videoModelLabel: 'Mẫu Video',
    selectModelPlaceholder: 'Chọn một mẫu...',
    imageConsistencyNoteTitle: 'Đồng nhất hình ảnh',
    imageConsistencyNote: 'Để có kết quả tốt nhất với tài sản của bạn, hãy sử dụng các mẫu <strong>Nano banana</strong> hoặc <strong>Seedream 4</strong>.',
    videoConsistencyNoteTitle: 'Đồng nhất Video',
    videoConsistencyNote: 'Để duy trì sự đồng nhất của nhân vật từ ảnh, hãy sử dụng các mẫu <strong>Vẻo, Veo3.1, Wan2.5, wan2.2, Kling2.5, Kling 2.1, V-fuse</strong>. Riêng <strong>Sora2</strong> , không đươc dùng hình có mặt người',
    remainingCredits: 'Tín dụng còn lại',
    llmProvider: 'Nhà cung cấp AI',
    [LLMProvider.Gemini]: 'Google Gemini',
    [LLMProvider.OpenAI]: 'OpenAI ChatGPT',

    // PolicyErrorModal
    policyErrorTitle: 'Cảnh báo chính sách nội dung',
    policyErrorMessage: 'AI đã gắn cờ lời nhắc hoặc hình ảnh tham chiếu cho cảnh này vì có thể vi phạm chính sách an toàn của nó.',
    policyErrorSuggestion1: 'Hãy thử diễn đạt lại **Lời nhắc ảnh**. Tránh các từ có thể bị AI hiểu sai.',
    policyErrorSuggestion2: 'Nếu sử dụng hình ảnh **Nhân vật** hoặc **Sản phẩm**, hãy đảm bảo hình ảnh đó trung tính và tuân thủ chính sách.',
    policyErrorSuggestion3: 'Việc đơn giản hóa mô tả cảnh thường có thể hữu ích.',
    policyErrorAcknowledge: 'OK, tôi sẽ xem lại',
    
    // OnboardingChecklist
    onboardingTitle: 'Bắt đầu',
    onboardingDismiss: 'Bỏ qua',
    onboardingStep1: 'Xác định sản phẩm',
    onboardingStep3: 'Tạo bảng phân cảnh',
    onboardingStep4: 'Hiện thực hóa',

    // Bottom Nav
    navStoryboard: 'Kịch bản',
    navCanvas: 'Sáng tạo',
    navAssets: 'Tài sản',

    // ModelInfoModal
    modelInfoTitle: 'Các mẫu AI có sẵn',
    aivideoautoImageModels: 'AIVideoAuto - Mẫu ảnh',
    aivideoautoVideoModels: 'AIVideoAuto - Mẫu video',
    noModelsFound: 'Không tìm thấy mẫu nào. Có thể do API key không hợp lệ hoặc sự cố mạng.',
    fetchingModels: 'Đang tải các mẫu...',
    modelName: 'Tên mẫu',
    modelSize: 'Kích thước',
    lastUpdated: 'Cập nhật lần cuối',
    modelDescription: 'Mô tả',
    modelId: 'ID mẫu',
  },
};