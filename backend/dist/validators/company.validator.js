"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompanyWithUserSchema = exports.createCompanySchema = void 0;
const zod_1 = require("zod");
exports.createCompanySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    industry: zod_1.z.string().max(100).optional(),
    registration_no: zod_1.z.string().min(1).max(100),
});
exports.createCompanyWithUserSchema = zod_1.z.object({
    company: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        industry: zod_1.z.string().max(100).optional(),
        registration_no: zod_1.z.string().min(1).max(100),
    }),
    user: zod_1.z.object({
        username: zod_1.z.string().min(3).max(100),
        password: zod_1.z.string().min(8).max(255),
    }),
});
//# sourceMappingURL=company.validator.js.map