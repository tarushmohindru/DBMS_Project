import { GenerateReportInput, AuditReportInput } from '../validators/compliance.validator';
export declare function getAllReports(filters?: {
    company_id?: number;
    authority_id?: number;
    status?: string;
}): Promise<any[]>;
export declare function getReportById(report_id: number): Promise<any>;
export declare function generateReport(company_id: number, input: GenerateReportInput): Promise<any>;
export declare function auditReport(report_id: number, authority_id: number, _input: AuditReportInput): Promise<any>;
export declare function getComplianceSummaryView(): Promise<any[]>;
export declare function getPeriodicComplianceSummary(authority_id: number): Promise<any[]>;
export declare function getAllAuthorities(): Promise<any[]>;
//# sourceMappingURL=compliance.service.d.ts.map