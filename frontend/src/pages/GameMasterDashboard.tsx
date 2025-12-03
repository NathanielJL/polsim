/**
 * GAME MASTER DASHBOARD
 * 
 * Tools for GMs to manage the simulation:
 * - Review and approve/reject events
 * - Adjust severity/duration sliders
 * - Override game values
 * - Communicate with AI
 * - Monitor world state
 * - View audit log
 */

import React, { useState, useEffect } from "react";
import "../styles/GameMasterDashboard.css";

interface PendingEvent {
  id: string;
  title: string;
  description: string;
  severity: number;
  duration: number;
  type: string;
}

const GameMasterDashboard: React.FC = () => {
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"events" | "overrides" | "ai">("events");

  useEffect(() => {
    const fetchPendingEvents = async () => {
      try {
        const response = await fetch(`/api/gm/pending-events/gm-123`);
        const data = await response.json();
        setPendingEvents(data.events || []);
      } catch (error) {
        console.error("Failed to fetch pending events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingEvents();
  }, []);

  const handleEventReview = async (eventId: string, approved: boolean, duration?: number) => {
    try {
      await fetch(`/api/gm/events/${eventId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmId: "gm-123",
          approved,
          durationOverride: duration,
        }),
      });

      // Remove from pending
      setPendingEvents(pendingEvents.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error("Failed to review event:", error);
    }
  };

  return (
    <div className="gm-dashboard">
      <header>
        <h1>Game Master Dashboard</h1>
        <p>Manage world simulation and narrative</p>
      </header>

      <nav className="gm-tabs">
        <button
          className={activeTab === "events" ? "active" : ""}
          onClick={() => setActiveTab("events")}
        >
          Pending Events
        </button>
        <button
          className={activeTab === "overrides" ? "active" : ""}
          onClick={() => setActiveTab("overrides")}
        >
          Value Overrides
        </button>
        <button
          className={activeTab === "ai" ? "active" : ""}
          onClick={() => setActiveTab("ai")}
        >
          AI Instructions
        </button>
      </nav>

      <main className="gm-content">
        {activeTab === "events" && (
          <section className="events-review">
            <h2>Events Pending Review</h2>
            {loading ? (
              <p>Loading...</p>
            ) : pendingEvents.length === 0 ? (
              <p>No events pending review.</p>
            ) : (
              <div className="events-list">
                {pendingEvents.map((event) => (
                  <EventReviewCard
                    key={event.id}
                    event={event}
                    onReview={handleEventReview}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "overrides" && (
          <section className="value-overrides">
            <h2>Override Game Values</h2>
            <OverrideForm />
          </section>
        )}

        {activeTab === "ai" && (
          <section className="ai-instructions">
            <h2>Communicate with AI</h2>
            <AIInstructionForm />
          </section>
        )}
      </main>
    </div>
  );
};

interface EventReviewCardProps {
  event: PendingEvent;
  onReview: (eventId: string, approved: boolean, duration?: number) => void;
}

const EventReviewCard: React.FC<EventReviewCardProps> = ({ event, onReview }) => {
  const [durationOverride, setDurationOverride] = useState(event.duration);

  return (
    <div className="event-card">
      <div className="event-header">
        <h3>{event.title}</h3>
        <span className={`severity severity-${event.severity}`}>Severity: {event.severity}/10</span>
      </div>
      <p className="event-type">{event.type}</p>
      <p className="event-description">{event.description}</p>

      <div className="duration-control">
        <label>Duration (turns):</label>
        <input
          type="number"
          min="1"
          value={durationOverride}
          onChange={(e) => setDurationOverride(parseInt(e.target.value))}
        />
      </div>

      <div className="actions">
        <button className="approve" onClick={() => onReview(event.id, true, durationOverride)}>
          Approve
        </button>
        <button className="reject" onClick={() => onReview(event.id, false)}>
          Reject
        </button>
      </div>
    </div>
  );
};

const OverrideForm: React.FC = () => {
  const [target, setTarget] = useState("gdp");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit override
    alert(`Override submitted: ${target} = ${value}`);
  };

  return (
    <form className="override-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Target Variable:</label>
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="gdp">GDP</option>
          <option value="unemployment">Unemployment Rate</option>
          <option value="population_mood">Population Mood</option>
          <option value="event_probability">Event Probability</option>
        </select>
      </div>

      <div className="form-group">
        <label>Value:</label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Reason:</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this override is necessary"
          required
        />
      </div>

      <button type="submit">Apply Override</button>
    </form>
  );
};

const AIInstructionForm: React.FC = () => {
  const [instruction, setInstruction] = useState("");
  const [context, setContext] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit AI instruction
    alert("Instruction sent to AI system");
  };

  return (
    <form className="ai-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Instruction:</label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Tell the AI system what to do..."
          required
        />
      </div>

      <div className="form-group">
        <label>Context (optional):</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Provide additional context..."
        />
      </div>

      <div className="form-group">
        <label>Priority:</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <button type="submit">Send Instruction</button>
    </form>
  );
};

export default GameMasterDashboard;
