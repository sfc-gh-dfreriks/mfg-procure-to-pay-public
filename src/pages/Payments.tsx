import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatPct, formatNumber } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Calendar, Gauge, Activity, Receipt, TrendingDown, FileText, PieChart, Users } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const days = (v: any) => (v == null ? '–' : `${Number(v).toFixed(1)} d`);
const dt = (v: any) => (v ? String(v).slice(0, 10) : '–');
const pctAxis = { type: 'value', name: '%', min: 0, max: 100 };

const TIMING_COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#dc2626'];

export default function Payments() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('payments', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const iv = data?.inv ?? {};
  const trend = data?.trend ?? [];
  const timing = data?.timing ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Paid to Suppliers" value={formatDollar(k.paid)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatNumber(k.payments)} payments · ${formatPct(k.bankConfirmedPct)} confirmed by the bank`} deltaType="neutral" />
          <MetricCard title="Paid On Time" value={formatPct(iv.onTimePct)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`Late payments average ${days(iv.avgDaysLate)} past due`} deltaType={iv.onTimePct >= 90 ? 'positive' : 'negative'} />
          <MetricCard title="Discounts Captured" value={formatDollar(iv.captured)} icon={TrendingDown} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`${formatPct(iv.capturePct)} of offered · ${formatDollar(iv.lost)} lost`} deltaType="neutral" />
          <MetricCard title="Paid Outside the Payment Run" value={formatDollar(k.outsideRun)} icon={Receipt} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatNumber(k.outsideRunN)} bank-only payments · ${formatNumber(iv.earlyNoDiscount)} paid early without a discount`} deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Payment Timing vs Due Date" subtitle="Paid invoices, USD">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => formatDollar(v) }, grid: { left: 70, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: timing.map((t: any) => t.name.slice(2)) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ type: 'bar', data: timing.map((t: any, i: number) => ({ value: t.value, itemStyle: { color: TIMING_COLORS[i] } })), barMaxWidth: 50 }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Where Each Payment Was Seen" subtitle="De-duplicated across the SAP payment run and the bank feed">
            <DataTable data={data?.seenIn ?? []} columns={[
              { key: 'name', label: 'Seen in' }, { key: 'payments', label: 'Payments', format: formatNumber }, { key: 'value', label: 'Amount', format: formatDollar },
            ]} />
            <div className="mt-4">
              <DataTable data={data?.method ?? []} columns={[
                { key: 'name', label: 'Method' }, { key: 'payments', label: 'Payments', format: formatNumber }, { key: 'value', label: 'Amount', format: formatDollar },
                { key: 'runToValue', label: 'Run to value date', format: days },
              ]} />
            </div>
          </ChartCard>
          <ChartCard title="On-Time Payment and Discounts by Month" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 50, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) },
              yAxis: [{ type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, pctAxis],
              series: [
                { name: 'Discount captured', type: 'bar', stack: 'd', data: trend.map((r: any) => r.captured), itemStyle: { color: '#10b981' } },
                { name: 'Discount lost', type: 'bar', stack: 'd', data: trend.map((r: any) => r.lost), itemStyle: { color: '#fca5a5' } },
                { name: 'Paid on time %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.onTimePct?.toFixed?.(1)), itemStyle: { color: '#29b5e8' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Discounts Lost by Supplier" subtitle="Offered but not taken, USD">
            <Bars rows={data?.lostBySupplier ?? []} label="name" value="lost" color="#f97316" height={320} leftPad={220} />
          </ChartCard>
          <ChartCard title="Largest Payments Outside the SAP Payment Run" subtitle="In the bank feed only">
            <DataTable data={data?.outsideRun ?? []} columns={[
              { key: 'paymentId', label: 'Reference' }, { key: 'supplier', label: 'Payee' }, { key: 'company', label: 'Company' },
              { key: 'valueDate', label: 'Value date', format: dt }, { key: 'value', label: 'Amount', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
