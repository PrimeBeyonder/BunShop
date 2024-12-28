import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import {orderItemSchema, orderSchema} from "../schema/indes.ts";
import { handleError, AppError} from "../utils/ errorHandler.ts";
import logger from '../utils/logger';
import { verifyToken, Roles, Role } from '../utils/auth';

const prisma = new PrismaClient();

const authenticateUser = async (request: Request)=>{
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError("Token missing or malformed" , 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const {userId} = decoded;
    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) {
        throw new AppError("No User Found" , 401);
    }
    return user;
}

export const orderRoutes = new Elysia({ prefix: '/orders' })
    .post('/', async ({ body, request }) => {
        try {
            const user = await authenticateUser(request);
            const { items } = orderSchema.parse(body);

            let total = 0;
            const orderItems = [];

            for (const item of items) {
                const product = await prisma.product.findUnique({ where: { id: item.productId } });
                if (!product) {
                    throw new AppError(`Product with id ${item.productId} not found`, 404);
                }
                if (product.stockCount < item.quantity) {
                    throw new AppError(`Not enough stock for product ${product.name}`, 400);
                }
                total += product.price * item.quantity;
                orderItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: product.price,
                });
            }

            const order = await prisma.order.create({
                data: {
                    userId: user.id,
                    status: 'PENDING',
                    total,
                    orderItems: {
                        create: orderItems,
                    },
                },
                include: {
                    orderItems: true,
                },
            });

            // Update product stock
            for (const item of items) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { stockCount: { decrement: item.quantity } },
                });
            }

            logger.info({ orderId: order.id }, 'Order created successfully');
            return new Response(
                JSON.stringify({ message: 'Order created successfully', order }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to create order');
            return handleError(error);
        }
    })
    .get('/', async ({ request }) => {
        try {
            const user = await authenticateUser(request);
            const orders = await prisma.order.findMany({
                where: { userId: user.id },
                include: { orderItems: { include: { product: true } } },
            });
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
            const order = await prisma.order.findUnique({
                where: { id: Number(id) },
                include: { orderItems: { include: { product: true } } },
            });
            if (!order) {
                throw new AppError('Order not found', 404);
            }
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
    .put('/:id/status', async ({ params: { id }, body, request }) => {
        try {
            const user = await authenticateUser(request);
            if (![Roles.ADMIN, Roles.MANAGER].includes(user.role as Role)) {
                throw new AppError('Unauthorized', 403);
            }
            const { status } = body;
            const updatedOrder = await prisma.order.update({
                where: { id: Number(id) },
                data: { status },
                include: { orderItems: { include: { product: true } } },
            });
            logger.info({ orderId: id, status }, 'Order status updated successfully');
            return new Response(
                JSON.stringify({ message: 'Order status updated successfully', order: updatedOrder }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to update order status');
            return handleError(error);
        }
    }, {
        body: t.Object({
            status: t.String(),
        }),
    });