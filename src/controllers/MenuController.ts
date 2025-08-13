import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendMenuTemplate } from '../lib/WhatsappService';

export async function createMenu(req: Request, res: Response) {
    console.log('\n[MenuController] 🚀 Starting createMenu process at:', new Date().toISOString());
    try {
        const { menuType, menuDate, menuItems } = req.body;
        console.log('[MenuController] Received request body:', req.body);

        // Input validation
        if (!menuType || !menuDate || !menuItems || !Array.isArray(menuItems) || menuItems.length === 0) {
            console.log('[MenuController] 🛑 Validation failed: Missing or invalid required fields.');
            return res.status(400).json({ error: 'Missing or invalid required fields' });
        }
        console.log(`[MenuController] ✅ Validation passed for ${menuType} menu on ${menuDate}.`);

        // Step 1: Create the menu in the database
        console.log('[MenuController] 💾 Creating menu in database...');
        const newMenu = await prisma.menu.create({
            data: {
                menuType,
                menuDate,
                menuItems,
            },
        });
        console.log(`[MenuController] ✅ Menu created successfully with ID: ${newMenu.id}`);

        // --- Start Notification Logic ---
        console.log('[MenuController] 🚀 Starting customer notification process...');

        // Step 2: Find all active orders with meals remaining
        const activeOrders = await prisma.order.findMany({
            where: {
                orderStatus: 'active',
                mealQuantity: { gt: 0 },
                mealSplit: menuType,
            },
            include: {
                customer: true,
            },
        });

        if (activeOrders.length === 0) {
            console.log(`[MenuController] ℹ️ No active customers found for ${menuType} menu. No messages will be sent.`);
            return res.status(201).json({
                success: true,
                data: newMenu,
                message: `Menu created successfully, but no active customers were found to notify.`
            });
        }

        console.log(`[MenuController] 🎯 Found ${activeOrders.length} customers to notify.`);
        const menuItemsString = menuItems.join(', ');
        let successfulSends = 0;

        // Step 3: Loop through each order and send the message
        for (const order of activeOrders) {
            if (order.customer.whatsappNumber) {
                console.log(`[MenuController] 📲 Attempting to send message to customer ID: ${order.customerId} (${order.customer.whatsappNumber})`);
                const wasSent = await sendMenuTemplate(
                    order.customer.whatsappNumber,
                    menuType,
                    menuItemsString
                );
                if (wasSent) {
                    successfulSends++;
                    console.log(`[MenuController] ✅ Successfully sent message to ${order.customer.whatsappNumber}`);
                } else {
                    console.log(`[MenuController] ❌ Failed to send message to ${order.customer.whatsappNumber}`);
                }
            } else {
                console.log(`[MenuController] ⚠️ Customer ID: ${order.customerId} has no WhatsApp number.`);
            }
        }
        
        console.log(`[MenuController] ✅ Notification process complete.`);
        return res.status(201).json({
            success: true,
            data: newMenu,
            message: `Menu created and notifications sent to ${successfulSends} of ${activeOrders.length} customers.`,
        });

    } catch (error) {
        console.error('[MenuController] ❌ An unexpected error occurred during the createMenu process:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


export async function getTodayMenu(req: Request, res: Response) {
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