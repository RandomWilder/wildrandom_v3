from typing import Optional, Tuple, List, Dict
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from src.shared import db
from src.prize_center_service.models import (
    PrizePool, PoolStatus, PrizeTemplate, 
    InstantWinInstance, DrawWinInstance, PrizeInstance,
    PrizeType, DrawWinDistributionType
)
import logging

logger = logging.getLogger(__name__)

class PoolService:
    """Prize pool management service"""
    
    @staticmethod
    def get_pool_by_name(name: str) -> Optional[PrizePool]:
        """Get pool by name"""
        try:
            return PrizePool.query.filter_by(name=name).first()
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_pool_by_name: {str(e)}")
            return None

    @staticmethod
    def get_last_instance_number(pool_id: int, template_id: int) -> int:
        """Get last instance number for a pool and template combination"""
        try:
            result = db.session.query(
                db.func.max(
                    db.cast(
                        db.func.substring_index(PrizeInstance.instance_id, '-', -1),
                        db.Integer
                    )
                )
            ).filter(
                PrizeInstance.pool_id == pool_id,
                PrizeInstance.template_id == template_id
            ).scalar()
            return result or 0
        except SQLAlchemyError as e:
            logger.error(f"Error getting last instance number: {str(e)}")
            return 0

    @staticmethod
    def create_pool(data: Dict, admin_id: int) -> Tuple[Optional[PrizePool], Optional[str]]:
        """Create a new prize pool"""
        try:
            logger.info(f"Creating new pool with name: {data['name']}")
            logger.debug(f"Full pool data: {data}")
            
            # Additional validation
            if not data.get('name'):
                logger.error("Pool name is required")
                return None, "Pool name is required"
                
            # Check for existing pool
            existing = PoolService.get_pool_by_name(data['name'])
            if existing:
                logger.error(f"Pool with name '{data['name']}' already exists")
                return None, f"Pool with name '{data['name']}' already exists"

            # Create new pool
            pool = PrizePool(
                name=data['name'],
                description=data.get('description'),
                status=PoolStatus.UNLOCKED,
                total_instances=0,
                instant_win_instances=0,
                draw_win_instances=0,
                retail_total=0,
                cash_total=0,
                credit_total=0,
                total_odds=0,
                created_by_id=admin_id
            )
            
            db.session.add(pool)
            
            try:
                db.session.commit()
                logger.info(f"Successfully created pool with ID: {pool.id}")
                return pool, None
                
            except IntegrityError as e:
                db.session.rollback()
                logger.error(f"Integrity error creating pool: {str(e)}")
                return None, "Pool creation failed - name must be unique"
                
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in create_pool: {str(e)}")
            return None, f"Database error: {str(e)}"
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error in create_pool: {str(e)}", exc_info=True)
            return None, f"Unexpected error: {str(e)}"

    @staticmethod
    def allocate_template(pool_id: int, data: Dict, admin_id: int) -> Tuple[Optional[List[PrizeInstance]], Optional[str]]:
        """Allocate prize template instances to pool"""
        try:
            logger.info(f"Allocating template to pool {pool_id}")
            logger.debug(f"Allocation data: {data}")
            
            # Get pool
            pool = PrizePool.query.filter_by(id=pool_id).first()
            if not pool:
                logger.error(f"Pool {pool_id} not found")
                return None, "Pool not found"
                
            if not pool.can_modify():
                logger.error(f"Pool {pool_id} cannot be modified")
                return None, "Pool cannot be modified - already locked or in use"
                
            # Get template
            template = PrizeTemplate.query.get(data['template_id'])
            if not template:
                logger.error(f"Template {data.get('template_id')} not found")
                return None, "Template not found"
                
            quantity = data['quantity']
            instances = []
            
            # Get starting instance number
            current_max = PoolService.get_last_instance_number(pool_id, template.id)
            
            try:
                if template.type == PrizeType.INSTANT_WIN:
                    if 'collective_odds' not in data:
                        logger.error("Collective odds required for instant win prizes")
                        return None, "Collective odds required for instant win prizes"
                        
                    individual_odds = data['collective_odds'] / quantity
                    logger.info(f"Creating {quantity} instant win instances with individual odds: {individual_odds}")
                    
                    for i in range(quantity):
                        instance = InstantWinInstance(
                            instance_id=f"{pool_id}-{template.id}-{(current_max + i + 1):03d}",
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
                        pool.instant_win_instances += 1
                        pool.total_odds += individual_odds
                        
                elif template.type == PrizeType.DRAW_WIN:
                    if 'distribution_type' not in data:
                        logger.error("Distribution type required for draw win prizes")
                        return None, "Distribution type required for draw win prizes"
                        
                    dist_type = DrawWinDistributionType(data['distribution_type'])
                    logger.info(f"Creating {quantity} draw win instances with distribution type: {dist_type.value}")
                    
                    for i in range(quantity):
                        instance = DrawWinInstance(
                            instance_id=f"{pool_id}-{template.id}-{(current_max + i + 1):03d}",
                            pool_id=pool_id,
                            template_id=template.id,
                            distribution_type=dist_type,
                            retail_value=template.retail_value if dist_type == DrawWinDistributionType.FULL else template.retail_value/quantity,
                            cash_value=template.cash_value if dist_type == DrawWinDistributionType.FULL else template.cash_value/quantity,
                            credit_value=template.credit_value if dist_type == DrawWinDistributionType.FULL else template.credit_value/quantity,
                            created_by_id=admin_id
                        )
                        instances.append(instance)
                        pool.draw_win_instances += 1
                
                # Update pool totals for both types
                pool.total_instances += quantity
                for instance in instances:
                    pool.retail_total += instance.retail_value
                    pool.cash_total += instance.cash_value
                    pool.credit_total += instance.credit_value
                    
                db.session.add_all(instances)
                db.session.commit()
                
                return instances, None
                    
            except IntegrityError as e:
                db.session.rollback()
                logger.error(f"Integrity error allocating instances: {str(e)}")
                return None, "Failed to allocate instances - integrity error"
                
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in allocate_template: {str(e)}")
            return None, f"Database error: {str(e)}"
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error in allocate_template: {str(e)}", exc_info=True)
            return None, f"Unexpected error: {str(e)}"

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

    @staticmethod
    def list_active_pools() -> Tuple[Optional[List[PrizePool]], Optional[str]]:
        """List all active prize pools"""
        try:
            pools = PrizePool.query.filter(
                PrizePool.status != PoolStatus.USED
            ).order_by(PrizePool.created_at.desc()).all()
            return pools, None
        except SQLAlchemyError as e:
            logger.error(f"Database error in list_active_pools: {str(e)}")
            return None, str(e)