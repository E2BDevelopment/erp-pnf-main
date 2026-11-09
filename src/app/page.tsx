import Image from "next/image";
import { Link } from "@/lib/navigation";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Boxes,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  HardHat,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingMotion from "@/components/landing-motion";

const purchaseFlow = [
  { label: "Requisición", owner: "Residente o Auxiliar", icon: ClipboardCheck },
  { label: "Visto bueno", owner: "Supervisor", icon: BadgeCheck },
  { label: "Cotizaciones", owner: "Administración", icon: FileSpreadsheet },
  { label: "Orden de compra", owner: "Administración", icon: FileCheck2 },
  { label: "Recepción", owner: "Almacén de obra", icon: Boxes },
  { label: "Pago", owner: "Tesorería", icon: Landmark },
];

const coreModules = [
  { icon: HardHat, title: "Obras y proyectos", detail: "Presupuesto, equipo y operación por obra." },
  { icon: Wallet, title: "Presupuestos y costos", detail: "Seguimiento por renglón, estimaciones y gastos." },
  { icon: Boxes, title: "Compras y almacén", detail: "De la requisición a la recepción de materiales." },
];

const supportingModules = [
  { icon: Users, title: "Personal y asignaciones", detail: "Roles, responsables y permisos configurables." },
  { icon: ReceiptText, title: "Nómina y trabajo por destajo", detail: "Pago por trabajo realizado, ligado al presupuesto y estimado cada semana." },
  { icon: ChartNoAxesCombined, title: "Tesorería y reportes", detail: "Pagos y resumen semanal de producción, ingresos y egresos por obra." },
];

