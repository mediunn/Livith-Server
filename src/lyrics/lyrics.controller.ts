import { Controller, Get, Param } from '@nestjs/common';
import { LyricsService } from './lyrics.service';
import { ParsePositiveIntPipe } from 'src/common/pipes/parse-positive-int.pipe';

@Controller()
export class LyricsController {
  constructor(private readonly lyricsService: LyricsService) {}

  @Get('/songs/:id')
  getLyrics(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.lyricsService.getLyrics(id);
  }
}
