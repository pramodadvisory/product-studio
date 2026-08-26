"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
import { Table2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import {
  badgeTone,
  newId,
  type Block,
  type ChartBlock,
  type Confidence,
  type ListBlock,
  type MetricsBlock,
  type RecordsBlock,
  type StatementBlock,
  type TimelineBlock,
} from "@/lib/product-board/schema";
import { BlockShell } from "./block-shell";
import {
  AddButton,
  EditableChip,
  EditableLine,
  EditableNumber,
  EditableText,
  RemoveButton,
} from "./editable";

/**
 * One renderer per block type. Each knows how to display *and* edit its type,
 * which is why adding a card to the board is a data change rather than writing
 * another bespoke layout.
 */
type BlockProps<T extends Block> = {
  block: T;
  update: (recipe: (draft: T) => void) => void;
};

const COLUMN_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

// ─────────────────────────────────────────────────────────────── statement

function StatementView({ block, update }: BlockProps<StatementBlock>) {
  const onHero = block.emphasis === "hero";

  return (
    <EditableText
      label={block.title}
      value={block.body}
      placeholder="Write the statement…"
      onCommit={(body) => update((d) => void (d.body = body))}
      className={cn(
        onHero
          ? "text-lg font-medium leading-relaxed text-white/95 md:text-xl"
          : "text-base font-medium leading-relaxed text-foreground"
      )}
    />
  );
}

// ───────────────────────────────────────────────────────────────── metrics

function MetricsView({ block, update }: BlockProps<MetricsBlock>) {
  // Values here are often long strings ("SaaS, E-commerce, B2B Marketplaces"),
  // so a narrow block gets one column rather than shredding them over 4 lines.
  const cols =
    block.size === "third"
      ? "grid-cols-1"
      : block.size === "full"
        ? "grid-cols-2 md:grid-cols-4"
        : "grid-cols-2";

  return (
    <div>
      <div className={cn("grid gap-x-4 gap-y-3", cols)}>
        {block.items.map((item, i) => (
          <div key={item.id} className="group/row min-w-0">
            <div className="flex items-center gap-1">
              <EditableLine
                label={`Metric ${i + 1} label`}
                value={item.label}
                onCommit={(label) => update((d) => void (d.items[i].label = label))}
                className="text-[10px] font-semibold uppercase tracking-wide text-foreground"
              />
              <RemoveButton
                label={`Remove ${item.label}`}
                onClick={() => update((d) => void d.items.splice(i, 1))}
              />
            </div>
            <EditableText
              label={`Metric ${i + 1} value`}
              value={item.value}
              onCommit={(value) => update((d) => void (d.items[i].value = value))}
              className="text-base font-semibold leading-snug"
            />
          </div>
        ))}
      </div>
      <AddButton
        className="mt-3"
        onClick={() =>
          update((d) => {
            d.items.push({ id: newId("m"), label: "New metric", value: "—" });
          })
        }
      >
        Add metric
      </AddButton>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────── list

function ListView({ block, update }: BlockProps<ListBlock>) {
  // Wide lists read better in two columns than as one long ribbon.
  const cols = block.size === "full" ? "sm:grid-cols-2" : "grid-cols-1";

  return (
    <div>
      <ul className={cn("grid gap-x-6 gap-y-1.5", cols)}>
        {block.items.map((item, i) => (
          <li key={item.id} className="group/row flex items-start gap-2">
            {block.checkable ? (
              <Checkbox
                className="mt-0.5"
                checked={Boolean(item.done)}
                onCheckedChange={(checked) =>
                  update((d) => void (d.items[i].done = checked === true))
                }
                aria-label={item.text}
              />
            ) : (
              <span
                aria-hidden
                className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50"
              />
            )}
            <EditableText
              label={`Item ${i + 1}`}
              value={item.text}
              onCommit={(text) => update((d) => void (d.items[i].text = text))}
              className={cn(
                "text-sm leading-relaxed",
                item.done ? "text-muted-foreground line-through" : "text-foreground"
              )}
            />
            <RemoveButton
              className="mt-0.5"
              label={`Remove ${item.text}`}
              onClick={() => update((d) => void d.items.splice(i, 1))}
            />
          </li>
        ))}
      </ul>
      <AddButton
        className="mt-2"
        onClick={() =>
          update((d) => {
            d.items.push({ id: newId("i"), text: "", done: block.checkable ? false : undefined });
          })
        }
      >
        Add item
      </AddButton>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────── records

function RecordsView({ block, update }: BlockProps<RecordsBlock>) {
  const titleField = block.fields.find((f) => f.kind === "title");
  const badgeFields = block.fields.filter((f) => f.kind === "badge");
  const textFields = block.fields.filter((f) => f.kind === "text");

  return (
    <div>
      <div className={cn("grid gap-3", COLUMN_CLASS[block.columns] ?? COLUMN_CLASS[2])}>
        {block.items.map((item, i) => (
          <article
            key={item.id}
            // Tint + spacing carry the grouping, not another border — records
            // blocks already sit inside a card or plain shell, and a border here
            // too used to read as a card nested in a card.
            className="group/row rounded-lg bg-foreground/[0.045] p-3.5 transition-colors hover:bg-foreground/[0.07]"
          >
            <div className="mb-2 flex items-start gap-2">
              {titleField ? (
                <EditableText
                  label={`${titleField.label} ${i + 1}`}
                  value={item.values[titleField.key] ?? ""}
                  placeholder={titleField.label}
                  onCommit={(v) =>
                    update((d) => void (d.items[i].values[titleField.key] = v))
                  }
                  className="text-sm font-semibold leading-snug"
                />
              ) : null}
              <RemoveButton
                label="Remove record"
                onClick={() => update((d) => void d.items.splice(i, 1))}
              />
            </div>

            {badgeFields.length ? (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {badgeFields.map((field) => {
                  const value = item.values[field.key] ?? "";
                  return (
                    <EditableChip
                      key={field.key}
                      label={`${field.label} for record ${i + 1}`}
                      value={value}
                      tone={badgeTone(value)}
                      onCommit={(v) =>
                        update((d) => void (d.items[i].values[field.key] = v))
                      }
                    />
                  );
                })}
              </div>
            ) : null}

            <dl className="space-y-1.5">
              {textFields.map((field) => (
                <div key={field.key}>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {field.label}
                  </dt>
                  <dd>
                    <EditableText
                      label={`${field.label} for record ${i + 1}`}
                      value={item.values[field.key] ?? ""}
                      placeholder="—"
                      onCommit={(v) =>
                        update((d) => void (d.items[i].values[field.key] = v))
                      }
                      className="text-sm leading-relaxed text-foreground"
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <AddButton
        className="mt-3"
        onClick={() =>
          update((d) => {
            const values: Record<string, string> = {};
            for (const f of d.fields) values[f.key] = "";
            d.items.push({ id: newId("rec"), values });
          })
        }
      >
        Add {titleField?.label.toLowerCase() ?? "record"}
      </AddButton>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────── timeline

function TimelineView({ block, update }: BlockProps<TimelineBlock>) {
  return (
    <div>
      <div className="space-y-5">
        {block.items.map((phase, i) => (
          <div key={phase.id} className="group/row relative pl-7">
            <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary ring-2 ring-primary/25" />
            {i < block.items.length - 1 ? (
              <span className="absolute left-[5px] top-5 h-[calc(100%+0.75rem)] w-px bg-border" />
            ) : null}

            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <EditableLine
                label={`Phase ${i + 1} name`}
                value={phase.label}
                onCommit={(v) => update((d) => void (d.items[i].label = v))}
                className="min-w-0 flex-1 text-sm font-semibold"
              />
              <EditableLine
                label={`Phase ${i + 1} timing`}
                value={phase.meta}
                onCommit={(v) => update((d) => void (d.items[i].meta = v))}
                className="w-auto shrink-0 text-xs font-medium tabular-nums text-foreground"
              />
              <RemoveButton
                label={`Remove ${phase.label}`}
                onClick={() => update((d) => void d.items.splice(i, 1))}
              />
            </div>

            <ul className="mb-2 space-y-1">
              {phase.bullets.map((bullet, bi) => (
                <li key={bi} className="group/bullet flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50"
                  />
                  <EditableText
                    label={`Milestone ${bi + 1} of ${phase.label}`}
                    value={bullet}
                    onCommit={(v) => update((d) => void (d.items[i].bullets[bi] = v))}
                    className="text-sm text-foreground"
                  />
                  <RemoveButton
                    className="mt-0.5 group-hover/bullet:opacity-100"
                    label="Remove milestone"
                    onClick={() => update((d) => void d.items[i].bullets.splice(bi, 1))}
                  />
                </li>
              ))}
            </ul>

            <AddButton
              onClick={() => update((d) => void d.items[i].bullets.push(""))}
            >
              Add milestone
            </AddButton>

            <div className="mt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                Resources
              </span>
              <EditableText
                label={`Resources for ${phase.label}`}
                value={phase.note}
                onCommit={(v) => update((d) => void (d.items[i].note = v))}
                className="text-sm text-foreground"
              />
            </div>
          </div>
        ))}
      </div>

      <AddButton
        className="mt-4"
        onClick={() =>
          update((d) => {
            d.items.push({
              id: newId("ph"),
              label: "New phase",
              meta: "",
              bullets: [],
              note: "",
            });
          })
        }
      >
        Add phase
      </AddButton>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────── chart

function ChartView({ block, update }: BlockProps<ChartBlock>) {
  const [editing, setEditing] = useState(false);

  const config = Object.fromEntries(
    block.series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) as ChartConfig;

  const data = block.rows.map((row) => ({ label: row.label, ...row.values }));
  const fmt = (v: number) => (block.unit === "currency-m" ? `$${v}M` : String(v));

  return (
    <div className="flex flex-col">
      {/*
        Recharts' ResponsiveContainer is height:100%, which resolves against the
        parent's `height` property — a min-height + flex-1 parent stays `auto` and
        the chart collapses to 0. So give the container a definite height.
      */}
      <ChartContainer
        config={config}
        className={cn(
          "w-full !aspect-auto",
          block.variant === "radar" ? "h-[240px]" : "h-[200px]"
        )}
      >
        {block.variant === "area" ? (
          <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={38}
              tickFormatter={fmt}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <defs>
              <linearGradient id={`fill-${block.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={block.series[0]?.color} stopOpacity={0.7} />
                <stop offset="95%" stopColor={block.series[0]?.color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            {block.series.map((s) => (
              <Area
                key={s.key}
                dataKey={s.key}
                type="natural"
                fill={`url(#fill-${block.id})`}
                stroke={s.color}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : block.variant === "bar" ? (
          <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={38} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            {block.series.map((s) => (
              <Bar key={s.key} dataKey={s.key} fill={s.color} radius={6} />
            ))}
          </BarChart>
        ) : (
          <RadarChart data={data} margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="label" tick={{ fontSize: 10 }} />
            <PolarGrid />
            {block.series.map((s, si) => (
              <Radar
                key={s.key}
                name={s.label}
                dataKey={s.key}
                stroke={s.color}
                fill={s.color}
                fillOpacity={si === 0 ? 0.55 : 0.2}
                dot={{ r: si === 0 ? 3 : 2, fillOpacity: 1 }}
              />
            ))}
          </RadarChart>
        )}
      </ChartContainer>

      <div className="mt-2 flex items-start justify-between gap-3">
        <EditableText
          label={`${block.title} caption`}
          value={block.caption}
          placeholder="Add a caption…"
          onCommit={(caption) => update((d) => void (d.caption = caption))}
          className="text-xs text-foreground"
        />
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-expanded={editing}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors",
            editing
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground"
          )}
        >
          <Table2 className="h-3.5 w-3.5" />
          {editing ? "Hide data" : "Edit data"}
        </button>
      </div>

      {/* Chart data is editable too — as a compact table, kept out of the way. */}
      {editing ? (
        <div className="mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                  Row
                </th>
                {block.series.map((s) => (
                  <th
                    key={s.key}
                    className="px-2 py-1.5 text-right font-medium text-muted-foreground"
                  >
                    {s.label}
                  </th>
                ))}
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={row.id} className="group/row border-b last:border-0">
                  <td className="px-2 py-1">
                    <EditableLine
                      label={`Row ${ri + 1} label`}
                      value={row.label}
                      onCommit={(v) => update((d) => void (d.rows[ri].label = v))}
                      className="text-xs"
                    />
                  </td>
                  {block.series.map((s) => (
                    <td key={s.key} className="px-2 py-1">
                      <EditableNumber
                        label={`${s.label} for ${row.label}`}
                        value={row.values[s.key] ?? 0}
                        onCommit={(v) => update((d) => void (d.rows[ri].values[s.key] = v))}
                        className="text-xs"
                      />
                    </td>
                  ))}
                  <td className="px-1">
                    <RemoveButton
                      label={`Remove ${row.label}`}
                      onClick={() => update((d) => void d.rows.splice(ri, 1))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-1.5">
            <AddButton
              onClick={() =>
                update((d) => {
                  const values: Record<string, number> = {};
                  for (const s of d.series) values[s.key] = 0;
                  d.rows.push({ id: newId("row"), label: "New", values });
                })
              }
            >
              Add row
            </AddButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────── switch

export function BlockRenderer({
  block,
  mutateBlock,
}: {
  block: Block;
  mutateBlock: (blockId: string, recipe: (block: Block) => void) => void;
}) {
  // The switch below narrows `block`, so each recipe is correctly typed at the
  // call site; the cast just bridges the generic `Block` signature of mutateBlock.
  const update = <T extends Block>(recipe: (draft: T) => void) =>
    mutateBlock(block.id, recipe as (b: Block) => void);

  let body: React.ReactNode = null;
  switch (block.type) {
    case "statement":
      body = <StatementView block={block} update={update} />;
      break;
    case "metrics":
      body = <MetricsView block={block} update={update} />;
      break;
    case "list":
      body = <ListView block={block} update={update} />;
      break;
    case "records":
      body = <RecordsView block={block} update={update} />;
      break;
    case "timeline":
      body = <TimelineView block={block} update={update} />;
      break;
    case "chart":
      body = <ChartView block={block} update={update} />;
      break;
  }

  // `description` and `confidence` live on BlockBase, common to every variant,
  // so they can be committed generically here rather than duplicated in each
  // *View above.
  const updateDescription = (next: string) =>
    mutateBlock(block.id, (b) => void (b.description = next));
  const updateConfidence = (next: Confidence) =>
    mutateBlock(block.id, (b) => void (b.confidence = next));

  return (
    <BlockShell
      block={block}
      onDescriptionCommit={updateDescription}
      onConfidenceCommit={updateConfidence}
    >
      {body}
    </BlockShell>
  );
}
