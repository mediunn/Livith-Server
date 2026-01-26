import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { ErrorCode } from "src/common/enums/error-code.enum";
import { ForbiddenException, NotFoundException } from "src/common/exceptions/business.exception";
import { NotificationSettingResponseDto } from "./dto/response/notification-set-response.dto";
import { UpdateNotficationSettingDto } from "./dto/request/update-notification-set.dto";
import { ConsentType } from "@prisma/client";
import { NotificationConsentDto } from "./dto/request/notification-consent.dto";
import { NotificationConsenResponseDto } from "./dto/response/notification-consent-response.dto";


@Injectable()
export class NotificationService{
    constructor(private readonly prismaService: PrismaService){}

    
    // 알림 설정 조회
    async getNotificationSettings(userId: number){
        // 유저 확인
        const user = await this.prismaService.user.findUnique({
            where: {id: userId},
        });

        if(!user){
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        if(user.deletedAt){
            throw new ForbiddenException(ErrorCode.USER_DELETED);
        }

        // NotificationSet 조회 + 생성
        let notificationSet = await this.prismaService.notificationSet.findUnique({
            where: {userId},
        });

        if(!notificationSet){
            // 기본값 생성
            notificationSet = await this.prismaService.notificationSet.create({
                data: {
                    userId,
                    ticketAlert: true,
                    infoAlert: true,
                    interestAlert: true,
                    recommendAlert: false,
                    nightAlert: false,
                },
            });
        }

        return new NotificationSettingResponseDto(
            notificationSet,
            user.marketingConsent
        );
    }

    // 알림 설정 변경
    async updateNotficationSettings(
        userId: number,
        dto: UpdateNotficationSettingDto,
    ){
        // 유저 확인
        const user = await this.prismaService.user.findUnique({
            where: {id: userId},
        });

        if(!user){
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        if(user.deletedAt){
            throw new ForbiddenException(ErrorCode.USER_DELETED);
        }

        // Notification 조회 + 생성
        let notificationSet = await this.prismaService.notificationSet.findUnique({
            where: {userId},
        });

        if(!notificationSet){
            notificationSet = await this.prismaService.notificationSet.create({
                data:{
                    userId,
                    ticketAlert: true,
                    infoAlert: true,
                    interestAlert: true,
                    recommendAlert: false,
                    nightAlert: false,
                },
            });
        }

        // 변경할 데이터 준비
        const updateData: {
            ticketAlert?: boolean;
            infoAlert?: boolean;
            interestAlert?: boolean;
            recommendAlert?: boolean;
            nightAlert?: boolean;
        } = {};

        if(dto.ticketAlert !== undefined){
            updateData.ticketAlert = dto.ticketAlert;
        }
        if(dto.infoAlert !== undefined){
            updateData.infoAlert = dto.infoAlert;
        }
        if(dto.interestAlert !== undefined){
            updateData.interestAlert = dto.interestAlert;
        }
        if(dto.recommendAlert !== undefined){
            updateData.recommendAlert = dto.recommendAlert;
        }
        if(dto.nightAlert !== undefined){
            updateData.nightAlert = dto.nightAlert;
        }

        // recommendAlert와 nightAlert 변경 시 동의 이력 기록
        const now = new Date();
        const consentRecords = [];
        
        if(dto.recommendAlert !== undefined){
            if(dto.recommendAlert){
                // 켤 때: 동의 이력 기록
                consentRecords.push({
                    userId,
                    consentType: ConsentType.MARKETING_PUSH,
                    isAgreed: true,
                    agreedAt: now,
                });
            }else{
                // 끌 때: 거부 이력 기록
                consentRecords.push({
                    userId,
                    consentType: ConsentType.MARKETING_PUSH,
                    isAgreed: false,
                    agreedAt: now,
                });
            }
        }

        if(dto.nightAlert !== undefined){
            if(dto.nightAlert){
                // 켤 때: 동의 이력 기록
                consentRecords.push({
                    userId,
                    consentType: ConsentType.NIGHT_PUSH,
                    isAgreed: true,
                    agreedAt: now,
                });
            }else{
                // 끌 때: 거부 이력 기록
                consentRecords.push({
                    userId,
                    consentType: ConsentType.NIGHT_PUSH,
                    isAgreed: false,
                    agreedAt: now,
                });
            }
        }

        // 트랜잭션으로 처리
        const result = await this.prismaService.$transaction(async (tx) => {
            // NotificationSet 업데이트
            const updated = await tx.notificationSet.update({
                where: {userId},
                data: updateData,
            });

            // 동의 이력 기록
            if(consentRecords.length > 0){
                await tx.notificationConsent.createMany({
                    data: consentRecords,
                })
            }

            return updated;
        });

        return new NotificationSettingResponseDto(result, user.marketingConsent);
    }

    // 홍보성 알림 동의
    async createNotificationConsent(
        userId: number,
        dto: NotificationConsentDto,
    ){
        // 유저 확인
        const user = await this.prismaService.user.findUnique({
            where: {id: userId},
        });

        if(!user){
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        if(user.deletedAt){
            throw new ForbiddenException(ErrorCode.USER_DELETED);
        }

        const now = new Date();
        const consentRecords = [];

        // 트랜잭션으로 처리
        await this.prismaService.$transaction(async (tx) => {
            // Notification 조회 + 생성
            let notificationSet = await tx.notificationSet.findUnique({
                where: {userId},
            });

            if(!notificationSet){
                notificationSet = await tx.notificationSet.create({
                    data: {
                        userId,
                        ticketAlert: true,
                        infoAlert: true,
                        interestAlert: true,
                        recommendAlert: false,
                        nightAlert: false,
                    },
                });
            }

            // 마케팅 동의 처리
            if(dto.marketingConsent){
                // NotificationSet의 recommendAler를 true로 변경
                await tx.notificationSet.update({
                    where: {userId},
                    data: {recommendAlert: true},
                });

                // 동의 이력 기록
                consentRecords.push({
                    userId,
                    consentType: ConsentType.MARKETING_PUSH,
                    isAgreed: true,
                    agreedAt: now,
                });
            }

            // 야간 알림 동의 처리
            if(dto.nightAlertConsent){
                // NotificationSet의 nightAlert를 true로 변경
                await tx.notificationSet.update({
                    where: {userId},
                    data: {nightAlert: true},
                });

                // 동의 이력 기록
                consentRecords.push({
                    userId,
                    consentType: ConsentType.NIGHT_PUSH,
                    isAgreed: true,
                    agreedAt: now,
                });
            }

            // 동의 이력 저장
            if(consentRecords.length > 0){
                await tx.notificationConsent.createMany({
                    data: consentRecords,
                });
            }
        });

        return new NotificationConsenResponseDto(now);
    }
}