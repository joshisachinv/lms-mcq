"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole, signIn } from "@/lib/authService";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const { data, error } = await signIn(email, password);

      if (error || !data.user) {
        alert("Login failed.");
        return;
      }

      const role = await getUserRole(data.user.id);

      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/student");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
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
