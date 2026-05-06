import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import KPICard from '@/components/KPICard';
import DataTable, { Column } from '@/components/DataTable';
import Badge from '@/components/Badge';
import useAuth from '@/hooks/useAuth';
import { analyticsService, transactionService } from '@/services';
import { DashboardKPIs, Transaction } from '@/types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      analyticsService.dashboard(),
      transactionService.list(),
    ]).then(([k, t]) => {
      setKpis(k);
      setTransactions(t.slice(0, 5));
    }).finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return null;

  const fmtNum  = (n?: number) => (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const isAdmin = user?.role !== 'company_admin';

  const adminKPIs = kpis ? [
    { title: 'Total Credits Issued', value: fmtNum(kpis.total_credits_issued) + ' CCU', subtitle: `${kpis.credits_count} credit records`, icon: '🌿', color: 'green' as const },
    { title: 'Active Listings',      value: fmtNum(kpis.active_listings),                subtitle: 'On marketplace',                  icon: '🏪', color: 'blue' as const  },
    { title: 'Total Transactions',   value: fmtNum(kpis.total_transactions),              subtitle: 'Completed trades',                icon: '⇄',  color: 'purple' as const},
    { title: 'Market Volume',        value: '₹' + fmtNum(kpis.marketplace_volume),       subtitle: 'Reported trade value',            icon: '📈', color: 'orange' as const},
  ] : [];

  const companyKPIs = kpis ? [
    { title: 'Wallet Balance',     value: fmtNum(kpis.wallet_balance) + ' CCU',  subtitle: 'Available credits',      icon: '💼', color: 'green'  as const },
    { title: 'Credits Issued',     value: fmtNum(kpis.credits_issued) + ' CCU',  subtitle: `${kpis.credits_count} records`,       icon: '🌿', color: 'teal'   as const },
    { title: 'Credits Purchased',  value: fmtNum(kpis.credits_bought) + ' CCU',  subtitle: `${kpis.buy_count} transactions`,  icon: '🛒', color: 'blue'   as const },
    { title: 'Credits Sold',       value: fmtNum(kpis.credits_sold) + ' CCU',    subtitle: `${kpis.sell_count} transactions`, icon: '💰', color: 'purple' as const },
  ] : [];

  const kpiList = isAdmin ? adminKPIs : companyKPIs;

  const txnColumns: Column<Transaction>[] = [
    { key: 'txn_id',      header: 'ID',       render: r => `#${r.txn_id}` },
    { key: 'buyer_name',  header: 'Buyer',    render: r => r.buyer_name  ?? '—' },
    { key: 'seller_name', header: 'Seller',   render: r => r.seller_name ?? '—' },
    { key: 'quantity',    header: 'Quantity',  render: r => fmtNum(r.quantity) + ' CCU' },
    { key: 'total_amount',header: 'Amount',   render: r => '₹' + fmtNum(r.total_amount) },
    { key: 'txn_date',    header: 'Date',     render: r => new Date(r.txn_date).toLocaleDateString('en-IN') },
  ];

  return (
    <Layout title="Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, <span className="font-medium text-gray-700">{user?.username}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-gray-100" />
            ))
          : kpiList.map(k => <KPICard key={k.title} {...k} />)
        }
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
          <a href="/transactions" className="text-sm text-eco-600 hover:text-eco-700 font-medium">View all →</a>
        </div>
        <DataTable
          columns={txnColumns}
          data={transactions}
          loading={loading}
          emptyText="No transactions yet"
          keyField="txn_id"
        />
      </div>
    </Layout>
  );
}
