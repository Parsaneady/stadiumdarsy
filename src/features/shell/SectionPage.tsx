import type { LucideIcon } from 'lucide-react';
import { PageHeader, Panel, EmptyState } from './primitives';

/** Shared layout for sections whose data arrives in later stages: header + guided empty state. */
export default function SectionPage(p: { eyebrow: string; title: string; subtitle: string; icon: LucideIcon; emptyTitle: string; emptyText: string; to: string; cta: string }) {
  return (
    <div>
      <PageHeader eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle} />
      <Panel><EmptyState icon={p.icon} title={p.emptyTitle} text={p.emptyText} to={p.to} cta={p.cta} /></Panel>
    </div>
  );
}
