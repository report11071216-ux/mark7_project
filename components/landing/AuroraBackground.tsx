import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  variant?: "full" | "subtle";
}

export function AuroraBackground({ className, variant = "full" }: AuroraBackgroundProps) {
  return (
    <div
      className={cn("absolute inset-0 overflow-hidden -z-10", className)}
      aria-hidden="true"
    >
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/30 blur-[120px] animate-aurora" />
      <div
        className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[100px] animate-aurora"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-500/20 blur-[110px] animate-aurora"
        style={{ animationDelay: "-10s" }}
      />

      {variant === "full" && (
        <>
          <div className="absolute inset-0 bg-grid-violet bg-[size:32px_32px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(263_25%_6%)_85%)]" />
        </>
      )}
    </div>
  );
}
