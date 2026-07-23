"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const navButtonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a5a5]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-white text-black hover:bg-white/90 shadow-[0_0_40px_-10px_rgba(255,255,255,0.25)]",
        secondary:
          "text-white/70 hover:text-white bg-transparent",
        outline:
          "border border-white/20 text-white hover:border-white/40 hover:bg-white/[0.04]",
        ghost:
          "text-white/60 hover:text-white bg-transparent",
      },
      size: {
        sm: "h-8 px-4 text-sm",
        md: "h-10 px-6 text-sm",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface NavButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof navButtonStyles> {
  /** When true, the button renders its child element with the button styles
   *  merged in (via Radix Slot). Use this when wrapping an `<a>` or `<Link>`. */
  asChild?: boolean;
}

export const NavButton = React.forwardRef<HTMLButtonElement, NavButtonProps>(
  function NavButton(
    { className, variant, size, asChild = false, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(navButtonStyles({ variant, size }), className)}
        {...props}
      />
    );
  },
);
