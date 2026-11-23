import { SHOP_SHIPS, getShipDataByLevel } from '../data';
import { ShipState } from '../types';

export function parseDurationStrToMs(durationStr?: string, level = 0): number {
  const raw = (
    durationStr ||
    getShipDataByLevel(level)?.withoutCrewFill ||
    SHOP_SHIPS.find((sp) => sp.level === level)?.durationStr ||
    '00:30'
  ).trim();

  // MM:SS format (e.g. "00:30", "01:00")
  const colonMatch = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10) || 0;
    const secs = parseInt(colonMatch[2], 10) || 0;
    return Math.max(5000, (mins * 60 + secs) * 1000);
  }

  // English hours/minutes format (e.g. "4h 15m", "5h 30m")
  const enHourMatch = raw.match(/(\d+(?:\.\d+)?)\s*h/i);
  const enMinMatch = raw.match(/(\d+(?:\.\d+)?)\s*m/i);
  const enSecMatch = raw.match(/(\d+(?:\.\d+)?)\s*s/i);
  if (enHourMatch || enMinMatch || enSecMatch) {
    const h = enHourMatch ? parseFloat(enHourMatch[1]) : 0;
    const m = enMinMatch ? parseFloat(enMinMatch[1]) : 0;
    const s = enSecMatch ? parseFloat(enSecMatch[1]) : 0;
    return Math.max(5000, Math.round((h * 3600 + m * 60 + s) * 1000));
  }

  // Arabic format from shipsData (e.g. "2س 50د", "1س 52.5د", "1ي 1س", "2ي 32د", "25د")
  const arDayMatch = raw.match(/(\d+(?:\.\d+)?)\s*ي/);
  const arHourMatch = raw.match(/(\d+(?:\.\d+)?)\s*س/);
  const arMinMatch = raw.match(/(\d+(?:\.\d+)?)\s*د/);
  if (arDayMatch || arHourMatch || arMinMatch) {
    const d = arDayMatch ? parseFloat(arDayMatch[1]) : 0;
    const h = arHourMatch ? parseFloat(arHourMatch[1]) : 0;
    const m = arMinMatch ? parseFloat(arMinMatch[1]) : 0;
    return Math.max(5000, Math.round((d * 86400 + h * 3600 + m * 60) * 1000));
  }

  return 30000;
}

export function getShipFishingDurationMs(
  ship: Pick<ShipState, 'durationStr' | 'level' | 'assignedCrew' | 'hasEngineUpgrade' | 'speedLevel'>
): number {
  const level = typeof ship.level === 'number' ? ship.level : 0;
  const crew = ship.assignedCrew || [];
  const hasSailor = crew.includes('sailor') || crew.includes('sailors');
  const hasLuck = crew.includes('luck');

  // Use exact Fleet Warehouse (مستودع الأسطول) timings from shipsData for Levels 1-30
  const shipData = getShipDataByLevel(level);
  if (shipData) {
    const durationText =
      hasSailor && hasLuck
        ? shipData.sailorPlusLucky
        : hasSailor
          ? shipData.sailor
          : hasLuck
            ? shipData.withoutCrewPlusLucky
            : shipData.withoutCrewFill;
    return parseDurationStrToMs(durationText, level);
  }

  // Fallback for Level 0 (starter boat) and Levels 32-37 (submarines) using SHOP_SHIPS spec
  const specDuration = SHOP_SHIPS.find((sp) => sp.level === level)?.durationStr || ship.durationStr || '00:30';
  let durationMs = parseDurationStrToMs(specDuration, level);
  if (hasSailor) {
    durationMs *= 0.5;
  }
  if (hasLuck) {
    durationMs *= 0.5;
  }
  return Math.max(5000, Math.round(durationMs));
}

export interface ShipFishingTimerState {
  isFishing: boolean;
  isAutoFishing: boolean;
  hasTimer: boolean;
  remainingMs: number;
  totalMs: number;
  progressPct: number;
  isReady: boolean;
}

export function getShipFishingTimerState(ship: ShipState, now: number): ShipFishingTimerState {
  const isFishing = ship.status === 'fishing';
  const isAutoFishing = Boolean(
    ship.assignedCrew?.some((c) => c === 'golden_hunter' || c === 'gold_fisher') &&
      !ship.autoFishingPaused
  );
  const hasTimer = isFishing && typeof ship.fishingEndTime === 'number' && ship.fishingEndTime > 0;
  const totalMs =
    typeof ship.fishingDurationMs === 'number' && ship.fishingDurationMs > 0
      ? ship.fishingDurationMs
      : getShipFishingDurationMs(ship);
  const remainingMs = hasTimer ? Math.max(0, (ship.fishingEndTime as number) - now) : 0;
  const elapsedMs = hasTimer ? Math.max(0, totalMs - remainingMs) : isFishing ? totalMs : 0;
  const progressPct =
    totalMs > 0 ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100))) : isFishing ? 100 : 0;
  const isReady = isFishing && !isAutoFishing && remainingMs <= 0;

  return {
    isFishing,
    isAutoFishing,
    hasTimer,
    remainingMs,
    totalMs,
    progressPct,
    isReady,
  };
}

export function formatFishingCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (days > 0) {
    return `${days}ي ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getSpeedUpGemCost(remainingMs: number): number {
  if (remainingMs <= 0) return 0;
  const minsLeft = Math.ceil(remainingMs / 60000);
  return Math.min(20, Math.max(1, Math.ceil(minsLeft / 30)));
}
