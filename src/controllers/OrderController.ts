import { Request, Response } from 'express';
import prisma from "../lib/prisma";
import { startOfDay, endOfDay } from 'date-fns';

export const getTodayOrders = async (req: Request, res: Response) => {
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


export const getAllOrders = async (req: Request, res: Response) => {
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
