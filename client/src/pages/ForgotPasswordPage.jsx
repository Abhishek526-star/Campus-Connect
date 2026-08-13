import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, MailCheck, KeyRound } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useForgotPasswordMutation } from '../services/authApi.js';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';

const forgotSchema = z.object({
  email: z.email('Please provide a valid email address'),
});

/** Forgot password — sends a reset link (spec §31). */
export function ForgotPasswordPage() {
  useDocumentTitle('Forgot password');
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = async () => {
    try {
      // Generic response — never reveals whether the email is registered (no enumeration).
      await forgotPassword({ email: getValues('email') }).unwrap();
    } catch {
      // The API always returns success; ignore network-level hiccups here.
    }
    setSent(true);
  };

  if (sent) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-100 via-white to-primary-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-xl shadow-slate-200/60">
            <CardContent className="px-6 py-10 text-center sm:px-8">
              <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent-50 ring-1 ring-accent-100">
                <MailCheck className="size-8 text-accent-600" aria-hidden="true" />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Check your email</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                If an account exists for <span className="font-semibold text-slate-700">{getValues('email')}</span>,
                you'll receive a password reset link shortly. The link expires in 30 minutes.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button onClick={() => setSent(false)}>
                  <Mail className="size-4" aria-hidden="true" /> Try another email
                </Button>
                <Button variant="outline" to="/login">
                  Back to log in
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-100 via-white to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
            <KeyRound className="size-7 text-white" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Forgot your password?</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <Card className="shadow-xl shadow-slate-200/60">
          <CardContent className="px-6 py-6 sm:px-8">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@campus.edu"
                required
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                Send reset link
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Remembered it?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                Back to log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
