import { Suspense } from "react";
import { LibraryView } from "./library-view";

export const dynamic = "force-dynamic";

export default function LibraryPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Library</h1>
          <p className="text-muted-foreground text-sm mt-1">All your books</p>
        </div>
        <a href="/scan" className="inline-flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          + Add Book
        </a>
      </div>
      <Suspense>
        <LibraryView />
      </Suspense>
    </div>
  );
}
