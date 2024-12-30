import type { SortConfig, FilterConfig, SearchConfig } from '@/types/data-display';

export class DataManipulator<T extends Record<string, any>> {
  constructor(private data: T[]) {}

  sort(config: SortConfig<T>): T[] {
    return [...this.data].sort((a, b) => {
      const aValue = this.getNestedValue(a, config.field);
      const bValue = this.getNestedValue(b, config.field);

      if (typeof aValue === 'string') {
        return config.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return config.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });
  }

  filter(configs: FilterConfig<T>[]): T[] {
    return this.data.filter(item =>
      configs.every(config => {
        const value = this.getNestedValue(item, config.field);
        
        switch (config.operator) {
          case 'equals':
            return value === config.value;
          case 'contains':
            return String(value)
              .toLowerCase()
              .includes(String(config.value).toLowerCase());
          case 'greater':
            return value > config.value;
          case 'less':
            return value < config.value;
          case 'between':
            const [min, max] = config.value as unknown as [number, number];
            return value >= min && value <= max;
          default:
            return true;
        }
      })
    );
  }

  search(config: SearchConfig): T[] {
    const normalizedQuery = config.query.toLowerCase();
    
    return this.data.filter(item =>
      config.fields.some(field => {
        const value = this.getNestedValue(item, field as keyof T);
        return String(value)
          .toLowerCase()
          .includes(normalizedQuery);
      })
    );
  }

  private getNestedValue(obj: T, path: keyof T): any {
    return path.toString().split('.').reduce((acc, part) => acc?.[part], obj);
  }
}