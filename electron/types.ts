export interface ChatSession {
  conversationId: string | null;
  parentMessageId: string | null;
}

export interface SubTopic {
  names: string[];
  pageNumber: string | number;
}

export interface NoteRecord {
  topicId: string;
  topicName: string;
  subTopics?: SubTopic[];
  aiResponse?: string;
  recommendedResponse?: string[];
  images?: string[];
  chatUrl?: string;
  chatSessionId?: string | null;
  chatSession?: ChatSession | null;
  pinned?: boolean;
  timestamp?: number;
  status?: string;
  messageId?: string;
  generationId?: string;
  fileId?: string;
  generatedImages?: GeneratedImageInfo[];
}

export interface ImageRecord {
  id: string;
  filePath: string;
  timestamp: number;
  source: string;
  generationId?: string;
  fileId?: string;
}

export interface NotesData {
  notes_collection: NoteRecord[];
  image_records: ImageRecord[];
}

export interface GeneratedImageInfo {
  imagePath?: string;
  fileId?: string;
  generationId?: string;
  download?: {
    base64: string;
    mimeType: string;
    size?: number;
  };
  downloadError?: string;
}

export interface ChatGptResult {
  rawText: string;
  conversationId: string | null;
  messageId: string | null;
  session: ChatSession | null;
  generationId: string | null;
  fileId: string | null;
  generatedImages: GeneratedImageInfo[];
  downloadedSandboxImages: GeneratedImageInfo[];
}

export type AIProvider = 'chatgpt' | 'gemini';

export interface ExportNoteOptions {
  images: string[];
  topicName: string;
  format: 'pdf' | 'png' | 'jpeg';
}

export interface RawResponseData {
  provider: AIProvider;
  sessionId?: string | null;
  timestamp: string;
  rawResponse: string;
  formattedJson?: unknown;
}
