import { AdvisoryFlow } from "@/components/AdvisoryFlow";
import { AppTabs } from "@/components/AppTabs";
import { DiagnoseFlow } from "@/components/DiagnoseFlow";
import { MarketFlow } from "@/components/MarketFlow";
import { knownCrops, regions } from "@/lib/data";

const ICONS = {
  // Sprouting seedling.
  advisory:
    "M12 22v-7c-4 0-7-2.5-7-6.5C5 5 8 3 12 3s7 2 7 5.5c0 4-3 6.5-7 6.5v7h-0Zm0-9c2.8 0 5-1.7 5-4.5S14.8 5 12 5 7 6.2 7 8.5 9.2 13 12 13Z",
  // Leaf with a magnifier.
  diagnose:
    "M4 4c8 0 12 3 12 9 0 1-.2 2-.5 2.8l3.2 3.2-1.4 1.4-3.2-3.2C13.3 17.7 12.2 18 11 18 5.6 18 4 12.7 4 4Zm2.3 2.3C6.7 12 8 16 11 16c.7 0 1.3-.1 1.9-.4C12.1 11 9.8 7.9 6.3 6.3Z",
  // Price tag.
  market:
    "M10.6 2H21a1 1 0 0 1 1 1v10.4a1 1 0 0 1-.3.7l-8 8a1 1 0 0 1-1.4 0L2.9 12.7a1 1 0 0 1 0-1.4l8-8a1 1 0 0 1 .7-.3Zm6.4 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
};

/**
 * Server component: reads the crop list from the mock dataset and hands it to the
 * client flow, so the JSON files stay on the server side of the boundary.
 */
export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable absolute left-4 top-4 z-10 rounded-lg bg-brand px-4 py-3 font-semibold text-white"
      >
        Skip to main content
      </a>

      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <p className="font-semibold text-brand-strong">AgriPilot</p>
          <h1 className="text-3xl font-bold">Help with your crop</h1>
          <p className="mt-1 text-muted">
            Ask whether to plant something, show us a sick plant, or get help selling
            what you have grown. We use the real weather forecast for your area and
            explain every answer in plain words.
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <AppTabs
          tabs={[
            {
              id: "advisory",
              label: "Should I plant?",
              iconPath: ICONS.advisory,
              panel: <AdvisoryFlow crops={knownCrops} />,
            },
            {
              id: "diagnose",
              label: "My plant looks sick",
              iconPath: ICONS.diagnose,
              panel: <DiagnoseFlow />,
            },
            {
              id: "market",
              label: "I want to sell",
              iconPath: ICONS.market,
              panel: <MarketFlow crops={knownCrops} regions={regions} />,
            },
          ]}
        />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-5 text-muted">
          Weather from Open-Meteo. Mandi prices and vendor listings are sample data
          for this demo. Nothing here places an order or takes a payment, and photos
          you send are not saved.
        </div>
      </footer>
    </>
  );
}
