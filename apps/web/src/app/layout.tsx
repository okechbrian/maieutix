import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maieutix | Learn through questioning",
  description: "A Socratic coding platform that teaches programming through dialogue.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-800">
              Maieutix
            </h1>
            <p className="text-sm text-slate-500">
              Learn through questioning
            </p>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
