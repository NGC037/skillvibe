"use client";

import { useRouter } from "next/navigation";

export default function DeleteEventButton({
  eventId,
}: {
  eventId: string;
}) {
  const router = useRouter();

async function handleDelete() {
  const confirmed = confirm("Delete this event?");
  if (!confirmed) return;

  const res = await fetch(`/api/admin/events/${eventId}`, {
    method: "DELETE",
  });

  const data = await res.json();

  if (res.ok) {
    router.refresh();
  } else {
    alert(data.error || "Failed to delete event");
  }
}

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 text-sm"
    >
      Delete
    </button>
  );
}