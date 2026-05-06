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
exports.listActiveListings = listActiveListings;
exports.listAllListings = listAllListings;
exports.getListing = getListing;
exports.createListing = createListing;
exports.cancelListing = cancelListing;
exports.getActiveListingsCursor = getActiveListingsCursor;
const ListingService = __importStar(require("../services/listing.service"));
const listing_validator_1 = require("../validators/listing.validator");
const errors_1 = require("../services/errors");
async function listActiveListings(req, res) {
    try {
        const listings = await ListingService.getActiveListings();
        res.json({ success: true, data: listings });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function listAllListings(req, res) {
    try {
        const { status } = req.query;
        const seller_id = req.user?.role === 'company_admin' ? req.user.company_id ?? undefined : undefined;
        const listings = await ListingService.getAllListings({ status, seller_id });
        res.json({ success: true, data: listings });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getListing(req, res) {
    try {
        const listing = await ListingService.getListingById(parseInt(req.params.id, 10));
        if (!listing) {
            res.status(404).json({ success: false, error: 'Listing not found' });
            return;
        }
        res.json({ success: true, data: listing });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function createListing(req, res) {
    const parse = listing_validator_1.createListingSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const seller_id = req.user.company_id;
        const listing = await ListingService.createListing(seller_id, parse.data);
        res.status(201).json({ success: true, data: listing });
    }
    catch (err) {
        const e = err;
        if (e.status) {
            res.status(e.status).json({ success: false, error: e.message, code: e.code });
            return;
        }
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function cancelListing(req, res) {
    try {
        const listing_id = parseInt(req.params.id, 10);
        if (req.user.role === 'marketplace_admin') {
            const result = await ListingService.adminCancelListing(listing_id);
            res.json({ success: true, data: result });
        }
        else {
            const seller_id = req.user.company_id;
            const result = await ListingService.cancelListing(listing_id, seller_id);
            res.json({ success: true, data: result });
        }
    }
    catch (err) {
        const e = err;
        if (e.status) {
            res.status(e.status).json({ success: false, error: e.message, code: e.code });
            return;
        }
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getActiveListingsCursor(req, res) {
    try {
        const listings = await ListingService.getActiveListingsCursor();
        res.json({ success: true, data: listings });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
//# sourceMappingURL=listing.controller.js.map