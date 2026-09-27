import React from "react";

interface PeacockLogoProps {
  size?: number | string;
  className?: string;
  animated?: boolean;
  withGlow?: boolean;
  theme?: "beige" | "vibrant";
}

export const PeacockLogo: React.FC<PeacockLogoProps> = ({
  size = 120,
  className = "",
  animated = false,
  withGlow = true,
  theme = "beige",
}) => {
  const isBeige = theme === "beige";

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${animated ? "animate-pulse" : ""}`}
      >
        <defs>
          {/* Radial Feathers Gradients - Warm Beige & Gold or Vibrant Cyan/Emerald */}
          <linearGradient id={`feather-grad-1-${theme}`} x1="0%" y1="100%" x2="0%" y2="0%">
            {isBeige ? (
              <>
                <stop offset="0%" stopColor="#3E3224" />
                <stop offset="40%" stopColor="#8C704B" />
                <stop offset="85%" stopColor="#D4BE9B" />
                <stop offset="100%" stopColor="#FBF5EA" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="40%" stopColor="#0284c7" />
                <stop offset="85%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </>
            )}
          </linearGradient>

          <linearGradient id={`feather-grad-gold-${theme}`} x1="0%" y1="100%" x2="100%" y2="0%">
            {isBeige ? (
              <>
                <stop offset="0%" stopColor="#4A3B29" />
                <stop offset="50%" stopColor="#A88B5B" />
                <stop offset="85%" stopColor="#DEC293" />
                <stop offset="100%" stopColor="#FFF9EE" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#0369a1" />
                <stop offset="50%" stopColor="#0d9488" />
                <stop offset="85%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#fbbf24" />
              </>
            )}
          </linearGradient>

          {/* Eyelet Radial Gradients */}
          <radialGradient id={`ocellus-grad-${theme}`} cx="50%" cy="50%" r="50%">
            {isBeige ? (
              <>
                <stop offset="0%" stopColor="#2B2117" />
                <stop offset="35%" stopColor="#6E5536" />
                <stop offset="65%" stopColor="#BFA274" />
                <stop offset="85%" stopColor="#EAD8BA" />
                <stop offset="100%" stopColor="#FFFDF7" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#020617" />
                <stop offset="35%" stopColor="#1e3a8a" />
                <stop offset="65%" stopColor="#06b6d4" />
                <stop offset="85%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#fbbf24" />
              </>
            )}
          </radialGradient>

          {/* Body and Neck Gradients */}
          <linearGradient id={`peacock-body-grad-${theme}`} x1="20%" y1="0%" x2="80%" y2="100%">
            {isBeige ? (
              <>
                <stop offset="0%" stopColor="#FFFBF2" />
                <stop offset="30%" stopColor="#DFCEB2" />
                <stop offset="70%" stopColor="#9C805A" />
                <stop offset="100%" stopColor="#483A28" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="30%" stopColor="#0284c7" />
                <stop offset="70%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#0f172a" />
              </>
            )}
          </linearGradient>

          <linearGradient id={`peacock-wing-grad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isBeige ? (
              <>
                <stop offset="0%" stopColor="#EBE0CC" />
                <stop offset="50%" stopColor="#B89E77" />
                <stop offset="100%" stopColor="#635138" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#0f766e" />
                <stop offset="100%" stopColor="#042f2e" />
              </>
            )}
          </linearGradient>

          {/* Glow Filters */}
          {withGlow && (
            <filter id={`peacock-glow-${theme}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        {/* Ambient Glow Aura */}
        {withGlow && (
          <circle
            cx="100"
            cy="100"
            r="75"
            fill={`url(#ocellus-grad-${theme})`}
            opacity={isBeige ? "0.25" : "0.2"}
            filter={`url(#peacock-glow-${theme})`}
          />
        )}

        {/* Fan of 9 Majestic Radiating Peacock Feathers */}
        <g id="peacock-tail-feathers">
          {/* Feather 1: -60 deg */}
          <g transform="rotate(-60 100 135)">
            <path
              d="M100 135 C95 100 86 65 92 32 C97 8 103 8 108 32 C114 65 105 100 100 135 Z"
              fill={`url(#feather-grad-1-${theme})`}
              opacity="0.9"
            />
            <circle cx="100" cy="35" r="11" fill={`url(#ocellus-grad-${theme})`} />
            <circle cx="100" cy="35" r="6" fill={isBeige ? "#94764E" : "#0284c7"} />
            <circle cx="100" cy="35" r="3" fill={isBeige ? "#2B2117" : "#020617"} />
            <circle cx="98.5" cy="33.5" r="1.2" fill={isBeige ? "#FFF9EE" : "#38bdf8"} />
          </g>

          {/* Feather 2: -45 deg */}
          <g transform="rotate(-45 100 135)">
            <path
              d="M100 135 C94 95 85 58 92 24 C97 2 103 2 108 24 C115 58 106 95 100 135 Z"
              fill={`url(#feather-grad-gold-${theme})`}
              opacity="0.95"
            />
            <circle cx="100" cy="27" r="12" fill={`url(#ocellus-grad-${theme})`} />
            <circle cx="100" cy="27" r="7" fill={isBeige ? "#A38557" : "#0284c7"} />
            <circle cx="100" cy="27" r="3.5" fill={isBeige ? "#2B2117" : "#020617"} />
            <circle cx="98.5" cy="25.5" r="1.5" fill={isBeige ? "#FFF9EE" : "#38bdf8"} />
          </g>

          {/* Feather 3: -30 deg */}
          <g transform="rotate(-30 100 135)">
            <path
              d="M100 135 C94 92 84 52 92 18 C97 -3 103 -3 108 18 C116 52 106 92 100 135 Z"
              fill={`url(#feather-grad-1-${theme})`}
            />
            <circle cx="100" cy="21" r="13" fill={`url(#ocellus-grad-${theme})`} />
            <circle cx="100" cy="21" r="7.5" fill={isBeige ? "#94764E" : "#0284c7"} />
            <circle cx="100" cy="21" r="3.8" fill={isBeige ? "#2B2117" : "#020617"} />
            <circle cx="98.5" cy="19.5" r="1.5" fill={isBeige ? "#FFF9EE" : "#38bdf8"} />
          </g>

          {/* Feather 4: -15 deg */}
          <g transform="rotate(-15 100 135)">
            <path
              d="M100 135 C94 90 84 48 92 14 C97 -6 103 -6 108 14 C116 48 106 90 100 135 Z"
              fill={`url(#feather-grad-gold-${theme})`}
            />
            <circle cx="100" cy="17" r="13.5" fill={`url(#ocellus-grad-${theme})`} />
            <circle cx="100" cy="17" r="8" fill={isBeige ? "#A38557" : "#0284c7"} />
            <circle cx="100" cy="17" r="4" fill={isBeige ? "#2B2117" : "#020617"} />
            <circle cx="98.5" cy="15.5" r="1.5" fill={isBeige ? "#FFF9EE" : "#38bdf8"} />
          </g>

          {/* Feather 5: Center (0 deg) */}
          <g transform="rotate(0 100 135)">
            <path
              d="M100 135 C93 88 83 45 92 10 C97 -10 103 -10 108 10 C117 45 107 88 100 135 Z"
              fill={`url(#feather-grad-1-${theme})`}
            />
            <circle cx="100" cy="13" r="14" fill={`url(#ocellus-grad-${theme})`} />
            <circle cx="100" cy="13" r="8.5" fill={isBeige ? "#94764E" : "#0284c7"} />
            <circle cx="100" cy="13" r="4.2" fill={isBeige ? "#2B2117" : "#020617"} />
            <circle cx="98.5" cy="11.5" r="1.6" fill={isBeige ? "#FFF9EE" : "#38bdf8"} />
          </g>

          {/* Feather 6: +15 deg */}
          <g transform="rotate(15 100 135)">
            <path
              d="M100 135 C94 90 84 48 92 14 C97 -6 103 -6 108 14 C116 48 106 90 100 135 Z"
              fill={`url(#feather-grad-gold-${theme})`}
            />
            <circle cx="100" cy="17" r="13.5" fill={`url(#ocellus-grad-${theme})`} />
            <circle cx="100" cy="17" r="8" fill={isBeige ? "#A38557" : "#0284c7"} />
            <circle cx="100" cy="17" r="4" fill={isBeige ? "#2B2117" : "#020617"} />
            <circle cx="98.5" cy="15.5" r="1.5" fill={isBeige ? "#FFF9EE" : "#38bdf8"} />
          </g>

          {/* Feather 7: +30 deg */}
          <g transform="rotate(30 100 135)">
            <path
              d="M100 135 C94 92 84 52 92 18 C97 -3 103 -3 108 18 C116 52 106 92 100 135 Z"
              fill={`url(#feather-grad-1-${theme})`}
            />
            <circle cx="100" cy="21" r="13" fill={`url(#ocellus-grad-${theme})`} />
            <circle cx="100" cy="21" r="7.5" fill={isBeige ? "#94764E" : "#0284c7"} />
            <circle cx="100" cy="21" r="3.8" fill={isBeige ? "#2B2117" : "#020617"} />
            <circle cx="98.5" cy="19.5" r="1.5" fill={isBeige ? "#FFF9EE" : "#38bdf8"} />
          </g>

          {/* Feather 8: +45 deg */}
          <g transform="rotate(45 100 135)">
            <path
              d="M100 135 C94 95 85 58 92 24 C97 2 103 2 108 24 C115 58 106 95 100 135 Z"
              fill={`url(#feather-grad-gold-${theme})`}
              opacity="0.95"
            />
            <circle cx="100" cy="27" r="12" fill={`url(#ocellus-grad-${theme})`} />
            <circle cx="100" cy="27" r="7" fill={isBeige ? "#A38557" : "#0284c7"} />
            <circle cx="100" cy="27" r="3.5" fill={isBeige ? "#2B2117" : "#020617"} />
            <circle cx="98.5" cy="25.5" r="1.5" fill={isBeige ? "#FFF9EE" : "#38bdf8"} />
          </g>

          {/* Feather 9: +60 deg */}
          <g transform="rotate(60 100 135)">
            <path
              d="M100 135 C95 100 86 65 92 32 C97 8 103 8 108 32 C114 65 105 100 100 135 Z"
              fill={`url(#feather-grad-1-${theme})`}
              opacity="0.9"
            />
            <circle cx="100" cy="35" r="11" fill={`url(#ocellus-grad-${theme})`} />
            <circle cx="100" cy="35" r="6" fill={isBeige ? "#94764E" : "#0284c7"} />
            <circle cx="100" cy="35" r="3" fill={isBeige ? "#2B2117" : "#020617"} />
            <circle cx="98.5" cy="33.5" r="1.2" fill={isBeige ? "#FFF9EE" : "#38bdf8"} />
          </g>
        </g>

        {/* Lower Tail Plumage Coverts */}
        <path
          d="M72 135 C72 110 128 110 128 135 C128 155 72 155 72 135 Z"
          fill={isBeige ? "#7A6342" : "#064e3b"}
          opacity="0.6"
        />
        <circle cx="85" cy="130" r="5" fill={`url(#ocellus-grad-${theme})`} />
        <circle cx="100" cy="126" r="6" fill={`url(#ocellus-grad-${theme})`} />
        <circle cx="115" cy="130" r="5" fill={`url(#ocellus-grad-${theme})`} />

        {/* Peacock Body & Wing */}
        {/* Wing Layer */}
        <path
          d="M86 115 C78 122 75 142 85 158 C95 168 110 162 114 148 C116 136 108 120 86 115 Z"
          fill={`url(#peacock-wing-grad-${theme})`}
          stroke={isBeige ? "#D4BE9B" : "#38bdf8"}
          strokeWidth="0.8"
        />
        {/* Wing Feathers Grooves */}
        <path
          d="M86 128 C92 135 102 142 108 145 M83 138 C90 145 98 152 104 154"
          stroke={isBeige ? "#F5EAD4" : "#2dd4bf"}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Main Body Breast & Curved Neck */}
        <path
          d="M100 165 C92 165 88 155 90 140 C92 128 96 120 102 112 C108 104 110 94 107 86 C105 82 102 78 104 72 C106 66 114 64 119 70 C123 75 122 83 118 90 C114 97 112 105 116 118 C120 132 118 152 110 162 C107 165 103 165 100 165 Z"
          fill={`url(#peacock-body-grad-${theme})`}
          stroke={isBeige ? "#BFA274" : "#0284c7"}
          strokeWidth="1"
        />

        {/* Elegant Head & Beak */}
        <path
          d="M115 67 C112 65 110 68 108 72 C108 76 112 79 116 78 C120 77 124 74 125 70 C125 66 120 65 115 67 Z"
          fill={isBeige ? "#F5ECE0" : "#38bdf8"}
        />
        {/* Beak */}
        <path
          d="M125 70 L134 72 L124 74 Z"
          fill={isBeige ? "#D4A559" : "#fbbf24"}
        />
        {/* Eye */}
        <circle cx="118" cy="71" r="2.2" fill={isBeige ? "#1F170E" : "#020617"} />
        <circle cx="118.6" cy="70.4" r="0.8" fill="#ffffff" />
        {/* Eye Brow / Facial Marking */}
        <path
          d="M115 68 C117 67 121 68 122 70"
          stroke="#ffffff"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Peacock Crown / Crest (3 Royal Feathers) */}
        <g id="peacock-crest">
          <path d="M112 65 Q110 54 108 48" stroke={isBeige ? "#CBB48E" : "#38bdf8"} strokeWidth="1" />
          <circle cx="108" cy="48" r="3" fill={isBeige ? "#E5D2B3" : "#10b981"} stroke={isBeige ? "#8C6E41" : "#fbbf24"} strokeWidth="0.7" />

          <path d="M114 64 Q116 52 117 44" stroke={isBeige ? "#CBB48E" : "#38bdf8"} strokeWidth="1.2" />
          <circle cx="117" cy="44" r="3.5" fill={isBeige ? "#FFF6E5" : "#0284c7"} stroke={isBeige ? "#8C6E41" : "#fbbf24"} strokeWidth="0.8" />

          <path d="M116 65 Q122 55 125 49" stroke={isBeige ? "#CBB48E" : "#38bdf8"} strokeWidth="1" />
          <circle cx="125" cy="49" r="3" fill={isBeige ? "#E5D2B3" : "#10b981"} stroke={isBeige ? "#8C6E41" : "#fbbf24"} strokeWidth="0.7" />
        </g>

        {/* Sleek Accent Stand/Pedestal */}
        <ellipse cx="100" cy="168" rx="20" ry="3.5" fill={isBeige ? "#4A3B29" : "#0f172a"} opacity="0.5" />
        <path
          d="M90 166 Q100 170 110 166"
          stroke={isBeige ? "#C5A367" : "#fbbf24"}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
    </div>
  );
};
