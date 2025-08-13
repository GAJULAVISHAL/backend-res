import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function handleWhatsAppWebhook(req: Request, res: Response) {
  console.log('\n[Webhook] Incoming request at:', new Date().toISOString());
  console.log('[Webhook] 📥 Full incoming payload:', JSON.stringify(req.body, null, 2));

  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message?.from) {
      const customerNumber = message.from;
      let customerReply = '';

      // 👇 NEW: Check for either a button reply OR a text reply
      if (message.type === 'button' && message.button?.text) {
        customerReply = message.button.text;
        console.log(`[Webhook] Button reply detected: "${customerReply}"`);
      } else if (message.type === 'text' && message.text?.body) {
        customerReply = message.text.body;
        console.log(`[Webhook] Text reply detected: "${customerReply}"`);
      }

      if (customerReply) {
        // --- The rest of your logic remains the same ---
        console.log(`[Webhook] 📩 Message received from: ${customerNumber} | Reply: "${customerReply}"`);

        await prisma.whatsAppResponse.create({
          data: { from: customerNumber, message: customerReply },
        });
        console.log('[Webhook] ✅ Raw response saved to database.');

        console.log(`[Webhook] ❓ Checking if reply is "Yes"...`);
        if (customerReply.trim().toLowerCase() === 'yes') {
          console.log('[Webhook] ✅ Reply is "Yes". Starting delivery creation process...');

          const customer = await prisma.customer.findUnique({ where: { whatsappNumber: customerNumber } });
          if (!customer) {
            console.log(`[Webhook] 🛑 Customer not found.`);
            return res.sendStatus(200);
          }
          console.log(`[Webhook] ✅ Found customer with ID: ${customer.id}`);

          const activeOrder = await prisma.order.findFirst({
            where: { customerId: customer.id, orderStatus: 'active' },
            orderBy: { createdAt: 'desc' },
          });
          if (!activeOrder) {
            console.log(`[Webhook] 🛑 No active order found.`);
            return res.sendStatus(200);
          }
          console.log(`[Webhook] ✅ Found active order with ID: ${activeOrder.id}`);

          if (activeOrder.mealQuantity <= 0) {
            console.log(`[Webhook] 🛑 Order has no meals left.`);
            return res.sendStatus(200);
          }

          console.log(`[Webhook] 📝 Creating delivery record...`);
          await prisma.delivery.create({
            data: {
              orderId: activeOrder.id,
              deliveryDate: new Date().toISOString().split('T')[0],
              mealType: activeOrder.mealSplit,
              customerResponse: 'Yes',
              deliveryStatus: 'scheduled',
            },
          });
          console.log('[Webhook] ✅ Delivery record created.');

          console.log(`[Webhook] ⬇️ Decrementing meal quantity...`);
          const updatedOrder = await prisma.order.update({
            where: { id: activeOrder.id },
            data: { mealQuantity: { decrement: 1 } },
          });
          console.log(`[Webhook] ✅ Meal quantity updated. New count: ${updatedOrder.mealQuantity}`);
        } else {
          console.log('[Webhook] ℹ️ Reply was not "Yes". No action taken.');
        }
      } else {
        console.log('[Webhook] ⚠️ Payload was not a button or text message.');
      }
    } else {
      console.log('[Webhook] ⚠️ Payload did not contain a valid message object.');
    }

    console.log('[Webhook] ✅ Process complete. Sending 200 OK response to Meta.');
    res.sendStatus(200);

  } catch (error) {
    console.error('[Webhook] ❌ An unexpected error occurred:', error);
    res.sendStatus(200);
  }
}

  
export function verifyWhatsAppWebhook(req: Request, res: Response) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
  
    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('[Webhook] ✅ Verification successful!');
        res.status(200).send(challenge);
      } else {
        console.log('[Webhook] 🛑 Verification failed: Tokens do not match.');
        res.sendStatus(403);
      }
    }
}