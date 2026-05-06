import { CreatePlantInput, VerifyPlantInput } from '../validators/plant.validator';
export declare function getAllPlants(filters?: {
    status?: string;
    company_id?: number;
}): Promise<any[]>;
export declare function getPlantById(plant_id: number): Promise<any>;
export declare function createPlant(company_id: number, input: CreatePlantInput): Promise<any>;
export declare function verifyPlant(plant_id: number, authority_id: number, input: VerifyPlantInput): Promise<any>;
export declare function getPlantVerificationLog(plant_id: number): Promise<any[]>;
//# sourceMappingURL=plant.service.d.ts.map