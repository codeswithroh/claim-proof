import { useState, useEffect } from "react";

export interface HistorySample {
  ts: number;
  prices: {
    price_btc: string;
    price_eth: string;
    price_xlm: string;
  };
}

export function useOracleHistory() {
  const [history, setHistory] = useState<HistorySample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/oracle/history");
        const data = await res.json();
        if (!cancelled && data.success) setHistory(data.history);
      } catch (_) {}
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000); // refresh every 5min
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { history, loading };
}
