import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// variantes de shadcn ajustadas a los botones redondeados del diseno de FriendFrame
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full text-[15px] leading-[18px] whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-55 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-current [&_svg:not([class*='size-'])]:size-[17px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:ring-2 hover:ring-brand disabled:bg-soft disabled:text-faint",
        destructive:
          "bg-danger text-white hover:ring-2 hover:ring-brand dark:bg-danger-soft disabled:bg-soft disabled:text-faint",
        outline: "border border-line bg-surface hover:bg-soft",
        secondary:
          "border-2 border-[#182240] bg-[#E5E7EB] text-[#182240] hover:border-brand disabled:text-faint",
        ghost: "text-link hover:bg-soft",
        link: "text-link underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-[18px]",
        sm: "h-8 gap-1.5 px-3 text-sm",
        lg: "h-11 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
