"use client";

import { cn } from "@/lib/utils";
import { Link, useParams } from "@/lib/nav";
import { ProfileLayout } from "@/components/Track/ProfileParts";
import { LEGAL } from "@/content";

const { updated: UPDATED, docs: DOCS } = LEGAL;

export function LegalScreen() {
  const { document: doc = "terms" } = useParams<{ document: string }>();
  const key = (doc in DOCS ? doc : "terms") as keyof typeof DOCS;
  const d = DOCS[key];
  return (
    <ProfileLayout title={d.title} subtitle={`Last updated ${UPDATED}`}>
      <nav aria-label="Legal documents" className="flex gap-2">
        {(Object.keys(DOCS) as (keyof typeof DOCS)[]).map((k) => (
          <Link
            key={k}
            to={`/you/legal/${k}`}
            replace
            aria-current={k === key ? "page" : undefined}
            className={cn(
              "flex h-10 items-center rounded-full border px-4 text-[14px] transition-colors",
              k === key
                ? "type-button border-transparent bg-brand-navy text-text-on-dark"
                : "type-button-secondary border-border-default bg-white text-text-secondary hover:border-text-neutral-400",
            )}
          >
            {DOCS[k].short}
          </Link>
        ))}
      </nav>
      <article className="panel mt-4 max-w-prose p-5 md:p-7">
        <p className="text-[16px] leading-6 text-text-primary">{d.intro}</p>
        {d.sections.map((s) => (
          <section key={s.heading} className="mt-6">
            <h2 className="text-[16px] type-section-title tracking-[-0.3px] text-brand-navy">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-2 text-[15px] leading-6 text-text-primary">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </ProfileLayout>
  );
}
