import type { ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { Icon } from "@/components/Icon";
import { Link } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { ContactForm } from "./ContactForm";
import { LandingHeader } from "./LandingHeader";
import { TrackingSection } from "./TrackingSection";

const WRAP = "mx-auto w-full max-w-6xl px-5 md:px-8";
const H2 = "type-body tracking-tight text-text-primary text-[40px] leading-[0.98] md:text-[56px]";
const SUB = "max-w-xl text-base type-meta text-text-secondary";
const CTA =
  "inline-flex h-14 items-center justify-between gap-2 rounded-full px-7 text-base type-button transition-colors";
const IMG = "/img/food-cards-v2";

/** Social links render only once a real href is filled in. */
const SOCIALS: { label: string; href: string; icon: ReactNode }[] = [
  { label: "Telegram", href: "", icon: <Icon name="shareMessage" size={20} /> },
  { label: "Instagram", href: "", icon: <Icon name="shareInstagram" size={20} /> },
  { label: "Facebook", href: "", icon: <span className="type-numeral">f</span> },
];

function Hero() {
  return (
    <section className="relative overflow-hidden pb-14 pt-20 md:pb-24 md:pt-28">
      <div
        aria-hidden
        className="relative h-72 md:absolute md:inset-x-0 md:top-0 md:h-full md:pt-0"
      >
        <AppImage
          src={`${IMG}/18-lean-beef-rice-bowl`}
          alt=""
          sizes="(min-width: 768px) 28vw, 60vw"
          priority
          className="absolute -left-14 top-2 size-60 rounded-full object-cover shadow-raised md:-left-10 md:top-24 md:size-80"
        />
        <AppImage
          src={`${IMG}/05-grilled-nugget-salad`}
          alt=""
          sizes="(min-width: 768px) 28vw, 60vw"
          priority
          className="absolute -right-12 top-24 size-56 rounded-full object-cover shadow-raised md:-right-10 md:top-28 md:size-80"
        />
      </div>
      <div
        className={cn(
          WRAP,
          "relative flex flex-col items-start text-left md:items-center md:text-center",
        )}
      >
        <h1 className="max-w-2xl text-[36px] leading-[1.05] tracking-tighter text-brand-navy md:text-[72px]">
          <span className="type-body">Healthy can be </span>
          <strong className="type-numeral">hard!</strong>
          <span className="mt-1 block text-[34px] type-body md:text-[52px]">
            We&apos;re here to make it easier.
          </span>
        </h1>
        <p className="mt-6 max-w-md text-base type-meta text-text-secondary">
          Simple macro tracking, healthy recipes, fast food hacks, movement goals, GLP-1/peptide
          calendars, and helpful reminders to keep you on track toward your goals.
        </p>
        <div className="mt-7 flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-center">
          <Link
            to="/signup"
            className={cn(CTA, "w-full bg-primary text-white hover:bg-primary-hover md:w-auto")}
          >
            Sign up for free <span aria-hidden>↗</span>
          </Link>
          <Link
            to="/guest"
            className={cn(
              CTA,
              "hidden border border-border-default bg-white text-brand-navy hover:bg-navy-soft md:inline-flex",
            )}
          >
            Continue as guest
          </Link>
        </div>
        <p className="mt-5 text-xs type-meta text-text-secondary">
          It&apos;s all free.
          <br />
          Create an account to track your progress, or{" "}
          <Link to="/guest" className="underline">
            continue as a guest
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function BentoCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn("relative min-h-[28rem] overflow-hidden rounded-[2rem] md:min-h-72", className)}
    >
      {children}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className={cn(WRAP, "py-12 md:py-20")}>
      <div className="md:text-center">
        <h2 className={cn(H2, "type-body")}>
          <span className="text-teal-500">ForkThis!</span>{" "}
          <span className="type-display">makes healthy easier</span>
        </h2>
        <p className={cn(SUB, "mt-5 md:mx-auto")}>
          Practical swaps, everyday recipes, low-pressure tracking, and free browsing — built for
          real meals and real routines.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-5">
        <BentoCard className="bg-[#ff6200] text-white md:col-span-2">
          <AppImage
            src={`${IMG}/08-grilled-chicken-grain-bowl`}
            alt=""
            sizes="(min-width: 768px) 24vw, 90vw"
            className="absolute inset-x-0 top-0 h-1/2 w-full rounded-b-[3rem] object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-7">
            <h3 className="text-4xl type-body tracking-tight">OrderThis!</h3>
            <p className="mt-2 text-base type-meta opacity-90">
              Track your way — keep an eye on your meals, protein, habits. Choose what matters to
              you!
            </p>
          </div>
        </BentoCard>
        <BentoCard className="bg-[#faf6ef] md:col-span-3">
          <AppImage
            src={`${IMG}/17-overnight-oats-apple`}
            alt=""
            sizes="(min-width: 768px) 36vw, 90vw"
            className="absolute inset-x-0 top-0 h-1/2 w-full rounded-b-[3rem] object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-7">
            <h3 className="text-4xl type-display tracking-tight text-text-primary">CookThis!</h3>
            <p className="mt-2 text-base type-meta text-text-secondary">
              From meal-preps to family dinners, find low-calorie, high-protein recipes that work
              for your real life — the nutrition you need.
            </p>
          </div>
        </BentoCard>
        <BentoCard className="bg-[#09b5ae] md:col-span-3">
          <div className="relative p-7">
            <h3 className="text-4xl type-display tracking-tight text-text-primary">TrackThis!</h3>
            <p className="mt-3 max-w-sm text-base type-meta text-text-primary">
              ForkThis! allows you to customize your profile around your goals and allows you to
              move at your own pace by tracking meals, movement, and the habits that matter most to
              you!
            </p>
          </div>
          <AppImage
            src={`${IMG}/15-chickpea-cucumber-salad`}
            alt=""
            sizes="(min-width: 768px) 36vw, 90vw"
            className="absolute -bottom-10 -left-10 size-60 rounded-full object-cover"
          />
        </BentoCard>
        <BentoCard className="min-h-56 bg-text-primary text-white md:col-span-2">
          <div aria-hidden className="absolute -right-8 -top-8 size-44 rounded-full bg-[#ffe6d8]">
            <div className="absolute inset-4 rounded-full bg-[#ffc4a3]">
              <div className="absolute inset-4 rounded-full bg-[#f58a4d]">
                <div className="absolute inset-4 rounded-full bg-[#c4570f]" />
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-7">
            <h3 className="text-3xl type-display tracking-tight">Free</h3>
            <p className="mt-2 max-w-60 text-sm type-meta opacity-80">
              Free! make restaurant hacks* add no credit card required
            </p>
          </div>
        </BentoCard>
      </div>
    </section>
  );
}

