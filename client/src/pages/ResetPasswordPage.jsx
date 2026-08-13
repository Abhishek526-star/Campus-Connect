import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useResetPasswordMutation } from '../services/authApi.js';
import { getErrorMessage } from '../constants/index.js';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { IconButton } from '../components/ui/IconButton.jsx';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/** Reset password — token comes from the email link (?token=…). */
export function ResetPasswordPage() {
  useDocumentTitle('Reset password');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetSchema), defaultValues: { password: '', confirmPassword: '' } });

  // No token in the URL — the link is malformed.
  useEffect(() => {
    if (!token) {
      toast.error('This reset link is invalid. Please request a new one.');
    }
  }, [token]);

  const onSubmit = async (values) => {
    try {
      await resetPassword({ token, password: values.password }).unwrap();
      toast.success('Password reset successfully. You can now log in.');
      setDone(true);
    } catch (error) {
      const code = error?.data?.error?.code;
      toast.error(getErrorMessage(error, code === 'INVALID_RESET_TOKEN' ? 'This link is invalid or expired. Please request a new one.' : 'Password reset failed.'));
    }
  };

  if (done) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-100 via-white to-primary-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-xl shadow-slate-200/60">
            <CardContent className="px-6 py-10 text-center sm:px-8">
              <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent-50 ring-1 ring-accent-100">
                <CheckCircle2 className="size-8 text-accent-600" aria-hidden="true" />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Password updated</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                Your password has been changed and all existing sessions were signed out.
                Log in with your new password.
              </p>
              <Button className="mt-7" onClick={() => navigate('/login')}>
                Go to log in
              </Button>
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Choose a new password</h1>
          <p className="mt-1.5 text-sm text-slate-500">Must be at least 8 characters</p>
        </div>

        <Card className="shadow-xl shadow-slate-200/60">
          <CardContent className="px-6 py-6 sm:px-8">
            {!token && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm" role="alert">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
                <div>
                  <p className="font-medium text-red-800">Missing or invalid token</p>
                  <p className="mt-0.5 text-xs text-red-700">
                    Use the link from your password reset email, or request a new one.
                  </p>
                  <Link to="/forgot-password" className="mt-1.5 inline-block text-xs font-semibold text-red-700 underline">
                    Request a new link
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <Input
                  label="New password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  error={errors.password?.message}
                  className="pr-11"
                  {...register('password')}
                />
                <div className="relative z-10 -mt-9 flex justify-end pr-3">
                  <IconButton label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </IconButton>
                </div>
              </div>

              <div>
                <Input
                  label="Confirm new password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  error={errors.confirmPassword?.message}
                  className="pr-11"
                  {...register('confirmPassword')}
                />
                <div className="relative z-10 -mt-9 flex justify-end pr-3">
                  <IconButton label={showConfirm ? 'Hide password' : 'Show password'} onClick={() => setShowConfirm((v) => !v)}>
                    {showConfirm ? <EyeOff /> : <Eye />}
                  </IconButton>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={isLoading} disabled={!token}>
                Reset password
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
