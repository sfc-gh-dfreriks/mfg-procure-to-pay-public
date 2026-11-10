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

export default function PurchaseOrders() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('purchase-orders', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const cat = data?.byCategory ?? [];
  const trend = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Spend on Contract" value={formatPct(k.onContractPct)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${formatDollar(k.spend)} PO spend · ${formatNumber(k.pos)} POs`} deltaType={k.onContractPct >= 70 ? 'positive' : 'neutral'} />
          <MetricCard title="Maverick Spend" value={formatDollar(k.maverick)} icon={PieChart} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta="Bought off contract when a contract was available" deltaType="negative" />
          <MetricCard title="After-the-Fact POs" value={formatNumber(k.atfLines)} icon={Receipt} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta={`${formatDollar(k.atfValue)} where the invoice came before the PO`} deltaType="negative" />
          <MetricCard title="Open Commitments" value={formatDollar(k.openCommitments)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatPct(k.withReqPct)} of PO lines came from a requisition`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Spend by Material Group and Contract Status" subtitle="USD" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => formatDollar(v) }, legend: { top: 0 },
              grid: { left: 170, right: 30, bottom: 20, top: 40 },
              xAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, yAxis: { type: 'category', inverse: true, data: cat.map((r: any) => r.name) },
              series: [
                { name: 'On contract', type: 'bar', stack: 's', data: cat.map((r: any) => r.onContract), itemStyle: { color: '#10b981' } },
                { name: 'Maverick (contract available)', type: 'bar', stack: 's', data: cat.map((r: any) => r.maverick), itemStyle: { color: '#ef4444' } },
                { name: 'No contract', type: 'bar', stack: 's', data: cat.map((r: any) => r.noContract), itemStyle: { color: '#cbd5e1' } },
              ],
            }} style={{ height: 460 }} />
          </ChartCard>
          <ChartCard title="Contract Compliance by Month">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 50, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) }, yAxis: pctAxis,
              series: [
                { name: 'On contract %', type: 'line', smooth: true, data: trend.map((r: any) => r.onContractPct?.toFixed?.(1)), itemStyle: { color: '#10b981' } },
                { name: 'Maverick %', type: 'line', smooth: true, data: trend.map((r: any) => r.maverickPct?.toFixed?.(1)), itemStyle: { color: '#ef4444' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Top Maverick Suppliers" subtitle="Off-contract spend, USD">
            <Bars rows={data?.maverickBySupplier ?? []} label="name" value="maverick" color="#ef4444" height={300} leftPad={220} />
          </ChartCard>
          <ChartCard title="After-the-Fact POs by Company">
            <DataTable data={data?.afterTheFact ?? []} columns={[
              { key: 'name', label: 'Company' }, { key: 'lines', label: 'PO lines', format: formatNumber },
              { key: 'value', label: 'Value', format: formatDollar }, { key: 'pct', label: 'Share of lines', format: formatPct },
            ]} />
          </ChartCard>
          <ChartCard title="Direct vs Indirect Spend">
            <DataTable data={data?.bySpendType ?? []} columns={[
              { key: 'name', label: 'Spend type' }, { key: 'spend', label: 'Spend', format: formatDollar }, { key: 'onContractPct', label: 'On contract', format: formatPct },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
