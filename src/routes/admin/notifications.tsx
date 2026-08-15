import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Mail,
  CheckCircle,
} from "lucide-react";
import { useEffect } from "react";
import { getCurrentAdmin } from "@/api/admin";
import { listEnquiries, type EnquiryRecord } from "@/api/enquiries";
import AdminLayout from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/notifications")({
  loader: async () => {
    try {
      const admin = await getCurrentAdmin();
      if (!admin) return { admin: null, enquiries: [] as EnquiryRecord[] };
      const enquiries = await listEnquiries();
      return { admin, enquiries };
    } catch {
      return { admin: null, enquiries: [] as EnquiryRecord[] };
    }
  },
  component: AdminNotifications,
});

function AdminNotifications() {
  const navigate = useNavigate();
  const { admin, enquiries } = Route.useLoaderData();
  const isAuthenticated = !!admin;

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/admin-login" });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const recentEnquiries = enquiries.slice(0, 20);

  return (
    <AdminLayout
      currentPath="/admin/notifications"
      admin={admin}
      breadcrumb={[
        { label: "Dashboard", path: "/admin" },
        { label: "Notifications" },
      ]}
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Email notification history — every enquiry triggers a notification to kamaleshk085@gmail.com.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#2563eb]" />
          <h2 className="text-lg font-extrabold">Recent Notifications ({recentEnquiries.length})</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Each row represents an enquiry that triggered an email notification.
        </p>

        {recentEnquiries.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                  <th className="pb-3 pr-4">Ref</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Subject</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEnquiries.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{e.ref}</td>
                    <td className="py-3 pr-4 font-medium text-foreground">{e.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{e.email}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{e.subject}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(e.date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">
                        <CheckCircle className="h-3 w-3" /> Sent
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
