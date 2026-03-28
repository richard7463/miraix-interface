import { isTodaysOrdersVariant } from '@/lib/siteVariant'

export default function Head() {
  return (
    <>
      <meta name="base:app_id" content="69c7823af832953fc6c8fd15" />
      {isTodaysOrdersVariant && (
        <>
          <title>Today&apos;s Orders</title>
          <meta
            name="description"
            content="A standalone onchain command system that compresses wallet intelligence into one approved daily order, one forbidden order, and one receipt-backed debrief."
          />
        </>
      )}
    </>
  )
}
