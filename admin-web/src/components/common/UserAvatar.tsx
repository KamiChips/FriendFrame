import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface UserAvatarProps {
  initials: string;
  // foto del usuario; sin ella se muestran las iniciales
  imageUrl?: string | null;
  size?: number;
}

export function UserAvatar({ initials, imageUrl, size = 36 }: UserAvatarProps) {
  return (
    <Avatar style={{ width: size, height: size }}>
      {imageUrl && <AvatarImage src={imageUrl} alt="" />}
      <AvatarFallback
        className="bg-[#30C2D9] font-bold text-[#182240]"
        style={{ fontSize: Math.max(11, Math.round(size * 0.36)) }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
