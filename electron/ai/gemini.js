"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadGeminiEngineScript = loadGeminiEngineScript;
exports.extractGeminiImageLinks = extractGeminiImageLinks;
exports.downloadGeminiImages = downloadGeminiImages;
exports.injectGeminiEngineIfNeeded = injectGeminiEngineIfNeeded;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const helpers_1 = require("../utils/helpers");
let geminiEngineScript = '';
function loadGeminiEngineScript() {
    if (geminiEngineScript)
        return geminiEngineScript;
    try {
        const scriptPath = path_1.default.join(__dirname, '..', 'gemini-engine.js');
        geminiEngineScript = fs_1.default.readFileSync(scriptPath, 'utf8');
    }
    catch (err) {
        console.error('WARNING: Could not load Gemini engine script from', path_1.default.join(__dirname, '..', 'gemini-engine.js'), err);
    }
    return geminiEngineScript;
}
function extractGeminiImageLinks(rawText) {
    if (typeof rawText !== 'string')
        return [];
    const normalizedText = rawText
        .replace(/\\\//g, '/')
        .replace(/\\u0026/gi, '&')
        .replace(/\\u003d/gi, '=');
    const links = normalizedText.match(/https?:\/\/lh3\.googleusercontent\.com\/[^\s"'<>`\\)]+/gi) || [];
    return [...new Set(links.map((link) => link.replace(/[.,;!?]+$/, '')))];
}
async function downloadGeminiImages(rawText) {
    const links = extractGeminiImageLinks(rawText);
    const downloadedImages = [];
    for (const imageUrl of links) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const contentType = response.headers.get('content-type') || 'image/png';
            const imageData = Buffer.from(await response.arrayBuffer());
            if (imageData.length === 0)
                throw new Error('Empty image response');
            const fileId = (0, helpers_1.createChatSessionId)();
            downloadedImages.push({
                imagePath: imageUrl,
                fileId,
                generationId: fileId,
                download: {
                    base64: imageData.toString('base64'),
                    mimeType: contentType.split(';')[0] || 'image/png',
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ELECTRON] Failed to download Gemini image:', imageUrl, err.message);
        }
    }
    return downloadedImages;
}
async function injectGeminiEngineIfNeeded(workerWindow) {
    const script = loadGeminiEngineScript();
    const isEngineLoaded = await workerWindow.webContents.executeJavaScript(`typeof window.__fluxnotesGeminiUnified !== 'undefined'`);
    if (!isEngineLoaded && script) {
        console.log('[ELECTRON] Gemini engine missing. Injecting now...');
        await workerWindow.webContents.executeJavaScript(script);
    }
}
