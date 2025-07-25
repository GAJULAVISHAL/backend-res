// src/controllers/WhatsAppController.ts

import prisma from '../lib/prisma';

export async function handleWhatsAppWebhook(req: any, res: any) {
  const { from, text } = req.body;

  try {
    await prisma.whatsAppResponse.create({
      data: {
        from,
        message: text.body,
      },
    });
    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    res.sendStatus(500);
  }
}

export async function getWhatsAppResponses(req: any, res: any) {
  try {
    const responses = await prisma.whatsAppResponse.findMany({
      orderBy: {
        createdAt: 'desc', // Show the newest messages first
      },
    });
    res.status(200).json({ success: true, responses: responses });
  } catch (error) {
    console.error('Error fetching WhatsApp responses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export function verifyWhatsAppWebhook(req: any, res: any) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN; // Your secret token

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
}