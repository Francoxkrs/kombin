import { CloudRain, Moon, Sparkles, Thermometer } from "lucide-react";
import type { ContextNote } from "@/lib/context";

const ICONS = { rain: CloudRain, cold: Thermometer, "warm-night": Moon, taste: Sparkles };

/** "Chovendo agora em CG · Priorizando lugares cobertos": por que a ordem mudou agora. */
export function ContextNotes({ notes, className = "" }: { notes: ContextNote[]; className?: string }) {
  if (notes.length === 0) return null;
  return (
    <ul className={`space-y-1.5 ${className}`}>
      {notes.map((n) => {
        const Icon = ICONS[n.kind];
        return (
          <li key={n.kind} className="flex items-center gap-2 text-[15px] leading-snug">
            <Icon className={`size-[18px] shrink-0 ${n.kind === "taste" ? "" : "text-ipe"}`} strokeWidth={2} aria-hidden />
            <span>{n.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
