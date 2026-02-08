export type DashboardPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function getDateRange(
  period: DashboardPeriod,
  month?: number,
  year?: number,
): { startDate: Date; endDate: Date } {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();

  switch (period) {
    case 'daily': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start, endDate: now };
    }
    case 'weekly': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1; // Monday as start
      const start = new Date(now);
      start.setDate(now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }
    case 'monthly': {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case 'yearly': {
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
  }
}

interface SaleRecord {
  saleDate: Date;
  salePrice: any;
  commissionAmount: any;
}

export function groupSalesIntoChartBuckets(
  sales: SaleRecord[],
  period: DashboardPeriod,
  startDate: Date,
  endDate: Date,
): { label: string; revenue: number; sales: number }[] {
  switch (period) {
    case 'daily':
      return groupByHour(sales, startDate);
    case 'weekly':
      return groupByDay(sales, startDate, endDate);
    case 'monthly':
      return groupByWeek(sales, startDate, endDate);
    case 'yearly':
      return groupByMonth(sales, startDate);
  }
}

function groupByHour(sales: SaleRecord[], startDate: Date) {
  const buckets: { label: string; revenue: number; sales: number }[] = [];
  for (let h = 0; h < 24; h++) {
    buckets.push({ label: `${h.toString().padStart(2, '0')}:00`, revenue: 0, sales: 0 });
  }
  for (const s of sales) {
    const d = new Date(s.saleDate);
    if (d >= startDate) {
      const h = d.getHours();
      buckets[h].revenue += Number(s.salePrice) || 0;
      buckets[h].sales += 1;
    }
  }
  return buckets;
}

function groupByDay(sales: SaleRecord[], startDate: Date, endDate: Date) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const buckets = days.map((d) => ({ label: d, revenue: 0, sales: 0 }));
  for (const s of sales) {
    const d = new Date(s.saleDate);
    if (d >= startDate && d <= endDate) {
      const day = d.getDay();
      const idx = day === 0 ? 6 : day - 1;
      buckets[idx].revenue += Number(s.salePrice) || 0;
      buckets[idx].sales += 1;
    }
  }
  return buckets;
}

function groupByWeek(sales: SaleRecord[], startDate: Date, endDate: Date) {
  const buckets: { label: string; revenue: number; sales: number }[] = [];
  const start = new Date(startDate);
  let weekNum = 1;
  while (start <= endDate) {
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());
    buckets.push({ label: `Week ${weekNum}`, revenue: 0, sales: 0 });
    weekNum++;
    start.setDate(start.getDate() + 7);
  }

  for (const s of sales) {
    const d = new Date(s.saleDate);
    if (d >= startDate && d <= endDate) {
      const daysSinceStart = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIdx = Math.floor(daysSinceStart / 7);
      if (weekIdx >= 0 && weekIdx < buckets.length) {
        buckets[weekIdx].revenue += Number(s.salePrice) || 0;
        buckets[weekIdx].sales += 1;
      }
    }
  }
  return buckets;
}

function groupByMonth(sales: SaleRecord[], startDate: Date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = startDate.getFullYear();
  const buckets = months.map((m) => ({ label: m, revenue: 0, sales: 0 }));
  for (const s of sales) {
    const d = new Date(s.saleDate);
    if (d.getFullYear() === year) {
      const m = d.getMonth();
      buckets[m].revenue += Number(s.salePrice) || 0;
      buckets[m].sales += 1;
    }
  }
  return buckets;
}
