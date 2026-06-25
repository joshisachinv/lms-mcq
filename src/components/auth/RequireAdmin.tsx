"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getUserRole } from "@/lib/authService";

export default function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = await getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const role = await getUserRole(user.id);

      if (role !== "admin") {
        router.push("/student");
        return;
      }

      setChecking(false);
    };

    checkAdmin();
  }, [router]);

  if (checking) {
    return <p style={{ padding: "40px" }}>Checking admin access...</p>;
  }

  return <>{children}</>;
}