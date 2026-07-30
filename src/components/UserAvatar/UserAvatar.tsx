import { ComponentProps } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export type UserAvatarSize = "sm" | "md" | "lg";

export interface UserAvatarProps extends Omit<ComponentProps<typeof Avatar>, "size"> {
  name: string;
  src?: string;
  size?: UserAvatarSize;
}

const SIZE_MAP: Record<UserAvatarSize, "default" | "sm" | "lg"> = {
  sm: "sm",
  md: "default",
  lg: "lg",
};

export function UserAvatar({ name, src, size = "md", ...rest }: UserAvatarProps) {
  return (
    <Avatar size={SIZE_MAP[size]} role="img" aria-label={name} {...rest}>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback aria-hidden="true">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
