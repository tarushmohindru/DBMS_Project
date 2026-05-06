"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const listing_controller_1 = require("../controllers/listing.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, listing_controller_1.listActiveListings);
router.get('/all', auth_1.authenticate, listing_controller_1.listAllListings);
router.get('/cursor', auth_1.authenticate, listing_controller_1.getActiveListingsCursor);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('company_admin'), listing_controller_1.createListing);
router.get('/:id', auth_1.authenticate, listing_controller_1.getListing);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('company_admin', 'marketplace_admin'), listing_controller_1.cancelListing);
exports.default = router;
//# sourceMappingURL=listing.routes.js.map