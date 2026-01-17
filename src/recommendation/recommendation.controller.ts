import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { RecommendationService } from "./services/recommendation.service";
import { ApiOperation } from "@nestjs/swagger";





@Controller('api/v5/recommendations')
export class RecommendationController{
    constructor(private readonly recommendationService: RecommendationService){}

    // 추천 콘서트 조회
    @Get('concerts')
    @ApiOperation({
        summary: '추천 콘서트 조회',
        description: '유저의 선호 아티스트 기반으로 추천 콘서트를 조회합니다.'
    })
    async getRecommendConcerts(@Req() req){
        const userId = req.user.userId;
        return this.recommendationService.getRecommendConcerts(userId);
    }
}