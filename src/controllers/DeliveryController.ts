import prisma from '../lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

// GET today's confirmed deliveries
export const getTodayDeliveries = async (req: any, res: any) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const deliveries = await prisma.delivery.findMany({
      where: {
        deliveryDate: today,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        // Include the parent order, and within that, the customer
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    res.status(200).json({ success: true, deliveries });
  } catch (error) {
    console.error('Error fetching today’s deliveries:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PATCH a delivery's status
export const updateDeliveryStatus = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const updatedDelivery = await prisma.delivery.update({
            where: { id: parseInt(id) },
            data: {
                deliveryStatus: status,
                // Optionally update the deliveredAt timestamp if status is 'delivered'
                ...(status === 'delivered' && { deliveredAt: new Date() }),
            }
        });

        res.status(200).json({ success: true, delivery: updatedDelivery });

    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};