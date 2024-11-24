from typing import Optional, Tuple, List, Dict
from sqlalchemy.exc import SQLAlchemyError
from src.prize_center_service.models import PrizeInstance, InstantWinInstance, DrawWinInstance
import logging

logger = logging.getLogger(__name__)

class InstanceService:
    """Prize instance management service"""
    
    @staticmethod
    def get_instance(instance_id: str) -> Tuple[Optional[PrizeInstance], Optional[str]]:
        """Get instance by ID"""
        try:
            instance = PrizeInstance.query.filter_by(instance_id=instance_id).first()
            if not instance:
                return None, "Instance not found"
            return instance, None
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_instance: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_pool_instances(pool_id: int, type: str = None) -> Tuple[Optional[List[PrizeInstance]], Optional[str]]:
        """Get instances for a pool"""
        try:
            query = PrizeInstance.query.filter_by(pool_id=pool_id)
            
            if type == 'instant_win':
                query = query.with_polymorphic(InstantWinInstance)
            elif type == 'draw_win':
                query = query.with_polymorphic(DrawWinInstance)
                
            instances = query.all()
            return instances, None
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_pool_instances: {str(e)}")
            return None, str(e)