import { notFound } from "next/navigation";

interface WatchPageProps {
  params: { slug: string };
}

export default function WatchPage({ params }: WatchPageProps) {
  const { slug } = params;
  if (!slug) notFound();

  return (
    <main className="vp-content">
      <h1>Watch: {slug}</h1>
      <p>Player page for the selected title or episode.</p>
    </main>
  );
}
