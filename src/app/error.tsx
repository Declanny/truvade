"use client";

import { Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">Something went wrong</h1>
        <p className="text-gray-500 mt-2">
          An unexpected error occurred. Please try again or go back to the homepage.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button variant="primary" size="lg" onClick={reset}>
            Try again
          </Button>
          <a href="/">
            <Button variant="outline" size="lg">Go home</Button>
          </a>
        </div>
      </div>
    </main>
  );
}
