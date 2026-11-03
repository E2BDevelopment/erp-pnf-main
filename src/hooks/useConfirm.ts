"use client";

import * as React from "react";

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = React.createContext<ConfirmFn | null>(null);

export function useConfirm() {
  const confirm = React.useContext(ConfirmContext);

  if (!confirm) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmDialogProvider>.");
  }

  return confirm;
}
