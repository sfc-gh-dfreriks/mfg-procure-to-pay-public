# Procure to Pay — public demo

A static, no-login build of the **Procure to Pay** app (manufacturing use case 10 in
[`mfg-use-cases`](https://github.com/sfc-gh-dfreriks/mfg-use-cases)), deployed to GitHub Pages:

**https://sfc-gh-dfreriks.github.io/mfg-procure-to-pay-public/**

The app tracks the full procure-to-pay cycle: requisition and guided buying, sourcing events, contracts, purchase orders,
supplier confirmations and ASNs, goods receipt, invoice capture and 3-way match, AP open items and payment runs. It reads
two SAP instances, each as SAP ECC, S/4HANA, BW/4HANA or SAP BDC, together with a procurement suite (Ariba / Coupa style),
a supplier portal, an AP automation platform (OCR, exceptions), bank payment files (pain.001 / camt.053) and a supplier risk
provider (D&B / EcoVadis style). The data flows through dbt staging adapters, a canonical silver layer and gold marts on
Snowflake, then to a semantic view, a Cortex Agent and this React app. All data is synthetic.

**Pages:** Ask Cortex · Executive Dashboard · Requisitions & Sourcing · POs & Contract Compliance · Supplier Delivery ·
Invoices & 3-Way Match · Exceptions & Holds · Payables & DPO · Payments & Discounts · Supplier 360 & Risk ·
Data Sources · Field Mapping · SAP Metadata · Sources & Lineage (dbt) · Pipeline in 3D

## How the public build works

- **Snapshot:** built with `VITE_STATIC=1`, the client reads pre-baked JSON in `public/data/` instead of a live `/api`.
  There is no Snowflake connection and no credentials are required. Source selection in the snapshot: SAP A = ECC,
  SAP B = S/4HANA, all non-SAP sources on.
- **Filters:** every company subset with all categories is baked, and so are all companies or one company with each
  single category. Other combinations fall back to the nearest baked view.
- **Ask Cortex:** answers are pre-generated for each page's default analysis and every suggested question. Free-text
  questions need the full deployment.
- **Data Sources:** browse each source type and preview its native tables. Apply (which runs dbt in Snowflake) is disabled.

## Full deployment

For live queries, source switching and free-text Ask Cortex, deploy from the source repo:
```bash
git clone https://github.com/sfc-gh-dfreriks/mfg-use-cases
cd mfg-use-cases/use_cases/10_procure_to_pay
npm run dev  # from app/
```
See [use_cases/10_procure_to_pay/README.md](https://github.com/sfc-gh-dfreriks/mfg-use-cases/blob/main/use_cases/10_procure_to_pay/README.md) for full setup instructions.
