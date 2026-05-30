"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BrowserCodeReader } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { CameraOff, RefreshCw, FlipHorizontal } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const readerRef  = useRef<BrowserMultiFormatReader | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [scanning,    setScanning]    = useState(false);
  const [facingFront, setFacingFront] = useState(false);
  const [hasMultiple, setHasMultiple] = useState(false);

  async function start(useFront = false) {
    if (!videoRef.current) return;
    readerRef.current?.reset();
    setError(null);
    setScanning(false);

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Check if there are multiple cameras (so we can show the flip button)
      try {
        const devs = await reader.listVideoInputDevices();
        setHasMultiple(devs.length > 1);
      } catch { /* permission not yet granted — skip */ }

      // Use constraints-based approach: works on mobile without device enumeration
      const facing = useFront ? "user" : "environment";
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      setScanning(true);
      await reader.decodeFromConstraints(constraints, videoRef.current, (result, err) => {
        if (result) {
          const text = result.getText().replace(/[-\s]/g, "");
          if (/^\d{10}(\d{3})?$/.test(text)) {
            onScan(text);
          }
        }
        if (err && !(err instanceof Error && err.name === "NotFoundException")) {
          // NotFoundException is thrown every frame when no barcode is found — ignore it
        }
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setScanning(false);
      if (/Permission|NotAllowed|denied/i.test(msg)) {
        setError("Camera permission denied. Please allow camera access and try again.");
      } else if (/NotFound|DevicesNotFound/i.test(msg)) {
        setError("No camera found on this device.");
      } else if (/NotSupported|insecure|https/i.test(msg)) {
        setError("Camera requires a secure connection (HTTPS). Please access this app over HTTPS.");
      } else {
        setError("Could not start camera: " + msg);
      }
    }
  }

  useEffect(() => {
    start(false);
    return () => { readerRef.current?.reset(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flipCamera() {
    const next = !facingFront;
    setFacingFront(next);
    start(next);
  }

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {error ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <CameraOff className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => start(facingFront)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-32 border-2 border-white/70 rounded-lg relative">
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br" />
              </div>
            </div>
            {/* Flip button overlay */}
            {hasMultiple && (
              <button
                onClick={flipCamera}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <FlipHorizontal className="h-5 w-5" />
              </button>
            )}
          </div>
          {scanning && (
            <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
              Point camera at barcode…
            </p>
          )}
        </>
      )}
    </div>
  );
}
