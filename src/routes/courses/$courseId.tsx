import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Play,
  Heart,
  BookOpen,
  Clock,
  Globe,
  Share2,
  Flag,
  Search,
  MessageSquare,
  Plus,
  X,
  Send,
  CheckCircle,
  MessageSquarePlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { getCourseBySlug, listCourseFeedbacks, submitCourseFeedback } from "@/api/courses";
import { subscribeNewsletter } from "@/api/newsletter";
import { NewsletterSubscribe } from "@/components/NewsletterSubscribe";

export const Route = createFileRoute("/courses/$courseId")({
  loader: async ({ params }) => {
    const slug = params.courseId;
    const [course, feedbacks] = await Promise.all([
      getCourseBySlug({ data: { slug } }),
      listCourseFeedbacks({ data: { slug } }),
    ]);
    return { course, feedbacks };
  },
  component: CourseDetails,
});

const navLinks = ["Courses", "Bootcamp", "Certifications", "Placements", "Testimonials"];

const coursesData: Record<
  string,
  {
    title: string;
    price: string;
    originalPrice: string;
    discount: string;
    modules: string;
    lessons: string;
    hours: string;
    languages: string;
    description: string;
  }
> = {
  "basic-medical-coding": {
    title: "MEDICAL CODING MASTERCLASS",
    price: "₹4,999",
    originalPrice: "₹9,999",
    discount: "50% OFF",
    modules: "22 Modules",
    lessons: "150+ Lessons",
    hours: "35+ Hours",
    languages: "English & Tamil",
    description:
      "Build a strong foundation in Medical Coding through structured lessons covering Medical Terminology, Anatomy & Physiology, ICD-10-CM, CPT®, HCPCS Level II, and Revenue Cycle Management. Learn industry standards, coding guidelines, and documentation practices with practical examples that help you develop job-ready skills. Whether you're a beginner or a healthcare graduate, this course provides the knowledge needed to start a successful career in medical coding.",
  },
  "cpc-fast-track": {
    title: "CPC FAST TRACK PROGRAM",
    price: "₹6,999",
    originalPrice: "₹14,999",
    discount: "53% OFF",
    modules: "18 Modules",
    lessons: "120+ Lessons",
    hours: "28+ Hours",
    languages: "English & Tamil",
    description:
      "Accelerate your path to CPC certification with our intensive fast-track program. This course covers all AAPC CPC exam domains with focused instruction, practice exams, and personalized feedback. Designed for motivated learners who want to achieve certification quickly without compromising on quality.",
  },
  "aapc-ahima-expert": {
    title: "AAPC/AHIMA EXPERT CERTIFICATION",
    price: "₹8,999",
    originalPrice: "₹18,999",
    discount: "52% OFF",
    modules: "35 Modules",
    lessons: "250+ Lessons",
    hours: "60+ Hours",
    languages: "English & Tamil",
    description:
      "Master both AAPC and AHIMA certification tracks with comprehensive coverage of inpatient and outpatient coding, clinical documentation improvement, and compliance. This expert-level program prepares you for multiple industry-recognized certifications and opens doors to advanced career opportunities.",
  },
  "ccs-specialization": {
    title: "CCS SPECIALIZATION COURSE",
    price: "₹7,499",
    originalPrice: "₹15,999",
    discount: "53% OFF",
    modules: "25 Modules",
    lessons: "180+ Lessons",
    hours: "42+ Hours",
    languages: "English & Tamil",
    description:
      "Specialize in AHIMA's Certified Coding Specialist credential with in-depth training on ICD-10-CM/PCS, CPT, and HCPCS coding systems. This course emphasizes hospital-based coding, case mix index optimization, and quality reporting requirements for healthcare facilities.",
  },
};

const initialReviews = [
  {
    name: "Ananya R.",
    text: "The course was easy to follow, practical, and helped me understand medical coding with confidence. The trainers explained every concept clearly.",
  },
  {
    name: "Priya M.",
    text: "Excellent curriculum and supportive mentors. I cleared my CPC exam on the first attempt thanks to the mock tests and hands-on practice sessions.",
  },
  {
    name: "Vikram S.",
    text: "The structured approach to learning ICD-10 and CPT coding was exactly what I needed. The real-world case studies made all the difference.",
  },
  {
    name: "Meera K.",
    text: "I came from a non-medical background but the course made everything simple. The placement support helped me land a job within 2 months.",
  },
];

const extraReviews = [
  {
    name: "Arjun T.",
    text: "The flexibility of the course schedule allowed me to study while working. The trainers were always available for doubt-clearing sessions.",
  },
  {
    name: "Deepa N.",
    text: "I highly recommend Sky APX for anyone serious about medical coding. The course content is up-to-date with industry standards.",
  },
  {
    name: "Rohan P.",
    text: "The mock exams were incredibly realistic. I felt fully prepared on exam day. Thank you Sky APX for the amazing training.",
  },
  {
    name: "Sneha L.",
    text: "From basic terminology to advanced coding, everything was covered thoroughly. The community support is also fantastic.",
  },
];

