// All 50 situation cards for TEG La Revancha

import type { PlayerColor } from './objectives';

export type SituationCardType =
  | 'COMBATE_CLASICO'
  | 'NIEVE'
  | 'VIENTO_A_FAVOR'
  | 'CRISIS'
  | 'REFUERZOS_EXTRAS'
  | 'FRONTERAS_ABIERTAS'
  | 'FRONTERAS_CERRADAS'
  | 'DESCANSO';

export interface SituationCard {
  id: string;
  type: SituationCardType;
  description: string;
  color?: PlayerColor;
}

// -- 20x COMBATE_CLASICO --
const combateClasico: SituationCard[] = Array.from({ length: 20 }, (_, i) => ({
  id: `SIT_CC_${String(i + 1).padStart(2, '0')}`,
  type: 'COMBATE_CLASICO' as const,
  description: 'Combate clasico. No se aplica ningun efecto especial.',
}));

// -- 4x NIEVE --
const nieve: SituationCard[] = Array.from({ length: 4 }, (_, i) => ({
  id: `SIT_NIEVE_${String(i + 1).padStart(2, '0')}`,
  type: 'NIEVE' as const,
  description:
    'Nieve. Los defensores tiran con 1 dado extra (max 4). 1 ej=2 dados, 2 ej=3 dados, 3+ ej=4 dados.',
}));

// -- 4x VIENTO_A_FAVOR --
const vientoAFavor: SituationCard[] = Array.from({ length: 4 }, (_, i) => ({
  id: `SIT_VIENTO_${String(i + 1).padStart(2, '0')}`,
  type: 'VIENTO_A_FAVOR' as const,
  description:
    'Viento a favor. Los atacantes tiran con 1 dado extra (max 4). 2 ej=2 dados, 3 ej=3 dados, 4+ ej=4 dados.',
}));

// -- 4x CRISIS --
const crisis: SituationCard[] = Array.from({ length: 4 }, (_, i) => ({
  id: `SIT_CRISIS_${String(i + 1).padStart(2, '0')}`,
  type: 'CRISIS' as const,
  description:
    'Crisis. Cada jugador tira un dado. El que saque el numero mas bajo no podra sacar tarjeta de paises esta vuelta. En empate, ninguno de los empatados saca tarjeta.',
}));

// -- 4x REFUERZOS_EXTRAS --
const refuerzosExtras: SituationCard[] = Array.from({ length: 4 }, (_, i) => ({
  id: `SIT_REFUERZOS_${String(i + 1).padStart(2, '0')}`,
  type: 'REFUERZOS_EXTRAS' as const,
  description:
    'Refuerzos extras. Todos los jugadores incorporan ejercitos extra igual a la mitad de sus paises ocupados, antes de los ataques.',
}));

// -- 4x FRONTERAS_ABIERTAS --
const fronterasAbiertas: SituationCard[] = Array.from({ length: 4 }, (_, i) => ({
  id: `SIT_FA_${String(i + 1).padStart(2, '0')}`,
  type: 'FRONTERAS_ABIERTAS' as const,
  description:
    'Fronteras abiertas. Solo se pueden realizar ataques desde un continente hacia fuera. No se puede atacar dentro del mismo continente.',
}));

// -- 4x FRONTERAS_CERRADAS --
const fronterasCerradas: SituationCard[] = Array.from({ length: 4 }, (_, i) => ({
  id: `SIT_FC_${String(i + 1).padStart(2, '0')}`,
  type: 'FRONTERAS_CERRADAS' as const,
  description:
    'Fronteras cerradas. Solo se pueden realizar ataques dentro de cada continente. No se puede atacar paises de otro continente.',
}));

// -- 6x DESCANSO (one per color) --
const COLORS: PlayerColor[] = ['WHITE', 'BLACK', 'RED', 'BLUE', 'YELLOW', 'GREEN'];

const descanso: SituationCard[] = COLORS.map((color) => ({
  id: `SIT_DESCANSO_${color}`,
  type: 'DESCANSO' as const,
  description: `Descanso. El ejercito ${color} solo puede incorporar ejercitos. No puede atacar ni reagrupar esta vuelta.`,
  color,
}));

export const SITUATION_CARDS: SituationCard[] = [
  ...combateClasico,
  ...nieve,
  ...vientoAFavor,
  ...crisis,
  ...refuerzosExtras,
  ...fronterasAbiertas,
  ...fronterasCerradas,
  ...descanso,
];
