import { RafflesLayout } from '@/features/raffles/components/RafflesLayout';
import { PrizeTemplateList } from '@/features/prizes/components/PrizeTemplateList';

export default function TemplatesPage() {
  return (
    <RafflesLayout activeTab="templates">
      <PrizeTemplateList />
    </RafflesLayout>
  );
}