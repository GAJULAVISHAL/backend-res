import prisma from '../lib/prisma';

export async function handleWhatsAppWebhook(req: any, res: any) {
  console.log('\n[Webhook] Incoming request at:', new Date().toISOString());
  console.log('[Webhook] 📥 Full incoming payload:', JSON.stringify(req.body, null, 2));

  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message?.from && message?.text?.body) {
      const customerNumber = message.from;
      const customerReply = message.text.body;

      console.log(`[Webhook] 📩 Message received from: ${customerNumber} | Reply: "${customerReply}"`);

      // First, save the raw response to your database
      await prisma.whatsAppResponse.create({
        data: {
          from: customerNumber,
          message: customerReply,
        },
      });
      console.log('[Webhook] ✅ Raw response saved to database.');

      // Now, check if the reply was "Yes"
      console.log(`[Webhook] ❓ Checking if reply is "Yes"...`);
      if (customerReply.trim().toLowerCase() === 'yes') {
        console.log('[Webhook] ✅ Reply is "Yes". Starting delivery creation process...');

        // Find the customer by their WhatsApp number
        console.log(`[Webhook] 🔍 Finding customer with number: ${customerNumber}`);
        const customer = await prisma.customer.findUnique({
          where: { whatsappNumber: customerNumber },
        });

        if (!customer) {
          console.log(`[Webhook] 🛑 Customer with number ${customerNumber} not found. Stopping process.`);
          return res.sendStatus(200);
        }
        console.log(`[Webhook] ✅ Found customer with ID: ${customer.id}`);

        // Find the customer's most recent active order
        console.log(`[Webhook] 🔍 Finding active order for customer ID: ${customer.id}`);
        const activeOrder = await prisma.order.findFirst({
          where: {
            customerId: customer.id,
            orderStatus: 'active',
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!activeOrder) {
          console.log(`[Webhook] 🛑 No active order found for customer ${customer.id}. Stopping process.`);
          return res.sendStatus(200);
        }
        console.log(`[Webhook] ✅ Found active order with ID: ${activeOrder.id} | Meals remaining: ${activeOrder.mealQuantity}`);

        // Check if there are any meals left
        if (activeOrder.mealQuantity <= 0) {
          console.log(`[Webhook] 🛑 Order ${activeOrder.id} has no meals left. Stopping process.`);
          return res.sendStatus(200);
        }

        // Create a new delivery record for today
        console.log(`[Webhook] 📝 Creating delivery record for order ID: ${activeOrder.id}`);
        await prisma.delivery.create({
          data: {
            orderId: activeOrder.id,
            deliveryDate: new Date().toISOString().split('T')[0],
            mealType: activeOrder.mealSplit,
            customerResponse: 'Yes',
            deliveryStatus: 'scheduled',
          },
        });
        console.log('[Webhook] ✅ Delivery record created successfully.');

        // Decrement the meal quantity on the original order
        console.log(`[Webhook] ⬇️ Decrementing meal quantity for order ID: ${activeOrder.id}`);
        const updatedOrder = await prisma.order.update({
          where: { id: activeOrder.id },
          data: {
            mealQuantity: {
              decrement: 1,
            },
          },
        });
        console.log(`[Webhook] ✅ Meal quantity updated. New count: ${updatedOrder.mealQuantity}`);
      
      } else {
        console.log('[Webhook] ℹ️ Reply was not "Yes". No action taken.');
      }
    } else {
        console.log('[Webhook] ⚠️ Payload did not contain a valid message object.');
    }

    // Always respond to Meta with a success status
    console.log('[Webhook] ✅ Process complete. Sending 200 OK response to Meta.');
    res.sendStatus(200);

  } catch (error) {
    console.error('[Webhook] ❌ An unexpected error occurred:', error);
    res.sendStatus(200); // Still send 200 to prevent webhook deactivation
  }
}

// ... keep your other functions (getWhatsAppResponses, verifyWhatsAppWebhook)
export async function getWhatsAppResponses(req: any, res: any) {
    try {
      const responses = await prisma.whatsAppResponse.findMany({
        orderBy: {
          createdAt: 'desc',
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
        console.log('[Webhook] ✅ Verification successful!');
        res.status(200).send(challenge);
      } else {
        console.log('[Webhook] 🛑 Verification failed: Tokens do not match.');
        res.sendStatus(403);
      }
    }
}