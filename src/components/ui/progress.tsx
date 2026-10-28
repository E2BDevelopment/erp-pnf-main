"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  // `scaleX` con origen a la izquierda, igual que `BarraProporcion`: crece de
  // izquierda a derecha y el cambio de valor se anima solo con transform.
  const pct = Math.max(0, Math.min(100, value ?? 0));

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 origin-left bg-primary motion-safe:transition-transform motion-safe:duration-150"
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
