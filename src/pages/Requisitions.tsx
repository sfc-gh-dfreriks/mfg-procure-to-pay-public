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

export default function Requisitions() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('requisitions', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const s = data?.sourcing ?? {};
  const trend = data?.trend ?? [];
  const ch = data?.byChannel ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Requisition Lines" value={formatNumber(k.lines)} icon={FileText} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatPct(k.rejectedPct)} rejected`} deltaType="neutral" />
          <MetricCard title="Approval Time" value={days(k.approvalDays)} icon={Calendar} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta={`Requisition to PO ${days(k.reqToPoDays)}`} deltaType="neutral" />
          <MetricCard title="Waiting for Approval or PO" value={formatDollar(k.openValue)} icon={Activity} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`${formatNumber(k.openLines)} open lines`} deltaType="neutral" />
          <MetricCard title="Negotiated Savings" value={formatDollar(s.savings)} icon={TrendingDown} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${formatPct(s.savingsPct)} of baseline · ${formatNumber(s.events)} events · ${days(s.cycleDays)} cycle`} deltaType="positive" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Cycle Time by Buying Channel" subtitle="MRP comes from SAP; catalog, free text and sourcing requests from the procurement suite">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0 }, grid: { left: 110, right: 30, bottom: 20, top: 40 },
              xAxis: { type: 'value', name: 'days' }, yAxis: { type: 'category', data: ch.map((r: any) => r.name) },
              series: [
                { name: 'Approval', type: 'bar', data: ch.map((r: any) => r.approvalDays?.toFixed?.(1)), itemStyle: { color: '#f59e0b' } },
                { name: 'Requisition to PO', type: 'bar', data: ch.map((r: any) => r.reqToPoDays?.toFixed?.(1)), itemStyle: { color: '#29b5e8' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Open Requisitions by Age" subtitle="Estimated value, USD">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', valueFormatter: (v: number) => formatDollar(v) }, grid: { left: 70, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: (data?.openAging ?? []).map((r: any) => r.name) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ type: 'bar', data: (data?.openAging ?? []).map((r: any) => r.value), itemStyle: { color: '#8b5cf6' }, barMaxWidth: 50 }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Requisitions and Approval Time by Month" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 60, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) }, yAxis: [{ type: 'value', name: 'lines' }, { type: 'value', name: 'days' }],
              series: [
                { name: 'Requisition lines', type: 'bar', data: trend.map((r: any) => r.lines), itemStyle: { color: '#c7d2fe' } },
                { name: 'Approval days', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.approvalDays?.toFixed?.(1)), itemStyle: { color: '#f59e0b' } },
                { name: 'Requisition to PO days', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.reqToPoDays?.toFixed?.(1)), itemStyle: { color: '#29b5e8' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Sourcing Savings by Material Group" subtitle="Baseline less awarded spend, USD">
            <Bars rows={data?.savingsByCategory ?? []} label="name" value="savings" color="#10b981" height={320} />
          </ChartCard>
          <ChartCard title="Recent Sourcing Events">
            <DataTable data={data?.events ?? []} columns={[
              { key: 'eventId', label: 'Event' }, { key: 'eventType', label: 'Type' }, { key: 'category', label: 'Material group' },
              { key: 'status', label: 'Status' }, { key: 'bidders', label: 'Bidders', format: formatNumber },
              { key: 'savings', label: 'Savings', format: formatDollar }, { key: 'supplier', label: 'Awarded to' },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
