import * as employeeController from './employee.controller.js';
import express from 'express';
const router = express.Router();

router.post('/create', employeeController.create);
export default router;
