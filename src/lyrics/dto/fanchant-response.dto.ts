import { ApiProperty } from '@nestjs/swagger';
import { SetlistSong } from '@prisma/client';

export class FanchantResponseDto {
  @ApiProperty({
    description: '응원법 ID',
    example: 1,
  })
  id: number;
  @ApiProperty({
    description: '셋리스트 ID',
    example: 1,
  })
  setlistId: number;
  @ApiProperty({
    description: '노래 ID',
    example: 2,
  })
  songId: number;
  @ApiProperty({
    description: '응원법 내용',
    example: ['응원법 1', '응원법 2'],
  })
  fanchant: string[];

  constructor(setlistSong: SetlistSong) {
    this.id = setlistSong.id;
    this.setlistId = setlistSong.setlistId;
    this.songId = setlistSong.songId;
    this.fanchant = setlistSong.fanchant
      ? setlistSong.fanchant.split('\n')
      : [];
  }
}
