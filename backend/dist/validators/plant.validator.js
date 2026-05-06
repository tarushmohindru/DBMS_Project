"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPlantSchema = exports.createPlantSchema = void 0;
const zod_1 = require("zod");
exports.createPlantSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    type: zod_1.z.enum(['Solar', 'Wind', 'Hydro', 'Biomass']),
    capacity: zod_1.z.number().positive('Capacity must be positive'),
    location: zod_1.z.string().max(255).optional(),
});
exports.verifyPlantSchema = zod_1.z.object({
    decision: zod_1.z.enum(['Approved', 'Rejected']),
    remarks: zod_1.z.string().max(1000).optional(),
});
//# sourceMappingURL=plant.validator.js.map