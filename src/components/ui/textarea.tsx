import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-muted/40 flex field-sizing-content min-h-20 w-full rounded-lg border px-3.5 py-2.5 text-base shadow-xs transition-[color,box-shadow,border-color,background-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-foreground/20",
        "focus-visible:border-brand focus-visible:ring-brand/25 focus-visible:ring-[3px]",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
