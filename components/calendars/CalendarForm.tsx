"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { createCalendar, updateCalendar, deleteCalendar } from "@/actions/calendars";
import { toast } from "sonner";

const COLOR_PRESETS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];

interface CalendarFormProps {
  calendarId?: string;
  initialValues?: {
    name: string;
    description: string;
    color: string;
  };
}

export default function CalendarForm({ calendarId, initialValues }: CalendarFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [color, setColor] = useState(initialValues?.color ?? "#3B82F6");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", name);
    fd.set("description", description);
    fd.set("color", color);

    startTransition(async () => {
      const result = calendarId
        ? await updateCalendar(calendarId, fd)
        : await createCalendar(fd);

      if (result.error) {
        toast.error(result.error);
      } else if ("calendarId" in result) {
        toast.success("Calendar created");
        router.push(`/calendars/${result.calendarId}`);
        router.refresh();
      } else {
        toast.success("Calendar updated");
        router.refresh();
      }
    });
  }

  async function handleDelete() {
    if (!calendarId) return;
    if (!confirm("Delete this calendar and all its events? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteCalendar(calendarId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Calendar deleted");
        router.push("/calendar");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Office Team, Family"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this calendar for?"
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                color === c ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border border-input"
            title="Custom color"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {calendarId && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        )}
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {calendarId ? "Save Changes" : "Create Calendar"}
        </Button>
      </div>
    </form>
  );
}
