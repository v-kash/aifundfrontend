// app/embed/page.tsx
import { Suspense } from "react";
import EmbedChat from "./EmbedChat"; // Adjust path if you placed it in a different folder

export default function EmbedPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex h-[100dvh] items-center justify-center bg-slate-100 text-slate-500">
          Loading chat...
        </div>
      }
    >
      <EmbedChat />
    </Suspense>
  );
}