import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import useAuth from '@/hooks/useAuth';
import { analyticsService } from '@/services';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type Tab = 'trends' | 'buyers' | 'volume' | 'performance' | 'compliance';

interface AnalyticsData {
  kpis?:          Record<string, unknown>;
  topBuyers?:     Record<string, unknown>[];
  issuanceTrends?: Record<string, unknown>[];
  volume?:        Record<string, unknown>[];
  performance?:   Record<string, unknown>[];
  compliance?:    Record<string, unknown>[];
}

export default function ReportsPage() {
  useAuth(['regulatory_authority', 'marketplace_admin']);
  const [tab,     setTab]     = useState<Tab>('trends');
  const [data,    setData]    = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.reports()
      .then((d: AnalyticsData) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const fmtMonth = (m: string) => {
    if (!m) return '';
    const d = new Date(m);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'trends',      label: 'Issuance Trends', icon: '📈' },
    { id: 'buyers',      label: 'Top Buyers',       icon: '🏆' },
    { id: 'volume',      label: 'Market Volume',    icon: '📊' },
    { id: 'performance', label: 'Company Performance', icon: '🏭' },
    { id: 'compliance',  label: 'Compliance Summary',  icon: '📋' },
  ];

  const performanceColumns: Column<Record<string, unknown>>[] = [
    { key: 'name',          header: 'Company' },
    { key: 'industry',      header: 'Industry' },
    { key: 'total_issued',  header: 'Credits Issued',  render: r => `${parseFloat(String(r.total_issued)).toFixed(4)} CCU` },
    { key: 'total_sold',    header: 'Sold',            render: r => `${parseFloat(String(r.total_sold  ?? 0)).toFixed(4)} CCU` },
    { key: 'total_bought',  header: 'Bought',          render: r => `${parseFloat(String(r.total_bought ?? 0)).toFixed(4)} CCU` },
    { key: 'wallet_balance',header: 'Wallet',          render: r => (
      <span className="font-semibold text-eco-700">{parseFloat(String(r.wallet_balance)).toFixed(4)} CCU</span>
    )},
    { key: 'plant_count',   header: 'Plants',          render: r => String(r.plant_count) },
  ];

  const complianceColumns: Column<Record<string, unknown>>[] = [
    { key: 'company_name',   header: 'Company' },
    { key: 'total_issued',   header: 'Total Issued',  render: r => `${parseFloat(String(r.total_issued)).toFixed(4)} CCU` },
    { key: 'total_traded',   header: 'Total Traded',  render: r => `${parseFloat(String(r.total_traded)).toFixed(4)} CCU` },
    { key: 'compliance_ratio', header: 'Trade/Issue Ratio', render: r => {
      const v = parseFloat(String(r.compliance_ratio));
      return isNaN(v) ? '—' : `${(v * 100).toFixed(1)}%`;
    }},
    { key: 'report_count',   header: 'Reports Filed', render: r => String(r.report_count) },
  ];

  if (loading) {
    return (
      <Layout title="Analytics Reports">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-eco-600 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  const trends  = (data.issuanceTrends ?? []).map(d => ({ ...d, month: fmtMonth(String(d.month)) }));
  const volumes = (data.volume ?? []).map(d => ({ ...d, month: fmtMonth(String(d.month)) }));

  return (
    <Layout title="Analytics Reports">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide performance and market insights</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-eco-600 text-white shadow-sm'
                : 'bg-white border border-gray-100 text-gray-600 hover:border-eco-200 hover:text-eco-700'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Credit Issuance Trends (Line chart) */}
      {tab === 'trends' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly Credit Issuance</h2>
          {trends.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No issuance data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`${v} CCU`, 'Credits']} />
                <Legend />
                <Line type="monotone" dataKey="total_credits" name="Credits Issued (CCU)" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Tab 2: Top Buyers (Bar chart) */}
      {tab === 'buyers' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Carbon Credit Buyers</h2>
          {(data.topBuyers ?? []).length === 0 ? (
            <div className="text-center py-16 text-gray-400">No buyer data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.topBuyers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="buyer_name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number, name: string) => [
                  name === 'Total Spent (INR)' ? `₹${parseFloat(String(v)).toFixed(2)}` : `${parseFloat(String(v)).toFixed(4)} CCU`,
                  '',
                ]} />
                <Legend />
                <Bar dataKey="total_credits_purchased" name="Credits Purchased (CCU)" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="total_spent"              name="Total Spent (INR)"       fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Tab 3: Marketplace Volume (Area chart) */}
      {tab === 'volume' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly Marketplace Volume</h2>
          {volumes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No volume data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={volumes}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number, name: string) => [
                  name === 'Credits Traded' ? `${parseFloat(String(v)).toFixed(4)} CCU` : `₹${parseFloat(String(v)).toFixed(2)}`,
                  '',
                ]} />
                <Legend />
                <Area type="monotone" dataKey="total_volume"           name="Volume (INR)"       stroke="#16a34a" fill="url(#volGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="total_credits_traded"   name="Credits Traded"     stroke="#0ea5e9" fill="none"           strokeWidth={2} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Tab 4: Company Performance (Table) */}
      {tab === 'performance' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Company Performance Overview</h2>
          <DataTable
            columns={performanceColumns}
            data={data.performance ?? []}
            emptyText="No performance data"
            keyField="company_id"
          />
        </div>
      )}

      {/* Tab 5: Compliance Summary (Table) */}
      {tab === 'compliance' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Compliance Summary</h2>
          <DataTable
            columns={complianceColumns}
            data={data.compliance ?? []}
            emptyText="No compliance data"
            keyField="company_id"
          />
        </div>
      )}
    </Layout>
  );
}
