import { cn } from "@/lib/utils";

interface DogEarLogoProps {
  className?: string;
}

export function DogEarLogo({ className }: DogEarLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={cn("text-primary", className)}
      aria-label="DogEar logo"
    >
      {/* Page body fill */}
      <path
        d="M10 4 L44 4 L56 16 L56 60 L10 60 Z"
        fill="currentColor"
        opacity="0.12"
      />
      {/* Page outline */}
      <path
        d="M10 4 L44 4 L56 16 L56 60 L10 60 Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Dog-ear fold — shaded triangle */}
      <path
        d="M44 4 L56 16 L44 16 Z"
        fill="currentColor"
        opacity="0.4"
      />
      <path
        d="M44 4 L56 16 L44 16 Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Content lines */}
      <line x1="19" y1="29" x2="47" y2="29" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="19" y1="38" x2="47" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="19" y1="47" x2="36" y2="47" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
