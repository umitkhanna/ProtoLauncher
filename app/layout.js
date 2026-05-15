import { Inter } from "next/font/google";
import "./globals.css";
import { AppSessionProvider } from "./components/AppSessionProvider";
import { ThemeScript } from "./components/ThemeScript";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://protolauncher.vercel.app";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ProtoLauncher — AI-native startup studio",
    template: "%s · ProtoLauncher",
  },
  description:
    "AI-native startup studio helping founders build and launch MVPs quickly. Launch AI-powered products faster with lean, AI-assisted product engineering.",
  applicationName: "ProtoLauncher",
  keywords: [
    "AI startup studio",
    "MVP development",
    "SaaS engineering",
    "AI-native",
    "product launch",
    "ProtoLauncher",
  ],
  authors: [{ name: "ProtoLauncher" }],
  creator: "ProtoLauncher",
  publisher: "ProtoLauncher",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ProtoLauncher",
    title: "ProtoLauncher — Launch AI-powered products faster.",
    description:
      "AI-native startup studio helping founders build and launch MVPs quickly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProtoLauncher — Launch AI-powered products faster.",
    description:
      "AI-native startup studio helping founders build and launch MVPs quickly.",
    creator: "@protolauncher",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "technology",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:m-0 focus:inline-flex focus:h-auto focus:w-auto focus:items-center focus:overflow-visible focus:rounded-lg focus:bg-white focus:p-3 focus:text-sm focus:font-medium focus:text-zinc-950 focus:opacity-100"
        >
          Skip to content
        </a>
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
