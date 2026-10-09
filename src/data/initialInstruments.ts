import { QuestionDefinition } from '../types';

export const INITIAL_QUESTIONS: QuestionDefinition[] = [
  // ==========================================
  // 1. OBSERVACIÓN ESTRUCTURADA (OBS1 - OBS8)
  // Diligenciada por el investigador mientras observa al estudiante
  // ==========================================
  {
    id: 'OBS1',
    instrumentType: 'OBS',
    order: 1,
    code: 'OBS1',
    prompt: '¿El estudiante analiza la información presentada antes de seleccionar una respuesta o realizar una acción?',
    description: 'Evalúa si el estudiante lee detenidamente las consignas, examina datos o gráficos antes de pulsar botones o interactuar.',
    responseType: 'structured_scale',
    options: ['Sí', 'No', 'Parcialmente / Ocasional', 'No observado / Información insuficiente'],
    methodologicalNote: 'Registrar la evidencia de conducta visible (p. ej., tiempo de lectura, movimiento del cursor, revisión previa). No asumir reflexión interna sin indicador conductual.',
    linkedCategories: ['EXP-ANA', 'PC-ANALISIS']
  },
  {
    id: 'OBS2',
    instrumentType: 'OBS',
    order: 2,
    code: 'OBS2',
    prompt: 'Ante un desafío o problema abierto planteado por el STI, ¿el estudiante evalúa diferentes alternativas de solución?',
    description: 'Observar si explora distintos caminos de respuesta o si selecciona el primer camino por ensayo y error impulsivo.',
    responseType: 'structured_scale',
    options: ['Sí', 'No', 'Parcialmente / Ocasional', 'No observado / Información insuficiente'],
    methodologicalNote: 'Documentar si hubo comparaciones de opciones, borrado voluntario para reconsiderar, o consultas del menú de alternativas.',
    linkedCategories: ['EXP-ALT', 'PC-EVAL']
  },
  {
    id: 'OBS3',
    instrumentType: 'OBS',
    order: 3,
    code: 'OBS3',
    prompt: '¿Muestra el estudiante una actitud de apertura mental ante las sugerencias o perspectivas planteadas por el tutor inteligente?',
    description: 'Disposición a leer, aceptar o aplicar las recomendaciones o contraejemplos ofrecidos por el STI.',
    responseType: 'structured_scale',
    options: ['Sí', 'No', 'Parcialmente / Ocasional', 'No observado / Información insuficiente'],
    methodologicalNote: 'Diferenciar entre acatamiento pasivo de la pista y apertura genuina (inspección de la pista y reformulación voluntaria).',
    linkedCategories: ['EXP-RET', 'PER-APER', 'PC-APER']
  },
  {
    id: 'OBS4',
    instrumentType: 'OBS',
    order: 4,
    code: 'OBS4',
    prompt: '¿Se observa una fase de planificación? (¿El estudiante revisa las herramientas o la estructura de la actividad antes de comenzar?)',
    description: 'Acciones previas a la ejecución: revisión de barra de progreso, instrucciones, glosario o esquema de pasos.',
    responseType: 'structured_scale',
    options: ['Sí', 'No', 'Parcialmente / Ocasional', 'No observado / Información insuficiente'],
    methodologicalNote: 'Distinguir entre planificación explícita e inicio inmediato sin lectura del mapa de la tarea.',
    linkedCategories: ['EXP-PLAN', 'META-PLAN']
  },
  {
    id: 'OBS5',
    instrumentType: 'OBS',
    order: 5,
    code: 'OBS5',
    prompt: '¿El estudiante realiza un monitoreo de su progreso? (¿Consulta su nivel de avance o revisa sus respuestas anteriores?)',
    description: 'Revisión periódica de puntaje, historial de intentos, indicadores de maestría o retrocesos para chequear calidad.',
    responseType: 'structured_scale',
    options: ['Sí', 'No', 'Parcialmente / Ocasional', 'No observado / Información insuficiente'],
    methodologicalNote: 'Anotar con qué frecuencia consulta el panel de progreso y si esa consulta conduce a un cambio de ritmo o verificación.',
    linkedCategories: ['EXP-MON', 'META-MON']
  },
  {
    id: 'OBS6',
    instrumentType: 'OBS',
    order: 6,
    code: 'OBS6',
    prompt: 'Tras recibir una retroalimentación de error por parte del STI, ¿el estudiante ajusta su estrategia de aprendizaje para corregirlo? (Autorregulación).',
    description: 'Capacidad de modificar la hipótesis, releer el concepto o buscar apoyo tras un fallo en lugar de insistir a ciegas.',
    responseType: 'structured_scale',
    options: ['Sí', 'No', 'Parcialmente / Ocasional', 'No observado / Información insuficiente'],
    methodologicalNote: 'Crucial: documentar el contraste entre persistencia ciega (repetición rápida de clics) vs. pausa deliberada con cambio de enfoque.',
    linkedCategories: ['EXP-AUT', 'DIF-AJUSTE', 'META-REG']
  },
  {
    id: 'OBS7',
    instrumentType: 'OBS',
    order: 7,
    code: 'OBS7',
    prompt: '¿El estudiante navega por la interfaz de manera fluida y autónoma?',
    description: 'Solvencia ergonómica, uso de controles, comprensión de menús y ausencia de bloqueos técnicos o de usabilidad.',
    responseType: 'structured_scale',
    options: ['Sí', 'No', 'Parcialmente / Requiere asistencia', 'No observado / Información insuficiente'],
    methodologicalNote: 'Anotar tropiezos de usabilidad técnica para no confundir dificultades de interfaz con problemas cognitivos o conceptuales.',
    linkedCategories: ['EXP-INT', 'DIF-INT']
  },
  {
    id: 'OBS8',
    instrumentType: 'OBS',
    order: 8,
    code: 'OBS8',
    prompt: '¿Cuál es la reacción predominante ante los mensajes de retroalimentación inmediata del sistema?',
    description: 'Registro de la respuesta afectivo-conductual frente al feedback emitido por el STI.',
    responseType: 'reaction_scale',
    options: [
      'Receptiva / Curiosa / Atenta (lee y reflexiona)',
      'Aceptación pasiva (cierra de inmediato)',
      'Frustración / Resistencia / Enojo visible',
      'Desconcierto / Confusión ante la pista',
      'Indiferencia / Ignora el mensaje',
      'Sí (según formato dicotómico original)',
      'No (según formato dicotómico original)',
      'No observado / No recibió retroalimentación'
    ],
    methodologicalNote: 'ADVERTENCIA METODOLÓGICA (OBS8): En el documento físico original de recolección existe una inconsistencia tipológica (pregunta formulada cualitativamente respecto a "cuál es la reacción", pero con opciones impresas Sí/No). El sistema resuelve esto permitiendo registrar la tipología conductual enriquecida Y conservando la equivalencia con la opción original, exigiendo evidencia observable.',
    linkedCategories: ['EXP-RET', 'DIF-RET', 'DIF-FRUST']
  },

  // ==========================================
  // 2. GRUPO FOCAL (GF1 - GF10)
  // Formulado oralmente por el moderador a un grupo de estudiantes
  // ==========================================
  {
    id: 'GF1',
    instrumentType: 'GF',
    order: 9,
    code: 'GF1',
    prompt: '¿Qué fue lo que más les llamó la atención de trabajar con un "tutor inteligente" en lugar de una clase tradicional?',
    description: 'Explora el contraste percibido entre la mediación tecnológica adaptativa y la dinámica pedagógica habitual del aula.',
    responseType: 'text',
    methodologicalNote: 'Registrar intervenciones con identificación del estudiante (EST-X) y matices sobre autonomía vs. necesidad del docente.',
    linkedCategories: ['EXP-GEN', 'PER-VAL']
  },
  {
    id: 'GF2',
    instrumentType: 'GF',
    order: 10,
    code: 'GF2',
    prompt: '¿Sintieron que las actividades los obligaron a cuestionar lo que ya sabían o a pensar de una forma más profunda?',
    description: 'Explora la percepción de desafío cognitivo, desequilibrio conceptual y pensamiento crítico estimulado por las consignas.',
    responseType: 'text',
    methodologicalNote: 'Prestar atención a ejemplos concretos de conceptos o premisas que debieron reevaluar.',
    linkedCategories: ['PER-PC', 'PC-CUEST', 'EXP-DUDA']
  },
  {
    id: 'GF3',
    instrumentType: 'GF',
    order: 11,
    code: 'GF3',
    prompt: '¿Hubo momentos en los que el sistema les presentó información que los hizo dudar de su primera respuesta? ¿Cómo manejaron eso?',
    description: 'Analiza situaciones de duda epistemológica provocada por contraejemplos o pistas del sistema y la estrategia de manejo.',
    responseType: 'text',
    methodologicalNote: 'Identificar si la duda generó motivación investigativa o bloqueo/inseguridad.',
    linkedCategories: ['EXP-DUDA', 'EXP-ALT', 'PC-EVAL']
  },
  {
    id: 'GF4',
    instrumentType: 'GF',
    order: 12,
    code: 'GF4',
    prompt: '¿Cómo les ayudó el STI a ver diferentes puntos de vista sobre un mismo problema?',
    description: 'Indaga sobre la apertura a perspectivas alternativas y la multiplicidad de enfoques propuesta por el tutor.',
    responseType: 'text',
    methodologicalNote: 'Registrar si el tutor presentó alternativas o si los estudiantes sintieron que había una sola vía rígida.',
    linkedCategories: ['PER-APER', 'PC-APER', 'EXP-ALT']
  },
  {
    id: 'GF5',
    instrumentType: 'GF',
    order: 13,
    code: 'GF5',
    prompt: '¿De qué manera el tutor les ayudó a darse cuenta de sus propios errores antes de que el profesor interviniera?',
    description: 'Evalúa la mediación metacognitiva del STI en la detección temprana del error y el rol sustitutivo/complementario del docente.',
    responseType: 'text',
    methodologicalNote: 'Diferenciar entre "el tutor me dio la respuesta" versus "el tutor me guió para descubrir mi error".',
    linkedCategories: ['EXP-AUT', 'PER-META', 'META-MON']
  },
  {
    id: 'GF6',
    instrumentType: 'GF',
    order: 14,
    code: 'GF6',
    prompt: '¿Qué pensaban o qué hacían cuando el sistema les decía que su razonamiento no era el más adecuado? (Monitoreo y autorregulación).',
    description: 'Recoge las vivencias internas, emociones y estrategias reactivas ante la retroalimentación de incorrección cognitiva.',
    responseType: 'text',
    methodologicalNote: 'Contrastar con los registros de observación OBS6 y OBS8 para triangular lo que dicen con lo que hicieron.',
    linkedCategories: ['EXP-AUT', 'EXP-RET', 'META-REG', 'DIF-RET']
  },
  {
    id: 'GF7',
    instrumentType: 'GF',
    order: 15,
    code: 'GF7',
    prompt: '¿Sienten que ahora son más conscientes de cómo aprenden gracias a las pistas que daba el sistema?',
    description: 'Explora la toma de conciencia metacognitiva sobre los propios estilos, ritmos y mecanismos de comprensión.',
    responseType: 'text',
    methodologicalNote: 'No confundir la afirmación entusiasta ("sí, aprendo mejor") con evidencia de conciencia de procesos de aprendizaje específicos.',
    linkedCategories: ['PER-META', 'PER-CONSC', 'META-MON']
  },
  {
    id: 'GF8',
    instrumentType: 'GF',
    order: 16,
    code: 'GF8',
    prompt: '¿Qué fue lo más frustrante o difícil de entender al interactuar con el sistema tutor?',
    description: 'Identifica puntos de fricción afectiva, incomprensión de instrucciones, rigidez del parser o limitaciones del feedback.',
    responseType: 'text',
    methodologicalNote: 'Diferenciar dificultades técnicas de la interfaz vs. dificultades conceptuales de la tarea.',
    linkedCategories: ['DIF-FRUST', 'DIF-INT', 'DIF-COMP']
  },
  {
    id: 'GF9',
    instrumentType: 'GF',
    order: 17,
    code: 'GF9',
    prompt: '¿Sintieron que el tutor realmente se adaptaba a lo que ustedes necesitaban o les daba a todos lo mismo?',
    description: 'Evalúa la percepción de personalización pedagógica y adaptatividad efectiva del algoritmo del STI.',
    responseType: 'text',
    methodologicalNote: 'Fundamental para calibrar si el componente "inteligente" es percibido como genuino o como un flujo estático lineal.',
    linkedCategories: ['PER-ADAPT', 'EXP-INT']
  },
  {
    id: 'GF10',
    instrumentType: 'GF',
    order: 18,
    code: 'GF10',
    prompt: 'Si pudieran "entrenar" a este tutor inteligente para que fuera mejor compañero de estudio, ¿qué le cambiarían?',
    description: 'Recoge propuestas de los estudiantes sobre tono, nivel de ayuda, explicación de errores y diseño interactivo.',
    responseType: 'text',
    methodologicalNote: 'Codificar aportes de diseño pedagógico vs. expectativas lúdicas o de interfaz.',
    linkedCategories: ['PER-PROP', 'DIF-MEJORA']
  },

  // ==========================================
  // 3. ENTREVISTA SEMIESTRUCTURADA (E1 - E5)
  // Formulada individualmente a cada estudiante por el investigador
  // ==========================================
  {
    id: 'E1',
    instrumentType: 'E',
    order: 19,
    code: 'E1',
    prompt: '¿Cómo describirías tu experiencia trabajando con el tutor inteligente hoy?',
    description: 'Pregunta de apertura para recabar la vivencia holística, tono emocional y valoración global del estudiante.',
    responseType: 'text',
    methodologicalNote: 'Permite registrar la respuesta espontánea y formular preguntas de profundización sobre incidentes críticos.',
    linkedCategories: ['EXP-GEN', 'PER-VAL']
  },
  {
    id: 'E2',
    instrumentType: 'E',
    order: 20,
    code: 'E2',
    prompt: '¿De qué manera el sistema te ayudó a darte cuenta de cómo estás aprendiendo o qué partes te resultan más difíciles?',
    description: 'Explora la autorreflexión metacognitiva individual: reconocimiento de fortalezas, debilidades y puntos ciegos.',
    responseType: 'text',
    methodologicalNote: 'Registrar si el estudiante identifica momentos específicos de autorregulación o si la respuesta es genérica.',
    linkedCategories: ['PER-CONSC', 'PER-META', 'EXP-MON', 'META-MON']
  },
  {
    id: 'E3',
    instrumentType: 'E',
    order: 21,
    code: 'E3',
    prompt: 'Al resolver las actividades, ¿sentiste que el sistema te desafió a analizar la información de manera diferente?',
    description: 'Profundiza en la percepción de pensamiento crítico: análisis de premisas, búsqueda de justificaciones o cambio de perspectiva.',
    responseType: 'text',
    methodologicalNote: 'Solicitar que relate una actividad puntual donde experimentó dicho desafío analítico.',
    linkedCategories: ['PER-PC', 'EXP-ANA', 'PC-ANALISIS']
  },
  {
    id: 'E4',
    instrumentType: 'E',
    order: 22,
    code: 'E4',
    prompt: '¿Qué fue lo que más se te dificultó al interactuar con el programa?',
    description: 'Focaliza los obstáculos individuales específicos: lenguaje de las consignas, manejo de pistas, ritmo o usabilidad.',
    responseType: 'text',
    methodologicalNote: 'Triangular con OBS7 (navegación) y OBS6 (reacción ante errores) de la misma sesión individual.',
    linkedCategories: ['DIF-INT', 'DIF-COMP', 'DIF-RET', 'DIF-AJUSTE']
  },
  {
    id: 'E5',
    instrumentType: 'E',
    order: 23,
    code: 'E5',
    prompt: 'Si pudieras cambiar algo del tutor para que te ayude a pensar mejor, ¿qué sería?',
    description: 'Genera recomendaciones directas centradas en el andamiaje del pensamiento crítico y la metacognición.',
    responseType: 'text',
    methodologicalNote: 'Identificar si el estudiante pide más pistas directas (facilitación) o explicaciones más reflexivas (andamiaje cognitivo).',
    linkedCategories: ['PER-PROP', 'DIF-MEJORA', 'PC-CUEST']
  }
];
