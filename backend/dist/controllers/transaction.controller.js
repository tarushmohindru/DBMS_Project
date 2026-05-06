"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTransactions = listTransactions;
exports.getTransaction = getTransaction;
exports.executePurchase = executePurchase;
const TxnService = __importStar(require("../services/transaction.service"));
const transaction_validator_1 = require("../validators/transaction.validator");
const errors_1 = require("../services/errors");
async function listTransactions(req, res) {
    try {
        const filters = {};
        if (req.user?.role === 'company_admin') {
            // Company sees their own buys and sells
            filters.participant_id = req.user.company_id ?? undefined;
        }
        const txns = await TxnService.getAllTransactions(filters);
        res.json({ success: true, data: txns });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getTransaction(req, res) {
    try {
        const txn = await TxnService.getTransactionById(parseInt(req.params.id, 10));
        if (!txn) {
            res.status(404).json({ success: false, error: 'Transaction not found' });
            return;
        }
        if (req.user?.role === 'company_admin' &&
            txn.buyer_id !== req.user.company_id &&
            txn.seller_id !== req.user.company_id) {
            res.status(403).json({ success: false, error: 'Access denied to another company\'s transaction' });
            return;
        }
        res.json({ success: true, data: txn });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function executePurchase(req, res) {
    const parse = transaction_validator_1.createTransactionSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const buyer_id = req.user.company_id;
        const txn = await TxnService.executePurchase(buyer_id, parse.data);
        res.status(201).json({ success: true, data: txn });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
//# sourceMappingURL=transaction.controller.js.map