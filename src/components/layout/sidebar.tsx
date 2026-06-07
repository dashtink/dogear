"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScanLine, BookMarked, Users, Library, ContactRound, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";

const nav = [
  { href: "/",          label: "Dashboard", icon: LayoutDashboard },
  { href: "/library",   label: "Library",   icon: Library },
  { href: "/scan",      label: "Scan",      icon: ScanLine },
  { href: "/shelves",   label: "Shelves",   icon: BookMarked },
  { href: "/checkouts", label: "Checkouts", icon: Users },
  { href: "/contacts",  label: "Contacts",  icon: ContactRound },
  { href: "/series",    label: "Series",    icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen border-r bg-background px-3 py-6 gap-1 shrink-0">
      <div className="flex items-center px-3 mb-6">
        <Image src="/logo.svg" alt="DogEar" width={120} height={44} priority />
      </div>
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      <div className="mt-auto px-3 pt-4 border-t">
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              pathname === href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
