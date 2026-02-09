export type ServiceAccent = "orange" | "green";
export type ServiceIconKey = "branding" | "expo" | "papeleria" | "grabado" | "textil" | "diseno";

export interface ServiceItem {
  slug: string;
  name: string;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  icon: ServiceIconKey;
  accent: ServiceAccent;
  highlights: string[];
  includes: string[];
  useCases: string[];
  process: string[];
  whatWeNeed: string[];
  ctaPrimaryLabel: string;
}

export const services: ServiceItem[] = [
  {
    slug: "branding-fisico",
    name: "Branding físico para empresas",
    shortDescription: "Aplicaciones físicas con estándar corporativo y ejecución consistente.",
    seoTitle: "Branding físico para empresas | Enfoque en Medios Publicitarios",
    seoDescription:
      "Desarrollamos branding físico para corporativos, medianas empresas y retail en México con producción premium y tiempos claros.",
    icon: "branding",
    accent: "orange",
    highlights: [
      "Coherencia visual entre sedes, puntos de contacto y materiales.",
      "Selección de materiales orientada a durabilidad y presentación premium.",
      "Ejecución controlada para minimizar retrabajos y tiempos muertos.",
      "Acompañamiento técnico para proyectos complejos en México.",
    ],
    includes: [
      "Levantamiento de necesidades de marca y contexto de uso.",
      "Propuesta de aplicaciones físicas y lineamientos de producción.",
      "Desarrollo de artes finales listos para fabricación.",
      "Producción de piezas con control de color y acabados.",
      "Ajustes de preprensa y validación técnica antes de producir.",
    ],
    useCases: [
      "Empresas con expansión de oficinas o puntos de atención.",
      "Marcas que necesitan uniformidad visual entre áreas internas y comerciales.",
      "Equipos de marketing que requieren proveedores confiables y rápidos.",
      "Retail que busca presencia sólida en piso de venta.",
    ],
    process: [
      "Brief ejecutivo con objetivos, tiempos y alcances.",
      "Propuesta técnica y visual con opciones de materiales.",
      "Validación de arte y muestras de referencia.",
      "Producción y control de calidad por entregable.",
      "Cierre con checklist y recomendaciones para siguientes fases.",
    ],
    whatWeNeed: [
      "Objetivo del proyecto y fecha comprometida.",
      "Lineamientos de marca o referencias visuales.",
      "Medidas, cantidades y ubicaciones de aplicación.",
      "Presupuesto estimado o rango esperado.",
      "Persona responsable para validaciones rápidas.",
    ],
    ctaPrimaryLabel: "Cotizar branding físico",
  },
  {
    slug: "expo-stands",
    name: "Expo / stands corporativos",
    shortDescription: "Presencia de alto impacto para ferias, expos y activaciones.",
    seoTitle: "Expo y stands corporativos | Enfoque en Medios Publicitarios",
    seoDescription:
      "Diseño aplicado y producción de stands corporativos para ferias y expos en México, con enfoque premium y entrega confiable.",
    icon: "expo",
    accent: "green",
    highlights: [
      "Presencia de marca pensada para captar atención y facilitar conversación.",
      "Soluciones modulares y adaptables según formato de evento.",
      "Materiales y acabados consistentes con estándar corporativo.",
      "Coordinación ágil para ventanas de entrega exigentes.",
    ],
    includes: [
      "Definición de objetivos comerciales y flujo del stand.",
      "Propuesta visual y técnica orientada a producción real.",
      "Piezas gráficas para muros, counters y soportes promocionales.",
      "Fabricación de elementos de exhibición y comunicación.",
      "Documentación de entrega y recomendaciones de uso posterior.",
    ],
    useCases: [
      "Lanzamientos de producto en ferias sectoriales.",
      "Participación de corporativos en expos nacionales.",
      "Activaciones B2B y retail con objetivos de captación.",
      "Equipos comerciales que necesitan presencia profesional inmediata.",
    ],
    process: [
      "Alineación de metas del evento y restricciones del recinto.",
      "Diseño aplicado a producción con estimación de costos.",
      "Aprobación de piezas y especificaciones técnicas.",
      "Producción de componentes gráficos y estructurales.",
      "Entrega organizada para montaje por parte del cliente o equipo externo.",
    ],
    whatWeNeed: [
      "Nombre del evento, ciudad y fechas clave.",
      "Dimensiones del espacio y lineamientos del recinto.",
      "Objetivo del stand: leads, demostración, posicionamiento, etc.",
      "Manual de marca y mensajes prioritarios.",
      "Rango de inversión y cantidad de piezas esperadas.",
    ],
    ctaPrimaryLabel: "Cotizar expo / stands",
  },
  {
    slug: "papeleria-corporativa",
    name: "Papelería corporativa premium",
    shortDescription: "Papelería ejecutiva con acabados finos y presentación impecable.",
    seoTitle: "Papelería corporativa premium | Enfoque en Medios Publicitarios",
    seoDescription:
      "Diseñamos y producimos papelería corporativa premium para empresas en México, cuidando acabados, materiales y consistencia visual.",
    icon: "papeleria",
    accent: "orange",
    highlights: [
      "Percepción de marca superior en cada material institucional.",
      "Acabados premium alineados a la identidad visual de la empresa.",
      "Consistencia en tirajes pequeños y medianos.",
      "Procesos de aprobación claros para equipos directivos y compras.",
    ],
    includes: [
      "Tarjetas de presentación, hojas membretadas y sobres corporativos.",
      "Folders, carpetas y materiales para propuestas ejecutivas.",
      "Opciones de papeles especiales y acabados selectos.",
      "Pruebas de color y validación antes de tiraje final.",
      "Control de calidad por lote para mantener uniformidad.",
    ],
    useCases: [
      "Direcciones comerciales y relaciones institucionales.",
      "Presentaciones con clientes de alto valor.",
      "Kits de bienvenida para equipos internos y aliados.",
      "Renovación de imagen física en organizaciones en crecimiento.",
    ],
    process: [
      "Revisión de identidad y piezas prioritarias.",
      "Definición de materiales, gramajes y acabados.",
      "Preparación de arte final y pruebas de color.",
      "Producción y acabado con control de calidad.",
      "Empaque y entrega según requerimientos del proyecto.",
    ],
    whatWeNeed: [
      "Lista de piezas y cantidades por cada una.",
      "Identidad visual actualizada y tipografías.",
      "Preferencias de papel, color y acabado.",
      "Fecha límite de entrega.",
      "Datos de facturación y contacto de aprobación.",
    ],
    ctaPrimaryLabel: "Cotizar papelería corporativa",
  },
  {
    slug: "grabado-laser",
    name: "Grabado láser y personalización",
    shortDescription: "Personalización precisa sobre materiales para piezas corporativas.",
    seoTitle: "Grabado láser y personalización | Enfoque en Medios Publicitarios",
    seoDescription:
      "Ofrecemos grabado láser para piezas corporativas y promocionales en México, con precisión técnica y acabados consistentes.",
    icon: "grabado",
    accent: "green",
    highlights: [
      "Nivel de detalle alto para identidad y personalización.",
      "Resultados consistentes en diferentes sustratos.",
      "Procesos pensados para series corporativas y ediciones especiales.",
      "Control técnico para evitar variaciones no deseadas.",
    ],
    includes: [
      "Evaluación de material y viabilidad de grabado.",
      "Ajuste de archivo vectorial para precisión de salida.",
      "Pruebas iniciales de profundidad y contraste.",
      "Producción de lote con estándares de repetibilidad.",
      "Revisión final y selección de piezas antes de entrega.",
    ],
    useCases: [
      "Regalos corporativos y kits de representación.",
      "Señalización o placas con identidad institucional.",
      "Personalización de piezas promocionales premium.",
      "Lotes con nombres, códigos o numeraciones específicas.",
    ],
    process: [
      "Recepción de archivos y especificaciones del proyecto.",
      "Validación técnica por tipo de material.",
      "Pruebas de referencia y aprobación.",
      "Ejecución de producción por lote.",
      "Control final de calidad y empaque.",
    ],
    whatWeNeed: [
      "Tipo de material y dimensiones de cada pieza.",
      "Cantidad total y variaciones de personalización.",
      "Archivo editable en vectores o logotipo en alta calidad.",
      "Nivel de acabado esperado (sutil, marcado, institucional).",
      "Fecha objetivo para entrega.",
    ],
    ctaPrimaryLabel: "Cotizar grabado láser",
  },
  {
    slug: "impresion-textil",
    name: "Impresión textil profesional",
    shortDescription: "Textiles corporativos con color estable y buena presencia de marca.",
    seoTitle: "Impresión textil profesional | Enfoque en Medios Publicitarios",
    seoDescription:
      "Producción textil profesional para uniformes y activaciones en México, con calidad de impresión y consistencia por lote.",
    icon: "textil",
    accent: "orange",
    highlights: [
      "Identidad de marca uniforme en prendas y textiles promocionales.",
      "Acabados durables para uso operativo o comercial.",
      "Control de color y legibilidad de marca.",
      "Escalabilidad para lotes por área, sede o campaña.",
    ],
    includes: [
      "Asesoría sobre técnica de impresión según uso final.",
      "Preparación de artes para reproducción textil.",
      "Muestras de color y pruebas de aplicación.",
      "Producción por talla, modelo y variante de diseño.",
      "Control por lote para mantener calidad consistente.",
    ],
    useCases: [
      "Uniformes para equipos comerciales y operativos.",
      "Eventos de marca y activaciones promocionales.",
      "Merch corporativo para clientes y aliados.",
      "Campañas con cobertura en diferentes ciudades de México.",
    ],
    process: [
      "Definición de prendas, cantidades y tallaje.",
      "Ajuste de arte para técnica textil elegida.",
      "Validación de muestra y aprobación de color.",
      "Producción por lotes con control de calidad.",
      "Empaque y entrega conforme a requerimientos.",
    ],
    whatWeNeed: [
      "Tipo de prenda y distribución de tallas.",
      "Cantidad por diseño y color.",
      "Logo o arte en buena resolución.",
      "Uso esperado de la prenda (operativo, evento, retail).",
      "Fecha límite y lugar de entrega.",
    ],
    ctaPrimaryLabel: "Cotizar impresión textil",
  },
  {
    slug: "diseno-grafico",
    name: "Diseño gráfico aplicado a producción",
    shortDescription: "Diseño pensado para fabricar sin fricción ni retrabajos.",
    seoTitle: "Diseño gráfico aplicado a producción | Enfoque en Medios Publicitarios",
    seoDescription:
      "Convertimos ideas en artes listos para producción publicitaria en México, priorizando claridad técnica, consistencia y velocidad.",
    icon: "diseno",
    accent: "green",
    highlights: [
      "Diseño orientado a resultados reales en producción física.",
      "Entregables claros para reducir errores en fabricación.",
      "Consistencia de marca en múltiples formatos y materiales.",
      "Acompañamiento técnico para decisiones visuales y de ejecución.",
    ],
    includes: [
      "Concepto visual alineado a objetivos comerciales.",
      "Adaptación de piezas a distintos formatos de salida.",
      "Artes finales con especificaciones técnicas de producción.",
      "Control de jerarquía, legibilidad y consistencia de marca.",
      "Versionado por canal, tamaño o punto de contacto.",
    ],
    useCases: [
      "Campañas que requieren salida en medios físicos diversos.",
      "Empresas con equipos internos de marketing y compras.",
      "Proyectos donde diseño y producción deben coordinarse rápido.",
      "Marcas que buscan evitar reprocesos por archivos mal preparados.",
    ],
    process: [
      "Brief de objetivos, formatos y restricciones técnicas.",
      "Propuesta visual con criterio de producción real.",
      "Ronda de ajustes y aprobación ejecutiva.",
      "Preparación de artes finales por formato.",
      "Entrega organizada para producción inmediata.",
    ],
    whatWeNeed: [
      "Objetivo de la pieza y canal de uso.",
      "Medidas finales y especificaciones del proveedor de producción.",
      "Manual de marca o insumos visuales existentes.",
      "Contenido final: textos, logos e imágenes.",
      "Tiempo disponible para iteraciones y aprobación.",
    ],
    ctaPrimaryLabel: "Cotizar diseño gráfico",
  },
];

export const servicesBySlug = new Map(services.map((service) => [service.slug, service]));
