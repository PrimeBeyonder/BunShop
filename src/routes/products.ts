import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { handleError, AppError} from "../utils/ errorHandler.ts";
import logger from '../utils/logger';
import { authMiddleware } from '../middleware/auth';
import { Roles,Role } from '../utils/auth';
import {productSchema} from "../schema/indes.ts";

const prisma = new PrismaClient();

export const productRoutes = new Elysia({ prefix: '/products' })
    .use(authMiddleware)
    .post('/', async ({ body, authorize }) => {
        try {
            await authorize([Roles.ADMIN, Roles.MANAGER]);
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
            const { error: errorMessage, statusCode } = handleError(error);
            return new Response(
                JSON.stringify({ error: errorMessage }),
                { status: statusCode, headers: { 'Content-Type': 'application/json' } }
            );
        }
    })
    .get('/', async () => {
        try {
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
            const { error: errorMessage, statusCode } = handleError(error);
            return new Response(
                JSON.stringify({ error: errorMessage }),
                { status: statusCode, headers: { 'Content-Type': 'application/json' } }
            );
        }
    })
    .get('/:id', async ({ params: { id } }) => {
        try {
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
            const { error: errorMessage, statusCode } = handleError(error);
            return new Response(
                JSON.stringify({ error: errorMessage }),
                { status: statusCode, headers: { 'Content-Type': 'application/json' } }
            );
        }
    })
    .put('/:id', async ({ params: { id }, body, authorize }) => {
        try {
            await authorize([Roles.ADMIN, Roles.MANAGER]);
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
            const { error: errorMessage, statusCode } = handleError(error);
            return new Response(
                JSON.stringify({ error: errorMessage }),
                { status: statusCode, headers: { 'Content-Type': 'application/json' } }
            );
        }
    })
    .delete('/:id', async ({ params: { id }, authorize }) => {
        try {
            await authorize([Roles.ADMIN]);
            await prisma.product.delete({ where: { id: Number(id) } });
            logger.info({ productId: id }, 'Product deleted successfully');
            return new Response(
                JSON.stringify({ message: 'Product deleted successfully' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to delete product');
            const { error: errorMessage, statusCode } = handleError(error);
            return new Response(
                JSON.stringify({ error: errorMessage }),
                { status: statusCode, headers: { 'Content-Type': 'application/json' } }
            );
        }
    });

