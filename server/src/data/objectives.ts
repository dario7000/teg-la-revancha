// All 20 objectives for TEG La Revancha
// 12 occupation + 7 destruction + 1 destroy-left

import type { ContinentId } from './countries';

export type PlayerColor = 'WHITE' | 'BLACK' | 'RED' | 'BLUE' | 'YELLOW' | 'GREEN';

export type ObjectiveType = 'OCCUPATION' | 'DESTRUCTION' | 'DESTROY_LEFT';

export interface OccupationRequirement {
  continent?: ContinentId;
  count: number;
  fullContinent?: boolean;
  isIsland?: boolean;
  minContinents?: number;
}

export interface OccupationObjective {
  id: string;
  type: 'OCCUPATION';
  description: string;
  requirements: OccupationRequirement[];
}

export interface DestructionObjective {
  id: string;
  type: 'DESTRUCTION';
  description: string;
  targetColor: PlayerColor;
}

export interface DestroyLeftObjective {
  id: string;
  type: 'DESTROY_LEFT';
  description: string;
}

export type Objective = OccupationObjective | DestructionObjective | DestroyLeftObjective;

export const OBJECTIVES: Objective[] = [
  // -- Occupation objectives (12) --
  {
    id: 'OBJ_01',
    type: 'OCCUPATION',
    description:
      'Ocupar 4 de Am. Norte, 4 de Europa, 4 de Asia, 3 de Am. Sur, 3 de Am. Central, 3 de Africa y 3 de Oceania',
    requirements: [
      { continent: 'AMERICA_DEL_NORTE', count: 4 },
      { continent: 'EUROPA', count: 4 },
      { continent: 'ASIA', count: 4 },
      { continent: 'AMERICA_DEL_SUR', count: 3 },
      { continent: 'AMERICA_CENTRAL', count: 3 },
      { continent: 'AFRICA', count: 3 },
      { continent: 'OCEANIA', count: 3 },
    ],
  },
  {
    id: 'OBJ_02',
    type: 'OCCUPATION',
    description: 'Ocupar Europa y America del Sur',
    requirements: [
      { continent: 'EUROPA', count: 16, fullContinent: true },
      { continent: 'AMERICA_DEL_SUR', count: 8, fullContinent: true },
    ],
  },
  {
    id: 'OBJ_03',
    type: 'OCCUPATION',
    description: 'Ocupar America del Norte, Oceania y 5 paises de Africa',
    requirements: [
      { continent: 'AMERICA_DEL_NORTE', count: 12, fullContinent: true },
      { continent: 'OCEANIA', count: 6, fullContinent: true },
      { continent: 'AFRICA', count: 5 },
    ],
  },
  {
    id: 'OBJ_04',
    type: 'OCCUPATION',
    description: 'Ocupar Asia y America Central',
    requirements: [
      { continent: 'ASIA', count: 16, fullContinent: true },
      { continent: 'AMERICA_CENTRAL', count: 6, fullContinent: true },
    ],
  },
  {
    id: 'OBJ_05',
    type: 'OCCUPATION',
    description: 'Ocupar America del Norte, 8 de Asia y 4 de Europa',
    requirements: [
      { continent: 'AMERICA_DEL_NORTE', count: 12, fullContinent: true },
      { continent: 'ASIA', count: 8 },
      { continent: 'EUROPA', count: 4 },
    ],
  },
  {
    id: 'OBJ_06',
    type: 'OCCUPATION',
    description: 'Ocupar Oceania, 6 de Asia, 6 de Africa y 6 de Am. Norte',
    requirements: [
      { continent: 'OCEANIA', count: 6, fullContinent: true },
      { continent: 'ASIA', count: 6 },
      { continent: 'AFRICA', count: 6 },
      { continent: 'AMERICA_DEL_NORTE', count: 6 },
    ],
  },
  {
    id: 'OBJ_07',
    type: 'OCCUPATION',
    description: 'Ocupar Am. Central, 6 de Am. Sur, 6 de Europa y 6 de Asia',
    requirements: [
      { continent: 'AMERICA_CENTRAL', count: 6, fullContinent: true },
      { continent: 'AMERICA_DEL_SUR', count: 6 },
      { continent: 'EUROPA', count: 6 },
      { continent: 'ASIA', count: 6 },
    ],
  },
  {
    id: 'OBJ_08',
    type: 'OCCUPATION',
    description: 'Ocupar America del Sur, Africa y 8 de Asia',
    requirements: [
      { continent: 'AMERICA_DEL_SUR', count: 8, fullContinent: true },
      { continent: 'AFRICA', count: 8, fullContinent: true },
      { continent: 'ASIA', count: 8 },
    ],
  },
  {
    id: 'OBJ_09',
    type: 'OCCUPATION',
    description: 'Ocupar Oceania, Africa, 4 de Am. Central y 4 de Asia',
    requirements: [
      { continent: 'OCEANIA', count: 6, fullContinent: true },
      { continent: 'AFRICA', count: 8, fullContinent: true },
      { continent: 'AMERICA_CENTRAL', count: 4 },
      { continent: 'ASIA', count: 4 },
    ],
  },
  {
    id: 'OBJ_10',
    type: 'OCCUPATION',
    description: 'Ocupar Europa, 4 de Asia y 4 de Am. Sur',
    requirements: [
      { continent: 'EUROPA', count: 16, fullContinent: true },
      { continent: 'ASIA', count: 4 },
      { continent: 'AMERICA_DEL_SUR', count: 4 },
    ],
  },
  {
    id: 'OBJ_11',
    type: 'OCCUPATION',
    description: 'Ocupar Africa, 4 de Europa, 4 de Asia y 6 islas en al menos 3 continentes',
    requirements: [
      { continent: 'AFRICA', count: 8, fullContinent: true },
      { continent: 'EUROPA', count: 4 },
      { continent: 'ASIA', count: 4 },
      { isIsland: true, count: 6, minContinents: 3 },
    ],
  },
  {
    id: 'OBJ_12',
    type: 'OCCUPATION',
    description: 'Ocupar 35 paises en cualquier lugar del mapa',
    requirements: [{ count: 35 }],
  },

  // -- Destruction objectives (7) --
  {
    id: 'OBJ_DESTROY_WHITE',
    type: 'DESTRUCTION',
    description: 'Destruir al ejercito Blanco. De no ser posible, destruir al de la derecha.',
    targetColor: 'WHITE',
  },
  {
    id: 'OBJ_DESTROY_BLACK',
    type: 'DESTRUCTION',
    description: 'Destruir al ejercito Negro. De no ser posible, destruir al de la derecha.',
    targetColor: 'BLACK',
  },
  {
    id: 'OBJ_DESTROY_RED',
    type: 'DESTRUCTION',
    description: 'Destruir al ejercito Rojo. De no ser posible, destruir al de la derecha.',
    targetColor: 'RED',
  },
  {
    id: 'OBJ_DESTROY_BLUE',
    type: 'DESTRUCTION',
    description: 'Destruir al ejercito Azul. De no ser posible, destruir al de la derecha.',
    targetColor: 'BLUE',
  },
  {
    id: 'OBJ_DESTROY_YELLOW',
    type: 'DESTRUCTION',
    description: 'Destruir al ejercito Amarillo. De no ser posible, destruir al de la derecha.',
    targetColor: 'YELLOW',
  },
  {
    id: 'OBJ_DESTROY_GREEN',
    type: 'DESTRUCTION',
    description: 'Destruir al ejercito Verde. De no ser posible, destruir al de la derecha.',
    targetColor: 'GREEN',
  },

  // -- Special: destroy left (1) --
  {
    id: 'OBJ_DESTROY_LEFT',
    type: 'DESTROY_LEFT',
    description: 'Destruir al jugador de la izquierda.',
  },
];
