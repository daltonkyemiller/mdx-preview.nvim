import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils.js";

export const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 border px-3 font-geist-pixel text-[10px] tracking-[0.14em] uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "min-h-10 px-3",
        icon: "size-10 px-0",
        small: "min-h-8 px-2 text-xs",
      },
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:bg-primary/85",
        outline: "border-border bg-background text-foreground hover:bg-muted",
        quiet: "border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      },
    },
  }
);

export function Button({ className, size, variant, ...props }) {
  return <ButtonPrimitive className={cn(buttonVariants({ className, size, variant }))} {...props} />;
}
