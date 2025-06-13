"use client";

import React, { useState } from "react";

export default function YoutubeLite({ videoId }: { videoId: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <div
        className="youtube-lite mb-6"
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          overflow: "hidden",
          margin: "1em 0",
          borderRadius: "8px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          frameBorder="0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        ></iframe>
      </div>
    );
  }

  return (
    <div
      className="youtube-lite mb-6 group"
      style={{
        position: "relative",
        paddingBottom: "56.25%",
        height: 0,
        overflow: "hidden",
        margin: "1em 0",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        cursor: "pointer",
        backgroundColor: "#000",
      }}
      onClick={() => setIsPlaying(true)}
      role="button"
      aria-label="Reproduzir vídeo do YouTube"
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt="Miniatura do vídeo do YouTube"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/images/video-placeholder.jpg";
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 rounded-full p-4 transition-transform duration-200 group-hover:scale-110"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "80px",
          height: "80px",
        }}
      >
        <img
          src="/images/play.svg"
          alt="Play"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}
