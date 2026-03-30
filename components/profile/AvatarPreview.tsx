import { getAvatarLabel, getAvatarLayerStyle } from "@/lib/avatar";

type AvatarPreviewProps = {
  base: string;
  hair: string;
  outfit: string;
  accessory: string | null;
  size?: "sm" | "lg";
};

export default function AvatarPreview({
  base,
  hair,
  outfit,
  accessory,
  size = "lg",
}: AvatarPreviewProps) {
  const frameClass =
    size === "lg" ? "w-40 h-40 rounded-[2rem]" : "w-24 h-24 rounded-[1.5rem]";
  const labelClass = size === "lg" ? "text-[10px]" : "text-[8px]";

  return (
    <div
      className={`relative ${frameClass} overflow-hidden bg-gradient-to-b from-indigo-100 via-white to-purple-100 border border-white/80 shadow-inner ring-1 ring-purple-100/80 transition duration-300 hover:shadow-[0_18px_45px_-24px_rgba(99,102,241,0.45)] hover:ring-purple-200`}
    >
      <div className="absolute inset-x-8 top-6 h-16 rounded-t-[2rem] rounded-b-2xl bg-amber-100 border border-amber-200" />
      <div className="absolute inset-x-10 top-10 h-16 rounded-[2rem] bg-amber-200/60" />
      <div className={`absolute ${getAvatarLayerStyle(base)}`} />
      <div className={`absolute ${getAvatarLayerStyle(hair)}`} />
      <div className={`absolute ${getAvatarLayerStyle(outfit)}`} />
      {accessory ? <div className={`absolute ${getAvatarLayerStyle(accessory)}`} /> : null}

      <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1">
        {[hair, outfit, accessory].filter(Boolean).map((itemId) => (
          <span
            key={itemId}
            className={`${labelClass} px-2 py-1 rounded-full bg-white/85 text-neutral-700 border border-white`}
          >
            {getAvatarLabel(itemId)}
          </span>
        ))}
      </div>
    </div>
  );
}
