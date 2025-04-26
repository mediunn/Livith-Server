import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetSetlistSongsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  size?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cursor?: number;
}
