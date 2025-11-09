import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[2px_2px_0px_rgba(0,0,0,0.15)]",
  {
    variants: {
      variant: {
        default: "border-foreground/20 bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-foreground/20 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-foreground/20 bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-foreground/30 bg-background/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
