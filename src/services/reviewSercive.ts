import { PrismaClient, Review } from '@prisma/client';
import { AppError} from "../utils/ errorHandler.ts";

const prisma = new PrismaClient();

export const createReview = async (data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review> => {
    return prisma.review.create({ data });
};

export const getReviewsByProductId = async (productId: number): Promise<Review[]> => {
    return prisma.review.findMany({
        where: { productId },
        include: { user: { select: { id: true, name: true } } }
    });
};

export const updateReview = async (id: number, data: Partial<Omit<Review, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Review> => {
    return prisma.review.update({
        where: { id },
        data
    })
}

export const deleteReview = async (id: number): Promise<void> => {
    await prisma.review.delete({ where: { id } });
}

export const getAverageRatingForProduct = async (productId: number): Promise<number> => {
    const result = await prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true }
    });
    return result._avg.rating || 0;
};