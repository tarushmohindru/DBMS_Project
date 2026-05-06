"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditReportSchema = exports.generateReportSchema = void 0;
const zod_1 = require("zod");
exports.generateReportSchema = zod_1.z.object({
    authority_id: zod_1.z.number().int().positive(),
});
exports.auditReportSchema = zod_1.z.object({
    status: zod_1.z.enum(['Audited']),
    notes: zod_1.z.string().max(1000).optional(),
});
//# sourceMappingURL=compliance.validator.js.map