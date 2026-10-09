import { CategoryDefinition } from '../types';

export const INITIAL_CATEGORIES: CategoryDefinition[] = [
  // ==========================================
  // FAMILIA EXP: EXPERIENCIAS DE INTERACCIÓN
  // ==========================================
  {
    id: 'EXP-GEN',
    family: 'EXP',
    code: 'EXP-GEN',
    name: 'Experiencia general con el STI',
    operationalDefinition: 'Vivencia global, afectiva o valorativa manifestada u observada durante la interacción completa con el sistema tutor.',
    inclusionCriteria: 'Alusiones a la dinámica de trabajo integral, sensaciones generales de agrado, extrañeza o comparación global con el aula ordinaria.',
    exclusionCriteria: 'Comentarios acotados exclusivamente a la usabilidad técnica o a dificultades operativas específicas.',
    relatedIndicators: ['OBS7', 'GF1', 'E1'],
    illustrativeExample: '[Ficticio] "Trabajar hoy con el tutor fue muy diferente a la clase normal; me sentí concentrado porque nadie me apuraba."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'EXP-INT',
    family: 'EXP',
    code: 'EXP-INT',
    name: 'Interacción con el tutor',
    operationalDefinition: 'Forma, ritmo y modalidades de comunicación, diálogo o intercambio operativo entre el estudiante y los componentes interactivos del STI.',
    inclusionCriteria: 'Evidencias de lectura de diálogos del tutor, consultas a la ayuda, tiempo dedicado a revisar las instrucciones en pantalla.',
    exclusionCriteria: 'Respuestas a mensajes de error o fallos específicos (codificar en EXP-RET).',
    relatedIndicators: ['OBS7', 'GF1', 'GF9', 'E4'],
    illustrativeExample: '[Ficticio] El estudiante interactúa con el botón de pistas cada vez que llega al paso de deducción lógica.',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'EXP-ANA',
    family: 'EXP',
    code: 'EXP-ANA',
    name: 'Análisis de información',
    operationalDefinition: 'Proceso de descomposición, lectura atenta, examen de premisas y contraste de datos provistos por la actividad antes de formular una respuesta.',
    inclusionCriteria: 'Conductas de pausa deliberada ante gráficos, lectura previa sin clics prematuros, menciones de haber desglosado el texto.',
    exclusionCriteria: 'Acciones de ensayo y error aleatorio sin lectura de enunciados.',
    relatedIndicators: ['OBS1', 'GF2', 'E3'],
    illustrativeExample: '[Ficticio] Observación: El estudiante tarda 90 segundos revisando la tabla de premisas antes de seleccionar la primera inferencia.',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'EXP-ALT',
    family: 'EXP',
    code: 'EXP-ALT',
    name: 'Evaluación de alternativas',
    operationalDefinition: 'Exploración, comparación y deliberación consciente entre dos o más opciones o vías de resolución ofrecidas por el STI.',
    inclusionCriteria: 'Verbalizaciones o conductas donde el estudiante contrasta opciones ("si elijo A ocurre X, pero B resuelve Y") antes de decidir.',
    exclusionCriteria: 'Selección mecánica de la primera alternativa disponible.',
    relatedIndicators: ['OBS2', 'GF3', 'GF4', 'E3'],
    illustrativeExample: '[Ficticio] "Antes de marcar, comparé las dos opciones porque ambas parecían lógicas, pero una tenía un contraejemplo."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'EXP-DUDA',
    family: 'EXP',
    code: 'EXP-DUDA',
    name: 'Duda y reconsideración',
    operationalDefinition: 'Estado de incertidumbre cognitiva provocado por contraejemplos, preguntas socráticas o pistas del STI que induce a suspender el juicio.',
    inclusionCriteria: 'Manifestaciones de sorpresa o desconcierto constructivo, borrado voluntario de una respuesta tras leer una pista que contradice su creencia inicial.',
    exclusionCriteria: 'Duda por falta de comprensión del idioma o terminología tecnológica.',
    relatedIndicators: ['OBS2', 'GF3'],
    illustrativeExample: '[Ficticio] "Pensé que tenía la razón al 100%, pero la pista me mostró un caso donde fallaba y tuve que frenar."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'EXP-PLAN',
    family: 'EXP',
    code: 'EXP-PLAN',
    name: 'Planificación',
    operationalDefinition: 'Anticipación deliberada del plan de acción, estructuración de pasos u ordenamiento de herramientas antes de iniciar la resolución.',
    inclusionCriteria: 'Inspección del índice de la tarea, revisión previa de objetivos o verbalizaciones previas de metas.',
    exclusionCriteria: 'Comienzo inmediato e impulsivo de la actividad sin exploración del entorno.',
    relatedIndicators: ['OBS4'],
    illustrativeExample: '[Ficticio] Observación: El estudiante despliega la barra de herramientas y la guía de pasos antes de pulsar «Iniciar ejercicio».',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'EXP-MON',
    family: 'EXP',
    code: 'EXP-MON',
    name: 'Monitoreo del aprendizaje',
    operationalDefinition: 'Supervisión en tiempo real del propio desempeño, verificación de aciertos/errores y consulta voluntaria de métricas de progreso.',
    inclusionCriteria: 'Apertura deliberada de la pestaña de historial, conteo de intentos, verificación de coherencia entre pasos.',
    exclusionCriteria: 'Ignorar por completo el panel de estado a lo largo de toda la sesión.',
    relatedIndicators: ['OBS5', 'GF6', 'E2'],
    illustrativeExample: '[Ficticio] "Miraba cada dos ejercicios la barra de nivel para ver si estaba cometiendo menos fallas en las justificaciones."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'EXP-AUT',
    family: 'EXP',
    code: 'EXP-AUT',
    name: 'Autorregulación',
    operationalDefinition: 'Capacidad de modificar conscientemente las tácticas de estudio, velocidad de lectura o formulación de hipótesis tras identificar un fallo.',
    inclusionCriteria: 'Cambios de método de resolución tras retroalimentación negativa, búsqueda intencional de conceptos previos para corregir el rumbo.',
    exclusionCriteria: 'Reintento a ciegas sin variar la lógica de la respuesta.',
    relatedIndicators: ['OBS6', 'GF5', 'GF6', 'E2'],
    illustrativeExample: '[Ficticio] Observación: Tras el fallo, el estudiante no reintentó inmediatamente; regresó al concepto teórico, leyó el ejemplo y luego reformuló.',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'EXP-RET',
    family: 'EXP',
    code: 'EXP-RET',
    name: 'Respuesta a la retroalimentación',
    operationalDefinition: 'Comportamiento observable y actitud manifestada ante los mensajes, alertas o pistas correctivas del tutor.',
    inclusionCriteria: 'Detenimiento frente al mensaje del tutor, lectura gestual, aceptación de la pista o rechazo conductual.',
    exclusionCriteria: 'Respuestas a preguntas evaluativas iniciales sin retroalimentación previa del sistema.',
    relatedIndicators: ['OBS3', 'OBS8', 'GF6'],
    illustrativeExample: '[Ficticio] Observación (OBS8): El estudiante asiente con la cabeza al leer la pista y abre la ventana explicativa del error.',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },

  // ==========================================
  // FAMILIA PER: PERCEPCIONES DE LOS ESTUDIANTES
  // ==========================================
  {
    id: 'PER-PC',
    family: 'PER',
    code: 'PER-PC',
    name: 'Aporte percibido al pensamiento crítico',
    operationalDefinition: 'Opinión o juicio valorativo del estudiante sobre si el STI fomentó en él la argumentación rigurosa, el cuestionamiento o el análisis profundo.',
    inclusionCriteria: 'Afirmaciones donde el estudiante expresa que el sistema lo desafió a no conformarse con la primera idea y a fundamentar.',
    exclusionCriteria: 'Menciones a la velocidad o entretenimiento sin referencia al rigor cognitivo.',
    relatedIndicators: ['GF2', 'E3'],
    illustrativeExample: '[Ficticio] "Sentí que el programa me exigía justificar cada paso, no bastaba con adivinar."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'PER-APER',
    family: 'PER',
    code: 'PER-APER',
    name: 'Apertura a diferentes perspectivas',
    operationalDefinition: 'Percepción de haber sido expuesto a múltiples puntos de vista, soluciones no convencionales o refutaciones válidas.',
    inclusionCriteria: 'Expresiones que reconozcan que existen otras formas válidas de resolver el dilema o que el tutor le amplió la mirada.',
    exclusionCriteria: 'Comentarios sobre la rigidez de una clave única.',
    relatedIndicators: ['OBS3', 'GF4'],
    illustrativeExample: '[Ficticio] "El tutor me mostró que el personaje tenía motivos que yo no había considerado en mi primer análisis."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'PER-CONSC',
    family: 'PER',
    code: 'PER-CONSC',
    name: 'Conciencia del aprendizaje',
    operationalDefinition: 'Reconocimiento explícito por parte del estudiante sobre qué sabe, qué no sabe y cómo evoluciona su comprensión durante la interacción.',
    inclusionCriteria: 'Declaraciones de darse cuenta de sus vacíos conceptuales o de sus puntos fuertes gracias al diálogo con el tutor.',
    exclusionCriteria: 'Comentarios vagos tipo "aprendí mucho" sin especificar sobre qué proceso o contenido.',
    relatedIndicators: ['GF7', 'E2'],
    illustrativeExample: '[Ficticio] "Me di cuenta de que tiendo a asumir cosas sin mirar las excepciones; el sistema me hizo consciente de esa trampa mía."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'PER-META',
    family: 'PER',
    code: 'PER-META',
    name: 'Metacognición percibida',
    operationalDefinition: 'Valoración subjetiva de la capacidad del STI para actuar como espejo cognitivo y andamio de la autorreflexión mental.',
    inclusionCriteria: 'Comentarios donde el estudiante atribuye a las pistas del sistema el haberlo hecho reflexionar sobre su propia mente.',
    exclusionCriteria: 'Respuestas referidas exclusivamente a la nota o calificación cuantitativa.',
    relatedIndicators: ['GF5', 'GF7', 'E2'],
    illustrativeExample: '[Ficticio] "Las preguntas del tutor funcionaban como una voz interna que me decía: ¿estás seguro de esa conclusión?"',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'PER-ADAPT',
    family: 'PER',
    code: 'PER-ADAPT',
    name: 'Percepción de adaptación del STI',
    operationalDefinition: 'Juicio del estudiante respecto a si el sistema personaliza las explicaciones a su ritmo y nivel o si ofrece un itinerario estandarizado.',
    inclusionCriteria: 'Opiniones sobre si el tutor reconocía sus errores singulares o si percibía respuestas prefabricadas idénticas para todos.',
    exclusionCriteria: 'Comentarios sobre la estética visual de la interfaz.',
    relatedIndicators: ['GF9'],
    illustrativeExample: '[Ficticio] "Sentí que cuando fallaba en premisas me daba ejemplos más simples, pero a mi compañero le dio retos más avanzados."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'PER-VAL',
    family: 'PER',
    code: 'PER-VAL',
    name: 'Valoración del STI',
    operationalDefinition: 'Evaluación general de utilidad, relevancia pedagógica y satisfacción frente a la mediación del tutor inteligente.',
    inclusionCriteria: 'Expresiones de recomendación, agrado pedagógico o comparación positiva frente a métodos instruccionales previos.',
    exclusionCriteria: 'Propuestas concretas de rediseño (codificar en PER-PROP).',
    relatedIndicators: ['GF1', 'E1'],
    illustrativeExample: '[Ficticio] "Es una herramienta muy útil porque da feedback inmediato sin juzgarte como a veces pasa con un examen."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'PER-PROP',
    family: 'PER',
    code: 'PER-PROP',
    name: 'Propuestas de mejora',
    operationalDefinition: 'Sugerencias, demandas e iniciativas planteadas por los estudiantes para optimizar las funciones pedagógicas o técnicas del STI.',
    inclusionCriteria: 'Propuestas expresadas como "le cambiaría", "debería agregar", "sería mejor si explicara con más detalles".',
    exclusionCriteria: 'Quejas aisladas sin propuesta alternativa explícita.',
    relatedIndicators: ['GF10', 'E5'],
    illustrativeExample: '[Ficticio] "Le agregaría la opción de pedirle al tutor que me explique el error con un diagrama visual."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },

  // ==========================================
  // FAMILIA DIF: DIFICULTADES OBSERVADAS Y REPORTADAS
  // ==========================================
  {
    id: 'DIF-INT',
    family: 'DIF',
    code: 'DIF-INT',
    name: 'Dificultades de interacción',
    operationalDefinition: 'Obstáculos ergonómicos, de navegación o comprensión de los controles y flujos de la interfaz del STI.',
    inclusionCriteria: 'Confusión con botones, no encontrar cómo avanzar, quejas por lentitud o errores de visualización en la pantalla.',
    exclusionCriteria: 'Dificultades originadas por falta de conocimiento del tema académico de la tarea.',
    relatedIndicators: ['OBS7', 'GF8', 'E4'],
    illustrativeExample: '[Ficticio] Observación: El estudiante hizo clic cuatro veces en el texto antes de percatarse de que debía arrastrar el bloque.',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'DIF-COMP',
    family: 'DIF',
    code: 'DIF-COMP',
    name: 'Comprensión de las actividades',
    operationalDefinition: 'Problemas para interpretar las instrucciones, las consignas conceptuales o la terminología académica de los ejercicios.',
    inclusionCriteria: 'Dudas sobre qué se espera que responda, preguntas al observador sobre qué significa una palabra del enunciado.',
    exclusionCriteria: 'Desacuerdo con la retroalimentación emitida tras haber respondido (codificar en DIF-RET).',
    relatedIndicators: ['OBS1', 'GF8', 'E4'],
    illustrativeExample: '[Ficticio] "No entendí al principio qué era una falacia ad hominem porque la instrucción usaba palabras muy enredadas."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'DIF-RET',
    family: 'DIF',
    code: 'DIF-RET',
    name: 'Dificultades ante la retroalimentación',
    operationalDefinition: 'Incomprensión, ambigüedad o desacuerdo frente a los mensajes de error, pistas o explicaciones generadas por el sistema.',
    inclusionCriteria: 'Estudiante declara que la pista era confusa, que el sistema no le aclaró por qué estaba mal, o discrepancia con la corrección.',
    exclusionCriteria: 'Reacción puramente afectiva de enojo sin señalamiento del contenido de la retroalimentación.',
    relatedIndicators: ['OBS8', 'GF6', 'GF8', 'E4'],
    illustrativeExample: '[Ficticio] "El sistema me decía que mi respuesta no era válida, pero no me decía en qué parte del silogismo estaba el fallo."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'DIF-AJUSTE',
    family: 'DIF',
    code: 'DIF-AJUSTE',
    name: 'Dificultades para ajustar estrategias',
    operationalDefinition: 'Bloqueo cognitivo o repetición compulsiva de la misma acción errónea sin poder idear una vía alternativa tras el feedback.',
    inclusionCriteria: 'Conductas de clics repetidos sin lectura, reiteración de la misma respuesta errada en 3 o más intentos consecutivos.',
    exclusionCriteria: 'Ajuste exitoso de la estrategia tras un solo reintento.',
    relatedIndicators: ['OBS6', 'GF6', 'E4'],
    illustrativeExample: '[Ficticio] Observación (OBS6): El estudiante recibió error y volvió a marcar la misma alternativa errada tres veces seguidas.',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'DIF-FRUST',
    family: 'DIF',
    code: 'DIF-FRUST',
    name: 'Frustración',
    operationalDefinition: 'Estados afectivos negativos intensos (irritación, desánimo, sensación de impotencia o abandono de la tarea).',
    inclusionCriteria: 'Suspiros prolongados, gestos de disgusto, expresiones verbales de querer cerrar el programa o impotencia.',
    exclusionCriteria: 'Fatiga física ordinaria por uso prolongado de pantalla sin molestia con la actividad.',
    relatedIndicators: ['OBS8', 'GF8'],
    illustrativeExample: '[Ficticio] "Me dio rabia cuando insistía en que mi argumento era débil cuando para mí tenía sentido; sentí ganas de cerrar todo."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'DIF-MEJORA',
    family: 'DIF',
    code: 'DIF-MEJORA',
    name: 'Necesidades de mejora identificadas',
    operationalDefinition: 'Fallas estructurales, vacíos didácticos o limitaciones técnicas detectadas que requieren rediseño pedagógico del STI.',
    inclusionCriteria: 'Demandas directas de ajuste funcional, reportes de bugs pedagógicos o inconsistencias conceptuales del software.',
    exclusionCriteria: 'Preferencias subjetivas de color o personalización de avatar sin impacto de aprendizaje.',
    relatedIndicators: ['GF10', 'E5'],
    illustrativeExample: '[Ficticio] "Necesitamos que el tutor permita escribir argumentos abiertos con nuestras palabras y no solo elegir opciones cerradas."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },

  // ==========================================
  // DIMENSIONES TRANSVERSALES (PC Y META)
  // ==========================================
  {
    id: 'PC-ANALISIS',
    family: 'PC',
    code: 'PC-ANALISIS',
    name: 'Pensamiento Crítico: Análisis de Información y Premisas',
    isTransversal: true,
    operationalDefinition: 'Habilidad evidenciada o reportada para descomponer argumentos, identificar supuestos implícitos y examinar evidencias lógicas.',
    inclusionCriteria: 'Desglose intencional de premisas, identificación de falacias o solicitud de pruebas.',
    exclusionCriteria: 'Simple memorización o repetición literal de la teoría.',
    relatedIndicators: ['OBS1', 'GF2', 'E3'],
    illustrativeExample: '[Ficticio] "Separé lo que decía el texto en dos partes para ver si la conclusión se deducía realmente de los hechos."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'PC-EVAL',
    family: 'PC',
    code: 'PC-EVAL',
    name: 'Pensamiento Crítico: Evaluación de Alternativas y Argumentos',
    isTransversal: true,
    operationalDefinition: 'Ponderación sistemática de la solidez, pertinencia y credibilidad de distintas tesis o soluciones posibles.',
    inclusionCriteria: 'Comparación rigurosa de pros y contras de cada alternativa antes de inclinarse por una.',
    exclusionCriteria: 'Elección por gusto estético o comodidad.',
    relatedIndicators: ['OBS2', 'GF3', 'GF4', 'E3'],
    illustrativeExample: '[Ficticio] "Probé mentalmente qué pasaría si la premisa fuera falsa para ver si el contraargumento sostenía la tesis."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'PC-APER',
    family: 'PC',
    code: 'PC-APER',
    name: 'Pensamiento Crítico: Apertura Mental y Flexibilidad Cognitiva',
    isTransversal: true,
    operationalDefinition: 'Disposición a reconsiderar la propia postura ante contraevidencias y aceptar puntos de vista disidentes válidos.',
    inclusionCriteria: 'Reconocimiento explícito de validez en posturas ajenas o rectificación de un juicio previo.',
    exclusionCriteria: 'Cambio de respuesta por simple presión sin convicción razonada.',
    relatedIndicators: ['OBS3', 'GF4'],
    illustrativeExample: '[Ficticio] "Aunque mi postura era opuesta, la objeción del tutor me hizo ver que el otro grupo tenía un punto razonable."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'PC-CUEST',
    family: 'PC',
    code: 'PC-CUEST',
    name: 'Pensamiento Crítico: Cuestionamiento y Juicio Reflexivo',
    isTransversal: true,
    operationalDefinition: 'Actitud interrogativa ante certezas aparentes, cuestionamiento de dogmas y fundamentación dialógica.',
    inclusionCriteria: 'Preguntas del estudiante hacia el sistema, formulación de dudas sobre el criterio adoptado por la tarea.',
    exclusionCriteria: 'Quejas sobre el tiempo o el teclado.',
    relatedIndicators: ['GF2', 'E3', 'E5'],
    illustrativeExample: '[Ficticio] "¿Por qué el tutor asume que esa premisa es universal si en el contexto de Colombia tiene excepciones?"',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'META-PLAN',
    family: 'META',
    code: 'META-PLAN',
    name: 'Metacognición: Planificación Consciente',
    isTransversal: true,
    operationalDefinition: 'Establecimiento anticipado de metas cognitivas y selección deliberada de estrategias previas a la resolución.',
    inclusionCriteria: 'Diseño de un plan secuencial expresado conductual o verbalmente antes de abordar el ejercicio.',
    exclusionCriteria: 'Inicio desordenado sin visión de meta.',
    relatedIndicators: ['OBS4'],
    illustrativeExample: '[Ficticio] Observación (OBS4): El estudiante organiza sus hojas de notas físicas y repasa el índice antes de empezar el módulo.',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'META-MON',
    family: 'META',
    code: 'META-MON',
    name: 'Metacognición: Monitoreo y Conciencia de Comprensión',
    isTransversal: true,
    operationalDefinition: 'Autoobservación continua del nivel de comprensión, detección de ilusiones de competencia y calibración cognitiva.',
    inclusionCriteria: 'Reconocimiento de no haber entendido un paso, autoexamen voluntario o verificación antes de enviar la solución.',
    exclusionCriteria: 'Chequeo exclusivo de puntaje numérico con fines de competencia entre pares.',
    relatedIndicators: ['OBS5', 'GF5', 'GF7', 'E2'],
    illustrativeExample: '[Ficticio] "Me di cuenta a mitad de camino de que estaba adivinando en vez de aplicar la regla que el tutor explicó."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  },
  {
    id: 'META-REG',
    family: 'META',
    code: 'META-REG',
    name: 'Metacognición: Autorregulación y Ajuste de Estrategias',
    isTransversal: true,
    operationalDefinition: 'Modificación efectiva de tácticas de procesamiento cognitivo y control emocional para superar dificultades detectadas.',
    inclusionCriteria: 'Rectificación de procedimiento guiada por la propia comprensión, ralentización voluntaria del ritmo tras un error.',
    exclusionCriteria: 'Persistencia obstinada en la misma acción fallida.',
    relatedIndicators: ['OBS6', 'GF6', 'E2'],
    illustrativeExample: '[Ficticio] "Cuando el tutor me avisó del fallo, en vez de volver a probar cambié de táctica: leí primero la conclusión y fui hacia atrás."',
    auditTrail: {
      createdDate: '2026-10-01',
      createdBy: 'Equipo Metodológico ROCAS',
      lastModifiedDate: '2026-10-01',
      lastModifiedBy: 'Equipo Metodológico ROCAS'
    }
  }
];
