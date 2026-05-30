import { CheckoutsView } from "./checkouts-view";

export const dynamic = "force-dynamic";

export default function CheckoutsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Checkouts</h1>
        <p className="text-muted-foreground text-sm mt-1">Track who has your books</p>
      </div>
      <CheckoutsView />
    </div>
  );
}
