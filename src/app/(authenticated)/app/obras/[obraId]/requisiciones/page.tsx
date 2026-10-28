"use client";

import { useParams } from "@/lib/navigation";
import { RequisicionesModule } from "@/components/requisiciones/RequisicionesModule";

function RequisicionesPage() {
  const { obraId } = useParams();
  return <RequisicionesModule obraId={obraId} />;
}

export default RequisicionesPage;
