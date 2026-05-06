"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.login);
router.post('/register', auth_1.authenticate, (0, auth_1.authorize)('marketplace_admin'), auth_controller_1.registerUser);
router.get('/me', auth_1.authenticate, auth_controller_1.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map