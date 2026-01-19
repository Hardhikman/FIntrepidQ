"use client";

import { ExternalLink, Clock } from "lucide-react";

interface SourceCardProps {
    title: string;
    source: string;
    url: string;
    time?: string;
}

export function SourceCard({ title, source, url, time }: SourceCardProps) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group"
        >
            <h4 className="text-sm font-medium text-gray-200 line-clamp-2 mb-2 group-hover:text-purple-400 transition-colors">
                {title}
            </h4>
            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold">
                        {source[0]}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{source}</span>
                </div>
                {time && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{time}</span>
                    </div>
                )}
            </div>
        </a>
    );
}
