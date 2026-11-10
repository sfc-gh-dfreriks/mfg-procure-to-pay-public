import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatPct } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Calendar, Gauge, Activity, Receipt, TrendingDown, FileText, PieChart } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const days = (v: number | null | undefined) => (v == null ? '–' : `${Number(v).toFixed(1)} d`);

export default function Overview() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('overview', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const st = data?.stages ?? {};
  const trend = data?.trend ?? [];
  const dpo = data?.dpoTrend ?? [];
  const stages = [
    { name: 'Requisition approval', v: st.approval }, { name: 'Approval to PO', v: st.approvedToPo },
    { name: 'PO to receipt', v: st.poToReceipt }, { name: 'Invoice receipt to posting', v: st.receiptToPost },
    { name: 'Posting to payment', v: st.postToPay },
  ];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="PO Spend (USD)" value={formatDollar(k.spend)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatPct(k.onContractPct)} on contract`} deltaType={k.onContractPct >= 70 ? 'positive' : 'neutral'} />
          <MetricCard title="Maverick Spend" value={formatDollar(k.maverick)} icon={PieChart} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatPct(k.maverickPct)} of spend bought off an available contract`} deltaType="negative" />
          <MetricCard title="Supplier OTIF" value={formatPct(k.otifPct)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta="Received in full by the requested date" deltaType={k.otifPct >= 90 ? 'positive' : 'negative'} />
          <MetricCard title="Touchless Invoices" value={formatPct(k.touchlessPct)} icon={FileText} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`${formatPct(k.firstPassPct)} first-pass match · ${formatPct(k.exceptionPct)} exceptions`} deltaType="neutral" />
          <MetricCard title="Paid On Time" value={formatPct(k.onTimePayPct)} icon={Calendar} accent="border-sky-300/50 bg-gradient-to-br from-sky-50 to-blue-50" delta={`PO to payment ${days(k.poToPayDays)}`} deltaType={k.onTimePayPct >= 90 ? 'positive' : 'negative'} />
          <MetricCard title="DPO (Aug 2026)" value={days(k.dpo)} icon={Activity} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta={`${formatDollar(k.openAp)} open AP · ${formatDollar(k.overdueAp)} overdue`} deltaType="neutral" />
          <MetricCard title="Discounts Lost" value={formatDollar(k.discountLost)} icon={TrendingDown} accent="border-orange-300/50 bg-gradient-to-br from-orange-50 to-amber-50" delta={`${formatDollar(k.discountCaptured)} captured`} deltaType="negative" />
          <MetricCard title="Duplicates Stopped" value={formatDollar(k.duplicatesPrevented)} icon={Receipt} accent="border-teal-300/50 bg-gradient-to-br from-teal-50 to-cyan-50" delta={`${formatDollar(k.duplicatePaid)} slipped into SAP · ${formatDollar(k.highRiskSpend)} high-risk spend`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Where the Cycle Time Goes" subtitle="Average days per procure-to-pay stage">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, grid: { left: 160, right: 40, bottom: 20, top: 10 },
              xAxis: { type: 'value', name: 'days' }, yAxis: { type: 'category', inverse: true, data: stages.map((s) => s.name) },
              series: [{ type: 'bar', data: stages.map((s) => Number((s.v ?? 0).toFixed(1))), itemStyle: { color: '#29b5e8', borderRadius: [0, 4, 4, 0] },
                         label: { show: true, position: 'right', formatter: '{c} d' }, barMaxWidth: 22 }],
            }} style={{ height: 280 }} />
          </ChartCard>
          <ChartCard title="Spend by Company" subtitle="PO spend, USD">
            <Bars rows={data?.byCompany ?? []} label="name" value="spend" color="#8b5cf6" height={280} leftPad={200} />
          </ChartCard>
          <ChartCard title="Spend, Contract Compliance, Touchless and On-Time Payment by Month" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((d: any) => d.month) },
              yAxis: [{ type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, { type: 'value', name: '%', min: 0, max: 100 }],
              series: [
                { name: 'Spend', type: 'bar', data: trend.map((d: any) => d.spend), itemStyle: { color: '#c7d2fe' } },
                { name: 'On contract %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((d: any) => d.onContractPct?.toFixed?.(1)), itemStyle: { color: '#29b5e8' } },
                { name: 'Touchless %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((d: any) => d.touchlessPct?.toFixed?.(1)), itemStyle: { color: '#8b5cf6' } },
                { name: 'Paid on time %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((d: any) => d.onTimePayPct?.toFixed?.(1)), itemStyle: { color: '#10b981' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Days Payable Outstanding" subtitle="Month-end open AP over trailing 90-day invoices">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, grid: { left: 50, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: dpo.map((d: any) => d.month) }, yAxis: { type: 'value', name: 'days' },
              series: [{ name: 'DPO', type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, data: dpo.map((d: any) => d.dpo?.toFixed?.(1)), itemStyle: { color: '#f59e0b' } }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Spend by Source System" subtitle="One canonical model across the selected SAP sources">
            <Bars rows={data?.bySource ?? []} label="name" value="spend" color="#29b5e8" height={300} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
