export declare function getTopBuyers(): Promise<any[]>;
export declare function getCreditIssuanceTrends(): Promise<any[]>;
export declare function getMarketplaceVolume(): Promise<any[]>;
export declare function getCompanyPerformance(): Promise<any[]>;
export declare function getDashboardKPIs(): Promise<{
    total_credits_issued: number;
    credits_count: number;
    active_listings: number;
    total_transactions: number;
    marketplace_volume: number;
    total_wallet_balance: number;
}>;
export declare function getPublicSummary(): Promise<{
    credits_issued: number;
    companies: number;
    transactions: number;
}>;
export declare function getCompanyDashboardKPIs(company_id: number): Promise<{
    credits_issued: number;
    credits_count: number;
    wallet_balance: number;
    active_listings: number;
    credits_bought: number;
    buy_count: number;
    credits_sold: number;
    sell_count: number;
}>;
export declare function getFullAnalytics(): Promise<{
    kpis: {
        total_credits_issued: number;
        credits_count: number;
        active_listings: number;
        total_transactions: number;
        marketplace_volume: number;
        total_wallet_balance: number;
    };
    topBuyers: any[];
    issuanceTrends: any[];
    volume: any[];
    performance: any[];
    compliance: any[];
}>;
//# sourceMappingURL=analytics.service.d.ts.map