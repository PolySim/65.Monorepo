import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold outline-none transition-[background-color,color,box-shadow,scale] duration-150 ease-out focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.125rem]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary-dark",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive-hover focus-visible:ring-destructive/25",
        outline:
          "border border-primary/35 bg-transparent text-primary-dark hover:border-primary/55 hover:bg-secondary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/75",
        ghost: "text-foreground hover:bg-muted hover:text-primary-dark",
        link: "h-auto rounded-none px-0 text-primary-dark underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 has-[>svg]:pl-4 has-[>svg]:pr-3.5",
        sm: "h-10 gap-1.5 px-3 text-xs has-[>svg]:pl-3 has-[>svg]:pr-2.5",
        lg: "h-12 px-6 text-base has-[>svg]:pl-6 has-[>svg]:pr-5.5",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  static: isStatic = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    static?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        !isStatic &&
          "active:not-disabled:scale-[0.96] motion-reduce:active:scale-100",
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
