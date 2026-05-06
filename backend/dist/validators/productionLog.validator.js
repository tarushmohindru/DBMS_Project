"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyProductionLogSchema = exports.createProductionLogSchema = void 0;
const zod_1 = require("zod");
exports.createProductionLogSchema = zod_1.z.object({
    plant_id: zod_1.z.number().int().positive(),
    log_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    energy_kwh: zod_1.z.number().positive('Energy must be greater than 0'),
});
exports.verifyProductionLogSchema = zod_1.z.object({
    decision: zod_1.z.enum(['Verified', 'Rejected']),
    remarks: zod_1.z.string().max(1000).optional(),
});
//# sourceMappingURL=productionLog.validator.js.map