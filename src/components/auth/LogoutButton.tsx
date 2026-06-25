"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/authService";

export default function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <button className="logout-button" type="button" onClick={logout}>
      Logout
    </button>
  );
}