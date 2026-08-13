import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  Compass,
  Globe,
  GraduationCap,
  HandHeart,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetPublicStatsQuery } from '../services/publicApi.js';
import { Button } from '../components/ui/Button.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { formatNumber } from '../utils/format.js';

/* ---------------------------------------------------------------------------
 * Hero
 * ------------------------------------------------------------------------- */

function HeroStats() {
  const { data, isLoading } = useGetPublicStatsQuery();

  const stats = data?.data;
  const items = [
    { label: 'Students', value: stats?.students },
    { label: 'Alumni', value: stats?.alumni },
    { label: 'Faculty', value: stats?.faculty },
    { label: 'Scholarships Funded', value: stats?.scholarshipsFunded },
    { label: 'Students Supported', value: stats?.studentsSupported },
    { label: 'Opportunities Posted', value: stats?.opportunitiesPosted },
  ];

  return (
    <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-primary-200/80">{item.label}</dt>
          <dd className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {isLoading ? (
              <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/15" aria-hidden="true" />
            ) : (
              formatNumber(item.value ?? 0)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** CSS-drawn app preview — a stylized dashboard snapshot. */
function HeroPreview() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* Glow accents */}
      <div className="absolute -left-10 -top-10 size-40 rounded-full bg-accent-400/30 blur-3xl" />
      <div className="absolute -bottom-12 -right-8 size-48 rounded-full bg-primary-400/30 blur-3xl" />

      <div className="relative rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-white/20">
        {/* Preview top bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-600">
              <GraduationCap className="size-4 text-white" />
            </span>
            <span className="text-sm font-bold text-slate-900">
              Campus<span className="text-primary-600">Connect</span>
            </span>
          </div>
          <div className="flex -space-x-2">
            {['R', 'S', 'A', 'K'].map((initial) => (
              <span
                key={initial}
                className="flex size-7 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700 ring-2 ring-white"
              >
                {initial}
              </span>
            ))}
          </div>
        </div>

        {/* Event card */}
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">Upcoming event</span>
            <Badge tone="accent" size="sm">● Live</Badge>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">Alumni Meet 2026 — Bengaluru</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" /> Aug 24</span>
            <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> 214 registered</span>
          </div>
        </div>

        {/* Scholarship funding card */}
        <div className="mt-3 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Merit Scholarship Fund</span>
            <span className="font-bold text-accent-600">65% funded</span>
          </div>
          <ProgressBar value={65} tone="accent" className="mt-2.5" />
          <p className="mt-2 text-xs text-slate-400">₹3,25,000 raised of ₹5,00,000 · 42 donors</p>
        </div>

        {/* Connection request */}
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
          <Avatar name="Ananya Iyer" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">Ananya Iyer</p>
            <p className="truncate text-xs text-slate-500">SDE-II at Amazon · Batch 2020</p>
          </div>
          <span className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white">Accept</span>
        </div>
      </div>

      {/* Floating chat bubble */}
      <div className="absolute -right-3 -top-6 hidden rounded-2xl rounded-br-sm bg-white px-4 py-3 shadow-xl ring-1 ring-slate-100 sm:block">
        <p className="text-xs font-semibold text-slate-900">💬 “Thanks for the referral!”</p>
        <p className="mt-0.5 text-[10px] text-slate-400">Just now · Direct message</p>
      </div>

      {/* Floating QR check-in chip */}
      <div className="absolute -bottom-6 -left-4 hidden items-center gap-2 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-xl ring-1 ring-slate-100 sm:flex">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent-50">
          <ShieldCheck className="size-4 text-accent-600" />
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-900">Check-in verified</p>
          <p className="text-[10px] text-slate-400">QR attendance · 09:42 AM</p>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      {/* Decorative dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" aria-hidden="true" />

      <div className="container-app relative grid items-center gap-14 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-primary-100 ring-1 ring-white/20">
            <Sparkles className="size-3.5 text-accent-300" aria-hidden="true" />
            Your college community, all in one place
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.1]">
            Connect. Learn. Give Back.{' '}
            <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
              Grow Together.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-100/90 sm:text-lg">
            A unified digital community connecting students, faculty, and alumni for learning,
            mentorship, careers, scholarships, and lifelong collaboration.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button to="/register" size="lg">
              Join Community <ArrowRight className="size-4.5" aria-hidden="true" />
            </Button>
            <Button
              href="#opportunities"
              size="lg"
              className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              Explore Opportunities
            </Button>
          </div>

          <HeroStats />
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Roles strip
 * ------------------------------------------------------------------------- */

const ROLES = [
  { icon: GraduationCap, name: 'Students', description: 'Learn, network, apply, and grow.' },
  { icon: BookOpen, name: 'Faculty', description: 'Teach, mentor, and manage events.' },
  { icon: Award, name: 'Alumni', description: 'Give back, fund, and refer.' },
  { icon: ShieldCheck, name: 'Administrators', description: 'Moderate and run the ecosystem.' },
];

function RolesStrip() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="container-app grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
        {ROLES.map((role) => (
          <div key={role.name} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
              <role.icon className="size-5 text-primary-600" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{role.name}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{role.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Features (spec §49 — 9 sections)
 * ------------------------------------------------------------------------- */

const FEATURES = [
  {
    id: 'networking',
    icon: Users,
    title: 'Student–Alumni Networking',
    description:
      'Search students, alumni, and faculty by department, batch, company, and skills. Send connection requests and grow your professional circle.',
    gradient: 'from-primary-500 to-primary-600',
  },
  {
    id: 'scholarships',
    icon: GraduationCap,
    title: 'Scholarships',
    description:
      'Alumni and faculty fund scholarships for economically weaker students. Apply with documents and track every stage of your application.',
    gradient: 'from-accent-500 to-accent-600',
  },
  {
    id: 'mentorship',
    icon: Compass,
    title: 'Mentorship',
    description:
      'Alumni mentor students across DSA, web development, AI/ML, cloud, DevOps, careers, interview preparation, and higher studies.',
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    id: 'opportunities',
    icon: Briefcase,
    title: 'Jobs & Internships',
    description:
      'A dedicated board for jobs, internships, freelance work, hackathons, competitions, and training — posted by alumni, faculty, and companies.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'resources',
    icon: BookOpen,
    title: 'Study Resources',
    description:
      'GATE, semester notes, previous year papers, placement prep, and development resources — search, bookmark, rate, and download.',
    gradient: 'from-sky-500 to-cyan-500',
  },
  {
    id: 'events',
    icon: CalendarDays,
    title: 'Events',
    description:
      'Alumni meets, workshops, hackathons, webinars, and more. Register in one click and check in with QR-based attendance.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    id: 'community',
    icon: MessageCircle,
    title: 'Community',
    description:
      'Share knowledge, achievements, career advice, and announcements. Like, comment, and save what matters to you.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'careers',
    icon: Rocket,
    title: 'Career Opportunities',
    description:
      'Referrals from alumni, career roadmaps, placement preparation, and interview experiences — guidance from people who have been there.',
    gradient: 'from-indigo-500 to-primary-600',
  },
  {
    id: 'alumni',
    icon: HandHeart,
    title: 'Alumni Contributions',
    description:
      'Give back through donations, scholarships, mentorship, and referrals — with transparent funding dashboards that show real impact.',
    gradient: 'from-fuchsia-500 to-purple-500',
  },
];

function Features() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600">The ecosystem</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything your campus community needs
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-500">
            Nine connected pillars that keep students, faculty, and alumni working together —
            from first year to lifelong.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.id}
              id={feature.id}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200"
            >
              <span
                className={`inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-md`}
              >
                <feature.icon className="size-6 text-white" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * How it works
 * ------------------------------------------------------------------------- */

const STEPS = [
  {
    number: '01',
    title: 'Create your profile',
    description:
      'Join as a student, faculty member, or alumnus. Verify your email, complete your profile, and start exploring.',
  },
  {
    number: '02',
    title: 'Connect & collaborate',
    description:
      'Send connection requests, chat in real time, join events and meetings, and participate in community discussions.',
  },
  {
    number: '03',
    title: 'Learn & give back',
    description:
      'Access resources and opportunities — or mentor, fund scholarships, and refer students as an alumnus.',
  },
];

function HowItWorks() {
  return (
    <section className="bg-white py-20">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600">How it works</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            From campus to career — together
          </h2>
        </div>

        <div className="relative mt-14 grid gap-10 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-primary-200 via-accent-200 to-primary-200 md:block" aria-hidden="true" />
          {STEPS.map((step) => (
            <div key={step.number} className="relative text-center md:px-4">
              <span className="relative z-10 inline-flex size-14 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white shadow-lg shadow-primary-600/30">
                {step.number}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * CTA band
 * ------------------------------------------------------------------------- */

function CtaBand() {
  return (
    <section className="bg-slate-50 pb-20">
      <div className="container-app">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary-700 to-accent-800 px-6 py-16 text-center shadow-xl sm:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <Globe className="mx-auto size-10 text-accent-300" aria-hidden="true" />
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to reconnect with your campus community?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-primary-100/90">
              Join students, faculty, and alumni building a thriving ecosystem of learning,
              mentorship, and giving back.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button to="/register" size="lg" className="bg-white text-primary-700 shadow-md hover:bg-primary-50">
                Join Community <ArrowRight className="size-4.5" aria-hidden="true" />
              </Button>
              <Button
                href="#opportunities"
                size="lg"
                className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Explore Opportunities
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export function LandingPage() {
  useDocumentTitle('');

  return (
    <>
      <Hero />
      <RolesStrip />
      <Features />
      <HowItWorks />
      <CtaBand />
    </>
  );
}
