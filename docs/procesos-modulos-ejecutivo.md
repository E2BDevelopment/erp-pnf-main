# ERP PNF — Capacidades funcionales

## Resumen ejecutivo

ERP PNF integra en una plataforma la gestión operativa, administrativa y financiera de una constructora mexicana. La obra es el eje de control: presupuestos, avances, compras, consumos, personal y gastos se registran vinculados a una obra, mientras que las áreas corporativas consolidan información entre proyectos.

La solución organiza el trabajo en ciclos semanales y acompaña los procesos desde su captura hasta su revisión, autorización y registro financiero. Los permisos se configuran por empresa y se validan en servidor; la información se mantiene aislada por compañía.

## Perfiles de operación

- **Dirección:** administra la empresa y las obras, configura equipo y permisos, y consulta información corporativa.
- **Residente:** captura la operación diaria de obra, incluidos avances, requisiciones, asistencia y gastos de campo.
- **Auxiliar:** apoya la captura de información de obra conforme a los permisos y revisiones configurados.
- **Supervisor:** revisa y autoriza operaciones de las obras asignadas.
- **Administración:** gestiona compras, proveedores, pagos, tesorería, catálogos y procesos de oficina.

## Capacidades por área

### Gestión de obras y presupuesto

Permite crear obras con sus datos generales, cliente, contrato, ubicación, fechas, presupuesto y equipo asignado. El presupuesto puede cargarse desde Excel y se administra por renglón. Las estimaciones registran avance contra el presupuesto vigente; las órdenes de cambio permiten gestionar ajustes sujetos al flujo de autorización correspondiente.

### Compras y abastecimiento

El flujo de compra conecta la necesidad de obra con su atención administrativa:

1. La obra captura y envía una requisición.
2. El Supervisor revisa y autoriza o rechaza la solicitud.
3. Administración solicita cotizaciones, registra propuestas y genera comparativas.
4. La propuesta elegida puede convertirse en una orden de compra, que pasa por autorización.
5. Almacén registra la recepción vinculada a la orden y la requisición.
6. La obligación resultante puede continuar a cuentas por pagar y tesorería.

Las solicitudes de cotización pueden generarse en PDF. La relación entre documentos facilita el seguimiento desde la solicitud original hasta la recepción y el pago.

### Almacén e insumos

El almacén de obra registra recepciones de órdenes de compra, consumos y cierres semanales. Las semanas cerradas pueden requerir una solicitud de desbloqueo y revisión administrativa para corregir información.

El catálogo de insumos permite buscar, filtrar, importar y consultar categorías, unidades e historial de precios. La lista de insumos autorizados incluye el folio de la requisición de origen cuando existe una relación; si hay varias, muestra la requisición más antigua. Las altas pueden proponer categorías o unidades nuevas, sujetas a autorización del Director. Los insumos rechazados permanecen identificados y no pueden enviarse en una requisición.

La ruta administrativa de almacén central permanece como marcador; las funciones de recepción y cierre semanal están disponibles en el contexto de obra.

### Personal y producción de obra

- **Nómina de obra:** organiza trabajadores por semana, registra asistencia y permite cerrar periodos para revisión y pago.
- **Destajos:** vincula contratistas y trabajadores con renglones del presupuesto, órdenes de cambio y estimaciones semanales sujetas a autorización.
- **Subcontratos:** gestiona contratos, alcances presupuestales, cambios, estimaciones y anticipos.
- **Estimaciones:** registra cantidades y avance por renglón presupuestal y conserva el historial del periodo.

La nómina de oficina se administra por separado de la nómina semanal de obra.

### Gastos y servicios de obra

- **Gastos directos:** captura gastos de obra, relaciona comprobantes y los envía a revisión; los autorizados pueden incorporarse a cuentas por pagar.
- **Caja chica:** administra fondos, gastos, comprobantes y solicitudes de reembolso con revisión administrativa y autorización según el flujo aplicable.
- **Gasolinas:** gestiona vales, autorizaciones, recepción y liquidación de vales seleccionados.
- **Rentas:** registra solicitudes, cotizaciones, autorización, periodos de uso, entradas y salidas, renovaciones e incidencias.
- **Tareas:** permite asignar y actualizar tareas para dar seguimiento a pendientes de obra.

### Finanzas y control corporativo

- **Cuentas por pagar:** concentra obligaciones de distintos procesos y permite consultar saldos y gestionar pagos donde las funciones del proceso lo habilitan.
- **Tesorería:** administra cuentas activas, saldos y movimientos asociados a pagos.
- **Contabilidad:** ofrece consulta del balance y del catálogo contable. El tratamiento contable formal debe validarse con las reglas del módulo y la operación financiera.
- **Condensado semanal:** reúne información por obra y periodo para apoyar la conciliación del ciclo semanal.
- **Estado de resultados:** las funciones contemplan consulta semanal, histórica y acumulada; debe confirmarse la disponibilidad de la interfaz correspondiente.
- **Gastos de oficina:** administra solicitudes de gasto y personal de oficina, incluyendo la generación de nómina del periodo.

### Catálogos y administración de empresa

Los catálogos incluyen clientes, proveedores y otros terceros, trabajadores, insumos y unidades de negocio. Sus funciones abarcan consulta, alta y actualización; algunas altas o cambios pasan por autorización y controles de estado.

La administración corporativa permite registrar la empresa, gestionar sus datos, equipo, roles y permisos, así como configurar preferencias de notificación. La bitácora de auditoría permite consultar cambios registrados en tablas de negocio, con filtros y paginación.

### Seguimiento y comunicación

Los dashboards ofrecen contexto corporativo y resumen por obra. Los contadores de pendientes y las notificaciones señalan acciones que requieren atención; la autorización siempre depende del registro y de los permisos vigentes.

## Modelo de autorización y control

Las funciones visibles dependen del perfil y de los permisos configurados por empresa. Dirección puede definir permisos para roles y, donde la configuración de obra lo permita, establecer excepciones. Las excepciones no sustituyen los vistos buenos del proceso ni conceden acceso a obras. Las acciones sensibles se validan en servidor y los datos se aíslan por empresa.

## Alcance funcional y estado de algunas pantallas

La disponibilidad de una función de servidor no implica que exista una pantalla conectada para operarla. En la versión documentada, las rutas administrativas de Requisiciones, Almacén central, Destajos, Subcontratos, Rentas y Tareas muestran marcadores; parte de su operación sí está disponible desde las rutas de obra. El catálogo de subcontratistas también permanece como marcador. Las pantallas administrativas de Gasolinas, Caja chica, Nómina, Cuentas por pagar, Tesorería, Contabilidad, Gastos de oficina y Condensado semanal sí están conectadas a sus módulos.

Este documento resume capacidades observadas en el repositorio. Los permisos efectivos, las reglas de autorización y el estado de las pantallas pueden variar conforme a la configuración y a las actualizaciones del producto.
