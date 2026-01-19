"use client";

import { useState, useEffect } from "react";

export function useConfig() {
    const [apiKey, setApiKey] = useState<string>("");

    useEffect(() => {
        const savedKey = localStorage.getItem("GEMINI_API_KEY");
        if (savedKey) setApiKey(savedKey);
    }, []);

    const saveApiKey = (key: string) => {
        localStorage.setItem("GEMINI_API_KEY", key);
        setApiKey(key);
    };

    return { apiKey, saveApiKey };
}
