import { PrismaClient, Category } from '@prisma/client';
import { AppError} from "../utils/ errorHandler.ts";

const prisma = new PrismaClient();

export const createCategory =async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
    return prisma.category.create({data});
};

export const getCategoryById = async (id: number): Promise<Category | null> => {
    return prisma.category.findUnique({
            where: {id: id},
            include: { subCategories: true, products: true }
        });
}
export const updateCategory = async (id: number, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category> => {
    return prisma.category.update({
        where: { id },
        data
    });
};
export const deleteCategory = async (id: number): Promise<void> => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: { subCategories: true, products: true }
    });

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    if (category.subCategories.length > 0 || category.products.length > 0) {
        throw new AppError('Cannot delete category with subcategories or products', 400);
    }

    await prisma.category.delete({ where: { id } });
};