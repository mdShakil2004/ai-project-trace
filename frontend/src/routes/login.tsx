import { FormEvent, useState } from 'react';
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';

import { Github, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

export const Route = createFileRoute('/login')({ component: LoginPage });

type Mode = 'signin' | 'signup';

function LoginPage() {
    const navigate = useNavigate();

  const search = useSearch({ from: '/login' }) as { mode?: string };


  const [mode, setMode] = useState<Mode>(search.mode === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

 const submit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setError(null);

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    setError('Enter a valid email address.');
    return;
  }

  if (password.length < 8) {
    setError('Password must be at least 8 characters.');
    return;
  }

  if (isSignup && password !== confirmPassword) {
    setError('Passwords do not match.');
    return;
  }

  setLoading(true);

  try {
    if (isSignup) {
      await api.signupWithEmail(normalizedEmail, password);
    } else {
      await api.loginWithEmail(normalizedEmail, password);
    }

    // Verify the HttpOnly session cookie before leaving auth.
    await api.getCurrentUser();

    // Navigate through TanStack Router instead of forcing
    // a full browser/SSR reload.
    await navigate({
      to: '/',
      replace: true,
    });
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Authentication failed.',
    );
    setLoading(false);
  }
};

  const signInWithGitHub = () => {
    setError(null);
    setGithubLoading(true);
    try {
      api.loginWithGitHub();
    } catch {
      setGithubLoading(false);
      setError('Unable to start GitHub sign-in.');
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold">T</div>
          <div>
            <div className="font-semibold text-foreground">Trace</div>
            <div className="text-xs text-muted-foreground">AI Change Intelligence</div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {isSignup ? 'Create your Trace account' : 'Sign in to Trace'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isSignup
            ? 'Create an account with your email and password, or continue with GitHub.'
            : 'Sign in with your email and password, or continue with GitHub.'}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${!isSignup ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${isSignup ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSignup && (
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-foreground">Confirm password</label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                />
                <button type="button" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} onClick={() => setShowConfirmPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <button disabled={loading || githubLoading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? 'Create account' : 'Sign in')}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button disabled={loading || githubLoading} onClick={signInWithGitHub} className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60">
          {githubLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          {githubLoading ? 'Redirecting…' : 'Continue with GitHub'}
        </button>

        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your Trace session is stored in an HttpOnly cookie. Passwords are never sent to GitHub.</span>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {isSignup ? 'Already have an account? ' : 'Need an account? '}
          <Link to="/login" search={isSignup ? { mode: 'signin' } : { mode: 'signup' }} className="font-medium text-foreground underline underline-offset-4">
            {isSignup ? 'Sign in' : 'Create one'}
          </Link>
        </p>
      </div>
    </main>
  );
}
