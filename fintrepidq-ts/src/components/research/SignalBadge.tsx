"use client";

import { SIGNAL_CATEGORIES, SignalIcon } from "@/lib/types/shared";
import { CheckCircle2, AlertCircle, HelpCircle, Activity } from "lucide-react";

interface SignalBadgeProps {
    category: string;
    status?: SignalIcon;
    value?: string | number;
}

export function SignalBadge({ category, status = "⚪", value }: SignalBadgeProps) {
    const getColors = () => {
        switch (status) {
            case "🟢": return "bg-green-500/10 text-green-400 border-green-500/20";
            case "🚩": case "💀": return "bg-red-500/10 text-red-400 border-red-500/20";
            case "🟡": case "⚠️": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
            default: return "bg-white/5 text-gray-500 border-white/10";
        }
    };

    const getIcon = () => {
        switch (status) {
            case "🟢": return <CheckCircle2 className="w-4 h-4" />;
            case "🚩": case "💀": return <AlertCircle className="w-4 h-4" />;
            case "🟡": case "⚠️": return <Activity className="w-4 h-4" />;
            default: return <HelpCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${getColors()}`}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{category}</span>
                {getIcon()}
            </div>
            <div className="text-sm font-bold truncate">
                {value || "Analyzing..."}
            </div>
        </div>
    );
}
