# src/prize_center_service/models/__init__.py

from .prize_template import PrizeTemplate, PrizeType, PrizeTier
from .prize_pool import PrizePool, PoolStatus
from .prize_instance import (
    PrizeInstance, 
    InstantWinInstance, 
    DrawWinInstance,
    DrawWinDistributionType
)
from .prize_states import (
    InstanceStatus,
    PrizeStateConfig,
    prize_states
)

# Enhanced functionality exports
EnhancedPrizePool = PrizePool

__all__ = [
    # Prize Template related
    'PrizeTemplate',
    'PrizeType',
    'PrizeTier',
    
    # Prize Pool related
    'PrizePool',
    'EnhancedPrizePool',
    'PoolStatus',
    
    # Prize Instance related
    'PrizeInstance',
    'InstantWinInstance',
    'DrawWinInstance',
    'DrawWinDistributionType',
    
    # State Management
    'InstanceStatus',
    'PrizeStateConfig',
    'prize_states'
]

# Version information
__version__ = '1.0.0'