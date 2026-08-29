import Link from 'next/link';
import BrandLogo from '../../components/BrandLogo';
import { Lock, ArrowLeft } from 'lucide-react';
import { PRIVACY_EMAIL, APP_DOMAIN } from '../../lib/constants';

export const metadata = {
  title: 'Privacy Policy — Link-in-Bio',
  description: 'Learn how Link-in-Bio collects, protects, and manages your creator and visitor data.',
};

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-base font-black tracking-tight text-white">{title}</h2>
      <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-zinc-400 font-medium">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
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
              <Lock size={13} className="text-white" />
              <span>Data Protection Standard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Privacy Policy</h1>
            <p className="mt-1 text-xs text-zinc-500 font-mono">Last updated: August 28, 2026</p>
          </div>

          <div className="h-px w-full bg-zinc-800" />

          <Section title="1. Information We Collect">
            <p>When you create an account on Link-in-Bio, we collect:</p>
            <ul className="ml-5 list-disc space-y-1.5 text-zinc-400">
              <li>Your email address and authentication credentials.</li>
              <li>Your creator identity including username, display name, bio, and avatar.</li>
              <li>The content blocks, links, media embeds, social connections, and custom theme designs you publish.</li>
              <li>Anonymized aggregate visitor analytics (page views, link clicks, device types) without tracking cookies.</li>
            </ul>
            <p>
              If you sign in with Google single sign-on, we securely receive your verified email, name, and avatar to authenticate your account without accessing external account passwords.
            </p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>
              We use your information exclusively to power your Link-in-Bio profile, deliver real-time creator analytics, prevent abuse, and ensure high-availability service delivery. We do not sell personal data or broker creator information to advertisers.
            </p>
          </Section>

          <Section title="3. Public Profile Transparency">
            <p>
              Your public Link-in-Bio page (<span className="font-mono text-white bg-zinc-900 px-1 py-0.5 rounded">{APP_DOMAIN}/username</span>) is designed to be accessible to visitors worldwide. Content you publish on your profile is visible to anyone visiting your link. Private account details (such as login email, passwords, and security tokens) are never displayed publicly.
            </p>
          </Section>

          <Section title="4. Privacy-First Analytics">
            <p>
              Link-in-Bio uses privacy-preserving, cookieless metrics to count page visits and outbound link clicks. We do not track visitors across third-party websites or build behavioral advertising profiles.
            </p>
          </Section>

          <Section title="5. Data Protection and Encryption">
            <p>
              We implement industry-standard encryption at rest and in transit (TLS 1.3 / SSL) along with database Row Level Security (RLS) policies to protect creator content and prevent unauthorized modifications.
            </p>
          </Section>

          <Section title="6. Your Rights & Account Deletion">
            <p>
              You maintain complete ownership of your data. You can export a complete JSON archive of your data or permanently purge your account at any time directly through your dashboard settings.
            </p>
          </Section>

          <Section title="7. Contact Us">
            <p>
              For privacy inquiries, please contact our team at <a href={`mailto:${PRIVACY_EMAIL}`} className="font-bold text-white underline">{PRIVACY_EMAIL}</a>.
            </p>
          </Section>

          <div className="mt-8 border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <span>&copy; {new Date().getFullYear()} Link-in-Bio Inc. All rights reserved.</span>
            <Link href="/terms" className="font-bold text-white hover:underline">
              Terms of Service &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
