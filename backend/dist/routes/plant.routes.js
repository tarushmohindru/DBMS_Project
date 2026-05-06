"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const plant_controller_1 = require("../controllers/plant.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, plant_controller_1.listPlants);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('company_admin'), plant_controller_1.createPlant);
router.get('/:id', auth_1.authenticate, plant_controller_1.getPlant);
router.put('/:id/verify', auth_1.authenticate, (0, auth_1.authorize)('regulatory_authority'), plant_controller_1.verifyPlant);
router.get('/:id/audit-log', auth_1.authenticate, (0, auth_1.authorize)('regulatory_authority', 'marketplace_admin'), plant_controller_1.getPlantAuditLog);
exports.default = router;
//# sourceMappingURL=plant.routes.js.map