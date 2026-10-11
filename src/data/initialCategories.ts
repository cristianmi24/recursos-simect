import { CategoryDefinition, CategoryFamily } from '../types';

// Matriz de categorización de los instrumentos del STI
// (Observación estructurada, Grupo focal y Entrevista semiestructurada).
// Categorías principales: Experiencias (EXP), Percepciones (PER) y Dificultades (DIF).
// Cada subcategoría corresponde a una o más preguntas/indicadores de los instrumentos.

const AUDIT = {
  createdDate: '2026-10-01',
  createdBy: 'Equipo Metodológico SIMECT',
  lastModifiedDate: '2026-10-01',
  lastModifiedBy: 'Equipo Metodológico SIMECT'
};

const cat = (
  family: CategoryFamily,
  code: string,
  name: string,
  relatedIndicators: string[],
  operationalDefinition: string,
  inclusionCriteria: string,
  exclusionCriteria: string,
  illustrativeExample: string
): CategoryDefinition => ({
  id: code,
  family,
  code,
  name,
  operationalDefinition,
  inclusionCriteria,
  exclusionCriteria,
  relatedIndicators,
  illustrativeExample,
  auditTrail: { ...AUDIT }
});

export const INITIAL_CATEGORIES: CategoryDefinition[] = [
  // ==========================================
  // EXPERIENCIAS
  // ==========================================
  cat('EXP', 'EXP-ANA', 'Análisis de información', ['OBS1'],
    'Conductas que evidencian que el estudiante revisa, compara o analiza la información antes de actuar.',
    'Pausa deliberada ante gráficos o enunciados, lectura previa sin clics prematuros, revisión de datos antes de responder.',
    'Ensayo y error aleatorio sin lectura de enunciados.',
    '[Ficticio] Observación: El estudiante tarda 90 segundos revisando la tabla de premisas antes de seleccionar la primera inferencia.'),
  cat('EXP', 'EXP-ALT', 'Evaluación de alternativas', ['OBS2'],
    'Evidencias de que el estudiante considera más de una posibilidad de solución antes de decidir ante un desafío abierto del STI.',
    'Comparación de opciones, borrado voluntario para reconsiderar, exploración de caminos distintos.',
    'Selección mecánica de la primera alternativa disponible.',
    '[Ficticio] Observación: Abre dos opciones, las compara y descarta la primera antes de responder.'),
  cat('EXP', 'EXP-PLAN', 'Planificación', ['OBS4'],
    'Evidencias de planificación antes de iniciar una actividad: revisión de herramientas o de la estructura de la tarea.',
    'Inspección del índice o la barra de progreso, lectura de instrucciones, revisión del esquema de pasos antes de comenzar.',
    'Comienzo inmediato e impulsivo sin exploración del entorno.',
    '[Ficticio] Observación: Despliega la guía de pasos antes de pulsar «Iniciar ejercicio».'),
  cat('EXP', 'EXP-MON', 'Monitoreo del aprendizaje', ['OBS5'],
    'Consulta de avances, revisión de respuestas anteriores o seguimiento del propio desempeño.',
    'Consulta del nivel de avance, revisión del historial de intentos o de respuestas previas.',
    'Ignorar por completo el panel de progreso durante la sesión.',
    '[Ficticio] Observación: Revisa su historial de respuestas cada dos ejercicios.'),
  cat('EXP', 'EXP-AUT', 'Autorregulación', ['OBS6'],
    'Cambios observables en la estrategia de aprendizaje después de recibir retroalimentación de error.',
    'Cambio de método tras el error, relectura del concepto, pausa deliberada antes de reintentar.',
    'Reintento a ciegas sin variar la lógica de la respuesta.',
    '[Ficticio] Observación: Tras el fallo regresa al ejemplo teórico y reformula su respuesta.'),
  cat('EXP', 'EXP-RET', 'Respuesta a la retroalimentación', ['OBS8'],
    'Cómo actúa el estudiante después de recibir retroalimentación inmediata del STI (reacción predominante).',
    'Lectura del mensaje, aceptación o rechazo de la pista, reacciones gestuales o conductuales ante el feedback.',
    'Dificultades de comprensión de la interfaz (codificar en Interacción/autonomía).',
    '[Ficticio] Observación: Lee la pista, asiente y abre la explicación del error.'),
  cat('EXP', 'EXP-INT', 'Experiencia de interacción', ['GF1'],
    'Aspectos de la experiencia de trabajar con el STI que resultaron llamativos, novedosos o significativos frente a una clase tradicional.',
    'Comparaciones con la clase tradicional, aspectos novedosos, llamativos o significativos de la interacción.',
    'Comentarios sobre problemas de usabilidad (codificar en Dificultades).',
    '[Ficticio] "Lo que más me llamó la atención fue que el tutor me respondía al instante, sin esperar al profesor."'),
  cat('EXP', 'EXP-DUDA', 'Duda y reconsideración', ['GF3'],
    'Situaciones en las que el estudiante reconsideró una respuesta a partir de información del sistema y cómo actuó ante ellas.',
    'Relatos de dudar de la primera respuesta, cambiar de opinión o suspender el juicio tras una pista o contraejemplo.',
    'Duda por falta de comprensión del lenguaje de la consigna.',
    '[Ficticio] "Pensé que tenía razón, pero la pista me mostró un caso donde fallaba y tuve que frenar."'),
  cat('EXP', 'EXP-RETAUT', 'Retroalimentación y autorregulación', ['GF6'],
    'Reacciones, pensamientos, estrategias y ajustes del estudiante frente al error señalado por el sistema (monitoreo y autorregulación).',
    'Qué pensó o hizo al recibir un aviso de razonamiento inadecuado; estrategias de ajuste declaradas.',
    'Reacciones observadas directamente por el investigador (codificar en OBS6/OBS8).',
    '[Ficticio] "Cuando me dijo que estaba mal, volví a leer el enunciado y probé otro camino."'),
  cat('EXP', 'EXP-GEN', 'Experiencia general', ['E1'],
    'Descripción individual de cómo vivió el estudiante la interacción con el STI.',
    'Relato global de la sesión, tono emocional, valoración de conjunto de la experiencia individual.',
    'Comentarios limitados a una dificultad técnica puntual.',
    '[Ficticio] "Fue diferente a la clase normal; me sentí concentrado porque nadie me apuraba."'),

  // ==========================================
  // PERCEPCIONES
  // ==========================================
  cat('PER', 'PER-APER', 'Apertura a perspectivas', ['OBS3'],
    'Reacción observable del estudiante ante nuevas perspectivas o sugerencias planteadas por el STI.',
    'Lectura, aceptación o aplicación voluntaria de sugerencias y contraejemplos del tutor; actitud de apertura mental.',
    'Acatamiento pasivo de la pista sin inspección ni reformulación.',
    '[Ficticio] Observación: Lee la sugerencia del tutor y reformula su respuesta voluntariamente.'),
  cat('PER', 'PER-PC', 'Pensamiento crítico', ['GF2', 'E3'],
    'Percepción de que el STI promovió cuestionamiento, análisis o profundización; sentir que las actividades desafiaron a analizar de manera diferente.',
    'Afirmaciones de haber cuestionado lo que sabían, pensado más profundamente o analizado la información de otra forma.',
    'Menciones a rapidez o entretenimiento sin referencia al rigor cognitivo.',
    '[Ficticio] "Sentí que el programa me exigía justificar cada paso, no bastaba con adivinar."'),
  cat('PER', 'PER-PERSP', 'Perspectivas', ['GF4'],
    'Percepción sobre la posibilidad de considerar diferentes puntos de vista sobre un mismo problema gracias al STI.',
    'Expresiones de haber visto otras formas válidas de resolver o abordar un problema por mediación del tutor.',
    'Comentarios sobre la rigidez de una clave única.',
    '[Ficticio] "El tutor me mostró motivos que yo no había considerado en mi primer análisis."'),
  cat('PER', 'PER-CONSC', 'Conciencia del aprendizaje', ['GF5'],
    'Percepción sobre el reconocimiento de los propios errores antes de la intervención docente, gracias al STI.',
    'Relatos de darse cuenta del error por guía del tutor antes de que el profesor interviniera.',
    'Casos en que el tutor solo entregó la respuesta sin guiar el descubrimiento del error.',
    '[Ficticio] "El tutor me hizo ver mi error antes de que la profesora pasara por mi puesto."'),
  cat('PER', 'PER-META', 'Metacognición', ['GF7', 'E2'],
    'Percepción de mayor conciencia del propio proceso de aprendizaje, de las dificultades y de las formas de aprender, gracias a las pistas del sistema.',
    'Declaraciones específicas sobre cómo aprenden o qué partes les resultan más difíciles a partir de las pistas del STI.',
    'Afirmaciones genéricas ("aprendo mejor") sin referencia a procesos concretos.',
    '[Ficticio] "Me di cuenta de que tiendo a asumir cosas sin mirar las excepciones."'),
  cat('PER', 'PER-ADAPT', 'Adaptación del STI', ['GF9'],
    'Percepción sobre la capacidad del tutor de adaptarse a lo que cada estudiante necesita o de ofrecer lo mismo a todos.',
    'Opiniones sobre personalización, ritmo, nivel de ayuda o carácter estandarizado de las explicaciones.',
    'Comentarios sobre la estética de la interfaz.',
    '[Ficticio] "Cuando fallaba me daba ejemplos más simples; a mi compañero le dio retos más avanzados."'),
  cat('PER', 'PER-PROP', 'Valoración y mejora', ['GF10', 'E5'],
    'Propuestas de cambio y valoración derivadas de la experiencia con el STI para que ayude mejor a pensar o estudiar.',
    'Propuestas del tipo "le cambiaría", "debería agregar"; sugerencias sobre tono, ayudas o explicaciones.',
    'Quejas aisladas sin propuesta alternativa.',
    '[Ficticio] "Le agregaría la opción de pedirle que me explique el error con un diagrama."'),

  // ==========================================
  // DIFICULTADES
  // ==========================================
  cat('DIF', 'DIF-AUT', 'Interacción/autonomía', ['OBS7'],
    'Presencia o ausencia de dificultades observadas para utilizar la interfaz y desarrollar la actividad de forma fluida y autónoma.',
    'Tropiezos de navegación, necesidad de asistencia, bloqueos con controles o menús; o navegación fluida y autónoma.',
    'Dificultades conceptuales del contenido de la tarea.',
    '[Ficticio] Observación: Hace clic cuatro veces en el texto antes de notar que debía arrastrar el bloque.'),
  cat('DIF', 'DIF-INT', 'Dificultades de interacción', ['GF8', 'E4'],
    'Problemas, frustraciones, confusiones o barreras experimentadas y reportadas por los estudiantes al interactuar con el sistema tutor.',
    'Lo más frustrante o difícil de entender; dificultades con el lenguaje de las consignas, las pistas, el ritmo o la usabilidad.',
    'Propuestas de mejora (codificar en Valoración y mejora).',
    '[Ficticio] "Lo más difícil fue entender qué quería que respondiera; la instrucción era muy enredada."')
];
