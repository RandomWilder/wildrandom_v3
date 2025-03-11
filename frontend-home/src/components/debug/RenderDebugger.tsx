// src/components/debug/RenderDebugger.tsx
import { FC, useEffect } from 'react';

interface RenderDebuggerProps {
  id: string;
  data: any;
  enabled?: boolean;
}

const RenderDebugger: FC<RenderDebuggerProps> = ({ id, data, enabled = true }) => {
  useEffect(() => {
    if (enabled) {
      console.debug(`[RenderDebugger:${id}] Component rendered with:`, data);
    }
  });
  
  if (!enabled) return null;
  
  return (
    <div className="hidden">
      {/* This component doesn't render anything visible */}
    </div>
  );
};

export default RenderDebugger;