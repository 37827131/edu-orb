import { Suspense } from "react";
import SessionSetup from "./SessionSetup";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#060a14] text-white font-sans">
      <Suspense fallback={<div className="min-h-screen bg-[#060a14]" />}>
        <SessionSetup />
      </Suspense>
    </div>
  );
}
