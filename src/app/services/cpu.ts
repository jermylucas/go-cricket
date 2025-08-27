import { Injectable } from '@angular/core';
import { Player, PlayerAction } from '../models/player.model';
import { Rank } from '../models/card.model';

interface AIMemory {
  playerId: string;
  knownRanks: Map<Rank, number>; // rank -> estimated count
  lastAskedRanks: Rank[];
  successfulRequests: Map<string, Rank[]>; // targetPlayerId -> ranks they had
  failedRequests: Map<string, Rank[]>; // targetPlayerId -> ranks they didn't have
}

@Injectable({
  providedIn: 'root',
})
export class CPUService {
  // Memory service to track cpu history
  // The idea is that this could act as some sort of "AI" (not in the modern sense)
  // And we could set difficulties for the CPU
  private cpuMemories = new Map<string, AIMemory>();

  initializeCPU(playerId: string) {
    this.cpuMemories.set(playerId, {
      playerId,
      knownRanks: new Map(),
      lastAskedRanks: [],
      successfulRequests: new Map(),
      failedRequests: new Map(),
    });
  }

  updateCPUMemory(playerId: string, action: PlayerAction) {
    const memory = this.cpuMemories.get(playerId);
    if (!memory) return;

    switch (action.type) {
      case 'request':
        if (action.targetPlayerId && action.rank) {
          // Remember what we asked for
          memory.lastAskedRanks.push(action.rank);
          if (memory.lastAskedRanks.length > 10) {
            memory.lastAskedRanks.shift();
          }
        }
        break;

      case 'go-cricket':
        if (action.targetPlayerId && action.rank) {
          if (!memory.failedRequests.has(action.targetPlayerId)) {
            memory.failedRequests.set(action.targetPlayerId, []);
          }
          memory.failedRequests.get(action.targetPlayerId)!.push(action.rank);
        }
        break;
    }
  }

  updateMemoryFromObservation(aiPlayerId: string, observedAction: PlayerAction) {
    const memory = this.cpuMemories.get(aiPlayerId);
    if (!memory || observedAction.playerId === aiPlayerId) return;

    switch (observedAction.type) {
      case 'request':
        if (observedAction.targetPlayerId && observedAction.rank) {
          memory.knownRanks.set(
            observedAction.rank,
            (memory.knownRanks.get(observedAction.rank) || 0) + 1
          );
        }
        break;

      case 'book-formed':
        if (observedAction.rank) {
          // Someone formed a book, remove from our tracking
          memory.knownRanks.delete(observedAction.rank);
        }
        break;
    }
  }

  // This is all a work in progress
  // I thought it'd be cool to iterate on, where the "AI" makes decisions based on its mistakes
  // And what it has observed from other players
  // As you can see it's pretty incomplete and doesn't really affect the outcome or difficulty level
  makeAIDecision(
    aiPlayer: Player,
    otherPlayers: Player[]
  ): { targetPlayerId: string; rank: Rank } | null {
    const memory = this.cpuMemories.get(aiPlayer.id);

    if (!memory || aiPlayer.hand.length === 0) {
      return null;
    }
    const availableRanks = [...new Set(aiPlayer.hand.map((card) => card.rank))];
    const validTargets = otherPlayers.filter((p) => p.hand.length > 0);

    if (availableRanks.length === 0 || validTargets.length === 0) {
      return null;
    }

    // Strategy 1: Ask for ranks we have multiple cards of (more likely to get books)
    const rankCounts = new Map<Rank, number>();
    aiPlayer.hand.forEach((card) => {
      rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
    });

    const multipleCardRanks = availableRanks.filter((rank) => (rankCounts.get(rank) || 0) > 1);

    // Strategy 2: Avoid ranks we recently asked for unsuccessfully
    const recentFailures = memory.lastAskedRanks.slice(-3);
    const goodRanks = availableRanks.filter((rank) => !recentFailures.includes(rank));

    // Choose rank (prefer multiple cards, then avoid recent failures)
    let chosenRank: Rank;
    if (multipleCardRanks.length > 0) {
      chosenRank = multipleCardRanks[Math.floor(Math.random() * multipleCardRanks.length)];
    } else if (goodRanks.length > 0) {
      chosenRank = goodRanks[Math.floor(Math.random() * goodRanks.length)];
    } else {
      chosenRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];
    }

    // Choose target player
    const targetPlayer = this.chooseBestTarget(memory, chosenRank, validTargets);

    return {
      targetPlayerId: targetPlayer.id,
      rank: chosenRank,
    };
  }

  private chooseBestTarget(memory: AIMemory, rank: Rank, validTargets: Player[]): Player {
    // Strategy: Avoid players we know don't have this rank
    const goodTargets = validTargets.filter((target) => {
      const failedRanks = memory.failedRequests.get(target.id) || [];
      return !failedRanks.includes(rank);
    });

    if (goodTargets.length > 0) {
      // Prefer players with more cards (higher chance of having the rank)
      goodTargets.sort((a, b) => b.hand.length - a.hand.length);

      // Add some randomness to avoid being too predictable
      const topTargets = goodTargets.slice(0, Math.max(1, Math.ceil(goodTargets.length / 2)));
      return topTargets[Math.floor(Math.random() * topTargets.length)];
    }

    // If no good targets, pick randomly
    return validTargets[Math.floor(Math.random() * validTargets.length)];
  }

  getDifficultyLevel(aiPlayerId: string): 'easy' | 'medium' | 'hard' {
    // Different AI personalities based on player name
    // This requires that the CPU players are named a certain way.. which they are, for now
    if (aiPlayerId.includes('Alice')) return 'hard';
    if (aiPlayerId.includes('Bob')) return 'medium';
    return 'easy';
  }

  shouldMakeOptimalPlay(aiPlayerId: string): boolean {
    const difficulty = this.getDifficultyLevel(aiPlayerId);
    switch (difficulty) {
      case 'easy':
        return Math.random() < 0.3; // 30% optimal plays
      case 'medium':
        return Math.random() < 0.6; // 60% optimal plays
      case 'hard':
        return Math.random() < 0.9; // 90% optimal plays
      default:
        return false;
    }
  }

  clearMemory(playerId: string) {
    this.cpuMemories.delete(playerId);
  }

  clearAllMemories() {
    this.cpuMemories.clear();
  }
}
