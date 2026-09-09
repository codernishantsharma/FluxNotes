/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AssistantData, GeneratedPageImage, ExportFormat, AIProvider } from '@/types/notes';
import { ChatTitleBar } from '@/components/chat/ChatTitleBar';
import { PageSkeleton } from '@/components/chat/PageSkeleton';
import { ChatOutlineSidebar } from '@/components/chat/ChatOutlineSidebar';
import { ChatInputArea } from '@/components/chat/ChatInputArea';

const isStartOrContinue = (text: string) => {
  const lower = text.trim().toLowerCase();
  return (
    lower.includes('start') ||
    lower.includes('continue') ||
    lower.includes('proceed') ||
    lower.includes('generate')
  );
};

const PROVIDER_STORAGE_KEY = 'fluxnotes-ai-provider';
const isProductionBuild = process.env.NODE_ENV === 'production';

export default function NewChatPage() {
  const [inputText, setInputText] = useState('');
  const [pageImages, setPageImages] = useState<GeneratedPageImage[]>([]);
  const [assistantData, setAssistantData] = useState<AssistantData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingPagesCount, setLoadingPagesCount] = useState<number>(0);
  const [currentlyGeneratingPage, setCurrentlyGeneratingPage] = useState<number | null>(null);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [pageStartTimes, setPageStartTimes] = useState<Record<number, number>>({});
  const [failedPages, setFailedPages] = useState<Record<number, string>>({});
  const [failedPagesData, setFailedPagesData] = useState<Array<{pageNumber: number; subTopicNames: string[]; originalTopic: string; sessionId: string; errorMessage?: string; timestamp: number}>>([]);
  const [nowMs, setTickNow] = useState<number>(() => Date.now());
  const [provider, setProvider] = useState<AIProvider>('chatgpt');
  const [selectedFiles, setSelectedFiles] = useState<ChatAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const pageTitle = assistantData?.topicName?.trim() || 'New Chat';

  const containerEndRef = useRef<HTMLDivElement | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const imageRefs = useRef<Record<number, HTMLImageElement | null>>({});
  const pageImagesRef = useRef<GeneratedPageImage[]>([]);
  const chatSessionRef = useRef<{ sessionId?: string; session?: AssistantData['chatSession']; chatUrl?: string }>({});
  const startedNewChatRef = useRef(false);

  useEffect(() => {
    const textarea = promptInputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 180 ? 'auto' : 'hidden';
  }, [inputText]);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useEffect(() => {
    const savedProvider = window.localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (savedProvider === 'chatgpt' || (savedProvider === 'gemini' && !isProductionBuild)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProvider(savedProvider as AIProvider);
    }
  }, []);

  useEffect(() => {
    // Only scroll to bottom during processing or loading, not when images are added
    if (isProcessing || loadingPagesCount > 0) {
      containerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isProcessing, loadingPagesCount]);

  useEffect(() => {
    if (window.electronAPI?.onNewImage) {
      window.electronAPI.onNewImage((image) => {
        const filePath = typeof image === 'string' ? image : image.filePath;
        const pageNumber = typeof image === 'string' ? null : image.pageNumber;
        if (!filePath) return;
        setPageImages((prev) => {
          const nextPgNum = pageNumber || prev.length + 1;
          if (prev.some((item) => item.filePath === filePath)) return prev;

          setLoadingPagesCount((count) => Math.max(0, count - 1));
          // Only remove failed status for the specific page that just succeeded
          setFailedPages((prevFailed) => {
            if (!prevFailed[nextPgNum]) return prevFailed;
            const next = { ...prevFailed };
            delete next[nextPgNum];
            return next;
          });
          const updatedImages = [...prev.filter((item) => item.pageNumber !== nextPgNum), { pageNumber: nextPgNum, filePath }]
            .sort((first, second) => first.pageNumber - second.pageNumber);
          pageImagesRef.current = updatedImages;
          
          // Scroll to the newly added image
          setTimeout(() => {
            const targetImg = imageRefs.current[nextPgNum - 1];
            if (targetImg) {
              targetImg.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
          
          return updatedImages;
        });
      });
    }
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => setTickNow(Date.now()), 500);
    return () => window.clearInterval(intervalId);
  }, []);

  // Load failed pages from storage on mount
  useEffect(() => {
    const loadFailedPages = async () => {
      try {
        const result = await window.electronAPI?.getFailedPages?.();
        if (result?.success && Array.isArray(result.failedPages)) {
          setFailedPagesData(result.failedPages);
        }
      } catch (error) {
        console.error('Failed to load failed pages:', error);
      }
    };
    loadFailedPages();
  }, []);

  useEffect(() => {
    const noteId = new URLSearchParams(window.location.search).get('id');
    if (!noteId) {
      if (startedNewChatRef.current) return;
      startedNewChatRef.current = true;
      void window.electronAPI?.startNewChat?.().then((chat) => {
        chatSessionRef.current = { sessionId: chat?.sessionId };
      });
      return;
    }
    if (!window.electronAPI?.getNoteById) return;

    let isCurrent = true;
    const loadSavedNote = async () => {
      try {
        const note = await window.electronAPI?.getNoteById(noteId);
        if (!isCurrent || !note) return;

        chatSessionRef.current = {
          sessionId: note.chatSessionId,
          session: note.chatSession,
          chatUrl: note.chatUrl,
        };
        await window.electronAPI?.setNoteChatSession?.({
          chatUrl: note.chatUrl,
          sessionId: note.chatSessionId,
          session: note.chatSession,
        });

        const savedImages = Array.isArray(note.images)
          ? note.images
            .map((image: unknown, index: number) => {
              // Handle both old format (string) and new format (object with filePath and pageNumber)
              if (typeof image === 'string') {
                return {
                  pageNumber: index + 1, // Assign page number based on array index for old format
                  filePath: image.startsWith('local://')
                    ? image
                    : `local://${encodeURI(image.replace(/\\/g, '/'))}`,
                };
              } else if (image && typeof image === 'object' && 'filePath' in image) {
                const pageNumber = typeof image.pageNumber === 'number' ? image.pageNumber : index + 1;
                return {
                  pageNumber,
                  filePath: typeof image.filePath === 'string' && image.filePath.startsWith('local://')
                    ? image.filePath
                    : `local://${encodeURI(String(image.filePath).replace(/\\/g, '/'))}`,
                };
              }
              return null;
            })
            .filter((image): image is { pageNumber: number; filePath: string } => image !== null)
          : [];

        pageImagesRef.current = savedImages;
        setPageImages(savedImages);
        setAssistantData({
          status: 'update',
          topicId: note.topicId,
          topicName: note.topicName,
          subTopics: Array.isArray(note.subTopics) ? note.subTopics : [],
          chatUrl: note.chatUrl,
          chatSessionId: note.chatSessionId,
          chatSession: note.chatSession,
        });
        setHasStartedGeneration(true);
      } catch (error) {
        console.error('Failed to load saved note:', error);
      }
    };

    void loadSavedNote();
    return () => { isCurrent = false; };
  }, []);

  const sendPrompt = useCallback(async (promptText: string, attachments = selectedFiles) => {
    if (!promptText.trim() || isProcessing) return;

    setInputText('');
    setIsProcessing(true);

    setAssistantData((prev) => prev ? { ...prev, aiResponse: undefined, recommendedResponse: undefined } : null);

    try {
      const latestAssistantData = assistantData;

      if (isStartOrContinue(promptText) && assistantData?.subTopics && assistantData.subTopics.length > 0) {
        const subTopics = assistantData.subTopics;
        const totalPages = subTopics.length;

        setHasStartedGeneration(true);
        setPageImages([]);
        pageImagesRef.current = [];
        imageRefs.current = {};
        setPageStartTimes({});
        setFailedPages({});
        setAssistantData((prev) => prev ? {
          ...prev,
          aiResponse: undefined,
          recommendedResponse: undefined,
        } : null);
        setLoadingPagesCount(totalPages);

        for (let i = 0; i < totalPages; i++) {
          const currentSubTopic = subTopics[i];
          const pageNumInt = i + 1;
          const pageNumString = String(pageNumInt);
          const currentStatus = i === 0 ? 'start' : 'continue';

          setCurrentlyGeneratingPage(pageNumInt);
          setPageStartTimes((prev) => ({ ...prev, [pageNumInt]: Date.now() }));
          setFailedPages((prev) => {
            if (!prev[pageNumInt]) return prev;
            const next = { ...prev };
            delete next[pageNumInt];
            return next;
          });

          const structuredPayload = JSON.stringify({
            status: currentStatus,
            subTopicNames: currentSubTopic.names || [],
            pageNumber: pageNumString
          }, null, 2);

          try {
            const responseData = await window.electronAPI?.fillChatGptInput(structuredPayload);
            if (!responseData || responseData === false || (responseData as { error?: unknown })?.error) {
              throw new Error(`Could not generate page ${pageNumInt}.`);
            }
            if (responseData && typeof responseData === 'object') {
              chatSessionRef.current = {
                sessionId: responseData.chatSessionId || chatSessionRef.current.sessionId,
                session: responseData.chatSession || chatSessionRef.current.session,
                chatUrl: responseData.chatUrl || chatSessionRef.current.chatUrl,
              };
            }
          } catch (pageErr) {
            const errMsg = pageErr instanceof Error ? pageErr.message : `Generation failed for page ${pageNumInt}.`;
            console.error(errMsg, pageErr);
            setFailedPages((prev) => ({ ...prev, [pageNumInt]: errMsg }));
            setLoadingPagesCount((count) => Math.max(0, count - 1));
            
            // Save failed page information for retry
            if (window.electronAPI?.saveFailedPage && latestAssistantData) {
              try {
                await window.electronAPI.saveFailedPage({
                  pageNumber: pageNumInt,
                  subTopicNames: currentSubTopic.names || [],
                  originalTopic: latestAssistantData.topicName || '',
                  sessionId: chatSessionRef.current.sessionId || '',
                  errorMessage: errMsg,
                  timestamp: Date.now(),
                });
              } catch (saveErr) {
                console.error('Failed to save failed page info:', saveErr);
              }
            }
          }
        }

        setCurrentlyGeneratingPage(null);

        if (window.electronAPI?.saveNote && latestAssistantData) {
          const finalImagePaths = pageImagesRef.current.map((image) => ({
            filePath: image.filePath,
            pageNumber: image.pageNumber,
          }));
          await window.electronAPI.saveNote({
            topicId: latestAssistantData.topicId || String(Date.now()),
            topicName: latestAssistantData.topicName || "Untitled Notes",
            subTopics: latestAssistantData.subTopics || [],
            images: finalImagePaths,
            chatUrl: chatSessionRef.current.chatUrl,
            chatSessionId: chatSessionRef.current.sessionId,
            chatSession: chatSessionRef.current.session,
          });
        }

      } else {
        const responseData = await window.electronAPI?.fillChatGptInput(promptText, attachments);

        if (responseData && typeof responseData === 'object' && !responseData.error) {
          chatSessionRef.current = {
            sessionId: responseData.chatSessionId || chatSessionRef.current.sessionId,
            session: responseData.chatSession || chatSessionRef.current.session,
            chatUrl: responseData.chatUrl || chatSessionRef.current.chatUrl,
          };
          setAssistantData((prevData) => {
            const updated = responseData.status === 'update' && prevData ? {
              ...prevData,
              ...responseData,
              subTopics: responseData.subTopics || prevData.subTopics,
            } : responseData;
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Error during prompt execution flow:", error);
    } finally {
      setIsProcessing(false);
      setLoadingPagesCount(0);
      setCurrentlyGeneratingPage(null);
    }
    if (attachments === selectedFiles) setSelectedFiles([]);
  }, [isProcessing, assistantData, selectedFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    setAttachmentError(null);
    if (files.length === 0) return;

    const availableSlots = Math.max(0, 10 - selectedFiles.length);
    const filesToRead = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setAttachmentError('You can attach up to 10 files.');
    }
    if (filesToRead.length === 0) return;

    const readFile = (file: File) => new Promise<ChatAttachment>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const separator = result.indexOf(',');
        if (separator === -1) {
          reject(new Error(`Could not read ${file.name}.`));
          return;
        }
        resolve({
          base64: result.slice(separator + 1),
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
        });
      };
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });

    void Promise.all(filesToRead.map(readFile))
      .then((attachments) => setSelectedFiles((current) => [...current, ...attachments].slice(0, 10)))
      .catch((error: Error) => setAttachmentError(error.message));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendPrompt(inputText);
    }
  };

  const handleSubTopicClick = (pageNumberStr: string | number) => {
    const pageNum = typeof pageNumberStr === 'string' ? parseInt(pageNumberStr, 10) : pageNumberStr;
    const targetImg = imageRefs.current[pageNum - 1];
    if (targetImg) {
      targetImg.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRetryFailedPage = async (failedPage: {pageNumber: number; subTopicNames: string[]; originalTopic: string; sessionId: string}) => {
    try {
      setIsProcessing(true);
      setCurrentlyGeneratingPage(failedPage.pageNumber);
      setFailedPages((prev) => {
        const next = { ...prev };
        delete next[failedPage.pageNumber];
        return next;
      });

      const retryPayload = JSON.stringify({
        status: 'retry',
        subTopicNames: failedPage.subTopicNames,
        pageNumber: String(failedPage.pageNumber),
        originalTopic: failedPage.originalTopic,
      }, null, 2);

      const responseData = await window.electronAPI?.fillChatGptInput(retryPayload);
      
      if (!responseData || responseData === false || (responseData as { error?: unknown })?.error) {
        throw new Error(`Retry failed for page ${failedPage.pageNumber}.`);
      }

      // Remove from failed pages data on success
      setFailedPagesData((prev) => 
        prev.filter(fp => !(fp.pageNumber === failedPage.pageNumber && fp.sessionId === failedPage.sessionId))
      );

      // Remove from storage
      await window.electronAPI?.removeFailedPage?.(failedPage.pageNumber, failedPage.sessionId);

    } catch (retryError) {
      const errMsg = retryError instanceof Error ? retryError.message : `Retry failed for page ${failedPage.pageNumber}.`;
      console.error(errMsg, retryError);
      setFailedPages((prev) => ({ ...prev, [failedPage.pageNumber]: errMsg }));
    } finally {
      setIsProcessing(false);
      setCurrentlyGeneratingPage(null);
    }
  };

  const handleRetryPageDuringGeneration = async (pageNumber: number) => {
    if (!assistantData?.subTopics) return;
    
    const subTopic = assistantData.subTopics[pageNumber - 1];
    if (!subTopic) return;

    try {
      setIsProcessing(true);
      setCurrentlyGeneratingPage(pageNumber);
      setFailedPages((prev) => {
        const next = { ...prev };
        delete next[pageNumber];
        return next;
      });

      const retryPayload = JSON.stringify({
        status: 'retry',
        subTopicNames: subTopic.names || [],
        pageNumber: String(pageNumber),
        originalTopic: assistantData.topicName || '',
      }, null, 2);

      const responseData = await window.electronAPI?.fillChatGptInput(retryPayload);
      
      if (!responseData || responseData === false || (responseData as { error?: unknown })?.error) {
        throw new Error(`Retry failed for page ${pageNumber}.`);
      }

    } catch (retryError) {
      const errMsg = retryError instanceof Error ? retryError.message : `Retry failed for page ${pageNumber}.`;
      console.error(errMsg, retryError);
      setFailedPages((prev) => ({ ...prev, [pageNumber]: errMsg }));
      
      // Save failed page information for retry
      if (window.electronAPI?.saveFailedPage) {
        try {
          await window.electronAPI.saveFailedPage({
            pageNumber,
            subTopicNames: subTopic.names || [],
            originalTopic: assistantData.topicName || '',
            sessionId: chatSessionRef.current.sessionId || '',
            errorMessage: errMsg,
            timestamp: Date.now(),
          });
        } catch (saveErr) {
          console.error('Failed to save failed page info:', saveErr);
        }
      }
    } finally {
      setIsProcessing(false);
      setCurrentlyGeneratingPage(null);
    }
  };

  const changeProvider = (nextProvider: AIProvider) => {
    if (nextProvider === 'gemini' && isProductionBuild) return;
    if (nextProvider === provider) return;
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, nextProvider);
    setProvider(nextProvider);
    setSelectedFiles([]);
    setAttachmentError(null);
  };

  const exportNotes = async () => {
    if (isExporting || pageImages.length === 0 || !window.electronAPI?.exportNote) return;

    setIsExporting(true);
    setExportMessage(null);
    try {
      const result = await window.electronAPI.exportNote({
        images: pageImages.map((image) => image.filePath.replace(/^local:\/\//, '')),
        topicName: assistantData?.topicName || 'Notes',
        format: exportFormat,
      });
      if (result.success) {
        setExportMessage(`Exported ${result.count} page${result.count === 1 ? '' : 's'}.`);
      } else if (!result.canceled) {
        setExportMessage(result.error || 'Export failed.');
      }
    } catch (error) {
      console.error('Failed to export notes:', error);
      setExportMessage('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex h-dvh flex-col overflow-hidden bg-transparent text-white">
      <ChatTitleBar
        pageTitle={pageTitle}
        provider={provider}
        isProductionBuild={isProductionBuild}
        hasStartedGeneration={hasStartedGeneration}
        hasPageImages={pageImages.length > 0}
        exportFormat={exportFormat}
        isExporting={isExporting}
        onChangeProvider={changeProvider}
        onChangeExportFormat={setExportFormat}
        onExportNotes={exportNotes}
      />

      <div className="relative flex flex-1 overflow-hidden bg-black">
        {/* Left/Center Area: Gallery View */}
        <div className="custom-scrollbar relative flex flex-1 flex-col overflow-y-auto pb-52 sm:pb-64">
          <div className="mx-auto flex h-max w-full max-w-4xl flex-col gap-4 p-4">
            {hasStartedGeneration && assistantData?.subTopics && assistantData.subTopics.length > 0 ? (
              <>
                <style>{`
                  @keyframes cozyGradientShift {
                    0%   { background-position: 0% 50%; }
                    40%  { background-position: 100% 50%; }
                    80%  { background-position: 60% 100%; }
                    100% { background-position: 0% 50%; }
                  }
                  @keyframes softBreathe {
                    0%, 100% { transform: scale(1); opacity: 0.65; }
                    50%      { transform: scale(1.04); opacity: 1; }
                  }
                  @keyframes sparkFloat {
                    0%   { transform: translate(-50%, 0) scale(1); opacity: 0.9; }
                    100% { transform: translate(-50%, -28px) scale(0.6); opacity: 0; }
                  }
                  @keyframes twinkle {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50%      { opacity: 0.9;  transform: scale(1.25); }
                  }
                  @keyframes failShake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-4px); }
                    40% { transform: translateX(4px); }
                    60% { transform: translateX(-2px); }
                    80% { transform: translateX(2px); }
                  }
                  .cozy-bg {
                    background: linear-gradient(120deg, rgba(14,165,233,0.18), rgba(20,184,166,0.22), rgba(139,92,246,0.20), rgba(244,114,182,0.18));
                    background-size: 300% 300%;
                    animation: cozyGradientShift 9s ease-in-out infinite;
                  }
                  .cozy-breathe { animation: softBreathe 4.5s ease-in-out infinite; }
                  .cozy-spark { animation: sparkFloat 2.8s ease-out infinite; }
                  .cozy-twinkle { animation: twinkle 3s ease-in-out infinite; }
                  .fail-shake { animation: failShake 0.8s ease-in-out; }
                `}</style>
                {assistantData.subTopics.map((subTopic, idx) => {
                  const targetPageNum = Number(subTopic.pageNumber || idx + 1);
                  const existingImage = pageImages.find((p) => p.pageNumber === targetPageNum);
                  const isCurrentlyBuilding = currentlyGeneratingPage === targetPageNum;
                  const startTs = pageStartTimes[targetPageNum];
                  const failedMsg = failedPages[targetPageNum];

                  if (existingImage) {
                    return (
                      <img
                        key={`page-${targetPageNum}`}
                        ref={(el) => { imageRefs.current[targetPageNum - 1] = el; }}
                        src={existingImage.filePath}
                        alt={`Generated Page ${targetPageNum}`}
                        loading="lazy"
                        className="m-0 block h-auto w-full rounded-md border border-white/5 p-0 shadow-lg"
                      />
                    );
                  }

                  return (
                    <PageSkeleton
                      key={`skeleton-page-${targetPageNum}`}
                      targetPageNum={targetPageNum}
                      subTopic={subTopic}
                      isCurrentlyBuilding={isCurrentlyBuilding}
                      startTs={startTs}
                      nowMs={nowMs}
                      failedMsg={failedMsg}
                      idx={idx}
                      onRetry={() => handleRetryPageDuringGeneration(targetPageNum)}
                      isProcessing={isProcessing}
                    />
                  );
                })}
              </>
            ) : hasStartedGeneration && pageImages.length > 0 ? (
              <>
                {pageImages.map((img, idx) => (
                  <img
                    key={idx}
                    ref={(el) => { imageRefs.current[idx] = el; }}
                    src={img.filePath}
                    alt={`Generated Page ${img.pageNumber}`}
                    loading="lazy"
                    className="m-0 block h-auto w-full rounded-md border border-white/5 p-0 shadow-lg"
                  />
                ))}
                
                {/* Failed Pages Retry Section */}
                {failedPagesData.length > 0 && (
                  <div className="mt-6 rounded-xl border border-red-500/30 bg-red-950/20 p-4 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-medium text-red-300">Failed Pages</h3>
                    <div className="space-y-2">
                      {failedPagesData.map((failedPage) => (
                        <div 
                          key={`${failedPage.pageNumber}-${failedPage.sessionId}`}
                          className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-950/10 px-3 py-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-red-200">
                              Page {failedPage.pageNumber}
                            </span>
                            <span className="text-[10px] text-red-300/70">
                              {failedPage.subTopicNames.join(', ')}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRetryFailedPage(failedPage)}
                            disabled={isProcessing}
                            className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-medium text-red-200 transition hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Retry
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-[50vh] items-center justify-center text-center text-sm text-slate-500" />
            )}

            <div ref={containerEndRef} className="h-4" />
          </div>
        </div>

        {/* Right Sidebar */}
        {assistantData && (
          <ChatOutlineSidebar
            assistantData={assistantData}
            onSubTopicClick={handleSubTopicClick}
          />
        )}

        {/* Floating Input Box & Prompts */}
        <ChatInputArea
          inputText={inputText}
          setInputText={setInputText}
          isProcessing={isProcessing}
          hasStartedGeneration={hasStartedGeneration}
          assistantData={assistantData}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          attachmentError={attachmentError}
          exportMessage={exportMessage}
          provider={provider}
          promptInputRef={promptInputRef}
          onSendPrompt={sendPrompt}
          onFileChange={handleFileChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
