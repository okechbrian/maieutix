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
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: "off",
          tabCompletion: "off",
          wordBasedSuggestions: "off",
          parameterHints: { enabled: false },
          inlineSuggest: { enabled: false },
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
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="flex max-w-sm items-center gap-3 rounded-md border border-slate-700 bg-slate-900 px-4 py-3 shadow-xl">
            <Lock className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-100">Editor locked</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Save a clear spec and ask the coach to review it before coding.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
