import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import useAuth from '@/hooks/useAuth';
import { listingService, transactionService, creditService } from '@/services';
import { MarketListing, CarbonCredit } from '@/types';

export default function MarketplacePage() {
  const { user, loading: authLoading } = useAuth();
  const [listings,    setListings]    = useState<MarketListing[]>([]);
  const [myCredits,   setMyCredits]   = useState<CarbonCredit[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showBuy,     setShowBuy]     = useState<{ listing: MarketListing | null; show: boolean }>({ listing: null, show: false });
  const [showSell,    setShowSell]    = useState(false);
  const [buyQty,      setBuyQty]      = useState('');
  const [sellForm,    setSellForm]    = useState({ credit_id: '', quantity: '', price_per_credit: '' });
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  function fetchListings() {
    if (!user) return;
    setLoading(true);
    const request = user.role === 'marketplace_admin'
      ? listingService.listAll()
      : listingService.listActive();
    request.then(setListings).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (authLoading || !user) return;
    fetchListings();
    if (user?.role === 'company_admin' && user.company_id) {
      creditService.byCompany(user.company_id).then(setMyCredits);
    }
  }, [user, authLoading]);

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    if (!showBuy.listing) return;
    setSubmitting(true); setError('');
    try {
      await transactionService.execute({ listing_id: showBuy.listing.listing_id, quantity: parseFloat(buyQty) });
      setShowBuy({ listing: null, show: false });
      setBuyQty('');
      setSuccess('Purchase successful! Credits added to your wallet.');
      fetchListings();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Purchase failed');
    } finally { setSubmitting(false); }
  }

  async function handleSell(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await listingService.create({
        credit_id: parseInt(sellForm.credit_id),
        quantity:  parseFloat(sellForm.quantity),
        price_per_credit: parseFloat(sellForm.price_per_credit),
      });
      setShowSell(false);
      setSellForm({ credit_id: '', quantity: '', price_per_credit: '' });
      setSuccess('Listing created! Your credits are now on the marketplace.');
      fetchListings();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Failed to create listing');
    } finally { setSubmitting(false); }
  }

  async function handleCancelListing(listing: MarketListing) {
    if (!window.confirm(`Cancel listing #${listing.listing_id}?`)) return;
    setSubmitting(true);
    setError('');
    try {
      await listingService.cancel(listing.listing_id);
      setSuccess(`Listing #${listing.listing_id} cancelled.`);
      fetchListings();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Failed to cancel listing');
    } finally {
      setSubmitting(false);
    }
  }

  const activeListings = listings.filter(l => l.status === 'Active');
  const activeTotalValue = activeListings.reduce((s, l) => s + (l.quantity * l.price_per_credit), 0);

  const columns: Column<MarketListing>[] = [
    { key: 'listing_id',       header: 'ID',          render: r => `#${r.listing_id}` },
    { key: 'seller_name',      header: 'Seller',      render: r => r.seller_name ?? '—' },
    { key: 'quantity',         header: 'Available',   render: r => `${parseFloat(String(r.quantity)).toFixed(4)} CCU` },
    { key: 'price_per_credit', header: 'Price/Credit', render: r => `₹${parseFloat(String(r.price_per_credit)).toFixed(2)}` },
    { key: 'total_value',      header: 'Total Value', render: r => `₹${(r.quantity * r.price_per_credit).toFixed(2)}` },
    { key: 'status',           header: 'Status',      render: r => <Badge status={r.status} /> },
    ...(user?.role === 'marketplace_admin' ? [{
      key: 'admin_action', header: 'Action',
      render: (r: MarketListing) => r.status === 'Active' ? (
        <button
          onClick={() => handleCancelListing(r)}
          disabled={submitting}
          className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          Cancel Listing
        </button>
      ) : (
        <span className="text-xs text-gray-400">No action</span>
      ),
    }] : user?.role === 'company_admin' ? [{
      key: 'buy', header: 'Action',
      render: (r: MarketListing) =>
        r.status === 'Active' && r.seller_id !== user.company_id ? (
          <button
            onClick={() => { setShowBuy({ listing: r, show: true }); setBuyQty(''); setError(''); }}
            className="text-xs px-3 py-1.5 bg-eco-600 text-white rounded-lg hover:bg-eco-700"
          >
            Buy Credits
          </button>
        ) : r.seller_id === user.company_id ? (
          <span className="text-xs text-gray-400">Your listing</span>
        ) : null,
    }] : []),
  ];

  return (
    <Layout title="Marketplace">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carbon Credit Marketplace</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role === 'marketplace_admin'
              ? `${activeListings.length} active of ${listings.length} total listing${listings.length !== 1 ? 's' : ''}`
              : `${listings.length} active listing${listings.length !== 1 ? 's' : ''}`
            } — Active value: ₹{activeTotalValue.toFixed(2)}
          </p>
        </div>
        {user?.role === 'company_admin' && (
          <button onClick={() => { setShowSell(true); setError(''); }} className="btn-primary">
            + List Credits for Sale
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm">
          ✓ {success}
        </div>
      )}
      {error && !showBuy.show && !showSell && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <DataTable
          columns={columns}
          data={listings}
          loading={loading}
          emptyText={user?.role === 'marketplace_admin' ? 'No listings found' : 'No active listings at this time'}
          keyField="listing_id"
        />
      </div>

      {/* Buy Modal */}
      <Modal isOpen={showBuy.show} onClose={() => setShowBuy({ listing: null, show: false })} title="Buy Carbon Credits">
        {showBuy.listing && (
          <form onSubmit={handleBuy} className="space-y-4">
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
            <div className="p-4 bg-gray-50 rounded-xl text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Seller</span><span className="font-medium">{showBuy.listing.seller_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Available</span><span className="font-medium">{parseFloat(String(showBuy.listing.quantity)).toFixed(4)} CCU</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Price/Credit</span><span className="font-medium">₹{parseFloat(String(showBuy.listing.price_per_credit)).toFixed(2)}</span></div>
              {buyQty && (
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-medium text-gray-700">Total Cost</span>
                  <span className="font-bold text-eco-700">₹{(parseFloat(buyQty) * showBuy.listing.price_per_credit).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Buy (CCU)</label>
              <input className="input" type="number" step="0.0001" min="0.0001"
                max={String(showBuy.listing.quantity)} required value={buyQty}
                onChange={e => setBuyQty(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Processing...' : 'Confirm Purchase'}
              </button>
              <button type="button" onClick={() => setShowBuy({ listing: null, show: false })} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Sell Modal */}
      <Modal isOpen={showSell} onClose={() => setShowSell(false)} title="List Credits for Sale">
        <form onSubmit={handleSell} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Carbon Credit</label>
            <select className="input" required value={sellForm.credit_id}
              onChange={e => setSellForm(f => ({ ...f, credit_id: e.target.value }))}>
              <option value="">Choose a credit record</option>
              {myCredits.map(c => (
                <option key={c.credit_id} value={c.credit_id}>
                  Credit #{c.credit_id} — {parseFloat(String(c.credits_issued)).toFixed(4)} CCU ({c.plant_name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (CCU)</label>
            <input className="input" type="number" step="0.0001" min="0.0001" required value={sellForm.quantity}
              onChange={e => setSellForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per Credit (INR)</label>
            <input className="input" type="number" step="0.01" min="0.01" required value={sellForm.price_per_credit}
              onChange={e => setSellForm(f => ({ ...f, price_per_credit: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">Used for reporting trade value only; credit wallet transfers by quantity.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Creating...' : 'Create Listing'}
            </button>
            <button type="button" onClick={() => setShowSell(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
