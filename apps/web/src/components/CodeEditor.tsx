"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { Lock } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-900 animate-pulse rounded-lg" />
  ),
});

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  language?: string;
}

export default function CodeEditor({
  value,
  onChange,
  disabled = false,
  language = "python",
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined && onChange) {
        setLocalValue(newValue);
        onChange(newValue);
      }
    },
    [onChange]
  );

  if (!mounted) {
    return (
      <div className="h-[400px] bg-slate-900 animate-pulse rounded-lg" />
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-700">
      <MonacoEditor
        height="400px"
        language={language}
        value={localValue}
        onChange={handleChange}
        theme="vs-dark"
        options={{
          readOnly: disabled,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          tabSize: 4,
          wordWrap: "on",
        }}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("maieutics-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
              { token: "comment", foreground: "6b7280", fontStyle: "italic" },
              { token: "keyword", foreground: "2dd4bf" },
              { token: "string", foreground: "fbbf24" },
              { token: "number", foreground: "f472b6" },
              { token: "function", foreground: "60a5fa" },
            ],
            colors: {
              "editor.background": "#0f172a",
              "editor.foreground": "#e2e8f0",
              "editor.lineHighlightBackground": "#1e293b",
              "editor.selectionBackground": "#334155",
              "editorCursor.foreground": "#2dd4bf",
              "editorLineNumber.foreground": "#475569",
              "editorLineNumber.activeForeground": "#94a3b8",
            },
          });
          monaco.editor.setTheme("maieutics-dark");
        }}
      />
      {disabled && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-slate-800 px-6 py-4 rounded-lg border border-slate-700 flex items-center gap-3 shadow-xl">
            <Lock className="w-5 h-5 text-slate-400" />
            <span className="text-slate-300 font-medium">
              Editor locked until spec is approved
            </span>
          </div>
        </div>
      )}
    </div>
  );
}