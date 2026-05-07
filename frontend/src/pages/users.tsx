import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import Badge from '@/components/Badge';
import useAuth from '@/hooks/useAuth';
import { authService, companyService, complianceService } from '@/services';
import { Company, RegisteredUser, RegulatoryAuthority, UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  company_admin:        'Company Admin',
  regulatory_authority: 'Regulatory Authority',
  marketplace_admin:    'Marketplace Admin',
};

const roleVariants: Record<UserRole, 'success' | 'info' | 'neutral'> = {
  company_admin:        'success',
  regulatory_authority: 'info',
  marketplace_admin:    'neutral',
};

interface UserFormState {
  username:     string;
  password:     string;
  role:         UserRole;
  company_id:   string;
  authority_id: string;
}

const initialForm: UserFormState = {
  username: '',
  password: '',
  role: 'company_admin',
  company_id: '',
  authority_id: '',
};

export default function UsersPage() {
  useAuth(['marketplace_admin']);
  const [users,       setUsers]       = useState<RegisteredUser[]>([]);
  const [companies,   setCompanies]   = useState<Company[]>([]);
  const [authorities, setAuthorities] = useState<RegulatoryAuthority[]>([]);
  const [form,        setForm]        = useState<UserFormState>(initialForm);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  function fetchUsers() {
    setLoading(true);
    authService.users()
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchUsers();
    Promise.all([
      companyService.list(),
      complianceService.authorities(),
    ]).then(([companyRows, authorityRows]) => {
      setCompanies(companyRows);
      setAuthorities(authorityRows);
    });
  }, []);

  const roleCounts = useMemo(() => ({
    company_admin:        users.filter(u => u.role === 'company_admin').length,
    regulatory_authority: users.filter(u => u.role === 'regulatory_authority').length,
    marketplace_admin:    users.filter(u => u.role === 'marketplace_admin').length,
  }), [users]);

  function updateRole(role: UserRole) {
    setForm(f => ({
      ...f,
      role,
      company_id: role === 'company_admin' ? f.company_id : '',
      authority_id: role === 'regulatory_authority' ? f.authority_id : '',
    }));
    setError('');
    setSuccess('');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      username: form.username.trim(),
      password: form.password,
      role: form.role,
      ...(form.role === 'company_admin' ? { company_id: parseInt(form.company_id, 10) } : {}),
      ...(form.role === 'regulatory_authority' ? { authority_id: parseInt(form.authority_id, 10) } : {}),
    };

    try {
      const created = await authService.register(payload);
      setSuccess(`${created.username} was created as ${roleLabels[created.role as UserRole]}.`);
      setForm(initialForm);
      fetchUsers();
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<RegisteredUser>[] = [
    { key: 'user_id', header: 'ID', render: r => `#${r.user_id}` },
    { key: 'username', header: 'Username' },
    {
      key: 'role',
      header: 'Category',
      render: r => <Badge status={roleLabels[r.role]} variant={roleVariants[r.role]} />,
    },
    {
      key: 'linked_to',
      header: 'Linked Record',
      render: r => {
        if (r.role === 'company_admin') return r.company_name ?? `Company #${r.company_id}`;
        if (r.role === 'regulatory_authority') return r.authority_name ?? `Authority #${r.authority_id}`;
        return 'Platform-wide access';
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: r => new Date(r.created_at).toLocaleDateString('en-IN'),
    },
  ];

  return (
    <Layout title="Users">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Create and review platform accounts by category</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[22rem_1fr] gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Create User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
              {success && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-xl">{success}</div>}

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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <select
                    className="input"
                    required
                    value={form.company_id}
                    onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
                  >
                    <option value="">Select company</option>
                    {companies.map(company => (
                      <option key={company.company_id} value={company.company_id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.role === 'regulatory_authority' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regulatory Authority</label>
                  <select
                    className="input"
                    required
                    value={form.authority_id}
                    onChange={e => setForm(f => ({ ...f, authority_id: e.target.value }))}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  className="input"
                  required
                  minLength={3}
                  maxLength={100}
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
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

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
            {(Object.keys(roleLabels) as UserRole[]).map(role => (
              <div key={role} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{roleLabels[role]}</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{roleCounts[role]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Existing Users</h2>
            <span className="text-sm text-gray-500">{users.length} total</span>
          </div>
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            emptyText="No users found"
            keyField="user_id"
          />
        </div>
      </div>
    </Layout>
  );
}
