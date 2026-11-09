"use client";

import { createContext, useContext } from "react";

// Se conserva el nonce del documento durante las navegaciones del cliente.
export const CspNonceContext = createContext<string | undefined>(undefined);
export const useCspNonce = () => useContext(CspNonceContext);
