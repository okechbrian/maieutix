"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    fetch("/api/ai-events")
      .then((response) => response.json())
      .then((data) => setEvents(data.events ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
      <p className="mt-1 text-sm text-slate-600">AI audit events and launch controls.</p>
      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Prompt Tokens</th>
              <th className="px-4 py-3 font-medium">Completion Tokens</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {events.map((event, index) => (
              <tr key={index}>
                <td className="px-4 py-3">{String(event.createdAt ?? event.created_at ?? "-")}</td>
                <td className="px-4 py-3">{String(event.model ?? "-")}</td>
                <td className="px-4 py-3">{String(event.status ?? "-")}</td>
                <td className="px-4 py-3">{String(event.sessionId ?? event.session_id ?? "-")}</td>
                <td className="px-4 py-3">{String(event.promptTokens ?? event.prompt_tokens ?? "-")}</td>
                <td className="px-4 py-3">{String(event.completionTokens ?? event.completion_tokens ?? "-")}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No AI events yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
