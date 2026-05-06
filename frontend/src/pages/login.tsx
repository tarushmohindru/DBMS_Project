import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { analyticsService } from '@/services';

interface PublicSummary {
  credits_issued: number;
  companies:      number;
  transactions:   number;
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [summary,  setSummary]  = useState<PublicSummary | null>(null);

  useEffect(() => {
    analyticsService.publicSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  // Redirect if already logged in
  if (user) { router.replace('/dashboard'); return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Sign In — Carbon Credit Marketplace</title></Head>
      <div className="min-h-screen flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-eco-900 to-eco-800 flex-col justify-between p-12">
          <div className="flex items-center gap-3 text-white">
            <span className="text-4xl">🌱</span>
            <div>
              <div className="text-xl font-bold">Carbon Credit</div>
              <div className="text-sm text-eco-300">Marketplace</div>
            </div>
          </div>
          <div className="text-white">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Trade Clean Energy Credits.<br />Build a Sustainable Future.
            </h1>
            <p className="text-eco-200 text-lg">
              A transparent, ACID-compliant platform for renewable energy companies
              to issue, list, and trade verified carbon credits.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { label: 'Credits Issued', value: summary ? summary.credits_issued.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—' },
                { label: 'Companies',      value: summary ? summary.companies.toLocaleString('en-IN') : '—' },
                { label: 'Transactions',   value: summary ? summary.transactions.toLocaleString('en-IN') : '—' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-eco-300 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-eco-400 text-xs">
            DBMS Course Project — Even Sem 2025-26 | Batch 2Q24
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Enter your credentials to access the platform
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  className="input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
