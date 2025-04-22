import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GetSearchResultsDto {
  @IsString()
  keyword: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cursor?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  size?: number;
}
