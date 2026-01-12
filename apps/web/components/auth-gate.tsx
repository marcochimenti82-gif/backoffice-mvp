"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { me } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: me,
    retry: false
  });

  React.useEffect(() => {
    if (!isLoading && (isError || !data)) {
      if (pathname !== "/login") router.replace("/login");
    }
  }, [isLoading, isError, data, router, pathname]);

  if (pathname === "/login") return <>{children}</>;
  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>;
  if (isError || !data) return null;

  return <>{children}</>;
}
