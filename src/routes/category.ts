import { Elysia } from 'elysia';
import { PrismaClient } from '@prisma/client';

import { handleError, AppError} from "../utils/ errorHandler.ts";

import { verifyToken, Roles, Role } from '../utils/auth';
import * as categoryService from '../services/categoryService';
import {categorySchema} from "../schema/indes.ts";
import logger from '../utils/logger.ts';

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

export const categoryRoutes = new Elysia({ prefix: '/categories' })
.post('/', async ({ body, request }) => {
    try {
      const user = await authenticateUser(request);
      if (![Roles.ADMIN, Roles.MANAGER].includes(user.role as Roles)) {
        throw new AppError('Unauthorized', 403);
      }
      const validatedData = categorySchema.parse(body);
      const categoryData: CategoryCreateInput = {
        name: validatedData.name,
        description: validatedData.description,
        parentId: validatedData.parentId,
      };
      const category = await categoryService.createCategory(categoryData);
      logger.info({ categoryId: category.id }, 'Category created successfully');
      return new Response(
        JSON.stringify({ message: 'Category created successfully', category }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      logger.error({ error }, 'Failed to create category');
      return handleError(error);
    }
  })
  .get("/" , async () => {
    try{
        const categories = await categoryService.getAllCategories();
        logger.info('Categories retrieved successfully');
        return new Response(
            JSON.stringify(categories),
            { status: 200, headers: { 'Content-Type': 'application/json' } }       
        )
    }catch(error){
        logger.error({ error }, 'Failed to retrieve categories');
        return handleError(error);
    }
  })
  .get("/:id", async ({params : {id}}) => {
    try{
        const category = await categoryService.getCategoryById(Number(id));
        if(!category){
            throw new AppError("Category Not Found", 404);
        }
        logger.info({categoryId: category.id}, "Category Retrieved Successfully");
        return new Response(
            JSON.stringify({ category }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        logger.error({ error }, 'Failed to retrieve category');
        return handleError(error);
      }
  })
  .put("/:id", async ({params: {id}, body, request}) => {
    try{
        const user = await authenticateUser(request);
        if(![Roles.ADMIN, Roles.MANAGER].includes(user.role as Roles)){
            throw new AppError('Unauthorized', 403);
        }
        const validatedData = categorySchema.partial().parse(body);
        if(!category){
            throw new AppError('Category Not Found', 404);
        }
        const updatedCategory = await categoryService.updateCategory(Number(id), validatedData);
        logger.info({categoryId: updatedCategory.id}, 'Category updated successfully');
        return new Response(
            JSON.stringify({ message: 'Category updated successfully', category: updatedCategory }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
    }catch (error) {
        logger.error({ error }, 'Failed to update category');
        return handleError(error);
      }
  })
  .delete('/:id', async ({ params: { id }, request }) => {
    try {
      const user = await authenticateUser(request);
      if (user.role !== Roles.ADMIN) {
        throw new AppError('Unauthorized', 403);
      }
      await categoryService.deleteCategory(Number(id));
      logger.info({ categoryId: id }, 'Category deleted successfully');
      return new Response(
        JSON.stringify({ message: 'Category deleted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      logger.error({ error }, 'Failed to delete category');
      return handleError(error);
    }
  });