function SupportTitle() {
  const navigate = useNavigate();
  const [clickTimeout, setClickTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      // Double click detected
      setTimeout(() => {
        navigate({ to: "/admin-login" });
      }, 400);
    } else {
      const timeout = setTimeout(() => {
        setClickTimeout(null);
      }, 400);
      setClickTimeout(timeout);
    }
  };

  return (
    <h4
      className="text-xs font-bold uppercase tracking-wider text-white cursor-default select-none"
      onClick={handleClick}
    >
      Support
    </h4>
  );
}

interface Review {
  name: string;
  text: string;
  date?: string;
}

function ReviewsSection({ initialReviews, slug }: { initialReviews: Review[]; slug: string }) {
  const submitFeedbackFn = useServerFn(submitCourseFeedback);
  const [showMore, setShowMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userFeedbacks, setUserFeedbacks] = useState<Review[]>([]);

  const handleSubmit = async () => {
    if (!feedbackName.trim() || !feedbackText.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await submitFeedbackFn({
        data: { slug, name: feedbackName.trim(), text: feedbackText.trim() },
      });
      if (result.ok) {
        setUserFeedbacks((prev) => [
          { name: feedbackName, text: feedbackText, date: "Just now" },
          ...prev,
        ]);
        setIsSubmitting(false);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setShowModal(false);
          setFeedbackName("");
          setFeedbackText("");
        }, 2000);
      } else {
        setIsSubmitting(false);
        toast.error(result.message ?? "Could not submit feedback, please try again.");
      }
    } catch {
      setIsSubmitting(false);
      toast.error("Could not submit feedback, please try again.");
    }
  };

  const allFeedbacks = [...userFeedbacks, ...(initialReviews ?? [])];
  const visibleFeedbacks = showMore ? allFeedbacks : allFeedbacks.slice(0, 4);

  return (
    <div className="mt-10">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .modal-animate {
          animation: modalFadeIn 0.3s ease-out forwards;
        }
        .success-animate {
          animation: successPop 0.4s ease-out forwards;
        }
        .add-feedback-btn:hover {
          transform: scale(1.08);
        }
      `}</style>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-foreground">Feedback</h2>
        <button
          onClick={() => setShowModal(true)}
          className="add-feedback-btn flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#2563eb] text-white shadow-md transition-all duration-300 hover:bg-[#1d4ed8] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-105"
          title="Add Feedback"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 space-y-5">
        {visibleFeedbacks.map((r, i) => (
          <div
            key={`feedback-${i}`}
            className="flex gap-3"
            style={{
              animation: i < 4 ? undefined : "fadeIn 0.3s ease-in-out forwards",
            }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10">
              <span className="text-xs font-bold text-secondary">{r.name.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-secondary">{r.name}</span>
                {r.date && <span className="text-[10px] text-muted-foreground">· {r.date}</span>}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </div>
          </div>
        ))}
      </div>

      {!showMore && allFeedbacks.length > 4 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowMore(true)}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Load More
          </button>
        </div>
      )}

      {/* Feedback Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isSubmitting && setShowModal(false)}
          />
          <div className="modal-animate relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {showSuccess ? (
              <div className="flex flex-col items-center px-8 py-12">
                <div className="success-animate flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">
                  Thank you for your feedback!
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your feedback has been submitted.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Share Your Feedback</h3>
                    <p className="text-sm text-muted-foreground">
                      Tell us about your learning experience.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      value={feedbackName}
                      onChange={(e) => setFeedbackName(e.target.value)}
                      placeholder="Enter your name"
                      className="mt-1.5 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Feedback</label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value.slice(0, 500))}
                      placeholder="Write your feedback here..."
                      rows={4}
                      className="mt-1.5 w-full resize-none rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                    />
                    <div className="mt-1 text-right text-[11px] text-muted-foreground">
                      {feedbackText.length} / 500
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-border px-6 py-4">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !feedbackName.trim() || !feedbackText.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-[#1d4ed8] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CourseDetails() {
  const { courseId } = Route.useParams();
  const { course: dbCourse, feedbacks } = Route.useLoaderData();
  const subscribeNewsletterFn = useServerFn(subscribeNewsletter);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail.trim()) {
      setNewsletterMessage("Please enter your email address");
      return;
    }
    setIsSubscribing(true);
    try {
      const result = await subscribeNewsletterFn({ data: { email: newsletterEmail.trim() } });
      if (result.ok) {
        toast.success("Subscribed! Thank you for joining our newsletter.");
        setNewsletterEmail("");
      } else {
        toast.error(result.message ?? "Could not subscribe, please try again.");
      }
    } catch {
      setNewsletterMessage("Could not subscribe, please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const course = dbCourse
    ? {
        title: dbCourse.title,
        price: dbCourse.offer_price,
        originalPrice: dbCourse.original_price,
        discount: dbCourse.discount_percentage,
        modules: dbCourse.modules_count,
        lessons: dbCourse.lessons_count,
        hours: dbCourse.duration_hours,
        languages: dbCourse.languages,
        description: dbCourse.description,
      }
    : coursesData[courseId] || coursesData["basic-medical-coding"];

  const feedbackReviews: Review[] = (feedbacks ?? []).map((f) => ({
    name: f.name,
    text: f.text,
    date: f.date
      ? new Date(f.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : undefined,
  }));

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar */}
      <header className="relative w-full bg-white z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between py-4 pl-7 pr-6 lg:pl-10 lg:pr-10">
          <Link to="/" className="flex items-center shrink-0">
            <img src={logo} alt="Sky APX" className="h-[50px] w-auto object-contain lg:h-[56px]" />
          </Link>

          <ul className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 md:flex">
            {navLinks.map((l, i) => (
              <li key={l}>
                <a
                  href="#"
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    i === 0
                      ? "bg-[#2563eb] text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]"
                      : "text-foreground/70 hover:bg-[#2563eb] hover:text-white hover:shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:-translate-y-0.5"
                  }`}
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>

          <Link
            to="/contact"
            className="shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Enroll Now
          </Link>
        </nav>
      </header>

      {/* Course Content */}
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* Back button */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; Back to Courses
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {/* Left - Main Content */}
          <div className="lg:col-span-2">
            {/* Course Cover Image */}
            <div className="relative overflow-hidden rounded-2xl shadow-lg">
              <div className="aspect-video bg-gradient-to-br from-[#1e3a5f] via-[#2563eb] to-[#3b82f6]">
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                      <BookOpen className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{course.title}</h3>
                    <p className="mt-1 text-sm text-white/70">Course Cover Image</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Title */}
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {course.title}
            </h1>

            {/* Share/Flag icons */}
            <div className="mt-4 flex items-center gap-3">
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Flag className="h-4 w-4" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* About Course */}
            <div className="mt-8">
              <h2 className="text-lg font-bold text-foreground">About Course</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {course.description}
              </p>
            </div>

            {/* Student Reviews */}
            <ReviewsSection initialReviews={feedbackReviews} slug={courseId} />
          </div>

          {/* Right - Sticky Pricing Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
              {/* Buttons */}
              <Link
                to="/contact"
                className="block w-full rounded-xl bg-secondary py-3.5 text-center text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-secondary/90 hover:shadow-lg"
              >
                Enquiry
              </Link>
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-muted">
                <Heart className="h-4 w-4" />
                Wishlist
              </button>

              {/* Features */}
              <div className="mt-6 space-y-4 border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{course.lessons}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{course.hours}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{course.languages}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter CTA Banner */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <div className="relative overflow-hidden rounded-2xl bg-[#0c2d6b] px-8 py-10 sm:px-12 sm:py-12">
            {/* Decorative abstract shapes */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-400/30 blur-2xl" />
            <div className="absolute -right-5 top-10 h-32 w-32 rounded-full bg-yellow-400/30 blur-2xl" />
            <div className="absolute -right-10 bottom-0 h-36 w-36 rounded-full bg-green-400/20 blur-2xl" />

            <div className="relative z-10 flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  Join and get amazing discount
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  With our responsive themes and mobile and desktop apps
                </p>
              </div>
              <div className="flex w-full max-w-sm items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-lg border-0 bg-white py-3 pl-10 pr-4 text-sm text-foreground outline-none"
                  />
                </div>
                <button
                  onClick={handleNewsletterSubscribe}
                  disabled={isSubscribing}
                  className="shrink-0 rounded-lg bg-green-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-green-600 disabled:opacity-60"
                >
                  {isSubscribing ? "Subscribing..." : "Subscribe"}
                </button>
                <span className="sr-only" role="status">
                  {newsletterMessage}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e293b]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pt-14 pb-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {/* Column 1 - Brand */}
          <div>
            <div className="text-xl font-black text-white">Sky APX</div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Premier Medical Coding Academy dedicated to clinical excellence and professional
              career advancement in healthcare.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="mt-4 space-y-3">
              {["Why Choose Us", "Curriculum", "FAQ", "Student Stories", "Admissions"].map(
                (link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Column 3 - Support */}
          <div>
            <SupportTitle />
            <ul className="mt-4 space-y-3">
              {["Call Center", "Knowledge Base", "Privacy Policy", "Terms of Service"].map(
                (link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Column 4 - Newsletter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Subscribe to our Newsletter!
            </h4>
            <div className="mt-4 space-y-3">
              <NewsletterSubscribe
                inputClassName="w-full rounded-lg border border-slate-600 bg-transparent px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-white"
                buttonClassName="w-full rounded-lg bg-[#0c2d6b] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0f3a8a]"
              />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-700">
          <div className="mx-auto max-w-7xl px-6 py-5 text-center text-xs text-slate-500 lg:px-10">
            &copy; 2024 Sky APX Medical Coding Academy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
