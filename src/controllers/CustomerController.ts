import { Request, Response } from "express";
import prisma from "../lib/prisma";
export async function createCustomer(req: Request, res: Response) {
    try{
        const{
            whatsappNumber,
            deliveryAddress,
        } = req.body;
        if(!whatsappNumber || !deliveryAddress) {
            return res.status(400).json({
                error: 'Missing required fields: whatsappNumber, deliveryAddress',
            });
        }
        const exisitingCustomer = await prisma.customer.findUnique({
            where: {
                whatsappNumber,
            },
        });
        if (exisitingCustomer) {
            return res.status(200).json({
                success: true,
                data: exisitingCustomer,
                message: 'Customer already exists',
            });
        }
        const newCustomer = await prisma.customer.create({
            data: {
                whatsappNumber,
                deliveryAddress,
            },
        });
        return res.status(201).json({
            success: true,
            data: newCustomer,
            message: 'Customer created successfully',
        });
    }catch (error) {
        console.error('Error creating customer:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getAllCustomers(req: Request, res: Response) {
  try {
    const customerCount = await prisma.customer.count();
    console.log("Total customers:", customerCount);

    return res.status(200).json({
      success: true,
      count: customerCount,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}