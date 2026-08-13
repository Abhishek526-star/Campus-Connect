import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, MailCheck, ShieldX, XCircle } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useVerifyEmailMutation, useResendVerificationMutation } from '../services/authApi.js';
import { getErrorMessage } from '../constants/index.js';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';

const STATE = {
  verifying: { icon: Loader2, tone: 'text-primary-600', spin: true, title: 'Verifying your email…', body: 'Please wait a moment while we activate your account.' },
  success: { icon: CheckCircle2, tone: 'text-accent-600', title: 'Email verified!', body: '' },
  needsApproval: { icon: MailCheck, tone: 'text-amber-600', title: 'Email verified — pending approval', body: '' },
  invalid: { icon: XCircle, tone: 'text-red-500', title: 'Verification link invalid', body: 'This link is invalid or has expired.' },
  error: { icon: ShieldX, tone: 'text-red-500', title: 'Something went wrong', body: '' },
};

/**
 * Verify Email — the token arrives via ?token= from the verification email.
 * Runs the verification once on mount (spec §42 flow: register → verify → login).
 */
export function VerifyEmailPage() {
  useDocumentTitle('Verify email');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const ran = useRef(false);

  const [status, setStatus] = useState(() => (token ? 'verifying' : 'invalid'));
  const [resendEmail, setResendEmail] = useState('');
  const [verifyEmail] = useVerifyEmailMutation();
  const [resend, { isLoading: isResending }] = useResendVerificationMutation();

  useEffect(() => {
    if (ran.current || !token) return;
    ran.current = true;

    verifyEmail({ token })
      .unwrap()
      .then((result) => {
        setStatus(result.data?.requiresApproval ? 'needsApproval' : 'success');
      })
      .catch((error) => {
        const code = error?.data?.error?.code;
        setStatus(code === 'INVALID_VERIFICATION_TOKEN' ? 'invalid' : 'error');
      });
  }, [token, verifyEmail, status]);

  const state = STATE[status];
  const Icon = state.icon;

  const handleResend = async (event) => {
    event?.preventDefault?.();
    if (!resendEmail.trim()) return;
    try {
      await resend({ email: resendEmail.trim() }).unwrap();
      toast.success('Verification email sent — check your inbox.');
      setResendEmail('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not resend the verification email.'));
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-100 via-white to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="shadow-xl shadow-slate-200/60">
          <CardContent className="px-6 py-12 text-center sm:px-8">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
              <Icon className={`size-8 ${state.tone} ${state.spin ? 'animate-spin' : ''}`} aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{state.title}</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{state.body}</p>

            {status === 'success' && (
              <>
                <p className="mt-3 text-sm text-slate-600">
                  Welcome to Campus Connect! Your account is active.
                </p>
                <Button className="mt-7" onClick={() => navigate('/login')}>
                  Go to log in
                </Button>
              </>
            )}

            {status === 'needsApproval' && (
              <>
                <div className="mx-auto mt-4 max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-left">
                  <p className="text-xs leading-relaxed text-amber-800">
                    An administrator needs to approve your account before you can log in.
                    You'll be notified — this usually takes less than a day.
                  </p>
                </div>
                <Button className="mt-7" onClick={() => navigate('/login')}>
                  Back to log in
                </Button>
              </>
            )}

            {status === 'invalid' && (
              <>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                  If this keeps happening, enter your email to receive a fresh verification link.
                </p>
                <form onSubmit={handleResend} className="mx-auto mt-5 flex max-w-sm gap-2">
                  <Input
                    type="email"
                    placeholder="you@campus.edu"
                    aria-label="Email address"
                    value={resendEmail}
                    onChange={(event) => setResendEmail(event.target.value)}
                  />
                  <Button type="submit" variant="outline" loading={isResending}>
                    Resend
                  </Button>
                </form>
                <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate('/login')}>
                  Back to log in
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <p className="mt-3 text-sm text-slate-600">
                  {getErrorMessage(null, 'Please try again.')}
                </p>
                <Button className="mt-7" onClick={() => navigate('/login')}>
                  Go to log in
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
