"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import { useAuth } from "@/components/auth/AuthProvider";

type Props = {
  title: string;
  subtitle?: string;
  navItems: {
    label: string;
    href: string;
  }[];
};

export default function PageHeader({ title, subtitle, navItems }: Props) {
  const pathname = usePathname();
  const { profile, user } = useAuth();

  const displayName =
    profile?.fullName || user?.email || subtitle || "User";

  return (
    <header className="app-header compact-header">
      <div className="compact-header-left">
        <div className="compact-brand-row">
          <h1 className="app-title compact-title">{title}</h1>
          <span className="compact-role-pill">{profile?.role || subtitle}</span>
        </div>

        <nav className="app-nav compact-nav">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" &&
                item.href !== "/student" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "nav-link nav-link-active" : "nav-link"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="compact-user-area">
        <div className="compact-user-name">{displayName}</div>
        <LogoutButton />
      </div>
    </header>
  );
}