"use client";
import { useEffect, useRef, useState, type SetStateAction } from "react";

type Envelope<T> = { version: number; savedAt: string; value: T };
function compatible(sample: unknown, value: unknown): boolean {
  if (sample === null) return value === null || typeof value === "number" || typeof value === "string";
  if (Array.isArray(sample)) return Array.isArray(value) && value.length <= 1000 && (!sample.length || value.every(v => compatible(sample[0], v)));
  if (typeof sample === "object") return !!value && typeof value === "object" && !Array.isArray(value) && Object.entries(sample as object).every(([k, v]) => k in value && compatible(v, (value as Record<string, unknown>)[k]));
  return typeof value === typeof sample;
}
// Drafts are isolated by account, week and task. They never contain access credentials.
export function useRecoverableDraft<T>(key: string, version: number, initial: T, onDirty: (dirty: boolean) => void) {
  const [value, setValue] = useState(initial), [dirty, setDirty] = useState(false);
  const [recovery, setRecovery] = useState<Envelope<T> | null>(null), [storageError, setStorageError] = useState(false);
  const [baseVersion, setBaseVersion] = useState(version), [needsReview, setNeedsReview] = useState(false);
  const latest = useRef(initial), callback = useRef(onDirty); latest.current = initial; callback.current = onDirty;
  const initialFingerprint = JSON.stringify(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) { const saved = JSON.parse(raw); if (saved && Number.isInteger(saved.version) && typeof saved.savedAt === "string" && compatible(latest.current, saved.value)) setRecovery(saved); else { localStorage.removeItem(key); setStorageError(true); } }
    } catch { setStorageError(true); }
  }, [key]);
  useEffect(() => { if (!dirty) { setValue(latest.current); setBaseVersion(version); } }, [version, dirty, initialFingerprint]);
  useEffect(() => { callback.current(dirty); return () => callback.current(false); }, [dirty]);
  useEffect(() => {
    if (!dirty) return;
    try { localStorage.setItem(key, JSON.stringify({ version: baseVersion, savedAt: new Date().toISOString(), value })); }
    catch { setStorageError(true); }
  }, [key, value, dirty, baseVersion]);
  function update(next: SetStateAction<T>) { setDirty(true); setValue(next); }
  function clear() { try { localStorage.removeItem(key); } catch { /* The visible storage warning remains. */ } setRecovery(null); setDirty(false); setNeedsReview(false); }
  function restore() { if (!recovery) return; setValue(recovery.value); setBaseVersion(recovery.version); setNeedsReview(recovery.version !== version); setDirty(true); setRecovery(null); }
  function review() { setBaseVersion(version); setNeedsReview(false); }
  return { value, update, dirty, recovery, restore, clear, storageError, needsReview: needsReview || (dirty && baseVersion !== version), review };
}
