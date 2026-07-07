"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/authService";
import { useAuth } from "@/components/auth/AuthProvider";

export default function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    let isMounted = true;

    getUserRole(user.id)
      .then((role) => {
        if (!isMounted) return;

        if (role !== "admin") {
          // No profile row, or a non-admin role: not authorized here.
          router.push("/student");
          return;
        }

        setIsAdmin(true);
        setCheckingRole(false);
      })
      .catch((error) => {
        if (!isMounted) return;

        console.error("Failed to check admin access:", error);
        router.push("/login");
      });

    return () => {
      isMounted = false;
    };
  }, [loading, user, router]);

  if (loading || checkingRole || !isAdmin) {
    return <p className="auth-loading">Checking admin access...</p>;
  }

  return <>{children}</>;
}
