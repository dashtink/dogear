import { ShelvesView } from "./shelves-view";

export const dynamic = "force-dynamic";

export default function ShelvesPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shelves</h1>
        <p className="text-muted-foreground text-sm mt-1">Organize your physical shelf locations</p>
      </div>
      <ShelvesView />
    </div>
  );
}
