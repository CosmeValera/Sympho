import type { ReactNode, SVGProps } from 'react'

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const PlayIcon = () => (
  <Icon fill="currentColor" stroke="none">
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
  </Icon>
)

export const PauseIcon = () => (
  <Icon fill="currentColor" stroke="none">
    <rect x="6" y="4.5" width="4.2" height="15" rx="1.2" />
    <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" />
  </Icon>
)

export const ToStartIcon = () => (
  <Icon>
    <path d="M6 5v14" />
    <path d="M18.5 5.5v13a.6.6 0 0 1-.93.5L9.2 12.5a.6.6 0 0 1 0-1l8.37-6.5a.6.6 0 0 1 .93.5Z" fill="currentColor" stroke="none" />
  </Icon>
)

export const UploadIcon = () => (
  <Icon>
    <path d="M12 15V3M7 8l5-5 5 5M5 21h14" />
  </Icon>
)

export const UndoIcon = () => (
  <Icon>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icon>
)

export const RedoIcon = () => (
  <Icon>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </Icon>
)

export const TrashIcon = () => (
  <Icon>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </Icon>
)

export const TieIcon = () => (
  <Icon>
    <circle cx="5" cy="15" r="2" fill="currentColor" stroke="none" />
    <circle cx="19" cy="15" r="2" fill="currentColor" stroke="none" />
    <path d="M5 11c3-4 11-4 14 0" />
  </Icon>
)

export const BarAddIcon = () => (
  <Icon>
    <path d="M4 5v14M20 5v14M9 12h6M12 9v6" />
  </Icon>
)

export const BarRemoveIcon = () => (
  <Icon>
    <path d="M4 5v14M20 5v14M9 12h6" />
  </Icon>
)

export const LinkIcon = () => (
  <Icon>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Icon>
)

export const DownloadIcon = () => (
  <Icon>
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </Icon>
)

export const LibraryIcon = () => (
  <Icon>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Icon>
)

export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const KeyboardIcon = () => (
  <Icon>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 15h6" />
  </Icon>
)

export const PointerIcon = () => (
  <Icon>
    <path d="M4.04 4.69a.5.5 0 0 1 .65-.65l16 6.5a.5.5 0 0 1-.06.95l-6.13 1.58a2 2 0 0 0-1.43 1.43l-1.58 6.13a.5.5 0 0 1-.95.06z" />
  </Icon>
)

export const SunIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Icon>
)

export const MoonIcon = () => (
  <Icon>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </Icon>
)

export const SolarIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    <path d="M12 3a9 9 0 0 1 0 18" />
  </Icon>
)

export const CopyIcon = () => (
  <Icon>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Icon>
)

export const CloseIcon = () => (
  <Icon>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
)

export const GithubIcon = () => (
  <Icon fill="currentColor" stroke="none">
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  </Icon>
)

/** Two beamed eighth notes; the favicon draws the same shape. */
export const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
    <rect width="64" height="64" rx="14" fill="currentColor" />
    <g fill="#fff">
      <ellipse cx="20" cy="46" rx="7.5" ry="5.4" transform="rotate(-20 20 46)" />
      <ellipse cx="42" cy="41" rx="7.5" ry="5.4" transform="rotate(-20 42 41)" />
      <rect x="23.6" y="17" width="3.6" height="28" />
      <rect x="45.6" y="12" width="3.6" height="28" />
      <path d="M23.6 17 49.2 12v7.5L23.6 24.5Z" />
    </g>
  </svg>
)
