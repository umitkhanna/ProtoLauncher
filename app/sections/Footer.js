import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { contactEmail, socialLinks } from "../contact/constants";
import { NewsletterForm } from "../components/NewsletterForm";

const columns = [
  {
    title: "Studio",
    links: [
      { href: "#services", label: "Services" },
      { href: "#engagements", label: "Engagements" },
      { href: "#showcase", label: "Showcase" },
      { href: "#process", label: "Process" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#contact", label: "Contact" },
      { href: "#contact", label: "Book a call" },
      { href: "#", label: "Careers" },
      { href: "#", label: "Press kit" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
      { href: "#", label: "Security" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      id="contact"
      className="scroll-mt-24 border-t border-white/[0.06] bg-zinc-950"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-bold text-violet-300">
                PL
              </span>
              ProtoLauncher
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
              AI-native startup studio helping founders build and launch MVPs
              quickly.
            </p>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Updates from the studio
              </p>
              <div className="mt-3">
                <NewsletterForm />
              </div>
            </div>

            <p className="mt-6">
              <a
                href={`mailto:${contactEmail}`}
                className="text-sm font-medium text-zinc-300 underline-offset-4 transition hover:text-white hover:underline"
              >
                {contactEmail}
              </a>
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {col.title}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.label}`}>
                    <a
                      href={l.href}
                      className="text-sm text-zinc-400 transition hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-white/[0.06] py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ProtoLauncher. All rights reserved.</p>
          <ul className="flex items-center gap-3">
            <li>
              <a
                href={socialLinks.twitter}
                rel="noopener"
                target="_blank"
                aria-label="ProtoLauncher on Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-zinc-400 transition hover:border-white/20 hover:text-white"
              >
                <Twitter className="h-4 w-4" aria-hidden />
              </a>
            </li>
            <li>
              <a
                href={socialLinks.linkedin}
                rel="noopener"
                target="_blank"
                aria-label="ProtoLauncher on LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-zinc-400 transition hover:border-white/20 hover:text-white"
              >
                <Linkedin className="h-4 w-4" aria-hidden />
              </a>
            </li>
            <li>
              <a
                href={socialLinks.github}
                rel="noopener"
                target="_blank"
                aria-label="ProtoLauncher on GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-zinc-400 transition hover:border-white/20 hover:text-white"
              >
                <Github className="h-4 w-4" aria-hidden />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
