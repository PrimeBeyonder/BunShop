import { Elysia } from 'elysia';
import { verifyToken } from '../utils/auth';
import { AppError} from "../utils/ errorHandler.ts";

export const authMiddleware = new Elysia()
    .derive(({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new AppError('No token provided', 401);
        }

        try {
            const decoded = verifyToken(token);
            return { user: decoded };
        } catch (error) {
            throw new AppError('Invalid token', 401);
        }
    });
