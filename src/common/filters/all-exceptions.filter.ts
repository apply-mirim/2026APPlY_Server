import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private normalizeMessage(messages: string[]): string | string[] {
    if (messages.length === 1) {
      return messages[0];
    }

    return messages;
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string[] = ['서버 내부 오류가 발생했습니다.'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = [exceptionResponse];
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        if (Array.isArray(responseObj.message)) {
          message = responseObj.message;
        } else if (typeof responseObj.message === 'string') {
          message = [responseObj.message];
        } else if (typeof responseObj.error === 'string') {
          message = [responseObj.error];
        }
      }
    }

    const errorResponse: ApiResponse<null> = {
      statusCode: status,
      data: null,
      message: this.normalizeMessage(message),
    };

    response.status(status).json(errorResponse);
  }
}
