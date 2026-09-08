'use client';

import React from 'react';
import { AssistantData } from '@/types/notes';

type ChatOutlineSidebarProps = {
  assistantData: AssistantData;
  onSubTopicClick: (pageNumberStr: string | number) => void;
};

export function ChatOutlineSidebar({ assistantData, onSubTopicClick }: ChatOutlineSidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-l border-white/5 bg-transparent backdrop-blur-md sm:w-80">
      <div className="flex items-center justify-between border-b border-white/5 bg-black/20 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notes Outline</h2>
        {assistantData.topicName && (
          <span className="max-w-[120px] truncate rounded-full border border-white/5 bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
            {assistantData.topicName}
          </span>
        )}
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4 text-xs space-y-4">
        {assistantData.subTopics && assistantData.subTopics.length > 0 ? (
          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Subtopics & Pages</div>
            <div className="space-y-1.5">
              {assistantData.subTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => onSubTopicClick(topic.pageNumber)}
                  className="group flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2.5 text-left transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
                >
                  <div className="space-y-1 pr-2">
                    {topic.names.map((name, i) => (
                      <div key={i} className="line-clamp-1 text-slate-300 transition group-hover:text-white">
                        • {name}
                      </div>
                    ))}
                  </div>
                  <span className="shrink-0 rounded border border-white/5 bg-black/40 px-2 py-1 font-mono text-[10px] text-slate-400 shadow-inner">
                    Pg {topic.pageNumber}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10 text-center text-slate-500">No outline available yet.</div>
        )}
      </div>
    </aside>
  );
}
