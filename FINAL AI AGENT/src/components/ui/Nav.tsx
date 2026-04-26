import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { initials, useAuth, useProfile } from "@/lib/auth";

export function Nav() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  if (!user) return null;

  const tabs = [
    { path: "/home", label: "🏠 Home" },
    { path: "/mock", label: "🤖 Mock" },
    { path: "/leaderboard", label: "📊 Leaderboard" },
  ];

  const onLogout = async () => {
    await supabase.auth.signOut();
    nav("/auth", { replace: true });
  };

  return (
    <div className="nav">
      <div className="nav-left">
        <div className="logo" onClick={() => nav("/home")}>
          <div className="logo-icon">⚡</div>
          Agent<span>Hire</span>
        </div>
      </div>
      <div className="nav-tabs">
        {tabs.map((t) => (
          <button
            key={t.path}
            className={`nav-tab ${loc.pathname.startsWith(t.path) ? "active" : ""}`}
            onClick={() => nav(t.path)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <div className="nav-notif" title="Notifications">
          🔔<div className="notif-dot" />
        </div>
        <div className="nav-avatar" title={profile?.name ?? "Profile"} onClick={() => nav("/profile")}>
          {initials(profile?.name)}
        </div>
        <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 12 }} onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
