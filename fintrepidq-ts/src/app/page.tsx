"use client";

import { useState, useRef } from "react";
import { useConfig } from "@/lib/hooks/use-config";
import {
  Send, Sparkles, Settings, Terminal, Shield,
  BarChart3, Globe, Database, User, ShieldCheck,
  Zap, Save, Trash2, ArrowRight, Search, FileText, CheckCircle2, AlertCircle, StopCircle, RefreshCcw,
  ArrowUp, Square, Layers, Loader2, HelpCircle
} from "lucide-react";
import { SourceCard } from "@/components/research/SourceCard";
import { SignalBadge } from "@/components/research/SignalBadge";
import { SIGNAL_CATEGORIES } from "@/lib/types/shared";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const { apiKey, saveApiKey } = useConfig();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [status, setStatus] = useState<string>("Ready");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comparingHistory, setComparingHistory] = useState(false);

  // Real-time state
  const [sources, setSources] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [completeness, setCompleteness] = useState(0);
  const [activeTicker, setActiveTicker] = useState("");
  const [conversation, setConversation] = useState<any[]>([]);
  const [threadId, setThreadId] = useState<string>("");
  const [awaitingReview, setAwaitingReview] = useState(false);
  const [validationReport, setValidationReport] = useState<string | null>(null);

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Refs to track latest values for use in finally block (avoids stale closures)
  const latestReportRef = useRef<string | null>(null);
  const latestCompletenessRef = useRef<number>(0);

  async function handleStop() {
    if (abortController) {
      abortController.abort();
      setLoading(false);
      setStatus("Interrupted");
    }
  }

  async function handleResearch() {
    if (!query || !apiKey) return;

    const controller = new AbortController();
    setAbortController(controller);

    const tid = crypto.randomUUID();
    setThreadId(tid);
    setAwaitingReview(false);
    setValidationReport(null);

    setLoading(true);
    setReport(null);
    setCompareResult(null);
    setSaved(false);
    setSources([]);
    setCompleteness(0);
    setConversation([]);

    // Immediate ticker detection for UI header
    if (query.length <= 5 && !query.includes(" ")) {
      setActiveTicker(query.toUpperCase());
    } else {
      setActiveTicker("");
    }

    // --- Command Detection ---
    const lowerQuery = query.toLowerCase().trim();

    // Handle "Save" command
    if (lowerQuery === "save" && report && activeTicker) {
      handleSave();
      setLoading(false);
      return;
    }

    // Handle "Compare X history" command
    const historyMatch = lowerQuery.match(/compare\s+(\w+)\s+history/i);
    if (historyMatch) {
      const tickerToCompare = historyMatch[1].toUpperCase();
      setActiveTicker(tickerToCompare);
      handleCompareHistory();
      setLoading(false);
      return;
    }

    // Handle "list reports" or "show reports" command
    if (lowerQuery === "list reports" || lowerQuery === "show reports" || lowerQuery === "vault") {
      setStatus("Fetching saved reports...");
      try {
        const res = await fetch("/api/reports");
        const data = await res.json();
        if (data.reports && data.reports.length > 0) {
          const reportList = data.reports.map((r: any) =>
            `| ${r.id} | ${r.ticker} | ${new Date(r.createdAt).toLocaleDateString()} |`
          ).join("\n");
          setCompareResult(`## 📁 Saved Reports\n\n| ID | Ticker | Date |\n|---|---|---|\n${reportList}\n\n*Use "delete report [ID]" to remove a report*`);
          setActiveTicker("Vault");
        } else {
          setCompareResult("## 📁 Saved Reports\n\nNo saved reports found. Analyze a stock and click **Save Report** to store it.");
          setActiveTicker("Vault");
        }
      } catch (e) {
        setStatus("Failed to fetch reports");
      }
      setLoading(false);
      return;
    }

    // Handle "delete report X" command
    const deleteMatch = lowerQuery.match(/delete\s+report\s+(\d+)/i);
    if (deleteMatch) {
      const reportId = deleteMatch[1];
      setStatus(`Deleting report ${reportId}...`);
      try {
        const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          setCompareResult(`## ✅ Report Deleted\n\nReport **#${reportId}** for **${data.deleted?.ticker || "unknown"}** has been deleted.\n\nType "list reports" to view remaining reports.`);
          setActiveTicker("Vault");
          setStatus("Report deleted");
        } else {
          setCompareResult(`## ❌ Delete Failed\n\n${data.error || data.message || "Unknown error"}`);
          setActiveTicker("Error");
        }
      } catch (e) {
        setCompareResult("## ❌ Delete Failed\n\nCould not connect to server.");
      }
      setLoading(false);
      return;
    }

    setStatus("Parsing Intent...");

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        body: JSON.stringify({ query, apiKey, threadId: tid }),
        signal: controller.signal
      });

      const contentType = res.headers.get("Content-Type");

      if (contentType?.includes("application/json")) {
        const data = await res.json();
        if (data.type === "ROUTED_TO_COMPARE") {
          return handleCompare(data.tickers);
        } else if (data.type === "EXISTING_REPORT") {
          // Show saved report from database
          setActiveTicker(data.ticker);
          setReport(data.report);
          setStatus("Showing Saved Report");
          setConversation([{
            agent: "Vault",
            message: data.message,
            timestamp: new Date().toISOString()
          }]);
          setLoading(false);
          return;
        } else if (data.type === "NO_REPORT_FOUND") {
          // No report exists, inform user
          setActiveTicker(data.ticker);
          setStatus("No Report Found");
          setConversation([{
            agent: "System",
            message: data.message,
            timestamp: new Date().toISOString()
          }]);
          setLoading(false);
          return;
        } else if (data.error) {
          alert(data.message || data.error);
          setLoading(false);
          return;
        }
      }

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by \n\n
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || ""; // Keep the last partial part in the buffer

        for (const part of parts) {
          const lines = part.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const state = JSON.parse(line.slice(6));

                // 1. Ticker Discovery
                if (state.ticker) setActiveTicker(state.ticker);

                // 2. Data Collection Progress
                if (state.newsData) {
                  const combined = [
                    ...(state.newsData.strategic || []),
                    ...(state.newsData.recent || [])
                  ];
                  if (combined.length > 0) {
                    setSources(prev => [...prev, ...combined].slice(0, 30));
                  }
                }

                // 3. Agentic Conversation Tracking
                if (state.agentConversation && state.agentConversation.length > 0) {
                  setConversation((prev: any[]) => {
                    // Avoid duplicates if the same message is sent twice (unlikely but safe)
                    const existingTimestamps = new Set(prev.map(m => m.timestamp));
                    const newMsgs = state.agentConversation.filter((m: any) => !existingTimestamps.has(m.timestamp));
                    return [...prev, ...newMsgs];
                  });
                }

                // 4. Status Progression Logic
                if (state.finalReport) {
                  setReport(state.finalReport);
                  latestReportRef.current = state.finalReport;
                  setStatus("Analysis Complete");
                } else if (state.analysisResult) {
                  setStatus("Phase 4: Synthesis & Formatting...");
                  if (state.analysisResult.metricsTable) {
                    setSignals(state.analysisResult.metricsTable);
                  }
                } else if (state.validationResult) {
                  setCompleteness(state.validationResult.completenessScore);
                  latestCompletenessRef.current = state.validationResult.completenessScore;
                  setValidationReport(state.validationResult.validationReport);
                  setStatus("Phase 3: AI Cognitive Analysis...");
                } else if (state.newsData) {
                  setStatus("Phase 2: Validating Captured Signals...");
                } else if (state.financialData) {
                  setStatus("Phase 1: Financials Gathered. Scanning Strategic News...");
                } else if (state.ticker) {
                  setStatus("Phase 0: Resolution Complete. Initiating Engine...");
                }
              } catch (e) {
                console.error("Error parsing stream chunk", e);
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error(err);
      alert("Failed to connect to the research engine.");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        // Check if we hit an interrupt (suspended with validation but no report)
        // Using refs to avoid stale closure issue
        if (!latestReportRef.current && latestCompletenessRef.current > 0) {
          setAwaitingReview(true);
          setStatus("Awaiting Institutional Review");
        }
      }
    }
  }

  async function handleAuthorize() {
    if (!threadId || !apiKey) return;

    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    setAwaitingReview(false);
    setStatus("Resuming Deep-Dive Synthesis...");

    try {
      const res = await fetch("/api/research/resume", {
        method: "POST",
        body: JSON.stringify({ threadId, apiKey }),
        signal: controller.signal
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const state = JSON.parse(line.slice(6));
                if (state.agentConversation && state.agentConversation.length > 0) {
                  setConversation((prev: any[]) => {
                    const existingTimestamps = new Set(prev.map(m => m.timestamp));
                    const newMsgs = state.agentConversation.filter((m: any) => !existingTimestamps.has(m.timestamp));
                    return [...prev, ...newMsgs];
                  });
                }
                if (state.finalReport) {
                  setReport(state.finalReport);
                  setStatus("Analysis Complete");
                } else if (state.analysisResult) {
                  setStatus("Phase 4: Synthesis & Formatting...");
                  if (state.analysisResult.metricsTable) {
                    setSignals(state.analysisResult.metricsTable);
                  }
                }
              } catch (e) {
                console.error("Error parsing resume chunk", e);
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error(err);
      alert("Failed to resume analysis.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function handleCompare(tickers: string[]) {
    setStatus(`Comparing ${tickers.join(" & ")}...`);
    setActiveTicker(tickers.join(" vs "));
    setConversation([{
      agent: "Human (Investor)",
      message: `Strategic Comparison requested for ${tickers.join(" vs ")}. Initiating clash analysis.`,
      timestamp: new Date().toISOString()
    }]);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        body: JSON.stringify({ tickers, apiKey }),
        signal: abortController?.signal
      });
      const data = await res.json();

      if (res.ok) {
        setCompareResult(data.comparison);
        setStatus("Comparison Complete");
      } else {
        alert(data.message || "Comparison failed.");
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error(err);
      alert("Comparison engine error.");
    } finally {
      if (!abortController?.signal.aborted) setLoading(false);
    }
  }

  async function handleSave() {
    if (!report || !activeTicker) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          ticker: activeTicker.toUpperCase(),
          report: report,
          sessionId: "live-session",
          userId: "user-1",
        }),
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleCompareHistory() {
    if (!activeTicker || !apiKey) return;
    setComparingHistory(true);
    setStatus("Comparing with previous report...");
    try {
      const res = await fetch("/api/compare-history", {
        method: "POST",
        body: JSON.stringify({ ticker: activeTicker, apiKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setCompareResult(data.comparison);
        setStatus("Historical Comparison Complete");
      } else {
        alert(data.message || "Not enough reports to compare.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to compare reports.");
    } finally {
      setComparingHistory(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-purple-500/30">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#121214] border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Configure AI</h3>
              <button onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="Paste your key here..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors"
                  value={apiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                />
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all">Save Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowHelp(false)}>
          <div className="w-full max-w-2xl bg-[#121214] border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">What can you do?</h3>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
                <p className="text-[10px] uppercase text-purple-400 font-bold mb-3">📊 Analyze Stocks</p>
                <div className="space-y-2 text-gray-400">
                  <p><span className="text-white font-mono">"NVDA"</span> - Quick ticker</p>
                  <p><span className="text-white font-mono">"Analyze Tesla"</span> - By name</p>
                  <p><span className="text-white font-mono">"Samsung"</span> - Auto-resolves</p>
                </div>
              </div>
              <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
                <p className="text-[10px] uppercase text-blue-400 font-bold mb-3">⚔️ Compare</p>
                <div className="space-y-2 text-gray-400">
                  <p><span className="text-white font-mono">"AAPL vs MSFT"</span></p>
                  <p><span className="text-white font-mono">"Compare GOOGL META"</span></p>
                </div>
              </div>
              <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
                <p className="text-[10px] uppercase text-green-400 font-bold mb-3">🌏 International</p>
                <div className="space-y-2 text-gray-400">
                  <p><span className="text-white font-mono">"RELIANCE.NS"</span> - India</p>
                  <p><span className="text-white font-mono">"005930.KS"</span> - Korea</p>
                  <p><span className="text-white font-mono">"7203.T"</span> - Japan</p>
                </div>
              </div>
              <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
                <p className="text-[10px] uppercase text-yellow-400 font-bold mb-3">💾 Vault</p>
                <div className="space-y-2 text-gray-400">
                  <p><span className="text-white font-mono">"list reports"</span> - View all</p>
                  <p><span className="text-white font-mono">"delete report 123"</span></p>
                  <p><span className="text-white">Compare History</span> - Button</p>
                </div>
              </div>
              <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
                <p className="text-[10px] uppercase text-pink-400 font-bold mb-3">💬 Ask <span className="text-gray-500">(saved)</span></p>
                <div className="space-y-2 text-gray-400">
                  <p><span className="text-white font-mono">"What are TSLA risks?"</span></p>
                  <p><span className="text-white font-mono">"Why is AMD a buy?"</span></p>
                  <p><span className="text-white font-mono">"Latest news on NVDA"</span></p>
                </div>
              </div>
              <div className="border border-white/5 rounded-xl p-5 bg-white/[0.02]">
                <p className="text-[10px] uppercase text-cyan-400 font-bold mb-3">🔍 Deep <span className="text-gray-500">(saved)</span></p>
                <div className="space-y-2 text-gray-400">
                  <p><span className="text-white font-mono">"AAPL debt analysis"</span></p>
                  <p><span className="text-white font-mono">"Show MSFT red flags"</span></p>
                  <p><span className="text-white font-mono">"GOOGL valuation"</span></p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-6">Press ESC or click outside to close</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl z-[50]">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => (window.location.href = "/")}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <h1 className="text-lg font-bold">FIntrepidQ</h1>
          </div>

          <div className="flex items-center gap-4">
            {!apiKey && (
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 text-[10px] font-bold text-yellow-500/80 bg-yellow-500/5 border border-yellow-500/10 px-3 py-1.5 rounded-full hover:bg-yellow-500/10 transition-all"
              >
                <AlertCircle className="w-3 h-3" />
                Missing API Key
              </button>
            )}
            <button onClick={() => setShowHelp(true)} className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-400 hover:text-white" title="Help">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-400 hover:text-white" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16 min-h-screen">
        {!report && !compareResult && !loading && !awaitingReview && conversation.length === 0 ? (
          /* Hero Section */
          <div className="max-w-4xl mx-auto pt-48 px-6 flex flex-col items-center text-center">
            <h2 className="text-7xl font-extrabold mb-12 tracking-tight leading-none italic">
              Research <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Faster.</span> <br /> Make Decisions <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Smarter.</span>
            </h2>

            <div className="w-full max-w-2xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-40 transition duration-700"></div>
              <div className="relative bg-[#161618] border border-white/10 rounded-[2.5rem] p-3 flex items-center shadow-3xl">
                <textarea
                  rows={1}
                  placeholder="Analyze ticker or Compare..."
                  className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-xl font-medium resize-none placeholder:text-gray-600"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleResearch();
                    }
                  }}
                />

                <button
                  disabled={!query || !apiKey}
                  onClick={handleResearch}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${!query || !apiKey
                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                    : "bg-white text-black hover:bg-gray-200 active:scale-95 shadow-xl shadow-white/5"
                    }`}
                >
                  <ArrowUp className="w-6 h-6 stroke-[3]" />
                </button>
              </div>

              {!apiKey && (
                <p className="mt-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Please set your Gemini Key in settings to start research
                </p>
              )}
            </div>


          </div>
        ) : (
          /* Research Stream */
          <div className="max-w-[800px] mx-auto px-6 py-12 animate-in slide-in-from-bottom-4 duration-1000 space-y-12">

            {/* Header Status */}
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">{activeTicker || "Initializing..."}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${loading ? "bg-purple-500 animate-pulse" : "bg-green-500"}`}></div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{status}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {loading && (
                  <button onClick={handleStop} className="w-10 h-10 rounded-full border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-red-500 transition-all flex items-center justify-center">
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>
            </div>

            {/* Unified Intelligence Timeline */}
            <div className="relative space-y-8 pl-4">
              <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

              {conversation.map((msg, i) => {
                const isLast = i === conversation.length - 1;
                const isHuman = msg.agent.includes("Human");

                // Icon Logic
                const Icon = isHuman ? User :
                  msg.agent.includes("Manager") ? ShieldCheck :
                    msg.agent.includes("Extraction") ? Database :
                      msg.agent.includes("News") ? Globe :
                        msg.agent.includes("QA") ? Search :
                          msg.agent.includes("Strategist") ? Zap :
                            msg.agent.includes("Specialist") ? FileText : Sparkles;

                // Dynamic Sections Injection
                const showSources = msg.agent.includes("News") && sources.length > 0;


                return (
                  <div key={i} className="animate-in slide-in-from-bottom-2 duration-700">
                    {/* Agent Message Row */}
                    <div className="flex gap-6 group">
                      <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 flex-shrink-0 ${isLast && loading ? "bg-purple-500/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]" :
                        isHuman ? "bg-blue-500/10 border-blue-500/30" : "bg-white/[0.03] border-white/10 group-hover:border-purple-500/30"
                        }`}>
                        <Icon className={`w-5 h-5 ${isLast && loading ? "text-purple-400 animate-pulse" :
                          isHuman ? "text-blue-400" : "text-gray-500 group-hover:text-purple-400"
                          }`} />
                      </div>

                      <div className="flex-1 pt-1 overflow-hidden">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isLast && loading ? "text-purple-400" :
                            isHuman ? "text-blue-400" : "text-gray-400 group-hover:text-gray-200"
                            }`}>{msg.agent}</span>
                          <span className="text-[9px] text-gray-600 font-mono">[{new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                        </div>
                        <div className={`text-[14px] leading-relaxed transition-all duration-500 ${isLast && loading ? "text-gray-100" :
                          isHuman ? "text-gray-300 italic" : "text-gray-400"
                          }`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>

                    {/* Injected Sources Panel */}
                    {showSources && (
                      <div className="ml-16 mt-6 mb-8">
                        <h4 className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                          <Database className="w-3 h-3" /> Context Sources
                        </h4>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                          {sources.map((s, idx) => (
                            <div key={idx} className="min-w-[200px]">
                              <SourceCard
                                title={s.title}
                                url={s.url}
                                source={s.source || "Strategic Feed"}
                                time={s.publishedDate ? new Date(s.publishedDate).toLocaleDateString() : undefined}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}


                  </div>
                );
              })}
            </div>

            {/* Authorization / Review Card */}
            {awaitingReview && !loading && (
              <div className="ml-16 animate-in zoom-in-95 duration-700">
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-[2rem] p-8 shadow-2xl shadow-purple-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield className="w-24 h-24 text-purple-400" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold">Review Required</h3>
                    </div>

                    <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-lg">
                      Data extraction is complete with <span className="text-purple-400 font-bold">{completeness.toFixed(0)}% metrics</span>.
                      Institutional protocols require manual authorization before proceeding with the deep-dive cognitive synthesis and final investment thesis.
                    </p>

                    {validationReport && (
                      <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/5 font-mono text-[10px] text-gray-500 whitespace-pre-wrap">
                        {validationReport}
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleAuthorize}
                        className="bg-white text-black font-black text-[11px] uppercase tracking-widest px-8 py-3.5 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
                      >
                        Authorize Analyst <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setAwaitingReview(false); setStatus("Analysis Aborted"); }}
                        className="text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Abort Mission
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Final Report Stream */}
            {(report || compareResult) && (
              <div className="ml-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-white/10"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Final Thesis</span>
                  <div className="h-px flex-1 bg-white/10"></div>
                </div>
                <article className="prose prose-invert max-w-none">
                  <div className="font-serif text-lg text-gray-300 leading-8 selection:bg-purple-500/30">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ ...props }) => <a {...props} className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer" />,
                        strong: ({ ...props }) => <strong {...props} className="text-white font-bold" />,
                        h1: ({ ...props }) => <h1 {...props} className="text-3xl font-black tracking-tight text-white mb-6" />,
                        h2: ({ ...props }) => <h2 {...props} className="text-2xl font-bold tracking-tight text-white mt-10 mb-4" />,
                        h3: ({ ...props }) => <h3 {...props} className="text-xl font-bold text-white mt-8 mb-3" />,
                        p: ({ ...props }) => <p {...props} className="mb-6" />,
                        ul: ({ ...props }) => <ul {...props} className="list-disc pl-6 mb-6 space-y-2" />,
                        ol: ({ ...props }) => <ol {...props} className="list-decimal pl-6 mb-6 space-y-2" />,
                        li: ({ ...props }) => <li {...props} className="pl-2" />,
                        table: ({ ...props }) => (
                          <div className="overflow-x-auto my-8 border border-white/10 rounded-2xl">
                            <table {...props} className="w-full text-sm text-left border-collapse" />
                          </div>
                        ),
                        thead: ({ ...props }) => <thead {...props} className="bg-white/5" />,
                        th: ({ ...props }) => <th {...props} className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-400 border-b border-white/10" />,
                        td: ({ ...props }) => <td {...props} className="px-6 py-4 border-b border-white/5" />,
                      }}
                    >
                      {report || compareResult || ""}
                    </ReactMarkdown>
                  </div>
                </article>

                {report && (
                  <div className="mt-12 space-y-6">
                    {/* Action Buttons */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${saved
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : saving
                            ? "bg-white/5 text-gray-500 cursor-wait"
                            : "bg-white text-black hover:bg-gray-200 active:scale-95"
                          }`}
                      >
                        {saved ? (
                          <><CheckCircle2 className="w-4 h-4" /> Saved to Vault</>
                        ) : saving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="w-4 h-4" /> Save Report</>
                        )}
                      </button>
                      <button
                        onClick={handleCompareHistory}
                        disabled={comparingHistory}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-white/10 text-gray-300 hover:bg-white/5 hover:border-purple-500/30 transition-all"
                      >
                        {comparingHistory ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Comparing {activeTicker}...</>
                        ) : (
                          <><Layers className="w-4 h-4" /> Compare {activeTicker} History</>
                        )}
                      </button>
                    </div>

                    <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02]">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">What you can do next</h4>
                      <div className="space-y-3 text-sm text-gray-400">
                        <p>• Type <span className="text-purple-400 font-mono">"Compare {activeTicker} with [TICKER]"</span> to compare with another stock</p>
                        <p>• Type a new ticker to start a fresh analysis</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-600 font-mono text-center">End of Report • {new Date().toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}

            {loading && !report && !compareResult && conversation.length > 0 && (
              <div className="ml-16 mt-4">
                <div className="flex items-center gap-3 text-purple-400/50 animate-pulse">
                  <span className="text-[10px] uppercase tracking-widest">Processing</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-0"></div>
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-100"></div>
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 h-10 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-center">
        <p className="text-[8px] font-bold uppercase tracking-[0.5em] text-gray-600">Institutional Equity Intelligence &copy; 2026 FIntrepidQ</p>
      </footer>
      <style jsx global>{` textarea { field-sizing: content; } `}</style>
    </div >
  );
}
