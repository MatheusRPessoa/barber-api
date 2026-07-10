export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CancelledBy {
  CLIENT = 'CLIENT',
  BARBER = 'BARBER',
}

export enum CancelReason {
  // CLIENT
  PERSONAL_ISSUE = 'PERSONAL_ISSUE',
  FOUND_ANOTHER_TIME = 'FOUND_ANOTHER_TIME',
  WILL_RESCHEDULE = 'WILL_RESCHEDULE',
  SHOP_PROBLEM = 'SHOP_PROBLEM',
  // BARBER
  UNAVAILABLE = 'UNAVAILABLE',
  CLIENT_NO_SHOW = 'CLIENT_NO_SHOW',
  DUPLICATE_SLOT = 'DUPLICATE_SLOT',
  EMERGENCY = 'EMERGENCY',
  // Ambos
  OTHER = 'OTHER',
}

export const CLIENT_CANCEL_REASONS: CancelReason[] = [
  CancelReason.PERSONAL_ISSUE,
  CancelReason.FOUND_ANOTHER_TIME,
  CancelReason.WILL_RESCHEDULE,
  CancelReason.SHOP_PROBLEM,
  CancelReason.OTHER,
];

export const BARBER_CANCEL_REASONS: CancelReason[] = [
  CancelReason.UNAVAILABLE,
  CancelReason.CLIENT_NO_SHOW,
  CancelReason.DUPLICATE_SLOT,
  CancelReason.EMERGENCY,
  CancelReason.OTHER,
];

export const CANCEL_REASON_LABELS: Record<CancelReason, string> = {
  [CancelReason.PERSONAL_ISSUE]: 'Imprevisto pessoal',
  [CancelReason.FOUND_ANOTHER_TIME]: 'Encontrei outro horário',
  [CancelReason.WILL_RESCHEDULE]: 'Vou remarcar',
  [CancelReason.SHOP_PROBLEM]: 'Problema com a barbearia',
  [CancelReason.UNAVAILABLE]: 'Indisponibilidade',
  [CancelReason.CLIENT_NO_SHOW]: 'Cliente não confirmou',
  [CancelReason.DUPLICATE_SLOT]: 'Horário duplicado',
  [CancelReason.EMERGENCY]: 'Emergência',
  [CancelReason.OTHER]: 'Outro',
};
