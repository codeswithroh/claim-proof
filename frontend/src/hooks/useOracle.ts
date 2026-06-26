import { useState, useEffect, useCallback } from "react";
import type { OraclePrices } from "../types";

export function useOracle(intervalMs = 15_000) {
  const [prices, setPrices] = useState<OraclePrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await window.fetch("/api/oracle/prices");
      const data = await res.json();
      if (data.success) {
        setPrices(data.prices);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => clearInterval(id);
  }, [fetch, intervalMs]);

  return { prices, loading, error, lastUpdated, refresh: fetch };
}
