import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Lock,
  Shield,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getCurrentAdmin,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  resetAdminPassword,
  type AdminUserRecord,
} from "@/api/admin";
import AdminLayout from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/users")({
  loader: async () => {
    try {
      const admin = await getCurrentAdmin();
      const users = await listAdminUsers();
      return { admin, users };
    } catch {
      return { admin: null, users: [] as AdminUserRecord[] };
    }
  },
  component: AdminUsers,
});


const ALL_PERMISSIONS = [
  { key: "enquiries", label: "Enquiries" },
  { key: "courses", label: "Courses" },
  { key: "users", label: "Users" },
  { key: "notifications", label: "Notifications" },
  { key: "profile", label: "Profile" },
];

const ROLES = ["admin", "editor", "viewer"];

interface UserFormModalProps {
  title: string;
  isEdit: boolean;
  formName: string;
  setFormName: (v: string) => void;
  formEmail: string;
  setFormEmail: (v: string) => void;
  formPassword: string;
  setFormPassword: (v: string) => void;
  formRole: string;
  setFormRole: (v: string) => void;
  formPermissions: string[];
  togglePermission: (key: string) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

function UserFormModal({
  title,
  isEdit,
  formName,
  setFormName,
  formEmail,
  setFormEmail,
  formPassword,
  setFormPassword,
  formRole,
  setFormRole,
  formPermissions,
  togglePermission,
  saving,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-semibold">Full Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter full name"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="user@example.com"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
            />
          </div>
          {!isEdit && (
            <div>
              <label className="text-sm font-semibold">Password</label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold">Role</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">Permissions</label>
            <div className="mt-2 space-y-2">
              {ALL_PERMISSIONS.map((p) => (
                <label key={p.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPermissions.includes(p.key)}
                    onChange={() => togglePermission(p.key)}
                    className="h-4 w-4 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
                  />
                  <span className="text-sm text-foreground">{p.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {saving ? "Saving..." : isEdit ? "Update User" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminUsers() {
  const navigate = useNavigate();
  const createAdminUserFn = useServerFn(createAdminUser);
  const updateAdminUserFn = useServerFn(updateAdminUser);
  const deleteAdminUserFn = useServerFn(deleteAdminUser);
  const resetPasswordFn = useServerFn(resetAdminPassword);
  const listAdminUsersFn = useServerFn(listAdminUsers);
  const { admin, users: initialUsers } = Route.useLoaderData();
  const isAuthenticated = !!admin;

  const [users, setUsers] = useState<AdminUserRecord[]>(initialUsers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserRecord | null>(null);
  const [resetUser, setResetUser] = useState<AdminUserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserRecord | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("admin");
  const [formPermissions, setFormPermissions] = useState<string[]>(["enquiries", "courses"]);
  const [saving, setSaving] = useState(false);
  const [resetPassword, setResetPassword] = useState("");

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/admin-login" });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const openCreateModal = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("admin");
    setFormPermissions(["enquiries", "courses"]);
    setShowCreateModal(true);
  };

  const openEditModal = (user: AdminUserRecord) => {
    setEditUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPermissions([...user.permissions]);
  };

  const togglePermission = (key: string) => {
    setFormPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast.error("Name, email and password are required");
      return;
    }
    setSaving(true);
    try {
      const result = await createAdminUserFn({
        data: {
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          role: formRole,
          permissions: formPermissions,
        },
      });
      if (result.ok) {
        toast.success("User created!");
        setShowCreateModal(false);
        const updated = await listAdminUsersFn();
        setUsers(updated);
      } else {
        toast.error(result.message ?? "Create failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editUser || !formName.trim() || !formEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      const result = await updateAdminUserFn({
        data: {
          id: editUser.id,
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          permissions: formPermissions,
        },
      });
      if (result.ok) {
        toast.success("User updated!");
        setEditUser(null);
        const updated = await listAdminUsersFn();
        setUsers(updated);
      } else {
        toast.error(result.message ?? "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      const result = await deleteAdminUserFn({ data: { id: deleteUser.id } });
      if (result.ok) {
        toast.success("User deleted!");
        setDeleteUser(null);
        setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      } else {
        toast.error(result.message ?? "Delete failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser || !resetPassword.trim()) {
      toast.error("New password is required");
      return;
    }
    setSaving(true);
    try {
      const result = await resetPasswordFn({
        data: { id: resetUser.id, newPassword: resetPassword },
      });
      if (result.ok) {
        toast.success("Password reset!");
        setResetUser(null);
        setResetPassword("");
      } else {
        toast.error(result.message ?? "Reset failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/users"
      admin={admin}
      breadcrumb={[
        { label: "Dashboard", path: "/admin" },
        { label: "Users" },
      ]}
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Admin Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who can access the admin portal and their permissions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#1d4ed8]"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#2563eb]" />
          <h2 className="text-lg font-extrabold">All Admin Users ({users.length})</h2>
        </div>

        {users.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">No admin users found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Permissions</th>
                  <th className="pb-3 pr-4">Created</th>
                  <th className="pb-3 pr-2">Edit</th>
                  <th className="pb-3 pr-2">Reset</th>
                  <th className="pb-3">Delete</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {u.name}
                      {admin?.id === u.id && (
                        <span className="ml-1.5 text-[10px] font-semibold text-[#2563eb]">
                          (You)
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-full bg-[#2563eb]/10 px-2 py-0.5 text-xs font-semibold text-[#2563eb]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {u.permissions.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600"
                          >
                            <Check className="h-2.5 w-2.5" />
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    </td>
                    <td className="py-3 pr-2">
                      <button
                        onClick={() => {
                          setResetUser(u);
                          setResetPassword("");
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <Lock className="h-3 w-3" /> Reset
                      </button>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => setDeleteUser(u)}
                        disabled={admin?.id === u.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <UserFormModal
          title="Create New User"
          isEdit={false}
          formName={formName}
          setFormName={setFormName}
          formEmail={formEmail}
          setFormEmail={setFormEmail}
          formPassword={formPassword}
          setFormPassword={setFormPassword}
          formRole={formRole}
          setFormRole={setFormRole}
          formPermissions={formPermissions}
          togglePermission={togglePermission}
          saving={saving}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Edit Modal */}
      {editUser && (
        <UserFormModal
          title="Edit User"
          isEdit={true}
          formName={formName}
          setFormName={setFormName}
          formEmail={formEmail}
          setFormEmail={setFormEmail}
          formPassword={formPassword}
          setFormPassword={setFormPassword}
          formRole={formRole}
          setFormRole={setFormRole}
          formPermissions={formPermissions}
          togglePermission={togglePermission}
          saving={saving}
          onClose={() => setEditUser(null)}
          onSubmit={handleUpdate}
        />
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Reset Password</h3>
              <button onClick={() => setResetUser(null)}>
                <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Set a new password for <strong>{resetUser.name}</strong>.
            </p>
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="mt-4 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setResetUser(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={saving}
                className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Delete User</h3>
              <button onClick={() => setDeleteUser(null)}>
                <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{deleteUser.name}</strong>? This cannot be
              undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteUser(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
