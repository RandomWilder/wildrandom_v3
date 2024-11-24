from typing import Optional, Tuple, List, Dict
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.prize_center_service.models import PrizeTemplate, PrizeType
import logging

logger = logging.getLogger(__name__)

class TemplateService:
    """Prize template management service"""
    
    @staticmethod
    def create_template(data: Dict, admin_id: int) -> Tuple[Optional[PrizeTemplate], Optional[str]]:
        """Create a new prize template"""
        try:
            template = PrizeTemplate(
                name=data['name'],
                type=PrizeType(data['type']),
                tier=data['tier'],
                retail_value=data['retail_value'],
                cash_value=data['cash_value'],
                credit_value=data['credit_value'],
                created_by_id=admin_id
            )
            
            db.session.add(template)
            db.session.commit()
            
            return template, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in create_template: {str(e)}")
            return None, str(e)

    @staticmethod
    def update_template(template_id: int, data: Dict) -> Tuple[Optional[PrizeTemplate], Optional[str]]:
        """Update existing template if not used in pools"""
        try:
            template = PrizeTemplate.query.get(template_id)
            if not template:
                return None, "Template not found"
                
            if template.pools_count > 0:
                return None, "Cannot modify template used in pools"
                
            # Update allowed fields
            updateable_fields = ['name', 'tier', 'retail_value', 'cash_value', 'credit_value']
            for field in updateable_fields:
                if field in data:
                    setattr(template, field, data[field])
                    
            db.session.commit()
            return template, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in update_template: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_template(template_id: int) -> Tuple[Optional[PrizeTemplate], Optional[str]]:
        """Get template by ID"""
        try:
            template = PrizeTemplate.query.get(template_id)
            if not template:
                return None, "Template not found"
            return template, None
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_template: {str(e)}")
            return None, str(e)

    @staticmethod
    def list_templates(filters: Dict = None) -> Tuple[Optional[List[PrizeTemplate]], Optional[str]]:
        """List templates with optional filters"""
        try:
            query = PrizeTemplate.query.filter_by(is_deleted=False)
            
            if filters:
                if 'type' in filters:
                    query = query.filter_by(type=PrizeType(filters['type']))
                if 'tier' in filters:
                    query = query.filter_by(tier=filters['tier'])
                    
            templates = query.all()
            return templates, None
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in list_templates: {str(e)}")
            return None, str(e)