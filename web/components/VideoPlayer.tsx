"use client";

import { useState } from "react";

type VideoStatus = "processing" | "ready" | "failed" | null | undefined;

interface VideoPlayerProps {
  src?: string | null;
  status?: VideoStatus;
  variant: number;
  label: string;
}

export function VideoPlayer({ src, status, variant, label }: VideoPlayerProps) {
  const [playbackErrored, setPlaybackErrored] = useState(false);

  const state: "processing" | "failed" | "missing" | "error" | "playable" =
    !src || !status
      ? "missing"
      : status === "processing"
        ? "processing"
        : status === "failed"
          ? "failed"
          : playbackErrored
            ? "error"
            : "playable";

  const playableSrc =
    typeof src === "string" && src.length > 0 ? src : undefined;

  return (
    <div className={`vp-player vp-variant-${variant % 6}`}>
      {state === "playable" && playableSrc ? (
        <video
          className="vp-player-video"
          src={playableSrc}
          controls
          playsInline
          autoPlay
          onError={() => setPlaybackErrored(true)}
        />
      ) : (
        <div className={`vp-player-fallback vp-player-fallback-${state}`}>
          <div className="vp-player-fallback-icon" aria-hidden="true">
            {state === "processing" ? "◐" : state === "failed" ? "!" : "▶"}
          </div>
          <p className="vp-player-fallback-title">{label}</p>
          <p className="vp-player-fallback-text">
            {state === "processing" &&
              "This title is still processing. Check back shortly."}
            {state === "failed" &&
              "Playback isn't available for this title right now."}
            {(state === "missing" || state === "error") &&
              "Playback preview isn't available in this build."}
          </p>
        </div>
      )}
    </div>
  );
}
