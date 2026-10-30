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
  { label: "Requisición", icon: ClipboardCheck },
  { label: "Visto bueno", icon: BadgeCheck },
  { label: "Cotizaciones", icon: FileSpreadsheet },
  { label: "Orden de compra", icon: FileCheck2 },
  { label: "Recepción", icon: Boxes },
  { label: "Pago", icon: Landmark },
];

const modules = [
  { icon: HardHat, title: "Obras y proyectos", detail: "Presupuesto, equipo y operación por obra." },
  { icon: Users, title: "Personal y asignaciones", detail: "Roles, responsables y permisos configurables." },
  { icon: Wallet, title: "Presupuestos y costos", detail: "Seguimiento por renglón, estimaciones y gastos." },
  { icon: Boxes, title: "Compras y almacén", detail: "De la requisición a la recepción de materiales." },
  { icon: ReceiptText, title: "Nómina y destajos", detail: "Captura y seguimiento con ciclo semanal." },
  { icon: ChartNoAxesCombined, title: "Tesorería y reportes", detail: "Pagos y condensado semanal de la operación." },
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
            <Link to="/" aria-label="ERP PNF, inicio" className="landing-brand">
              <Image src="/assets/img/icon-1.png" alt="" width={38} height={38} className="size-[38px] rounded-md object-contain" priority />
              <span><strong>NARANJA FORTE</strong><small>ERP para constructoras</small></span>
            </Link>
            <nav aria-label="Navegación principal" className="landing-nav">
              <a href="#plataforma" className="landing-nav-link">Plataforma</a>
              <a href="#soluciones" className="landing-nav-link">Soluciones</a>
              <a href="#beneficios" className="landing-nav-link">Beneficios</a>
              <a href="#nosotros" className="landing-nav-link">Nosotros</a>
            </nav>
            <div className="landing-header-actions">
              <Button asChild variant="ghost" size="sm" className="landing-login"><Link to="/login">Iniciar sesión</Link></Button>
              <Button asChild size="sm" className="landing-cta"><Link to="/onboarding">Crear cuenta <ArrowRight className="ml-1.5 size-4" /></Link></Button>
            </div>
            <details className="landing-mobile-menu">
              <summary aria-label="Abrir menú de navegación"><span /><span /><span /></summary>
              <nav aria-label="Navegación móvil">
                <a href="#plataforma">Plataforma</a><a href="#soluciones">Soluciones</a><a href="#beneficios">Beneficios</a><a href="#nosotros">Nosotros</a>
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
              <circle cx="389" cy="91" r="4" fill="#F36B21" /><circle cx="535" cy="151" r="4" fill="#F36B21" />
            </svg>
            <div className="landing-container landing-hero-grid">
              <div className="landing-hero-copy">
                <p className="landing-eyebrow"><span /> CONSTRUCTION MANAGEMENT SOFTWARE</p>
                <h1><span className="landing-hero-line"><span>Tu constructora.</span></span><span className="landing-hero-line"><span>Todos sus proyectos.</span></span><span className="landing-hero-line landing-hero-line-accent"><span>Un solo lugar.</span></span></h1>
                <p className="landing-hero-description">Administra obras, equipos, presupuestos y operaciones desde una plataforma diseñada para las necesidades de las constructoras mexicanas.</p>
                <div className="landing-hero-actions mt-7 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="landing-cta"><Link to="/onboarding">Crear cuenta de empresa <ArrowRight className="ml-2 size-4" /></Link></Button>
                  <Button asChild size="lg" variant="outline" className="landing-secondary-cta"><a href="#soluciones">Explorar plataforma</a></Button>
                </div>
                <div className="landing-audience"><span>UNA OPERACIÓN, CADA RESPONSABILIDAD CLARA</span><div><span>Dirección</span><span>Campo</span><span>Administración</span></div></div>
              </div>
              <div className="landing-hero-product"><span className="landing-float-label landing-float-one">OBRA <strong>POR PROYECTO</strong></span><span className="landing-float-label landing-float-two">VISTO BUENO <strong>POR RESPONSABLE</strong></span><ProductPreview /></div>
            </div>
            <div className="landing-container landing-principle"><span>Del frente de trabajo</span><span className="landing-principle-rule" /><span>al cierre semanal</span></div>
          </section>

          <section className="landing-problem" id="soluciones">
            <div className="landing-container landing-problem-grid">
              <div><p className="landing-kicker"><span /> LA REALIDAD DE LA OBRA</p><h2>Una obra no debería administrarse entre hojas de cálculo, mensajes y documentos dispersos.</h2><p className="landing-problem-copy">Cuando la información está fragmentada, coordinar proyectos y tomar decisiones se vuelve más complicado.</p></div>
              <div className="landing-problem-list">
                <p><span>01</span> Información distribuida entre distintas herramientas</p><p><span>02</span> Seguimiento manual de proyectos y actividades</p><p><span>03</span> Responsabilidades y avances difíciles de consultar</p><p><span>04</span> Menos visibilidad sobre costos y recursos</p>
              </div>
            </div>
          </section>

          <section className="landing-flow-section" id="flujo">
            <div className="landing-container">
              <div className="landing-section-heading"><div><p className="landing-kicker"><span /> UNA OPERACIÓN CONECTADA</p><h2>Del requerimiento al pago, con control en cada paso.</h2></div><p>La operación conserva su contexto desde la solicitud en obra hasta la cuenta por pagar y el pago en tesorería.</p></div>
              <ol className="landing-flow" aria-label="Flujo de compra de obra"><li className="landing-flow-track" aria-hidden="true"><span className="landing-flow-progress" /></li>{purchaseFlow.map(({ label, icon: Icon }, index) => <li key={label} className="landing-flow-step"><div className="landing-flow-icon"><Icon className="size-[18px]" /></div><span>{label}</span>{index < purchaseFlow.length - 1 && <ArrowRight className="landing-flow-arrow" aria-hidden="true" />}</li>)}</ol>
              <div className="landing-flow-note"><ShieldCheck className="size-[18px]" /><p>El visto bueno queda ligado a la operación, junto con el responsable y la obra que la originó.</p></div>
            </div>
          </section>

          <section className="landing-ecosystem">
            <div className="landing-container">
              <div className="landing-section-heading"><div><p className="landing-kicker"><span /> HERRAMIENTAS PARA LA OBRA</p><h2>Las herramientas que tu constructora necesita para avanzar.</h2></div><p>Una plataforma que reúne procesos diarios de campo y oficina, organizados alrededor de cada obra.</p></div>
              <div className="landing-ecosystem-grid">{modules.map(({ icon: Icon, title, detail }, index) => <article key={title} className={`landing-ecosystem-item landing-ecosystem-item-${index + 1}`}><span className="landing-ecosystem-icon"><Icon className="size-5" /></span><h3>{title}</h3><p>{detail}</p>{index === 0 && <span className="landing-ecosystem-index">01 / 06</span>}</article>)}</div>
            </div>
          </section>

          <section className="landing-operations" id="beneficios">
            <div className="landing-container landing-operations-grid">
              <div className="landing-operations-intro"><p className="landing-kicker"><span /> TRABAJO EN CAMPO Y OFICINA</p><h2>El trabajo cambia según el rol. La información sigue conectada.</h2><p>Una misma obra reúne al equipo de campo, al Supervisor, a Administración y a Dirección, cada quien con sus permisos.</p></div>
              <div className="landing-operation-list">
                <article className="landing-operation-item"><span className="landing-operation-icon"><BriefcaseBusiness className="size-5" /></span><div><h3>Varias obras, una misma operación</h3><p>Cada obra conserva su presupuesto, equipo, cliente y contrato. Consulta la operación por proyecto.</p></div></article>
                <article className="landing-operation-item"><span className="landing-operation-icon"><ShieldCheck className="size-5" /></span><div><h3>Responsables y autorizaciones por rol</h3><p>Dirección, Residente, Auxiliar, Supervisor y Administración trabajan con permisos y responsabilidades claras.</p></div></article>
                <article className="landing-operation-item"><span className="landing-operation-icon"><Smartphone className="size-5" /></span><div><h3>Captura en obra, seguimiento en oficina</h3><p>El equipo de campo registra desde el celular. Oficina y Dirección revisan la operación desde escritorio.</p></div></article>
              </div>
            </div>
          </section>

          <section className="landing-mexico" id="nosotros">
            <div className="landing-container landing-mexico-grid"><div><p className="landing-kicker"><span /> CONSTRUIDO ALREDEDOR DE LA OBRA</p><h2>Tecnología pensada para la realidad de las constructoras mexicanas.</h2><p>Una plataforma en español que sigue el orden de trabajo de una constructora: presupuesto por renglón, requisiciones, visto bueno, compras, recepción y pago.</p><a href="#flujo" className="landing-text-link">Ver el flujo de trabajo <ArrowRight className="size-4" /></a></div><div className="landing-mexico-drawing" aria-label="Diagrama de procesos de obra"><div className="landing-drawing-top"><span>BITÁCORA DE OPERACIÓN</span><span>ERP PNF / 001</span></div><div className="landing-drawing-structure"><span className="landing-structure-node">OBRA</span><i /><span className="landing-structure-node">PRESUPUESTO</span><i /><span className="landing-structure-node landing-structure-active">OPERACIÓN</span><i /><span className="landing-structure-node">CIERRE</span></div><div className="landing-drawing-bottom">PRESUPUESTO → REQUISICIÓN → AUTORIZACIÓN → PAGO</div></div></div>
          </section>

          <section className="landing-close" id="demo"><div className="landing-blueprint landing-blueprint-close" aria-hidden="true" /><div className="landing-container landing-close-inner"><div><p className="landing-kicker"><span /> BUILD BEYOND</p><h2>Es momento de construir una operación más organizada.</h2><p>Conoce la plataforma y organiza el equipo, los permisos y la primera obra de tu empresa.</p></div><Button asChild size="lg" className="landing-cta"><Link to="/onboarding">Crear cuenta de empresa <ArrowRight className="ml-2 size-4" /></Link></Button></div></section>
        </main>

        <footer className="landing-footer"><div className="landing-container landing-footer-inner"><Link to="/" className="landing-brand"><Image src="/assets/img/icon-1.png" alt="" width={30} height={30} className="size-[30px] rounded object-contain" /><span><strong>NARANJA FORTE</strong><small>ERP para constructoras</small></span></Link><span>Software de gestión para constructoras mexicanas.</span><div><Link to="/login">Iniciar sesión</Link><Link to="/onboarding">Crear cuenta</Link></div><span>© {new Date().getFullYear()} ERP PNF</span></div></footer>
      </div>
    </LandingMotion>
  );
}
