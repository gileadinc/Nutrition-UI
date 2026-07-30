import { Container } from "@/components/Container";

export default function AboutPage() {
  return (
    <Container>
      <section style={{ paddingBlock: "3rem" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Placeholder page</p>
        <h1 style={{ fontSize: "2rem", marginTop: "0.5rem" }}>About (placeholder)</h1>
        <p style={{ marginTop: "1rem", maxWidth: "60ch", lineHeight: 1.6 }}>
          This route exists to demonstrate that routing works. Content will be replaced once product
          and UX direction are finalized.
        </p>
      </section>
    </Container>
  );
}
