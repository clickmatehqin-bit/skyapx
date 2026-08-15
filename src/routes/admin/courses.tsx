import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronRight,
  Info,
  Image,
  DollarSign,
  Upload,
  X,
  Eye,
  Save,
  Send,
  Trash2,
  Pencil,
  BookOpen,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  createCourse,
  listAllCourses,
  deleteCourse,
  updateCourse,
  type CourseRecord,
} from "@/api/courses";
import { getCurrentAdmin } from "@/api/admin";
import AdminLayout from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/courses")({
  loader: async () => {
    try {
      const admin = await getCurrentAdmin();
      const courses = await listAllCourses();
      return { admin, courses };
    } catch {
      return { admin: null, courses: [] as CourseRecord[] };
    }
  },
  component: AdminCourses,
});

interface ImageState {
  file: File | null;
  preview: string;
  width: number;
  height: number;
  size: string;
}

function AdminCourses() {
  const navigate = useNavigate();
  const createCourseFn = useServerFn(createCourse);
  const { admin, courses } = Route.useLoaderData();
  const isAuthenticated = !!admin;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [courseList, setCourseList] = useState<CourseRecord[]>(courses);
  const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null);
  const deleteCourseFn = useServerFn(deleteCourse);
  const updateCourseFn = useServerFn(updateCourse);

  const [courseTitle, setCourseTitle] = useState("");
  const [category, setCategory] = useState("Medical Coding");
  const [coverImage, setCoverImage] = useState<ImageState | null>(null);
  const [originalPrice, setOriginalPrice] = useState("499");
  const [offerPrice, setOfferPrice] = useState("349");
  const [discount, setDiscount] = useState("30");
  const [modules, setModules] = useState("12");
  const [lessons, setLessons] = useState("48");
  const [duration, setDuration] = useState("24.5");
  const [languages, setLanguages] = useState("English");
  const [aboutCourse, setAboutCourse] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin-login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const handleRemoveImage = () => {
    if (coverImage?.preview) {
      URL.revokeObjectURL(coverImage.preview);
    }
    setCoverImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const readImageAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });

  const submitCourse = async (isPublished: boolean) => {
    if (!courseTitle.trim()) {
      toast.error("Course title is required");
      return;
    }
    setIsSaving(true);
    try {
      let coverImageData = "";
      if (coverImage?.file) {
        coverImageData = await readImageAsDataUrl(coverImage.file);
      }
      const result = await createCourseFn({
        data: {
          title: courseTitle.trim(),
          category,
          cover_image: coverImageData,
          original_price: originalPrice,
          offer_price: offerPrice,
          discount: discount,
          modules: modules,
          lessons: lessons,
          duration: duration,
          languages: languages,
          description: aboutCourse,
          is_published: isPublished,
        },
      });
      if (result.ok) {
        toast.success(
          isPublished
            ? `Course published! View it at /courses/${result.slug}`
            : "Course saved as a draft",
        );
        setCourseTitle("");
        setAboutCourse("");
        setOriginalPrice("499");
        setOfferPrice("349");
        setDiscount("30");
        setModules("12");
        setLessons("48");
        setDuration("24.5");
        setLanguages("English");
        handleRemoveImage();
        // Refresh course list from DB
        const updatedCourses = await listAllCourses();
        setCourseList(updatedCourses);
      } else {
        toast.error(result.message ?? "Could not save the course");
      }
    } catch {
      toast.error("Something went wrong, please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (course: CourseRecord) => {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    try {
      const result = await deleteCourseFn({ data: { id: course.id } });
      if (result.ok) {
        toast.success("Course deleted");
        setCourseList((prev) => prev.filter((c) => c.id !== course.id));
      } else {
        toast.error(result.message ?? "Delete failed");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleEditCourse = (course: CourseRecord) => {
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCategory(course.category);
    setOriginalPrice(course.original_price);
    setOfferPrice(course.offer_price);
    setDiscount(course.discount_percentage);
    setModules(course.modules_count);
    setLessons(course.lessons_count);
    setDuration(course.duration_hours);
    setLanguages(course.languages);
    setAboutCourse(course.description);
    setIsPublished(course.is_published);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;
    setIsSaving(true);
    try {
      let coverImageData = editingCourse.cover_image_url;
      if (coverImage?.file) {
        coverImageData = await readImageAsDataUrl(coverImage.file);
      }
      const result = await updateCourseFn({
        data: {
          id: editingCourse.id,
          title: courseTitle.trim(),
          category,
          cover_image: coverImageData,
          original_price: originalPrice,
          offer_price: offerPrice,
          discount: discount,
          modules: modules,
          lessons: lessons,
          duration: duration,
          languages: languages,
          description: aboutCourse,
          is_published: isPublished,
        },
      });
      if (result.ok) {
        toast.success("Course updated!");
        setEditingCourse(null);
        setCourseTitle("");
        setAboutCourse("");
        setOriginalPrice("499");
        setOfferPrice("349");
        setDiscount("30");
        setModules("12");
        setLessons("48");
        setDuration("24.5");
        setLanguages("English");
        setIsPublished(true);
        handleRemoveImage();
        const updatedCourses = await listAllCourses();
        setCourseList(updatedCourses);
      } else {
        toast.error(result.message ?? "Could not update the course");
      }
    } catch {
      toast.error("Something went wrong, please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) return;

    const img = new window.Image();
    img.onload = () => {
      setCoverImage({
        file,
        preview: URL.createObjectURL(file),
        width: img.width,
        height: img.height,
        size: formatFileSize(file.size),
      });
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <AdminLayout
      currentPath="/admin/courses"
      admin={admin}
      breadcrumb={[{ label: "Dashboard", path: "/admin" }, { label: "Courses" }]}
    >
      {/* Page Content */}
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Create New Course</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Define curriculum, set pricing, and configure display settings for the medical coding
              academy.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {editingCourse ? (
              <>
                <button
                  onClick={handleUpdateCourse}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Updating..." : "Update Course"}
                </button>
                <button
                  onClick={() => {
                    setEditingCourse(null);
                    setCourseTitle("");
                    setAboutCourse("");
                    setOriginalPrice("499");
                    setOfferPrice("349");
                    setDiscount("30");
                    setModules("12");
                    setLessons("48");
                    setDuration("24.5");
                    setLanguages("English");
                    setIsPublished(true);
                    handleRemoveImage();
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => submitCourse(false)}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </button>
                <button
                  onClick={() => submitCourse(true)}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1d4ed8] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Publish Course"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Grid: Form + Preview */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: Form */}
          <div className="space-y-6 lg:col-span-3">
            {/* Basic Information */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563eb]">
                <Info className="h-5 w-5" />
                <h2 className="text-lg font-extrabold">Basic Information</h2>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-semibold text-foreground">Course Title</label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Advanced CPC Exam Preparation 2024"
                    className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-2 w-full appearance-none rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                  >
                    <option>Medical Coding</option>
                    <option>Medical Billing</option>
                    <option>Bootcamp</option>
                    <option>Certification</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Course Media */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563eb]">
                <Image className="h-5 w-5" />
                <h2 className="text-lg font-extrabold">Course Cover Image</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a 16:9 cover image for the course. JPG, PNG, or WEBP.
              </p>

              <div className="mt-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {coverImage ? (
                  <div className="relative overflow-hidden rounded-xl border border-border">
                    <img
                      src={coverImage.preview}
                      alt="Course cover"
                      className="h-56 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-white/80">
                          {coverImage.width} × {coverImage.height}px · {coverImage.size}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm transition hover:bg-white"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Replace
                          </button>
                          <button
                            onClick={handleRemoveImage}
                            className="flex items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-red-500"
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-56 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border transition-all hover:border-[#2563eb]/50 hover:bg-[#2563eb]/5"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2563eb]/10">
                      <Upload className="h-6 w-6 text-[#2563eb]" />
                    </div>
                    <span className="mt-3 text-sm font-semibold text-foreground">
                      Click to upload course image
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WEBP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Pricing & Data */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563eb]">
                <DollarSign className="h-5 w-5" />
                <h2 className="text-lg font-extrabold">Pricing & Data</h2>
              </div>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-semibold text-foreground">Original Price</label>
                    <div className="mt-2 flex items-center rounded-lg border border-border bg-white transition-colors focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10">
                      <span className="border-r border-border px-3 py-3 text-sm text-muted-foreground">
                        ₹
                      </span>
                      <input
                        type="text"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        className="w-full px-4 py-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Offer Price</label>
                    <div className="mt-2 flex items-center rounded-lg border border-border bg-white transition-colors focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10">
                      <span className="border-r border-border px-3 py-3 text-sm text-muted-foreground">
                        ₹
                      </span>
                      <input
                        type="text"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        className="w-full px-4 py-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground">
                    Discount Percentage
                  </label>
                  <div className="mt-2 flex items-center rounded-lg border border-border bg-white transition-colors focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10">
                    <input
                      type="text"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-4 py-3 text-sm outline-none"
                    />
                    <span className="border-l border-border px-3 py-3 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-semibold text-foreground">Modules Count</label>
                    <input
                      type="text"
                      value={modules}
                      onChange={(e) => setModules(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Lessons Count</label>
                    <input
                      type="text"
                      value={lessons}
                      onChange={(e) => setLessons(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-semibold text-foreground">Hours Count</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Languages</label>
                    <input
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* About Course */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563eb]">
                <Info className="h-5 w-5" />
                <h2 className="text-lg font-extrabold">About Course</h2>
              </div>

              <div className="mt-5">
                <textarea
                  value={aboutCourse}
                  onChange={(e) => setAboutCourse(e.target.value)}
                  placeholder="Describe the course curriculum, learning outcomes, and what students will gain..."
                  rows={8}
                  className="w-full resize-none rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                />
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-[#2563eb]">
                  <Eye className="h-5 w-5" />
                  <h2 className="text-lg font-extrabold">Live Preview</h2>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-[#f8fafc]">
                  {/* Preview Image */}
                  <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200">
                    {coverImage ? (
                      <img
                        src={coverImage.preview}
                        alt="Course preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center">
                        <Image className="h-10 w-10 text-gray-300" />
                        <span className="mt-2 text-xs text-gray-400">No image</span>
                      </div>
                    )}
                    {discount && (
                      <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Preview Content */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2">
                      {courseTitle || "Course Title"}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-[#2563eb]">
                        ₹{offerPrice || "0"}
                      </span>
                      {originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{originalPrice}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[#2563eb]">
                        <BookOpen className="h-3 w-3" />
                        {modules || "0"} Modules
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-600">
                        {lessons || "0"} Lessons
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-600">
                        {duration || "0"} hrs
                      </span>
                    </div>

                    {languages && (
                      <p className="text-[10px] text-muted-foreground">Language: {languages}</p>
                    )}

                    {aboutCourse && (
                      <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                        {aboutCourse}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-center text-[10px] text-muted-foreground">
                  This is how the course will appear on the website
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-10" />

        {/* Existing Courses List */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#2563eb]" />
              <h2 className="text-lg font-extrabold">Existing Courses ({courseList.length})</h2>
            </div>
            {editingCourse && (
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setCourseTitle("");
                  setAboutCourse("");
                  setOriginalPrice("499");
                  setOfferPrice("349");
                  setDiscount("30");
                  setModules("12");
                  setLessons("48");
                  setDuration("24.5");
                  setLanguages("English");
                  setIsPublished(true);
                  handleRemoveImage();
                }}
                className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200"
              >
                <X className="h-3.5 w-3.5" /> Cancel Edit
              </button>
            )}
          </div>
          {courseList.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No courses yet. Create one above.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Price</th>
                    <th className="pb-3 pr-4">Modules</th>
                    <th className="pb-3 pr-4">Lessons</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-2">View</th>
                    <th className="pb-3 pr-2">Edit</th>
                    <th className="pb-3">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {courseList.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${editingCourse?.id === c.id ? "bg-blue-50" : ""}`}
                    >
                      <td className="py-3 pr-4 font-medium text-foreground">{c.title}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.category}</td>
                      <td className="py-3 pr-4">
                        <span className="font-semibold text-[#2563eb]">₹{c.offer_price}</span>
                        {c.original_price !== c.offer_price && (
                          <span className="ml-1 text-xs text-muted-foreground line-through">
                            ₹{c.original_price}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.modules_count}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.lessons_count}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${c.is_published ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}
                        >
                          {c.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="py-3 pr-2">
                        <a
                          href={`/courses/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:underline"
                        >
                          <Eye className="h-3 w-3" /> View
                        </a>
                      </td>
                      <td className="py-3 pr-2">
                        <button
                          onClick={() => handleEditCourse(c)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDeleteCourse(c)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
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

        <div className="h-10" />
      </div>
    </AdminLayout>
  );
}
