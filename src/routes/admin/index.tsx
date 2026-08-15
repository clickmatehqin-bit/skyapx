import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BarChart3, TrendingUp, TrendingDown, Calendar, MoreVertical } from "lucide-react";
import { useEffect } from "react";
import { getAdminStats, getCurrentAdmin } from "@/api/admin";
import AdminLayout from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return { admin: null, stats: null };
    try {
      const stats = await getAdminStats();
      return { admin, stats };
    } catch {
      return { admin, stats: null };
    }
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const { admin, stats } = Route.useLoaderData();
  const isAuthenticated = !!admin;

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/admin-login" });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const recentEnquiries = stats?.recentEnquiries ?? [];
  const totalEnquiries = stats?.totalEnquiries ?? 0;
  const newEnquiries = stats?.newEnquiries ?? 0;

  return (
    <AdminLayout currentPath="/admin/" admin={admin} unreadCount={newEnquiries}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, Admin. Here's what's happening today at Sky APX.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563eb]/10">
              <BarChart3 className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <TrendingUp className="h-3 w-3" />
              12%
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Enquiries
            </div>
            <div className="mt-1 text-3xl font-extrabold text-foreground">
              {totalEnquiries.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <span className="text-xs font-bold text-orange-600">NEW</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <TrendingUp className="h-3 w-3" />
              24%
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              New Enquiries
            </div>
            <div className="mt-1 text-3xl font-extrabold text-foreground">
              {newEnquiries.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#2563eb]">Monthly Enquiries</h2>
              <p className="text-xs text-muted-foreground">
                Student lead flow for the last 6 months
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted">
                <Calendar className="h-4 w-4" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 h-64">
            <svg viewBox="0 0 600 200" className="h-full w-full">
              <line x1="0" y1="50" x2="600" y2="50" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#e5e7eb" strokeWidth="1" />
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="50,140 150,120 250,100 350,40 450,80 550,60"
              />
              <polygon
                fill="url(#gradient)"
                points="50,140 150,120 250,100 350,40 450,80 550,60 550,180 50,180"
              />
              <circle cx="50" cy="140" r="4" fill="#2563eb" />
              <circle cx="150" cy="120" r="4" fill="#2563eb" />
              <circle cx="250" cy="100" r="4" fill="#2563eb" />
              <circle cx="350" cy="40" r="6" fill="#2563eb" stroke="white" strokeWidth="2" />
              <circle cx="450" cy="80" r="4" fill="#2563eb" />
              <circle cx="550" cy="60" r="4" fill="#2563eb" />
              <rect x="320" y="15" width="60" height="24" rx="4" fill="#1e293b" />
              <text x="350" y="32" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                {stats?.monthlyEnquiries?.[3]?.count ?? 0}
              </text>
              <text x="50" y="195" textAnchor="middle" fill="#94a3b8" fontSize="11">
                JAN
              </text>
              <text x="150" y="195" textAnchor="middle" fill="#94a3b8" fontSize="11">
                FEB
              </text>
              <text x="250" y="195" textAnchor="middle" fill="#94a3b8" fontSize="11">
                MAR
              </text>
              <text
                x="350"
                y="195"
                textAnchor="middle"
                fill="#2563eb"
                fontSize="11"
                fontWeight="bold"
              >
                APR
              </text>
              <text x="450" y="195" textAnchor="middle" fill="#94a3b8" fontSize="11">
                MAY
              </text>
              <text x="550" y="195" textAnchor="middle" fill="#94a3b8" fontSize="11">
                JUN
              </text>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#2563eb]">Course Distribution</h2>
          <p className="text-xs text-muted-foreground">Popularity by enquiries</p>

          <div className="relative mt-6 flex justify-center">
            <svg viewBox="0 0 200 200" className="h-48 w-48">
              <circle cx="100" cy="100" r="70" fill="none" stroke="#e5e7eb" strokeWidth="24" />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#2563eb"
                strokeWidth="24"
                strokeDasharray="255 440"
                strokeDashoffset="0"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="24"
                strokeDasharray="105 440"
                strokeDashoffset="-255"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#475569"
                strokeWidth="24"
                strokeDasharray="79 440"
                strokeDashoffset="-360"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-foreground">
                {stats?.courseCount ?? 0}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Courses
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {stats?.courseDistribution?.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#2563eb]" />
                  <span className="text-sm text-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-foreground">Recent Enquiries</h2>
        <p className="mt-1 text-xs text-muted-foreground">Contact form submissions from website</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone
                </th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subject
                </th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {recentEnquiries.map((e) => (
                <tr key={e.id} className="border-b border-border/50 last:border-0">
                  <td className="py-4 text-sm font-medium text-foreground">{e.name}</td>
                  <td className="py-4 text-sm text-muted-foreground">{e.email}</td>
                  <td className="py-4 text-sm text-muted-foreground">{e.phone}</td>
                  <td className="py-4 text-sm text-muted-foreground">{e.subject}</td>
                  <td className="py-4 text-sm text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
