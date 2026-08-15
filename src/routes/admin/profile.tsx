import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { User, Lock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getCurrentAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  type AdminProfile,
} from "@/api/admin";
import AdminLayout from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/profile")({
  loader: async () => {
    try {
      const admin = await getCurrentAdmin();
      if (!admin) return { admin: null, profile: null };
      const profile = await getAdminProfile();
      return { admin, profile };
    } catch {
      return { admin: null, profile: null };
    }
  },
  component: AdminProfilePage,
});

function AdminProfilePage() {
  const navigate = useNavigate();
  const updateProfileFn = useServerFn(updateAdminProfile);
  const changePasswordFn = useServerFn(changeAdminPassword);
  const { admin, profile } = Route.useLoaderData();
  const isAuthenticated = !!admin;

  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/admin-login" });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSavingProfile(true);
    try {
      const result = await updateProfileFn({ data: { name: name.trim(), email: email.trim() } });
      if (result.ok) toast.success("Profile updated!");
      else toast.error(result.message ?? "Update failed");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    try {
      const result = await changePasswordFn({
        data: { currentPassword, newPassword },
      });
      if (result.ok) {
        toast.success("Password changed!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.message ?? "Failed to change password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/profile"
      admin={admin}
      breadcrumb={[
        { label: "Dashboard", path: "/admin" },
        { label: "Profile" },
      ]}
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account settings and password.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Info */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#2563eb]" />
            <h2 className="text-lg font-extrabold">Profile Information</h2>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Role</label>
              <input
                type="text"
                value={profile?.role ?? "admin"}
                disabled
                className="mt-2 w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#2563eb]" />
            <h2 className="text-lg font-extrabold">Change Password</h2>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb]"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock className="h-4 w-4" />
              {savingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
