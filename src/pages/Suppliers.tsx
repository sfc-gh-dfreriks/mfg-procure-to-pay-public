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

const RISK_COLORS: Record<string, string> = { CRITICAL: '#7f1d1d', HIGH: '#dc2626', MEDIUM: '#f59e0b', LOW: '#10b981', UNKNOWN: '#94a3b8' };

export default function Suppliers() {
  const { deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('suppliers', [], []), deps);
  const k = data?.kpis ?? {};
  const levels = data?.riskLevels ?? [];
  const sc = data?.scatter ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <p className="text-xs text-gray-500">Supplier 360 covers the whole supplier base; the company and category filters do not apply on this page.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Suppliers" value={formatNumber(k.suppliers)} icon={Users} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatNumber(k.multiRecord)} keyed in both SAP instances`} deltaType="neutral" />
          <MetricCard title="High-Risk Spend" value={formatDollar(k.highRiskSpend)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatPct(100 * (k.highRiskSpend ?? 0) / (k.spend || 1))} of spend`} deltaType="negative" />
          <MetricCard title="Sanctions Hits" value={formatNumber(k.sanctioned)} icon={Receipt} accent="border-red-300/50 bg-gradient-to-br from-red-50 to-rose-50" delta={`${formatDollar(k.sanctionedSpend)} spend with flagged suppliers`} deltaType="negative" />
          <MetricCard title="Spend Without a Risk Score" value={formatDollar(k.unscoredSpend)} icon={PieChart} accent="border-slate-300/50 bg-gradient-to-br from-slate-50 to-gray-50" delta="Suppliers the risk provider could not match" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Spend by Risk Level" subtitle="USD">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => formatDollar(v) }, grid: { left: 90, right: 30, bottom: 20, top: 10 },
              xAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, yAxis: { type: 'category', inverse: true, data: levels.map((r: any) => r.name) },
              series: [{ type: 'bar', data: levels.map((r: any) => ({ value: r.spend, itemStyle: { color: RISK_COLORS[r.name] } })), barMaxWidth: 26 }],
            }} style={{ height: 280 }} />
          </ChartCard>
          <ChartCard title="Spend vs Financial Stress" subtitle="Top 200 suppliers; lower score = more likely to fail">
            <ReactECharts keepOrder option={{
              tooltip: { formatter: (p: any) => `${p.data[3]}<br/>Spend ${formatDollar(p.data[0])}<br/>Stress score ${p.data[1]}` },
              grid: { left: 60, right: 20, bottom: 40, top: 20 },
              xAxis: { type: 'log', name: 'spend (USD)', nameLocation: 'middle', nameGap: 25, axisLabel: { formatter: (v: number) => formatDollar(v) } },
              yAxis: { type: 'value', name: 'stress score', min: 0, max: 100 },
              series: Object.keys(RISK_COLORS).map((lvl) => ({ name: lvl, type: 'scatter', symbolSize: 9, itemStyle: { color: RISK_COLORS[lvl] },
                data: sc.filter((s: any) => s.risk === lvl).map((s: any) => [s.spend, s.fss, s.otifPct, s.name]) })),
            }} style={{ height: 280 }} />
          </ChartCard>
          <ChartCard title="Risk Watchlist" subtitle="High and critical suppliers, largest spend first" className="lg:col-span-2">
            <DataTable data={data?.watchlist ?? []} columns={[
              { key: 'name', label: 'Supplier' }, { key: 'country', label: 'Country' }, { key: 'riskLevel', label: 'Risk' },
              { key: 'fss', label: 'Stress score', format: formatNumber }, { key: 'esg', label: 'ESG', format: formatNumber },
              { key: 'sanctionsHit', label: 'Sanctions', format: (v) => (v ? 'Hit' : '–') }, { key: 'spend', label: 'Spend', format: formatDollar },
              { key: 'otifPct', label: 'OTIF', format: formatPct }, { key: 'paidOnTimePct', label: 'Paid on time', format: formatPct },
            ]} />
          </ChartCard>
          <ChartCard title="Largest Suppliers" subtitle="One golden supplier across both SAP instances" className="lg:col-span-2">
            <DataTable data={data?.top ?? []} columns={[
              { key: 'name', label: 'Supplier' }, { key: 'country', label: 'Country' }, { key: 'spend', label: 'Spend', format: formatDollar },
              { key: 'onContractPct', label: 'On contract', format: formatPct }, { key: 'otifPct', label: 'OTIF', format: formatPct },
              { key: 'firstPassPct', label: 'First-pass match', format: formatPct }, { key: 'paidOnTimePct', label: 'Paid on time', format: formatPct },
              { key: 'riskLevel', label: 'Risk' }, { key: 'vendorIds', label: 'ERP vendor numbers' },
            ]} />
          </ChartCard>
          <ChartCard title="Spend and Risk by Supplier Country">
            <DataTable data={data?.byCountry ?? []} columns={[
              { key: 'name', label: 'Country' }, { key: 'suppliers', label: 'Suppliers', format: formatNumber }, { key: 'spend', label: 'Spend', format: formatDollar },
              { key: 'highRiskSpend', label: 'High-risk spend', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
