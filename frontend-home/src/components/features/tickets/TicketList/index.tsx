// src/components/features/tickets/TicketList/index.tsx

import { FC, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TicketGroup from './TicketGroup';
import Card from '../../../common/Card';
import type { RaffleContext, Ticket } from '../../../../features/tickets/types';

// Type Definitions
interface RaffleGroup {
 raffle: RaffleContext;
 tickets: Ticket[];
}

interface RaffleGroupResponse {
 [raffleId: string]: {
   raffle: RaffleContext;
   tickets: Ticket[];
 }
}

interface TicketListProps {
 groups: RaffleGroupResponse;
 className?: string;
}

// Touch-optimized animation configurations
const CONTAINER_VARIANTS = {
 hidden: { 
   opacity: 0,
   transition: {
     when: "afterChildren",
     duration: 0.2 // Quick fade for mobile perception
   }
 },
 visible: {
   opacity: 1,
   transition: {
     when: "beforeChildren",
     staggerChildren: 0.1,
     delayChildren: 0.1,
     duration: 0.3 // Smooth entry for visual hierarchy
   }
 }
};

// Hardware-accelerated group animations
const GROUP_VARIANTS = {
 hidden: { 
   opacity: 0, 
   y: 20,
   transition: {
     type: "spring",
     damping: 25,
     restDelta: 0.5 // Optimization for mobile processors
   }
 },
 visible: { 
   opacity: 1, 
   y: 0,
   transition: { 
     type: "spring", 
     stiffness: 300,
     damping: 30,
     mass: 0.8,
     restDelta: 0.5
   }
 }
};

// Data validation utility
const validateGroupData = (data: unknown): data is RaffleGroup => {
 return Boolean(
   data &&
   typeof data === 'object' &&
   'raffle' in data &&
   'tickets' in data &&
   Array.isArray((data as RaffleGroup).tickets)
 );
};

const TicketList: FC<TicketListProps> = ({ groups, className = '' }) => {
 // Validation effect
 useEffect(() => {
   if (!validateGroupData(Object.values(groups)[0])) {
     console.error('Invalid ticket group data structure');
   }
 }, [groups]);

 // Mobile-optimized group sorting with interaction prioritization
 const sortedGroups = useMemo(() => {
   return Object.entries(groups)
     .filter((entry): entry is [string, RaffleGroup] => {
       const [_, groupData] = entry;
       return Boolean(
         groupData?.raffle?.end_time &&
         Array.isArray(groupData.tickets)
       );
     })
     .sort(([_, a], [__, b]) => {
       const aEndTime = new Date(a.raffle.end_time);
       const bEndTime = new Date(b.raffle.end_time);
       
       // Prioritize interactive states for engagement
       const aUnrevealedCount = a.tickets.filter(t => !t.is_revealed).length;
       const bUnrevealedCount = b.tickets.filter(t => !t.is_revealed).length;
       
       // User action priority
       if (aUnrevealedCount !== bUnrevealedCount) {
         return bUnrevealedCount - aUnrevealedCount;
       }
       
       // Temporal sorting fallback
       return bEndTime.getTime() - aEndTime.getTime();
     });
 }, [groups]);

 // Touch-optimized empty state
 if (!groups || Object.keys(groups).length === 0) {
   return (
     <Card 
       className="p-6 touch-manipulation" 
       key="empty-state"
     >
       <div className="text-center">
         <h3 className="text-lg font-medium text-gray-900 mb-2">
           Ready to Start Your Collection?
         </h3>
         <p className="text-gray-600">
           Explore our active raffles to begin your winning journey!
         </p>
       </div>
     </Card>
   );
 }

 // Main render with hardware acceleration
 return (
   <div className={`${className} overscroll-y-contain will-change-transform`}>
     <AnimatePresence mode="wait" initial={false}>
       <motion.div
         variants={CONTAINER_VARIANTS}
         initial="hidden"
         animate="visible"
         className="space-y-4"
         layoutRoot
       >
         {sortedGroups.map(([raffleId, groupData]) => (
           <motion.div
             key={`raffle-${raffleId}`}
             variants={GROUP_VARIANTS}
             layout
             layoutId={`group-${raffleId}`}
             className="transform-gpu will-change-transform"
           >
             <TicketGroup 
               group={{
                 raffle: groupData.raffle,
                 tickets: groupData.tickets
               }}
               key={`group-content-${raffleId}`}
             />
           </motion.div>
         ))}
       </motion.div>
     </AnimatePresence>
   </div>
 );
};

export default TicketList;