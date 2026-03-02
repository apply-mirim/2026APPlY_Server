import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';
import { SUCCESS_MESSAGE_KEY } from '../decorators/success-message.decorator';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private reflector: Reflector) {}

  private normalizeMessage(messages: string[]): string | string[] {
    if (messages.length === 1) {
      return messages[0];
    }

    return messages;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode;

    const successMessage =
      this.reflector.get<string[]>(SUCCESS_MESSAGE_KEY, context.getHandler()) ||
      [];

    return next.handle().pipe(
      map((data: unknown): ApiResponse<T> => {
        if (
          data &&
          typeof data === 'object' &&
          'statusCode' in data &&
          'data' in data &&
          'message' in data &&
          (typeof (data as ApiResponse<unknown>).message === 'string' ||
            Array.isArray((data as ApiResponse<unknown>).message))
        ) {
          return data as ApiResponse<T>;
        }

        return {
          statusCode,
          data: (data as T) || null,
          message: this.normalizeMessage(successMessage),
        } as ApiResponse<T>;
      }),
    );
  }
}
