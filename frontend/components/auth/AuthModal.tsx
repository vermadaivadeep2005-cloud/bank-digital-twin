"use client";

import * as React from "react";
import { Lock, Mail, User as UserIcon, LogIn, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, fullName);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isRegister ? "Create Risk Analyst Account" : "Sign In to Bank Twin"}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {isRegister && (
          <div>
            <label className="text-xs text-slate-300 block mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-300 block mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@bankdigitaltwin.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-300 block mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
        </div>

        <Button type="submit" variant="primary" loading={loading} className="w-full py-2.5 font-semibold">
          {isRegister ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Register Account</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In with JWT</span>
            </>
          )}
        </Button>

        <div className="text-center pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            {isRegister ? "Already have an account? Sign In" : "Need an account? Register as Risk Analyst"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
