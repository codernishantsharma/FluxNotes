/* eslint-disable @typescript-eslint/no-explicit-any */
export {};

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      startNewChat: () => Promise<boolean>;
      setNoteChatUrl: (chatUrl: string) => Promise<boolean>;
      fillChatGptInput: (text: string) => Promise<any>;
      getStoredImages: () => Promise<string[]>;
      getAllNotes: () => Promise<any[]>;
      getNoteById: (topicId: string) => Promise<any>;
      onNewImage: (callback: (filePath: string) => void) => void;
      onProgressUpdate: (callback: (progress: any) => void) => void;
      saveNote: (note: any) => Promise<void>;
      renameNote: (topicId: string, topicName: string) => Promise<{ success: boolean; error?: string }>;
      setNotePinned: (topicId: string, pinned: boolean) => Promise<{ success: boolean; error?: string }>;
      deleteNote: (topicId: string) => Promise<{ success: boolean; error?: string }>;
      exportNote: (note: { images: string[]; topicName: string; format: 'pdf' | 'png' | 'jpeg' }) => Promise<{
        success: boolean;
        canceled?: boolean;
        error?: string;
        path?: string;
        count?: number;
      }>;
      checkForUpdates: () => Promise<any>;
      restartAndInstall: () => void;
      onUpdaterEvent: (callback: (data: { type: string; info?: any; progress?: number }) => void) => void;
    };
  }
}
