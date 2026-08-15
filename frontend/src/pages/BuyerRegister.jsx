import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Phone, CreditCard, Loader2, Store } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import OtpStep from "@/components/OtpStep";
import { toast } from "@/components/ui/use-toast";
import { promptGoogleSignIn, isGoogleSignInConfigured } from "@/lib/googleAuth";

export default function BuyerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    national_id: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [existingUser, setExistingUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    base44.auth.me().then((me) => {
      if (me) {
        setExistingUser(me);
        setForm(f => ({
          ...f,
          full_name: me.full_name || "",
          email: me.email || "",
          phone: me.phone || "",
          national_id: me.national_id || "",
        }));
      }
    }).catch(() => {}).finally(() => setCheckingAuth(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (existingUser) {
      // Existing user (e.g. seller) becoming a buyer — just update their profile
      setLoading(true);
      try {
        await base44.auth.updateMe({
          full_name: form.full_name,
          phone: form.phone,
          national_id: form.national_id,
          user_type: "buyer",
        });
        toast({ title: "Buyer profile activated!", description: "You can now browse and rent assets." });
        window.location.href = "/";
      } catch (err) {
        setError(err.message || "Update failed");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = async () => {
    await base44.auth.updateMe({
      full_name: form.full_name,
      phone: form.phone,
      national_id: form.national_id,
      user_type: "buyer",
    });
    try {
      await base44.integrations.Core.SendEmail({
        to: form.email,
        subject: "Welcome to RentAlls!",
        body: `Hi ${form.full_name},\n\nWelcome to RentAlls! Your buyer account is now active.\n\nBrowse our catalogue of Houses, tools & equipment, vehicles, and other assets available for rent. Book in minutes with secure payments and real-time support.\n\nHappy renting!\nThe RentAlls Team`,
      });
    } catch (e) {
      /* email failure is non-critical */
    }
    toast({ title: "Welcome to RentAlls!", description: "Your account is verified and active." });
    window.location.href = "/";
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const credential = await promptGoogleSignIn();
      await base44.auth.loginWithGoogle(credential);
      // Google already verified the email and created the account server-side
      // -- just mark them as a buyer (leave name/phone/national_id for the
      // profile page later, since Google doesn't provide those).
      await base44.auth.updateMe({ user_type: "buyer" });
      toast({ title: "Welcome to RentAlls!", description: "Your account is ready." });
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };


  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title="Verify your email" subtitle="Enter the 6-digit code sent to your email">
        <OtpStep email={form.email} onVerified={handleVerified} onBack={() => setShowOtp(false)} />
      </AuthLayout>
    );
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={existingUser ? "Become a Buyer" : "Buyer Registration"}
      subtitle={existingUser ? "Activate your buyer profile to start renting" : "Create your account to start renting"}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          {" · "}
          <Link to="/register" className="text-muted-foreground hover:text-foreground">Change type</Link>
        </>
      }
    >
      {existingUser && (
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm">
          <div className="flex items-center gap-2 text-primary font-medium mb-1">
            <Store className="w-4 h-4" />
            Already registered as {existingUser.user_type || "a user"}
          </div>
          <p className="text-muted-foreground text-xs">
            You're signed in as <span className="font-medium">{existingUser.email}</span>. Update your profile below to activate buyer capabilities.
          </p>
        </div>
      )}

      {!existingUser && (
        <>
          {isGoogleSignInConfigured() && (
            <>
              <Button
                variant="outline"
                className="w-full h-12 text-sm font-medium mb-6"
                onClick={handleGoogle}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <GoogleIcon className="w-5 h-5 mr-2" />
                )}
                Continue with Google
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">or</span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="full_name"
              type="text"
              autoFocus
              placeholder="John Doe"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="pl-10 h-12"
              disabled={!!existingUser}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+254 725 217 874"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="national_id">National ID No.</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="national_id"
                placeholder="e.g. 8001015000089"
                value={form.national_id}
                onChange={(e) => setForm((f) => ({ ...f, national_id: e.target.value }))}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
        </div>
        {!existingUser && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
          </>
        )}
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{existingUser ? "Activating..." : "Creating account..."}</>
          ) : (
            existingUser ? "Activate Buyer Profile" : "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}