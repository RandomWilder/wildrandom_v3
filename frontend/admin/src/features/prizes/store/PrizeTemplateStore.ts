// frontend/admin/src/features/prizes/store/PrizeTemplateStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '@/shared/api/client';
import type { PrizeTemplate, PrizeTemplateResponse, PrizeValues } from '@/types/prizes';
import type { ApiResponse } from '@/shared/types/api';
import { AxiosError } from 'axios';

interface TemplateMetrics {
    totalTemplates: number;
    activeInPools: number;
    totalValues: PrizeValues;
    claims: number;
}

interface TemplatesState {
    templates: PrizeTemplate[];
    activeTemplate: PrizeTemplate | null;
    draftTemplate: Partial<PrizeTemplate> | null;
    isLoading: boolean;
    error: string | null;
    lastRefreshed: Date | null;
    validationErrors: Record<string, string>;
    metrics: TemplateMetrics;
}

interface TemplatesActions {
    fetchTemplates: () => Promise<void>;
    getTemplate: (id: number) => Promise<void>;
    createTemplate: (data: Omit<PrizeTemplate, 'id' | 'created_at' | 'updated_at' | 'pools_count' | 'total_instances' | 'instances_claimed'>) => Promise<void>;
    setDraftTemplate: (template: Partial<PrizeTemplate> | null) => void;
    clearErrors: () => void;
    calculateMetrics: (templates: PrizeTemplate[]) => void;
}

export const useTemplateStore = create<TemplatesState & TemplatesActions>()(
    devtools(
        (set, get) => ({
            // Initial State
            templates: [],
            activeTemplate: null,
            draftTemplate: null,
            isLoading: false,
            error: null,
            lastRefreshed: null,
            validationErrors: {},
            metrics: {
                totalTemplates: 0,
                activeInPools: 0,
                totalValues: { retail: 0, cash: 0, credit: 0 },
                claims: 0
            },

            fetchTemplates: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.get<ApiResponse<{ templates: PrizeTemplate[] }>>('/admin/prizes/templates');
                    
                    if (!response.data?.templates) {
                        throw new Error('Invalid response format');
                    }

                    const { templates } = response.data;
                    
                    set({ 
                        templates,
                        lastRefreshed: new Date(),
                        isLoading: false 
                    });

                    get().calculateMetrics(templates);
                } catch (error) {
                    const errorMessage = error instanceof AxiosError 
                        ? error.response?.data?.error || 'Failed to load templates'
                        : 'Failed to load templates';
                    
                    set({ 
                        error: errorMessage,
                        isLoading: false 
                    });
                }
            },

            getTemplate: async (id: number) => {
                set({ isLoading: true, error: null });
                try {
                    const template = get().templates.find(t => t.id === id);
                    if (template) {
                        set({ activeTemplate: template, isLoading: false });
                        return;
                    }

                    const response = await api.get<ApiResponse<{ template: PrizeTemplate }>>(`/admin/prizes/templates/${id}`);
                    
                    if (!response.data?.template) {
                        throw new Error('Invalid response format');
                    }

                    set({ 
                        activeTemplate: response.data.template,
                        isLoading: false 
                    });
                } catch (error) {
                    const errorMessage = error instanceof AxiosError 
                        ? error.response?.data?.error || 'Failed to load template'
                        : 'Failed to load template';
                    
                    set({ 
                        error: errorMessage,
                        isLoading: false 
                    });
                }
            },

            createTemplate: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<ApiResponse<{ template: PrizeTemplate }>>('/admin/prizes/templates', data);
                    
                    if (!response.data?.template) {
                        throw new Error('Invalid response format');
                    }

                    const newTemplate = response.data.template;
                    
                    set(state => ({ 
                        templates: [...state.templates, newTemplate],
                        draftTemplate: null,
                        isLoading: false
                    }));

                    get().calculateMetrics([...get().templates, newTemplate]);
                } catch (error) {
                    const errorMessage = error instanceof AxiosError 
                        ? error.response?.data?.error || 'Failed to create template'
                        : 'Failed to create template';
                    
                    set({ 
                        error: errorMessage,
                        isLoading: false 
                    });
                    throw error;
                }
            },

            setDraftTemplate: (template) => {
                set({ 
                    draftTemplate: template,
                    validationErrors: {} 
                });
            },

            clearErrors: () => {
                set({ 
                    error: null,
                    validationErrors: {} 
                });
            },

            calculateMetrics: (templates) => {
                const metrics = templates.reduce((acc, template) => ({
                    totalTemplates: acc.totalTemplates + 1,
                    activeInPools: acc.activeInPools + (template.pools_count > 0 ? 1 : 0),
                    totalValues: {
                        retail: acc.totalValues.retail + template.values.retail,
                        cash: acc.totalValues.cash + template.values.cash,
                        credit: acc.totalValues.credit + template.values.credit
                    },
                    claims: acc.claims + template.instances_claimed
                }), {
                    totalTemplates: 0,
                    activeInPools: 0,
                    totalValues: { retail: 0, cash: 0, credit: 0 },
                    claims: 0
                });

                set({ metrics });
            }
        }),
        { name: 'prize-templates' }
    )
);