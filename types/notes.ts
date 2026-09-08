export type SubTopic = {
  names: string[];
  pageNumber: string | number;
};

export type NoteItem = {
  topicId: string;
  topicName: string;
  chatUrl: string;
  images: string[];
  subTopics: SubTopic[];
  timestamp: number;
  pinned?: boolean;
  chatSessionId?: string;
  chatSession?: { conversationId?: string | null; parentMessageId?: string | null } | null;
};

export type AssistantData = {
  status?: string;
  topicName?: string;
  topicId?: string;
  subTopics?: SubTopic[];
  aiResponse?: string;
  recommendedResponse?: string[];
  chatUrl?: string;
  chatSessionId?: string;
  chatSession?: { conversationId?: string | null; parentMessageId?: string | null } | null;
};

export type GeneratedPageImage = {
  pageNumber: number;
  filePath: string;
};

export type ExportFormat = 'pdf' | 'png' | 'jpeg';

export type AIProvider = 'chatgpt' | 'gemini';
