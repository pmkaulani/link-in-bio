import Link from 'next/link';
import BrandLogo from '../../components/BrandLogo';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { LEGAL_EMAIL } from '../../lib/constants';

export const metadata = {
  title: 'Terms of Service — Link-in-Bio',
  description: 'Terms and conditions governing the use of the Link-in-Bio creator platform.',
};

function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-8 scroll-mt-20">
      <h2 className="mb-2 text-base font-black tracking-tight text-white">{title}</h2>
      <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-zinc-400 font-medium">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-block transition hover:opacity-80">
            <BrandLogo size="md" variant="full" theme="light" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-3.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 transition"
          >
            <ArrowLeft size={14} />
            <span>Back to home</span>
          </Link>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-12 shadow-2xl space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-3 py-1 text-[11px] font-bold text-zinc-300 mb-3">
              <ShieldCheck size={13} className="text-white" />
              <span>Official Policy Document</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Terms of Service</h1>
            <p className="mt-1 text-xs text-zinc-500 font-mono">Last updated: August 28, 2026</p>
          </div>

          <div className="h-px w-full bg-zinc-800" />

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing, browsing, or creating an account on Link-in-Bio (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree with any part of these terms, you may not use our platform.
            </p>
          </Section>

          <Section title="2. Platform Services">
            <p>
              Link-in-Bio provides creators, artists, developers, and businesses with tools to build, customize, and share public link-in-bio pages, aggregate social media destinations, showcase products, embed multimedia, and analyze visitor engagement.
            </p>
          </Section>

          <Section title="3. Account Security & Verification">
            <p>
              You are responsible for safeguarding your login credentials and maintaining the confidentiality of your account. You agree to provide accurate registration information and refrain from impersonating other individuals, trademarks, or public figures without authorization.
            </p>
          </Section>

          <Section title="4. Creator Content Ownership">
            <p>
              You retain 100% intellectual property ownership rights to the content, text, images, trademarks, and destination links you publish through Link-in-Bio. By publishing content, you grant Link-in-Bio a worldwide, non-exclusive license to host, format, cache, and display your content strictly for the purpose of operating the Service.
            </p>
          </Section>

          <Section id="safety" title="5. Trust & Safety Policy (Acceptable Use)">
            <p>You agree not to use Link-in-Bio to:</p>
            <ul className="ml-5 list-disc space-y-1.5 text-zinc-400">
              <li>Publish destination links to malware, phishing pages, deceptive investment scams, or fraudulent services.</li>
              <li>Distribute unlawful, defamatory, harassing, or hate-speech content.</li>
              <li>Infringe upon copyrights, registered trademarks, or intellectual property rights of third parties.</li>
              <li>Register usernames with the intent to squat, trade, or ransom system-reserved creator handles.</li>
              <li>Conduct automated abuse, denial of service attacks, or vulnerability scraping.</li>
            </ul>
            <p>
              Link-in-Bio reserves the right to disable non-compliant blocks, unpublish profiles, and permanently terminate accounts that violate our safety policies.
            </p>
          </Section>

          <Section title="6. Limitation of Liability">
            <p>
              The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind. In no event shall Link-in-Bio Inc. or its affiliates be liable for indirect, incidental, or consequential damages resulting from the use or inability to use the platform.
            </p>
          </Section>

          <Section title="7. Contact Information">
            <p>
              For legal inquiries, trust and safety concerns, or terms clarification, please contact our team at <a href={`mailto:${LEGAL_EMAIL}`} className="font-bold text-white underline">{LEGAL_EMAIL}</a>.
            </p>
          </Section>

          <div className="mt-8 border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <span>&copy; {new Date().getFullYear()} Link-in-Bio Inc. All rights reserved.</span>
            <Link href="/privacy" className="font-bold text-white hover:underline">
              Privacy Policy &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
