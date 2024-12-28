import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { handleError, AppError} from "../utils/ errorHandler.ts";
import {productSchema} from "../schema/indes.ts";
import logger from '../utils/logger';
import { verifyToken, Roles, Role } from '../utils/auth';

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

export const productRoutes = new Elysia({ prefix: '/products' })
    .post('/', async ({ body, request }) => {
        try {
            const user = await authenticateUser(request);
            if (![Roles.ADMIN, Roles.MANAGER].includes(user.role as Role)) {
                throw new AppError('Unauthorized', 403);
            }
            const validatedData = productSchema.parse(body);
            const product = await prisma.product.create({
                data: validatedData,
            });
            logger.info({ product }, 'Product created successfully');
            return new Response(
                JSON.stringify({ message: 'Product created successfully', product }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to create product');
            return handleError(error);
        }
    })
    .get('/', async ({ request }) => {
        try {
            await authenticateUser(request);
            const products = await prisma.product.findMany({
                where: { isActive: true }
            });
            logger.info('Products retrieved successfully');
            return new Response(
                JSON.stringify({ products }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve products');
            return handleError(error);
        }
    })
    .get('/:id', async ({ params: { id }, request }) => {
        try {
            await authenticateUser(request);
            const product = await prisma.product.findUnique({
                where: { id: Number(id) },
            });
            if (!product) {
                throw new AppError('Product not found', 404);
            }
            logger.info({ product }, 'Product retrieved successfully');
            return new Response(
                JSON.stringify({ product }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve product');
            return handleError(error);
        }
    })
    .put('/:id', async ({ params: { id }, body, request }) => {
        try {
            const user = await authenticateUser(request);
            if (![Roles.ADMIN, Roles.MANAGER].includes(user.role as Role)) {
                throw new AppError('Unauthorized', 403);
            }
            const validatedData = productSchema.partial().parse(body);
            const updatedProduct = await prisma.product.update({
                where: { id: Number(id) },
                data: validatedData,
            });
            logger.info({ updatedProduct }, 'Product updated successfully');
            return new Response(
                JSON.stringify({ message: 'Product updated successfully', product: updatedProduct }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to update product');
            return handleError(error);
        }
    })
    .delete('/:id', async ({ params: { id }, request }) => {
        try {
            const user = await authenticateUser(request);
            if (user.role !== Roles.ADMIN) {
                throw new AppError('Unauthorized', 403);
            }
            await prisma.product.delete({ where: { id: Number(id) } });
            logger.info({ productId: id }, 'Product deleted successfully');
            return new Response(
                JSON.stringify({ message: 'Product deleted successfully' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to delete product');
            return handleError(error);
        }
    });

