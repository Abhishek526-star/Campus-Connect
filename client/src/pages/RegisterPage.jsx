import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Mail,
  MailCheck,
  RotateCcw,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useRegisterMutation, useGoogleLoginMutation, useResendVerificationMutation } from '../services/authApi.js';
import { useGoogleSignIn, GOOGLE_CLIENT_ID } from '../hooks/useGoogleSignIn.js';
import { getErrorMessage } from '../constants/index.js';
import { COURSES, DEPARTMENTS } from '../constants/index.js';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { IconButton } from '../components/ui/IconButton.jsx';
import { cn } from '../utils/cn.js';

/* ---------------------------------------------------------------------------
 * Validation — one Zod schema per role (mirrors server validators)
 * ------------------------------------------------------------------------- */

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const baseSchema = {
  name: z.string().trim().min(2, 'Full name is required').max(80, 'Name is too long'),
  email: z.email('Please provide a valid email address'),
  password: passwordSchema,
};

const studentSchema = z.object({
  ...baseSchema,
  rollNumber: z.string().trim().min(2, 'Roll number is required').max(20),
  department: z.enum(DEPARTMENTS, 'Select a department'),
  course: z.enum(COURSES, 'Select a course'),
  year: z.coerce.number().int().min(1).max(6),
  graduationYear: z.coerce.number().int().min(2025).max(2035),
  phone: z
    .string()
    .regex(/^$|^[+\d][\d\s-]{7,17}$/, 'Enter a valid phone number (e.g. +91 98765 43210)'),
});

const facultySchema = z.object({
  ...baseSchema,
  employeeId: z.string().trim().min(2, 'Employee ID is required').max(20),
  department: z.enum(DEPARTMENTS, 'Select a department'),
  designation: z.string().trim().min(2, 'Designation is required').max(120),
});

const alumniSchema = z.object({
  ...baseSchema,
  graduationYear: z.coerce.number().int().min(1950).max(2026),
  department: z.enum(DEPARTMENTS, 'Select a department'),
  degree: z.string().trim().min(2, 'Degree is required').max(120),
  currentCompany: z.string().trim().max(150).optional().or(z.literal('')),
  designation: z.string().trim().max(150).optional().or(z.literal('')),
});

const SCHEMAS = { student: studentSchema, faculty: facultySchema, alumni: alumniSchema };

/* ---------------------------------------------------------------------------
 * Role selector cards
 * ------------------------------------------------------------------------- */

const ROLE_CARDS = [
  {
    role: 'student',
    icon: GraduationCap,
    title: 'Student',
    description: 'Currently studying at the college',
    tone: 'bg-primary-50 text-primary-600 border-primary-200',
  },
  {
    role: 'faculty',
    icon: BookOpen,
    title: 'Faculty',
    description: 'Teaching staff of the college',
    tone: 'bg-accent-50 text-accent-600 border-accent-200',
  },
  {
    role: 'alumni',
    icon: Award,
    title: 'Alumnus',
    description: 'Graduated from the college',
    tone: 'bg-violet-50 text-violet-600 border-violet-200',
  },
];

function RoleSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="I am a…">
      {ROLE_CARDS.map((card) => {
        const selected = card.role === value;
        return (
          <button
            key={card.role}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(card.role)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center transition-all',
              selected
                ? 'border-primary-500 bg-primary-50/70 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <span className={cn('flex size-9 items-center justify-center rounded-lg', card.tone.split(' ').slice(0, 2).join(' '))}>
              <card.icon className="size-5" aria-hidden="true" />
            </span>
            <span className={cn('text-sm font-semibold', selected ? 'text-primary-700' : 'text-slate-700')}>
              {card.title}
            </span>
            <span className="text-[10px] leading-tight text-slate-400">{card.description}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Success (verify email) screen
 * ------------------------------------------------------------------------- */

function RegistrationSuccess({ email, requiresApproval, onBack }) {
  const [resend, { isLoading: isResending }] = useResendVerificationMutation();

  const handleResend = async () => {
    try {
      await resend({ email }).unwrap();
      toast.success('Verification email sent — check your inbox.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not resend the verification email.'));
    }
  };

  return (
    <div className="text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent-50 ring-1 ring-accent-100">
        <MailCheck className="size-8 text-accent-600" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Check your email</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        We sent a verification link to <span className="font-semibold text-slate-700">{email}</span>.
        Click it to activate your account{requiresApproval ? ' — then an administrator will review and approve it' : ''}.
      </p>

      {requiresApproval && (
        <div className="mx-auto mt-4 flex max-w-sm items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-left">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-amber-800">
            <span className="font-semibold">Faculty & alumni accounts need admin approval.</span>{' '}
            You'll be able to log in as soon as an administrator approves your registration —
            you'll receive a notification.
          </p>
        </div>
      )}

      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button variant="outline" onClick={handleResend} loading={isResending}>
          <RotateCcw className="size-4" aria-hidden="true" /> Resend email
        </Button>
        <Button onClick={onBack}>
          <Mail className="size-4" aria-hidden="true" /> Go to log in
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

const CURRENT_YEAR = new Date().getFullYear();
const STUDENT_GRAD_YEARS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR + i);
const ALUMNI_GRAD_YEARS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => CURRENT_YEAR - i);

export function RegisterPage() {
  useDocumentTitle('Create account');
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(null); // { email, requiresApproval }

  const [register, { isLoading }] = useRegisterMutation();
  const [googleLogin, { isLoading: googleLoading }] = useGoogleLoginMutation();

  const handleGoogleCredential = async (credential) => {
    if (!credential || googleLoading) return;
    try {
      const result = await googleLogin({ credential }).unwrap();
      toast.success(`Welcome to Campus Connect, ${result.data.user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Google sign-up failed. Please try again.'));
    }
  };

  useGoogleSignIn(handleGoogleCredential);

  const {
    register: registerField,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(SCHEMAS[role]),
    defaultValues: { role },
  });

  const switchRole = (nextRole) => {
    setRole(nextRole);
    reset({ role: nextRole });
  };

  const onSubmit = async (values) => {
    try {
      const result = await register({ ...values, role }).unwrap();
      setSuccess({ email: values.email, requiresApproval: result.data.requiresApproval });
    } catch (error) {
      const message = getErrorMessage(error, 'Registration failed. Please try again.');
      toast.error(message);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-linear-to-br from-slate-100 via-white to-primary-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-xl shadow-slate-200/60">
            <CardContent className="px-6 py-10 sm:px-8">
              <RegistrationSuccess
                email={success.email}
                requiresApproval={success.requiresApproval}
                onBack={() => {
                  setSuccess(null);
                  navigate('/login');
                }}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-linear-to-br from-slate-100 via-white to-primary-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Heading */}
        <div className="mb-7 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
            <UserPlus className="size-7 text-white" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Join Campus Connect</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Create your account and become part of the community
          </p>
        </div>

        <Card className="shadow-xl shadow-slate-200/60">
          <CardContent className="px-6 py-6 sm:px-8">
            <p className="mb-2.5 text-sm font-medium text-slate-700">I am a…</p>
            <RoleSelector value={role} onChange={switchRole} />

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
              <Input
                label="Full name"
                placeholder="e.g. Aarav Patel"
                autoComplete="name"
                required
                error={errors.name?.message}
                {...registerField('name')}
              />

              <Input
                label="Email address"
                type="email"
                placeholder="you@campus.edu"
                autoComplete="email"
                required
                error={errors.email?.message}
                {...registerField('email')}
              />

              {/* Student-specific fields */}
              {role === 'student' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Roll number"
                      placeholder="CSE-2026-001"
                      required
                      error={errors.rollNumber?.message}
                      {...registerField('rollNumber')}
                    />
                    <Select
                      label="Department"
                      required
                      placeholder="Select department"
                      options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                      error={errors.department?.message}
                      {...registerField('department')}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Select
                      label="Course"
                      required
                      placeholder="Select"
                      options={COURSES.map((c) => ({ value: c, label: c }))}
                      error={errors.course?.message}
                      {...registerField('course')}
                    />
                    <Select
                      label="Year"
                      required
                      placeholder="Year"
                      options={[1, 2, 3, 4, 5, 6].map((y) => ({ value: y, label: `Year ${y}` }))}
                      error={errors.year?.message}
                      {...registerField('year')}
                    />
                    <Select
                      label="Graduation year"
                      required
                      placeholder="Select"
                      options={STUDENT_GRAD_YEARS.map((y) => ({ value: y, label: String(y) }))}
                      error={errors.graduationYear?.message}
                      {...registerField('graduationYear')}
                    />
                  </div>
                  <Input
                    label="Phone (optional)"
                    type="tel"
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    error={errors.phone?.message}
                    {...registerField('phone')}
                  />
                </>
              )}

              {/* Faculty-specific fields */}
              {role === 'faculty' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Employee ID"
                      placeholder="FAC-1001"
                      required
                      error={errors.employeeId?.message}
                      {...registerField('employeeId')}
                    />
                    <Select
                      label="Department"
                      required
                      placeholder="Select department"
                      options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                      error={errors.department?.message}
                      {...registerField('department')}
                    />
                  </div>
                  <Input
                    label="Designation"
                    placeholder="e.g. Assistant Professor"
                    required
                    error={errors.designation?.message}
                    {...registerField('designation')}
                  />
                </>
              )}

              {/* Alumni-specific fields */}
              {role === 'alumni' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label="Graduation year"
                      required
                      placeholder="Select"
                      options={ALUMNI_GRAD_YEARS.map((y) => ({ value: y, label: String(y) }))}
                      error={errors.graduationYear?.message}
                      {...registerField('graduationYear')}
                    />
                    <Select
                      label="Department"
                      required
                      placeholder="Select department"
                      options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                      error={errors.department?.message}
                      {...registerField('department')}
                    />
                  </div>
                  <Input
                    label="Degree"
                    placeholder="e.g. B.Tech Computer Science"
                    required
                    error={errors.degree?.message}
                    {...registerField('degree')}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Current company (optional)"
                      placeholder="e.g. Google"
                      error={errors.currentCompany?.message}
                      {...registerField('currentCompany')}
                    />
                    <Input
                      label="Designation (optional)"
                      placeholder="e.g. SDE-II"
                      error={errors.designation?.message}
                      {...registerField('designation')}
                    />
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  error={errors.password?.message}
                  hint="Minimum 8 characters"
                  className="pr-11"
                  {...registerField('password')}
                />
                <div className="relative z-10 -mt-9 flex justify-end pr-3">
                  <IconButton
                    label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </IconButton>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                Create account
              </Button>
            </form>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div id="google-signin-button" className="w-full" />
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  Sign up with Google — creates a verified <span className="font-medium">Student</span> account instantly (no email verification needed).
                </p>
              </>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                Log in
              </Link>
            </p>

            <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-600" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-slate-500">
                By creating an account you agree to keep community guidelines. Students are
                verified automatically after email confirmation;{' '}
                <span className="font-medium text-slate-600">faculty and alumni registrations require admin approval</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
