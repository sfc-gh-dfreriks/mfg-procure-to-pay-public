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

const MATCH_COLORS: Record<string, string> = { MATCHED: '#10b981', PRICE_VARIANCE: '#f59e0b', QTY_VARIANCE: '#f97316', NO_GR: '#8b5cf6', NO_PO: '#ef4444' };

export default function Invoices() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('invoices', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  const ch = data?.byChannel ?? [];
  const ms = data?.matchStatus ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        {k.hasCapture === false && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
            The AP automation feed is not selected, so channel, touchless and receipt dates are unavailable; first-pass match falls back to the SAP 3-way match.
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Invoices Posted" value={formatNumber(k.invoices)} icon={FileText} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatDollar(k.invoiced)} invoiced`} deltaType="neutral" />
          <MetricCard title="Touchless" value={formatPct(k.touchlessPct)} icon={Activity} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="No human touch from receipt to posting" deltaType={k.touchlessPct >= 60 ? 'positive' : 'neutral'} />
          <MetricCard title="First-Pass Match" value={formatPct(k.firstPassPct)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta="Matched to PO and receipt with no exception" deltaType="neutral" />
          <MetricCard title="Receipt to Posting" value={days(k.receiptToPost)} icon={Calendar} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta={`Receipt to payment ${days(k.receiptToPay)}`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Touchless and First-Pass Match by Capture Channel">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0 }, grid: { left: 130, right: 30, bottom: 20, top: 40 },
              xAxis: { ...pctAxis }, yAxis: { type: 'category', data: ch.map((r: any) => r.name) },
              series: [
                { name: 'Touchless %', type: 'bar', data: ch.map((r: any) => r.touchlessPct?.toFixed?.(1)), itemStyle: { color: '#8b5cf6' } },
                { name: 'First-pass match %', type: 'bar', data: ch.map((r: any) => r.firstPassPct?.toFixed?.(1)), itemStyle: { color: '#10b981' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="SAP 3-Way Match at Posting" subtitle="Invoice vs PO price (2% tolerance) and goods received">
            <ReactECharts keepOrder noPieConversion option={{
              tooltip: { trigger: 'item' }, legend: { bottom: 0, textStyle: { fontSize: 10 } },
              series: [{ type: 'pie', radius: ['45%', '70%'], data: ms.map((r: any) => ({ name: r.name, value: r.invoices, itemStyle: { color: MATCH_COLORS[r.name] } })),
                         label: { formatter: '{b}\n{d}%' } }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Touchless and First-Pass Match by Month" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 60, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) }, yAxis: [{ type: 'value', name: 'invoices' }, pctAxis],
              series: [
                { name: 'Invoices', type: 'bar', data: trend.map((r: any) => r.invoices), itemStyle: { color: '#e2e8f0' } },
                { name: 'Touchless %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.touchlessPct?.toFixed?.(1)), itemStyle: { color: '#8b5cf6' } },
                { name: 'First-pass %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.firstPassPct?.toFixed?.(1)), itemStyle: { color: '#10b981' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Invoice Processing by Company" className="lg:col-span-2">
            <DataTable data={data?.byCompany ?? []} columns={[
              { key: 'name', label: 'Company' }, { key: 'invoices', label: 'Invoices', format: formatNumber }, { key: 'touchlessPct', label: 'Touchless', format: formatPct },
              { key: 'firstPassPct', label: 'First-pass match', format: formatPct }, { key: 'receiptToPost', label: 'Receipt to post', format: days },
              { key: 'receiptToPay', label: 'Receipt to pay', format: days },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
