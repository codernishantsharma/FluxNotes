"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadChatGptEngineScript = loadChatGptEngineScript;
exports.injectChatGptEngineIfNeeded = injectChatGptEngineIfNeeded;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let chatGptEngineScript = '';
function loadChatGptEngineScript() {
    if (chatGptEngineScript)
        return chatGptEngineScript;
    try {
        const scriptPath = path_1.default.join(__dirname, '..', 'chatgpt-engine.js');
        chatGptEngineScript = fs_1.default.readFileSync(scriptPath, 'utf8');
    }
    catch (err) {
        console.error('WARNING: Could not load ChatGPT engine script from', path_1.default.join(__dirname, '..', 'chatgpt-engine.js'), err);
    }
    return chatGptEngineScript;
}
async function injectChatGptEngineIfNeeded(workerWindow) {
    const script = loadChatGptEngineScript();
    const isEngineLoaded = await workerWindow.webContents.executeJavaScript(`typeof window.__fluxnotesChatGPT !== 'undefined'`);
    if (!isEngineLoaded && script) {
        console.log('[ELECTRON] fluxnotes ChatGPT engine missing. Injecting now...');
        await workerWindow.webContents.executeJavaScript(script);
    }
}
