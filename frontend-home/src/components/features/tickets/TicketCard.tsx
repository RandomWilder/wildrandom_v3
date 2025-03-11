import React from 'react';
import TicketCardImplementation from './TicketCard/index';

/**
 * Bridge component that maintains compatibility with existing imports
 * while utilizing the new card animation implementation.
 * 
 * This ensures seamless integration with your TicketGridComponent
 * which imports from './TicketCard' path.
 */
const TicketCardComponent = (props: React.ComponentProps<typeof TicketCardImplementation>) => {
  return <TicketCardImplementation {...props} />;
};

export default TicketCardComponent;