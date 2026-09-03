"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatSessionId = createChatSessionId;
exports.toLocalImageUrl = toLocalImageUrl;
exports.fromLocalImageUrl = fromLocalImageUrl;
exports.safeFileName = safeFileName;
exports.escapeHtml = escapeHtml;
exports.completeTruncatedJson = completeTruncatedJson;
exports.findJsonObjectEnd = findJsonObjectEnd;
exports.extractJsonFromResponse = extractJsonFromResponse;
exports.completeNotePayload = completeNotePayload;
function createChatSessionId() {
    if (globalThis.crypto?.randomUUID)
        return globalThis.crypto.randomUUID();
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function toLocalImageUrl(filePath) {
    return `local://${encodeURI(filePath.replace(/\\/g, '/'))}`;
}
function fromLocalImageUrl(value) {
    return value.startsWith('local://') ? decodeURI(value.replace(/^local:\/\//, '')) : value;
}
function safeFileName(name) {
    return (name || 'notes').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'notes';
}
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[character] || character));
}
function completeTruncatedJson(jsonText) {
    const stack = [];
    let inString = false;
    let isEscaped = false;
    let unfinishedStringIsKey = false;
    let previousNonWhitespace = '';
    for (const character of jsonText) {
        if (inString) {
            if (isEscaped) {
                isEscaped = false;
            }
            else if (character === '\\') {
                isEscaped = true;
            }
            else if (character === '"') {
                inString = false;
            }
            continue;
        }
        if (character === '"') {
            inString = true;
            unfinishedStringIsKey = previousNonWhitespace === '{'
                || (previousNonWhitespace === ',' && stack.at(-1) === '}');
        }
        else if (character === '{') {
            stack.push('}');
        }
        else if (character === '[') {
            stack.push(']');
        }
        else if (character === '}' || character === ']') {
            if (stack.at(-1) === character)
                stack.pop();
        }
        if (!/\s/.test(character))
            previousNonWhitespace = character;
    }
    let completed = jsonText.trim();
    if (inString)
        completed += unfinishedStringIsKey ? '": null' : '"';
    if (/:\\s*$/.test(completed))
        completed += 'null';
    completed = completed.replace(/,\\s*$/, '');
    return completed + stack.reverse().join('');
}
function findJsonObjectEnd(text, startIndex) {
    const stack = [];
    let inString = false;
    let isEscaped = false;
    for (let index = startIndex; index < text.length; index++) {
        const character = text[index];
        if (inString) {
            if (isEscaped)
                isEscaped = false;
            else if (character === '\\')
                isEscaped = true;
            else if (character === '"')
                inString = false;
            continue;
        }
        if (character === '"')
            inString = true;
        else if (character === '{')
            stack.push('}');
        else if (character === '[')
            stack.push(']');
        else if (character === '}' || character === ']') {
            if (stack.at(-1) !== character)
                return -1;
            stack.pop();
            if (stack.length === 0)
                return index + 1;
        }
    }
    return -1;
}
function extractJsonFromResponse(rawText) {
    const normalizedRawText = typeof rawText === 'string'
        && rawText.includes('\\n')
        && rawText.includes('\\"')
        ? rawText.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"')
        : rawText;
    const text = normalizedRawText
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    const fencedBlocks = text.matchAll(/```(?:json|javascript|js)?\s*([\s\S]*?)```/gi);
    for (const match of fencedBlocks) {
        const candidate = match[1].trim();
        if (candidate.startsWith('{'))
            return candidate;
    }
    const firstBrace = text.indexOf('{');
    if (firstBrace === -1)
        throw new Error('No JSON object found in response');
    const endIndex = findJsonObjectEnd(text, firstBrace);
    return endIndex === -1 ? text.slice(firstBrace) : text.slice(firstBrace, endIndex);
}
function completeNotePayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
        return payload;
    if (!payload.status || !['new', 'update'].includes(payload.status))
        return payload;
    const subTopics = Array.isArray(payload.subTopics) ? payload.subTopics : [];
    const recommendedResponse = Array.isArray(payload.recommendedResponse)
        ? payload.recommendedResponse.filter((response) => typeof response === 'string' && !!response.trim())
        : [];
    if (!recommendedResponse.some((response) => response.trim().toLowerCase() === 'continue')) {
        recommendedResponse.push('Continue');
    }
    return {
        ...payload,
        status: payload.status,
        topicName: typeof payload.topicName === 'string' ? payload.topicName : '',
        topicId: typeof payload.topicId === 'string' ? payload.topicId : '',
        subTopics: subTopics.map((subTopic, index) => ({
            names: Array.isArray(subTopic?.names)
                ? subTopic.names.filter((name) => typeof name === 'string' && !!name.trim())
                : [],
            pageNumber: subTopic?.pageNumber ?? String(index + 1),
        })),
        aiResponse: typeof payload.aiResponse === 'string' ? payload.aiResponse : '',
        recommendedResponse,
    };
}
