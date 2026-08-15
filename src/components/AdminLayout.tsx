import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Users,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { logoutAdmin } from "@/api/admin";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/" },
  { icon: MessageSquare, label: "Enquiries", path: "/admin/enquiries" },
  { icon: BookOpen, label: "Courses", path: "/admin/courses" },
  { icon: Users, label: "Users", path: "/admin/users" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  breadcrumb?: { label: string; path?: string }[];
  admin?: {
    name: string;
    email: string;
    role: string;
  } | null;
  unreadCount?: number;
}

export default function AdminLayout({
  children,
  currentPath,
  breadcrumb,
  admin,
  unreadCount = 0,
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const logoutAdminFn = useServerFn(logoutAdmin);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAdminFn();
    } finally {
      navigate({ to: "/admin-login" });
    }
  };

  const initials = admin?.name
    ? admin.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "SA";

  return (
    <div className="flex min-h-screen bg-[#f0f4f8] font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-64 flex-col bg-white shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb]">
            <span className="text-lg font-black text-white">SA</span>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">Sky APX</div>
            <div className="text-[10px] text-muted-foreground">Medical Coding Academy</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {sidebarItems.map(({ icon: Icon, label, path }) => (
            <Link
              key={label}
              to={path}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                path === currentPath
                  ? "bg-[#2563eb]/10 text-[#2563eb]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white px-8 py-4">
          {breadcrumb && breadcrumb.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {breadcrumb.map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="h-4 w-4" />}
                  {item.path ? (
                    <Link to={item.path} className="hover:text-foreground">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{item.label}</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search resources..."
                className="w-64 rounded-lg border border-border bg-[#f8fafc] py-2 pl-10 pr-4 text-sm outline-none focus:border-[#2563eb]"
              />
            </div>

            {/* Notification Bell */}
            <Link
              to="/admin/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-muted"
              >
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {admin?.name ?? "Admin"}
                  </div>
                  <div className="text-[10px] capitalize text-muted-foreground">
                    {admin?.role ?? "admin"}
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb]/10 text-xs font-bold text-[#2563eb]">
                  {initials}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-white py-2 shadow-lg">
                  <div className="border-b border-border px-4 py-3">
                    <div className="text-sm font-bold text-foreground">{admin?.name ?? "Admin"}</div>
                    <div className="text-xs text-muted-foreground">{admin?.email ?? ""}</div>
                  </div>
                  <Link
                    to="/admin/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/admin/notifications"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                  >
                    Notifications
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="overflow-y-auto" style={{ height: "calc(100vh - 65px)" }}>
          <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
