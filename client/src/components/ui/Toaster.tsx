import {
  CircleCheck,
  Info,
  Loader2,
  OctagonX,
  TriangleAlert,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Custom Toaster component integrated with the app's global design tokens (Light/Dark themes).
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheck className="w-4 h-4 text-emerald-500" />,
        info: <Info className="w-4 h-4 text-blue-500" />,
        warning: <TriangleAlert className="w-4 h-4 text-amber-500" />,
        error: <OctagonX className="w-4 h-4 text-rose-500" />,
        loading: <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />,
      }}
      style={
        {
          "--normal-bg": "var(--bg-surface)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--border-subtle)",
          "--border-radius": "var(--radius-md)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
