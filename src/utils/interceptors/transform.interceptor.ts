import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IGNORE_TRANSFORM_INTERCEPTOR } from '../decorators/ignore-transform-interceptor.decorator';
import { CommonResponse } from '../types/response.types';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<CommonResponse> {
    const ignore = this.reflector.getAllAndOverride<boolean>(
      IGNORE_TRANSFORM_INTERCEPTOR,
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
