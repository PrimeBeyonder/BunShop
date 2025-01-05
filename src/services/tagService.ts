import { PrismaClient, Tag } from '@prisma/client';

const prisma = new PrismaClient();

export const createTag = async (data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tag> => {
    return prisma.tag.create({ data });
};

export const getTagById = async (id: number): Promise<Tag | null> => {
    return prisma.tag.findUnique({
        where: { id },
        include: { products: true }
    });
};

export const getAllTags = async (): Promise<Tag[]> => {
    return prisma.tag.findMany();
};

export const updateTag = async (id: number, data: Partial<Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tag> => {
    return prisma.tag.update({
        where: { id },
        data
    });
};

export const deleteTag = async (id: number): Promise<void> => {
    await prisma.tag.delete({ where: { id } });
};

