import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Phone,
  Mail,
  MapPin,
  Twitter,
  Instagram,
  DiscIcon as Discord,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createEnquiry } from "@/api/enquiries";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

const subjectOptions = [
  "General Inquiry",
  "Course Information",
  "Admission Support",
  "Placement Assistance",
];

function ContactPage() {
  const navigate = useNavigate();
  const createEnquiryFn = useServerFn(createEnquiry);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email address";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.subject) newErrors.subject = "Please select a subject";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const result = await createEnquiryFn({
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        },
      });
      if (result.ok) {
        toast.success("Message sent successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      } else {
        toast.error(result.message ?? "Something went wrong, please try again.");
      }
    } catch {
      toast.error("Something went wrong, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans animate-page-in">
      <style>{`
        @keyframes pageSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-page-in {
          animation: pageSlideUp 0.4s ease-out forwards;
        }
        @keyframes arrowBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-4px); }
        }
        .back-btn:hover .back-arrow {
          animation: arrowBounce 0.6s ease-in-out infinite;
        }
        .radio-option {
          transition: all 0.2s ease;
        }
        .radio-option:hover {
          border-color: rgba(37, 99, 235, 0.4);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .radio-option.selected {
          border-color: #2563eb;
          background-color: rgba(37, 99, 235, 0.05);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        .radio-dot {
          transition: all 0.2s ease;
        }
        .radio-option.selected .radio-dot {
          border-color: #2563eb;
        }
        .radio-option.selected .radio-dot::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #2563eb;
          animation: radioPop 0.2s ease-out;
        }
        @keyframes radioPop {
          from { transform: translate(-50%, -50%) scale(0); }
          to { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {/* Back Button */}
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        <button
          onClick={() => window.history.back()}
          className="back-btn group flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-[#2563eb] hover:bg-[#2563eb] hover:text-white hover:-translate-y-0.5 hover:shadow-md"
        >
          <ArrowLeft className="back-arrow h-4 w-4 transition-transform duration-300" />
          Back
        </button>
      </div>

      {/* Contact Card */}
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Panel - Blue */}
            <div className="relative overflow-hidden rounded-l-3xl bg-[#2563eb] px-8 py-10 sm:px-10 sm:py-12">
              {/* Decorative circles */}
              <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full border-[12px] border-white/10" />
              <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full border-[8px] border-white/10" />

              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                Contact Information
              </h2>
              <p className="mt-2 text-sm text-white/80">Say something to start a live chat!</p>

              <div className="mt-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white">+91 00000 00000</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white">Medicode.com</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white">Chennai</span>
                </div>
              </div>

              {/* Social Icons */}
              <div className="absolute bottom-8 left-8 flex items-center gap-3">
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                >
                  <Discord className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className="px-8 py-10 sm:px-10 sm:py-12">
              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1 w-full border-b border-gray-300 bg-transparent py-2 text-sm text-foreground outline-none transition-colors focus:border-secondary"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="mt-6">
                  <label className="text-xs font-medium text-muted-foreground">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Enter your email"
                    className="mt-1 w-full border-b border-gray-300 bg-transparent py-2 text-sm text-foreground outline-none transition-colors focus:border-secondary"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="mt-6">
                  <label className="text-xs font-medium text-muted-foreground">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                    className="mt-1 w-full border-b border-gray-300 bg-transparent py-2 text-sm text-foreground outline-none transition-colors focus:border-secondary"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>

                {/* Row 3: Subject */}
                <div className="mt-8">
                  <label className="text-sm font-semibold text-foreground">Select Subject</label>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {subjectOptions.map((option) => (
                      <label
                        key={option}
                        className={`radio-option flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 transition-all duration-200 ${
                          formData.subject === option ? "selected" : ""
                        }`}
                      >
                        <div className="radio-dot relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-gray-300">
                          {formData.subject === option && (
                            <div className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
                          )}
                        </div>
                        <span className="text-sm text-foreground">{option}</span>
                        <input
                          type="radio"
                          name="subject"
                          value={option}
                          checked={formData.subject === option}
                          onChange={() => handleChange("subject", option)}
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>
                  {errors.subject && <p className="mt-2 text-xs text-red-500">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div className="mt-8">
                  <label className="text-xs font-medium text-muted-foreground">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    placeholder="Write your message.."
                    rows={4}
                    className="mt-1 w-full resize-none border-b border-gray-300 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-colors focus:border-secondary"
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                </div>

                {/* Submit */}
                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-secondary px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-secondary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
