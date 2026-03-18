"use client";

import { useEffect } from "react";

export default function Bot24Loader({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      document.body.style.pointerEvents = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0b0b0c]/90 backdrop-blur-2xl pointer-events-auto">
      <div className="relative">
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFB2" />
              <stop offset="100%" stopColor="#00C2FF" />
            </linearGradient>

            <linearGradient id="bullGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00FFB2" />
              <stop offset="100%" stopColor="#00C28A" />
            </linearGradient>

            <linearGradient id="bearGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF6B81" />
              <stop offset="100%" stopColor="#FF2D4A" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <style>{`
              @keyframes candleMove {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
              }
              @keyframes hexRotate {
                0% { stroke-dashoffset: 300; }
                100% { stroke-dashoffset: 0; }
              }
              .candle-1 { animation: candleMove 1.5s ease-in-out infinite; }
              .candle-2 { animation: candleMove 1.5s ease-in-out infinite 0.2s; }
              .candle-3 { animation: candleMove 1.5s ease-in-out infinite 0.4s; }
              .hex-border {
                stroke-dasharray: 100;
                animation: hexRotate 3s linear infinite;
              }
            `}</style>
          </defs>

          {/* Hexágono de fundo */}
          <polygon
            points="50,5 82,22 82,58 50,75 18,58 18,22"
            fill="#0A1628"
            stroke="url(#neonGrad)"
            strokeWidth="1.5"
            className="hex-border"
            filter="url(#glow)"
          />

          {/* Vela 1 — bearish */}
          <g className="candle-1">
            <rect x="34.2" y="21" width="1.6" height="8" rx="0.8" fill="#FF4C6A" />
            <rect x="31" y="29" width="8" height="18" rx="1" fill="url(#bearGrad)" filter="url(#glow)" />
            <rect x="34.2" y="47" width="1.6" height="10" rx="0.8" fill="#FF4C6A" />
          </g>

          {/* Vela 2 — bullish */}
          <g className="candle-2">
            <rect x="49.2" y="23" width="1.6" height="9" rx="0.8" fill="#00FFB2" />
            <rect x="46" y="32" width="8" height="14" rx="1" fill="url(#bullGrad)" filter="url(#glow)" />
            <rect x="49.2" y="46" width="1.6" height="10" rx="0.8" fill="#00FFB2" />
          </g>

          {/* Vela 3 — bullish */}
          <g className="candle-3">
            <rect x="64.2" y="18" width="1.6" height="8" rx="0.8" fill="#00FFB2" />
            <rect x="61" y="26" width="8" height="22" rx="1" fill="url(#bullGrad)" filter="url(#glow)" />
            <rect x="64.2" y="48" width="1.6" height="9" rx="0.8" fill="#00FFB2" />
          </g>
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2 mt-6">
        <p className="text-[10px] font-black tracking-[0.4em] text-[#00FFB2] uppercase">
          Processando
        </p>
        <div className="flex gap-1">
          <span className="w-1 h-1 bg-[#00FFB2] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1 h-1 bg-[#00C2FF] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1 h-1 bg-[#00FFB2] rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
