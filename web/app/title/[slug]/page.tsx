import { notFound } from "next/navigation";

interface TitlePageProps {
  params: { slug: string };
}

export default function TitlePage({ params }: TitlePageProps) {
  const { slug } = params;
  if (!slug) notFound();

  return (
    <main className="vp-content">
      <h1>Title: {slug}</h1>
      <p>Detail page for the selected title.</p>
    </main>
  );
}
