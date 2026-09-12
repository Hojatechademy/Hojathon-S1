import React from "react";
import type { BrowserEvent } from "@shared/contracts";

export default function ActivityLog({ events }: { events: BrowserEvent[] }) {
  return (
    <section>
      <h3>Activity</h3>
      <ul className="activity-log">
        {events.map((e, i) => (
          <li key={i} className={`event-${e.type}`}>
            <span className="event-type">{e.type}</span> {e.pageId ? `[${e.pageId}] ` : ""}
            {e.fieldKey ? `(${e.fieldKey}) ` : ""}
            {e.message}
          </li>
        ))}
        {events.length === 0 && <li className="muted">No browser activity yet.</li>}
      </ul>
    </section>
  );
}
