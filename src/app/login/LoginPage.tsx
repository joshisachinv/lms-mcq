"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole, signIn } from "@/lib/authService";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";
import { useToast } from "@/components/ui/ToastProvider";

export default function LoginPage() {
  const toast = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        console.error("Supabase login error:", error);
        toast.error(error.message);
        return;
      }

      if (!data.user) {
        toast.error("No user returned from Supabase.");
        return;
      }

      const role = await getUserRole(data.user.id);

      if (!role) {
        toast.error("Login succeeded, but no profile role was found.");
        return;
      }

      if (role === "admin") {
        router.push("/admin");
        return;
      }

      if (role === "student") {
        router.push("/student");
        return;
      }

      toast.error(`Unknown role: ${role}`);
      
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <main className="login-page">
      <Card className="form-card login-card">
        <PageTitle title="LMS MCQ" subtitle="Sign in to continue" />

        <div className="form-grid">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void login();
              }
            }}
          />

          <Button type="button" onClick={login}>
            Login
          </Button>
        </div>
      </Card>
    </main>
  );
}
