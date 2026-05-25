export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="skeleton h-8 w-48 rounded" />
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton h-40 rounded-2xl" />
      ))}
    </div>
  );
}
