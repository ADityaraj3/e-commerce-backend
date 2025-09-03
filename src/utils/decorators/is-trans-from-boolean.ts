import { BadRequestException } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';

export function IsTransFromStringToBooleanType(): (
  target: any,
  key: string,
) => void {
  return Transform((value: TransformFnParams) => {
    if (
      value.obj[value.key] === '1' ||
      value.obj[value.key] === 1 ||
      value.obj[value.key] === 'true' ||
      value.obj[value.key] === true
    ) {
      return true;
    } else if (
      value.obj[value.key] === '0' ||
      value.obj[value.key] === 0 ||
      value.obj[value.key] === 'false' ||
      value.obj[value.key] === false
    ) {
      return false;
    } else {
      throw new BadRequestException(`${value.key} must be a boolean value`);
    }
  });
}
