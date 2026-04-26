import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { supabase } from "@/integrations/supabase/client";
import { initials, useAuth } from "@/lib/auth";

interface LbRow {
  id: string;
  user_id: string;
  name: string;
  role: string;
  score: number;
  created_at: string;
}

const ROLE_FILTERS = ["All roles", "Frontend Developer", "Backend Engineer", "Product Designer", "ML Engineer"];

export default function Leaderboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<LbRow[]>([]);
  const [filter, setFilter] = useState("All roles");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("id, user_id, name, role, score, created_at")
        .order("score", { ascending: false })
        .limit(50);
      if (!error && data) setRows(data as LbRow[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => (filter === "All roles" ? rows : rows.filter((r) => r.role === filter)),
    [rows, filter],
  );

  const stats = useMemo(() => {
    if (rows.length === 0) return { total: 0, avg: 0, top: 0 };
    const total = rows.length;
    const avg = Math.round((rows.reduce((a, r) => a + r.score, 0) / total) * 10) / 10;
    const top = Math.max(...rows.map((r) => r.score));
    return { total, avg, top };
  }, [rows]);

  const myRow = user ? rows.findIndex((r) => r.user_id === user.id) : -1;

  return (
    <>
      <Nav />
      <div className="app">
        <div className="page">
          <div className="lb-layout">
            <div className="lb-main">
              <div className="lb-header">
                <div>
                  <div className="lb-title">Top Candidates</div>
                  <div className="lb-sub">Updated live · Scored by Aria</div>
                </div>
                <div className="filter-row">
                  {ROLE_FILTERS.map((f) => (
                    <div key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                      {f === "All roles" ? f : f.split(" ")[0]}
                    </div>
                  ))}
                </div>
              </div>

              <div className="lb-table">
                <div className="lb-row head">
                  <div></div>
                  <div>Candidate</div>
                  <div>Score</div>
                  <div>Role</div>
                  <div>Action</div>
                </div>
                {loading ? (
                  <div className="lb-row"><div /><div style={{ color: "var(--text-2)" }}>Loading…</div><div /><div /><div /></div>
                ) : filtered.length === 0 ? (
                  <div className="lb-row">
                    <div />
                    <div style={{ color: "var(--text-2)" }}>No interviews yet — be the first!</div>
                    <div /><div /><div />
                  </div>
                ) : (
                  filtered.map((r, i) => {
                    const isMe = user && r.user_id === user.id;
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                    return (
                      <div
                        key={r.id}
                        className="lb-row"
                        style={isMe ? { background: "rgba(79,142,247,.04)", borderLeft: "3px solid var(--accent)" } : undefined}
                      >
                        {medal ? <div className="medal">{medal}</div> : <div className="rank">{i + 1}</div>}
                        <div className="candidate-info">
                          <div className="avatar">{initials(r.name)}</div>
                          <div>
                            <div className="cand-name">
                              {r.name}
                              {isMe && (
                                <span style={{ fontSize: 10, color: "var(--accent)", background: "rgba(79,142,247,.12)", padding: "2px 8px", borderRadius: 20, marginLeft: 6 }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div className="cand-role">{r.role}</div>
                          </div>
                        </div>
                        <div><span className={`score-pill ${r.score >= 85 ? "high" : ""}`}>{r.score}</span></div>
                        <div style={{ fontSize: 12, color: "var(--text-2)" }}>{r.role.split(" ")[0]}</div>
                        <div><button className="action-btn" onClick={() => nav(`/result/${r.id}`)}>View</button></div>
                      </div>
                    );
                  })
                )}
                {user && myRow === -1 && (
                  <div className="lb-row">
                    <div className="rank">—</div>
                    <div className="candidate-info">
                      <div className="avatar">YN</div>
                      <div>
                        <div className="cand-name">You</div>
                        <div className="cand-role">Complete an interview to rank</div>
                      </div>
                    </div>
                    <div><span className="score-pill">Unranked</span></div>
                    <div />
                    <div><button className="action-btn" onClick={() => nav("/home")}>Start →</button></div>
                  </div>
                )}
              </div>
            </div>

            <div className="lb-side">
              <div className="stats-card">
                <div className="stats-card-title">Platform Stats</div>
                <div className="stat-item"><span className="stat-lbl">Total interviews</span><span className="stat-val accent">{stats.total}</span></div>
                <div className="stat-item"><span className="stat-lbl">Avg. score</span><span className="stat-val">{stats.avg || "—"}</span></div>
                <div className="stat-item"><span className="stat-lbl">Top score</span><span className="stat-val green">{stats.top || "—"}</span></div>
                <div className="stat-item"><span className="stat-lbl">Roles tracked</span><span className="stat-val">{new Set(rows.map((r) => r.role)).size}</span></div>
              </div>

              <div className="activity-card">
                <div className="activity-title">Live Activity</div>
                {rows.slice(0, 5).map((r) => (
                  <div className="activity-item" key={r.id}>
                    <div className="act-dot green" />
                    <div>
                      <div className="activity-text">
                        <strong>{r.name.split(" ")[0]}</strong> scored <strong>{r.score}</strong> on {r.role}
                      </div>
                      <div className="activity-time">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {rows.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-2)" }}>Waiting for the first candidate…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
