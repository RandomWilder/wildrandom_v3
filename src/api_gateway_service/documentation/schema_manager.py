# src/api_gateway_service/documentation/schema_manager.py

from typing import Dict, Type, Optional
from pydantic import BaseModel
import logging
from pathlib import Path
from datetime import datetime, timezone
import json

logger = logging.getLogger(__name__)

class SchemaManager:
    """
    Manages API schemas with frontend type generation support.
    
    Architectural Features:
    - TypeScript type generation
    - Schema validation rules
    - Frontend-backend type consistency
    """

    def __init__(self):
        self._schemas: Dict[str, Type[BaseModel]] = {}
        self._type_mappings = {
            "string": "string",
            "integer": "number",
            "number": "number",
            "boolean": "boolean",
            "array": "Array<any>",
            "object": "Record<string, any>"
        }

    def register_schema(self, schema: Type[BaseModel]) -> None:
        """Register schema for documentation and type generation"""
        self._schemas[schema.__name__] = schema

    def generate_typescript_types(self, output_file: str) -> None:
        """Generate TypeScript interfaces from registered schemas"""
        try:
            type_definitions = []
            
            for schema_name, schema in self._schemas.items():
                ts_interface = self._convert_to_typescript(schema)
                type_definitions.append(ts_interface)
            
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w') as f:
                f.write("// Auto-generated TypeScript interfaces\n")
                f.write("// Generated at: " + datetime.now(timezone.utc).isoformat() + "\n\n")
                f.write("\n\n".join(type_definitions))
                
            logger.info(f"TypeScript types generated at {output_file}")
            
        except Exception as e:
            logger.error(f"Type generation failed: {str(e)}", exc_info=True)
            raise

    def _convert_to_typescript(self, schema: Type[BaseModel]) -> str:
        """Convert Pydantic schema to TypeScript interface"""
        try:
            schema_json = schema.schema_json()
            schema_dict = json.loads(schema_json)
            
            properties = schema_dict.get("properties", {})
            required = schema_dict.get("required", [])
            
            interface_lines = [f"export interface {schema.__name__} {{"]
            
            for prop_name, prop_info in properties.items():
                prop_type = self._get_typescript_type(prop_info)
                optional = "" if prop_name in required else "?"
                description = prop_info.get("description", "")
                
                if description:
                    interface_lines.append(f"  /** {description} */")
                interface_lines.append(f"  {prop_name}{optional}: {prop_type};")
            
            interface_lines.append("}")
            return "\n".join(interface_lines)
            
        except Exception as e:
            logger.error(f"TypeScript conversion failed for {schema.__name__}: {str(e)}")
            return f"// Error converting {schema.__name__}"

    def _get_typescript_type(self, prop_info: Dict) -> str:
        """Map JSON Schema types to TypeScript types"""
        prop_type = prop_info.get("type")
        if prop_type == "array":
            items = prop_info.get("items", {})
            item_type = self._get_typescript_type(items)
            return f"Array<{item_type}>"
        elif prop_type == "object":
            if "$ref" in prop_info:
                ref_type = prop_info["$ref"].split("/")[-1]
                return ref_type
            return "Record<string, any>"
        else:
            return self._type_mappings.get(prop_type, "any")