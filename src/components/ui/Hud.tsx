import { memo } from "react";
import {
  selectCollectedItems,
  selectObjectives,
  selectPlayerPosition,
  selectUnlockedAreas,
  usePlayerStore,
} from "../../store/playerStore";

const formatVector = ([x, y, z]: [number, number, number]) =>
  `${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}`;

export const Hud = memo(function Hud() {
  const position = usePlayerStore(selectPlayerPosition);
  const unlockedAreas = usePlayerStore(selectUnlockedAreas);
  const collectedItems = usePlayerStore(selectCollectedItems);
  const objectives = usePlayerStore(selectObjectives);

  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div className="pointer-events-auto w-64 rounded-lg bg-slate-900/70 p-4 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold uppercase tracking-wide text-slate-200">
            Objectives
          </h2>
          <ul className="mt-2 space-y-2 text-sm">
            {objectives.map((objective) => (
              <li
                key={objective.id}
                className={`flex items-center gap-2 rounded-md border border-white/10 bg-slate-800/60 px-3 py-2 shadow-inner ${
                  objective.completed
                    ? "border-emerald-400/50 text-emerald-200"
                    : "text-slate-100"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    objective.completed ? "bg-emerald-400" : "bg-slate-400"
                  }`}
                />
                <span className="flex-1 leading-snug">{objective.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="pointer-events-auto w-48 rounded-lg bg-slate-900/70 p-4 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold uppercase tracking-wide text-slate-200">
            Controls
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-100">
            <li><strong>WASD</strong> Move</li>
            <li><strong>Space</strong> Jump</li>
            <li><strong>Shift</strong> Sprint</li>
            <li><strong>E</strong> Interact</li>
          </ul>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="pointer-events-auto min-w-[16rem] rounded-lg bg-slate-900/70 p-4 text-sm shadow-lg backdrop-blur">
          <div className="flex items-center justify-between text-slate-200">
            <span className="font-semibold uppercase tracking-wide">Status</span>
            <span>{formatVector(position)}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
            <div>
              <h3 className="font-semibold uppercase tracking-wide text-slate-300">
                Unlocked
              </h3>
              <ul className="mt-1 space-y-1">
                {unlockedAreas.map((area) => (
                  <li key={area} className="rounded bg-slate-800/70 px-2 py-1">
                    {area}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold uppercase tracking-wide text-slate-300">
                Inventory
              </h3>
              <ul className="mt-1 space-y-1">
                {collectedItems.length === 0 && (
                  <li className="rounded bg-slate-800/70 px-2 py-1 text-slate-400">
                    Empty
                  </li>
                )}
                {collectedItems.map((item) => (
                  <li key={item} className="rounded bg-slate-800/70 px-2 py-1">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="pointer-events-auto w-48 rounded-lg border border-white/10 bg-slate-900/80 p-4 shadow-xl backdrop-blur">
          <h2 className="text-lg font-semibold uppercase tracking-wide text-slate-200">
            Minimap
          </h2>
          <div className="mt-3 flex aspect-square items-center justify-center rounded-md border border-white/10 bg-slate-950/70 text-xs text-slate-400">
            <span>Map rendering placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );
});
