import { Suspense } from "react";
import SessionSetup from "./SessionSetup";

export const metadata = {
  title: "EDU-ORB — AI Tutor",
  description: "A fully automated AI tutor with an animated orb avatar, streaming cloud AI, and natural voice selection.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#060a14] text-white font-sans">
      <Suspense fallback={<div className="min-h-screen bg-[#060a14]" />}>
        <SessionSetup />
      </Suspense>
    </div>
  );
}
