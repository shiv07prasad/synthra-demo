import { passAt, progress, T } from "../../theatre/timeline";
import type { Viz } from "../../theatre/derive";
import type { Run } from "../../engine/run";

const PASS_LABEL = {
  naive: "pass 1",
  mid: "pass 2 · amount repaired",
  final: "pass 3 · cohort repaired",
};

const inr = (v: number) => `₹${v.toLocaleString("en-IN")}`;

export default function LiveRows({ t, run, viz }: { t: number; run: Run; viz: Viz }) {
  const pass = passAt(t);
  const data = run.passes[pass];
  const count = Math.floor(progress(t, T.rows) * 5000);
  const cohortMode = t >= T.beam2[0];

  const display = cohortMode
    ? t >= T.passFinal
      ? viz.cohortRows.model
      : viz.cohortRows.dup
    : data.slice(Math.max(0, count - 6), count).map((row, k) => ({ row, index: Math.max(0, count - 6) + k, source: -1 }));

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="leading-tight">
          <p className="text-[13.5px] font-semibold tracking-tight text-ink">
            {cohortMode ? "Rare-cohort rows · under review" : "Synthetic rows · live"}
          </p>
          <p className="font-mono text-[10.5px] text-ink-mute">
            {cohortMode ? "65+ · regional language" : `${count.toLocaleString("en-IN")} streamed · every name & phone is fake`}
          </p>
        </div>
        {count > 0 && (
          <span
            key={pass}
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] [animation:cell-flash_1.2s_ease-out] ${
              pass === "final" ? "border-green-200 bg-green-50 text-green-700" : pass === "mid" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-line bg-[#f6f6f6] text-ink-soft"
            }`}
          >
            {PASS_LABEL[pass]}
          </span>
        )}
      </div>

      <div className="mt-2.5 min-h-0 flex-1 overflow-hidden">
        {display.length === 0 ? (
          <div className="grid h-full place-items-center rounded-lg border border-dashed border-line font-mono text-[11px] text-ink-mute">
            The Synthesizer will stream rows here
          </div>
        ) : (
          <table className="w-full table-fixed font-mono text-[10.5px]">
            <thead className="text-left text-ink-mute">
              <tr className="[&>th]:pb-1 [&>th]:font-normal">
                <th className="w-[44px]">#</th>
                <th className="w-[108px]">victim_name</th>
                <th className="w-[30px]">age</th>
                <th className="w-[66px]">language</th>
                <th className="w-[84px]">scam_type</th>
                <th className="w-[82px] text-right">amount</th>
                <th className="w-[46px] text-right">hours</th>
                <th className="w-[96px] pl-3">{cohortMode ? "provenance" : "recovered"}</th>
              </tr>
            </thead>
            <tbody>
              {display.map(({ row, index, source }) => (
                <tr key={`${pass}-${index}`} className="border-t border-line text-ink-soft [&>td]:truncate [&>td]:py-[5px]">
                  <td className="text-ink-mute">{index + 1}</td>
                  <td className="text-ink">{row.victim_name}</td>
                  <td>{row.victim_age}</td>
                  <td>{row.language}</td>
                  <td>{row.scam_type}</td>
                  <td className="text-right tabular-nums">
                    <span key={`${pass}-${row.amount_lost_inr}`} className="rounded px-0.5 [animation:cell-flash_1.2s_ease-out]">
                      {inr(row.amount_lost_inr)}
                    </span>
                  </td>
                  <td className="text-right tabular-nums">{row.hours_to_report}h</td>
                  <td className="pl-3">
                    {cohortMode ? (
                      source >= 0 ? (
                        <span className="rounded bg-rose-50 px-1 text-rose-700">≈ real victim #{source + 1}</span>
                      ) : (
                        <span className="rounded bg-green-50 px-1 text-green-700">model-sampled</span>
                      )
                    ) : row.funds_recovered ? (
                      <span className="text-green-700">yes</span>
                    ) : (
                      <span>no</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
