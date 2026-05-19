import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eraser, Save } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (blob: Blob) => Promise<void> | void;
}

const SignaturePad = ({ open, onOpenChange, onSave }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  const setup = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0a1a3a';
    ctx.lineWidth = 2.2;
    setHasInk(false);
  };

  useEffect(() => { if (open) setTimeout(setup, 50); }, [open]);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    setHasInk(true);
  };
  const end = () => { drawing.current = false; last.current = null; };

  const clear = () => setup();

  const save = async () => {
    if (!hasInk) return;
    setSaving(true);
    canvasRef.current!.toBlob(async (blob) => {
      if (blob) await onSave(blob);
      setSaving(false);
      onOpenChange(false);
    }, 'image/png');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>സ്ക്രീനിൽ ഒപ്പിടുക</DialogTitle>
        </DialogHeader>
        <div className="border-2 border-dashed border-primary/40 rounded-lg bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-48 touch-none cursor-crosshair rounded-lg"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            onPointerCancel={end}
          />
        </div>
        <p className="text-xs text-muted-foreground">വിരൽ/മൗസ് ഉപയോഗിച്ച് ഒപ്പിടുക. വൃത്തിയുള്ള ഒപ്പ് ലഭിക്കാൻ വലിയ സ്ക്രീൻ ഉപയോഗിക്കാം.</p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={clear} type="button"><Eraser className="w-4 h-4 mr-2" />മായ്ക്കുക</Button>
          <Button onClick={save} disabled={!hasInk || saving}><Save className="w-4 h-4 mr-2" />{saving ? 'സേവ്...' : 'സേവ് ചെയ്യുക'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignaturePad;
