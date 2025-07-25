import prisma from "../lib/prisma";
import { startOfDay, endOfDay } from 'date-fns';
import { sendWhatsAppMessage } from "../lib/WhatsappService";

export async function createOrder(req: any, res: any) {
  try {
    const {
      customerId,
      mealQuantity,
      mealSplit, // 'lunch', 'dinner', 'both'
      totalAmount,
      paymentId
    } = req.body;

    if (!customerId || !mealQuantity || !mealSplit || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

    const today = new Date().toISOString().split('T')[0];
    const menu = await prisma.menu.findFirst({
      where: {
        menuDate: today,
        menuType: newOrder.mealSplit,
      },
    });

    if (menu) {
      const menuMessage = `Today's ${menu.menuType} menu:\n- ${menu.menuItems.join('\n- ')}`;
      await sendWhatsAppMessage(req.body.whatsappNumber, menuMessage);
    }

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Create order error:', error);
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
