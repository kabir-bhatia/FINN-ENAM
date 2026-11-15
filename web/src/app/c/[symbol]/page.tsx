import { Suspense } from "react";
import CompanyView from "@/components/CompanyView";

// Works for any NSE ticker: unknown symbols are fetched live on first open, then cached.
async function Company({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <CompanyView symbol={decodeURIComponent(symbol).toUpperCase()} />;
}

export default function Page({ params }: PageProps<"/c/[symbol]">) {
  return (
    <Suspense fallback={null}>
      <Company params={params} />
    </Suspense>
  );
}
