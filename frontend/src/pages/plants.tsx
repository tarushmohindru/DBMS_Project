import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import useAuth from '@/hooks/useAuth';
import { plantService } from '@/services';
import { EnergyPlant } from '@/types';

export default function PlantsPage() {
  const { user } = useAuth(['company_admin', 'regulatory_authority', 'marketplace_admin']);
  const [plants,  setPlants]  = useState<EnergyPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState<{ plant: EnergyPlant | null; show: boolean }>({ plant: null, show: false });
  const [form,    setForm]    = useState({ name: '', type: 'Solar', capacity: '', location: '' });
  const [verifyForm, setVerifyForm] = useState({ decision: 'Approved', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error,   setError]   = useState('');

  function fetchPlants() {
    setLoading(true);
    plantService.list().then(setPlants).finally(() => setLoading(false));
  }

  useEffect(() => { fetchPlants(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await plantService.create({ ...form, capacity: parseFloat(form.capacity) });
      setShowModal(false);
      setForm({ name: '', type: 'Solar', capacity: '', location: '' });
      fetchPlants();
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Failed to register plant');
    } finally { setSubmitting(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!verifyModal.plant) return;
    setSubmitting(true); setError('');
    try {
      await plantService.verify(verifyModal.plant.plant_id, verifyForm);
      setVerifyModal({ plant: null, show: false });
      fetchPlants();
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Failed to verify plant');
    } finally { setSubmitting(false); }
  }

  const columns: Column<EnergyPlant>[] = [
    { key: 'plant_id',    header: 'ID',       render: r => `#${r.plant_id}` },
    { key: 'name',        header: 'Plant Name' },
    { key: 'company_name',header: 'Company',  render: r => r.company_name ?? '—' },
    { key: 'type',        header: 'Type',     render: r => (
      <span className="flex items-center gap-1">
        {r.type === 'Solar' ? '☀️' : r.type === 'Wind' ? '💨' : r.type === 'Hydro' ? '💧' : '🌿'} {r.type}
      </span>
    )},
    { key: 'capacity',    header: 'Capacity',  render: r => `${r.capacity?.toLocaleString()} kW` },
    { key: 'location',    header: 'Location' },
    { key: 'status',      header: 'Status',   render: r => <Badge status={r.status} /> },
    ...(user?.role === 'regulatory_authority' ? [{
      key: 'actions', header: 'Actions',
      render: (r: EnergyPlant) => r.status === 'Pending' ? (
        <button
          onClick={() => { setVerifyModal({ plant: r, show: true }); setError(''); }}
          className="text-xs px-3 py-1 bg-eco-600 text-white rounded-lg hover:bg-eco-700"
        >
          Review
        </button>
      ) : null,
    }] : []),
  ];

  return (
    <Layout title="Energy Plants">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Energy Plants</h1>
          <p className="text-gray-500 text-sm mt-1">Manage renewable energy plant registrations</p>
        </div>
        {user?.role === 'company_admin' && (
          <button onClick={() => { setShowModal(true); setError(''); }} className="btn-primary">
            + Register Plant
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <DataTable
          columns={columns}
          data={plants}
          loading={loading}
          emptyText="No plants registered yet"
          keyField="plant_id"
        />
      </div>

      {/* Register Plant Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register Energy Plant">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plant Name</label>
            <input className="input" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select className="input" value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {['Solar', 'Wind', 'Hydro', 'Biomass'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (kW)</label>
            <input className="input" type="number" step="0.01" required value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input className="input" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Registering...' : 'Register Plant'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Verify Plant Modal */}
      <Modal isOpen={verifyModal.show} onClose={() => setVerifyModal({ plant: null, show: false })} title={`Review: ${verifyModal.plant?.name}`}>
        <form onSubmit={handleVerify} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
          <div className="p-3 bg-gray-50 rounded-xl text-sm space-y-1">
            <div><span className="font-medium">Type:</span> {verifyModal.plant?.type}</div>
            <div><span className="font-medium">Capacity:</span> {verifyModal.plant?.capacity?.toLocaleString()} kW</div>
            <div><span className="font-medium">Company:</span> {verifyModal.plant?.company_name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
            <select className="input" value={verifyForm.decision}
              onChange={e => setVerifyForm(f => ({ ...f, decision: e.target.value }))}>
              <option value="Approved">Approve</option>
              <option value="Rejected">Reject</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea className="input" rows={3} value={verifyForm.remarks}
              onChange={e => setVerifyForm(f => ({ ...f, remarks: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className={submitting ? 'btn-primary flex-1 opacity-50' : (verifyForm.decision === 'Approved' ? 'btn-primary flex-1' : 'btn-danger flex-1')}>
              {submitting ? 'Submitting...' : verifyForm.decision === 'Approved' ? 'Approve Plant' : 'Reject Plant'}
            </button>
            <button type="button" onClick={() => setVerifyModal({ plant: null, show: false })} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
