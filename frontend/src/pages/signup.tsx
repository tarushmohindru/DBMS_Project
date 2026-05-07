import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { authService, companyService, complianceService } from '@/services';
import { RegulatoryAuthority, UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  company_admin:        'Company Admin',
  regulatory_authority: 'Regulatory Authority',
  marketplace_admin:    'Marketplace Admin',
};

export default function SignupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [authorities, setAuthorities] = useState<RegulatoryAuthority[]>([]);
  const [form, setForm] = useState({
    role: 'company_admin' as UserRole,
    companyName: '',
    industry: '',
    registrationNo: '',
    authorityId: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    complianceService.authorities()
      .then(setAuthorities)
      .catch(() => setAuthorities([]));
  }, []);

  function updateRole(role: UserRole) {
    setForm(f => ({
      ...f,
      role,
      companyName: role === 'company_admin' ? f.companyName : '',
      industry: role === 'company_admin' ? f.industry : '',
      registrationNo: role === 'company_admin' ? f.registrationNo : '',
      authorityId: role === 'regulatory_authority' ? f.authorityId : '',
    }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (form.role === 'company_admin') {
        await companyService.register({
          company: {
            name: form.companyName.trim(),
            industry: form.industry.trim() || undefined,
            registration_no: form.registrationNo.trim(),
          },
          user: {
            username: form.username.trim(),
            password: form.password,
          },
        });
      } else {
        await authService.signup({
          username: form.username.trim(),
          password: form.password,
          role: form.role,
          ...(form.role === 'regulatory_authority' ? { authority_id: parseInt(form.authorityId, 10) } : {}),
        });
      }
      router.push('/login?registered=1');
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  if (user) return null;

  return (
    <>
      <Head><title>Sign Up — Carbon Credit Marketplace</title></Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_28rem] bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="hidden lg:flex bg-gray-900 text-white p-10 flex-col justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🌱</span>
              <div>
                <div className="text-xl font-bold">Carbon Credit</div>
                <div className="text-sm text-eco-300">Marketplace</div>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold leading-tight">Register your platform account</h1>
              <p className="mt-4 text-eco-100 text-sm leading-6">
                Create an account for companies, regulatory reviewers, or marketplace operations.
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Company signup creates a new company profile. Authority users are linked to an existing authority.
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Choose your category and enter account details
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={e => updateRole(e.target.value as UserRole)}
                >
                  {(Object.keys(roleLabels) as UserRole[]).map(role => (
                    <option key={role} value={role}>{roleLabels[role]}</option>
                  ))}
                </select>
              </div>

              {form.role === 'company_admin' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      className="input"
                      required
                      value={form.companyName}
                      onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                      autoComplete="organization"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      className="input"
                      value={form.industry}
                      onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                      placeholder="Solar Energy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration No.</label>
                    <input
                      className="input"
                      required
                      value={form.registrationNo}
                      onChange={e => setForm(f => ({ ...f, registrationNo: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {form.role === 'regulatory_authority' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regulatory Authority</label>
                  <select
                    className="input"
                    required
                    value={form.authorityId}
                    onChange={e => setForm(f => ({ ...f, authorityId: e.target.value }))}
                  >
                    <option value="">Select authority</option>
                    {authorities.map(authority => (
                      <option key={authority.authority_id} value={authority.authority_id}>
                        {authority.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    className="input"
                    required
                    minLength={3}
                    maxLength={100}
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    className="input"
                    type="password"
                    required
                    minLength={8}
                    maxLength={255}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-eco-700 hover:text-eco-800">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
