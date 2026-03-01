"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { fetchStockPrices } from "@/lib/yahoo";
import type { Company } from "@/types/database";

interface StockPrice {
  code: string;
  price: number;
  changePercent: number;
}

type StockPriceMap = Record<string, StockPrice>;

const REFRESH_INTERVAL = 60_000; // 1분 간격 갱신

export function useStockPrices(companies: Company[]) {
  const [prices, setPrices] = useState<StockPriceMap>({});
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 상장 기업의 종목코드만 추출 (안정적 참조)
  const stockCodes = useMemo(
    () =>
      companies
        .filter((c) => c.is_listed && c.stock_code)
        .map((c) => c.stock_code as string)
        .sort(),
    [companies]
  );

  const codesKey = stockCodes.join(",");

  const fetchPrices = useCallback(async () => {
    if (!codesKey) return;
    const codes = codesKey.split(",");

    setLoading(true);
    try {
      const data = await fetchStockPrices(codes);
      const map: StockPriceMap = {};
      for (const item of data) {
        map[item.code] = item;
      }
      setPrices(map);
    } catch {
      // 주가 조회 실패는 무시
    } finally {
      setLoading(false);
    }
  }, [codesKey]);

  useEffect(() => {
    fetchPrices();

    if (!codesKey) return;
    intervalRef.current = setInterval(fetchPrices, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPrices, codesKey]);

  // Company에 주가 데이터를 매핑
  const enrichedCompanies: Company[] = companies.map((c) => {
    if (!c.stock_code || !prices[c.stock_code]) return c;
    const p = prices[c.stock_code];
    return {
      ...c,
      stock_price: p.price,
      price_change_percent: p.changePercent,
    };
  });

  return { enrichedCompanies, loading, refetch: fetchPrices };
}
