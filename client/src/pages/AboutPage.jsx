import {
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  GraduationCap,
  HandHeart,
  MessageCircle,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Button } from '../components/ui/Button.jsx';

const PILLARS = [
  { icon: Users, title: 'Networking', description: 'Connections between students, alumni, and faculty across departments and batches.' },
  { icon: GraduationCap, title: 'Mentorship', description: 'Alumni guide the next generation through one-on-one and group mentorship.' },
  { icon: HandHeart, title: 'Scholarships', description: 'Funded by alumni and faculty for economically weaker students, with full transparency.' },
  { icon: CalendarDays, title: 'Events & Attendance', description: 'Alumni meets, workshops, and webinars with QR-based attendance tracking.' },
  { icon: Briefcase, title: 'Jobs & Internships', description: 'A curated opportunity board with referrals from working alumni.' },
  { icon: BookOpen, title: 'Study Resources', description: 'GATE, semester, and placement preparation material for every student.' },
  { icon: MessageCircle, title: 'Community', description: 'Discussions, achievements, career advice, and announcements in one feed.' },
  { icon: ShieldCheck, title: 'Trust & Safety', description: 'Verified roles, admin moderation, privacy controls, and audit trails.' },
];

const VALUES = [
  {
    title: 'Connect',
    description: 'Meaningful relationships between students, faculty, and alumni across generations.',
  },
  {
    title: 'Learn',
    description: 'Resources, mentorship, and real-world guidance that accelerate growth.',
  },
  {
    title: 'Give Back',
    description: 'Alumni contribute time, knowledge, referrals, and funding to support students.',
  },
  {
    title: 'Grow Together',
    description: 'The campus community rises together — from first year to lifelong careers.',
  },
];

export function AboutPage() {
  useDocumentTitle('About');

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 py-20">
        <div className="container-app">
          <span className="text-xs font-bold uppercase tracking-widest text-accent-300">About Campus Connect</span>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            A college ecosystem, not just an alumni directory
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-primary-100/90">
            Campus Connect is a centralized digital community for our college — where students,
            faculty, and alumni communicate, organize events, share knowledge, fund scholarships,
            post opportunities, and maintain a lifelong network.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-white py-20">
        <div className="container-app grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600">Our mission</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Students ↔ Alumni ↔ Faculty, working as one community
            </h2>
            <p className="mt-4 leading-relaxed text-slate-500">
              Alumni hold the experience students need; students bring the energy and promise
              alumni want to invest in. Campus Connect builds the bridge — through networking,
              mentorship, scholarships, events, jobs, resources, and communication.
            </p>
            <p className="mt-4 leading-relaxed text-slate-500">
              We believe every student deserves guidance, every alumni contribution should be
              transparent, and every member of the campus family should have a place to grow.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {VALUES.map((value) => (
              <div key={value.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-bold text-primary-700">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-slate-50 py-20">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600">What we do</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Eight pillars of the campus ecosystem
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-50">
                  <pillar.icon className="size-5 text-primary-600" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-white py-20">
        <div className="container-app grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="space-y-4">
              {[
                { icon: GraduationCap, role: 'Students', text: 'Build profiles, connect with alumni, attend events, apply for scholarships, access resources, and find jobs.' },
                { icon: BookOpen, role: 'Faculty', text: 'Create events, manage attendance, upload study materials, publish announcements, and mentor students.' },
                { icon: Award, role: 'Alumni', text: 'Mentor students, post opportunities, fund scholarships, make referrals, and stay connected to campus.' },
                { icon: ShieldCheck, role: 'Administrators', text: 'Approve registrations, manage users, moderate content, monitor finances, and export reports.' },
              ].map((item) => (
                <div key={item.role} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-50">
                    <item.icon className="size-5 text-accent-600" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.role}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600">Who it's for</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              One platform, four roles, endless collaboration
            </h2>
            <p className="mt-4 leading-relaxed text-slate-500">
              Every role has clear permissions — enforced on both the frontend and the backend.
              Students focus on learning; faculty on teaching; alumni on giving back; and
              administrators keep the ecosystem safe, fair, and healthy.
            </p>
            <Button to="/register" className="mt-8">
              Join the community
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
