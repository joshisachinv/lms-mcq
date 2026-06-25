"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/authService";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const user = await getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setChecking(false);
    };

    checkUser();
  }, [router]);

  if (checking) {
    return <p style={{ padding: "40px" }}>Checking login...</p>;
  }

  return <>{children}</>;
}