function ProductPreview() {
  return (
    <div className="landing-preview" aria-label="Vista ilustrativa de módulos de ERP PNF">
      <div className="landing-preview-topbar">
        <div className="flex items-center gap-2">
          <span className="landing-preview-mark">P</span>
          <span className="text-sm font-semibold">Obra · Control operativo</span>
        </div>
        <span className="landing-preview-tag">Vista ilustrativa</span>
      </div>
      <div className="landing-preview-body">
        <aside className="landing-preview-nav" aria-hidden="true">
          <div className="landing-preview-nav-active"><HardHat className="size-4" /> Obra</div>
          <div><ClipboardCheck className="size-4" /> Requisiciones</div>
          <div><Wallet className="size-4" /> Caja chica</div>
          <div><ReceiptText className="size-4" /> Estimaciones</div>
        </aside>
        <div className="landing-preview-content">
          <div className="landing-preview-heading">
            <div><p className="landing-preview-label">CONTROL DE OBRA</p><h2>Semana de trabajo</h2></div>
            <span className="landing-preview-week">Ciclo semanal</span>
          </div>
          <div className="landing-preview-budget">
            <div className="flex items-center justify-between gap-3"><span>Presupuesto autorizado</span><span>Seguimiento por renglón</span></div>
            <div className="landing-preview-rule"><span /></div>
            <div className="landing-preview-budget-foot"><span>Estimaciones · Compras · Gastos</span><ArrowDownRight className="size-4" /></div>
          </div>
          <div className="landing-preview-section-title">EN SEGUIMIENTO</div>
          <div className="landing-preview-row">
            <span className="landing-preview-row-icon"><ClipboardCheck className="size-4" /></span>
            <span className="landing-preview-row-copy"><strong>Material para obra</strong><small>Requisición · Supervisor</small></span>
            <span className="landing-preview-status">Por autorizar</span>
          </div>
          <div className="landing-preview-row">
            <span className="landing-preview-row-icon"><ReceiptText className="size-4" /></span>
            <span className="landing-preview-row-copy"><strong>Cierre semanal</strong><small>Nómina · Almacén · Caja chica</small></span>
            <span className="landing-preview-status landing-preview-status-green">En revisión</span>
          </div>
          <div className="landing-preview-footer"><ShieldCheck className="size-4" /> Cada movimiento queda asociado a su obra y autorización.</div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <LandingMotion>
      <div className="min-h-screen bg-background landing-page">
        <header className="landing-header">
          <div className="landing-container landing-header-inner">
            <Link to="/" className="landing-brand">
              <Image src="/assets/img/icon-1.png" alt="" width={38} height={38} className="size-[38px] rounded-md object-contain" priority />
              <span><strong>NARANJA FORTE</strong><small>ERP para constructoras</small></span>
            </Link>
            <nav aria-label="Navegación principal" className="landing-nav">
              <a href="#plataforma" className="landing-nav-link">Plataforma</a>
              <Link to="/recorrido" className="landing-nav-link">Recorrido</Link>
              <a href="#beneficios" className="landing-nav-link">Beneficios</a>
              <a href="#cierre-semanal" className="landing-nav-link">Ciclo semanal</a>
            </nav>
            <div className="landing-header-actions">
              <Button asChild variant="ghost" size="sm" className="landing-login"><Link to="/login">Iniciar sesión</Link></Button>
              <Button asChild size="sm" className="landing-cta"><Link to="/onboarding">Crear cuenta <ArrowRight className="ml-1.5 size-4" /></Link></Button>
            </div>
            <details className="landing-mobile-menu">
              <summary aria-label="Abrir menú de navegación"><span /><span /><span /></summary>
              <nav aria-label="Navegación móvil">
                <a href="#plataforma">Plataforma</a><Link to="/recorrido">Recorrido</Link><a href="#beneficios">Beneficios</a><a href="#cierre-semanal">Ciclo semanal</a>
                <Link to="/onboarding">Crear cuenta <ArrowRight className="size-4" /></Link>
              </nav>
            </details>
          </div>
        </header>

        <main>
          <section className="landing-hero" id="plataforma">
            <div className="landing-blueprint" aria-hidden="true" />
            <svg className="landing-architecture" viewBox="0 0 720 520" fill="none" aria-hidden="true">
              <path d="M74 448V228L222 145V448M222 448V190L389 91V448M389 448V239L535 151V448M535 448V279L650 211V448M53 448H672M120 254H194M120 300H194M120 346H194M255 224H355M255 273H355M255 322H355M423 270H506M423 315H506M569 309H625M569 350H625M222 190L389 91M389 239L535 151M535 279L650 211" stroke="currentColor" strokeWidth="1.2" />
              <path d="M222 145V104H348M389 91V48H512M535 151V110H623M74 228L222 145" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 6" />
              <circle cx="389" cy="91" r="4" fill="var(--primary)" /><circle cx="535" cy="151" r="4" fill="var(--primary)" />
            </svg>
            <div className="landing-container landing-hero-grid">
              <div className="landing-hero-copy">
                <h1><span className="landing-hero-line"><span>Tu constructora.</span></span><span className="landing-hero-line"><span>Todos sus proyectos.</span></span><span className="landing-hero-line landing-hero-line-accent"><span>Un solo lugar.</span></span></h1>
                <p className="landing-hero-description">Administra obras, equipos, presupuestos y operaciones desde una plataforma diseñada para las necesidades de las constructoras mexicanas.</p>
                <div className="landing-hero-actions mt-7 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="landing-cta"><Link to="/onboarding">Crear cuenta de empresa <ArrowRight className="ml-2 size-4" /></Link></Button>
                  <Button asChild size="lg" variant="outline" className="landing-secondary-cta"><Link to="/recorrido">Ver recorrido de compra</Link></Button>
                </div>
                <p className="landing-registration-note">Registro en 2 pasos. El RFC identifica a la empresa y forma parte de sus datos de facturación; después creas la cuenta de Dirección.</p>
                <div className="landing-audience"><span>Ver por responsabilidad</span><div><a href="#direccion">Dirección</a><a href="#campo">Campo</a><a href="#administracion">Administración</a></div></div>
              </div>
              <div className="landing-hero-product"><span className="landing-float-label landing-float-one">OBRA <strong>POR PROYECTO</strong></span><span className="landing-float-label landing-float-two">VISTO BUENO <strong>POR RESPONSABLE</strong></span><ProductPreview /></div>
            </div>
            <div className="landing-container landing-principle"><span>Del frente de trabajo</span><span className="landing-principle-rule" /><span>al cierre semanal</span></div>
          </section>

          <section className="landing-problem" id="soluciones">
            <div className="landing-container landing-problem-grid">
              <div><h2>Una obra no debería administrarse entre hojas de cálculo, mensajes y documentos dispersos.</h2><p className="landing-problem-copy">Cuando la información está fragmentada, coordinar proyectos y tomar decisiones se vuelve más complicado.</p></div>
              <div className="landing-problem-list">
                <p><span>01</span> Información distribuida entre distintas herramientas</p><p><span>02</span> Seguimiento manual de proyectos y actividades</p><p><span>03</span> Responsabilidades y avances difíciles de consultar</p><p><span>04</span> Menos visibilidad sobre costos y recursos</p>
              </div>
            </div>
          </section>

          <section className="landing-flow-section" id="flujo">
            <div className="landing-container">
              <div className="landing-section-heading"><div><h2>Del requerimiento al pago, con control en cada paso.</h2></div><p>Sigue una requisición de material y mira quién participa en cada etapa.</p></div>
              <div className="landing-flow-example"><span>Ejemplo ilustrativo · Material para obra</span><span>Los permisos de cada empresa determinan quién participa.</span></div>
              <ol className="landing-flow" aria-label="Ejemplo ilustrativo del flujo de compra de obra"><li className="landing-flow-track" aria-hidden="true"><span className="landing-flow-progress" /></li>{purchaseFlow.map(({ label, owner, icon: Icon }, index) => <li key={label} className="landing-flow-step"><div className="landing-flow-icon"><Icon className="size-[18px]" /></div><span className="landing-flow-label">{label}</span><small>{owner}</small>{index < purchaseFlow.length - 1 && <ArrowRight className="landing-flow-arrow" aria-hidden="true" />}</li>)}</ol>
              <div className="landing-flow-note"><ShieldCheck className="size-[18px]" /><p>El visto bueno del Supervisor queda ligado a la requisición y a la obra que la originó.</p></div>
            </div>
          </section>

          <section className="landing-ecosystem">
            <div className="landing-container">
              <div className="landing-section-heading"><div><h2>Del presupuesto al material en obra.</h2></div><p>Los procesos principales siguen cada proyecto desde su presupuesto hasta la compra y recepción de materiales.</p></div>
              <div className="landing-ecosystem-grid">{coreModules.map(({ icon: Icon, title, detail }) => <article key={title} className="landing-ecosystem-item"><span className="landing-ecosystem-icon"><Icon className="size-5" aria-hidden="true" /></span><h3>{title}</h3><p>{detail}</p></article>)}</div>
              <div className="landing-supporting-modules"><h3>También incluye</h3><ul>{supportingModules.map(({ icon: Icon, title, detail }) => <li key={title}><Icon className="size-5" aria-hidden="true" /><div><h4>{title}</h4><p>{detail}</p></div></li>)}</ul></div>
            </div>
          </section>

          <section className="landing-operations" id="beneficios">
            <div className="landing-container landing-operations-grid">
              <div className="landing-operations-intro"><h2>Una obra, tres responsabilidades.</h2><p>Cada perfil participa desde su etapa, con las tareas y permisos que le corresponden.</p></div>
              <div className="landing-operation-list">
                <article id="direccion" tabIndex={-1} className="landing-operation-item"><span className="landing-operation-icon"><BriefcaseBusiness className="size-5" /></span><div><h3>Dirección · control de todas las obras</h3><p>Abre obras, asigna equipos y consulta la operación corporativa desde un mismo tablero.</p></div></article>
                <article id="campo" tabIndex={-1} className="landing-operation-item"><span className="landing-operation-icon"><Smartphone className="size-5" /></span><div><h3>Campo · captura y visto bueno en la obra</h3><p>Residente y Auxiliar registran la operación diaria. El Supervisor revisa y autoriza desde la obra.</p></div></article>
                <article id="administracion" tabIndex={-1} className="landing-operation-item"><span className="landing-operation-icon"><ShieldCheck className="size-5" /></span><div><h3>Administración · de compra a pago</h3><p>Compara cotizaciones, gestiona cuentas por pagar y tramita pagos desde Tesorería.</p></div></article>
              </div>
            </div>
          </section>

          <section className="landing-weekly" id="cierre-semanal">
            <div className="landing-container landing-weekly-grid"><div><h2>El ciclo semanal pone en contexto el trabajo de la obra.</h2><p>Nómina, cierre de almacén y reembolso de caja chica se registran por semana. El resumen semanal (condensado) compara producción, ingresos y egresos por obra y periodo.</p></div><div className="landing-weekly-drawing" role="img" aria-label="Ciclo semanal: nómina, almacén y caja chica se reúnen en un resumen por obra"><div className="landing-drawing-top"><span>CIERRE SEMANAL</span><span>POR OBRA</span></div><div className="landing-drawing-structure"><span className="landing-structure-node">NÓMINA</span><i /><span className="landing-structure-node">ALMACÉN</span><i /><span className="landing-structure-node">CAJA CHICA</span><i /><span className="landing-structure-node landing-structure-active">RESUMEN</span></div><div className="landing-drawing-bottom">PRODUCCIÓN · INGRESOS · EGRESOS</div></div></div>
          </section>

          <section className="landing-close" id="demo"><div className="landing-blueprint landing-blueprint-close" aria-hidden="true" /><div className="landing-container landing-close-inner"><div><h2>Registra tu empresa y prepara la primera obra.</h2><p>Al entrar al tablero corporativo, podrás abrir una obra y asignarle su equipo.</p></div><Button asChild size="lg" className="landing-cta"><Link to="/onboarding">Crear cuenta de empresa <ArrowRight className="ml-2 size-4" /></Link></Button></div></section>
        </main>

        <footer className="landing-footer"><div className="landing-container landing-footer-inner"><Link to="/" className="landing-brand"><Image src="/assets/img/icon-1.png" alt="" width={30} height={30} className="size-[30px] rounded object-contain" /><span><strong>NARANJA FORTE</strong><small>ERP para constructoras</small></span></Link><span>Software de gestión para constructoras mexicanas.</span><div><Link to="/login">Iniciar sesión</Link><Link to="/onboarding">Crear cuenta</Link></div><span>© {new Date().getFullYear()} ERP PNF</span></div></footer>
      </div>
    </LandingMotion>
  );
}
