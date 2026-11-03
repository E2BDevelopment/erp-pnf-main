"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

import { cn } from "@/lib/utils";

const Toaster = ({ className, toastOptions, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      richColors
      visibleToasts={4}
      gap={8}
      offset={{ top: 72, right: 24 }}
      mobileOffset={{ top: 64, right: 16, left: 16 }}
      className={cn("toaster group", className)}
      toastOptions={{
        duration: 4500,
        classNames: {
          toast: "group toast group-[.toaster]:rounded-lg group-[.toaster]:shadow-lg",
          title: "group-[.toast]:font-medium",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:border-border group-[.toast]:bg-background group-[.toast]:text-foreground",
        },
        ...toastOptions,
      }}
      {...props}
    />
  );
};

export { Toaster };
