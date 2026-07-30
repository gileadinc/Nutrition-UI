import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { Tabs } from "@/components/Tabs";
import { Divider } from "@/components/Divider";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.heading}>Dashboard (placeholder)</h1>
        <Badge>Placeholder</Badge>
      </div>
      <p className={styles.subheading}>
        This route demonstrates an authenticated app shell separate from the public marketing pages.
        Real dashboard widgets will replace this content.
      </p>

      <Divider />

      <Tabs
        items={[
          {
            value: "overview",
            label: "Overview",
            content: (
              <EmptyState
                title="No data yet"
                description="Placeholder empty state for future dashboard content."
                action={<Button variant="outline">Placeholder action</Button>}
              />
            ),
          },
          {
            value: "activity",
            label: "Activity",
            content: (
              <EmptyState
                title="No activity yet"
                description="Placeholder empty state for a future activity feed."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
