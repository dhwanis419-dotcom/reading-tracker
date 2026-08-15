import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="catalog-card p-10 text-center max-w-md mx-auto mt-12">
      <h2 className="font-display italic text-2xl text-spine mb-2">Not on the shelf</h2>
      <p className="text-inkfaint mb-4">There's nothing catalogued at this address.</p>
      <Link href="/tbr" className="catalog-tab bg-spine text-card px-4 py-2 rounded-sm hover:bg-spinedark inline-block">
        Back to your shelf
      </Link>
    </div>
  );
}
