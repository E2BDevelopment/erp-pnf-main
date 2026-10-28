import { redirect } from "next/navigation";
import { AdminModuleView } from "./AdminModuleView";

export default async function AdminModulePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  if (slug?.[0] === "catalogos") {
    redirect("/app/catalogos");
  }
  return <AdminModuleView />;
}
