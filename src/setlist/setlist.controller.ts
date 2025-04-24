import { Controller, Get, Param } from '@nestjs/common';
import { SetlistService } from './setlist.service';
import { ParsePositiveIntPipe } from 'src/common/pipes/parse-positive-int.pipe';

@Controller('')
export class SetlistController {
  constructor(private readonly setlistService: SetlistService) {}

  //셋리스트 목록 조회
  @Get('/concerts/:id/setlists')
  getSetlists(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.setlistService.getSetlists(id);
  }
}
