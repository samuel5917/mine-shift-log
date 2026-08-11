import {
  Truck,
  Tractor,
  Construction,
  Forklift,
  Droplets,
  Fuel,
  Hammer,
  Ruler,
  CircleDashed,
  Container,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  EH: Construction,
  PC: Forklift,
  CB: Truck,
  CA: Fuel,
  CP: Droplets,
  MN: Ruler,
  RP: Hammer,
  RT: Tractor,
  TE: Tractor,
  RC: CircleDashed,
};

export function getEquipmentIcon(prefix: string): LucideIcon {
  return MAP[prefix?.toUpperCase()] ?? Container;
}

export function EquipmentIcon({
  prefix,
  className,
  size = 18,
}: {
  prefix: string;
  className?: string;
  size?: number;
}) {
  const Icon = getEquipmentIcon(prefix);
  return <Icon size={size} className={className} strokeWidth={1.9} aria-hidden="true" />;
}
