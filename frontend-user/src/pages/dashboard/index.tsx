// src/pages/dashboard/index.tsx
import { NextPage } from 'next';
import Head from 'next/head';
import { withAuth } from '@/components/auth/withAuth';
import dynamic from 'next/dynamic';
import { AuthService } from '@/lib/auth';

// Dynamic import for RaffleHomepage with disabled SSR
const RaffleHomepage = dynamic(
  () => import('@/components/pages/RaffleHomepage'),
  { ssr: false }
);

const DashboardPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>WildRandom | Dashboard</title>
        <meta name="description" content="Your WildRandom gaming dashboard" />
      </Head>
      <RaffleHomepage />
    </>
  );
};

// Apply authentication protection
export default withAuth(DashboardPage); 