import {
  Heart,
  Activity,
  Baby,
  ShieldAlert,
  ShieldCheck,
  Syringe,
  Apple,
  Stethoscope,
  Thermometer,
  Sparkles,
  Smile,
  Biohazard,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated service-icon map.
 *
 * Service icons are chosen from a FIXED picker list in the admin UI
 * (see admin/services `popularIcons`), so we only ever need this small set.
 *
 * Why this exists: the previous `import * as Icons from "lucide-react"` +
 * runtime `Icons[name]` lookup forced the WHOLE icon library (~hundreds of
 * components) into the client bundle — `optimizePackageImports` can't
 * tree-shake a dynamic namespace access. These named imports ship only the
 * icons below, cutting ~150 kB+ off the /services and /admin/services bundles.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Heart,
  Activity,
  Baby,
  ShieldAlert,
  ShieldCheck,
  Syringe,
  Apple,
  Stethoscope,
  Thermometer,
  Sparkles,
  Smile,
  Biohazard,
  ClipboardList,
};

export default function ServiceIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const Icon = (name && ICON_MAP[name]) || Heart;
  return <Icon className={className} />;
}
