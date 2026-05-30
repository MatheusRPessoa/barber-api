import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      const raw = (exceptionResponse as Record<string, unknown>).message;
      message = Array.isArray(raw) ? raw.join('; ') : String(raw);
    } else {
      message = exception.message;
    }

    response.status(statusCode).json({
      succeeded: false,
      data: null,
      message,
      error: {
        statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
