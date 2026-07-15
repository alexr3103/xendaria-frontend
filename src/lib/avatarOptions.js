import fallbackAvatar from "../assets/avatar.png";
import avatarFem from "../assets/avatars/avatar-fem.png";
import avatarMasc from "../assets/avatars/avatar-masc.png";
import avatarNonbin from "../assets/avatars/avatar-nonbin.png";
import avatarCatDog from "../assets/avatars/avatar-catdog.png";
import avatarAlien from "../assets/avatars/avatar-alien.png";

export const DEFAULT_AVATARS = [
  { id: "fem", label: "Fem", value: "avatar:fem", src: avatarFem },
  { id: "masc", label: "Masc", value: "avatar:masc", src: avatarMasc },
  { id: "nonbin", label: "Nonbin", value: "avatar:nonbin", src: avatarNonbin },
  { id: "catdog", label: "Cat/Dog", value: "avatar:catdog", src: avatarCatDog },
  { id: "alien", label: "Alien", value: "avatar:alien", src: avatarAlien },
];

export function resolveAvatarSrc(value) {
  const avatar = DEFAULT_AVATARS.find(
    (option) => option.value === value || option.id === value
  );

  return avatar?.src || value || fallbackAvatar;
}

export function getFallbackAvatar() {
  return fallbackAvatar;
}