function BrowseCard({
  word,
  wordClass,
  image,
  cardClass,
  align,
  children,
}: {
  word: string;
  wordClass: string;
  image: string;
  cardClass: string;
  align: "left" | "right";
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <p
        aria-hidden
        className={cn(
          "text-center text-[92px] leading-[0.9] tracking-tighter type-numeral md:text-[128px]",
          wordClass,
        )}
      >
        {word}
      </p>
      <AppImage
        src={image}
        alt=""
        sizes="(min-width: 768px) 40vw, 80vw"
        className={cn(
          "-mt-4 size-72 rounded-full object-cover md:size-80",
          align === "left" ? "-ml-24" : "-ml-24 md:-ml-16",
        )}
      />
      <div
        className={cn(
          "relative -mt-32 rounded-3xl border bg-white p-5 md:-mt-28",
          align === "left" ? "ml-8 mr-3" : "ml-14 mr-3 md:ml-24",
          cardClass,
        )}
      >
        {children}
      </div>
    </div>
  );
}

const HACKS = [
  "Kale Crunch Side, made into an entrée.",
  "Add grilled chicken nuggets (12-count).",
  "2 Texas Pete hot sauces",
];

function RecipesAndHacks() {
  return (
    <section id="recipes" className="overflow-hidden py-10 md:py-16">
      <div className={cn(WRAP, "grid gap-16 md:grid-cols-2 md:gap-10")}>
        <BrowseCard
          word="Recipes"
          wordClass="text-[#8798b4]"
          image={`${IMG}/11-red-lentil-soup`}
          cardClass="border-brand-navy shadow-[8px_8px_0_var(--color-brand-navy)]"
          align="left"
        >
          <h3 className="text-3xl type-body leading-[1.05] tracking-tight text-text-primary">
            Explore hundreds of flavorful recipes for every kind of day
          </h3>
          <p className="mt-3 text-sm type-meta text-text-secondary">
            From quick meals and family dinners to meal prep, comfort food, and healthier takes on
            the foods you already love.
          </p>
          <Link
            to="/recipes"
            className={cn(
              CTA,
              "mt-5 h-12 w-full bg-primary pr-5 text-white hover:bg-primary-hover",
            )}
          >
            Browse recipes <span aria-hidden>↗</span>
          </Link>
        </BrowseCard>
        <BrowseCard
          word="Hacks"
          wordClass="text-accent"
          image={`${IMG}/05-grilled-nugget-salad`}
          cardClass="border-accent-graphic shadow-[8px_8px_0_var(--color-accent-ink)]"
          align="right"
        >
          <h3 className="text-3xl type-body leading-[1.05] tracking-tight text-text-primary">
            Same cravings.
            <br />
            <span className="text-accent-graphic">A better fit.</span>
          </h3>
          <p className="mt-3 text-sm type-meta text-text-secondary">
            ForkThis! has hundreds of fast-food and restaurant hacks with low calorie,
            protein-focused orders to help you stay on track.
          </p>
          <p className="mt-4 border-b border-border-divider pb-2 text-[11px] uppercase tracking-wider text-text-secondary">
            OrderThis! at Chick-fil-A
          </p>
          <ol className="divide-y divide-border-divider text-sm type-meta text-text-primary">
            {HACKS.map((hack, i) => (
              <li key={hack} className="flex items-center gap-3 py-3">
                <span className="text-xl type-body text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {hack}
              </li>
            ))}
          </ol>
          <Link
            to="/fast-hacks"
            className={cn(CTA, "mt-3 h-12 w-full bg-[#ff6200] pr-5 text-white hover:opacity-90")}
          >
            Order This! <span aria-hidden>↗</span>
          </Link>
        </BrowseCard>
      </div>
    </section>
  );
}

