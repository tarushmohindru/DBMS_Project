import { CreateCompanyWithUserInput } from '../validators/company.validator';
export declare function getAllCompanies(): Promise<any[]>;
export declare function getCompanyById(company_id: number): Promise<any>;
export declare function registerCompanyWithAdmin(input: CreateCompanyWithUserInput): Promise<{
    company: any;
    user: any;
}>;
//# sourceMappingURL=company.service.d.ts.map