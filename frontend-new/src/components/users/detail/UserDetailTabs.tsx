// src/components/users/detail/UserDetailTabs.tsx

import React from 'react';
import { 
  Activity,
  CreditCard,
  Crown
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserActivity } from './UserActivity';
import { UserCredits } from './UserCredits';
import { UserLoyalty } from './UserLoyalty';
import type { UserDetail } from '@/types/users/models';
import { Card } from '@/components/ui/card';

interface TabItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
  badgeCount?: number;
}

const TabItem: React.FC<TabItemProps> = ({ value, icon, label, badgeCount }) => (
  <TabsTrigger value={value} className="flex items-center space-x-2">
    {icon}
    <span>{label}</span>
    {badgeCount !== undefined && (
      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
        {badgeCount}
      </span>
    )}
  </TabsTrigger>
);

export const UserDetailTabs: React.FC<{ user: UserDetail }> = ({ user }) => {
  // Calculate badge counts for tabs
  const recentActivityCount = user.recent_activities.length;

  return (
    <Card className="p-6">
      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="flex justify-start space-x-2 border-b border-gray-200 pb-2">
          <TabItem
            value="activity"
            icon={<Activity className="h-4 w-4" />}
            label="Activity"
            badgeCount={recentActivityCount}
          />
          <TabItem
            value="credits"
            icon={<CreditCard className="h-4 w-4" />}
            label="Credits"
          />
          <TabItem
            value="loyalty"
            icon={<Crown className="h-4 w-4" />}
            label="Loyalty"
          />
        </TabsList>

        <TabsContent value="activity" className="mt-6">
          <UserActivity userId={user.id} />
        </TabsContent>

        <TabsContent value="credits" className="mt-6">
          <UserCredits userId={user.id} />
        </TabsContent>

        <TabsContent value="loyalty" className="mt-6">
          <UserLoyalty userId={user.id} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};