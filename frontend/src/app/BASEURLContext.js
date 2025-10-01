"use client";
import { createContext } from 'react';

export const BaseUrlContext = createContext(process.env.NEXT_PUBLIC_BASEURL);

// Context provider component
export function BaseUrlProvider({ children }) {
    const BASEURL = process.env.NEXT_PUBLIC_MODE === 'production'
        ? process.env.NEXT_PUBLIC_BASEURL
        : 'http://localhost:5000'; // Local development URL
    return (
        <BaseUrlContext.Provider value={BASEURL}>
            {children}
        </BaseUrlContext.Provider>
    );
}