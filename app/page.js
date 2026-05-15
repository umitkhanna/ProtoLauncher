import { Navbar } from "./sections/Navbar";
import { Hero } from "./sections/Hero";
import { CapabilityStrip } from "./sections/CapabilityStrip";
import { Stats } from "./sections/Stats";
import { Services } from "./sections/Services";
import { WhyProtoLauncher } from "./sections/WhyProtoLauncher";
import { TechStack } from "./sections/TechStack";
import { Showcase } from "./sections/Showcase";
import { Process } from "./sections/Process";
import { Engagements } from "./sections/Engagements";
import { Testimonials } from "./sections/Testimonials";
import { Faq } from "./sections/Faq";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
import { JsonLd } from "./components/JsonLd";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://protolauncher.vercel.app";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ProtoLauncher",
  description:
    "AI-native startup studio helping founders build and launch MVPs quickly.",
  url: siteUrl,
  slogan: "Launch AI-powered products faster.",
  logo: `${siteUrl}/favicon.svg`,
  sameAs: [
    "https://twitter.com",
    "https://linkedin.com",
    "https://github.com",
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "ProtoLauncher",
  description:
    "AI-native startup studio building MVPs and SaaS products for founders.",
  url: siteUrl,
  areaServed: "Worldwide",
  serviceType: [
    "AI MVP Development",
    "SaaS Product Engineering",
    "AI Workflow Automation",
    "Fractional Technical Partner",
  ],
};

export async function generateMetadata() {
  return {
    title: "ProtoLauncher — AI-native startup studio",
    description:
      "AI-native startup studio helping founders build and launch MVPs quickly. Launch AI-powered products faster with senior product engineers and designers.",
    openGraph: {
      title: "ProtoLauncher — Launch AI-powered products faster.",
      description:
        "AI-native startup studio helping founders build and launch MVPs quickly.",
    },
    twitter: {
      title: "ProtoLauncher — Launch AI-powered products faster.",
      description:
        "AI-native startup studio helping founders build and launch MVPs quickly.",
    },
  };
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={serviceSchema} />
      <Navbar />
      <main id="main-content">
        <Hero />
        <CapabilityStrip />
        <Stats />
        <Services />
        <WhyProtoLauncher />
        <TechStack />
        <Showcase />
        <Process />
        <Engagements />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