function Eyebrow({ n, label }: { n: string; label: string }) {
  return (
    <p className="mb-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-text-secondary">
      <span className="text-accent">{n}</span>
      <span>{label}</span>
      <span aria-hidden className="h-px flex-1 bg-border-divider" />
    </p>
  );
}

const TEAM_COPY = [
  "We created ForkTHIS! to make healthy living simpler, more realistic, and sustainable for everyone. By combining the best features of nutrition, fitness, and wellness resources into one easy-to-use platform, we're taking the guesswork out of building a healthier lifestyle.",
  "ForkTHIS! was born from two unique perspectives: someone who has personally experienced significant weight loss and the challenges of maintaining long-term lifestyle changes, and a plastic surgeon who supports patients before, during, and after their weight-loss journeys.",
  "Together, we recognized a gap. While countless resources exist for tracking calories, managing diets, and monitoring fitness, few provide the guidance and flexibility needed to support every stage of a person's health journey. We wanted to change that by creating a platform that meets people where they are, regardless of their experience, starting point, or goals.",
  "Whether you're looking to eat better, move more, build healthier habits, lose weight, maintain your progress, or prepare for and recover from bariatric or body-contouring surgery, ForkTHIS! brings the tools you need together in one place.",
  "From small everyday changes to major life transformations, our mission is to make healthy living easier to understand, personalize, and maintain—at every stage of life.",
];

