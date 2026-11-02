import type { ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { Icon } from "@/components/Icon";
import { Link } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { ContactForm } from "./ContactForm";
import { LandingHeader } from "./LandingHeader";
import { TrackingSection } from "./TrackingSection";

/** Shared content width: fixed on small screens, 84% of the viewport from xl up (matches the design margins). */
const WRAP = "mx-auto w-full max-w-[1272px] px-5 md:px-8 xl:w-[84vw] xl:max-w-[2000px] xl:px-0";
const H2 =
  "type-body tracking-[-0.04em] text-text-primary text-[40px] leading-[0.98] md:text-[64px]";
const SUB = "max-w-xl text-base type-meta text-text-secondary";
const CTA =
  "inline-flex h-14 items-center justify-between gap-2 rounded-full px-7 text-base type-button transition-colors";
const IMG = "/img/landing";

/** Social icons always render; they become links once a real href is filled in. */
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
              "w-full bg-primary text-white hover:bg-primary-hover md:h-14 md:w-auto md:justify-center md:gap-5 md:px-10 md:text-base md:font-normal",
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
    <section id="features" className={cn(WRAP, "px-6 py-12 md:px-8 md:py-24")}>
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
        <BentoCard className="min-h-0 bg-[#ff5e00] text-white md:h-[26.5rem]">
          <AppImage
            src={`${IMG}/order.webp`}
            alt=""
            className="relative ml-auto block w-full md:absolute md:right-0 md:top-0 md:w-[68%]"
          />
          <div className="relative px-6 pb-6 pt-5 md:absolute md:inset-x-0 md:bottom-0 md:px-8 md:pb-7 md:pt-0">
            <h3 className="text-[2rem] font-medium tracking-[-0.05em] md:text-[2.75rem]">
              OrderThis!
            </h3>
            <p className="mt-2 text-[15px] type-meta opacity-90 md:max-w-xs md:text-sm">
              Track your way — keep an eye on your meals, protein, habits. Choose what habits
              matters to you!
            </p>
          </div>
        </BentoCard>
        <BentoCard className="aspect-[342/385] min-h-0 bg-[#fbf9f3] md:aspect-auto md:h-[26.5rem]">
          <AppImage
            src={`${IMG}/cook-m.webp`}
            alt=""
            className="absolute right-0 top-0 h-[82%] w-auto md:hidden"
          />
          <AppImage
            src={`${IMG}/cook.webp`}
            alt=""
            className="absolute right-0 top-0 hidden h-full w-auto md:block"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 md:max-w-[55%] md:p-8">
            <h3 className="text-[2.5rem] type-display tracking-[-0.05em] text-[#14193a] md:text-[2.75rem]">
              CookThis!
            </h3>
            <p className="mt-2 max-w-sm text-[15px] leading-[1.45] type-meta text-[#5a6180] md:text-sm md:text-[#0b2a63]">
              From meal-preps to family dinners, find low calorie, high protein recipes that work
              for your real life the nutrition you need
            </p>
          </div>
        </BentoCard>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[889fr_363fr]">
        <BentoCard className="aspect-[342/424] min-h-0 bg-[#00a9ae] md:aspect-auto md:h-[21.25rem] md:bg-[#7ccfd1]">
          {/* Mobile: the design's tall crop (table scene at the bottom). */}
          <AppImage
            src={`${IMG}/track-m.webp`}
            alt=""
            className="absolute inset-0 size-full object-cover md:hidden"
          />
          {/* Desktop: the full photo from the design with the text painted out. */}
          <AppImage
            src={`${IMG}/track-bg.webp`}
            alt=""
            className="absolute inset-0 hidden size-full object-cover object-left md:block"
          />
          <div className="relative px-6 pb-6 pt-3 md:ml-[40%] md:p-0 md:pr-8 md:pt-7">
            <h3 className="text-[2.5rem] type-display tracking-[-0.07em] text-[#0a1a24] md:text-[3rem] md:leading-[1.05] md:text-[#101c3a]">
              TrackThis!
            </h3>
            <p className="mt-2 max-w-md text-[15px] leading-[1.5] type-meta text-[#0a1a24] md:mt-2 md:max-w-[29rem] md:text-[18px] md:leading-[1.25] md:text-[#56717f]">
              ForkThis! allows you to customize your profile around your goals and allows you to
              move at your own pace by tracking meals, movement, and the habits that matter most to
              you!
            </p>
          </div>
        </BentoCard>
        <BentoCard className="h-[14rem] min-h-0 bg-text-primary text-white md:h-[21.25rem]">
          <div
            aria-hidden
            className="absolute -right-[9rem] -top-[8.4rem] size-[17.5rem] rounded-full bg-[#ffe9dd] md:-right-12 md:-top-12 md:size-64 md:bg-[#ffe4d4]"
          >
            <div className="absolute inset-[14.5%] rounded-full bg-[#fdb68e] md:inset-[10%]">
              <div className="absolute inset-[10%] rounded-full bg-[#f6823e] md:inset-[12%]">
                <div className="absolute inset-[11.5%] rounded-full bg-[#c4570f] md:inset-[22%]" />
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <h3 className="text-[2rem] type-display tracking-tight md:text-4xl">Free</h3>
            <p className="mt-2 max-w-[17rem] text-[15px] leading-[1.45] type-meta opacity-90 md:max-w-60 md:text-sm md:opacity-80">
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
  mobileImage,
  mobileImageClass,
  cardClass,
  cardOffset,
  children,
}: {
  word: string;
  wordClass: string;
  image: string;
  imageClass: string;
  /** Separate photo crop for small screens (hidden from md up). */
  mobileImage?: string;
  mobileImageClass?: string;
  cardClass: string;
  cardOffset: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-w-0">
      <p
        aria-hidden
        className={cn(
          "relative z-0 text-center text-[92px] leading-[0.82] tracking-[-0.06em] type-numeral md:text-[clamp(120px,12.5vw,190px)]",
          wordClass,
        )}
      >
        {word}
      </p>
      {mobileImage && (
        <AppImage
          src={mobileImage}
          alt=""
          className={cn("relative z-10 mt-1 md:hidden", mobileImageClass)}
        />
      )}
      <AppImage
        src={image}
        alt=""
        className={cn(
          "relative z-10 mt-1 md:-mt-[3.6rem]",
          mobileImage && "hidden md:block",
          imageClass,
        )}
      />
      <div
        className={cn(
          "relative z-20 -mt-10 rounded-[1.75rem] border bg-white p-5 md:mt-0 md:p-8",
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
          imageClass="ml-3 w-[21rem] max-w-none md:ml-0 md:w-[98%]"
          cardOffset="ml-3 mr-3 md:ml-[5%] md:mr-0"
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
          mobileImage={`${IMG}/hacks-m.webp`}
          mobileImageClass="-ml-[33px] -mt-9 w-[115vw] max-w-none"
          imageClass="ml-3 w-[20rem] max-w-none md:-mt-20 md:ml-[2%] md:w-[84%]"
          cardOffset="-mt-[60vw] ml-10 mr-0 md:ml-[3%] md:mr-0 md:mt-0"
          cardClass="border-accent-graphic shadow-[-8px_8px_0_#c54a00] md:shadow-[-18px_17px_0_#cc4c00]"
        >
          <h3 className="text-[2rem] type-body leading-[1.02] tracking-[-0.05em] text-text-primary md:text-[2.25rem] md:leading-[1.05] md:tracking-[-0.04em]">
            Same cravings.
            <br className="md:hidden" /> <span className="text-accent-graphic">A better fit.</span>
          </h3>
          <p className="mt-3 text-[14px] leading-[1.3] type-meta text-text-secondary md:text-sm md:leading-normal">
            ForkThis! has hundreds of fast-food and restaurant hacks with low calorie,
            protein-focused orders to help you stay on track.
          </p>
          <p className="mt-4 flex items-center gap-2 border-b border-border-divider pb-2 text-[11px] uppercase tracking-[0.04em] text-text-primary md:mt-5 md:pb-3 md:tracking-[0.14em] md:text-text-secondary">
            <Icon name="forkSpoon" size={14} className="hidden text-accent md:block" />
            OrderThis! at Chick-fil-A
          </p>
          <ol className="divide-y divide-border-divider text-[12.5px] type-meta text-text-primary md:text-sm">
            {HACKS.map((hack, i) => (
              <li key={hack} className="flex items-center gap-2.5 py-2.5 md:gap-3 md:py-3">
                <span className="text-[22px] font-light text-accent md:text-2xl">
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
              "mt-5 h-[52px] w-full bg-[#ff6200] pr-5 text-[15px] font-normal text-white hover:opacity-90 md:mt-5 md:h-16 md:text-base md:font-semibold",
            )}
          >
            Order This! <span aria-hidden>↗</span>
          </Link>
        </BrowseCard>
      </div>
    </section>
  );
}

function Eyebrow({ n, label, lineFirst }: { n: string; label: string; lineFirst?: boolean }) {
  return (
    <p className="mb-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-text-secondary md:mb-8">
      <span className="text-accent">{n}</span>
      {lineFirst && <span aria-hidden className="h-px w-12 bg-border-default" />}
      <span>{label}</span>
      {!lineFirst && (
        <span aria-hidden className="h-px flex-1 bg-border-divider md:bg-text-primary" />
      )}
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
    <section
      id="team"
      className="relative overflow-hidden py-14 md:min-h-[calc(190px+min(40vw,600px)*1.438)] md:pb-0 md:pt-48"
    >
      <AppImage
        src={`${IMG}/team-bowl.webp`}
        alt="A grain bowl with avocado, edamame and chickpeas"
        className="pointer-events-none absolute right-0 top-[190px] hidden w-[min(40vw,600px)] md:block"
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
    <li className="flex items-center gap-4 rounded-3xl border border-border-divider bg-white p-4 shadow-card md:max-w-[26rem] md:rounded-2xl md:p-3.5">
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
    <section
      id="contact"
      className="relative z-10 px-3 pb-3 pt-6 md:-mt-10 md:px-6 md:pb-3 md:pt-0"
    >
      <div className="mx-auto rounded-[1.75rem] bg-gradient-to-br from-[#e3f6f6] via-[#f4f7fc] to-[#f3f1fb] py-14 md:py-20">
        <div
          className={cn(
            WRAP,
            "md:grid md:grid-cols-[1fr_minmax(0,29rem)] md:items-center md:justify-between md:gap-12",
          )}
        >
          <div>
            <Eyebrow n="05" label="Contact us" lineFirst />
            <h2 className={cn(H2, "md:text-[clamp(44px,4.4vw,68px)]")}>
              Help us make
              <br />
              ForkThis! better.
            </h2>
            <p className={cn(SUB, "mt-5 max-w-[21rem] md:text-sm")}>
              We&apos;re always looking for ways to improve the app. Let us know what would make
              ForkThis! more useful to you.
            </p>
            <ul className="mt-6 space-y-3">
              <InfoCard
                tone="bg-icon-well text-icon-well-ink"
                icon={<Icon name="shareEmail" size={20} />}
                title="hello@forkthis.app"
                sub="Write to us anytime"
              />
              <InfoCard
                tone="bg-primary-soft text-brand-navy"
                icon={<Icon name="location" size={20} />}
                title="Remote-first team"
                sub="Built across time zones"
              />
            </ul>
          </div>
          <div className="mt-8 md:mt-0">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const muted = "text-[#8d96b3]";
  return (
    <footer className="px-3 pb-3 md:px-6 md:pb-6">
      <div className="mx-auto flex flex-col rounded-[1.75rem] bg-text-primary px-0 py-8 text-white md:min-h-[32rem] md:py-14">
        <div
          className={cn(WRAP, "flex flex-1 flex-col justify-between gap-10 px-6 md:gap-12 md:px-8")}
        >
          <div>
            <Brand />
            <p className={cn("mt-6 max-w-[22rem] text-base type-meta md:mt-8 md:text-sm", muted)}>
              ForkThis! makes healthy living easier with recipes, restaurant hacks, and simple food,
              movement, and habit tracking, all free, all at your pace.
            </p>
          </div>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="order-1 md:order-2">
              <h3 className="text-2xl type-body md:text-xl">Contact Us</h3>
              <p className={cn("mt-3 text-sm type-meta md:mt-2 md:text-xs", muted)}>
                +1 (999) 888-77-66
              </p>
              <a
                href="mailto:hello@logoipsum.com"
                className={cn("block text-sm type-meta hover:text-white md:text-xs", muted)}
              >
                hello@logoipsum.com
              </a>
            </div>
            <div className="order-2 flex flex-col gap-8 md:order-1 md:flex-row md:items-center md:gap-12">
              <div className="flex gap-3 md:gap-2.5">
                {SOCIALS.map((s) => {
                  const cls =
                    "flex size-12 items-center justify-center rounded-full bg-white text-text-primary md:size-10";
                  return s.href ? (
                    <a key={s.label} href={s.href} aria-label={s.label} className={cls}>
                      {s.icon}
                    </a>
                  ) : (
                    <span key={s.label} aria-hidden className={cls}>
                      {s.icon}
                    </span>
                  );
                })}
              </div>
              <p className={cn("text-xs type-meta", muted)}>
                © {new Date().getFullYear()} — Copyright All Rights reserved
              </p>
            </div>
          </div>
        </div>
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
