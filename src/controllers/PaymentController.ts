import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { sendMenuTemplate } from '../lib/WhatsappService';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});


export const createRazorpayOrder = async (req: Request, res: Response) => {
    try {
        const { amount, currency = 'INR' } = req.body;
        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        const options = {
            amount: amount * 100, // Amount in paisa
            currency,
            receipt: `receipt_${new Date().getTime()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);
        if (!razorpayOrder) {
            return res.status(500).json({ error: 'Failed to create Razorpay order' });
        }

        res.status(200).json({ success: true, order: razorpayOrder });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const verifyPayment = async (req: Request, res: Response) => {
    console.log('\n[PaymentController] 🚀 Starting payment verification process...');
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            customerId,
            mealQuantity,
            mealSplit,
            totalAmount,
            whatsappNumber
        } = req.body;

        // --- Step 1: Verify Payment Signature ---
        console.log('[PaymentController] 🔐 Verifying payment signature...');
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.log('[PaymentController] 🛑 Payment verification failed: Signatures do not match.');
            return res.status(400).json({ success: false, error: 'Payment verification failed' });
        }
        console.log('[PaymentController] ✅ Payment signature verified successfully.');

        // --- Step 2: Send WhatsApp Confirmation Message ---
        console.log('[PaymentController] 📲 Attempting to send WhatsApp menu before creating order...');
        const today = new Date().toISOString().split('T')[0];
        const menu = await prisma.menu.findFirst({
            where: { menuDate: today, menuType: mealSplit },
        });

        if (!menu) {
            console.log(`[PaymentController] 🛑 Menu not found for ${mealSplit}. Cannot send message or create order.`);
            return res.status(404).json({ error: `No ${mealSplit} menu found for today.` });
        }

        const menuItemsString = menu.menuItems.join(', ');
        const messageSent = await sendMenuTemplate(whatsappNumber, menu.menuType, menuItemsString);

        // --- Step 3: Conditionally Create the Order ---
        if (messageSent) {
            console.log('[PaymentController] ✅ WhatsApp message sent successfully. Proceeding to create order...');
            const newOrder = await prisma.order.create({
                data: {
                    customerId,
                    mealQuantity,
                    mealSplit,
                    totalAmount,
                    paymentId: razorpay_payment_id,
                    paymentStatus: 'success',
                    orderStatus: 'active',
                },
            });

            console.log(`[PaymentController] ✅ Order created successfully with ID: ${newOrder.id}`);
            return res.status(201).json({
                success: true,
                message: 'Payment verified and order created successfully!',
                orderId: newOrder.id,
            });
        } else {
            console.log('[PaymentController] 🛑 Failed to send WhatsApp message. Order creation aborted.');
            // IMPORTANT: Since the payment was successful but the message failed,
            // you should have a process to handle this, e.g., manual follow-up.
            return res.status(500).json({
                success: false,
                error: 'Payment was successful, but we failed to send the confirmation message. Please contact support.',
                paymentId: razorpay_payment_id // Return the payment ID for reference
            });
        }

    } catch (error) {
        console.error('[PaymentController] ❌ An unexpected error occurred during payment verification:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};