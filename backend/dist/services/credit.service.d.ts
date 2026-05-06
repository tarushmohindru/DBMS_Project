export declare function getAllCredits(filters?: {
    company_id?: number;
    from?: string;
    to?: string;
}): Promise<any[]>;
export declare function getCreditById(credit_id: number): Promise<any>;
export declare function getCreditsByCompany(company_id: number): Promise<any[]>;
export declare function getCreditSummary(): Promise<any[]>;
//# sourceMappingURL=credit.service.d.ts.map