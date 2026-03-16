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
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0b0b0c]/80 backdrop-blur-xl pointer-events-auto">
      <div className="relative">
        <svg
          width="220"
          height="220"
          viewBox="0 0 300 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="glow_blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#0057FF" />
            </linearGradient>
            <style>{`
              @keyframes cubePulse {
                0% { transform: scale(1); opacity: 0.8; }
                100% { transform: scale(1.03); opacity: 1; }
              }
              @keyframes lightFlow {
                0% { stroke-dashoffset: 400; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes corePulse {
                0% { transform: scale(0.9); opacity: 0.6; }
                100% { transform: scale(1.3); opacity: 1; }
              }
              .bot24-cube {
                transform-origin: center;
                animation: cubePulse 2s ease-in-out infinite alternate;
              }
              .neural-lines {
                stroke-dasharray: 200;
                stroke-dashoffset: 400;
                animation: lightFlow 3s linear infinite;
              }
              .core-glow {
                transform-origin: center;
                animation: corePulse 1.5s ease-in-out infinite alternate;
              }
            `}</style>
          </defs>
          <path
            className="bot24-cube"
            d="M150 40 L260 100 V200 L150 260 L40 200 V100 L150 40Z"
            fill="#050505"
            stroke="#1A1A1A"
            strokeWidth="2"
          />
          <path
            className="neural-lines"
            d="M150 40 V150 L260 200"
            stroke="url(#glow_blue)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 8px #00F0FF)" }}
          />
          <path
            d="M40 100 L150 150 L260 100"
            stroke="#444"
            strokeWidth="2"
            strokeDasharray="8 8"
          />
          <path
            d="M40 200 L150 150"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.9"
          />
          <circle
            className="core-glow"
            cx="150"
            cy="150"
            r="12"
            fill="#00F0FF"
            style={{ filter: "blur(10px)" }}
          />
          <circle cx="150" cy="150" r="4" fill="white" />
        </svg>
      </div>
      <p className="mt-4 text-[11px] font-bold tracking-[0.5em] text-blue-400/80 uppercase animate-pulse">
        Quase lá...
      </p>
    </div>
  );
}
