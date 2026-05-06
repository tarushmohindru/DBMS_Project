import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import useAuth from '@/hooks/useAuth';
import { creditService } from '@/services';
import { CarbonCredit } from '@/types';

export default function CreditsPage() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');

  function fetchCredits() {
    setLoading(true);
    creditService.list({ ...(from && { from }), ...(to && { to }) })
      .then(setCredits)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCredits(); }, []); // eslint-disable-line

  const columns: Column<CarbonCredit>[] = [
    { key: 'credit_id',      header: 'Credit ID',    render: r => `#${r.credit_id}` },
    { key: 'company_name',   header: 'Company',      render: r => r.company_name ?? '—' },
    { key: 'plant_name',     header: 'Plant',        render: r => r.plant_name ?? '—' },
    { key: 'plant_type',     header: 'Type',         render: r => (
      <span className="text-xs px-2 py-0.5 bg-eco-100 text-eco-700 rounded-full">{r.plant_type}</span>
    )},
    { key: 'log_date',       header: 'Log Date',     render: r => r.log_date ? new Date(r.log_date).toLocaleDateString('en-IN') : '—' },
    { key: 'energy_kwh',     header: 'Energy (kWh)', render: r => r.energy_kwh?.toLocaleString() ?? '—' },
    { key: 'credits_issued', header: 'Credits (CCU)', render: r => (
      <span className="font-semibold text-eco-700">{parseFloat(String(r.credits_issued)).toFixed(4)}</span>
    )},
    { key: 'issued_date',    header: 'Issued On',    render: r => new Date(r.issued_date).toLocaleDateString('en-IN') },
    { key: 'log_id',         header: 'Log Ref',      render: r => `LOG#${r.log_id}` },
  ];

  const totalCredits = credits.reduce((sum, c) => sum + parseFloat(String(c.credits_issued)), 0);

  return (
    <Layout title="Carbon Credits">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carbon Credits Registry</h1>
          <p className="text-gray-500 text-sm mt-1">All verified and issued carbon credits</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-eco-700">{totalCredits.toFixed(4)}</div>
          <div className="text-xs text-gray-500">Total CCU in registry</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
          <input type="date" className="input w-auto" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
          <input type="date" className="input w-auto" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <button onClick={fetchCredits} className="btn-primary">Apply Filter</button>
        <button onClick={() => { setFrom(''); setTo(''); setTimeout(fetchCredits, 0); }} className="btn-secondary">Clear</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <DataTable
          columns={columns}
          data={credits}
          loading={loading}
          emptyText="No carbon credits issued yet"
          keyField="credit_id"
        />
      </div>
    </Layout>
  );
}
