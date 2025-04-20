import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ConcertStatus } from 'src/common/enums/concert-status.enum';

export class GetConcertsDto {
  @IsEnum(ConcertStatus, {
    message: 'status는 ONGOING | UPCOMING | COMPLETED 중 하나여야 해요',
  })
  status: ConcertStatus;

  @IsOptional()
  @IsNumber()
  cursor?: number;

  @IsOptional()
  @IsNumber()
  size?: number;
}
