import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import useAuth from '@/hooks/useAuth';
import { transactionService, listingService } from '@/services';
import { Transaction } from '@/types';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    transactionService.list().then(setTransactions).finally(() => setLoading(false));
  }, []);

  const totalVolume  = transactions.reduce((s, t) => s + parseFloat(String(t.total_amount)), 0);
  const totalCredits = transactions.reduce((s, t) => s + parseFloat(String(t.quantity)),      0);

  const columns: Column<Transaction>[] = [
    { key: 'txn_id',      header: 'Txn ID',        render: r => <span className="font-mono text-xs">#{r.txn_id}</span> },
    { key: 'buyer_name',  header: 'Buyer',          render: r => r.buyer_name  ?? '—' },
    { key: 'seller_name', header: 'Seller',         render: r => r.seller_name ?? '—' },
    { key: 'quantity',    header: 'Qty (CCU)',       render: r => parseFloat(String(r.quantity)).toFixed(4) },
    { key: 'price_per_credit', header: 'Unit Price', render: r => r.price_per_credit ? `₹${parseFloat(String(r.price_per_credit)).toFixed(2)}` : '—' },
    { key: 'total_amount',header: 'Total (INR)',    render: r => (
      <span className="font-semibold text-gray-900">₹{parseFloat(String(r.total_amount)).toFixed(4)}</span>
    )},
    { key: 'fee',         header: 'Fee (2%)',        render: r => `₹${(parseFloat(String(r.total_amount)) * 0.02).toFixed(4)}` },
    { key: 'txn_date',   header: 'Date',            render: r => new Date(r.txn_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) },
    ...(user?.role === 'marketplace_admin' ? [{
      key: 'cancel', header: 'Dispute',
      render: (r: Transaction) => (
        <button
          onClick={async () => {
            if (confirm(`Cancel listing #${r.listing_id}?`)) {
              try { await listingService.cancel(r.listing_id); alert('Listing cancelled.'); }
              catch (e: unknown) { alert((e as { error?: string })?.error ?? 'Failed'); }
            }
          }}
          className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
        >
          Cancel Listing
        </button>
      ),
    }] : []),
  ];

  return (
    <Layout title="Transactions">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">All marketplace trading activity</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-eco-700">₹{totalVolume.toFixed(2)}</div>
          <div className="text-xs text-gray-500">{totalCredits.toFixed(4)} credits traded in {transactions.length} txns</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <DataTable
          columns={columns}
          data={transactions}
          loading={loading}
          emptyText="No transactions yet"
          keyField="txn_id"
        />
      </div>
    </Layout>
  );
}
