import prisma from '../lib/prisma';
export async function handleWhatsAppWebhook(req: any, res: any) {
  try {
    // The actual message object is deeply nested inside the request body
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Check if a message object with the 'from' and 'text' properties exists
    if (message?.from && message?.text?.body) {
      // Create a record in your database
      await prisma.whatsAppResponse.create({
        data: {
          from: message.from,
          message: message.text.body,
        },
      });
    }
    res.sendStatus(200);

  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    // Even if your code has an error, send a 200 OK to prevent Meta from disabling your webhook
    res.sendStatus(200);
  }
}

// ... keep your other functions like getWhatsAppResponses and verifyWhatsAppWebhook

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
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

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