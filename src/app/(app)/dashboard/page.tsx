import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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

      <Separator />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No data yet</EmptyTitle>
              <EmptyDescription>
                Placeholder empty state for future dashboard content.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" variant="outline">
                Placeholder action
              </Button>
            </EmptyContent>
          </Empty>
        </TabsContent>
        <TabsContent value="activity">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No activity yet</EmptyTitle>
              <EmptyDescription>
                Placeholder empty state for a future activity feed.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </TabsContent>
      </Tabs>
    </div>
  );
}
