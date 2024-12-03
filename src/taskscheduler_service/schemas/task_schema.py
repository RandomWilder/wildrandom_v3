from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from datetime import datetime, timezone
from ..models.enums import TaskType, TaskStatus

class TaskCreateSchema(Schema):
    """Schema for task creation validation"""
    
    task_type = fields.Str(
        required=True,
        validate=validate.OneOf(TaskType.list_values())
    )
    target_id = fields.Int(required=True)
    execution_time = fields.DateTime(required=True)
    params = fields.Dict(keys=fields.Str(), values=fields.Raw(), required=False)
    
    @validates_schema
    def validate_execution_time(self, data, **kwargs):
        """Validate execution time is in the future"""
        if data['execution_time'] <= datetime.now(timezone.utc):
            raise ValidationError('Execution time must be in the future')

class TaskUpdateSchema(Schema):
    """Schema for task updates"""
    
    status = fields.Str(
        validate=validate.OneOf([s.value for s in TaskStatus])
    )
    execution_time = fields.DateTime()
    params = fields.Dict(keys=fields.Str(), values=fields.Raw())
    
    @validates_schema
    def validate_execution_time(self, data, **kwargs):
        """Validate execution time if provided"""
        if 'execution_time' in data and data['execution_time'] <= datetime.now(timezone.utc):
            raise ValidationError('Execution time must be in the future')

class TaskResponseSchema(Schema):
    """Schema for task responses"""
    
    id = fields.Str(required=True)
    task_type = fields.Str(required=True)
    target_id = fields.Int(required=True)
    execution_time = fields.DateTime(required=True)
    status = fields.Str(required=True)
    retry_count = fields.Int(required=True)
    last_error = fields.Str(allow_none=True)
    last_retry = fields.DateTime(allow_none=True)
    params = fields.Dict(keys=fields.Str(), values=fields.Raw(), allow_none=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)