'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DashboardPreview } from './components/DashboardPreview';

export const App: React.FC = () => {
  return (
    <div
      className="min-h-screen w-full bg-[#ededed] p-3 sm:p-4 font-sans text-neutral-900 selection:bg-[#ef4d23]/20 selection:text-[#ef4d23]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Hero container (clips everything inside) */}
      <section
        className="relative w-full h-[calc(100vh-24px)] sm:h-[calc(100vh-32px)] overflow-hidden bg-[#d9d9d9] rounded-2xl sm:rounded-3xl flex flex-col justify-between shadow-2xs"
        aria-label="Convix Software Hero"
      >
        {/* Background Video */}
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4"
          poster="https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disableRemotePlayback
          {...{
            'webkit-playsinline': 'true',
            'x5-playsinline': 'true',
          }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        />

        {/* Soft overlay above the video */}
        <div className="absolute inset-0 bg-white/10 pointer-events-none" />

        {/* Foreground content wrapper */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between">
          {/* Floating pill Navbar */}
          <Navbar />

          {/* Centered Hero Content */}
          <div className="flex flex-col items-center px-4 pt-6 sm:pt-8 md:pt-10 text-center my-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-xs text-[13px] font-medium text-neutral-800 border border-neutral-200/60 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-[#ef4d23] inline-block" />
              <span>Convix Software</span>
            </div>

            {/* Headline */}
            <h1
              className="mt-4 sm:mt-5 max-w-4xl text-neutral-900 tracking-tight leading-[1.05]"
              style={{
                fontSize: 'clamp(36px, 8vw, 72px)',
                lineHeight: 1.05,
                fontWeight: 500,
                letterSpacing: '-0.02em',
              }}
            >
              Shaping{' '}
              <span
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                Agencies
              </span>
              <br />
              of tomorrow
            </h1>

            {/* Subtitle */}
            <p
              className="mt-3 sm:mt-4 text-neutral-700 px-2 font-normal max-w-2xl text-balance"
              style={{ fontSize: 'clamp(13px, 3.5vw, 16px)' }}
            >
              The All-In-One Software Powering the Future of PR Agencies
            </p>

            {/* CTA Button */}
            <a
              href="#get-started"
              className="mt-5 sm:mt-7 inline-flex items-center gap-3 bg-[#0b0f1a] hover:bg-neutral-800 text-white rounded-full pl-6 sm:pl-7 pr-2 py-2 sm:py-2.5 text-[14px] font-medium shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
            >
              <span>Get Started</span>
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
                <ChevronRight className="w-4 h-4 text-white stroke-[2.5]" />
              </span>
            </a>
          </div>

          {/* Bottom Dashboard Preview (naturally bleeds off container bottom) */}
          <div className="w-full pt-4 translate-y-6 sm:translate-y-8 lg:translate-y-10">
            <DashboardPreview />
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
