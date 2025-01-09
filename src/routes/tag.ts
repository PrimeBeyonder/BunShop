import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { handleError, AppError } from '../utils/ errorHandler';
import logger from '../utils/logger';
import { verifyToken, Roles, Role } from '../utils/auth';
import * as tagService from '../services/tagService';

const prisma = new PrismaClient();

const tagSchema = z.object({
  name: z.string(),
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

export const tagRoutes = new Elysia({prefix: "/tags"})
    .post("/", async ({body, request}) => {
        try {
            const user = await authenticateUser(request);
            if (![Roles.ADMIN, Roles.MANAGER].includes(user.role as Roles)) {
                throw new AppError('Unauthorized', 403);
            }
            const validatedData = tagSchema.parse(body);
            const tagData = {
                name: validatedData.name
            }
            const tag = await tagService.createTag(tagData);
            logger.info({tagId: tag.id}, 'Tag created successfully');
            return new Response(
                JSON.stringify({message: 'Tag created successfully', tag}),
                {status: 201, headers: {'Content-Type': 'application/json'}}
            );
        } catch (error) {
            logger.error({error}, 'Failed to create tag');
            return handleError(error);
        }
    })
    .get("/", async () => {
        try {
            const tags = await tagService.getAllTags();
            logger.info('Tags retrieved successfully');
            return new Response(
                JSON.stringify(tags),
                {status: 200, headers: {'Content-Type': 'application/json'}}
            )
        } catch (error) {
            logger.error({error}, 'Failed to retrieve tags');
            return handleError(error);
        }
    })