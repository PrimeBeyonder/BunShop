import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { handleError, AppError} from "../utils/ errorHandler.ts";
import logger from '../utils/logger';
import { verifyToken, Roles, Role } from '../utils/auth';
import * as orderService from '../services/orderService';
import {orderSchema, orderItemSchema } from "../schema/indes.ts";

const prisma = new PrismaClient();


const authenticateUser = async (request: Request) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('Token missing or malformed', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const { userId } = decoded;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

export const orderRoutes = new Elysia({ prefix: '/orders' })
    .post('/', async ({ body, request }) => {
        try {
            const user = await authenticateUser(request);
            const { items, paymentMethod } = orderSchema.parse(body);

            const order = await orderService.createOrder(user.id, items, paymentMethod);

            logger.info({ orderId: order.id }, 'Order created and paid successfully');
            return new Response(
                JSON.stringify({ message: 'Order created and paid successfully', order }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to create and process payment for order');
            return handleError(error);
        }
    })
    .get('/', async ({ request }) => {
        try {
            const user = await authenticateUser(request);
            const orders = await orderService.getUserOrders(user.id);
            logger.info('Orders retrieved successfully');
            return new Response(
                JSON.stringify({ orders }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve orders');
            return handleError(error);
        }
    })
    .get('/:id', async ({ params: { id }, request }) => {
        try {
            const user = await authenticateUser(request);
            const order = await orderService.getOrderById(Number(id));
            if (order.userId !== user.id && user.role !== Roles.ADMIN) {
                throw new AppError('Unauthorized', 403);
            }
            logger.info({ orderId: id }, 'Order retrieved successfully');
            return new Response(
                JSON.stringify({ order }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve order');
            return handleError(error);
        }
    })
    .put('/:id/cancel', async ({ params: { id }, request }) => {
        try {
            const user = await authenticateUser(request);
            const order = await orderService.getOrderById(Number(id));
            if (order.userId !== user.id && user.role !== Roles.ADMIN) {
                throw new AppError('Unauthorized', 403);
            }
            const cancelledOrder = await orderService.cancelOrder(Number(id));
            logger.info({ orderId: id }, 'Order cancelled successfully');
            return new Response(
                JSON.stringify({ message: 'Order cancelled successfully', order: cancelledOrder }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to cancel order');
            return handleError(error);
        }
    });

