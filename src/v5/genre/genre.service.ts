import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma-v5/prisma.service';
import { GenreResponseDto } from './dto/genre-response.dto';

@Injectable()
export class GenreService {
  constructor(private readonly prismaService: PrismaService) {}
  //장르 목록 조회
  async getGenres() {
    const genres = await this.prismaService.genre.findMany();
    return genres.map((genre) => new GenreResponseDto(genre));
  }
}
