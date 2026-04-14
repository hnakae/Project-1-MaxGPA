import { Outlet, Link, useLocation } from "react-router";
import { GraduationCap } from "lucide-react";

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-forest-900 text-white shadow-lg">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">MaxGPA</h1>
              <p className="text-sm text-emerald-300">University of Oregon Grade Analytics</p>
            </div>
          </Link>

          <nav className="flex gap-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === "/"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-100 hover:bg-forest-800"
              }`}
            >
              Student Dashboard
            </Link>
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === "/admin"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-100 hover:bg-forest-800"
              }`}
            >
              Admin Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <Outlet />
    </div>
  );
}
