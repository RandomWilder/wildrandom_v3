# src/prize_center_service/models/__init__.py

from .prize_template import PrizeTemplate, PrizeType, PrizeTier
from .prize_pool import PrizePool, PoolStatus
from .prize_instance import (
    PrizeInstance, 
    InstantWinInstance, 
    DrawWinInstance,
    InstanceStatus,
    DrawWinDistributionType
)

# Add direct import to make the enhanced functionality available
EnhancedPrizePool = PrizePool

__all__ = [
    'PrizeTemplate',
    'PrizeType',
    'PrizeTier',
    'PrizePool',
    'EnhancedPrizePool',  # Export the enhanced version
    'PoolStatus',
    'PrizeInstance',
    'InstantWinInstance',
    'DrawWinInstance',
    'InstanceStatus',
    'DrawWinDistributionType'
]