import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import useAuth from '@/hooks/useAuth';
import { complianceService } from '@/services';
import { ComplianceReport, RegulatoryAuthority } from '@/types';

export default function CompliancePage() {
  const { user } = useAuth();
  const [reports,      setReports]      = useState<ComplianceReport[]>([]);
  const [authorities,  setAuthorities]  = useState<RegulatoryAuthority[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [reviewReport, setReviewReport] = useState<ComplianceReport | null>(null);
  const [authorityId,  setAuthorityId]  = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [auditing,     setAuditing]     = useState(false);
  const [error,        setError]        = useState('');
  const [auditError,   setAuditError]   = useState('');

  function fetchReports() {
    setLoading(true);
    complianceService.list().then(setReports).finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchReports();
    complianceService.authorities().then(setAuthorities);
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await complianceService.generate({ authority_id: parseInt(authorityId) });
      setShowGenerate(false);
      setAuthorityId('');
      fetchReports();
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e?.error || 'Failed to generate report');
    } finally { setSubmitting(false); }
  }

  async function handleAudit() {
    if (!reviewReport) return;
    setAuditing(true);
    setAuditError('');
    try {
      await complianceService.audit(reviewReport.report_id, { status: 'Audited' });
      setReviewReport(null);
      fetchReports();
    } catch (err: unknown) {
      setAuditError((err as { error?: string })?.error ?? 'Failed to verify report');
    } finally {
      setAuditing(false);
    }
  }

  const formatCredits = (value: number | string) => `${parseFloat(String(value)).toFixed(4)} CCU`;
  const getTradeRatio = (report: ComplianceReport) => {
    const issued = parseFloat(String(report.total_credits_issued));
    const traded = parseFloat(String(report.total_credits_traded));
    return issued > 0 ? `${((traded / issued) * 100).toFixed(1)}%` : '—';
  };

  const pendingCount = user?.role === 'regulatory_authority'
    ? reports.filter(r => r.status === 'Submitted').length
    : 0;

  const columns: Column<ComplianceReport>[] = [
    { key: 'report_id',             header: 'ID',              render: r => `#${r.report_id}` },
    { key: 'company_name',          header: 'Company',         render: r => r.company_name ?? '—' },
    { key: 'authority_name',        header: 'Authority',       render: r => r.authority_name ?? '—' },
    { key: 'report_date',           header: 'Date',            render: r => new Date(r.report_date).toLocaleDateString('en-IN') },
    { key: 'total_credits_issued',  header: 'Credits Issued',  render: r => formatCredits(r.total_credits_issued) },
    { key: 'total_credits_traded',  header: 'Credits Traded',  render: r => formatCredits(r.total_credits_traded) },
    { key: 'compliance_ratio',      header: 'Trade Ratio',     render: r => getTradeRatio(r) },
    { key: 'status',                header: 'Status',          render: r => <Badge status={r.status} /> },
    ...(user?.role === 'regulatory_authority' ? [{
      key: 'audit', header: 'Action',
      render: (r: ComplianceReport) => r.status === 'Submitted' ? (
        <button
          onClick={() => { setReviewReport(r); setAuditError(''); }}
          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Audit Report
        </button>
      ) : null,
    }] : []),
  ];

  return (
    <Layout title="Compliance Reports">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Regulatory compliance reporting and audit trail</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'regulatory_authority' && !loading && pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 text-sm font-medium rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {pendingCount} pending review
            </span>
          )}
          {user?.role === 'company_admin' && (
            <button onClick={() => { setShowGenerate(true); setError(''); }} className="btn-primary">
              + Generate Report
            </button>
          )}
        </div>
      </div>

      {user?.role === 'regulatory_authority' && !loading && pendingCount === 0 && reports.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-700">
          All compliance reports for your authority have been audited. New reports will appear here once companies submit them.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <DataTable
          columns={columns}
          data={reports}
          loading={loading}
          emptyText={
            user?.role === 'regulatory_authority'
              ? 'No compliance reports submitted to your authority yet'
              : 'No compliance reports yet'
          }
          keyField="report_id"
        />
      </div>

      {/* Generate Report Modal */}
      <Modal isOpen={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Compliance Report">
        <form onSubmit={handleGenerate} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
          <div className="p-3 bg-eco-50 rounded-xl text-sm text-eco-700">
            This will aggregate all your carbon credits and trades using a cursor-based database procedure
            and submit a compliance report to the selected authority.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regulatory Authority</label>
            <select className="input" required value={authorityId}
              onChange={e => setAuthorityId(e.target.value)}>
              <option value="">Select authority</option>
              {authorities.map(a => (
                <option key={a.authority_id} value={a.authority_id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Generating...' : 'Generate & Submit'}
            </button>
            <button type="button" onClick={() => setShowGenerate(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!reviewReport}
        onClose={() => { if (!auditing) setReviewReport(null); }}
        title={`Audit Report #${reviewReport?.report_id ?? ''}`}
        size="lg"
      >
        {reviewReport && (
          <div className="space-y-5">
            {auditError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{auditError}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Company</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{reviewReport.company_name ?? '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Authority</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{reviewReport.authority_name ?? '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Report Date</div>
                <div className="mt-1 text-sm font-medium text-gray-900">
                  {new Date(reviewReport.report_date).toLocaleDateString('en-IN')}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Status</div>
                <div className="mt-1"><Badge status={reviewReport.status} /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 border border-gray-100 rounded-xl">
                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Issued</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{formatCredits(reviewReport.total_credits_issued)}</div>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl">
                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Traded</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{formatCredits(reviewReport.total_credits_traded)}</div>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl">
                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Trade Ratio</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{getTradeRatio(reviewReport)}</div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleAudit}
                disabled={auditing}
                className={auditing ? 'btn-primary flex-1 opacity-50' : 'btn-primary flex-1'}
              >
                {auditing ? 'Verifying...' : 'Verify & Mark Audited'}
              </button>
              <button
                type="button"
                onClick={() => setReviewReport(null)}
                disabled={auditing}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
