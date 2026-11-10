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

export default function SupplierDelivery() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('supplier-delivery', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Supplier OTIF" value={formatPct(k.otifPct)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${formatPct(k.shortPct)} received short`} deltaType={k.otifPct >= 90 ? 'positive' : 'negative'} />
          <MetricCard title="Confirmed on the Portal" value={formatPct(k.confirmedPct)} icon={FileText} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatPct(k.asnPct)} with an advance ship notice`} deltaType="neutral" />
          <MetricCard title="Average Lateness" value={days(k.avgDaysLate)} icon={Calendar} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta="Late deliveries only" deltaType="negative" />
          <MetricCard title="Past-Due Open PO Lines" value={formatNumber(k.pastDueLines)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatDollar(k.pastDueValue)} not yet received`} deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Supplier OTIF by Requested Delivery Month" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 60, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) }, yAxis: [{ type: 'value', name: 'lines' }, pctAxis],
              series: [
                { name: 'Lines due', type: 'bar', data: trend.map((r: any) => r.lines), itemStyle: { color: '#e2e8f0' } },
                { name: 'OTIF %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.otifPct?.toFixed?.(1)), itemStyle: { color: '#10b981' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="OTIF by Material Group" subtitle="Worst first">
            <Bars rows={(data?.byCategory ?? []).map((r: any) => ({ ...r, miss: 100 - (r.otifPct ?? 0) }))} label="name" value="miss" color="#f97316" height={340}
              format={(v) => `${Number(v).toFixed(1)}% missed`} />
          </ChartCard>
          <ChartCard title="Does the Portal Confirmation Predict the Delivery?" subtitle="OTIF for lines confirmed as requested vs confirmed late">
            <DataTable data={data?.confirmationAccuracy ?? []} columns={[
              { key: 'name', label: 'Confirmation' }, { key: 'lines', label: 'PO lines', format: formatNumber }, { key: 'otifPct', label: 'OTIF', format: formatPct },
            ]} />
          </ChartCard>
          <ChartCard title="Lowest-OTIF Suppliers" subtitle="25+ measured PO lines" className="lg:col-span-2">
            <DataTable data={data?.worstSuppliers ?? []} columns={[
              { key: 'name', label: 'Supplier' }, { key: 'country', label: 'Country' }, { key: 'lines', label: 'Lines', format: formatNumber },
              { key: 'otifPct', label: 'OTIF', format: formatPct }, { key: 'avgDaysLate', label: 'Avg days late', format: days }, { key: 'spend', label: 'Spend', format: formatDollar },
            ]} />
          </ChartCard>
          <ChartCard title="Largest Past-Due Open PO Lines" className="lg:col-span-2">
            <DataTable data={data?.pastDue ?? []} columns={[
              { key: 'poId', label: 'PO' }, { key: 'poItem', label: 'Item' }, { key: 'supplier', label: 'Supplier' }, { key: 'company', label: 'Company' },
              { key: 'deliveryDate', label: 'Requested', format: dt }, { key: 'expectedDeliveryDate', label: 'ASN expected', format: dt },
              { key: 'grQty', label: 'Received', format: formatNumber }, { key: 'quantity', label: 'Ordered', format: formatNumber }, { key: 'value', label: 'Open value', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
