import * as React from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "glass" | "outlined" | "gradient";

const Card = React.forwardRef
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: CardVariant;
    hover?: boolean;
  }
>(({ className, variant = "default", hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl text-card-foreground transition-all duration-300",
      variant === "default" && "bg-card border border-border shadow-card-violet",
      variant === "glass" && "glass-card",
      variant === "outlined" &&
        "border border-violet-500/20 bg-violet-500/[0.02] backdrop-blur-sm",
      variant === "gradient" &&
        "relative overflow-hidden border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-card to-cyan-950/20",
      hover &&
        "hover:border-violet-400/40 hover:shadow-[0_0_32px_hsl(263_80%_65%_/_0.25)] hover:-translate-y-1 cursor-pointer",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardEyebrow = React.forwardRef
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("mono-label", className)} {...props} />
));
CardEyebrow.displayName = "CardEyebrow";

const CardTitle = React.forwardRef
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-tight tracking-tight text-white",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-3 p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardEyebrow,
  CardTitle,
  CardDescription,
  CardContent,
};
