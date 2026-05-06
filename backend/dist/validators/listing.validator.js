"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelListingSchema = exports.createListingSchema = void 0;
const zod_1 = require("zod");
exports.createListingSchema = zod_1.z.object({
    credit_id: zod_1.z.number().int().positive(),
    quantity: zod_1.z.number().positive('Quantity must be greater than 0'),
    price_per_credit: zod_1.z.number().positive('Price must be greater than 0'),
});
exports.cancelListingSchema = zod_1.z.object({
    reason: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=listing.validator.js.map