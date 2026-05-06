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
exports.listPlants = listPlants;
exports.getPlant = getPlant;
exports.createPlant = createPlant;
exports.verifyPlant = verifyPlant;
exports.getPlantAuditLog = getPlantAuditLog;
const PlantService = __importStar(require("../services/plant.service"));
const plant_validator_1 = require("../validators/plant.validator");
const errors_1 = require("../services/errors");
async function listPlants(req, res) {
    try {
        const { status } = req.query;
        const company_id = req.user?.role === 'company_admin' ? req.user.company_id ?? undefined : undefined;
        const plants = await PlantService.getAllPlants({ status, company_id });
        res.json({ success: true, data: plants });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getPlant(req, res) {
    try {
        const plant = await PlantService.getPlantById(parseInt(req.params.id, 10));
        if (!plant) {
            res.status(404).json({ success: false, error: 'Plant not found' });
            return;
        }
        if (req.user?.role === 'company_admin' && plant.company_id !== req.user.company_id) {
            res.status(403).json({ success: false, error: 'Access denied to another company\'s plant' });
            return;
        }
        res.json({ success: true, data: plant });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function createPlant(req, res) {
    const parse = plant_validator_1.createPlantSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const company_id = req.user.company_id;
        const plant = await PlantService.createPlant(company_id, parse.data);
        res.status(201).json({ success: true, data: plant });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function verifyPlant(req, res) {
    const parse = plant_validator_1.verifyPlantSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const authority_id = req.user.authority_id;
        const plant = await PlantService.verifyPlant(parseInt(req.params.id, 10), authority_id, parse.data);
        res.json({ success: true, data: plant });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getPlantAuditLog(req, res) {
    try {
        const log = await PlantService.getPlantVerificationLog(parseInt(req.params.id, 10));
        res.json({ success: true, data: log });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
//# sourceMappingURL=plant.controller.js.map