/* ============================================================
   Global type augmentations
   ============================================================ */

import "lucide-react";

/**
 * lucide-react v1.25.0 ships icons that exist at runtime but are
 * absent from the official TypeScript declaration file. These
 * augmentations bridge the gap so the compiler stops complaining.
 */
declare module "lucide-react" {
  export const BellOff: React.ComponentType<{ className?: string }>;
  export const FileUp: React.ComponentType<{ className?: string }>;
  export const CalendarPlus: React.ComponentType<{ className?: string }>;
  export const Brain: React.ComponentType<{ className?: string }>;
  export const Gauge: React.ComponentType<{ className?: string }>;
  export const ArrowDown: React.ComponentType<{ className?: string }>;
  export const Users: React.ComponentType<{ className?: string }>;
  export const Fingerprint: React.ComponentType<{ className?: string }>;
}
