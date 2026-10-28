import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { Plus } from "lucide-react";
import { shell } from "@/lib/ui";
import ThemeToggle from "@/components/ThemeToggle";
import CursorTheme from "@/components/CursorTheme";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "coscheck | Agenda acara cosplay Indonesia",
  description:
    "Direktori acara cosplay Indonesia dengan info yang rutin dicek: tanggal, lokasi, harga tiket, dan tanggal verifikasi.",
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        <CursorTheme />
        <div className="flex min-h-screen flex-col bg-paper bg-[radial-gradient(var(--dots)_.7px,transparent_.7px)] bg-size-[5px_5px]">
          <header className="border-b border-ink bg-paper">
            <div
              className={`${shell} flex min-h-[62px] items-center justify-between gap-6 sm:min-h-[72px]`}
            >
              <Link
                href="/"
                aria-label="coscheck"
                className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-[-1.5px] sm:text-[27px]"
              >
                <span className="grid size-[34px] -rotate-5 place-items-center bg-accent text-[22px] text-paper">
                  C
                </span>
                <span>
                  cos<span className="text-accent">check</span>
                </span>
              </Link>

              <nav
                aria-label="Navigasi utama"
                className="hidden items-center gap-[25px] text-[13px] font-bold sm:flex"
              >
                <Link
                  href="/"
                  className="text-accent underline underline-offset-[7px]"
                >
                  Jelajahi acara
                </Link>
              </nav>

              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <Link
                  href="/admin"
                  className="flex items-center gap-2 whitespace-nowrap border border-ink bg-card p-2 text-[11px] font-extrabold shadow-[3px_3px_0_var(--color-ink)] sm:px-[13px] sm:py-2.5 sm:text-xs"
                >
                  <Plus size={14} aria-hidden="true" />
                  Panel admin
                </Link>
              </div>
            </div>
          </header>

          <div className="flex-1">{children}</div>

          <footer className="border-t border-ink bg-sand">
            <div
              className={`${shell} flex flex-col items-start justify-between gap-5 py-[22px] sm:flex-row sm:items-center`}
            >
              <div className="text-[11px] leading-[1.6] text-soft">
                <strong className="text-ink">coscheck.</strong> Direktori acara
                cosplay Indonesia.
                <br />
                Info bisa berubah, selalu cek ulang ke akun penyelenggara.
              </div>
              <div className="flex gap-4 text-[11px] font-bold">
                <Link href="/">Beranda</Link>
                <Link href="/admin">Admin</Link>
                <Link href="/credits">Kredit</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
