"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/reservations", label: "Prenotazioni" },
  { href: "/tables", label: "Tavoli" },
  { href: "/settings", label: "Impostazioni" },
  { href: "/documents", label: "Documenti" },
  { href: "/ledger", label: "Prima nota" },
  { href: "/users", label: "Utenti" },
  { href: "/audit", label: "Audit" }
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto py-2">
      {items.map((i) => {
        const active = pathname === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm border border-border",
              active ? "bg-black text-white" : "hover:bg-muted"
            )}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
