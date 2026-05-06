import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import KPICard from '@/components/KPICard';
import DataTable, { Column } from '@/components/DataTable';
import useAuth from '@/hooks/useAuth';
import { walletService } from '@/services';
import { CreditWallet } from '@/types';

interface WalletEntry {
  type:         string;
  date:         string;
  amount:       number;
  quantity?:    number;
  monetary_amount?: number | null;
  counterparty?: string;
  plant_name?:  string;
}

export default function WalletPage() {
  const { user } = useAuth(['company_admin']);
  const [wallet,  setWallet]  = useState<CreditWallet | null>(null);
  const [history, setHistory] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const company_id = user?.company_id;
    if (!company_id) return;
    Promise.all([
      walletService.get(company_id),
      walletService.history(company_id),
    ]).then(([w, h]) => {
      setWallet(w);
      setHistory(h);
    }).finally(() => setLoading(false));
  }, [user]);

  const typeColors: Record<string, string> = {
    CREDIT_ISSUED: 'text-green-600 font-semibold',
    PURCHASE:      'text-blue-600 font-semibold',
    SALE:          'text-red-600 font-semibold',
  };

  const typeIcons: Record<string, string> = {
    CREDIT_ISSUED: '🌿 Credit Issued',
    SALE:          '↓ Credits Sold',
    PURCHASE:      '↑ Credits Purchased',
  };

  const columns: Column<WalletEntry>[] = [
    { key: 'type',    header: 'Type',   render: r => <span>{typeIcons[r.type as string] ?? r.type}</span> },
    { key: 'date',    header: 'Date',   render: r => new Date(String(r.date)).toLocaleDateString('en-IN') },
    {
      key: 'amount', header: 'Credits',
      render: r => (
        <span className={typeColors[r.type as string] ?? ''}>
          {(r.amount as number) >= 0 ? '+' : ''}{parseFloat(String(r.amount)).toFixed(4)}
        </span>
      )
    },
    { key: 'monetary_amount', header: 'Trade Value', render: r => (
      r.monetary_amount ? `₹${parseFloat(String(r.monetary_amount)).toFixed(2)}` : '—'
    ) },
    { key: 'counterparty', header: 'Counterparty', render: r => String(r.counterparty ?? r.plant_name ?? '—') },
  ];

  const inflow  = history.filter(h => parseFloat(String(h.amount ?? 0)) > 0).reduce((s, h) => s + parseFloat(String(h.amount)), 0);
  const outflow = history.filter(h => parseFloat(String(h.amount ?? 0)) < 0).reduce((s, h) => s + Math.abs(parseFloat(String(h.amount))), 0);

  return (
    <Layout title="My Wallet">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Credit Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Your carbon credit balance and transaction history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KPICard
          title="Current Balance"
          value={`${parseFloat(String(wallet?.balance ?? 0)).toFixed(4)} CCU`}
          subtitle={`Last updated: ${wallet ? new Date(wallet.last_updated).toLocaleDateString('en-IN') : '—'}`}
          icon="💼"
          color="green"
        />
        <KPICard title="Credits Gained" value={`+${inflow.toFixed(4)} CCU`} icon="↑" color="teal"   />
        <KPICard title="Credits Sold"   value={`-${outflow.toFixed(4)} CCU`} icon="↓" color="orange" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Transaction History</h2>
        <DataTable
          columns={columns}
          data={history}
          loading={loading}
          emptyText="No wallet transactions yet"
        />
      </div>
    </Layout>
  );
}
