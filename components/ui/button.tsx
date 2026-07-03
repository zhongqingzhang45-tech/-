import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:brightness-110",
        secondary:
          "bg-white/5 text-white border border-white/15 backdrop-blur-md hover:bg-white/10",
        outline:
          "border border-white/20 bg-transparent text-white hover:bg-white/5",
        ghost: "text-ink-300 hover:text-white hover:bg-white/5",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25",
        glass:
          "glass-purple text-white hover:brightness-110",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
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
