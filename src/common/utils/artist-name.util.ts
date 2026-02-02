
/**
 * 아티스트명 비교용 정규화(공백, 괄호, 대소문자)
 * 1. 앞뒤 공백 제거
 * 2. 끝에 있는 괄호 블록 제거
 * 3. 소문자로 통일
 */

export function normalizeArtistName(name: string): string{
    return name
    .trim()
    .replace(/\s*\([^)]*\)\s*/g, '') 
    .trim()
    .toLowerCase();
}