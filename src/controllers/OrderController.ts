import prisma from "../lib/prisma";
import { startOfDay, endOfDay } from 'date-fns';
import { sendMenuTemplate } from "../lib/WhatsappService";

export async function createOrder(req: any, res: any) {
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

    // Find today's menu that matches the order's meal split (e.g., "Lunch")
    const today = new Date().toISOString().split('T')[0];
    const menu = await prisma.menu.findFirst({
      where: {
        menuDate: today,
        menuType: newOrder.mealSplit,
      },
    });

    if (menu) {
      // 👇 2. Format the menu items array into a single string with line breaks
      const menuItemsString = "- " + menu.menuItems.join('\n- ');

      // 👇 3. Call the new `sendMenuTemplate` function with the correct parameters
      await sendMenuTemplate(whatsappNumber, menu.menuType, menuItemsString);
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
