import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";


@Injectable()
export class CookieService{
    private readonly REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
    private readonly REFRESH_TOKEN_MAX_AGE = 4 * 24 * 60 * 60 * 1000; // 4일

    constructor(private readonly configService: ConfigService){}

    private getCookieOptions(){
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
        return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'none' as const,
        };
    }

    setRefreshTokenCookie(res: Response, refreshToken: string): void{
        res.cookie(this.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
            ...this.getCookieOptions(),
            maxAge: this.REFRESH_TOKEN_MAX_AGE,
        });
    }

    clearRefreshTokenCookie(res: Response): void{
        res.clearCookie(this.REFRESH_TOKEN_COOKIE_NAME, this.getCookieOptions());
    }
}