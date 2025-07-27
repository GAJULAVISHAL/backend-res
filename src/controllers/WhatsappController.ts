import prisma from '../lib/prisma';

export async function handleWhatsAppWebhook(req: any, res: any) {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    // Ensure we have a valid message with text
    if (message?.from && message?.text?.body) {
      const customerNumber = message.from;
      const customerReply = message.text.body;

      // First, save the raw response to your database
      await prisma.whatsAppResponse.create({
        data: {
          from: customerNumber,
          message: customerReply,
        },
      });

      // Now, check if the reply was "Yes" (case-insensitive)
      if (customerReply.trim().toLowerCase() === 'yes') {
        // Find the customer by their WhatsApp number
        const customer = await prisma.customer.findUnique({
          where: { whatsappNumber: customerNumber },
        });

        if (!customer) {
          console.log(`Customer with number ${customerNumber} not found.`);
          return res.sendStatus(200);
        }

        // Find the customer's most recent active order
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
          console.log(`No active order found for customer ${customer.id}.`);
          return res.sendStatus(200);
        }

        // Check if there are any meals left
        if (activeOrder.mealQuantity <= 0) {
          console.log(`Order ${activeOrder.id} has no meals left.`);
          // Optionally, send a message to the user telling them their plan has expired
          return res.sendStatus(200);
        }

        // Create a new delivery record for today
        await prisma.delivery.create({
          data: {
            orderId: activeOrder.id,
            deliveryDate: new Date().toISOString().split('T')[0],
            mealType: activeOrder.mealSplit, // Use mealSplit from the order
            customerResponse: 'Yes',
            deliveryStatus: 'scheduled', // A new status for confirmed meals
          },
        });

        // Decrement the meal quantity on the original order
        await prisma.order.update({
          where: { id: activeOrder.id },
          data: {
            mealQuantity: {
              decrement: 1,
            },
          },
        });

        console.log(`Delivery created and meal count updated for order ${activeOrder.id}.`);
      }
    }

    // Always respond to Meta with a success status
    res.sendStatus(200);

  } catch (error) {
    console.error('Error in handleWhatsAppWebhook:', error);
    res.sendStatus(200); // Still send 200 to prevent webhook deactivation
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