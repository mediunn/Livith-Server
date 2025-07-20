import { Injectable } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FetchConcertDetailDto } from './dto/fetch-concert-detail.dto';

@Injectable()
export class FetchConcertService {
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('KOPIS_API_KEY');
  }

  // 공연 목록 가져오기
  async fetchConcertsInRange(
    start: string,
    end: string,
    state: string,
  ): Promise<string[]> {
    let page = 1;
    const rows = 100;
    const result: string[] = [];

    while (true) {
      const url = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${this.apiKey}&stdate=${start}&eddate=${end}&rows=${rows}&cpage=${page}&shcate=CCCD&prfstate=${state}`;
      const res = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'text',
          headers: { Accept: 'application/xml' },
        }),
      );

      const parsed = await parseStringPromise(res.data, {
        explicitArray: false,
      });
      const items = parsed?.dbs?.db;

      if (!items) break;

      if (Array.isArray(items)) {
        result.push(...items.map((item) => item.mt20id));
        if (items.length < rows) break;
      } else {
        result.push(items.mt20id);
        break;
      }
      page++;
    }

    return result;
  }

  // 공연 상세정보 가져오기
  async fetchConcertDetails(codes: string[]): Promise<FetchConcertDetailDto[]> {
    const result: FetchConcertDetailDto[] = [];
    for (const code of codes) {
      const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${code}?service=${this.apiKey}`;
      const res = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'text',
          headers: { Accept: 'application/xml' },
        }),
      );

      const parsed = await parseStringPromise(res.data, {
        explicitArray: false,
      });
      const details = parsed?.dbs?.db;
      if (details?.visit === 'Y' && details?.festival === 'N') {
        result.push({
          code: details.mt20id,
          title: details.prfnm,
          startDate: details.prfpdfrom,
          endDate: details.prfpdto,
          artist: details.prfcast,
          poster: details.poster,
          status: details.prfstate,
        });
      }
    }
    return result;
  }
}
