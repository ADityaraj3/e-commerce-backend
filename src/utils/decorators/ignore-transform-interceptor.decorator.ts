import { SetMetadata } from '@nestjs/common';

export const IGNORE_TRANSFORM_INTERCEPTOR = 'ignoreTransformInterceptor';
export const ignoreTransformInterceptor = () =>
  SetMetadata(IGNORE_TRANSFORM_INTERCEPTOR, true);
