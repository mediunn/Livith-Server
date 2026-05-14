import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('User Artist Preferences (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PUT /api/v1/users/artist-preferences', () => {
    it('인증 토큰 없이 요청 시 401 에러를 반환해야 함', () => {
      return request(app.getHttpServer())
        .put('/api/v1/users/artist-preferences')
        .send({
          artistIds: [1, 2],
        })
        .expect(401);
    });

    it('4개 이상의 아티스트 ID로 요청 시 400 에러를 반환해야 함', () => {
      return request(app.getHttpServer())
        .put('/api/v1/users/artist-preferences')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          artistIds: [1, 2, 3, 4],
        })
        .expect(400);
    });

    it('문자열 아티스트 ID로 요청 시 400 에러를 반환해야 함', () => {
      return request(app.getHttpServer())
        .put('/api/v1/users/artist-preferences')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          artistIds: ['1', '2'],
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/users/artist-preferences', () => {
    it('인증 토큰 없이 요청 시 401 에러를 반환해야 함', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/artist-preferences')
        .expect(401);
    });

    it('잘못된 토큰으로 요청 시 401 에러를 반환해야 함', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/artist-preferences')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
