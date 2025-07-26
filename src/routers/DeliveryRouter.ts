import express from 'express';
import { getTodayDeliveries, updateDeliveryStatus } from '../controllers/DeliveryController';

export const deliveryRouter = express.Router();

// Route to get today's deliveries
deliveryRouter.get('/today', getTodayDeliveries);

// Route to update a specific delivery by its ID
deliveryRouter.patch('/:id/status', updateDeliveryStatus);