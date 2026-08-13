import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useLoginMutation, useGoogleLoginMutation, useResendVerificationMutation } from '../services/authApi.js';
import { useGoogleSignIn, GOOGLE_CLIENT_ID } from '../hooks/useGoogleSignIn.js';
import { getErrorMessage } from '../constants/index.js';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { IconButton } from '../components/ui/IconButton.jsx';
import { Badge } from '../components/ui/Badge.jsx';

const loginSchema = z.object({
  email: z.email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
});

/**
 * Login page — real authentication with the JWT + rotating-refresh flow.
 * Handles every account-state error the API can return:
 * invalid credentials, unverified email (with resend), pending approval,
 * and deactivated accounts.
 */
export function LoginPage() {
  useDocumentTitle('Log in');
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: googleLoading }] = useGoogleLoginMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();

  const handleGoogleCredential = async (credential) => {
    if (!credential || googleLoading) return;
    if (credential.__popupBlocked) {
      toast.error('Popup blocked — allow popups for this site to sign in with Google.');
      return;
    }
    try {
      const result = await googleLogin({ credential }).unwrap();
      toast.success(`Welcome back, ${result.data.user.name}!`);
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Google sign-in failed. Please try again.'));
    }
  };

  useGoogleSignIn(handleGoogleCredential);

  // Anti browser-autofill: the password input starts readOnly so browsers /
  // password managers never fill it on page load; the first click unlocks it.
  const [passwordLocked, setPasswordLocked] = useState(true);

  // Once unlocked, place the cursor in the field — this makes the very first
  // click work (the browser skipped caret placement while the field was
  // still readonly at mousedown time).
  useEffect(() => {
    if (passwordLocked) return;
    const el = document.getElementById('login-password');
    if (el) {
      el.focus();
      const length = el.value?.length ?? 0;
      try {
        el.setSelectionRange(length, length);
      } catch {
        // non-input elements / old browsers — focus alone is enough
      }
    }
  }, [passwordLocked]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    try {
      const result = await login(values).unwrap();
      toast.success(`Welcome back, ${result.data.user.name}!`);
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (error) {
      const code = error?.data?.error?.code;
      const message = getErrorMessage(error, 'Login failed. Please try again.');
      toast.error(message);

      // Account state errors carry a recoverable next step.
      if (code === 'EMAIL_NOT_VERIFIED') {
        setPendingEmail(values.email);
      } else {
        setPendingEmail('');
      }
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    try {
      await resendVerification({ email: pendingEmail }).unwrap();
      toast.success('Verification email sent — check your inbox.');
      setPendingEmail('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not resend the verification email.'));
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-100 via-white to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Heading */}
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
            <LogIn className="size-7 text-white" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Log in to your Campus Connect account
          </p>
        </div>

        <Card className="shadow-xl shadow-slate-200/60">
          <CardContent className="px-6 py-6 sm:px-8">
            {pendingEmail && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm" role="alert">
                <p className="font-medium text-amber-800">Email not verified yet</p>
                <p className="mt-1 text-amber-700">
                  Check your inbox for the verification link, or resend it:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100"
                  loading={isResending}
                  onClick={handleResend}
                >
                  Resend verification email
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@campus.edu"
                required
                leftIcon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />

              <div>
                <Input
                  label="Password"
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  required
                  leftIcon={Lock}
                  error={errors.password?.message}
                  className="pr-11"
                  readOnly={passwordLocked}
                  // First click: unlock AND prevent the browser from swallowing
                  // caret placement on the still-readonly field. The effect
                  // below focuses + positions the cursor once unlocked.
                  onMouseDown={(event) => {
                    if (passwordLocked) {
                      event.preventDefault();
                      setPasswordLocked(false);
                    }
                  }}
                  onFocus={() => passwordLocked && setPasswordLocked(false)}
                  {...register('password')}
                />
                {/* pointer-events-none: this full-width wrapper must never
                    block clicks into the field — only the eye button itself
                    stays clickable. */}
                <div className="pointer-events-none relative z-10 -mt-9 flex justify-end pr-3">
                  <IconButton
                    label={showPassword ? 'Hide password' : 'Show password'}
                    className="pointer-events-auto"
                    onClick={() => {
                      setPasswordLocked(false);
                      setShowPassword((value) => !value);
                    }}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </IconButton>
                </div>
                <div className="mt-2 flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                Log in
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
                  New Gmail users get a verified student account instantly.
                </p>
              </>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
              New to Campus Connect?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <Badge tone="slate" size="sm">Secure</Badge>
          Passwords are hashed · Session protected with rotating tokens
        </p>
      </div>
    </main>
  );
}
