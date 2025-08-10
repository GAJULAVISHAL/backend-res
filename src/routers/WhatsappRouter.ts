import express from 'express';
import { handleWhatsAppWebhook, verifyWhatsAppWebhook } from '../controllers/WhatsappController';

export const whatsAppRouter = express.Router();

whatsAppRouter.post('/webhook', handleWhatsAppWebhook);
whatsAppRouter.get('/webhook', verifyWhatsAppWebhook);