import React, { useState } from "react";

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
const validatePassword = (password: string) =>
  password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);

const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; terms?: string }>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    let newErrors: typeof errors = {};
    if (!validateEmail(email)) newErrors.email = "Enter a valid email.";
    if (!password) newErrors.password = "Password is required.";
    if (mode === "signup") {
      if (!validatePassword(password)) newErrors.password = "Password must be 8+ chars, include upper, lower, number, special.";
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
      if (!agreeTerms) newErrors.terms = "You must agree to the terms.";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage(mode === "login" ? "Login successful!" : "Signup successful! You can now log in.");
      if (mode === "login") {
        setTimeout(() => { window.location.href = "/"; }, 1000);
      } else {
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      }
    } else {
      setMessage(data.message || "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto bg-white dark:bg-card p-6 rounded-xl shadow">
      <h3 className="text-xl font-semibold text-center mb-2">
        {mode === "login" ? "Login with Email" : "Sign Up with Email"}
      </h3>
      <div>
        <input
          type="email"
          placeholder="Email"
          className={`w-full border p-2 rounded ${errors.email ? 'border-red-500' : ''}`}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
      </div>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          className={`w-full border p-2 rounded ${errors.password ? 'border-red-500' : ''}`}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        <button
          type="button"
          className="absolute right-2 top-2 text-xs text-gray-500"
          tabIndex={-1}
          onClick={() => setShowPassword(v => !v)}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
        {errors.password && <div className="text-xs text-red-500 mt-1">{errors.password}</div>}
      </div>
      {mode === "signup" && (
        <div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className={`w-full border p-2 rounded ${errors.confirmPassword ? 'border-red-500' : ''}`}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          {errors.confirmPassword && <div className="text-xs text-red-500 mt-1">{errors.confirmPassword}</div>}
        </div>
      )}
      {mode === "signup" && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="terms"
            checked={agreeTerms}
            onChange={e => setAgreeTerms(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="terms" className="text-xs">I agree to the <a href="#" className="underline">terms & conditions</a></label>
          {errors.terms && <div className="text-xs text-red-500 ml-2">{errors.terms}</div>}
        </div>
      )}
      {mode === "login" && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="rememberMe" className="text-xs">Remember me</label>
        </div>
      )}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? (mode === "login" ? "Logging in..." : "Signing up...") : (mode === "login" ? "Login" : "Sign Up")}
      </button>
      <div className="text-center">
        {mode === "login" ? (
          <>
            Don't have an account?{' '}
            <button
              type="button"
              className="text-blue-600 underline"
              onClick={() => { setMode("signup"); setMessage(null); setErrors({}); }}
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              className="text-blue-600 underline"
              onClick={() => { setMode("login"); setMessage(null); setErrors({}); }}
            >
              Login
            </button>
          </>
        )}
      </div>
      {message && (
        <div className={`text-center mt-2 ${message.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-500'}`}>{message}</div>
      )}
    </form>
  );
};

export default AuthForm; 