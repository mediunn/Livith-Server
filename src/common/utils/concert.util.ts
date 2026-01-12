export function mapStatusToEnum(
  status: string,
): 'ONGOING' | 'UPCOMING' | 'COMPLETED' {
  switch (status) {
    case '공연중':
      return 'ONGOING';
    case '공연예정':
      return 'UPCOMING';
    case '공연완료':
      return 'COMPLETED';
    default:
      throw new Error(`Unknown status: ${status}`);
  }
}
