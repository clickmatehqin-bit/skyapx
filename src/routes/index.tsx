import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Play,
  Star,
  GraduationCap,
  Briefcase,
  CheckSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  ChevronDown,
  ArrowRight,
  Globe,
  MessageSquare,
} from "lucide-react";
import heroImg from "@/assets/hero-student.png";
import studentImg from "@/assets/student.png";
import logo from "@/assets/logo.png";
import { useState, useEffect, useCallback, useRef } from "react";
import { NewsletterSubscribe } from "@/components/NewsletterSubscribe";
import { listCourses, type CourseRecord } from "@/api/courses";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const courses = await listCourses();
      return { courses };
    } catch {
      return { courses: [] as CourseRecord[] };
    }
  },
  component: Index,
  head: () => ({
    meta: [
      { title: "Sky APX — Master Medical Coding & Launch Your Healthcare Career" },
      {
        name: "description",
        content:
          "Become a certified medical billing and coding professional with Sky APX. Industry-aligned curriculum for AAPC and AHIMA certifications.",
      },
      { property: "og:title", content: "Sky APX — Master Medical Coding" },
      { property: "og:description", content: "Launch your healthcare career with Sky APX." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const navLinks = ["Courses", "Bootcamp", "Certifications", "Placements", "Testimonials"];

const sectionIds: Record<string, string> = {
  Courses: "courses",
  Bootcamp: "bootcamp",
  Certifications: "certifications",
  Placements: "placements",
  Testimonials: "testimonials",
};

const avatars = [
  "https://i.pravatar.cc/96?img=47",
  "https://i.pravatar.cc/96?img=12",
  "https://i.pravatar.cc/96?img=15",
  "https://i.pravatar.cc/96?img=32",
  "https://i.pravatar.cc/96?img=68",
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

const fallbackCourses = [
  { modules: "40+", title: "Basic Medical Coding", courseId: "basic-medical-coding" },
  { modules: "30+", title: "CPC Fast Track", courseId: "cpc-fast-track" },
  { modules: "80+", title: "AAPC/AHIMA Expert", courseId: "aapc-ahima-expert" },
  { modules: "50+", title: "CCS Specialization", courseId: "ccs-specialization" },
];

function CourseCarousel({ courses }: { courses: CourseRecord[] }) {
  const allCourses =
    courses.length > 0
      ? courses.map((c) => ({
          modules: c.modules_count,
          title: c.title,
          courseId: c.slug,
        }))
      : fallbackCourses;
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(allCourses.length / itemsPerPage);
  const visibleCourses = allCourses.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  const goToPage = useCallback(
    (page: number) => {
      if (isAnimating || page < 0 || page >= totalPages || page === currentPage) return;
      setIsAnimating(true);
      setCurrentPage(page);
      setTimeout(() => setIsAnimating(false), 400);
    },
    [isAnimating, currentPage, totalPages],
  );

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipe = 50;
    if (Math.abs(distance) >= minSwipe) {
      if (distance > 0) nextPage();
      else prevPage();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevPage();
      if (e.key === "ArrowRight") nextPage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, prevPage]);

  return (
    <div className="mt-10">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-40px); }
        }
        .carousel-enter {
          animation: slideIn 0.4s ease-out forwards;
        }
      `}</style>

      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCourses.map((course, i) => (
            <Link
              key={`${currentPage}-${course.courseId}-${i}`}
              to="/courses/$courseId"
              params={{ courseId: course.courseId }}
              className={`group relative block h-72 overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl carousel-enter`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-neutral-200 via-neutral-500 to-neutral-900" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {course.modules} modules
                </span>
                <h3 className="mt-2 text-lg font-bold text-white">{course.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">
            {String(currentPage + 1).padStart(2, "0")}
          </span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">
            {String(totalPages).padStart(2, "0")}
          </span>
          <div className="ml-2 h-[3px] w-24 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-400 ease-out"
              style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-all duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-white transition-all duration-200 hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Index() {
  const { courses } = Route.useLoaderData();
  const [activeSection, setActiveSection] = useState("Courses");

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const scrollToTop = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;

      for (const link of navLinks) {
        const sectionId = sectionIds[link];
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(link);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans scroll-smooth">
      {/* Navbar */}
      <header className="relative w-full bg-white shadow-sm sticky top-0 z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between py-4 pl-7 pr-6 lg:pl-10 lg:pr-10">
          <a href="#" onClick={scrollToTop} className="flex items-center shrink-0">
            <img src={logo} alt="Sky APX" className="h-[50px] w-auto object-contain lg:h-[56px]" />
          </a>

          <ul className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 md:flex">
            {navLinks.map((l) => (
              <li key={l}>
                <button
                  onClick={() => scrollToSection(sectionIds[l])}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeSection === l
                      ? "bg-[#2563eb] text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]"
                      : "text-foreground/70 hover:bg-[#2563eb] hover:text-white hover:shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:-translate-y-0.5"
                  }`}
                >
                  {l}
                </button>
              </li>
            ))}
          </ul>

          <Link
            to="/contact"
            className="shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-secondary hover:text-white hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg"
          >
            Enroll Now
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:gap-6 lg:px-10 lg:py-20">
          {/* Left */}
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
              Master Medical Coding.{" "}
              <span className="text-secondary">Launch Your Healthcare Career</span> with Sky APX.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Become a certified professional in medical billing and coding. Our industry-aligned
              curriculum prepares you for AAPC and AHIMA certifications in record time.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/contact"
                className="rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-300 hover:bg-secondary hover:text-white hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg"
              >
                Start Your Journey Today
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-secondary/60 bg-white px-7 py-3.5 text-sm font-semibold text-secondary transition-all duration-300 hover:bg-secondary hover:text-white hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg"
              >
                Enquiry Now
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary transition-colors duration-300 group-hover:bg-white">
                  <Play className="h-2.5 w-2.5 fill-white text-white" />
                </span>
              </Link>
            </div>
          </div>

          {/* Right - Hero Globe Section */}
          <div className="hero-globe-container relative mx-auto w-full max-w-[560px]">
            <style>{`
              @keyframes globeSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes floatUpDown {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-14px); }
              }
              @keyframes glowPulse {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.05); }
              }
              @keyframes orbitBook {
                from { transform: rotate(0deg) translateX(180px) rotate(0deg); }
                to { transform: rotate(360deg) translateX(180px) rotate(-360deg); }
              }
              @keyframes orbitCap {
                from { transform: rotate(120deg) translateX(200px) rotate(-120deg); }
                to { transform: rotate(480deg) translateX(200px) rotate(-480deg); }
              }
              @keyframes particleFloat1 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                25% { transform: translate(10px, -15px) scale(1.1); opacity: 0.6; }
                50% { transform: translate(-5px, -25px) scale(0.9); opacity: 0.3; }
                75% { transform: translate(15px, -10px) scale(1.05); opacity: 0.5; }
              }
              @keyframes particleFloat2 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                33% { transform: translate(-12px, -20px) scale(1.15); opacity: 0.5; }
                66% { transform: translate(8px, -30px) scale(0.85); opacity: 0.4; }
              }
              @keyframes particleFloat3 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
                50% { transform: translate(18px, -18px) scale(1.2); opacity: 0.3; }
              }
              @keyframes statFloat1 {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
              }
              @keyframes statFloat2 {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              @keyframes statFloat3 {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
              }
              .hero-globe-wrapper {
                animation: floatUpDown 5s ease-in-out infinite;
                will-change: transform;
              }
              .hero-globe-container:hover .hero-globe-wrapper {
                transform: scale(1.03);
                transition: transform 0.4s ease-out;
              }
              .hero-globe-container:hover .globe-glow {
                opacity: 0.9 !important;
                transform: scale(1.1) !important;
              }
              .globe-glow {
                animation: glowPulse 4s ease-in-out infinite;
                will-change: transform, opacity;
              }
              .orbit-book {
                animation: orbitBook 20s linear infinite;
                will-change: transform;
              }
              .orbit-cap {
                animation: orbitCap 28s linear infinite;
                will-change: transform;
              }
              .particle-1 {
                animation: particleFloat1 6s ease-in-out infinite;
                will-change: transform, opacity;
              }
              .particle-2 {
                animation: particleFloat2 7s ease-in-out infinite 0.5s;
                will-change: transform, opacity;
              }
              .particle-3 {
                animation: particleFloat3 5s ease-in-out infinite 1s;
                will-change: transform, opacity;
              }
              .particle-4 {
                animation: particleFloat2 8s ease-in-out infinite 1.5s;
                will-change: transform, opacity;
              }
              .particle-5 {
                animation: particleFloat1 6.5s ease-in-out infinite 2s;
                will-change: transform, opacity;
              }
              .stat-card-1 {
                animation: statFloat1 4.5s ease-in-out infinite;
                will-change: transform;
              }
              .stat-card-2 {
                animation: statFloat2 5.5s ease-in-out infinite 0.7s;
                will-change: transform;
              }
              .stat-card-3 {
                animation: statFloat3 4s ease-in-out infinite 1.2s;
                will-change: transform;
              }
            `}</style>

            {/* Floating wrapper for main content */}
            <div className="hero-globe-wrapper relative z-10">
              {/* Blue backdrop circle */}
              <div className="absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.85_0.08_240)] sm:h-[500px] sm:w-[500px]" />

              {/* Pulsing glow */}
              <div className="globe-glow absolute left-1/2 top-1/2 -z-5 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.3)_0%,transparent_70%)] opacity-50 sm:h-[460px] sm:w-[460px]" />

              {/* Main hero image */}
              <img
                src={heroImg}
                alt="Student on globe with laptop"
                width={1024}
                height={1024}
                className="relative z-10 mx-auto w-full max-w-[520px]"
              />

              {/* Orbiting book */}
              <div className="orbit-book absolute left-1/2 top-1/2 z-5 -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg">
                  <svg className="h-5 w-5 text-[#2563eb]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              </div>

              {/* Orbiting graduation cap */}
              <div className="orbit-cap absolute left-1/2 top-1/2 z-5 -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg">
                  <svg className="h-5 w-5 text-[#2563eb]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.346M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
              </div>

              {/* Floating particles */}
              <div className="particle-1 absolute left-[15%] top-[20%] z-20 h-2 w-2 rounded-full bg-[#2563eb]/40" />
              <div className="particle-2 absolute right-[20%] top-[15%] z-20 h-1.5 w-1.5 rounded-full bg-white/60" />
              <div className="particle-3 absolute left-[10%] top-[50%] z-20 h-1 w-1 rounded-full bg-[#2563eb]/30" />
              <div className="particle-4 absolute right-[12%] top-[45%] z-20 h-2.5 w-2.5 rounded-full bg-white/40" />
              <div className="particle-5 absolute left-[25%] bottom-[20%] z-20 h-1.5 w-1.5 rounded-full bg-[#2563eb]/50" />
            </div>

            {/* Floating stat cards */}
            <div className="stat-card-1 absolute left-0 top-4 z-30 rounded-2xl bg-white px-5 py-3 text-center shadow-lg sm:left-2 sm:top-6">
              <div className="text-xl font-extrabold text-primary sm:text-2xl">100+</div>
              <div className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                Partnerships
              </div>
            </div>

            <div className="stat-card-2 absolute right-0 top-10 z-30 rounded-2xl bg-white px-5 py-3 text-center shadow-lg sm:right-0 sm:top-14">
              <div className="text-xl font-extrabold text-primary sm:text-2xl">10K+</div>
              <div className="text-[11px] font-medium text-muted-foreground sm:text-xs">Alumni</div>
            </div>

            <div className="stat-card-3 absolute bottom-24 left-2 z-30 rounded-2xl bg-white px-4 py-2.5 shadow-lg sm:bottom-28 sm:left-0">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span className="text-lg font-extrabold text-primary">4.6</span>
              </div>
              <div className="text-[11px] font-medium text-muted-foreground">5K+ Reviews</div>
            </div>
          </div>
        </div>

        {/* Bottom banner */}
        <div className="bg-banner">
          <div className="mx-auto flex max-w-7xl items-center gap-5 px-6 py-5 lg:px-10">
            <div className="flex -space-x-3">
              {avatars.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-11 w-11 rounded-full border-2 border-white object-cover"
                  loading="lazy"
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-white sm:text-base lg:text-lg">
              10K+ Students have started their studies
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="certifications" className="relative overflow-hidden bg-background scroll-mt-24">
        <style>{`
          @keyframes floatLogo {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes glowPulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.03); }
          }
          @keyframes dotFloat1 {
            0%, 100% { transform: translate(0, 0); opacity: 0.6; }
            50% { transform: translate(4px, -6px); opacity: 0.9; }
          }
          @keyframes dotFloat2 {
            0%, 100% { transform: translate(0, 0); opacity: 0.5; }
            50% { transform: translate(-5px, -4px); opacity: 0.8; }
          }
          @keyframes studentFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .why-choose-logo {
            animation: floatLogo 6s ease-in-out infinite;
            will-change: transform;
          }
          .why-choose-glow {
            animation: glowPulse 5s ease-in-out infinite;
            will-change: transform, opacity;
          }
          .why-dot-1 {
            animation: dotFloat1 4s ease-in-out infinite;
          }
          .why-dot-2 {
            animation: dotFloat2 5s ease-in-out infinite 0.5s;
          }
          .why-dot-3 {
            animation: dotFloat1 4.5s ease-in-out infinite 1s;
          }
          .why-student-img {
            animation: studentFloat 5s ease-in-out infinite;
            transition: transform 0.3s ease;
          }
          .why-student-img:hover {
            transform: translateY(-6px) scale(1.01);
          }
        `}</style>

        {/* Companies row */}
        <div className="mx-auto max-w-7xl px-6 pt-14 lg:px-10 lg:pt-20">
          <div className="flex flex-col items-start gap-6 border-b border-border pb-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <p className="max-w-xs text-base font-bold leading-snug text-foreground">
              More than <span className="text-secondary">100+</span> companies
              <br className="hidden sm:block" /> collaborate with us
            </p>
            <div className="flex flex-wrap items-center gap-x-12 gap-y-4 text-2xl font-semibold text-muted-foreground/60 sm:text-3xl">
              <span>Medline</span>
              <span>Care_Pro</span>
              <span>Healthcore</span>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:gap-14 lg:px-10 lg:py-20">
          {/* Left - Student with Logo Watermark */}
          <div className="relative mx-auto w-full max-w-[520px] min-h-[480px]">
            {/* Logo Watermark - Large, positioned top-left behind student */}
            <div className="why-choose-logo absolute -left-24 -top-8 z-0">
              <svg
                viewBox="0 0 200 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-[380px] w-auto sm:h-[450px]"
                style={{ opacity: 0.09 }}
              >
                <text
                  x="10"
                  y="85"
                  fontFamily="Arial, sans-serif"
                  fontSize="120"
                  fontWeight="900"
                  fill="#2563EB"
                  letterSpacing="-4"
                >
                  SA
                </text>
                <text
                  x="10"
                  y="115"
                  fontFamily="Arial, sans-serif"
                  fontSize="32"
                  fontWeight="800"
                  fill="#2563EB"
                  letterSpacing="2"
                >
                  SKY APX
                </text>
              </svg>
            </div>

            {/* Soft radial glow behind logo */}
            <div className="why-choose-glow absolute -left-8 top-0 z-0 h-[300px] w-[350px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.1)_0%,transparent_65%)] sm:h-[380px] sm:w-[420px]" />

            {/* Student image */}
            <img
              src={studentImg}
              alt="Sky APX student"
              width={1024}
              height={1024}
              loading="lazy"
              className="why-student-img relative z-10 w-full"
            />
            <div className="absolute bottom-0 left-0 right-0 z-20 h-[2px] bg-secondary/70" />
          </div>

          {/* Right - Content */}
          <div>
            <span className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
              Why Choose Us
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              Discover the Distinct Advantages of Our Academy
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {[
                {
                  icon: GraduationCap,
                  title: "Expert Trainers",
                  desc: "Learn directly from CPC-certified instructors with 10+ years of clinical experience.",
                },
                {
                  icon: Briefcase,
                  title: "Practical Cases",
                  desc: "Engage with 500+ real-world clinical documentation scenarios and coding audits.",
                },
                {
                  icon: CheckSquare,
                  title: "100% Placement",
                  desc: "Dedicated career services and direct interview pipelines to leading healthcare systems.",
                },
                {
                  icon: FileText,
                  title: "Mock Exams",
                  desc: "Unlimited access to AAPC-simulated testing environments and personalized feedback.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-md"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary/10">
                    <Icon className="h-4.5 w-4.5 text-secondary" strokeWidth={2.25} />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Course Category */}
      <section id="courses" className="bg-background scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
          <div className="text-center">
            <span className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
              Course Category
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              Explore Our Signature Courses
            </h2>
          </div>

          <CourseCarousel courses={courses} />
        </div>
      </section>

      {/* Course Duration & Track Comparison */}
      <section id="bootcamp" className="bg-background scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              Course Duration &amp; Track Comparison
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Find the perfect path for your professional goals
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="bg-[#e8f0fe]">
                  <th className="px-6 py-4 text-sm font-semibold text-foreground">Module Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-foreground">Duration</th>
                  <th className="px-6 py-4 text-sm font-semibold text-foreground">Goal</th>
                  <th className="px-6 py-4 text-sm font-semibold text-foreground">
                    Syllabus Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Medical Terminology & Anatomy",
                    duration: "4 Weeks",
                    goal: "Foundational Knowledge",
                  },
                  {
                    name: "ICD-10-CM Coding Standards",
                    duration: "8 Weeks",
                    goal: "Diagnosis Specialist",
                  },
                  {
                    name: "CPT/HCPCS Procedure Coding",
                    duration: "10 Weeks",
                    goal: "Professional Fee Coder",
                  },
                  {
                    name: "Medical Billing & Reimbursement",
                    duration: "6 Weeks",
                    goal: "Revenue Cycle Management",
                  },
                ].map(({ name, duration, goal }, i) => (
                  <tr
                    key={name}
                    className={`border-t border-border ${i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}`}
                  >
                    <td className="px-6 py-5 text-sm font-semibold text-foreground">{name}</td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">{duration}</td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">{goal}</td>
                    <td className="px-6 py-5">
                      <a
                        href="#"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary transition hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials & FAQ */}
      <section id="testimonials" className="bg-background scroll-mt-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-14 lg:grid-cols-2 lg:gap-14 lg:px-10 lg:py-20">
          {/* Left - Testimonials */}
          <div>
            <span className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
              Testimonials
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              Unlocking Success Stories from Our Students
            </h2>

            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              {/* Image area */}
              <div className="relative h-64 sm:h-72">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110">
                    <Play className="ml-1 h-5 w-5 fill-secondary text-secondary" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  &quot;Sky APX completely changed my life. Within 6 months of starting the CCS
                  track, I secured a position at a major city hospital with a 40% salary increase.
                  The mentors are incredible.&quot;
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                    <span className="text-sm font-bold text-secondary">JA</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">James Anderson</div>
                    <div className="text-xs text-muted-foreground">
                      Now Certified CCS Professional
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - FAQ */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              Frequently Asked Questions
            </h2>

            <div className="mt-8 space-y-3">
              {[
                {
                  q: "What is the CPC exam pass rate for students?",
                  a: "Our students maintain a 92% first-time pass rate, which is significantly higher than the national average, thanks to our rigorous mock exam series.",
                },
                {
                  q: "Do you provide job placement assistance?",
                  a: "Yes, we offer dedicated career services including resume reviews, interview coaching, and direct partnerships with healthcare employers.",
                },
                {
                  q: "Can I study while working full-time?",
                  a: "Absolutely. Our flexible schedule includes evening and weekend cohorts designed for working professionals.",
                },
                {
                  q: "Are the certifications recognized globally?",
                  a: "Yes, AAPC and AHIMA certifications are recognized across the United States and internationally in over 50 countries.",
                },
              ].map(({ q, a }, i) => (
                <div
                  key={q}
                  className={`overflow-hidden rounded-xl border transition-shadow ${
                    i === 0
                      ? "border-l-4 border-l-secondary border-t-border border-r-border border-b-border bg-card shadow-sm"
                      : "border-border bg-card"
                  }`}
                >
                  <button
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                    onClick={(e) => {
                      const details = (
                        e.currentTarget as HTMLButtonElement
                      ).parentElement?.querySelector(".faq-answer") as HTMLElement;
                      const icon = e.currentTarget.querySelector(".faq-chevron") as SVGElement;
                      if (details) {
                        const isOpen =
                          details.style.maxHeight !== "0px" && details.style.maxHeight !== "";
                        details.style.maxHeight = isOpen ? "0px" : `${details.scrollHeight}px`;
                        if (icon) icon.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
                      }
                    }}
                  >
                    <span className="pr-4 text-sm font-semibold text-foreground">{q}</span>
                    <ChevronDown
                      className="faq-chevron h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200"
                      style={{ transform: i === 0 ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </button>
                  <div
                    className="faq-answer overflow-hidden transition-all duration-300"
                    style={{ maxHeight: i === 0 ? "200px" : "0px" }}
                  >
                    <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                      {a}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="#"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary transition hover:underline"
            >
              View All Success Stories
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section id="placements" className="bg-background scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6 pb-14 lg:px-10 lg:pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-[#0c2d6b] px-6 py-16 text-center sm:px-12 sm:py-20">
            {/* Decorative circles */}
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#1a3f8a] opacity-60" />
            <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#1a3f8a] opacity-60" />

            <h2 className="relative z-10 mx-auto max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
              Shape Minds, Share Knowledge: Become a Certified Pro Today!
            </h2>
            <p className="relative z-10 mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              Join the thousands of successful medical coders who launched their careers through Sky
              APX. Our next cohort starts in 14 days.
            </p>
            <Link
              to="/contact"
              className="relative z-10 mt-8 inline-block rounded-full bg-white px-10 py-4 text-sm font-bold text-[#0c2d6b] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Start Your Application Now
            </Link>
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
                <Briefcase className="h-4 w-4" />
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
