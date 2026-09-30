// Line-icon set for the trading desk. 16px grid, 1.5 stroke, currentColor so
// they inherit whatever tone the surrounding text uses.
const s = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Svg({ className = 'h-4 w-4', children }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...s} aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconGauge = (p) => (
  <Svg {...p}>
    <path d="M3.5 15a7.5 7.5 0 1 1 13 0" />
    <path d="M10 11.5 13 8" />
    <circle cx="10" cy="12" r="1.1" />
  </Svg>
);

export const IconCandles = (p) => (
  <Svg {...p}>
    <path d="M6 3.5v3M6 13.5v3M14 4.5v2M14 12.5v3" />
    <rect x="4" y="6.5" width="4" height="7" rx="1" />
    <rect x="12" y="6.5" width="4" height="6" rx="1" />
  </Svg>
);

export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="7.5" cy="7" r="2.6" />
    <path d="M2.6 16c.5-2.6 2.5-4.2 4.9-4.2S11.9 13.4 12.4 16" />
    <path d="M13 5.2a2.6 2.6 0 0 1 0 5" />
    <path d="M14.4 11.9c1.6.5 2.7 1.9 3 4.1" />
  </Svg>
);

export const IconSpark = (p) => (
  <Svg {...p}>
    <path d="M10 2.5 11.6 7l4.4 1.6L11.6 10 10 14.5 8.4 10 4 8.6 8.4 7z" />
    <path d="M15.5 13.5v3M14 15h3" />
  </Svg>
);

export const IconLayers = (p) => (
  <Svg {...p}>
    <path d="m10 3 6.5 3.4L10 9.8 3.5 6.4z" />
    <path d="m3.5 10 6.5 3.4 6.5-3.4" />
    <path d="m3.5 13.6 6.5 3.4 6.5-3.4" />
  </Svg>
);

export const IconWalletLine = (p) => (
  <Svg {...p}>
    <path d="M3 6.5A2 2 0 0 1 5 4.5h9.5a1 1 0 0 1 1 1v1" />
    <rect x="3" y="6.5" width="14" height="9" rx="2" />
    <path d="M13 10.4h3v2.2h-3a1.1 1.1 0 0 1 0-2.2z" />
  </Svg>
);

export const IconPackage = (p) => (
  <Svg {...p}>
    <path d="m10 2.8 6 3.2v7.8l-6 3.4-6-3.4V6z" />
    <path d="M4 6l6 3.2L16 6M10 9.2v8" />
    <path d="m7 4.4 6 3.2" />
  </Svg>
);

export const IconPulse = (p) => (
  <Svg {...p}>
    <path d="M2.5 10h3l2-4.5 3 9 2-4.5h4.5" />
  </Svg>
);

export const IconBitcoin = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="7" />
    <path d="M8 6.6h3.1a1.7 1.7 0 0 1 0 3.4H8zm0 3.4h3.4a1.7 1.7 0 0 1 0 3.4H8z" />
    <path d="M8 6.6V13.4M9.4 5.2v1.4M11.4 5.2v1.4M9.4 13.4v1.4M11.4 13.4v1.4" />
  </Svg>
);

export const IconArrowDownLeft = (p) => (
  <Svg {...p}>
    <path d="M14 6 6 14" />
    <path d="M12.5 14H6V7.5" />
  </Svg>
);

export const IconArrowUpRight = (p) => (
  <Svg {...p}>
    <path d="M6 14 14 6" />
    <path d="M7.5 6H14v6.5" />
  </Svg>
);

export const IconList = (p) => (
  <Svg {...p}>
    <path d="M7 6h9M7 10h9M7 14h9" />
    <path d="M3.6 6h.01M3.6 10h.01M3.6 14h.01" />
  </Svg>
);

export const IconVerified = (p) => (
  <Svg {...p}>
    <path d="M10 2.6 12 4l2.4-.2.6 2.3 1.9 1.4-1 2.2 1 2.2-1.9 1.4-.6 2.3L12 16l-2 1.4L8 16l-2.4.2-.6-2.3-1.9-1.4 1-2.2-1-2.2 1.9-1.4.6-2.3L8 4z" />
    <path d="m7.4 10 1.8 1.8 3.4-3.6" />
  </Svg>
);

export const IconShieldCheck = (p) => (
  <Svg {...p}>
    <path d="M10 2.6 16 5v4.4c0 3.7-2.4 6.6-6 8-3.6-1.4-6-4.3-6-8V5z" />
    <path d="m7.5 9.9 1.8 1.8 3.3-3.5" />
  </Svg>
);

export const IconChat = (p) => (
  <Svg {...p}>
    <path d="M17 11.5a2.5 2.5 0 0 1-2.5 2.5H7l-4 3V5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5z" />
    <path d="M7 7.5h6M7 10.4h4" />
  </Svg>
);

export const IconSettings = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="2.4" />
    <path d="M10 2.6v2M10 15.4v2M17.4 10h-2M4.6 10h-2M15.2 4.8l-1.4 1.4M6.2 13.8l-1.4 1.4M15.2 15.2l-1.4-1.4M6.2 6.2 4.8 4.8" />
  </Svg>
);

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" />
    <path d="M5.5 5.5 6.2 16a1 1 0 0 0 1 1h5.6a1 1 0 0 0 1-1l.7-10.5" />
    <path d="M8.6 8.6v5M11.4 8.6v5" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" />
  </Svg>
);

export const IconEye = (p) => (
  <Svg {...p}>
    <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" />
    <circle cx="10" cy="10" r="2.2" />
  </Svg>
);

export const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M4 4.5C2.7 5.7 2 7 2 10s3 5.5 8 5.5c1.2 0 2.3-.2 3.2-.6" />
    <path d="M8 6.2A5 5 0 0 1 10 4.5c5 0 8 5.5 8 5.5a13 13 0 0 1-2 2.6" />
    <path d="M8.4 8.4a2.2 2.2 0 0 0 3.1 3.1" />
    <path d="M3 3l14 14" />
  </Svg>
);

export const IconBell = (p) => (
  <Svg {...p}>
    <path d="M6 8a4 4 0 0 1 8 0c0 3.5 1.2 4.8 1.8 5.4.3.3.1.9-.4.9H4.6c-.5 0-.7-.6-.4-.9C4.8 12.8 6 11.5 6 8Z" />
    <path d="M8.4 16.5a1.8 1.8 0 0 0 3.2 0" />
  </Svg>
);

export const IconSend = (p) => (
  <Svg {...p}>
    <path d="M17 3 9 11" />
    <path d="M17 3l-5.5 14-2.5-6-6-2.5L17 3Z" />
  </Svg>
);
