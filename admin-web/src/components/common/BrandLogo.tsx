import { cn } from "@/lib/utils";

// nombre de la marca con el degradado del diseno recortado al texto
export function BrandLogo({ size, className }: { size: number; className?: string }) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-[#30C2D9] to-[#FF9B42] bg-clip-text font-brand text-transparent dark:from-[#AA3E14] dark:to-[#115A67]",
        className,
      )}
      style={{ fontSize: size, lineHeight: 1.8 }}
    >
      FriendFrame
    </span>
  );
}
