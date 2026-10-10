"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BankLogo } from "@/components/common/BankLogo";
import { Eye, EyeOff, ShieldCheck, Lock, Mail, UserCheck, ArrowRight } from "lucide-react";

// Prominent 60fps 3D Particle Canvas with Floating Currency Symbols ($, ₹, €, £, ¥)
function ThreeParticleCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle nodes
    const particleCount = 55;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1.2,
    }));

    // Floating 3D Currency Symbols ($, ₹, €, £, ¥) - Prominent Dollar & Rupee Focus
    const currencies = ["$", "₹", "$", "₹", "€", "$", "₹", "£", "¥", "$", "₹"];
    const symbolCount = 38;
    const floatingSymbols = Array.from({ length: symbolCount }).map((_, idx) => {
      const char = currencies[idx % currencies.length];
      const isBigSymbol = char === "$" || char === "₹";
      return {
        text: char,
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 1.6 + 0.8, // Slightly closer 3D depth
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.25 - Math.random() * 0.35, // Smooth upward float
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.012,
        fontSize: isBigSymbol ? 32 + Math.random() * 24 : 22 + Math.random() * 14,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Mesh Vector Connections
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.28 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      // 2. Update & Draw Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129, 140, 248, ${0.65 * p.z})`;
        ctx.fill();
      });

      // 3. Update & Draw Floating Currency Symbols ($, ₹, €, £, ¥)
      floatingSymbols.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.rotSpeed;

        // Wrap around screen boundaries smoothly
        if (s.y < -40) s.y = height + 40;
        if (s.x < -40) s.x = width + 40;
        if (s.x > width + 40) s.x = -40;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);

        const fontPt = Math.round(s.fontSize * s.z);
        ctx.font = `700 ${fontPt}px var(--font-mono), monospace`;

        if (s.text === "₹") {
          ctx.fillStyle = `rgba(52, 211, 153, ${0.65 * s.z})`;
          ctx.shadowColor = "#34d399";
        } else if (s.text === "$") {
          ctx.fillStyle = `rgba(56, 189, 248, ${0.7 * s.z})`;
          ctx.shadowColor = "#38bdf8";
        } else {
          ctx.fillStyle = `rgba(192, 132, 252, ${0.5 * s.z})`;
          ctx.shadowColor = "#c084fc";
        }

        ctx.shadowBlur = 12 * s.z;
        ctx.fillText(s.text, 0, 0);

        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-85"
    />
  );
}

export function LoginPage() {
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, fullName.trim());
        setIsRegister(false);
        setPassword("");
      } else {
        await login(email.trim(), password);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : err instanceof Error
          ? err.message
          : "Authentication failed";
      toast.error(msg || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-950 text-slate-100 relative overflow-hidden transition-colors font-sans select-none">
      {/* Prominent 3D Particle Mesh Canvas with Floating Currency Symbols */}
      <ThreeParticleCanvas />

      {/* Ambient Radial Gradient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-indigo-600/20 via-cyan-500/15 to-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-10 p-6 flex items-center justify-between max-w-7xl w-full mx-auto">
        <BankLogo size="lg" withText />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest hidden sm:inline">
            System Online
          </span>
        </div>
      </header>

      {/* Main Glassmorphic Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden transition-all duration-300">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <span>{isRegister ? "Register Account" : "Authenticate Identity"}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-normal">
              Enter registered credentials to access the quantitative simulation & stress engine
            </p>
          </div>

          {/* Sign In / Register Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`py-2.5 text-xs font-semibold rounded-lg transition-all ${
                !isRegister
                  ? "bg-gradient-to-r from-slate-800 to-slate-800/90 text-white shadow-md border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`py-2.5 text-xs font-semibold rounded-lg transition-all ${
                isRegister
                  ? "bg-gradient-to-r from-slate-800 to-slate-800/90 text-white shadow-md border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="username"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-3 text-xs font-bold font-mono tracking-wider uppercase mt-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-950/50 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isRegister ? "Register & Access Platform" : "Sign In to Platform"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-500 font-mono">
        Bank Digital Twin &copy; {new Date().getFullYear()} — Enterprise Risk & Solvency Engine
      </footer>
    </div>
  );
}

export default LoginPage;
