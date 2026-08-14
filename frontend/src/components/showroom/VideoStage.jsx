import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, VideoOff, Radio, Mic, Users, AlertCircle } from "lucide-react";

export default function VideoStage({
  canUseCamera,
  cameraOn,
  onToggleCamera,
  isHost,
  isActiveSpeaker,
  hostName,
  productTitle,
  description,
  viewerCount,
  isLive
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (cameraOn && canUseCamera) {
      if (!navigator.mediaDevices?.getUserMedia) {
        onToggleCamera();
        return;
      }
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(s => {
          streamRef.current = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => onToggleCamera());
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOn, canUseCamera]);

  const showCamera = cameraOn && canUseCamera;

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden border border-zinc-300 aspect-video">
      {/* Video or placeholder */}
      {showCamera ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isHost || isActiveSpeaker}
          className="w-full h-full object-cover mirror"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#F7F8FA] to-white">
          {isHost ? (
            <>
              <div className="w-20 h-20 rounded-full bg-[#2E5BFF]/10 flex items-center justify-center mb-4">
                <VideoOff size={32} className="text-zinc-400" />
              </div>
              <p className="text-zinc-500 text-sm mb-1">{hostName || "Host"}</p>
              <p className="text-zinc-300 text-xs">Camera is off</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-[#2E5BFF]/10 flex items-center justify-center mb-4 relative">
                <Radio size={32} className="text-[#2E5BFF]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              </div>
              <p className="text-zinc-900 font-bold text-lg">{hostName || "Host"}</p>
              {productTitle && <p className="text-[#2E5BFF] text-sm mt-1">{productTitle}</p>}
              {description && <p className="text-zinc-400 text-xs mt-2 max-w-xs text-center px-4">{description}</p>}
            </>
          )}
        </div>
      )}

      {/* Live badge */}
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500/90 px-2.5 py-1 rounded-md">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-bold uppercase tracking-wider">Live</span>
        </div>
      )}

      {/* Viewer count */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md">
        <Users size={12} className="text-zinc-300" />
        <span className="text-white text-xs font-medium">{viewerCount}</span>
      </div>

      {/* Camera toggle */}
      {canUseCamera && (
        <button
          onClick={onToggleCamera}
          className={`absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            cameraOn
              ? "bg-red-500/90 text-white hover:bg-red-500"
              : "bg-[#2E5BFF] text-white hover:bg-[#2E5BFF]/80"
          }`}
        >
          {cameraOn ? <VideoOff size={16} /> : <Video size={16} />}
          {cameraOn ? "Stop Camera" : "Start Camera"}
        </button>
      )}

      {/* Active speaker indicator */}
      {isActiveSpeaker && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-[#00E676]/20 border border-[#00E676]/30 px-2.5 py-1 rounded-md">
          <Mic size={12} className="text-[#00E676]" />
          <span className="text-[#00E676] text-xs font-medium">Speaking</span>
        </div>
      )}
    </div>
  );
}
