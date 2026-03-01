import { createClient } from "@supabase/supabase-js";
import GroupDetail from "@/components/group/GroupDetail";

export async function generateStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data } = await supabase.from("chaebols").select("id");

  return (data ?? []).map((row: { id: string }) => ({ id: row.id }));
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupDetail id={id} />;
}
