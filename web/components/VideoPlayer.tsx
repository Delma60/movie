"use client";

import { useState } from "react";

interface VideoPlayerProps {
  src?: string | null;
  variant: number;
  label: string;
}

export function VideoPlayer({ src, variant, label }: VideoPlayerProps) {
  const [errored, setErrored] = useState(!src);

  return (
    <div className={`vp-player vp-variant-${variant % 6}`}>
      {!errored && src ? (
        <video
          className="vp-player-video"
          src={src}
          controls
          playsInline
          autoPlay
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="vp-player-fallback">
          <div className="vp-player-fallback-icon" aria-hidden="true">
            ▶
          </div>
          <p className="vp-player-fallback-title">{label}</p>
          <p className="vp-player-fallback-text">
            Playback preview isn&apos;t available in this build.
          </p>
        </div>
      )}
    </div>
  );
}
