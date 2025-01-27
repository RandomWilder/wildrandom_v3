#!/usr/bin/env python3
"""
API Documentation Generator Script

Comprehensive documentation generator for the WildRandom platform's service architecture.
Generates OpenAPI specifications, TypeScript types, and integration metadata for frontend consumption.

Architectural Features:
- Component-based generation pipeline
- Strict type safety throughout
- Comprehensive error handling
- Frontend integration context
- Cache strategy documentation
- Security scheme integration
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone
import logging
from typing import Dict, List, Optional, Union, Any
import json
import yaml
from abc import ABC, abstractmethod
from dataclasses import dataclass

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class GeneratorConfig:
    """Configuration for documentation generation pipeline"""
    output_dir: Path
    api_title: str = "WildRandom API Gateway"
    api_version: str = "1.0.0"
    api_description: str = "Frontend-optimized API Gateway for WildRandom platform"
    include_websocket: bool = True
    include_cache_strategies: bool = True
    typescript_output: bool = True

class DocumentationComponent(ABC):
    """Base class for documentation components"""
    
    def __init__(self, config: GeneratorConfig):
        self.config = config
        
    @abstractmethod
    def generate(self) -> None:
        """Generate documentation component"""
        pass
        
    def _ensure_output_dir(self) -> None:
        """Ensure output directory exists"""
        self.config.output_dir.mkdir(parents=True, exist_ok=True)

class TypeScriptGenerator(DocumentationComponent):
    """Generate TypeScript type definitions for frontend consumption"""
    
    def generate(self) -> None:
        """Generate TypeScript interface definitions"""
        try:
            self._ensure_output_dir()
            
            type_definitions = self._generate_core_types()
            output_file = self.config.output_dir / "api-types.ts"
            
            with open(output_file, 'w') as f:
                f.write(type_definitions)
                
            logger.info(f"TypeScript types generated at {output_file}")
            
        except Exception as e:
            logger.error(f"TypeScript generation failed: {str(e)}")
            raise

    def _generate_core_types(self) -> str:
        """Generate core TypeScript interfaces"""
        return f"""// Generated TypeScript types for {self.config.api_title}
// Generated at: {datetime.now(timezone.utc).isoformat()}

export interface ApiResponse<T = any> {{
    status: 'success' | 'error' | 'pending';
    data?: T;
    error?: string;
    metadata: Record<string, any>;
}}

export interface RequestBase {{
    request_id?: string;
    timestamp?: string;
    client_version?: string;
}}

export interface PaginatedResponse<T> {{
    items: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}}
"""

class IntegrationMetadataGenerator(DocumentationComponent):
    """Generate frontend integration metadata"""
    
    def generate(self) -> None:
        """Generate integration metadata"""
        try:
            self._ensure_output_dir()
            
            metadata = {
                "version": self.config.api_version,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "frontend_integration": {
                    "base_url": "/api",
                    "auth_header": "Authorization",
                    "token_type": "Bearer",
                    "websocket_endpoint": "/api/ws",
                    "max_request_size": 10 * 1024 * 1024  # 10MB
                },
                "caching": {
                    "default_ttl": 300,
                    "max_ttl": 3600,
                    "supported_strategies": ["memory", "redis"]
                },
                "rate_limiting": {
                    "default_rate": "100/minute",
                    "burst_size": 10
                }
            }
            
            output_file = self.config.output_dir / "integration-metadata.json"
            with open(output_file, 'w') as f:
                json.dump(metadata, f, indent=2)
                
            logger.info(f"Integration metadata generated at {output_file}")
            
        except Exception as e:
            logger.error(f"Metadata generation failed: {str(e)}")
            raise

class OpenAPIGenerator(DocumentationComponent):
    """Generate OpenAPI specification using enhanced generator"""
    
    def generate(self) -> None:
        """Generate OpenAPI specification"""
        try:
            self._ensure_output_dir()
            
            # Import our enhanced OpenAPI generator
            from src.api_gateway_service.documentation.openapi_generator import EnhancedOpenAPIGenerator
            
            # Generate specification using enhanced generator
            generator = EnhancedOpenAPIGenerator(self.config.output_dir)
            generator.generate()
            
            logger.info(f"OpenAPI specification generated at {self.config.output_dir / 'openapi.yaml'}")
            
        except Exception as e:
            logger.error(f"OpenAPI generation failed: {str(e)}")
            raise

class DocumentationGenerator:
    """Main documentation generation orchestrator"""
    
    def __init__(self, output_dir: Union[str, Path]):
        """Initialize documentation generator with configuration"""
        self.config = GeneratorConfig(
            output_dir=Path(output_dir)
        )
        self.components: List[DocumentationComponent] = []

    def initialize(self) -> None:
        """Initialize documentation components"""
        try:
            # Ensure output directory exists
            self.config.output_dir.mkdir(parents=True, exist_ok=True)
            
            # Initialize documentation components
            self.components = [
                OpenAPIGenerator(self.config),
                TypeScriptGenerator(self.config),
                IntegrationMetadataGenerator(self.config)
            ]
            
            logger.info("Documentation generator initialized successfully")
            
        except Exception as e:
            logger.error(f"Initialization failed: {str(e)}")
            raise

    def generate_documentation(self) -> None:
        """Generate all documentation components"""
        try:
            logger.info(f"Starting documentation generation at {datetime.now(timezone.utc)}")
            
            if not self.components:
                self.initialize()
            
            # Generate each component
            for component in self.components:
                component.generate()
            
            logger.info("Documentation generation completed successfully")
            
        except Exception as e:
            logger.error(f"Documentation generation failed: {str(e)}")
            raise

def main() -> None:
    """Main execution with comprehensive error handling"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Generate API Gateway Documentation",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        "--output",
        default="docs/api",
        help="Output directory for documentation"
    )
    
    args = parser.parse_args()

    try:
        generator = DocumentationGenerator(output_dir=args.output)
        generator.generate_documentation()
        
    except Exception as e:
        logger.error(f"Documentation generation failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()