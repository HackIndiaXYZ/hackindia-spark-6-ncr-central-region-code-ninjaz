import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";

interface Skill { name: string; score: number; }
interface ResultData {
  role: string;
  mode: string;
  total_score: number;
  relevance: number;
  creativity: number;
  depth: number;
  strengths: string;
  weaknesses: string;
  feedback: string;
  skills?: Skill[];
}

const SKILL_GRADIENTS = [
  "linear-gradient(90deg,#4F8EF7,#7DB0FF)",
  "linear-gradient(90deg,#34D399,#6EE7B7)",
  "linear-gradient(90deg,#A78BFA,#C4B5FD)",
  "linear-gradient(90deg,#FBBF24,#FCD34D)",
  "linear-gradient(90deg,#F472B6,#FBA5C9)",
];

export default function Result() {
  const nav = useNavigate();
  const { id } = useParams();
  const { user, loading: al } = useAuth();
  const { profile } = useProfile(user?.id);
  const [data, setData] = useState<ResultData | null>(null);
  const [rank, setRank] = useState<{ position: number; total: number } | null>(null);
  const [minted, setMinted] = useState(false);

  useEffect(() => { if (!al && !user) nav("/auth", { replace: true }); }, [al, user, nav]);

  useEffect(() => {
    // Try cached first
    const cached = sessionStorage.getItem("agenthire_last_result");
    if (cached) {
      try { setData(JSON.parse(cached)); } catch { /* ignore */ }
    }
    if (!id) return;
    (async () => {
      const { data: row } = await supabase
        .from("interviews")
        .select("role, mode, total_score, relevance_score, creativity_score, depth_score, strengths, weaknesses, feedback")
        .eq("id", id)
        .maybeSingle();
      if (row) {
        setData((prev) => prev ?? {
          role: row.role,
          mode: row.mode,
          total_score: row.total_score ?? 0,
          relevance: row.relevance_score ?? 0,
          creativity: row.creativity_score ?? 0,
          depth: row.depth_score ?? 0,
          strengths: row.strengths ?? "",
          weaknesses: row.weaknesses ?? "",
          feedback: row.feedback ?? "",
        });
      }
    })();
  }, [id]);

  // Compute leaderboard rank for this role
  useEffect(() => {
    if (!data?.role || data.total_score == null) return;
    (async () => {
      const { data: lb } = await supabase
        .from("leaderboard")
        .select("score, role")
        .eq("role", data.role)
        .order("score", { ascending: false });
      if (!lb) return;
      const mineIdx = lb.findIndex((r: any) => r.score <= data.total_score);
      const position = mineIdx === -1 ? lb.length + 1 : mineIdx + 1;
      setRank({ position, total: lb.length });
    })();
  }, [data]);

  if (!data) {
    return (
      <>
        <Nav />
        <div className="page" style={{ color: "var(--text-2)" }}>Loading result…</div>
      </>
    );
  }

  const skills = data.skills && data.skills.length > 0
    ? data.skills
    : [
        { name: "Relevance", score: data.relevance },
        { name: "Creativity", score: data.creativity },
        { name: "Depth", score: data.depth },
      ];

  return (
    <>
      <Nav />
      <div className="app">
        <div className="page">
          <div className="result-layout">
            <div className="result-card">
              <div className="score-circle">
                <div className="score-big">{data.total_score}</div>
                <div className="score-sub">/ 100</div>
              </div>
              <div className="result-name">{profile?.name ?? "Candidate"}</div>
              <div className="result-role">{data.role} · {data.mode === "mock" ? "Mock Interview" : "Live Interview"}</div>

              <div className="metrics-grid">
                <div className="metric-box">
                  <div className="metric-val">{data.relevance}</div>
                  <div className="metric-lbl">Relevance</div>
                </div>
                <div className="metric-box">
                  <div className="metric-val">{data.creativity}</div>
                  <div className="metric-lbl">Creativity</div>
                </div>
                <div className="metric-box">
                  <div className="metric-val">{data.depth}</div>
                  <div className="metric-lbl">Depth</div>
                </div>
              </div>

              <div className="nft-badge">
                <div className="nft-icon">🏆</div>
                <div>
                  <div className="nft-title">{minted ? "Certificate issued" : "Issue your certificate"}</div>
                  <div className="nft-chain">Verified by Aria · stored in your account</div>
                </div>
              </div>
              <button className="mint-btn" disabled={minted} onClick={() => setMinted(true)}>
                {minted ? "✓ Certificate Issued" : "Issue Performance Certificate"}
              </button>
              {minted && (
                <div className="score-row" style={{ justifyContent: "center", borderBottom: "none" }}>
                  <div className="minted-badge">✓ Saved to your profile</div>
                </div>
              )}
            </div>

            <div className="result-side">
              <div className="skill-card">
                <div className="skill-title">Skill Breakdown</div>
                {skills.map((s, i) => (
                  <div className="skill-item" key={s.name}>
                    <div className="skill-head">
                      <span className="skill-name">{s.name}</span>
                      <span className="skill-score">{s.score}/100</span>
                    </div>
                    <div className="skill-bar">
                      <div className="skill-fill" style={{ width: `${s.score}%`, background: SKILL_GRADIENTS[i % SKILL_GRADIENTS.length] }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="skill-card">
                <div className="skill-title">Aria's Reasoning</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 14 }}>
                  {data.feedback}
                </div>
                {data.strengths && (
                  <>
                    <div className="section-label" style={{ marginTop: 8 }}>Strengths</div>
                    <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.6, marginBottom: 12 }}>{data.strengths}</div>
                  </>
                )}
                {data.weaknesses && (
                  <>
                    <div className="section-label">Improve next time</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>{data.weaknesses}</div>
                  </>
                )}
              </div>

              <div className="skill-card">
                <div className="skill-title">Leaderboard Position</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 44, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
                    {rank ? `#${rank.position}` : "—"}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                      {rank ? `of ${rank.total} ${data.role} candidates` : "Calculating…"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>{data.role}</div>
                  </div>
                </div>
                <button className="btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => nav("/leaderboard")}>
                  View Leaderboard →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
