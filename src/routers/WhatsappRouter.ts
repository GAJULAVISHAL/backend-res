import express from 'express';
import { getWhatsAppResponses, handleWhatsAppWebhook, verifyWhatsAppWebhook } from '../controllers/WhatsappController';

export const whatsAppRouter = express.Router();

whatsAppRouter.post('/webhook', handleWhatsAppWebhook);
whatsAppRouter.get('/responses', getWhatsAppResponses);
whatsAppRouter.get('/webhook', verifyWhatsAppWebhook);