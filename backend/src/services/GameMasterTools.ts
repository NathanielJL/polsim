/**
 * GAME MASTER TOOLS
 * 
 * Interface for GMs to:
 * - Review and approve/reject events before turn resolution
 * - Adjust event duration/severity sliders
 * - Override game values if needed
 * - Communicate with AI system
 * - Monitor world state
 * - Generate narrative events
 */

import { Event } from "../models/mongoose";

export interface GMEventReview {
  eventId: string;
  gmId: string;
  approved: boolean;
  durationOverride?: number; // Override auto-generated duration
  notes?: string;
  reviewedAt: Date;
}

export interface GMOverride {
  id: string;
  gmId: string;
  target: "gdp" | "unemployment" | "population_mood" | "event_probability";
  value: number;
  reason: string;
  appliedAt: Date;
}

export interface GMAIInstruction {
  id: string;
  gmId: string;
  instruction: string; // Natural language instruction to AI
  context?: string; // Context for the AI
  priority: "low" | "medium" | "high";
  createdAt: Date;
  processedAt?: Date;
}

export class GameMasterTools {
  private pendingEventReviews: Map<string, Event[]> = new Map(); // gmId -> pending events
  private gmOverrides: GMOverride[] = [];
  private aiInstructions: GMAIInstruction[] = [];

  /**
   * GM receives pending events for review before turn resolution
   */
  getEventsForReview(gmId: string): Event[] {
    return this.pendingEventReviews.get(gmId) || [];
  }

  /**
   * GM approves/rejects event and can override duration
   */
  reviewEvent(
    gmId: string,
    eventId: string,
    approved: boolean,
    durationOverride?: number,
    notes?: string
  ): GMEventReview {
    const review: GMEventReview = {
      eventId,
      gmId,
      approved,
      durationOverride,
      notes,
      reviewedAt: new Date(),
    };

    // Update event status
    // If approved and duration override provided, update event.duration
    // If rejected, remove from game

    return review;
  }

  /**
   * GM can directly override game state values if needed for balance
   */
  addOverride(
    gmId: string,
    target: string,
    value: number,
    reason: string
  ): GMOverride {
    const override: GMOverride = {
      id: `override-${Date.now()}`,
      gmId,
      target: target as any,
      value,
      reason,
      appliedAt: new Date(),
    };

    this.gmOverrides.push(override);
    return override;
  }

  /**
   * GM can instruct the AI system to take specific actions
   * Used for narrative guidance, emergency fixes, or special events
   */
  sendAIInstruction(
    gmId: string,
    instruction: string,
    context?: string,
    priority?: "low" | "medium" | "high"
  ): GMAIInstruction {
    const aiInstruction: GMAIInstruction = {
      id: `ai-inst-${Date.now()}`,
      gmId,
      instruction,
      context,
      priority: priority || "medium",
      createdAt: new Date(),
    };

    this.aiInstructions.push(aiInstruction);
    return aiInstruction;
  }

  /**
   * Get pending AI instructions for processing
   */
  getPendingAIInstructions(): GMAIInstruction[] {
    return this.aiInstructions.filter((i) => !i.processedAt);
  }

  /**
   * Mark instruction as processed
   */
  markInstructionProcessed(instructionId: string): void {
    const instruction = this.aiInstructions.find((i) => i.id === instructionId);
    if (instruction) {
      instruction.processedAt = new Date();
    }
  }

  /**
   * Get all overrides applied (for audit trail)
   */
  getOverrideHistory(): GMOverride[] {
    return [...this.gmOverrides];
  }
}
