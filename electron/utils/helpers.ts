import { NoteRecord, SubTopic } from '../types';

export function createChatSessionId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function toLocalImageUrl(filePath: string): string {
  return `local://${encodeURI(filePath.replace(/\\/g, '/'))}`;
}

export function fromLocalImageUrl(value: string): string {
  return value.startsWith('local://') ? decodeURI(value.replace(/^local:\/\//, '')) : value;
}

export function safeFileName(name?: string): string {
  return (name || 'notes').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'notes';
}

export function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));
}

export function completeTruncatedJson(jsonText: string): string {
  const stack: string[] = [];
  let inString = false;
  let isEscaped = false;
  let unfinishedStringIsKey = false;
  let previousNonWhitespace = '';

  for (const character of jsonText) {
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === '\\') {
        isEscaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      unfinishedStringIsKey = previousNonWhitespace === '{'
        || (previousNonWhitespace === ',' && stack.at(-1) === '}');
    } else if (character === '{') {
      stack.push('}');
    } else if (character === '[') {
      stack.push(']');
    } else if (character === '}' || character === ']') {
      if (stack.at(-1) === character) stack.pop();
    }

    if (!/\s/.test(character)) previousNonWhitespace = character;
  }

  let completed = jsonText.trim();
  if (inString) completed += unfinishedStringIsKey ? '": null' : '"';
  if (/:\\s*$/.test(completed)) completed += 'null';
  completed = completed.replace(/,\\s*$/, '');

  return completed + stack.reverse().join('');
}

export function findJsonObjectEnd(text: string, startIndex: number): number {
  const stack: string[] = [];
  let inString = false;
  let isEscaped = false;

  for (let index = startIndex; index < text.length; index++) {
    const character = text[index];
    if (inString) {
      if (isEscaped) isEscaped = false;
      else if (character === '\\') isEscaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') inString = true;
    else if (character === '{') stack.push('}');
    else if (character === '[') stack.push(']');
    else if (character === '}' || character === ']') {
      if (stack.at(-1) !== character) return -1;
      stack.pop();
      if (stack.length === 0) return index + 1;
    }
  }

  return -1;
}

export function extractJsonFromResponse(rawText: string): string {
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
    if (candidate.startsWith('{')) return candidate;
  }

  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) throw new Error('No JSON object found in response');

  const endIndex = findJsonObjectEnd(text, firstBrace);
  return endIndex === -1 ? text.slice(firstBrace) : text.slice(firstBrace, endIndex);
}

export function completeNotePayload(payload: Partial<NoteRecord>): Partial<NoteRecord> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  if (!payload.status || !['new', 'update'].includes(payload.status)) return payload;

  const subTopics = Array.isArray(payload.subTopics) ? payload.subTopics : [];
  const recommendedResponse = Array.isArray(payload.recommendedResponse)
    ? payload.recommendedResponse.filter((response): response is string => typeof response === 'string' && !!response.trim())
    : [];
  if (!recommendedResponse.some((response) => response.trim().toLowerCase() === 'continue')) {
    recommendedResponse.push('Continue');
  }

  return {
    ...payload,
    status: payload.status,
    topicName: typeof payload.topicName === 'string' ? payload.topicName : '',
    topicId: typeof payload.topicId === 'string' ? payload.topicId : '',
    subTopics: subTopics.map((subTopic: Partial<SubTopic>, index: number) => ({
      names: Array.isArray(subTopic?.names)
        ? subTopic.names.filter((name): name is string => typeof name === 'string' && !!name.trim())
        : [],
      pageNumber: subTopic?.pageNumber ?? String(index + 1),
    })),
    aiResponse: typeof payload.aiResponse === 'string' ? payload.aiResponse : '',
    recommendedResponse,
  };
}
