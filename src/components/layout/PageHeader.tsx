"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";

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

  return (
    <header className="app-header">
      <div>
        <h1 className="app-title">{title}</h1>
        {subtitle && <div className="app-subtitle">{subtitle}</div>}

        <nav className="app-nav">
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

      <LogoutButton />
    </header>
  );
}