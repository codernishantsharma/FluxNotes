'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Provider = 'chatgpt' | 'gemini';

const PROVIDER_STORAGE_KEY = 'fluxnotes-ai-provider';
const isProductionBuild = process.env.NODE_ENV === 'production';

export function ChatGptMark() {
  return (
    <svg fill="currentColor" fillRule="evenodd" height="1em" style={{ flex: 'none', lineHeight: 1 }} viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>OpenAI</title><path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-1 .19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26 0 1.88-.309a5.96 5.96 0 004.162 1.713z"></path></svg>
  );
}

export function GeminiMark() {
  return (
   <svg xmlns="http://www.w3.org/2000/svg" height="1em" style={{flex:'none',lineHeight:1}} viewBox="0 0 24 24" width="1em"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-0-_R_0_)"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-1-_R_0_)"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-2-_R_0_)"/><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-0-_R_0_" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962"/><stop offset="1" stop-color="#08B962" stop-opacity="0"/></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-1-_R_0_" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543"/><stop offset="1" stop-color="#F94543" stop-opacity="0"/></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-2-_R_0_" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12"/><stop offset=".46" stop-color="#FABC12" stop-opacity="0"/></linearGradient></defs></svg>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [provider, setProvider] = useState<Provider>('chatgpt');

  const finishOnboarding = () => {
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, isProductionBuild ? 'chatgpt' : provider);
    router.replace('/');
  };

  return (
    <main className="relative flex h-dvh items-center justify-center overflow-hidden bg-[#080b0e] px-5 py-5 text-white sm:py-7">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
        <div className="absolute -left-24 top-[-8rem] h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -right-32 bottom-[-10rem] h-[30rem] w-[30rem] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <section className="relative w-full max-w-2xl animate-[fade-in_600ms_ease-out]">
        <div className="mb-5 flex items-center gap-3 text-sm font-semibold tracking-[0.2em] text-teal-300 uppercase sm:mb-6">
          <span className="flex h-9 w-9 items-center justify-center bordertext-lg tracking-normal"><Image src="/favicon.ico" alt="FluxNotes" width={36} height={36} className="h-full w-full object-contain" /></span>
          FluxNotes - Your Notes Making AI Partner
        </div>

        <div className="border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
          {step === 1 ? (
            <div className="flex min-h-[315px] flex-col justify-between">
              <div className="max-w-xl">
                <p className="mb-3 text-xs font-medium tracking-[0.24em] text-slate-400 uppercase">Your ideas, made visible</p>
                <h1 className="max-w-lg text-4xl font-semibold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl">
                  Turn a thought into notes worth keeping.
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                  FluxNotes shapes your prompts into clear, visual study notes you can revisit, build on, and export whenever you need them.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-7 flex w-full items-center justify-center gap-2 bg-teal-300 px-5 py-3 text-sm font-semibold text-[#071012] transition hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-200/60 focus:ring-offset-2 focus:ring-offset-[#11161a]"
              >
                Next
                <span aria-hidden="true">-&gt;</span>
              </button>
            </div>
          ) : (
            <div className="flex min-h-[315px] flex-col">
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="mb-2 text-xs font-medium tracking-[0.2em] text-teal-300 uppercase">Step 2 of 2</p>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">Choose your AI partner</h1>
                  <p className="mt-1 text-xs text-slate-400">You can change this later in settings.</p>
                </div>
              </div>

              <div className="grid flex-1 content-center gap-3 sm:grid-cols-2">
                {([
                  { id: 'chatgpt', name: 'ChatGPT', detail: '', icon: <ChatGptMark /> },
                  { id: 'gemini', name: 'Gemini', detail: '', icon: <GeminiMark /> },
                ] as const).filter((option) => !isProductionBuild || option.id !== 'gemini').map((option) => {
                  const isSelected = provider === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setProvider(option.id)}
                      className={`group flex min-h-10 items-start gap-3 border p-4 text-left transition sm:p-5 ${
                        isSelected
                          ? 'border-teal-300/70 bg-teal-300/10 text-white shadow-[0_0_0_1px_rgba(94,234,212,0.12)]'
                          : 'border-white/10 bg-black/10 text-slate-300 hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className={`mt-0.5 shrink-0 ${isSelected ? 'text-teal-300' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {option.icon}
                      </span>
                      <span>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          {option.name}
                          {option.id === 'gemini' && <span className="text-[9px] font-semibold tracking-[0.16em] text-blue-300/80">DEV</span>}
                        </span>
                      </span>
                      <span className={`ml-auto mt-1 h-3 w-3 shrink-0 rounded-full border ${isSelected ? 'border-teal-200 bg-teal-300' : 'border-slate-600'}`} />
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-white/15 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className="flex flex-1 items-center justify-center gap-2 bg-teal-300 px-5 py-3 text-sm font-semibold text-[#071012] transition hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-200/60 focus:ring-offset-2 focus:ring-offset-[#11161a]"
                >
                  Start making notes
                  <span aria-hidden="true">-&gt;</span>
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">Your preference is saved on this device.</p>
      </section>
    </main>
  );
}