import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Lock, Eye, EyeOff, ArrowRight, HelpCircle, BookOpen, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { loginAdmin } from "@/api/admin";

export const Route = createFileRoute("/admin-login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const loginAdminFn = useServerFn(loginAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const result = await loginAdminFn({
        data: {
          email: email.trim(),
          password,
        },
      });
      if (result.ok) {
        navigate({ to: "/admin" });
      } else {
        setError(result.message ?? "Invalid credentials");
      }
    } catch {
      setError("Login unavailable, please try again later");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans">
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .back-to-website {
          animation: slideInLeft 0.4s ease-out forwards;
        }
        .back-to-website:hover .back-arrow {
          transform: translateX(-3px);
        }
      `}</style>

      {/* Back to Website Button */}
      <button
        onClick={() => navigate({ to: "/" })}
        className="back-to-website fixed left-6 top-6 z-50 group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-[#2563eb] hover:border-[#2563eb] hover:-translate-y-0.5 hover:shadow-xl"
      >
        <ArrowLeft className="back-arrow h-4 w-4 transition-transform duration-300" />
        <span className="hidden sm:inline">Back to Website</span>
      </button>

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left Panel - Blue */}
        <div className="relative flex flex-col justify-center bg-[#2563eb] px-8 py-12 sm:px-12 lg:px-16">
          {/* Decorative dots */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <span className="text-xl font-black text-white">SA</span>
              </div>
              <span className="text-2xl font-black text-white">Sky APX</span>
            </Link>

            <h1 className="mt-8 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              Welcome Back, Admin.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
              Manage your academy with ease. Track student progress, manage medical coding courses,
              and oversee certifications all in one central hub.
            </p>

            {/* Dashboard Preview Card */}
            <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                  <span className="text-sm font-bold text-white">SA</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Sky APX</div>
                  <div className="text-xs text-white/60">ADMIN LOGIN</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-[10px] text-white/70">ACTIVE STUDENTS</span>
                  </div>
                  <div className="mt-1 text-lg font-bold text-white">12,840</div>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-400" />
                    <span className="text-[10px] text-white/70">CERTIFICATIONS</span>
                  </div>
                  <div className="mt-1 text-lg font-bold text-white">98% Success</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
              Administrator Login
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Access your Sky APX dashboard to manage medical academy workflows.
            </p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleLogin} className="mt-8 space-y-6">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-border bg-white py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-secondary"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <a href="#" className="text-xs font-medium text-secondary hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-border bg-white py-3 pl-10 pr-10 text-sm text-foreground outline-none transition-colors focus:border-secondary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Device */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                />
                <span className="text-sm text-muted-foreground">
                  Remember this device for 30 days
                </span>
              </label>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-secondary/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Login to Dashboard"}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {/* Help Links */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">Need technical assistance?</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <a
                  href="#"
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-secondary"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help Center
                </a>
                <a
                  href="#"
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-secondary"
                >
                  <BookOpen className="h-4 w-4" />
                  Admin Guide
                </a>
              </div>
            </div>

            {/* Copyright */}
            <p className="mt-10 text-center text-xs text-muted-foreground">
              &copy; 2025 Sky APX Medical Coding Academy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
