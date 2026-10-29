import type { ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { Icon } from "@/components/Icon";
import { Link } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { ContactForm } from "./ContactForm";
import { LandingHeader } from "./LandingHeader";
import { TrackingSection } from "./TrackingSection";

const WRAP = "mx-auto w-full max-w-[1272px] px-5 md:px-8 xl:px-0";
const H2 =
  "type-body tracking-[-0.04em] text-text-primary text-[40px] leading-[0.98] md:text-[64px]";
const SUB = "max-w-xl text-base type-meta text-text-secondary";
const CTA =
  "inline-flex h-14 items-center justify-between gap-2 rounded-full px-7 text-base type-button transition-colors";
const IMG = "/img/landing";

/** Social links render only once a real href is filled in. */
const SOCIALS: { label: string; href: string; icon: ReactNode }[] = [
  { label: "Telegram", href: "", icon: <Icon name="shareMessage" size={20} /> },
  { label: "Instagram", href: "", icon: <Icon name="shareInstagram" size={20} /> },
  { label: "Facebook", href: "", icon: <span className="type-numeral">f</span> },
];

function Hero() {
  return (
    <section className="relative overflow-hidden pb-14 pt-20 md:pb-28 md:pt-36">
      {/* Mobile: plates sit above the copy. Desktop: they flank the headline. */}
      <div aria-hidden className="relative h-72 md:static md:h-0">
        <AppImage
          src={`${IMG}/salad.webp`}
          alt=""
          priority
          className="absolute -left-12 top-0 w-60 -scale-x-100 md:left-auto md:scale-x-100 md:right-0 md:top-[355px] md:w-[29vw] md:max-w-[480px]"
        />
        <AppImage
          src={`${IMG}/burger.webp`}
          alt=""
          priority
          className="absolute -right-8 top-24 w-56 md:left-0 md:right-auto md:top-[330px] md:w-[25vw] md:max-w-[400px]"
        />
      </div>
      <div
        className={cn(
          WRAP,
          "relative flex flex-col items-start text-left md:items-center md:text-center",
        )}
      >
        <AppImage src={`${IMG}/logo.webp`} alt="" className="mb-6 hidden size-28 md:block" />
        <h1 className="text-[36px] leading-[1.05] tracking-[-0.045em] text-brand-navy md:text-[clamp(56px,6.4vw,100px)] md:leading-[1.02]">
          <span className="type-body">Healthy can be </span>
          <strong className="type-numeral md:font-light">hard!</strong>
          <span className="mt-1 block text-[34px] type-body md:text-[clamp(44px,5.2vw,84px)]">
            We’re here to make it easier.
          </span>
        </h1>
        <p className="mt-6 max-w-md text-base type-meta text-text-secondary md:mt-14 md:text-sm">
          Simple macro tracking, healthy recipes, fast food hacks, movement goals, GLP-1/peptide
          calendars, and helpful reminders to keep you on track toward your goals.
        </p>
        <div className="mt-7 flex w-full flex-wrap items-center gap-6 md:w-auto md:justify-center">
          <Link
            to="/signup"
            className={cn(
              CTA,
              "w-full bg-primary text-white hover:bg-primary-hover md:h-12 md:w-auto md:gap-4 md:text-sm",
            )}
          >
            Sign up for free <span aria-hidden>↗</span>
          </Link>
          <Link
            to="/guest"
            className="hidden text-sm type-item-title text-text-primary hover:underline md:inline"
          >
            Continue as guest
          </Link>
        </div>
        <p className="mt-5 text-xs type-meta text-text-secondary">
          It&apos;s all free.
          <br className="md:hidden" /> Create an account to track your progress, or{" "}
          <Link to="/guest" className="underline md:no-underline">
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
      className={cn(
        "relative min-h-[28rem] overflow-hidden rounded-[1.75rem] md:min-h-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className={cn(WRAP, "py-12 md:py-24")}>
      <div className="md:text-center">
        <h2 className={cn(H2, "tracking-[-0.06em] md:text-[clamp(44px,5vw,72px)]")}>
          <span className="text-teal-500">ForkThis!</span>{" "}
          <span className="font-medium text-black">makes healthy easier</span>
        </h2>
        <p className={cn(SUB, "mt-5 md:mx-auto md:max-w-xl md:text-sm")}>
          Practical swaps, everyday recipes, low-pressure tracking, and free browsing — built for
          real meals and real routines.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:mt-14 md:grid-cols-[472fr_781fr]">
        <BentoCard className="bg-[#ff6200] text-white md:h-[26.5rem]">
          <AppImage
            src={`${IMG}/order.webp`}
            alt=""
            className="absolute right-0 top-0 w-full md:w-[76%]"
          />
          <div className="absolute inset-x-0 bottom-0 p-7 md:p-8">
            <h3 className="text-4xl font-medium tracking-[-0.05em] md:text-[2.75rem]">
              OrderThis!
            </h3>
            <p className="mt-2 max-w-xs text-sm type-meta opacity-90">
              Track your way — keep an eye on your meals, protein, habits. Choose what habits
              matters to you!
            </p>
          </div>
        </BentoCard>
        <BentoCard className="bg-[#fcf9f3] md:h-[26.5rem]">
          <AppImage
            src={`${IMG}/cook.webp`}
            alt=""
            className="absolute right-0 top-0 h-[58%] w-auto md:h-full"
          />
          <div className="absolute inset-x-0 bottom-0 p-7 md:max-w-[55%] md:p-8">
            <h3 className="text-4xl type-display tracking-[-0.05em] text-[#0b2a63] md:text-[2.75rem]">
              CookThis!
            </h3>
            <p className="mt-2 max-w-sm text-sm type-meta text-[#0b2a63]">
              From meal-preps to family dinners, find low calorie, high protein recipes that work
              for your real life the nutrition you need
            </p>
          </div>
        </BentoCard>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[889fr_363fr]">
        <BentoCard className="min-h-[36rem] bg-[#9adcdd] md:h-[21.25rem] md:min-h-0">
          <AppImage
            src={`${IMG}/track.webp`}
            alt=""
            className="absolute bottom-0 left-0 h-[50%] w-auto max-w-none [mask-image:linear-gradient(to_right,#000_70%,transparent)] md:h-full"
          />
          <div className="relative p-7 md:ml-[39%] md:p-8 md:pt-9">
            <h3 className="text-4xl type-display tracking-[-0.06em] text-[#0d1b2a] md:text-[2.75rem]">
              TrackThis!
            </h3>
            <p className="mt-3 max-w-md text-base type-meta text-[#2c4a5a]">
              ForkThis! allows you to customize your profile around your goals and allows you to
              move at your own pace by tracking meals, movement, and the habits that matter most to
              you!
            </p>
          </div>
        </BentoCard>
        <BentoCard className="min-h-56 bg-text-primary text-white md:h-[21.25rem]">
          <div
            aria-hidden
            className="absolute -right-12 -top-12 size-44 rounded-full bg-[#ffe4d4] md:-right-12 md:-top-12 md:size-64"
          >
            <div className="absolute inset-[10%] rounded-full bg-[#fdb68e]">
              <div className="absolute inset-[12%] rounded-full bg-[#f6823e]">
                <div className="absolute inset-[22%] rounded-full bg-[#c4570f]" />
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-7 md:p-8">
            <h3 className="text-3xl type-display tracking-tight md:text-4xl">Free</h3>
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
  imageClass,
  cardClass,
  cardOffset,
  children,
}: {
  word: string;
  wordClass: string;
  image: string;
  imageClass: string;
  cardClass: string;
  cardOffset: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <p
        aria-hidden
        className={cn(
          "relative z-0 text-center text-[92px] leading-[0.82] tracking-[-0.06em] type-numeral md:text-[clamp(120px,12.5vw,190px)]",
          wordClass,
        )}
      >
        {word}
      </p>
      <AppImage src={image} alt="" className={cn("relative z-10 -mt-3 md:-mt-8", imageClass)} />
      <div
        className={cn(
          "relative z-20 rounded-[1.75rem] border bg-white p-5 md:p-8",
          cardOffset,
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
    <section id="recipes" className="overflow-hidden py-10 md:py-20">
      <div className={cn(WRAP, "grid gap-20 md:grid-cols-2 md:gap-16")}>
        <BrowseCard
          word="Recipes"
          wordClass="text-[#8798b4] md:text-[#b0bacf]"
          image={`${IMG}/chili.webp`}
          imageClass="-ml-24 w-[22rem] max-w-none md:ml-0 md:w-[98%]"
          cardOffset="ml-8 mr-3 md:ml-[5%] md:mr-0"
          cardClass="border-brand-navy shadow-[-8px_8px_0_var(--color-brand-navy)] md:shadow-[-18px_17px_0_var(--color-brand-navy)]"
        >
          <h3 className="text-3xl type-body leading-[1.05] tracking-[-0.04em] text-text-primary md:text-[2.15rem]">
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
              "mt-5 h-12 w-full bg-primary pr-5 text-white hover:bg-primary-hover md:mt-8 md:h-16",
            )}
          >
            Browse recipes <span aria-hidden>↗</span>
          </Link>
        </BrowseCard>
        <BrowseCard
          word="Hacks"
          wordClass="text-accent md:text-[#fbd0b8]"
          image={`${IMG}/hacks-box.webp`}
          imageClass="-ml-20 w-[22rem] max-w-none md:ml-[2%] md:w-[84%]"
          cardOffset="ml-14 mr-3 md:ml-[3%] md:mr-0"
          cardClass="border-accent-graphic shadow-[-8px_8px_0_#c54a00] md:shadow-[-18px_17px_0_#cc4c00]"
        >
          <h3 className="text-3xl type-body leading-[1.05] tracking-[-0.04em] text-text-primary md:text-[2.25rem]">
            Same cravings.
            <br className="md:hidden" /> <span className="text-accent-graphic">A better fit.</span>
          </h3>
          <p className="mt-3 text-sm type-meta text-text-secondary">
            ForkThis! has hundreds of fast-food and restaurant hacks with low calorie,
            protein-focused orders to help you stay on track.
          </p>
          <p className="mt-5 flex items-center gap-2 border-b border-border-divider pb-3 text-[11px] uppercase tracking-[0.14em] text-text-secondary">
            <Icon name="forkSpoon" size={14} className="text-accent" />
            OrderThis! at Chick-fil-A
          </p>
          <ol className="divide-y divide-border-divider text-sm type-meta text-text-primary">
            {HACKS.map((hack, i) => (
              <li key={hack} className="flex items-center gap-3 py-3">
                <span className="text-2xl font-light text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {hack}
              </li>
            ))}
          </ol>
          <Link
            to="/fast-hacks"
            className={cn(
              CTA,
              "mt-3 h-12 w-full bg-[#ff6200] pr-5 text-white hover:opacity-90 md:mt-5 md:h-16",
            )}
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
    <p className="mb-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-text-secondary md:mb-8">
      <span className="text-accent">{n}</span>
      <span>{label}</span>
      <span aria-hidden className="h-px flex-1 bg-border-divider md:bg-text-primary" />
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
  return (
    <section id="team" className="relative overflow-hidden py-14 md:py-24">
      <AppImage
        src={`${IMG}/team-bowl.webp`}
        alt="A grain bowl with avocado, edamame and chickpeas"
        className="pointer-events-none absolute right-0 top-[15rem] hidden w-[40%] md:block"
      />
      <div className={cn(WRAP, "relative")}>
        <div className="md:max-w-[62%]">
          <Eyebrow n="04" label="The team" />
          <h2 className={cn(H2, "md:text-[clamp(44px,4.4vw,64px)] md:leading-[1.1]")}>
            Built by a doctor and someone who has lived it.
          </h2>
          <div className="mt-6 space-y-5 text-base type-meta text-text-primary md:mt-8 md:space-y-6 md:text-[15px]">
            <p>{TEAM_COPY[0]}</p>
            <div className="md:hidden">
              <AppImage
                src={`${IMG}/team-bowl.webp`}
                alt=""
                className="float-right -mr-6 ml-3 w-60"
              />
              <p>{TEAM_COPY[1]}</p>
              <div className="clear-both" />
            </div>
            <p className="hidden md:block">{TEAM_COPY[1]}</p>
            {TEAM_COPY.slice(2).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-10 border-t border-text-primary/60 pt-4 text-xs type-meta text-text-secondary md:max-w-[75%]">
            ForkThis! provides general nutrition information, not medical advice. For individual
            health needs, speak with a qualified member of your care team.
          </p>
        </div>
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
    <li className="flex items-center gap-4 rounded-3xl border border-border-divider bg-white p-4 shadow-card md:max-w-sm md:rounded-2xl md:p-3.5">
      <span
        aria-hidden
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl md:size-10 md:rounded-xl",
          tone,
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-base type-button text-text-primary md:text-sm">{title}</p>
        <p className="text-sm type-meta text-text-secondary md:text-xs">{sub}</p>
      </div>
    </li>
  );
}

function Contact() {
  return (
    <section id="contact" className="px-3 pb-3 pt-6 md:px-10 md:pb-6">
      <div className="mx-auto max-w-[1272px] rounded-[2rem] bg-gradient-to-br from-[#e6f6f8] via-[#f4f7fc] to-[#f3f1fb] py-14 md:py-20">
        <div
          className={cn(WRAP, "md:grid md:grid-cols-2 md:items-center md:gap-12 md:px-12 xl:px-14")}
        >
          <div>
            <Eyebrow n="05" label="Contact us" />
            <h2 className={cn(H2, "md:text-[clamp(44px,4.4vw,64px)]")}>
              Help us make ForkThis! better.
            </h2>
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
          <div className="mt-8 md:ml-auto md:mt-0 md:w-full md:max-w-md">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const socials = SOCIALS.filter((s) => s.href);
  return (
    <footer className="px-3 pb-3 md:px-10 md:pb-10">
      <div className="mx-auto max-w-[1272px] rounded-[2rem] bg-text-primary p-7 text-white md:p-12">
        <div className="md:flex md:min-h-72 md:justify-between md:gap-12">
          <div className="flex max-w-sm flex-col">
            <Brand />
            <p className="mt-8 text-base type-meta opacity-70 md:text-sm">
              ForkThis! makes healthy living easier with recipes, restaurant hacks, and simple food,
              movement, and habit tracking — all free, all at your pace.
            </p>
            {socials.length > 0 && (
              <div className="mt-6 flex gap-3 md:mt-auto md:pt-8">
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
          <div className="mt-8 flex flex-col md:mt-0 md:justify-end">
            <h3 className="text-2xl type-body">Contact Us</h3>
            <a
              href="mailto:hello@forkthis.app"
              className="mt-3 block text-base type-meta opacity-70 hover:opacity-100 md:text-sm"
            >
              hello@forkthis.app
            </a>
          </div>
        </div>
        <p className="mt-10 text-xs type-meta opacity-60 md:mt-0 md:text-center">
          © {new Date().getFullYear()} ForkThis! All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <main className="min-h-dvh overflow-x-clip bg-white">
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
