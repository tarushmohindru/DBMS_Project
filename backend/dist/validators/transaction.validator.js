"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
exports.createTransactionSchema = zod_1.z.object({
    listing_id: zod_1.z.number().int().positive(),
    quantity: zod_1.z.number().positive('Quantity must be greater than 0'),
});
//# sourceMappingURL=transaction.validator.js.map