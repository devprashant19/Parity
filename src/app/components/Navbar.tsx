'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShoppingCart, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // 8 circles around (16,16) with radius 10 + 1 center circle
  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const radius = 10;
  const cx = 16;
  const cy = 16;
  const rCircle = 3.5;

  return (
    <header className="w-full flex justify-center pt-4 sm:pt-6 px-3 sm:px-4 z-30">
      <div className="bg-white rounded-full shadow-sm border border-neutral-200/90 pl-3 pr-2 py-2 w-full max-w-[760px] relative flex items-center justify-between">
        {/* Left: Logo & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <a href="#" className="flex items-center gap-2 focus:outline-none" aria-label="Convix Software Home">
            <svg
              viewBox="0 0 32 32"
              className="w-7 h-7 sm:w-8 sm:h-8"
              fill="#ef4d23"
              aria-hidden="true"
            >
              {/* Center Circle */}
              <circle cx={cx} cy={cy} r={rCircle} />
              {/* 8 Orbital circles */}
              {petalAngles.map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const x = cx + radius * Math.cos(rad);
                const y = cy + radius * Math.sin(rad);
                return <circle key={deg} cx={x.toFixed(2)} cy={y.toFixed(2)} r={rCircle} />;
              })}
            </svg>
          </a>
        </div>

        {/* Center / Desktop Links */}
        <nav className="hidden md:flex items-center gap-6 text-[14px] text-neutral-700 font-medium ml-4">
          <a
            href="#home"
            className="inline-flex items-center gap-2 text-neutral-900 font-semibold hover:text-black transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
            Home
          </a>
          <a href="#features" className="hover:text-black transition-colors">
            Features
          </a>
          <a href="#about" className="hover:text-black transition-colors">
            About
          </a>
          <a
            href="#pages"
            className="inline-flex items-center gap-1 text-[#ef4d23] font-medium hover:opacity-90 transition-opacity"
          >
            <span>Pages</span>
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
          </a>
        </nav>

        {/* Right Cluster */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden sm:inline-flex p-2 text-neutral-700 hover:text-black transition-colors rounded-full hover:bg-neutral-100 cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>

          <a
            href="#early-access"
            className="inline-flex items-center gap-2 bg-[#ef4d23] hover:bg-[#e03d13] text-white rounded-full pl-3.5 sm:pl-4 pr-1.5 py-1.5 text-xs sm:text-[13px] font-medium transition-all shadow-xs cursor-pointer group"
          >
            <span className="hidden sm:inline">Get early access</span>
            <span className="inline sm:hidden">Early access</span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            </span>
          </a>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            id="mobile-menu-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-1.5 text-neutral-700 hover:text-black rounded-full hover:bg-neutral-100 transition-colors focus:outline-none cursor-pointer"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Panel */}
        {isOpen && (
          <div className="absolute top-full left-2 right-2 mt-2 bg-white rounded-2xl shadow-xl border border-neutral-200 p-4 z-50 flex flex-col gap-3 md:hidden animate-fadeIn">
            <a
              href="#home"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 py-1.5 px-2 rounded-lg hover:bg-neutral-50"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
              Home
            </a>
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-neutral-700 py-1.5 px-2 rounded-lg hover:bg-neutral-50"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-neutral-700 py-1.5 px-2 rounded-lg hover:bg-neutral-50"
            >
              About
            </a>
            <a
              href="#pages"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-between text-sm font-medium text-[#ef4d23] py-1.5 px-2 rounded-lg hover:bg-neutral-50"
            >
              <span>Pages</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </a>
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between px-2 text-sm text-neutral-600">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-neutral-700" />
                Cart
              </span>
              <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                0
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
