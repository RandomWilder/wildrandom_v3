import { api } from '@/lib/api-client';
import type {
  PrizeTemplate,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  TemplateResponse,
  SingleTemplateResponse
} from '@/types/prizes/models';

export const prizeApi = {
  // Template Management
  async listTemplates() {
    const response = await api.get<TemplateResponse>('/api/admin/prizes/templates');
    return response.templates;
  },

  async getTemplate(id: number) {
    const response = await api.get<SingleTemplateResponse>(`/api/admin/prizes/templates/${id}`);
    return response.template;
  },

  async createTemplate(data: CreateTemplatePayload) {
    const response = await api.post<SingleTemplateResponse>('/api/admin/prizes/templates', data);
    return response.template;
  },

  async updateTemplate(id: number, data: UpdateTemplatePayload) {
    const response = await api.put<SingleTemplateResponse>(`/api/admin/prizes/templates/${id}`, data);
    return response.template;
  },

  // Template validation helper
  validateTemplate(data: Partial<CreateTemplatePayload>): string[] {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Template name is required');
    } else if (data.name.length < 3 || data.name.length > 100) {
      errors.push('Template name must be between 3 and 100 characters');
    }

    if (data.retail_value != null && data.retail_value < 0) {
      errors.push('Retail value must be positive');
    }

    if (data.cash_value != null && data.cash_value < 0) {
      errors.push('Cash value must be positive');
    }

    if (data.credit_value != null && data.credit_value < 0) {
      errors.push('Credit value must be positive');
    }

    return errors;
  }
};