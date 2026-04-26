import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { useAuth, useProfile } from "@/lib/auth";

const JOBS = [
  { icon: "🏢", title: "Frontend Developer", co: "TechCorp Inc. · Remote", badge: "Top 12%" },
  { icon: "🏦", title: "Backend Engineer", co: "Finova · Hybrid", badge: "Top 8%" },
  { icon: "🎨", title: "Product Designer", co: "CreativeX · On-site", badge: "Top 20%" },
  { icon: "🤖", title: "ML Engineer", co: "NeuralWave · Remote", badge: "Top 5%" },
];

export default function Home() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const { profile, loading: pl } = useProfile(user?.id);

  useEffect(() => {
    if (!loading && !user) nav("/auth", { replace: true });
  }, [user, loading, nav]);

  useEffect(() => {
    if (!pl && profile && !profile.role) nav("/profile", { replace: true });
  }, [pl, profile, nav]);

  const startReal = () => {
    if (!profile?.role) {
      nav("/profile");
      return;
    }
    nav(`/interview?role=${encodeURIComponent(profile.role)}&mode=real`);
  };

  const greeting = profile?.name ? `, ${profile.name.split(" ")[0]}` : "";

  return (
    <>
      <Nav />
      <div className="app">
        <div className="page">
          <div className="home-hero">
            <div className="hero-left">
              <div className="hero-pill">
                <div className="hero-pill-dot">✦</div>
                AI-Powered Hiring · Adaptive Scoring
              </div>
              <h1 className="hero-h1">
                Welcome{greeting}.<br />
                <span className="hl">Get hired</span>
                <br />
                on merit.
              </h1>
              <p className="hero-sub">
                {profile?.role
                  ? `Aria has prepared a ${profile.role} interview tailored to your profile${profile.resume_text ? " and resume" : ""}.`
                  : "Aria, your AI interviewer, will adaptively challenge you and score you in real time."}
              </p>
              <div className="hero-ctas">
                <button className="btn-primary" onClick={startReal}>
                  Start Interview ↗
                </button>
                <button className="btn-ghost" onClick={() => nav("/mock")}>
                  Mock Interview ▶
                </button>
              </div>
              <div className="hero-stats">
                <div>
                  <div className="hero-stat-num">
                    <span>3</span>-criteria
                  </div>
                  <div className="hero-stat-lbl">Live Scoring</div>
                </div>
                <div>
                  <div className="hero-stat-num">
                    <span>8</span> Qs
                  </div>
                  <div className="hero-stat-lbl">Adaptive Loop</div>
                </div>
                <div>
                  <div className="hero-stat-num">
                    <span>0</span>s
                  </div>
                  <div className="hero-stat-lbl">Setup Time</div>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="live-label">
                <div className="live-dot" />
                Live open roles
              </div>
              <div className="job-cards-list">
                {JOBS.map((j) => (
                  <div key={j.title} className="job-card-mini" onClick={() => nav(`/interview?role=${encodeURIComponent(j.title)}&mode=real`)}>
                    <div className="job-card-mini-left">
                      <div className="job-co-icon">{j.icon}</div>
                      <div>
                        <div className="job-mini-title">{j.title}</div>
                        <div className="job-mini-co">{j.co}</div>
                      </div>
                    </div>
                    <div className="job-mini-badge">{j.badge}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section-head">
            <div className="section-title">How it works</div>
          </div>
          <div className="steps-row">
            {[
              { num: "Step · 01", icon: "🎯", title: "Pick a role", desc: "Choose your target role or domain. Aria adapts to it." },
              { num: "Step · 02", icon: "⚡", title: "Get challenged", desc: "Adaptive Q&A — every follow-up depends on your last answer." },
              { num: "Step · 03", icon: "📊", title: "AI scores you", desc: "Relevance, Creativity and Depth — each scored with reasoning." },
              { num: "Step · 04", icon: "🏆", title: "Get ranked", desc: "Your final score lands on the live leaderboard." },
            ].map((s) => (
              <div key={s.num} className="step-card">
                <div className="step-num">{s.num}</div>
                <div className="step-icon-wrap">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
