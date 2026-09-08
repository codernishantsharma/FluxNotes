'use client';

import React, { useEffect, useState } from 'react';

type TypingGenerationTextProps = {
  active: boolean;
  pageNumber: number;
};

export function TypingGenerationText({ active, pageNumber }: TypingGenerationTextProps) {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }

    const phrases = [
      `Sketching page ${pageNumber}...`,
      `Composing the layout...`,
      `Polishing the story...`,
      `Adding the final details...`,
    ];

    const currentPhrase = phrases[phraseIndex % phrases.length];
    if (!currentPhrase) return;

    let index = 0;
    let timer: number | undefined;

    const tick = () => {
      index += 1;
      setText(currentPhrase.slice(0, index));
      if (index >= currentPhrase.length) {
        window.clearTimeout(timer);
        const next = window.setTimeout(() => {
          setPhraseIndex((prev) => prev + 1);
          setText('');
        }, 650);
        return () => window.clearTimeout(next);
      }
      timer = window.setTimeout(tick, 35);
    };

    tick();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [active, phraseIndex, pageNumber]);

  return <span>{active ? text : 'Waiting for the next page...'}</span>;
}
