import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Clock3,
  Eye,
  EyeOff,
  FileSearch,
  Flag,
  Hand,
  HeartHandshake,
  History,
  Image,
  Info,
  Layers,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  type LucideIcon,
  MessageCircle,
  MessageSquareWarning,
  MessagesSquare,
  Moon,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldBan,
  ShieldCheck,
  Sun,
  Timer,
  UserMinus,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

// los iconos del diseno son de lucide: se usan directo, sin exportar svg
const icons = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  check: Check,
  "chevron-down": ChevronDown,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  "clock-3": Clock3,
  eye: Eye,
  "eye-off": EyeOff,
  "file-search": FileSearch,
  flag: Flag,
  hand: Hand,
  "heart-handshake": HeartHandshake,
  history: History,
  image: Image,
  info: Info,
  layers: Layers,
  "layout-dashboard": LayoutDashboard,
  "lock-keyhole": LockKeyhole,
  "log-out": LogOut,
  "message-circle": MessageCircle,
  "message-square-warning": MessageSquareWarning,
  "messages-square": MessagesSquare,
  moon: Moon,
  plus: Plus,
  "refresh-cw": RefreshCw,
  "rotate-ccw": RotateCcw,
  search: Search,
  "shield-ban": ShieldBan,
  "shield-check": ShieldCheck,
  sun: Sun,
  timer: Timer,
  "user-minus": UserMinus,
  "user-plus": UserPlus,
  "user-round": UserRound,
  users: Users,
  x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export interface IconProps {
  name: IconName;
  size?: number;
  // el color sale del texto: pasar una clase como "text-brand"
  className?: string;
}

// decorativo: el texto de al lado ya dice lo que significa
export function Icon({ name, size = 16, className }: IconProps) {
  const Component = icons[name];
  return (
    <Component
      aria-hidden
      data-icon={name}
      width={size}
      height={size}
      className={cn("shrink-0 text-muted-foreground", className)}
    />
  );
}
