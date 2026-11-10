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

const BUCKET_COLORS = ['#10b981', '#a3e635', '#facc15', '#f97316', '#dc2626'];

export default function Payables() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('payables', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const aging = data?.aging ?? [];
  const byCo = data?.agingByCompany ?? [];
  const trend = data?.trend ?? [];
  const companies = [...new Set(byCo.map((r: any) => r.company))] as string[];
  const buckets = aging.map((a: any) => a.name) as string[];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Open Payables" value={formatDollar(k.openAp)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatNumber(k.items)} open items`} deltaType="neutral" />
          <MetricCard title="DPO (Aug 2026)" value={days(data?.dpo?.dpo)} icon={Calendar} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta="Month-end AP / trailing 90-day invoices x 90" deltaType="neutral" />
          <MetricCard title="Overdue" value={formatDollar(k.overdue)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatPct(100 * (k.overdue ?? 0) / (k.openAp || 1))} of open AP`} deltaType="negative" />
          <MetricCard title="On Payment Block" value={formatDollar(k.blocked)} icon={Receipt} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`${formatNumber(k.blockedItems)} items · ${formatDollar(k.discountsAvailable)} discounts still available`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="AP Aging" subtitle="Open items by due date, USD">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => formatDollar(v) },
              grid: { left: 70, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: buckets.map((b) => b.slice(2)) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ type: 'bar', data: aging.map((a: any, i: number) => ({ value: a.value, itemStyle: { color: BUCKET_COLORS[i] } })), barMaxWidth: 50 }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="AP Aging by Company" subtitle="USD">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => formatDollar(v) }, legend: { top: 0, textStyle: { fontSize: 10 } },
              grid: { left: 190, right: 20, bottom: 20, top: 50 },
              xAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, yAxis: { type: 'category', data: companies },
              series: buckets.map((b, i) => ({ name: b.slice(2), type: 'bar', stack: 'a', barMaxWidth: 20, itemStyle: { color: BUCKET_COLORS[i] },
                data: companies.map((c) => byCo.find((r: any) => r.company === c && r.bucket === b)?.value ?? 0) })),
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Open AP, Overdue AP and DPO by Month" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 50, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) },
              yAxis: [{ type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, { type: 'value', name: 'DPO days' }],
              series: [
                { name: 'Open AP', type: 'bar', data: trend.map((r: any) => r.openAp), itemStyle: { color: '#bae6fd' } },
                { name: 'Overdue AP', type: 'bar', data: trend.map((r: any) => r.overdue), itemStyle: { color: '#fca5a5' } },
                { name: 'DPO', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.dpo?.toFixed?.(1)), itemStyle: { color: '#f59e0b' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="DPO by Company (Aug 2026)">
            <DataTable data={data?.dpoByCompany ?? []} columns={[
              { key: 'name', label: 'Company' }, { key: 'dpo', label: 'DPO', format: days }, { key: 'openAp', label: 'Open AP', format: formatDollar },
              { key: 'overdue', label: 'Overdue', format: formatDollar },
            ]} />
          </ChartCard>
          <ChartCard title="Discounts to Take and Blocked Items" subtitle="Open items with a discount still available or a payment block">
            <DataTable data={data?.dueSoon ?? []} columns={[
              { key: 'invoiceId', label: 'Invoice' }, { key: 'supplier', label: 'Supplier' }, { key: 'discountDate', label: 'Discount by', format: dt },
              { key: 'dueDate', label: 'Due', format: dt }, { key: 'value', label: 'Amount', format: formatDollar }, { key: 'discount', label: 'Discount', format: formatDollar },
              { key: 'paymentBlock', label: 'Block' },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
