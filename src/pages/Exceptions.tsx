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

const LABEL: Record<string, string> = { PRICE: 'Price variance', QTY: 'Quantity > received', NO_GR: 'Before goods receipt', NO_PO: 'No PO', TAX: 'Tax / header', DUPLICATE: 'Duplicate' };

export default function Exceptions() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('exceptions', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const dp = data?.duplicatesPaid ?? {};
  const bt = (data?.byType ?? []).map((r: any) => ({ ...r, label: LABEL[r.name] ?? r.name }));
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Exception Rate" value={formatPct(k.exceptionPct)} icon={Activity} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta={`${formatNumber(k.captured)} invoices received`} deltaType="negative" />
          <MetricCard title="Open Exceptions" value={formatNumber(k.openExceptions)} icon={Receipt} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatDollar(k.openValue)} waiting to post`} deltaType="negative" />
          <MetricCard title="Days to Resolve" value={days(k.daysToResolve)} icon={Calendar} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Average, resolved exceptions" deltaType="neutral" />
          <MetricCard title="Duplicates Stopped" value={formatDollar(k.duplicatesPreventedValue)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${formatNumber(k.duplicatesPrevented)} rejected · ${formatDollar(dp.value)} slipped into SAP (${formatNumber(dp.n)})`} deltaType="positive" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Exceptions by Type" subtitle="Invoices raising each exception">
            <Bars rows={bt} label="label" value="invoices" color="#f59e0b" height={300} format={formatNumber} />
          </ChartCard>
          <ChartCard title="Days to Resolve and Variance by Type">
            <DataTable data={bt} columns={[
              { key: 'label', label: 'Exception' }, { key: 'invoices', label: 'Invoices', format: formatNumber },
              { key: 'avgDays', label: 'Avg days open', format: days }, { key: 'variance', label: 'Billed above PO', format: formatDollar },
            ]} />
          </ChartCard>
          <ChartCard title="How Exceptions Were Resolved">
            <Bars rows={data?.resolution ?? []} label="name" value="invoices" color="#8b5cf6" height={260} format={formatNumber} />
          </ChartCard>
          <ChartCard title="Suppliers with the Highest Exception Rate" subtitle="30+ invoices">
            <DataTable data={data?.bySupplier ?? []} columns={[
              { key: 'name', label: 'Supplier' }, { key: 'invoices', label: 'Invoices', format: formatNumber },
              { key: 'exceptionPct', label: 'Exception rate', format: formatPct }, { key: 'variance', label: 'Billed above PO', format: formatDollar },
            ]} />
          </ChartCard>
          <ChartCard title="Open Exceptions" subtitle="Largest first" className="lg:col-span-2">
            <DataTable data={data?.open ?? []} columns={[
              { key: 'captureId', label: 'Capture' }, { key: 'supplier', label: 'Supplier' }, { key: 'company', label: 'Company' }, { key: 'ref', label: 'Invoice no.' },
              { key: 'receivedDate', label: 'Received', format: dt }, { key: 'exceptionTypes', label: 'Exceptions' }, { key: 'exceptionDays', label: 'Days open', format: formatNumber },
              { key: 'value', label: 'Value', format: formatDollar },
            ]} />
          </ChartCard>
          <ChartCard title="Duplicates that Reached SAP" subtitle="Same supplier, amount and invoice number once punctuation and leading zeros are removed: recovery candidates" className="lg:col-span-2">
            <DataTable data={data?.duplicates ?? []} columns={[
              { key: 'invoiceId', label: 'Invoice' }, { key: 'duplicateOf', label: 'Duplicate of' }, { key: 'supplier', label: 'Supplier' }, { key: 'company', label: 'Company' },
              { key: 'ref', label: 'Supplier ref' }, { key: 'postingDate', label: 'Posted', format: dt }, { key: 'value', label: 'Amount', format: formatDollar },
              { key: 'isPaid', label: 'Paid', format: (v) => (v ? 'Yes' : 'No') },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
