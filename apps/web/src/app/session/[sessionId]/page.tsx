"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Check, Circle, PartyPopper, ArrowRight, Lightbulb } from "lucide-react";

const CodeEditor = dynamic(
  () => import("@/components/CodeEditor"),
  { ssr: false, loading: () => <div className="h-[400px] bg-slate-900 animate-pulse rounded-lg" /> }
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Session {
  id: string;
  classroomId: string;
  studentName: string;
  currentPhase: string;
  specText: string | null;
  codeText: string | null;
}

interface DialogueTurn {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

interface EditorStatus {
  can_edit: boolean;
  reason: string;
}

interface GapAnalysis {
  [key: string]: string;
}

const PHASES = ["spec", "approved", "editing", "submitted", "reflecting", "complete"];
const PHASE_LABELS: Record<string, string> = {
  spec: "Spec",
  approved: "Approved",
  editing: "Writing",
  submitted: "Submitted",
  reflecting: "Reflecting",
  complete: "Complete",
};

const PHASE_COLORS: Record<string, string> = {
  spec: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  editing: "bg-teal-100 text-teal-800",
  submitted: "bg-purple-100 text-purple-800",
  reflecting: "bg-orange-100 text-orange-800",
  complete: "bg-gray-100 text-gray-800",
};

const PHASE_ICONS: Record<string, React.ElementType> = {
  spec: Circle,
  approved: Check,
  editing: Circle,
  submitted: ArrowRight,
  reflecting: Lightbulb,
  complete: PartyPopper,
};

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [turns, setTurns] = useState<DialogueTurn[]>([]);
  const [editorStatus, setEditorStatus] = useState<EditorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingSpec, setSendingSpec] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [submittingReflection, setSubmittingReflection] = useState(false);
  const [reflectionScore, setReflectionScore] = useState<number | null>(null);
  const [reflectionMessage, setReflectionMessage] = useState("");
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [reflectionPrompts, setReflectionPrompts] = useState<string[]>([]);

  const [specInput, setSpecInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [codeInput, setCodeInput] = useState("# Write your code here\n");
  const [reflectionInput, setReflectionInput] = useState("");

  const fetchSession = useCallback(async () => {
    try {
      const [sessionRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/sessions/${sessionId}`),
        fetch(`${API_URL}/sessions/${sessionId}/editor-status`),
      ]);

      if (sessionRes.ok) {
        const data = await sessionRes.json();
        setSession(data);
        if (data.specText && !specInput) {
          setSpecInput(data.specText);
        }
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setEditorStatus(statusData);
      }
    } catch (err) {
      console.error("Failed to fetch session", err);
    }
  }, [sessionId, specInput]);

  const fetchDialogue = async () => {
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/dialogue`);
      if (res.ok) {
        const data = await res.json();
        setTurns(data);
      }
    } catch (err) {
      console.error("Failed to fetch dialogue", err);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchSession(), fetchDialogue()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      fetchSession();
      fetchDialogue();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const handleSendSpec = async () => {
    if (!specInput.trim()) return;
    setSendingSpec(true);
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/spec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec_text: specInput }),
      });
      if (res.ok) {
        await fetchSession();
        await fetchDialogue();
      }
    } catch (err) {
      console.error("Failed to send spec", err);
    } finally {
      setSendingSpec(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    setSendingChat(true);
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput }),
      });
      if (res.ok) {
        setChatInput("");
        await fetchDialogue();
      }
    } catch (err) {
      console.error("Failed to send chat", err);
    } finally {
      setSendingChat(false);
    }
  };

  const handleSubmitCode = async () => {
    setSendingCode(true);
    setGapAnalysis(null);
    setReflectionPrompts([]);
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/submit-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec_text: codeInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setGapAnalysis(data.gapAnalysis);
        setReflectionPrompts(data.reflectionPrompts);
        await fetchSession();
      }
    } catch (err) {
      console.error("Failed to submit code", err);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmitReflection = async () => {
    if (!reflectionInput.trim()) return;
    setSubmittingReflection(true);
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/reflect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflection_text: reflectionInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setReflectionScore(data.score);
        setReflectionMessage(data.message);
        await fetchSession();
      }
    } catch (err) {
      console.error("Failed to submit reflection", err);
    } finally {
      setSubmittingReflection(false);
    }
  };

  const handleApproveSpec = async () => {
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/approve-spec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      if (res.ok) {
        await fetchSession();
      }
    } catch (err) {
      console.error("Failed to approve spec", err);
    }
  };

  const handleStartNew = () => {
    router.push("/");
  };

  if (loading || !session) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-slate-500">Loading session...</p>
      </div>
    );
  }

  const currentPhaseIndex = PHASES.indexOf(session.currentPhase);
  const isSpecPhase = session.currentPhase === "spec";
  const isApprovedPhase = session.currentPhase === "approved";
  const isReflectingPhase = session.currentPhase === "reflecting" || session.currentPhase === "submitted";
  const isComplete = session.currentPhase === "complete";
  const canEdit = editorStatus?.can_edit || false;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Welcome, {session.studentName}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            {PHASES.map((phase, index) => {
              const Icon = PHASE_ICONS[phase];
              const isActive = index <= currentPhaseIndex;
              const isCurrent = phase === session.currentPhase;
              return (
                <div key={phase} className="flex items-center">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    isCurrent ? PHASE_COLORS[phase] : isActive ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-400"
                  }`}>
                    <Icon className="w-3 h-3" />
                    {PHASE_LABELS[phase]}
                  </div>
                  {index < PHASES.length - 1 && (
                    <div className={`w-4 h-0.5 ${isActive ? "bg-slate-300" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {!isComplete && editorStatus && (
          <div className={`px-4 py-2 rounded-md text-sm ${canEdit || isReflectingPhase ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
            {editorStatus.reason}
          </div>
        )}
      </div>

      {isComplete && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <PartyPopper className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-slate-800 mb-2">Exercise Complete!</h3>
          <p className="text-slate-600 mb-6">
            Great job completing this Socratic coding exercise.
          </p>
          {reflectionScore && (
            <div className="mb-4">
              <span className="text-4xl font-bold text-teal-600">{reflectionScore}/5</span>
              <p className="text-slate-600">{reflectionMessage}</p>
            </div>
          )}
          <button
            onClick={handleStartNew}
            className="bg-teal-600 text-white py-3 px-6 rounded-md hover:bg-teal-700 transition-colors"
          >
            Start Another Exercise
          </button>
        </div>
      )}

      {!isComplete && isSpecPhase && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="font-medium text-slate-800 mb-3">Write Your Spec</h3>
            <textarea
              value={specInput}
              onChange={(e) => setSpecInput(e.target.value)}
              placeholder="Describe what you want to build..."
              className="w-full h-40 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
            />
            <button
              onClick={handleSendSpec}
              disabled={sendingSpec || !specInput.trim()}
              className="mt-3 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {sendingSpec ? "Saving..." : "Save Spec"}
            </button>
            {session.specText && (
              <button
                onClick={handleApproveSpec}
                className="ml-3 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Approve Spec
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="font-medium text-slate-800 mb-3">Chat with AI Coach</h3>
            <div className="h-64 overflow-y-auto space-y-3 mb-3 p-2">
              {turns.length === 0 ? (
                <p className="text-slate-500 text-sm">Start a conversation about your spec...</p>
              ) : (
                turns.map((turn) => (
                  <div
                    key={turn.id}
                    className={`p-3 rounded-lg text-sm ${
                      turn.role === "student"
                        ? "bg-teal-100 ml-8"
                        : "bg-slate-100 mr-8"
                    }`}
                  >
                    <span className="font-medium text-slate-600 text-xs uppercase">
                      {turn.role}:{" "}
                    </span>
                    {turn.content}
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
              <button
                onClick={handleSendChat}
                disabled={sendingChat || !chatInput.trim()}
                className="bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {!isComplete && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-800">Code Editor</h3>
            {!canEdit && session.currentPhase !== "submitted" && session.currentPhase !== "reflecting" && (
              <span className="text-sm text-slate-500">
                Complete spec approval to unlock
              </span>
            )}
          </div>
          <CodeEditor
            value={codeInput}
            onChange={(value) => setCodeInput(value)}
            disabled={!canEdit && session.currentPhase !== "submitted" && session.currentPhase !== "reflecting"}
            language="python"
          />
          {(canEdit || session.currentPhase === "submitted" || session.currentPhase === "reflecting") && (
            <button
              onClick={handleSubmitCode}
              disabled={sendingCode}
              className="mt-3 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {sendingCode ? "Submitting..." : "Submit Code"}
            </button>
          )}
        </div>
      )}

      {(isReflectingPhase || gapAnalysis) && !isComplete && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mt-6">
          <h3 className="font-medium text-slate-800 mb-3">Reflection</h3>
          
          {gapAnalysis && Object.keys(gapAnalysis).length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Gap Analysis</h4>
              <ul className="space-y-2">
                {Object.entries(gapAnalysis).map(([key, value]) => (
                  <li key={key} className="text-sm text-yellow-700">
                    • {value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reflectionPrompts.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Reflection Questions</h4>
              <ul className="space-y-2">
                {reflectionPrompts.map((prompt, i) => (
                  <li key={i} className="text-sm text-blue-700">
                    {i + 1}. {prompt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <textarea
            value={reflectionInput}
            onChange={(e) => setReflectionInput(e.target.value)}
            placeholder="Write your reflection..."
            className="w-full h-32 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
          />
          
          {reflectionScore && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <span className="text-2xl font-bold text-green-600">{reflectionScore}/5</span>
              <p className="text-green-700">{reflectionMessage}</p>
            </div>
          )}

          {!reflectionScore && (
            <button
              onClick={handleSubmitReflection}
              disabled={submittingReflection || !reflectionInput.trim()}
              className="mt-3 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {submittingReflection ? "Submitting..." : "Submit Reflection"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}