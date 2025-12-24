"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { ChainReactionGame } from "@/components/game/ChainReactionGame";

export default function Home() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        await sdk.actions.ready();
      } catch (e) {
        console.error("SDK load failed", e);
      } finally {
        setIsSDKLoaded(true);
      }
    };

    if (sdk) {
      load();
    }
  }, []);

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-bounce font-bold text-slate-800" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
          Initializing Game...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <ChainReactionGame />
    </main>
  );
}
