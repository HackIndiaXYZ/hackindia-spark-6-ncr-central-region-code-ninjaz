import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { name },
          },
        });
        if (error) throw error;
        nav("/profile", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/home", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="result-layout" style={{ gridTemplateColumns: "1fr", maxWidth: 460 }}>
        <form className="result-card" onSubmit={submit}>
          <h1 className="hero-h1" style={{ fontSize: 36, marginBottom: 8 }}>
            Welcome to <span className="hl">AgentHire</span>
          </h1>
          <p className="hero-sub" style={{ marginBottom: 20 }}>
            {mode === "signin" ? "Sign in to take your AI interview." : "Create your account to begin."}
          </p>

          {mode === "signup" && (
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
          )}
          <div className="chat-input-row" style={{ background: "transparent", borderTop: 0, padding: "0 0 12px 0" }}>
            <input
              className="chat-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="chat-input-row" style={{ background: "transparent", borderTop: 0, padding: "0 0 12px 0" }}>
            <input
              className="chat-input"
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="tip-box" style={{ borderColor: "rgba(248,113,113,.35)", background: "rgba(248,113,113,.08)", color: "var(--red)" }}>
              {error}
            </div>
          )}

          <div className="divider" />
          <button className="mint-btn" disabled={loading} type="submit">
            {loading ? "Working…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
          <div className="divider" />
          <button
            type="button"
            className="btn-ghost"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => {
              setError(null);
              setMode((m) => (m === "signin" ? "signup" : "signin"));
            }}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
