import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { SetUserArtistPreferencesDto } from './dto/set-user-artist-preferences.dto';
import { UserArtistResponseDto } from './dto/user-artist-response.dto';
import { UserController } from './user.controller';
import { UserService } from './user.service';

// Mock UserService
const mockUserService = {
  setUserArtistPreferences: jest.fn(),
  getUserArtistPreferences: jest.fn(),
};

// Mock user for authentication
const mockUser = {
  userId: 1,
  email: 'test@example.com',
  nickname: 'testuser',
};

describe('UserController - Artist Preferences', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('setUserArtistPreferences', () => {
    it('유저 아티스트 취향을 성공적으로 설정해야 함', async () => {
      // Given
      const dto: SetUserArtistPreferencesDto = {
        artistIds: [1, 2, 3],
      };

      const expectedResult = [
        new UserArtistResponseDto(
          {
            id: 1,
            genreId: 1,
            artistName: '아이유',
            imgUrl: 'image1.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mockUser.userId,
        ),
        new UserArtistResponseDto(
          {
            id: 2,
            genreId: 1,
            artistName: 'BTS',
            imgUrl: 'image2.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mockUser.userId,
        ),
        new UserArtistResponseDto(
          {
            id: 3,
            genreId: 1,
            artistName: '블랙핑크',
            imgUrl: 'image3.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mockUser.userId,
        ),
      ];

      mockUserService.setUserArtistPreferences.mockResolvedValue(
        expectedResult,
      );

      // When
      const result = await controller.setUserArtistPreferences(mockUser, dto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(userService.setUserArtistPreferences).toHaveBeenCalledWith(
        mockUser.userId,
        dto.artistIds,
      );
      expect(userService.setUserArtistPreferences).toHaveBeenCalledTimes(1);
    });

    it('아티스트가 존재하지 않을 때 NotFoundException을 던져야 함', async () => {
      // Given
      const dto: SetUserArtistPreferencesDto = {
        artistIds: [999, 1000], // 존재하지 않는 아티스트 ID
      };

      mockUserService.setUserArtistPreferences.mockRejectedValue(
        new NotFoundException('ARTIST_NOT_FOUND'),
      );

      // When & Then
      await expect(
        controller.setUserArtistPreferences(mockUser, dto),
      ).rejects.toThrow(NotFoundException);

      expect(userService.setUserArtistPreferences).toHaveBeenCalledWith(
        mockUser.userId,
        dto.artistIds,
      );
    });

    it('단일 아티스트 선택 시 성공해야 함', async () => {
      // Given
      const dto: SetUserArtistPreferencesDto = {
        artistIds: [1],
      };

      const expectedResult = [
        new UserArtistResponseDto(
          {
            id: 1,
            genreId: 1,
            artistName: '아이유',
            imgUrl: 'image1.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mockUser.userId,
        ),
      ];

      mockUserService.setUserArtistPreferences.mockResolvedValue(
        expectedResult,
      );

      // When
      const result = await controller.setUserArtistPreferences(mockUser, dto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(result).toHaveLength(1);
      expect(userService.setUserArtistPreferences).toHaveBeenCalledWith(
        mockUser.userId,
        dto.artistIds,
      );
    });

    it('기존 취향을 새로운 취향으로 덮어써야 함', async () => {
      // Given
      const dto: SetUserArtistPreferencesDto = {
        artistIds: [4, 5],
      };

      const expectedResult = [
        new UserArtistResponseDto(
          {
            id: 4,
            genreId: 1,
            artistName: '뉴진스',
            imgUrl: 'image4.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mockUser.userId,
        ),
        new UserArtistResponseDto(
          {
            id: 5,
            genreId: 1,
            artistName: '에스파',
            imgUrl: 'image5.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mockUser.userId,
        ),
      ];

      mockUserService.setUserArtistPreferences.mockResolvedValue(
        expectedResult,
      );

      // When
      const result = await controller.setUserArtistPreferences(mockUser, dto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(result).toHaveLength(2);
      expect(userService.setUserArtistPreferences).toHaveBeenCalledWith(
        mockUser.userId,
        dto.artistIds,
      );
    });
  });

  describe('getUserArtistPreferences', () => {
    it('유저 아티스트 취향을 성공적으로 조회해야 함', async () => {
      // Given
      const expectedResult = [
        new UserArtistResponseDto(
          {
            id: 1,
            genreId: 1,
            artistName: '아이유',
            imgUrl: 'image1.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mockUser.userId,
        ),
        new UserArtistResponseDto(
          {
            id: 2,
            genreId: 1,
            artistName: 'BTS',
            imgUrl: 'image2.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mockUser.userId,
        ),
      ];

      mockUserService.getUserArtistPreferences.mockResolvedValue(
        expectedResult,
      );

      // When
      const result = await controller.getUserArtistPreferences(mockUser);

      // Then
      expect(result).toEqual(expectedResult);
      expect(userService.getUserArtistPreferences).toHaveBeenCalledWith(
        mockUser.userId,
      );
      expect(userService.getUserArtistPreferences).toHaveBeenCalledTimes(1);
    });

    it('설정된 취향이 없을 때 빈 배열을 반환해야 함', async () => {
      // Given
      mockUserService.getUserArtistPreferences.mockResolvedValue([]);

      // When
      const result = await controller.getUserArtistPreferences(mockUser);

      // Then
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(userService.getUserArtistPreferences).toHaveBeenCalledWith(
        mockUser.userId,
      );
    });
  });
});

describe('SetUserArtistPreferencesDto Validation', () => {
  it('유효한 아티스트 ID 배열을 허용해야 함', async () => {
    // Given
    const dto = new SetUserArtistPreferencesDto();
    dto.artistIds = [1, 2, 3];

    // When
    const errors = await validate(dto);

    // Then
    expect(errors).toHaveLength(0);
  });

  it('빈 배열을 거부해야 함', async () => {
    // Given
    const dto = new SetUserArtistPreferencesDto();
    dto.artistIds = [];

    // When
    const errors = await validate(dto);

    // Then
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('arrayMinSize');
  });

  it('4개 이상의 아티스트 ID를 거부해야 함', async () => {
    // Given
    const dto = new SetUserArtistPreferencesDto();
    dto.artistIds = [1, 2, 3, 4];

    // When
    const errors = await validate(dto);

    // Then
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
  });

  it('문자열 아티스트 ID를 거부해야 함', async () => {
    // Given
    const dto = new SetUserArtistPreferencesDto();
    dto.artistIds = ['1', '2', '3'] as any;

    // When
    const errors = await validate(dto);

    // Then
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });

  it('중복된 아티스트 ID를 허용해야 함 (서비스에서 처리)', async () => {
    // Given
    const dto = new SetUserArtistPreferencesDto();
    dto.artistIds = [1, 1, 2];

    // When
    const errors = await validate(dto);

    // Then
    expect(errors).toHaveLength(0);
    // Note: 중복 제거는 서비스 레이어에서 처리하는 것이 일반적
  });
});
