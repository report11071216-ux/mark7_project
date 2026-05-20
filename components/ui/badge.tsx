import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] transition-all whitespace-nowrap",
  {
    variants: {
      variant: {
        // 기본
        default:
          "bg-violet-500/15 text-violet-300 border border-violet-500/30",
        secondary: "bg-secondary text-muted-foreground border border-border",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/30",
        outline: "border border-violet-500/30 text-violet-200",

        // 길드 플랫폼 시그니처 ⭐
        online:
          "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 [&_.dot]:bg-cyan-400 [&_.dot]:shadow-[0_0_8px_hsl(189_94%_55%)]",
        master:
          "bg-gradient-to-r from-amber-500/20 to-violet-500/20 text-amber-200 border border-amber-500/40",
        raid: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
        glow: "bg-violet-500 text-white shadow-glow-violet",
        new: "bg-cyan-500 text-cyan-950 shadow-glow-cyan",
      },
      size: {
        default: "h-5",
        sm: "h-4 px-2 text-[9px]",
        lg: "h-6 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span className="dot inline-block h-1.5 w-1.5 rounded-full bg-current animate-glow-pulse" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
