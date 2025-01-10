import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { handleError, AppError} from "../utils/ errorHandler.ts";
import logger from '../utils/logger';
import { verifyToken, Roles, Role } from '../utils/auth';
import * as reviewService  from "../services/reviewSercive.ts"

const prisma = new PrismaClient();

const reviewSchema = z.object({
    productId: z.number(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
});

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

export const reviewRoutes = new Elysia({ prefix: '/reviews' })
    .post('/', async ({ body, request }) => {
        try {
            const user = await authenticateUser(request);
            const validatedData = reviewSchema.parse(body);

            const reviewData: ReviewCreateInput = {
                rating: validatedData.rating,
                comment: validatedData.comment,
                user: {
                    connect: { id: user.id }
                },
                product: {
                    connect: { id: validatedData.productId }
                }
            };

            const review = await reviewService.createReview(reviewData);
            logger.info({ reviewId: review.id }, 'Review created successfully');
            return new Response(
                JSON.stringify({ message: 'Review created successfully', review }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to create review');
            return handleError(error);
        }
    })
    .get('/product/:productId', async ({ params: { productId } }) => {
        try {
            const reviews = await reviewService.getReviewsByProductId(Number(productId));
            const averageRating = await reviewService.getAverageRatingForProduct(Number(productId));
            logger.info({ productId }, 'Reviews retrieved successfully');
            return new Response(
                JSON.stringify({ reviews, averageRating }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve reviews');
            return handleError(error);
        }
    })
    .put('/:id', async ({ params: { id }, body, request }) => {
        try {
            const user = await authenticateUser(request);
            const review = await reviewService.getReviewById(Number(id));
            if (!review) {
                throw new AppError('Review not found', 404);
            }
            if (review.userId !== user.id && user.role !== Roles.ADMIN) {
                throw new AppError('Unauthorized', 403);
            }
            const validatedData = reviewSchema.partial().parse(body);
            const updatedReview = await reviewService.updateReview(Number(id), {
                rating: validatedData.rating,
                comment: validatedData.comment
            });
            logger.info({ reviewId: id }, 'Review updated successfully');
            return new Response(
                JSON.stringify({ message: 'Review updated successfully', review: updatedReview }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } catch (error) {
            logger.error({ error }, 'Failed to update review');
            return handleError(error);
        }
    })