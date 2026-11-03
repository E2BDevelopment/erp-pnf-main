import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Recorrido de compra | ERP PNF",
  description:
    "Sigue una requisición de obra desde la captura del material hasta la recepción y el pago.",
};

const purchaseSteps = [
  {
    title: "Captura del requerimiento",
    owner: "Residente o Auxiliar",
    detail: "La requisición registra el material que necesita la obra y queda ligada al proyecto que la originó.",
    icon: ClipboardCheck,
  },
  {
    title: "Revisión y visto bueno",
    owner: "Supervisor",
    detail: "El Supervisor revisa la solicitud desde la obra y deja el visto bueno antes de continuar.",
    icon: BadgeCheck,
  },
  {
    title: "Cotizaciones y comparativa",
    owner: "Administración",
    detail: "Administración solicita cotizaciones y compara las opciones para atender el requerimiento aprobado.",
    icon: FileSpreadsheet,
  },
  {
    title: "Orden de compra",
    owner: "Administración",
    detail: "La requisición aprobada se convierte en una orden de compra ligada a la obra.",
    icon: FileCheck2,
  },
  {
    title: "Recepción del material",
    owner: "Almacén de obra",
    detail: "Al llegar el material, se registra su recepción en el almacén correspondiente a la obra.",
    icon: Boxes,
  },
  {
    title: "Cuenta por pagar y pago",
    owner: "Tesorería",
    detail: "La compra continúa a cuentas por pagar y al trámite del pago desde Tesorería.",
    icon: Landmark,
  },
];

export default function RecorridoPage() {
  return (
    <main className="landing-page landing-tour min-h-screen bg-background">
      <header className="landing-tour-header">
        <div className="landing-container landing-tour-header-inner">
          <Link to="/" className="landing-brand" aria-label="ERP PNF, inicio">
            <Image
              src="/assets/img/icon-1.png"
              alt=""
              width={38}
              height={38}
              className="size-[38px] rounded-md object-contain"
            />
            <span>
              <strong>NARANJA FORTE</strong>
              <small>ERP para constructoras</small>
            </span>
          </Link>
          <Button asChild size="sm" className="landing-cta">
            <Link to="/onboarding">Crear cuenta</Link>
          </Button>
        </div>
      </header>

      <section className="landing-tour-intro">
        <div className="landing-container">
          <Link to="/" className="landing-tour-back">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a ERP PNF
          </Link>
          <h1>Una requisición, de la obra al pago.</h1>
          <p>
            Recorre cómo participan Campo, Supervisión, Administración y Tesorería en una compra
            para obra. Cada paso queda ligado al proyecto que la originó.
          </p>
          <p className="landing-tour-disclosure">
            Ejemplo ilustrativo: no es una sesión en vivo ni contiene datos de una empresa real. Los
            permisos configurados determinan quién participa en cada etapa.
          </p>
          <dl className="landing-tour-quickfacts">
            <div>
              <dt>Obra de origen</dt>
              <dd>La requisición y sus documentos quedan ligados al proyecto.</dd>
            </div>
            <div>
              <dt>Visto bueno</dt>
              <dd>El registro identifica quién autorizó la solicitud.</dd>
            </div>
            <div>
              <dt>Continuidad</dt>
              <dd>La compra sigue hasta almacén, cuentas por pagar y Tesorería.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="landing-tour-process" aria-labelledby="tour-process-title">
        <div className="landing-container">
          <div className="landing-tour-section-heading">
            <h2 id="tour-process-title">Del requerimiento a la recepción</h2>
            <p>La secuencia muestra el recorrido habitual de una compra de material.</p>
          </div>
          <ol className="landing-tour-steps" aria-label="Etapas ilustrativas de una compra de materiales">
            {purchaseSteps.map(({ title, owner, detail, icon: Icon }, index) => (
              <li key={title}>
                <span className="landing-tour-step-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="landing-tour-step-icon">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="landing-tour-owner">{owner}</p>
                  <h3>{title}</h3>
                  <p className="landing-tour-detail">{detail}</p>
                </div>
                {index < purchaseSteps.length - 1 && (
                  <ArrowRight className="landing-tour-arrow size-4" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
          <p className="landing-tour-footnote">
            El visto bueno del Supervisor queda ligado a la requisición y a la obra que la originó.
          </p>
        </div>
      </section>

      <section className="landing-tour-close">
        <div className="landing-container landing-tour-close-inner">
          <div>
            <h2>¿Quieres organizar tus obras con este proceso?</h2>
            <p>Registra tu empresa y crea la cuenta de Dirección en dos pasos.</p>
          </div>
          <Button asChild size="lg" className="landing-cta">
            <Link to="/onboarding">Crear cuenta de empresa</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
