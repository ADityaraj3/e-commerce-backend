import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseObject } from '../types/response.types';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseObject<Record<string, unknown>>> {
    const ignore = this.reflector.getAllAndOverride<boolean>(
      ResponseFormatInterceptor,
      [context.getHandler(), context.getClass()],
    );
    if (ignore) {
      return next.handle().pipe(
        map((data) => {
          return data;
        }),
      );
    }

    return next.handle().pipe(
      map((data) => {
        return {
          success: true,
          error: '',
          data: data ?? {},
          message: '',
        };
      }),
    );
  }
}
