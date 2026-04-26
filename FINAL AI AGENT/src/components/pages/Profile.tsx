import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";
import { Nav } from "@/components/Nav";

const ROLES = [
  "Frontend Developer",
  "Backend Engineer",
  "Full Stack Developer",
  "Mobile Developer",
  "ML Engineer",
  "Data Scientist",
  "Data Engineer",
  "AI/LLM Engineer",
  "DevOps Engineer",
  "Cloud Architect",
  "Security Engineer",
  "Product Designer",
];

// Crude PDF text extraction: read bytes and pull printable substrings between BT/ET markers.
// Good enough for plain-text PDFs; for scanned PDFs we just store the filename hint.
async function extractTextFromFile(file: File): Promise<string> {
  if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
    return await file.text();
  }
  // Try plain text decoding then strip non-printables; works for many simple PDFs/DOCX previews.
  const buf = await file.arrayBuffer();
  const td = new TextDecoder("utf-8", { fatal: false });
  const raw = td.decode(buf);
  // Pull readable ASCII runs of 4+ chars
  const matches = raw.match(/[\x20-\x7E]{4,}/g) ?? [];
  const text = matches.join(" ").replace(/\s+/g, " ").trim();
  return text.slice(0, 8000);
}

export default function Profile() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, setProfile, loading: profLoading } = useProfile(user?.id);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) nav("/auth", { replace: true });
  }, [authLoading, user, nav]);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setRole(profile.role ?? "");
      setResumeText(profile.resume_text ?? "");
    }
  }, [profile]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setResumeFile(file);
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);
    } catch {
      setResumeText("");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        name: name.trim(),
        role: role || null,
        resume_text: resumeText || null,
      });
      if (error) throw error;
      // Cache for fast access
      localStorage.setItem("agenthire_profile", JSON.stringify({ name, role, resume: resumeText }));
      setProfile({ id: user.id, name, role, resume_text: resumeText });
      nav("/home");
    } catch (err: any) {
      setError(err?.message ?? "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || profLoading) {
    return (
      <>
        <Nav />
        <div className="page" style={{ color: "var(--text-2)" }}>Loading…</div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="app">
        <div className="page">
          <div className="result-layout" style={{ gridTemplateColumns: "1fr", maxWidth: 560 }}>
            <form className="result-card" style={{ textAlign: "left" }} onSubmit={submit}>
              <div className="section-title">Personalize your AI interview</div>
              <div className="divider" />

              <div className="chat-input-row" style={{ background: "transparent", borderTop: 0, padding: "0 0 12px 0" }}>
                <input
                  className="chat-input"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="chat-input-row" style={{ background: "transparent", borderTop: 0, padding: "0 0 12px 0" }}>
                <select className="chat-input" value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="" disabled>
                    Target Role
                  </option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="divider" />

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx,.md"
                style={{ display: "none" }}
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <div
                className={`resume-dropzone ${resumeFile || resumeText ? "has-file" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFile(e.dataTransfer.files?.[0]);
                }}
              >
                <p>📄 {resumeFile ? "Resume loaded" : "Click or drop your resume (PDF / TXT)"}</p>
                {resumeFile && <div className="file-info">✓ {resumeFile.name} · {Math.round(resumeText.length / 100) / 10}k chars extracted</div>}
                {!resumeFile && resumeText && <div className="file-info">✓ Resume on file ({Math.round(resumeText.length / 100) / 10}k chars)</div>}
              </div>

              {error && (
                <div className="tip-box" style={{ borderColor: "rgba(248,113,113,.35)", background: "rgba(248,113,113,.08)", color: "var(--red)" }}>
                  {error}
                </div>
              )}

              <div className="divider" />
              <button className="mint-btn" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save & Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
