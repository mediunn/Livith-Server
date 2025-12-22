import { ErrorCode } from "../enums/error-code.enum";

export const ErrorMessages: Record<ErrorCode, string> = {
    // Not Found
    [ErrorCode.CONCERT_NOT_FOUND]: '해당 콘서트를 찾을 수 없습니다.',
    [ErrorCode.USER_NOT_FOUND]: '해당 유저가 존재하지 않습니다.',
    [ErrorCode.ARTIST_NOT_FOUND]: '해당 아티스트를 찾을 수 없습니다.',
    [ErrorCode.SETLIST_NOT_FOUND]: '해당 셋리스트가 존재하지 않습니다.',
    [ErrorCode.COMMENT_NOT_FOUND]: '댓글을 찾을 수 없습니다.',
    [ErrorCode.SONG_NOT_FOUND]: '해당 곡이 존재하지 않습니다.',
    [ErrorCode.SETLIST_SONG_NOT_FOUND]: '해당 셋리스트와 곡의 조합이 존재하지 않습니다.',
    [ErrorCode.SETLIST_CONCERT_NOT_FOUND]: '해당 셋리스트와 콘서트의 조합이 존재하지 않습니다.',

    // Bad Request
    [ErrorCode.INVALID_CURSOR_FORMAT]: '유효하지 않은 cursor 형식입니다.',
    [ErrorCode.INVALID_ID_FORMAT]: 'id는 양의 정수여야 합니다.',
    [ErrorCode.SEARCH_KEYWORD_REQUIRED]: '검색어(letter)는 필수입니다.',
    [ErrorCode.USER_ALREADY_DELETED]: '이미 탈퇴한 회원입니다.',
    [ErrorCode.NICKNAME_ALREADY_EXISTS]: '이미 존재하는 닉네임이에요.',

    // Forbidden
    [ErrorCode.USER_DELETED]: '탈퇴한 회원입니다.',
    [ErrorCode.COMMENT_DELETE_FORBIDDEN]: '본인의 댓글만 삭제할 수 있습니다.',
    [ErrorCode.WITHDRAWAL_PERIOD_NOT_PASSED]: '탈퇴 후 7일이 지나지 않았어요.',
    [ErrorCode.KAKAO_USER_INFO_FETCH_HEAD]: '카카오 사용자 정보 조회 실패',

    // Unauthorized
    [ErrorCode.APPLE_KEY_NOT_FOUND]: 'Apple key not found',
    [ErrorCode.REFRESH_TOKEN_INVALID]: '리프레시 토큰이 유효하지 않습니다.',
    [ErrorCode.REFRESH_TOKEN_EXPIRED]: '리프레시 토큰 만료',
    [ErrorCode.REFRESH_TOKEN_VERIFICATION_FAILED]: '리프레시 토큰 검증 실패',
    [ErrorCode.REFRESH_TOKEN_NOT_FOUND]: '리프레시 토큰이 없습니다.',

}