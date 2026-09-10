'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';

type NotesThemePreviewProps = {
  notesTheme: Record<string, unknown>;
  topicName?: string;
};

// Function to detect HTML content in the notesTheme object
const findHtmlContent = (obj: Record<string, unknown>): string | null => {
  if (!obj || typeof obj !== 'object') return null;
  
  // First, try to find the specific 'htmlPreview' field
  if (typeof obj.htmlPreview === 'string') {
    return obj.htmlPreview;
  }
  
  // Check for case variations
  const htmlPreviewKeys = ['htmlPreview', 'htmlpreview', 'HTMLPreview', 'HTMLPREVIEW'];
  for (const key of htmlPreviewKeys) {
    if (obj[key] && typeof obj[key] === 'string') {
      return obj[key] as string;
    }
  }
  
  // Fallback: check for any field containing 'htmlpreview' (case-insensitive)
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && key.toLowerCase() === 'htmlpreview') {
      return value;
    }
  }
  
  // Final fallback: look for any HTML content
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      if (value.includes('<html') || value.includes('<!DOCTYPE') || value.includes('<body')) {
        return value;
      }
    } else if (typeof value === 'object' && value !== null) {
      const nestedHtml = findHtmlContent(value as Record<string, unknown>);
      if (nestedHtml) return nestedHtml;
    }
  }
  
  return null;
};

export function NotesThemePreview({ notesTheme, topicName }: NotesThemePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Detect HTML content from the notesTheme object
  const htmlContent = useMemo(() => {
    if (!notesTheme) return null;
    
    // Log the full notesTheme object for debugging in dev mode
    console.log('=== NotesTheme Debug Info ===');
    console.log('Full notesTheme object:', JSON.stringify(notesTheme, null, 2));
    console.log('NotesTheme keys:', Object.keys(notesTheme));
    
    const found = findHtmlContent(notesTheme);
    console.log('HTML detection result:', found ? 'SUCCESS - Found HTML content' : 'FAILED - No HTML found');
    
    if (found) {
      console.log('HTML content preview (first 500 chars):', found.substring(0, 500) + '...');
    } else {
      console.log('Available fields and their types:');
      Object.entries(notesTheme).forEach(([key, value]) => {
        console.log(`  ${key}: ${typeof value} ${typeof value === 'string' ? `(length: ${value.length})` : ''}`);
      });
    }
    
    console.log('=== End Debug Info ===');
    return found;
  }, [notesTheme]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !htmlContent) return;

    const handleLoad = () => {
      setIsLoaded(true);
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;

        // Inject the topic name into the preview if available
        if (topicName && doc.querySelector('.title')) {
          const titleElement = doc.querySelector('.title');
          if (titleElement) {
            titleElement.textContent = topicName;
          }
        }
        
        // Log for debugging
        console.log('HTML content loaded in iframe:', htmlContent.substring(0, 200) + '...');
      } catch (error) {
        console.error('Error modifying iframe content:', error);
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [htmlContent, topicName]);

  // Ensure notesTheme is an object for metadata extraction
  const themeObj = typeof notesTheme === 'object' && notesTheme !== null ? notesTheme : {};

  // Safely extract theme metadata with fallbacks
  const getThemeMetadata = () => {
    const metadata: Array<{ label: string; value: string }> = [];
    
    // Try to extract common fields if they exist
    if (typeof themeObj.pageFormat === 'string') {
      metadata.push({ label: 'Page Format', value: themeObj.pageFormat });
    }
    if (typeof themeObj.paperBackground === 'string') {
      metadata.push({ label: 'Paper', value: themeObj.paperBackground });
    }
    if (typeof themeObj.penInk === 'string') {
      metadata.push({ label: 'Ink', value: themeObj.penInk });
    }
    if (typeof themeObj.themeId === 'string') {
      metadata.push({ label: 'Theme ID', value: themeObj.themeId });
    }
    
    // Try to extract handwriting characteristics if available
    if (themeObj.handwriting && typeof themeObj.handwriting === 'object') {
      const handwriting = themeObj.handwriting as Record<string, unknown>;
      if (typeof handwriting.characteristics === 'string') {
        metadata.push({ label: 'Style', value: handwriting.characteristics });
      }
    }
    
    return metadata;
  };

  const themeMetadata = getThemeMetadata();

  // If no HTML content found, don't render anything
  if (!htmlContent) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-4xl rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Notes Theme Preview</h3>
        {themeMetadata.length > 0 && (
          <span className="text-xs text-slate-500">
            {themeMetadata[0].label}: {themeMetadata[0].value}
          </span>
        )}
      </div>
      <div className="relative overflow-hidden rounded-md border border-white/10 bg-slate-900/50">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="text-sm text-slate-400">Loading preview...</div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          title="Notes Theme Preview"
          className="h-[500px] w-full border-0"
          sandbox="allow-same-origin allow-scripts"
          loading="lazy"
        />
      </div>
      {themeMetadata.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
          {themeMetadata.slice(0, 4).map((meta, idx) => (
            <div key={idx}>
              <span className="font-medium text-slate-300">{meta.label}:</span> {meta.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}