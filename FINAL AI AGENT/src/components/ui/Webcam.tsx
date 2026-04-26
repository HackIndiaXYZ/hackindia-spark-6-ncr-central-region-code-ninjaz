import { useEffect, useRef, useState } from "react";

export function Webcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (e: any) {
        setError(e?.message ?? "Camera unavailable");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleVideo = () => {
    const tracks = streamRef.current?.getVideoTracks() ?? [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setVideoOn((v) => !v);
  };
  const toggleAudio = () => {
    const tracks = streamRef.current?.getAudioTracks() ?? [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setAudioOn((v) => !v);
  };

  return (
    <div>
      <div className="webcam-card">
        {error ? (
          <div style={{ padding: 16, fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>
            Camera off — {error}
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="webcam-video" />
            <div className="webcam-overlay">
              <span className="live-dot" />
              REC
            </div>
          </>
        )}
      </div>
      {!error && (
        <div className="webcam-toggle">
          <button onClick={toggleVideo} className={videoOn ? "" : "off"}>
            {videoOn ? "📹 On" : "📹 Off"}
          </button>
          <button onClick={toggleAudio} className={audioOn ? "" : "off"}>
            {audioOn ? "🎙 On" : "🎙 Off"}
          </button>
        </div>
      )}
    </div>
  );
}
