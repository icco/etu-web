import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Validation middleware factory
export function validate<T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = schema.parse(data);
      
      // Replace the source data with validated/transformed data
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        (req as Request & { validatedQuery: T }).validatedQuery = validated;
      } else {
        req.params = validated as Record<string, string>;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      
      res.status(500).json({ success: false, error: 'Validation error' });
    }
  };
}
