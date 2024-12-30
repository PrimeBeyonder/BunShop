import { PrismaClient, Order, OrderItem } from '@prisma/client';
import { AppError} from "../utils/ errorHandler.ts";
import logger from '../utils/logger';
import { processPayment, refundPayment} from "./paymentSservice.ts";

const prisma = new PrismaClient();

export const createOrder = async (userId: number, items: { productId: number; quantity: number }[], paymentMethod: string): Promise<Order> => {
    return prisma.$transaction(async (prisma) => {
        const orderItems = await Promise.all(items.map(async (item) => {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) {
                throw new AppError(`Product with id ${item.productId} not found`, 404);
            }
            if (product.stockCount < item.quantity) {
                throw new AppError(`Insufficient stock for product ${product.name}`, 400);
            }
            return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            };
        }));

        const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const order = await prisma.order.create({
            data: {
                userId,
                status: 'PENDING',
                total,
                orderItems: {
                    create: orderItems
                }
            },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            }
        });

        // Process payment
        try {
            await processPayment(order.id, total, 'USD', paymentMethod);

            // Update order status to PAID
            await prisma.order.update({
                where: { id: order.id },
                data: { status: 'PAID' }
            });

            // Update inventory
            for (const item of orderItems) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { stockCount: { decrement: item.quantity } }
                });
            }
        } catch (error) {
            // If payment fails, update order status to PAYMENT_FAILED
            await prisma.order.update({
                where: { id: order.id },
                data: { status: 'PAYMENT_FAILED' }
            });
            throw new AppError('Payment processing failed', 400);
        }

        logger.info({ orderId: order.id }, 'Order created and paid successfully');
        return order;
    });
};

export const getOrderById = async (id: number): Promise<Order> => {
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            orderItems: {
                include: {
                    product: true
                }
            },
            payment: true
        }
    });
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    return order;
};

export const updateOrderStatus = async (id: number, status: string): Promise<Order> => {
    return prisma.order.update({
        where: { id },
        data: { status },
        include: {
            orderItems: {
                include: {
                    product: true
                }
            },
            payment: true,
        }
    });
};

export const cancelOrder = async (id: number): Promise<Order> => {
    return prisma.$transaction(async (prisma) => {
        const order = await prisma.order.findUnique({
            where: { id },
            include: { orderItems: true, payment: true }
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.status !== 'PENDING' && order.status !== 'PAID') {
            throw new AppError('Only pending or paid orders can be cancelled', 400);
        }

        // Refund payment if it was made
        if (order.payment && order.payment.status === 'COMPLETED') {
            await refundPayment(order.payment.id, order.payment.amount);
        }

        // Restore product stock
        for (const item of order.orderItems) {
            await prisma.product.update({
                where: { id: item.productId },
                data: { stockCount: { increment: item.quantity } }
            });
        }

        // Update order status
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date()
            },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                },
                payment: true
            }
        });

        logger.info({ orderId: id }, 'Order cancelled successfully');
        return updatedOrder;
    });
};

export const getUserOrders = async (userId: number): Promise<Order[]> => {
    return prisma.order.findMany({
        where: { userId },
        include: {
            orderItems: {
                include: {
                    product: true
                }
            },
            payment: true
        },
        orderBy: { createdAt: 'desc' }
    });
};
