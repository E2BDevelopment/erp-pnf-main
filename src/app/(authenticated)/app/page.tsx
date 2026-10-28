import { redirect } from "next/navigation";

/**
 * `/app` es la entrada al sistema y manda al Dashboard: la vista que agrega
 * todas las obras del usuario. Antes mandaba a Obras porque no existía panel;
 * el catálogo de obras sigue a un clic, en la navegación y en la cartera.
 */
export default function AppIndexPage() {
  redirect("/app/dashboard");
}
