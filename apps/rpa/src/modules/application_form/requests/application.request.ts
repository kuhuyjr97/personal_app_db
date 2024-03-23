import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ApplicationRequest {
  @ApiProperty({
    type: 'number',
    example: 1,
  })
  @IsNumber({}, { message: '数値で入力してください' })
  readonly id!: number;
}
