import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import { isObject } from '@nestjs/common/utils/shared.utils';
import { Response } from 'express';
import { inspect } from 'util';
import { makeResponse } from './types/response.types';
import { CustomLogger } from './logger.service';
import { CUSTOM_LOGGER } from './constant';

@Catch(HttpException)
export class AllExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(CUSTOM_LOGGER) private readonly loggerService: CustomLogger,
  ) {}
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    console.error('error :', {
      ...exception,
      path: request.url,
    });
    const res = exception.getResponse() as
      | string
      | {
          success?: boolean;
          message: string | string[];
          error?: string;
          data?: object;
        };

    let msg;
    let error = '';
    let success = false;
    let data = {};

    if (isObject(res)) {
      msg = Array.isArray(res.message) ? res.message.pop() : res.message;
      error = typeof res.error === 'string' ? res.error : '';
      data = res.data ?? {};
      success = res.success ?? false;
    } else {
      msg = res;
    }

    this.loggerService.error(
      inspect(exception, false, null, true),
      AllExceptionFilter.name,
    );

    response.status(exception.getStatus()).json(
      makeResponse({
        success: success,
        error: error,
        message: msg,
        data: data,
      }),
    );
  }
}
