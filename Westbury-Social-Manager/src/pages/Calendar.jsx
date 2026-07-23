import React, { useEffect, useState } from "react";
import { PageHeader, Card } from "../components/ui.jsx";
import { api } from "../lib/api.js";

// Shows the existing posting schedule: one post per day at 9am UK, using the
// same date-based rotation the generator uses (day number % number of ideas).
export default function Calendar() {
  const [ideas, setIdeas] = useState([]);
  useEffect(() => { api.getIdeas().then((x) => setIdeas(x || [])); }, []);

  const dayNumber = (d) => Math.floor(d.getTime() / 86400000);
  const today = new Date();
  const todayNum = dayNumber(today);

  // Build a 2-week grid starting from the Monday of this week.
  const start = new Date(today);
  const dow = (start.getDay() + 6) % 7; // 0 = Monday
  start.setDate(start.getDate() - dow);

  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const num = dayNumber(d);
    const idea = ideas.length ? ideas[((num % ideas.length) + ideas.length) % ideas.length] : null;
    days.push({
      date: d,
      num,
      isPast: num < todayNum,
      isToday: num === todayNum,
      topic: idea ? (Array.isArray(idea.headline) ? idea.headline.join(" ") : idea.category) : "",
      category: idea ? idea.category : "",
    });
  }

  const dow_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="One post per day at 09:00 UK. Topics rotate automatically."
      />
      <Card>
        <div className="cal" style={{ marginBottom: 8 }}>
          {dow_labels.map((l) => (
            <div key={l} style={{ color: "var(--gold)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>{l}</div>
          ))}
        </div>
        <div className="cal">
          {days.map((day, i) => (
            <div key={i} className={`day ${day.isPast ? "past" : ""} ${day.isToday ? "today" : ""}`}>
              <div className="d">{day.date.getDate()}</div>
              {day.category && <div className="topic" style={{ color: "var(--blush)" }}>{day.category}</div>}
              <div className="topic">{day.topic}</div>
              {!day.isPast && <div className="topic" style={{ color: "var(--gold)" }}>09:00</div>}
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ marginTop: 16 }} title="How scheduling works">
        <div className="sub">
          The GitHub Actions workflow runs every day and posts at 9am UK (it handles British Summer
          Time automatically). Each day's topic is chosen by the same rotation shown above, so the
          calendar is an accurate preview of what will go out.
        </div>
      </Card>
    </>
  );
}
