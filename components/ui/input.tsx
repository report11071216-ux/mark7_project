import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "mono";
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400/60 pointer-events-none [&>svg]:size-4">
            {icon}
          </div>
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg border border-input bg-secondary/40 pl-10 pr-4 py-2 text-sm",
              "transition-all placeholder:text-muted-foreground/60",
              "focus-visible:outline-none focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:bg-secondary/60",
              "hover:border-violet-500/40",
              "disabled:cursor-not-allowed disabled:opacity-50",
              variant === "mono" &&
                "font-mono tracking-[0.2em] uppercase placeholder:normal-case placeholder:tracking-normal",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-secondary/40 px-4 py-2 text-sm",
          "transition-all placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:bg-secondary/60",
          "hover:border-violet-500/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variant === "mono" &&
            "font-mono tracking-[0.2em] uppercase placeholder:normal-case placeholder:tracking-normal",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