function Team() {
  const bowl = `${IMG}/15-chickpea-cucumber-salad`;
  return (
    <section id="team" className={cn(WRAP, "py-14 md:py-24")}>
      <Eyebrow n="04" label="The team" />
      <div className="md:grid md:grid-cols-2 md:items-start md:gap-12">
        <div>
          <h2 className={H2}>Built by a doctor and someone who has lived it.</h2>
          <div className="mt-6 space-y-5 text-base type-meta text-text-primary">
            <p>{TEAM_COPY[0]}</p>
            <div className="md:hidden">
              <AppImage
                src={bowl}
                alt="A grain bowl with avocado, edamame and chickpeas"
                sizes="60vw"
                className="float-right -mr-5 ml-3 size-56 rounded-full object-cover [shape-outside:circle()]"
              />
              <p>{TEAM_COPY[1]}</p>
              <div className="clear-both" />
            </div>
            <p className="hidden md:block">{TEAM_COPY[1]}</p>
            {TEAM_COPY.slice(2).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-8 border-t border-border-divider pt-4 text-xs type-meta text-text-secondary">
            ForkThis! provides general nutrition information, not medical advice. For individual
            health needs, speak with a qualified member of your care team.
          </p>
        </div>
        <AppImage
          src={bowl}
          alt="A grain bowl with avocado, edamame and chickpeas"
          sizes="45vw"
          className="hidden aspect-square w-full rounded-full object-cover md:block"
        />
      </div>
    </section>
  );
}

function InfoCard({
  icon,
  title,
  sub,
  tone,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  tone: string;
}) {
  return (
    <li className="flex items-center gap-4 rounded-3xl border border-border-divider bg-white p-4">
      <span
        aria-hidden
        className={cn("flex size-12 items-center justify-center rounded-2xl", tone)}
      >
        {icon}
      </span>
      <div>
        <p className="text-base type-button text-text-primary">{title}</p>
        <p className="text-sm type-meta text-text-secondary">{sub}</p>
      </div>
    </li>
  );
}

function Contact() {
  return (
    <section id="contact" className="rounded-t-[2.5rem] bg-[#f4f7fc] py-14 md:py-24">
      <div className={cn(WRAP, "md:grid md:grid-cols-2 md:items-center md:gap-12")}>
        <div>
          <Eyebrow n="05" label="Contact us" />
          <h2 className={H2}>Help us make ForkThis! better.</h2>
          <p className={cn(SUB, "mt-5")}>
            We&apos;re always looking for ways to improve the app. Let us know what would make
            ForkThis! more useful to you.
          </p>
          <ul className="mt-6 space-y-3">
            <InfoCard
              tone="bg-icon-well text-icon-well-ink"
              icon={<Icon name="shareEmail" size={22} />}
              title="hello@forkthis.app"
              sub="Write to us anytime"
            />
            <InfoCard
              tone="bg-primary-soft text-brand-navy"
              icon={<Icon name="location" size={22} />}
              title="Remote-first team"
              sub="Built across time zones"
            />
          </ul>
        </div>
        <div className="mt-6 md:mt-0">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const socials = SOCIALS.filter((s) => s.href);
  return (
    <footer className="bg-[#f4f7fc] px-3 pb-3 md:px-6 md:pb-6">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-text-primary p-7 text-white md:p-12">
        <div className="md:flex md:justify-between md:gap-12">
          <div className="max-w-sm">
            <Brand />
            <p className="mt-8 text-base type-meta opacity-70">
              ForkThis! makes healthy living easier with recipes, restaurant hacks, and simple food,
              movement, and habit tracking — all free, all at your pace.
            </p>
          </div>
          <div className="mt-8 md:mt-0">
            <h3 className="text-2xl type-body">Contact Us</h3>
            <a
              href="mailto:hello@forkthis.app"
              className="mt-3 block text-base type-meta opacity-70 hover:opacity-100"
            >
              hello@forkthis.app
            </a>
            {socials.length > 0 && (
              <div className="mt-6 flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex size-11 items-center justify-center rounded-full bg-white text-text-primary"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="mt-10 text-xs type-meta opacity-60">
          © {new Date().getFullYear()} ForkThis! All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <main className="min-h-dvh overflow-x-clip bg-brand-cream">
      <LandingHeader />
      <Hero />
      <Features />
      <RecipesAndHacks />
      <TrackingSection />
      <Team />
      <Contact />
      <Footer />
    </main>
  );
}
