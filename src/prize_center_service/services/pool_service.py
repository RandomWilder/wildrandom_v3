from typing import Optional, Tuple, List, Dict
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.prize_center_service.models import (
    PrizePool, PoolStatus, PrizeTemplate, 
    InstantWinInstance, DrawWinInstance,
    PrizeType, DrawWinDistributionType
)
import logging

logger = logging.getLogger(__name__)

class PoolService:
    """Prize pool management service"""
    
    @staticmethod
    def create_pool(data: Dict, admin_id: int) -> Tuple[Optional[PrizePool], Optional[str]]:
        """Create a new prize pool"""
        try:
            pool = PrizePool(
                name=data['name'],
                description=data.get('description'),
                created_by_id=admin_id
            )
            
            db.session.add(pool)
            db.session.commit()
            
            return pool, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in create_pool: {str(e)}")
            return None, str(e)

    @staticmethod
    def allocate_template(pool_id: int, data: Dict, admin_id: int) -> Tuple[Optional[List], Optional[str]]:
        """Allocate prize template instances to pool"""
        try:
            pool = PrizePool.query.get(pool_id)
            if not pool:
                return None, "Pool not found"
                
            if not pool.can_modify():
                return None, "Pool cannot be modified"
                
            template = PrizeTemplate.query.get(data['template_id'])
            if not template:
                return None, "Template not found"
                
            quantity = data['quantity']
            instances = []
            
            if template.type == PrizeType.INSTANT_WIN:
                if 'collective_odds' not in data:
                    return None, "Collective odds required for instant win prizes"
                    
                individual_odds = data['collective_odds'] / quantity
                for i in range(quantity):
                    instance = InstantWinInstance(
                        instance_id=f"{pool_id}-{template.id}-{i+1:03d}",
                        pool_id=pool_id,
                        template_id=template.id,
                        individual_odds=individual_odds,
                        collective_odds=data['collective_odds'],
                        retail_value=template.retail_value,
                        cash_value=template.cash_value,
                        credit_value=template.credit_value,
                        created_by_id=admin_id
                    )
                    instances.append(instance)
                    
                pool.instant_win_instances += quantity
                
            elif template.type == PrizeType.DRAW_WIN:
                if 'distribution_type' not in data:
                    return None, "Distribution type required for draw win prizes"
                    
                dist_type = DrawWinDistributionType(data['distribution_type'])
                for i in range(quantity):
                    instance = DrawWinInstance(
                        instance_id=f"{pool_id}-{template.id}-{i+1:03d}",
                        pool_id=pool_id,
                        template_id=template.id,
                        distribution_type=dist_type,
                        retail_value=template.retail_value if dist_type == DrawWinDistributionType.FULL else template.retail_value/quantity,
                        cash_value=template.cash_value if dist_type == DrawWinDistributionType.FULL else template.cash_value/quantity,
                        credit_value=template.credit_value if dist_type == DrawWinDistributionType.FULL else template.credit_value/quantity,
                        created_by_id=admin_id
                    )
                    instances.append(instance)
                    
                pool.draw_win_instances += quantity
                
            # Update pool totals
            pool.total_instances += quantity
            for instance in instances:
                pool.retail_total += instance.retail_value
                pool.cash_total += instance.cash_value
                pool.credit_total += instance.credit_value
                
            db.session.add_all(instances)
            db.session.commit()
            
            return instances, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in allocate_template: {str(e)}")
            return None, str(e)

    @staticmethod
    def lock_pool(pool_id: int, admin_id: int) -> Tuple[Optional[Dict], Optional[str]]:
        """Lock prize pool if validation passes"""
        try:
            pool = PrizePool.query.get(pool_id)
            if not pool:
                return None, "Pool not found"
                
            if pool.status != PoolStatus.UNLOCKED:
                return None, "Pool is already locked or used"
                
            validation_errors = pool.validate_for_lock()
            if validation_errors:
                return {
                    'success': False,
                    'validation': {
                        'has_instances': pool.total_instances > 0,
                        'has_draw_win': pool.draw_win_instances > 0,
                        'odds_total': pool.total_odds,
                        'all_values_valid': True
                    },
                    'errors': validation_errors
                }, None
                
            pool.status = PoolStatus.LOCKED
            pool.locked_at = datetime.now(timezone.utc)
            pool.locked_by_id = admin_id
            
            db.session.commit()
            
            return {
                'success': True,
                'status': pool.status.value,
                'validation': {
                    'has_instances': True,
                    'has_draw_win': True,
                    'odds_total': pool.total_odds,
                    'all_values_valid': True
                }
            }, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in lock_pool: {str(e)}")
            return None, str(e)