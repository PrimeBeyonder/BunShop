import {Prisma, PrismaClient} from '@prisma/client';
import { AppError} from "../utils/ errorHandler.ts";

const prisma = new PrismaClient();

// Define a type that matches your review creation needs
type CreateReviewData = {
    userId: number;
    productId: number;
    rating: number;
    comment: string | null;
};

export const createReview = async (data: CreateReviewData) => {
    return prisma.review.create({
        data: data
    });
};

export const getReviewById = async (id: number): Promise<Prisma.ReviewGetPayload<{}> | null> => {
    return prisma.review.findUnique({ where: { id } });
};

export const getReviewsByProductId = async (productId: number): Promise<Prisma.ReviewGetPayload<{
    include: { user: { select: { id: true; name: true } } }
}>[]> => {
    return prisma.review.findMany({
        where: { productId },
        include: { user: { select: { id: true, name: true } } }
    });
};

export const updateReview = async (id: number, data: Prisma.ReviewUpdateInput): Promise<Prisma.ReviewGetPayload<{}>> => {
    return prisma.review.update({
        where: { id },
        data
    });
};

export const deleteReview = async (id: number): Promise<void> => {
    await prisma.review.delete({ where: { id } });
};

export const getAverageRatingForProduct = async (productId: number): Promise<number> => {
    const result = await prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true }
    });
    return result._avg.rating || 0;
};

