// src/pages/admin/raffles/[id]/tickets/index.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';

const RaffleTicketsPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      // Redirect to the main raffle view with tickets tab
      router.replace(`/admin/raffles/${id}?tab=tickets`);
    }
  }, [id, router]);

  // Return null as this is just a redirect page
  return null;
};

export default RaffleTicketsPage;