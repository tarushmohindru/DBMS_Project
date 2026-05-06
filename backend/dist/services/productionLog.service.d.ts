import { CreateProductionLogInput, VerifyProductionLogInput } from '../validators/productionLog.validator';
export declare function getAllLogs(filters?: {
    verification_status?: string;
    company_id?: number;
    plant_id?: number;
}): Promise<any[]>;
export declare function getLogById(log_id: number): Promise<any>;
export declare function createLog(company_id: number, input: CreateProductionLogInput): Promise<any>;
export declare function verifyLog(log_id: number, authority_id: number, input: VerifyProductionLogInput): Promise<any>;
//# sourceMappingURL=productionLog.service.d.ts.map