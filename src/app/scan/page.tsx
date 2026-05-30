import { ScanView } from "./scan-view";

export default function ScanPage() {
  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add a Book</h1>
        <p className="text-muted-foreground text-sm mt-1">Scan a barcode, enter an ISBN, or search by title</p>
      </div>
      <ScanView />
    </div>
  );
}
