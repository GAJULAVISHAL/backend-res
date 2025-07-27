import prisma from "../lib/prisma";
import { startOfDay, endOfDay } from 'date-fns';
import { sendMenuTemplate } from "../lib/WhatsappService";

export async function createOrder(req: any, res: any) {
  console.log('\n[OrderController] 🚀 Starting createOrder process...');
  console.log('[OrderController] Received request body:', req.body);

  try {
    const {
      customerId,
      mealQuantity,
      mealSplit,
      totalAmount,
      paymentId,
      whatsappNumber
    } = req.body;

    if (!customerId || !mealQuantity || !mealSplit || !totalAmount || !whatsappNumber) {
      console.log('[OrderController] 🛑 Validation failed: Missing required fields.');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`[OrderController] 🔍 Searching for menu for date: ${new Date().toISOString().split('T')[0]} and type: ${mealSplit}`);
    const today = new Date().toISOString().split('T')[0];
    const menu = await prisma.menu.findFirst({
      where: {
        menuDate: today,
        menuType: mealSplit,
      },
    });

    if (!menu) {
      console.log('[OrderController] 🛑 Menu not found.');
      return res.status(404).json({ error: `No ${mealSplit} menu found for today.` });
    }

    console.log('[OrderController] ✅ Menu found:', menu);
    console.log('[OrderController] 📲 Preparing to send WhatsApp message...');

    const menuItemsString = "- " + menu.menuItems.join('\n- ');
    const messageSent = await sendMenuTemplate(whatsappNumber, menu.menuType, menuItemsString);

    if (messageSent) {
      console.log('[OrderController] ✅ WhatsApp message sent successfully.');
      console.log('[OrderController] 💾 Inserting order into database...');

      const newOrder = await prisma.order.create({
        data: {
          customerId,
          mealQuantity,
          mealSplit,
          totalAmount,
          paymentId,
          paymentStatus: 'pending',
          orderStatus: 'active',
        }
      });

      console.log('[OrderController] ✅ Order created successfully with ID:', newOrder.id);
      return res.status(201).json({ success: true, data: newOrder });

    } else {
      console.log('[OrderController] 🛑 Failed to send WhatsApp message. Order will not be created.');
      return res.status(500).json({ success: false, error: 'Failed to send WhatsApp confirmation.' });
    }

  } catch (error) {
    console.error('[OrderController] ❌ An unexpected error occurred:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}



export const getTodayOrders = async (req: any, res: any) => {
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: true,
        deliveries: true,
      },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching today’s orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const getAllOrders = async (req: any, res: any) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: true,
        deliveries: true,
      },
    });
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
