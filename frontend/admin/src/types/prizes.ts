// frontend/admin/src/types/prizes.ts

export type PrizeType = 'instant_win' | 'draw_win';
export type PrizeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface PrizeValues {
    cash: number;
    credit: number;
    retail: number;
}

export interface PrizeTemplate {
    id: number;
    name: string;
    type: PrizeType;
    tier: PrizeTier;
    values: PrizeValues;  // Note: API returns nested values object
    pools_count: number;
    total_instances: number;
    instances_claimed: number;
    created_at: string;
    updated_at: string | null;
}

export interface PrizeTemplateResponse {
    templates: PrizeTemplate[];
}

// Configuration constants
export const PRIZE_TIERS: Record<PrizeTier, { 
    label: string;
    color: string;
    bgGradient: string;
    textColor: string;
}> = {
    platinum: {
        label: 'Platinum',
        color: 'bg-slate-800',
        bgGradient: 'bg-gradient-to-br from-slate-700 to-slate-900',
        textColor: 'text-white'
    },
    gold: {
        label: 'Gold',
        color: 'bg-yellow-500',
        bgGradient: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
        textColor: 'text-white'
    },
    silver: {
        label: 'Silver',
        color: 'bg-gray-400',
        bgGradient: 'bg-gradient-to-br from-gray-300 to-gray-500',
        textColor: 'text-gray-900'
    },
    bronze: {
        label: 'Bronze',
        color: 'bg-orange-700',
        bgGradient: 'bg-gradient-to-br from-orange-600 to-orange-800',
        textColor: 'text-white'
    }
};