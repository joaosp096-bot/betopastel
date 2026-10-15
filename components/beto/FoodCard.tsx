"use client";
import { motion } from "framer-motion";
import {
  Beef,
  Flame,
  Leaf,
  Sprout,
  Crown,
  Egg,
  Drumstick,
  Pizza,
  Sandwich,
  CookingPot,
  Candy,
  Fish,
  Check,
  LockKeyhole,
  ChevronRight,
} from "lucide-react";
import type { Flavor } from "@/lib/model";
import {
  identity,
  descriptions,
  flavorIndex,
  flavorImages,
} from "@/lib/flavor-identity";
export const foodIcons = {
  Beef,
  Flame,
  Leaf,
  Sprout,
  Crown,
  Egg,
  Drumstick,
  Pizza,
  Cheese: Sandwich,
  Creamy: CookingPot,
  Candy,
  Fish,
};
export function FoodFace({
  flavor,
  index,
  large = false,
  shared = true,
}: {
  flavor: Flavor;
  index: number;
  large?: boolean;
  shared?: boolean;
}) {
  const style = identity(flavorIndex(flavor.id, index)),
    Icon = foodIcons[style.icon as keyof typeof foodIcons];
  return (
    <motion.div
      layoutId={shared ? "face-" + flavor.id : undefined}
      className={`foodface${large ? " large" : ""}`}
      style={{ backgroundColor: style.tint, color: style.accent }}
    >
      {flavorImages[flavor.id] ? (
        <img
          src={"/images/sabores/" + flavorImages[flavor.id] + ".webp"}
          width="900"
          height="900"
          loading="lazy"
          alt={"Pastel de " + flavor.name + ", imagem ilustrativa"}
        />
      ) : (
        <Icon strokeWidth={1.3} className="ingredienticon" />
      )}
      <motion.span
        layoutId={shared ? "seal-" + flavor.id : undefined}
        className="flavorseal"
        style={{ background: style.accent }}
      >
        {style.seal}
      </motion.span>
    </motion.div>
  );
}
export function FoodCard({
  flavor,
  index,
  value,
  detail,
  done,
  locked,
  onClick,
}: {
  flavor: Flavor;
  index: number;
  value: number | string;
  detail: string;
  done: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  const style = identity(flavorIndex(flavor.id, index));
  return (
    <motion.button
      type="button"
      layout
      layoutId={"flavor-" + flavor.id}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      whileTap={{ scale: 0.98 }}
      className={"foodcard" + (done ? " saved" : "")}
      onClick={onClick}
      style={{ borderTopColor: style.accent }}
    >
      <FoodFace flavor={flavor} index={index} />
      <div className="foodcardbody">
        <div className="foodtitleline">
          <motion.h3 layoutId={"title-" + flavor.id}>{flavor.name}</motion.h3>
          {done ? (
            <span className="savedtick" aria-label="Registrado">
              <Check size={15} />
            </span>
          ) : locked ? (
            <LockKeyhole size={15} className="muted" />
          ) : null}
        </div>
        <p>{descriptions[flavorIndex(flavor.id, index)] || flavor.name}</p>
        <div className="foodbottom">
          <div>
            <strong>{value}</strong>
            <span>{detail}</span>
          </div>
          <span className="cardopen" style={{ color: style.accent }}>
            <ChevronRight size={20} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}
