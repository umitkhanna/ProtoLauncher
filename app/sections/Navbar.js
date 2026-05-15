"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "../components/ThemeToggle";

const links = [
  { href: "#services", label: "Services" },
  { href: "#engagements", label: "Engagements" },
  { href: "#showcase", label: "Showcase" },
  { href: "#process", label: "Process" },
];

const navMuted =
  "text-sm text-zinc-400 transition-colors hover:text-white focus-visible:text-white";

export function Navbar() {
  const { status } = useSession();
  const authed = status === "authenticated";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 transition-[background,backdrop-filter,border-color,box-shadow] duration-300 sm:px-6 lg:px-8 ${
          scrolled || open
            ? "border-b border-white/[0.06] bg-zinc-950/75 shadow-lg shadow-black/25 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-bold text-violet-300">
            PL
          </span>
          ProtoLauncher
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={navMuted}
            >
              {l.label}
            </a>
          ))}
          {authed ? (
            <>
              <Link href="/dashboard" className={navMuted}>
                Dashboard
              </Link>
              <Link href="/logout" className={navMuted}>
                Sign out
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={navMuted}>
                Sign in
              </Link>
              <Link href="/register" className={navMuted}>
                Register
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {authed ? (
            <>
              <Link
                href="/dashboard"
                className={`hidden sm:inline-flex sm:items-center ${navMuted} md:hidden`}
              >
                Dashboard
              </Link>
              <Link
                href="/logout"
                className={`hidden sm:inline-flex sm:items-center ${navMuted} md:hidden`}
              >
                Sign out
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`hidden sm:inline-flex sm:items-center ${navMuted} md:hidden`}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={`hidden sm:inline-flex sm:items-center ${navMuted} md:hidden`}
              >
                Register
              </Link>
            </>
          )}
          <Link
            href="#contact"
            className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 shadow-md shadow-white/10 transition hover:bg-zinc-100 sm:inline-flex"
          >
            Book a Call
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-200 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id="mobile-nav"
            className="fixed inset-x-0 top-[73px] z-40 border-b border-white/[0.06] bg-zinc-950/95 px-4 py-6 backdrop-blur-xl md:hidden"
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-3 text-base text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              ))}
              {authed ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-lg px-3 py-3 text-base font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/logout"
                    className="rounded-lg px-3 py-3 text-base font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    Sign out
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-3 text-base font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg px-3 py-3 text-base font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
              <Link
                href="#contact"
                className="mt-3 inline-flex justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-zinc-950"
                onClick={() => setOpen(false)}
              >
                Book a Call
              </Link>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
