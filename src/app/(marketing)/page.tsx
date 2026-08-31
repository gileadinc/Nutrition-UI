import Link from "next/link";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

const STATS = [
  { value: "10k+", label: "Placeholder meals logged" },
  { value: "500+", label: "Placeholder active users" },
  { value: "4.8/5", label: "Placeholder average rating" },
  { value: "24/7", label: "Placeholder support" },
];

const FEATURES = [
  {
    title: "Placeholder feature one",
    body: "Short placeholder description of a future product feature goes here.",
  },
  {
    title: "Placeholder feature two",
    body: "Short placeholder description of a future product feature goes here.",
  },
  {
    title: "Placeholder feature three",
    body: "Short placeholder description of a future product feature goes here.",
  },
  {
    title: "Placeholder feature four",
    body: "Short placeholder description of a future product feature goes here.",
  },
  {
    title: "Placeholder feature five",
    body: "Short placeholder description of a future product feature goes here.",
  },
  {
    title: "Placeholder feature six",
    body: "Short placeholder description of a future product feature goes here.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Placeholder step one",
    body: "Short placeholder description of the first step in the product flow.",
  },
  {
    number: "02",
    title: "Placeholder step two",
    body: "Short placeholder description of the second step in the product flow.",
  },
  {
    number: "03",
    title: "Placeholder step three",
    body: "Short placeholder description of the third step in the product flow.",
  },
];

const TESTIMONIALS = [
  {
    quote: "Placeholder quote about the product experience goes here for review purposes.",
    name: "Placeholder User One",
    role: "Placeholder role",
  },
  {
    quote: "Placeholder quote about the product experience goes here for review purposes.",
    name: "Placeholder User Two",
    role: "Placeholder role",
  },
  {
    quote: "Placeholder quote about the product experience goes here for review purposes.",
    name: "Placeholder User Three",
    role: "Placeholder role",
  },
];

const FAQS = [
  {
    value: "faq-1",
    question: "Placeholder question one?",
    answer: "Placeholder answer text explaining the first frequently asked question.",
  },
  {
    value: "faq-2",
    question: "Placeholder question two?",
    answer: "Placeholder answer text explaining the second frequently asked question.",
  },
  {
    value: "faq-3",
    question: "Placeholder question three?",
    answer: "Placeholder answer text explaining the third frequently asked question.",
  },
  {
    value: "faq-4",
    question: "Placeholder question four?",
    answer: "Placeholder answer text explaining the fourth frequently asked question.",
  },
];

export default function Home() {
  return (
    <Container>
      <section className={styles.hero}>
        <p className={styles.badge}>Placeholder content — not final branding</p>
        <h1 className={styles.heading}>Nutrition (placeholder product name)</h1>
        <p className={styles.subheading}>
          This is a temporary landing page shell used to demonstrate that the web foundation,
          routing, responsive layout, and deployment pipeline are working end to end. Copy, imagery,
          and visual design will be replaced once the UX direction is finalized.
        </p>
        <div className={styles.actions}>
          <Link href={ROUTES.register}>
            <Button type="button" size="lg">
              Create your account
            </Button>
          </Link>
          <Link href={ROUTES.guestHome}>
            <Button type="button" variant="outline" size="lg">
              Browse as a guest
            </Button>
          </Link>
        </div>
      </section>

      <section className={styles.stats} aria-label="Placeholder stats">
        {STATS.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <p className={styles.statValue}>{stat.value}</p>
            <p className={styles.statLabel}>{stat.label}</p>
          </div>
        ))}
      </section>

      <Separator />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Badge variant="outline">Features</Badge>
          <h2 className={styles.sectionHeading}>Placeholder features section heading</h2>
          <p className={styles.sectionBody}>
            Placeholder supporting copy describing the set of features below.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="py-6">
              <CardContent className="px-6">
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardBody}>{feature.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Badge variant="outline">How it works</Badge>
          <h2 className={styles.sectionHeading}>Placeholder how-it-works heading</h2>
          <p className={styles.sectionBody}>
            Placeholder supporting copy describing the steps below.
          </p>
        </div>
        <div className={styles.stepsGrid}>
          {STEPS.map((step) => (
            <div key={step.number} className={styles.step}>
              <p className={styles.stepNumber}>{step.number}</p>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardBody}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Badge variant="outline">Testimonials</Badge>
          <h2 className={styles.sectionHeading}>Placeholder testimonials heading</h2>
          <p className={styles.sectionBody}>
            Placeholder supporting copy introducing the quotes below.
          </p>
        </div>
        <div className={styles.testimonialsGrid}>
          {TESTIMONIALS.map((testimonial) => (
            <Card key={testimonial.name} className="py-6">
              <CardContent className="px-6">
                <p className={styles.quote}>&ldquo;{testimonial.quote}&rdquo;</p>
                <div className={styles.testimonialAuthor}>
                  <UserAvatar name={testimonial.name} size="sm" />
                  <div>
                    <p className={styles.testimonialName}>{testimonial.name}</p>
                    <p className={styles.testimonialRole}>{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Badge variant="outline">FAQ</Badge>
          <h2 className={styles.sectionHeading}>Placeholder FAQ heading</h2>
          <p className={styles.sectionBody}>
            Placeholder supporting copy introducing the questions below.
          </p>
        </div>
        <Accordion className={styles.faq}>
          {FAQS.map((faq) => (
            <AccordionItem key={faq.value} value={faq.value}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className={styles.finalCta}>
        <h2 className={styles.finalCtaHeading}>Placeholder closing call to action</h2>
        <p className={styles.finalCtaBody}>
          Placeholder supporting copy encouraging the visitor to take the next step.
        </p>
        <div className={styles.actions}>
          <Link href={ROUTES.register}>
            <Button type="button" size="lg">
              Create an account
            </Button>
          </Link>
          <Link href={ROUTES.login}>
            <Button type="button" variant="outline" size="lg">
              Sign in
            </Button>
          </Link>
        </div>
      </section>
    </Container>
  );
}
