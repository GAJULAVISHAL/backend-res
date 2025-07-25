import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function createMenu(req: any, res: any) {
    try {
        const { menuType, menuDate, menuItems } = req.body;

        // Input validation
        if (!menuType || !menuDate || !menuItems) {
            return res.status(400).json({
                error: 'Missing required fields: menuType, menuDate, menuItems',
            });
        }

        if (!['lunch', 'dinner'].includes(menuType)) {
            return res.status(400).json({
                error: 'menuType must be either "lunch" or "dinner"',
            });
        }

        if (!Array.isArray(menuItems) || menuItems.length === 0) {
            return res.status(400).json({
                error: 'menuItems must be a non-empty array',
            });
        }

        const cleanedItems = menuItems.map((item: string) => item.trim()).filter(Boolean);

        const newMenu = await prisma.menu.create({
            data: {
                menuType,
                menuDate,
                menuItems: cleanedItems,
            },
        });

        return res.status(201).json({
            success: true,
            data: newMenu,
            message: `Menu for ${menuType} on ${menuDate} created successfully`,
        });
    } catch (error) {
        console.error('Error creating menu:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


export async function getTodayMenu(req: any, res: any) {
    try {
        const { menuType } = req.query;

        if (!menuType || !['lunch', 'dinner'].includes(menuType.toString())) {
            return res.status(400).json({
                error: 'Invalid or missing menuType. Must be "lunch" or "dinner".',
            });
        }

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        const menu = await prisma.menu.findFirst({
            where: {
                menuDate: formattedDate,
                menuType: menuType.toString(),
            },
            orderBy:{
                createdAt: 'desc',
            }
        });

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: `No ${menuType} menu found for ${formattedDate}`,
            });
        }

        return res.status(200).json({
            success: true,
            date: formattedDate,
            type: menuType,
            data: menu,
        });
    } catch (error) {
        console.error('Error fetching menu:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}