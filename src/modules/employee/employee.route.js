import * as employeeController from './employee.controller.js';
import express from 'express';
const router = express.Router();

router.post('/create', employeeController.create);
router.post('/update', employeeController.update);
router.get('/:employee_id', employeeController.getEmployee);
router.get('/', employeeController.getAllEmployee);
export default router;
