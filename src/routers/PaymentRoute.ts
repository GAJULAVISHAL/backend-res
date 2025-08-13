import express from 'express';
import { createRazorpayOrder, verifyPayment } from '../controllers/PaymentController';

export const paymentRouter = express.Router();

paymentRouter.post('/create-order', createRazorpayOrder);

paymentRouter.post('/verify', verifyPayment);