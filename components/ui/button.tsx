import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // 표준 shadcn variants
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-violet hover:shadow-[0_0_32px_hsl(263_80%_65%_/_0.6)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-violet-500/30 bg-transparent text-violet-200 hover:bg-violet-500/10 hover:border-violet-400",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        ghost: "hover:bg-violet-500/10 hover:text-violet-200",
        link: "text-violet-400 underline-offset-4 hover:underline",

        // 길드 플랫폼 시그니처 variants ⭐
        gradient:
          "relative overflow-hidden bg-gradient-to-r from-violet-600 via-violet-500 to-cyan-500 text-white shadow-glow-violet hover:shadow-[0_0_40px_hsl(263_80%_65%_/_0.7)] hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-1000",
        glow: "bg-violet-500 text-white shadow-[0_0_24px_hsl(263_80%_65%_/_0.4)] hover:shadow-[0_0_48px_hsl(263_80%_65%_/_0.8)] hover:bg-violet-400 hover:scale-[1.02]",
        cyan: "bg-cyan-500 text-cyan-950 hover:bg-cyan-400 shadow-glow-cyan hover:shadow-[0_0_32px_hsl(189_94%_55%_/_0.6)] font-bold",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
