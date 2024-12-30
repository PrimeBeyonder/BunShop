import { PrismaClient, Payment } from '@prisma/client';
import { AppError} from "../utils/ errorHandler.ts";
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const processPayment = async (orderId: number, amount: number, currency: string, paymentMethod: string): Promise<Payment> => {
    try {
        //Fake Payment Delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        //Fake 20/100 possibility of failed payment request
        const isSuccessful = Math.random() < 0.8;

        if(!isSuccessful) {
            thorw new AppError("Payment Failed" , 400);
        }

        const payment = await prisma.payment.create({
            data: {
                orderId,
                amount,
                currency,
                status: "COMPLETED",
                paymentMethod,
                transactionId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            },
        });

        logger.info({ paymentId: payment.id, orderId }, 'Payment processed successfully');
        return payment;
    }catch(err) {
        logger.error({ error, orderId }, 'Failed to process payment');
        throw error;
    }
}

export const refundPayment = async (paymentId: number, amount: number): Promise<Payment> => {
    try {
        //Fake Refund Delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'REFUNDED',
                amount: { decrement: amount },
            },
        });

        logger.info({ paymentId, amount }, 'Payment refunded successfully');

        return payment;
    } catch (error) {
        logger.error({ error, paymentId }, 'Failed to refund payment');
        throw error;
    }
};