import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import useAuth from '@/hooks/useAuth';
import { logService, plantService } from '@/services';
import { ProductionLog, EnergyPlant } from '@/types';

export default function ProductionLogsPage() {
  const { user } = useAuth();
  const [logs,    setLogs]    = useState<ProductionLog[]>([]);
  const [plants,  setPlants]  = useState<EnergyPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showVerify, setShowVerify] = useState<{ log: ProductionLog | null; show: boolean }>({ log: null, show: false });
  const [form,       setForm]  = useState({ plant_id: '', log_date: '', energy_kwh: '' });
  const [verifyForm, setVerifyForm] = useState({ decision: 'Verified', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]  = useState('');

  function fetchLogs() {
    setLoading(true);
    logService.list().then(setLogs).finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchLogs();
    if (user?.role === 'company_admin') {
      plantService.list({ status: 'Approved' }).then(setPlants);
    }
  }, [user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await logService.create({ plant_id: parseInt(form.plant_id), log_date: form.log_date, energy_kwh: parseFloat(form.energy_kwh) });
      setShowCreate(false);
      setForm({ plant_id: '', log_date: '', energy_kwh: '' });
      fetchLogs();
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Failed to submit log');
    } finally { setSubmitting(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!showVerify.log) return;
    setSubmitting(true); setError('');
    try {
      await logService.verify(showVerify.log.log_id, verifyForm);
      setShowVerify({ log: null, show: false });
      fetchLogs();
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Failed to verify log');
    } finally { setSubmitting(false); }
  }

  const columns: Column<ProductionLog>[] = [
    { key: 'log_id',              header: 'ID',          render: r => `#${r.log_id}` },
    { key: 'company_name',        header: 'Company',     render: r => r.company_name ?? '—' },
    { key: 'plant_name',          header: 'Plant',       render: r => r.plant_name ?? '—' },
    { key: 'log_date',            header: 'Log Date',    render: r => new Date(r.log_date).toLocaleDateString('en-IN') },
    { key: 'energy_kwh',          header: 'Energy (kWh)', render: r => r.energy_kwh?.toLocaleString() },
    { key: 'verification_status', header: 'Status',      render: r => <Badge status={r.verification_status} /> },
    ...(user?.role === 'regulatory_authority' ? [{
      key: 'actions', header: 'Actions',
      render: (r: ProductionLog) => r.verification_status === 'Pending' ? (
        <button onClick={() => { setShowVerify({ log: r, show: true }); setError(''); }}
          className="text-xs px-3 py-1 bg-eco-600 text-white rounded-lg hover:bg-eco-700">
          Verify
        </button>
      ) : null,
    }] : []),
  ];

  return (
    <Layout title="Production Logs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Energy production records and verification</p>
        </div>
        {user?.role === 'company_admin' && (
          <button onClick={() => { setShowCreate(true); setError(''); }} className="btn-primary">
            + Submit Log
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyText="No production logs found"
          keyField="log_id"
        />
      </div>

      {/* Create Log Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Submit Production Log">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plant</label>
            <select className="input" required value={form.plant_id}
              onChange={e => setForm(f => ({ ...f, plant_id: e.target.value }))}>
              <option value="">Select an approved plant</option>
              {plants.map(p => <option key={p.plant_id} value={p.plant_id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Log Date</label>
            <input className="input" type="date" required value={form.log_date}
              onChange={e => setForm(f => ({ ...f, log_date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Energy Generated (kWh)</label>
            <input className="input" type="number" step="0.01" min="0.01" required value={form.energy_kwh}
              onChange={e => setForm(f => ({ ...f, energy_kwh: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">Carbon credits = kWh × 0.001</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Submitting...' : 'Submit Log'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Verify Log Modal */}
      <Modal isOpen={showVerify.show} onClose={() => setShowVerify({ log: null, show: false })} title="Verify Production Log">
        <form onSubmit={handleVerify} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
          {showVerify.log && (
            <div className="p-3 bg-gray-50 rounded-xl text-sm space-y-1">
              <div><span className="font-medium">Company:</span> {showVerify.log.company_name}</div>
              <div><span className="font-medium">Plant:</span> {showVerify.log.plant_name}</div>
              <div><span className="font-medium">Date:</span> {new Date(showVerify.log.log_date).toLocaleDateString()}</div>
              <div><span className="font-medium">Energy:</span> {showVerify.log.energy_kwh?.toLocaleString()} kWh</div>
              <div><span className="font-medium">Credits to Issue:</span> {((showVerify.log.energy_kwh ?? 0) * 0.001).toFixed(4)} CCU</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
            <select className="input" value={verifyForm.decision}
              onChange={e => setVerifyForm(f => ({ ...f, decision: e.target.value }))}>
              <option value="Verified">Verify — Issue Carbon Credits</option>
              <option value="Rejected">Reject Log</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea className="input" rows={3} value={verifyForm.remarks}
              onChange={e => setVerifyForm(f => ({ ...f, remarks: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className={verifyForm.decision === 'Verified' ? 'btn-primary flex-1' : 'btn-danger flex-1'}>
              {submitting ? 'Processing...' : verifyForm.decision === 'Verified' ? 'Verify & Issue Credits' : 'Reject Log'}
            </button>
            <button type="button" onClick={() => setShowVerify({ log: null, show: false })} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
