import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import { deleteEnquiryFn, listEnquiries, updateEnquiry } from "@/api/enquiries";
import { getCurrentAdmin } from "@/api/admin";
import AdminLayout from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/enquiries")({
  loader: async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return { admin: null, initialEnquiries: [] };
    try {
      return { admin, initialEnquiries: await listEnquiries() };
    } catch {
      return { admin, initialEnquiries: [] };
    }
  },
  component: EnquiriesListing,
});

interface Enquiry {
  id: string;
  ref: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  status: "New" | "Contacted" | "Interested" | "Joined" | "Closed";
  notes: string;
}

const statusColors: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-gray-100 text-gray-700",
  Interested: "bg-blue-100 text-blue-600",
  Joined: "bg-green-100 text-green-700",
  Closed: "bg-red-100 text-red-600",
};

function EnquiriesListing() {
  const navigate = useNavigate();
  const updateEnquiryFn = useServerFn(updateEnquiry);
  const deleteEnquiryFnApi = useServerFn(deleteEnquiryFn);
  const { admin, initialEnquiries } = Route.useLoaderData();
  const isAuthenticated = !!admin;
  const [enquiries, setEnquiries] = useState<Enquiry[]>(initialEnquiries);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("Last 30 Days");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModal, setViewModal] = useState<Enquiry | null>(null);
  const [editModal, setEditModal] = useState<Enquiry | null>(null);
  const [deleteModal, setDeleteModal] = useState<Enquiry | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    status: "" as Enquiry["status"],
  });
  const itemsPerPage = 5;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin-login" });
    }
  }, [isAuthenticated, navigate]);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.phone.includes(searchTerm);
      const matchesStatus = statusFilter === "All Statuses" || e.status === statusFilter;

      let matchesDate = true;
      if (isCustomDate && customDateRange.from && customDateRange.to) {
        const enquiryDate = new Date(e.date);
        matchesDate = enquiryDate >= customDateRange.from && enquiryDate <= customDateRange.to;
      } else if (dateFilter === "Last 7 Days") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        matchesDate = new Date(e.date) >= d;
      } else if (dateFilter === "Last 30 Days") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        matchesDate = new Date(e.date) >= d;
      } else if (dateFilter === "Last 90 Days") {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        matchesDate = new Date(e.date) >= d;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [enquiries, searchTerm, statusFilter, dateFilter, customDateRange, isCustomDate]);

  if (!isAuthenticated) {
    return null;
  }

  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);
  const paginatedEnquiries = filteredEnquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Subject", "Date", "Status"];
    const rows = filteredEnquiries.map((e) =>
      [e.id, e.name, e.email, e.phone, e.subject, e.date, e.status].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "enquiries.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    await deleteEnquiryFnApi({ data: { id } });
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    setDeleteModal(null);
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    setEditModal(null);
    const result = await updateEnquiryFn({
      data: {
        id: editModal.id,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        subject: editForm.subject,
        status: editForm.status,
        notes: editModal.notes ?? "",
      },
    });
    if (result.ok) {
      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === editModal.id
            ? {
                ...e,
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
                subject: editForm.subject,
                status: editForm.status,
              }
            : e,
        ),
      );
    } else {
      alert(result.message || "Update failed");
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/enquiries"
      admin={admin}
      breadcrumb={[{ label: "Dashboard", path: "/admin/" }, { label: "Enquiries" }]}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Enquiries Listing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and track your medical coding academy prospective student leads.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1d4ed8] hover:shadow-lg">
            <Plus className="h-4 w-4" />
            New Enquiry
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground">Date Range</label>
          <div className="mt-1">
            {isCustomDate ? (
              <div className="relative">
                <div
                  onClick={() => setIsDatePickerOpen(true)}
                  className="flex w-full cursor-pointer items-center rounded-lg border border-[#2563eb]/50 bg-white py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors hover:border-[#2563eb]/70"
                >
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563eb]" />
                  <span className="text-foreground font-medium">
                    {customDateRange.from && customDateRange.to
                      ? `${customDateRange.from.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })} → ${customDateRange.to.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}`
                      : "Select date range"}
                  </span>
                  <svg
                    className="ml-auto h-4 w-4 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <DateRangePicker
                  value={customDateRange}
                  onChange={(range) => {
                    setCustomDateRange(range);
                  }}
                  displayValue={
                    customDateRange.from && customDateRange.to
                      ? `${customDateRange.from.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })} → ${customDateRange.to.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}`
                      : "Select date range"
                  }
                  isOpen={isDatePickerOpen}
                  onClose={() => setIsDatePickerOpen(false)}
                />
              </div>
            ) : (
              <select
                value={dateFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Custom") {
                    setIsCustomDate(true);
                    setDateFilter("Custom");
                    setIsDatePickerOpen(true);
                  } else {
                    setDateFilter(val);
                    setIsCustomDate(false);
                    setCustomDateRange({ from: null, to: null });
                  }
                }}
                className="w-full appearance-none rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-secondary"
              >
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 90 Days</option>
                <option>All Time</option>
                <option>Custom</option>
              </select>
            )}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 w-full appearance-none rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-secondary"
          >
            <option>All Statuses</option>
            <option>New</option>
            <option>Contacted</option>
            <option>Interested</option>
            <option>Joined</option>
            <option>Closed</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground">Quick Search</label>
          <div className="relative mt-1">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-secondary"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("All Statuses");
            setDateFilter("Last 30 Days");
            setIsCustomDate(false);
            setCustomDateRange({ from: null, to: null });
            setIsDatePickerOpen(false);
            setCurrentPage(1);
          }}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-secondary/10"
        >
          <RefreshCw className="h-4 w-4" />
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="mt-6 rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-[#f8fafc]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  ID
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contact Info
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Subject
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnquiries.map((e) => {
                const initials = e.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2);
                return (
                  <tr
                    key={e.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30 last:border-0"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{e.ref}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb]/10 text-xs font-bold text-[#2563eb]">
                          {initials}
                        </div>
                        <span className="text-sm font-semibold text-foreground">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">{e.email}</div>
                      <div className="text-xs text-muted-foreground">{e.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{e.subject}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(e.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusColors[e.status]}`}
                      >
                        {e.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewModal(e)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditModal(e);
                            setEditForm({
                              name: e.name,
                              email: e.email,
                              phone: e.phone,
                              subject: e.subject,
                              status: e.status,
                            });
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-yellow-50 hover:text-yellow-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal(e)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredEnquiries.length)} of{" "}
            {filteredEnquiries.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-[#2563eb] text-white"
                    : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-foreground">Enquiry Details</h3>
              <button
                onClick={() => setViewModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Name</span>
                <p className="mt-1 text-sm text-foreground">{viewModal.name}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Email</span>
                <p className="mt-1 text-sm text-foreground">{viewModal.email}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Phone</span>
                <p className="mt-1 text-sm text-foreground">{viewModal.phone}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Subject</span>
                <p className="mt-1 text-sm text-foreground">{viewModal.subject}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Message</span>
                <p className="mt-1 text-sm text-foreground">{viewModal.message}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Date</span>
                <p className="mt-1 text-sm text-foreground">
                  {new Date(viewModal.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Status</span>
                <div className="mt-1">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusColors[viewModal.status]}`}
                  >
                    {viewModal.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewModal(null)}
                className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1d4ed8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-foreground">Edit Enquiry</h3>
              <button
                onClick={() => setEditModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Phone</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                <input
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value as Enquiry["status"] })
                  }
                  className="mt-1 w-full appearance-none rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary"
                >
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Interested</option>
                  <option>Joined</option>
                  <option>Closed</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1d4ed8]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-foreground">Delete Enquiry</h3>
              <button
                onClick={() => setDeleteModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Are you sure you want to delete the enquiry from <strong>{deleteModal.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal.id)}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
