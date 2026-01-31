import Link from "next/link";

export default function FeesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Fees Overview</h1>
      <p className="mb-4">A simple fees overview will appear here. For now you can view individual student fees from the Students page.</p>
      <Link href="/list/students" className="px-3 py-2 bg-lamaYellow rounded">Go to Students</Link>
    </div>
  );
}
