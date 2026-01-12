import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthGate } from "@/components/auth-gate";
import { Nav } from "@/components/nav";

export const metadata = {
  title: "Backoffice",
  description: "Backoffice MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <Providers>
          <AuthGate>
            <div className="mx-auto max-w-6xl px-4">
              <header className="py-4">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Backoffice</div>
                </div>
                <Nav />
              </header>
              <main className="pb-10">{children}</main>
            </div>
          </AuthGate>
        </Providers>
      </body>
    </html>
  );
}
