import { z } from 'zod';
import logger from './logger';

export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const handleError = (error: unknown) => {
    if (error instanceof AppError) {
        logger.error({ error: error.message, statusCode: error.statusCode }, 'Application error');
        return { error: error.message, statusCode: error.statusCode };
    }

    if (error instanceof z.ZodError) {
        logger.error({ error: error.errors }, 'Validation error');
        return { error: error.errors, statusCode: 400 };
    }

    logger.error({ error }, 'Unexpected error');
    return { error: 'An unexpected error occurred', statusCode: 500 };
};

