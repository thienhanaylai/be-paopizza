import express from 'express';
import * as customerController from './customer.controller.js';

const router = express.Router();

router.post('/register', customerController.register);

export default router;
