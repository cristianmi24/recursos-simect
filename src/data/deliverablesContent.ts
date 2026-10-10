export interface DeliverableSection {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  summary: string;
  contentMarkdown: string;
}

export const DELIVERABLES_DATA: DeliverableSection[] = [
  {
    id: 'entregable-1',
    number: 1,
    title: 'Entregable 1. Especificación Funcional del SIMECT',
    subtitle: 'Propósito, Perfiles de Usuario, Módulos y Fronteras Metodológicas',
    summary: 'Define el marco epistemológico, roles del equipo interdisciplinario, arquitectura de módulos y los límites inviolables entre recolección fáctica e interpretación analítica.',
    contentMarkdown: `### 1. Propósito del Sistema
El **SIMECT** es un entorno digital de investigación cualitativa diseñado específicamente para gestionar, codificar y triangular la información empírica obtenida en el estudio de las **experiencias, percepciones y dificultades** de los estudiantes al interactuar con un Sistema Tutor Inteligente (STI) orientado al desarrollo del pensamiento crítico y la metacognición.

El sistema no opera como un simple repositorio pasivo ni como una caja negra automatizada. Su propósito central es **apoyar el juicio metodológico del equipo investigador**, garantizar la **trazabilidad auditada** desde el fragmento textual o la conducta observada hasta las conclusiones teóricas, y posibilitar la triangulación sistemática entre tres fuentes complementarias:
1. **Observación estructurada (OBS1–OBS8)**: Registro de conducta observable directa.
2. **Grupo focal (GF1–GF10)**: Intervenciones dialógicas grupales.
3. **Entrevista semiestructurada (E1–E5)**: Autoinforme individual en profundidad.

---

### 2. Usuarios y Roles del Sistema
Las funciones siguientes describen responsabilidades del equipo investigador, no cuentas separadas del software. La aplicación actual implementa dos roles: **Tutor** (formularios propios) y **Administración** (gestión del proyecto completo).

- **Investigador Principal (Director Metodológico)**:
  - Aprueba cambios en la Matriz Maestra de Categorías y códigos.
  - Valida la concordancia inter-codificadores y aprueba los reportes analíticos finales.
  - Supervisa el registro de consentimiento informado y el uso de seudónimos; el sistema no captura nombres reales ni puede revertir un seudónimo.
- **Investigador de Campo / Observador**:
  - Registra sesiones de observación estructurada en tiempo real o diferido.
  - Documenta evidencias fácticas y notas contextuales sin emitir juicios categóricos prematuros.
- **Moderador / Entrevistador**:
  - Registra las transcripciones de grupos focales y entrevistas individuales.
  - Asigna turnos de habla a seudónimos de estudiantes (p. ej., \`EST-01\`, \`EST-02\`).
- **Analista Cualitativo / Codificador**:
  - Segmenta unidades hermenéuticas (fragmentos textuales y evidencias observadas).
  - Asocia códigos y dimensiones transversales.
  - Revisa, acepta, ajusta o rechaza sugerencias de codificación asistida.
  - Diligencia la Matriz de Triangulación.

---

### 3. Módulos Funcionales
1. **Módulo de Registro de Instrumentos (Intake & Data Capture)**:
   - Formulación estricta con las 23 preguntas e indicadores precargados sin alteración.
   - Distinción técnica entre campo fáctico (\`observableEvidence\` / \`verbatimResponse\`) y notas contextuales (\`contextualNotes\`).
   - Opción explícita de *"No observado / Información insuficiente"*, impidiendo que la no ocurrencia de una conducta se codifique por error como una respuesta negativa o punitiva.
2. **Módulo de Matriz Maestra de Categorías (Codebook Management)**:
   - Estructura jerárquica con las familias principales (\`EXP\`, \`PER\`, \`DIF\`) y dimensiones transversales (\`PC\`, \`META\`).
   - Gestión de definiciones operacionales, criterios de inclusión/exclusión y registro de control de cambios.
3. **Módulo de Codificación Cualitativa (Coding Workspace)**:
   - Selección de fragmentos y asignación múltiple de códigos.
   - Integración de sugerencias algorítmicas/heurísticas rotuladas obligatoriamente como *"Propuestas pendientes de revisión"*.
4. **Módulo de Triangulación Multifuente (Triangulation Matrix)**:
   - Cruce tridimensional (OBS vs. GF vs. E) clasificado por: Coincidencias, Contradicciones/Divergencias, Complementariedades y Vacíos de Evidencia.
5. **Módulo de Reportes Analíticos (Report Engine)**:
   - Generación de 8 reportes temáticos estructurados con cadenas de citas textuales y bitácoras observacionales directas.
6. **Módulo de Auditoría, Trazabilidad y Exportación**:
   - Bitácora de eventos generada por el servidor y sin edición o borrado desde la aplicación; no es inmutable frente al propietario de Neon ni sustituye copias de seguridad.
   - Uso de seudónimos sin mecanismo de reidentificación. El texto libre aún puede identificar a participantes y debe revisarse.
   - Exportación estructurada (JSON, CSV, Markdown) para interoperabilidad con CAQDAS como ATLAS.ti, MAXQDA o NVivo.

---

### 4. Límites y Salvaguardas Metodológicas Obligatorias
- **No suplantación del juicio humano**: El sistema nunca emite conclusiones automatizadas independientes. La inteligencia computacional solo sugiere; el investigador humano valida y argumenta.
- **Separación epistemológica estricta**:
  - *Conducta observable ≠ Estado mental interno*: Una conducta de pausa ante la pantalla (OBS1) no demuestra introspección metacognitiva por sí sola; requiere triangulación con GF o E.
  - *Percepción del estudiante ≠ Efecto objetivo de aprendizaje*: Que un estudiante declare en E1 que "aprendió el doble" es una percepción subjetiva, no una métrica de ganancia cognitiva objetiva.
- **Prohibición de cuantificación falaz**: El sistema prohíbe calcular porcentajes generales engañosos (p. ej., "el 80% de los estudiantes son críticos") cuando la muestra es intencional o cuando el denominador no está debidamente especificado por unidad de análisis.`
  },
  {
    id: 'entregable-2',
    number: 2,
    title: 'Entregable 2. Matriz Maestra de Categorías y Subcategorías',
    subtitle: 'Estructura Jerárquica, Definiciones Operacionales y Criterios de Inclusión/Exclusión',
    summary: 'Presenta el libro de códigos completo (Codebook) con 24 categorías distribuidas en 3 familias centrales (EXP, PER, DIF) y 2 dimensiones transversales (PC, META).',
    contentMarkdown: `### Matriz Maestra del SIMECT

A continuación se detalla la configuración del sistema de categorías. Todos los ejemplos han sido formulados con fines ilustrativos y están **explícitamente identificados como ficticios**.

| Código | Familia | Subcategoría | Definición Operacional | Indicadores Relacionados | Criterios de Inclusión | Criterios de Exclusión | Ejemplo Ilustrativo (Ficticio) |
|---|---|---|---|---|---|---|---|
| **EXP-GEN** | EXP | Experiencia general con el STI | Vivencia global manifestada u observada durante la interacción con el sistema tutor. | OBS7, GF1, E1 | Alusiones al ambiente de trabajo global y comparaciones con la clase tradicional. | Dificultades operativas acotadas exclusivamente al hardware o red. | *[Ficticio]* "Trabajar hoy con el tutor me pareció más tranquilo porque avancé a mi ritmo." |
| **EXP-INT** | EXP | Interacción con el tutor | Modalidad y ritmo de diálogo e intercambio operativo entre el estudiante y los componentes interactivos. | OBS7, GF1, GF9, E4 | Tiempo dedicado a leer diálogos del tutor, consultas a la ayuda y navegación por herramientas. | Respuestas ante mensajes de error o fallos específicos (usar EXP-RET). | *[Ficticio]* Observación: El estudiante consulta la guía de pistas antes de formular el segundo paso. |
| **EXP-ANA** | EXP | Análisis de información | Proceso de lectura atenta, examen de premisas y contraste de datos provistos antes de responder. | OBS1, GF2, E3 | Conductas de pausa prolongada ante tablas/gráficos, lectura previa sin clics prematuros. | Clics aleatorios de ensayo y error sin lectura de enunciados. | *[Ficticio]* Observación: El estudiante tarda 80 segundos examinando las dos hipótesis antes de marcar. |
| **EXP-ALT** | EXP | Evaluación de alternativas | Exploración, comparación y deliberación consciente entre dos o más opciones de solución. | OBS2, GF3, GF4, E3 | Verbalizaciones o conductas donde se contrastan pros y contras de opciones antes de elegir. | Selección mecánica de la primera alternativa disponible por descarte ciego. | *[Ficticio]* "Comparé la opción B con la C porque ambas tenían premisas parecidas pero diferente conclusión." |
| **EXP-DUDA** | EXP | Duda y reconsideración | Suspensión temporal del juicio provocada por contraejemplos o pistas que desafían certezas iniciales. | OBS2, GF3 | Rectificación de una elección previa tras leer una objeción presentada por el sistema. | Duda provocada por problemas de traducción o fallos de renderizado de la interfaz. | *[Ficticio]* "Creí que la respuesta era obvia, pero el contraejemplo del tutor me hizo pausar y dudar." |
| **EXP-PLAN** | EXP | Planificación | Anticipación estructurada de pasos, objetivos o herramientas antes de resolver la actividad. | OBS4 | Inspección del mapa del módulo, lectura de la rúbrica previa a la acción. | Inicio impulsivo sin exploración del entorno de la tarea. | *[Ficticio]* Observación: Revisa el esquema general de 5 pasos antes de presionar el botón «Comenzar». |
| **EXP-MON** | EXP | Monitoreo del aprendizaje | Supervisión en tiempo real del progreso, consulta de niveles de avance o verificación de respuestas previas. | OBS5, GF6, E2 | Apertura voluntaria de la barra de progreso, autoexamen de respuestas anteriores. | Ignorar completamente el estado de avance a lo largo de toda la sesión. | *[Ficticio]* "Iba mirando la barra de aciertos para asegurarme de no haber tropezado en la inferencia." |
| **EXP-AUT** | EXP | Autorregulación | Modificación deliberada de tácticas de estudio o formulación de hipótesis tras identificar un error. | OBS6, GF5, GF6, E2 | Cambio consciente de método de análisis tras recibir retroalimentación correctiva. | Persistencia obstinada en la misma respuesta fallida sin variar el razonamiento. | *[Ficticio]* Observación: Tras el error, regresa a la definición teórica antes de formular un nuevo intento. |
| **EXP-RET** | EXP | Respuesta a la retroalimentación | Comportamiento observable y actitud manifestada ante las pistas o mensajes correctivos del tutor. | OBS3, OBS8, GF6 | Lectura atenta de la pista, asimilar sugerencias, gestos de receptividad o rechazo. | Respuestas a consignas iniciales sin retroalimentación previa del sistema. | *[Ficticio]* Observación (OBS8): Lee detenidamente el mensaje del tutor y toma nota en su libreta antes de reintentar. |
| **PER-PC** | PER | Aporte percibido al pensamiento crítico | Juicio valorativo del estudiante sobre si el STI lo estimuló a profundizar, justificar y cuestionar. | GF2, E3 | Declaraciones de sentirse desafiado a dar razones y no conformarse con la primera impresión. | Comentarios sobre la velocidad del software sin relación con el rigor cognitivo. | *[Ficticio]* "El tutor no me dejaba adivinar; me obligaba a justificar por qué descartaba una opción." |
| **PER-APER** | PER | Apertura a diferentes perspectivas | Percepción de haber sido expuesto a múltiples puntos de vista válidos o soluciones alternativas. | OBS3, GF4 | Reconocimiento de que un problema admite interpretaciones diversas válidas. | Afirmaciones sobre la existencia de una única verdad rígida dictada por el sistema. | *[Ficticio]* "Me mostró cómo alguien con otra postura argumentaría el mismo dilema." |
| **PER-CONSC** | PER | Conciencia del aprendizaje | Reconocimiento explícito de fortalezas, debilidades y transformaciones en la propia comprensión. | GF7, E2 | Señalamiento puntual de vacíos conceptuales detectados durante la sesión. | Afirmaciones genéricas tipo "aprendí mucho" sin especificar conceptos o procesos. | *[Ficticio]* "Me di cuenta de que tiendo a confundir una correlación con una causa directa." |
| **PER-META** | PER | Metacognición percibida | Valoración de la capacidad del STI para actuar como andamio de la autorreflexión mental. | GF5, GF7, E2 | Referencias a que las preguntas del tutor funcionaron como un autoexamen interno. | Alusiones exclusivas a la nota numérica obtenida en la tarea. | *[Ficticio]* "Las pistas eran como una voz que me preguntaba: ¿estás seguro de que tu prueba es sólida?" |
| **PER-ADAPT** | PER | Percepción de adaptación del STI | Juicio sobre si el tutor personaliza sus ayudas a las necesidades singulares del estudiante. | GF9 | Opiniones sobre si las pistas eran individualizadas o genéricas para todo el grupo. | Comentarios centrados exclusivamente en los colores de la interfaz. | *[Ficticio]* "Sentí que el tutor se dio cuenta de en qué me equivocaba y me dio pistas a mi medida." |
| **PER-VAL** | PER | Valoración del STI | Evaluación general de utilidad y satisfacción frente a la mediación del tutor inteligente. | GF1, E1 | Expresiones de recomendación, valoración pedagógica positiva o utilidad académica. | Propuestas concretas de rediseño técnico (codificar en PER-PROP). | *[Ficticio]* "Me pareció una herramienta muy útil para prepararme antes de las discusiones grupales." |
| **PER-PROP** | PER | Propuestas de mejora | Sugerencias planteadas por los estudiantes para optimizar las funciones pedagógicas o técnicas. | GF10, E5 | Propuestas formuladas como "debería agregar", "le cambiaría", "sería mejor si...". | Quejas aisladas que no aportan ninguna alternativa constructiva. | *[Ficticio]* "Le cambiaría que permita escribir con mis propias palabras en vez de solo botones." |
| **DIF-INT** | DIF | Dificultades de interacción | Obstáculos de navegación, ergonomía o comprensión de los controles de la interfaz del STI. | OBS7, GF8, E4 | Confusión con botones, desorientación espacial en la pantalla, lentitud en los clics. | Dificultades causadas por falta de conocimiento conceptual de la materia. | *[Ficticio]* Observación (OBS7): Clics reiterados sobre texto no interactivo buscando la opción de envío. |
| **DIF-COMP** | DIF | Comprensión de las actividades | Problemas para interpretar instrucciones, enunciados o vocabulario técnico de los ejercicios. | OBS1, GF8, E4 | Dudas sobre qué se solicita hacer, preguntas al observador sobre términos del texto. | Desacuerdo con la corrección tras haber respondido con claridad (usar DIF-RET). | *[Ficticio]* "El enunciado tenía palabras muy complejas que no entendí hasta que leí el glosario." |
| **DIF-RET** | DIF | Dificultades ante la retroalimentación | Ambigüedad, incomprensión o desacuerdo frente a las pistas y explicaciones del tutor. | OBS8, GF6, GF8, E4 | Declaraciones de que la pista era confusa o que el tutor no explicó el motivo del error. | Enojo emocional puro sin señalamiento del contenido explicativo. | *[Ficticio]* "El tutor me dijo que mi silogismo era falso, pero nunca me explicó cuál término falló." |
| **DIF-AJUSTE** | DIF | Dificultades para ajustar estrategias | Bloqueo o persistencia compulsiva en la respuesta errada sin formular una nueva hipótesis. | OBS6, GF6, E4 | Clics inmediatos en la misma opción fallida en múltiples intentos continuos. | Modificación reflexiva y exitosa tras una lectura atenta del fallo. | *[Ficticio]* Observación (OBS6): El estudiante vuelve a pulsar la opción B tres veces consecutivas tras el error. |
| **DIF-FRUST** | DIF | Frustración | Respuestas afectivas negativas intensas (desánimo, irritación, impotencia o ganas de abandonar). | OBS8, GF8 | Gestos de irritación física, expresiones verbales de disgusto manifiesto con el tutor. | Cansancio visual general por tiempo prolongado frente al monitor. | *[Ficticio]* "Me dio mucha rabia que no aceptara mi idea y tuve ganas de cerrar el programa." |
| **DIF-MEJORA** | DIF | Necesidades de mejora identificadas | Deficiencias estructurales o vacíos metodológicos detectados que ameritan reingeniería del STI. | GF10, E5 | Solicitudes de inclusión de explicaciones en video, diagramas o retroalimentación dialogada. | Deseos de videojuegos o música de fondo irrelevantes para la pedagogía. | *[Ficticio]* "Hacen falta diagramas lógicos interactivos para ver visualmente la contradicción." |

---

### Dimensiones Transversales (Pensamiento Crítico y Metacognición)

Estas dimensiones se aplican sobre los fragmentos y categorías anteriores como una **segunda capa analítica**:

1. **PC (Pensamiento Crítico)**:
   - **PC-ANALISIS**: Descomposición de premisas, argumentos y evidencias fácticas (OBS1, GF2, E3).
   - **PC-EVAL**: Ponderación sistemática de opciones, solidez lógica y contraargumentos (OBS2, GF3, GF4, E3).
   - **PC-APER**: Flexibilidad cognitiva y receptividad ante perspectivas disidentes (OBS3, GF4).
   - **PC-CUEST**: Disposición a interrogar certezas preestablecidas y formular preguntas dialógicas (GF2, E3, E5).

2. **META (Metacognición)**:
   - **META-PLAN**: Planificación anticipada de metas, tiempos y secuencias de resolución (OBS4).
   - **META-MON**: Autoobservación y calibración en tiempo real del nivel de comprensión (OBS5, GF5, GF7, E2).
   - **META-REG**: Autorregulación y ajuste correctivo de estrategias de razonamiento tras detectar desvíos (OBS6, GF6, E2).`
  },
  {
    id: 'entregable-3',
    number: 3,
    title: 'Entregable 3. Modelo de Datos y Esquema Relacional',
    subtitle: 'Entidades, Atributos, Integridad Referencial y Trazabilidad',
    summary: 'Especifica la arquitectura de almacenamiento de datos garantizando la separación física y lógica entre el dato empírico primario y las interpretaciones hermenéuticas de los investigadores.',
    contentMarkdown: `### 1. Principio Arquitectónico de Doble Capa
El modelo de datos implementa una separación inviolable entre:
- **Capa de formularios**: Respuestas y transcripciones almacenadas en Neon con acceso por rol y propietario. En esta versión no se calcula un hash ni se promete inmutabilidad; Administración puede actualizar o retirar una sesión, y la aplicación registra esos eventos.
- **Capa analítica**: Categorías, fragmentos codificados y triangulaciones se guardan por separado en un estado administrativo versionado. La exportación y las copias de seguridad deben gestionarse como datos sensibles.

---

### 2. Entidades Principales y Atributos

#### A. Entidad \`ResearchSession\` (Sesión de Investigación)
- \`id\` (UUID): Clave primaria única.
- \`instrumentType\` (Enum): \`OBS\` | \`GF\` | \`E\`.
- \`instrumentCode\` (String): Identificador institucional (p. ej., \`OBS-2026-001\`).
- \`date\` (Date): Fecha de aplicación en formato ISO 8601.
- \`institution\` (String): Institución educativa.
- \`grade\` (String): Grado o curso académico.
- \`sessionNumber\` (Integer): Número de sesión de la intervención con el STI.
- \`stiVersionOrTask\` (String): Módulo pedagógico ejecutado en el STI.
- \`researcherName\` (String): Investigador responsable del diligenciamiento.
- \`studentPseudonym\` (String, opcional): Seudónimo del participante (para OBS y E).
- \`participantPseudonyms\` (Array<String>, opcional): Lista de seudónimos (para GF).
- \`recordingConsentApproved\` (Boolean): Verificación de consentimiento informado y autorización de grabación.
- \`audioRecordingRef\` (String, opcional): Identificador o URL segura del archivo de audio/video.
- \`createdAt\`, \`updatedAt\` (Timestamp): Trazabilidad temporal.

#### B. Entidad \`ObservationRecord\` (Registro de Indicador Observado)
- \`id\` (UUID): Clave primaria.
- \`sessionId\` (FK -> \`ResearchSession.id\`): Sesión a la que pertenece.
- \`questionId\` (String): \`OBS1\` a \`OBS8\`.
- \`observed\` (Enum): \`true\` | \`false\` | \`not_applicable\` (*No observado / Información insuficiente*).
- \`scaleValue\` (String): Valor registrado en la escala prevista (Sí, No, Parcialmente, o Tipología de Reacción en OBS8).
- \`observableEvidence\` (Text): Descripción factual de la conducta observada sin adjetivación interpretativa.
- \`contextualNotes\` (Text): Notas contextuales de campo del observador.
- \`notObservedReason\` (Text, opcional): Explicación metodológica de por qué el indicador no pudo registrarse.

#### C. Entidad \`FocusGroupRecord\` (Registro de Turnos de Habla en Grupo Focal)
- \`id\` (UUID): Clave primaria.
- \`sessionId\` (FK -> \`ResearchSession.id\`).
- \`questionId\` (String): \`GF1\` a \`GF10\`.
- \`turns\` (JSON / Array de Objetos):
  - \`turnId\` (UUID).
  - \`participantPseudonym\` (String): Atribución individual de la intervención.
  - \`text\` (Text): Transcripción textual de lo expresado.
  - \`contextualNotes\` (Text): Gestos, tono, dinámicas del grupo durante la intervención.
- \`moderatorNotes\` (Text): Reflexiones globales del moderador para esa pregunta.

#### D. Entidad \`InterviewRecord\` (Registro de Entrevista Semiestructurada)
- \`id\` (UUID): Clave primaria.
- \`sessionId\` (FK -> \`ResearchSession.id\`).
- \`questionId\` (String): \`E1\` a \`E5\`.
- \`verbatimResponse\` (Text): Respuesta textual completa del estudiante.
- \`probingQuestions\` (Text): Preguntas de profundización o repreguntas formuladas por el entrevistador.
- \`contextualNotes\` (Text): Reacciones emocionales o lenguaje paraverbal observado.

#### E. Entidad \`CategoryDefinition\` (Libro de Códigos / Matriz de Categorías)
- \`id\` (String): Identificador canónico (p. ej., \`EXP-GEN\`, \`PC-ANALISIS\`).
- \`family\` (Enum): \`EXP\` | \`PER\` | \`DIF\` | \`PC\` | \`META\`.
- \`code\` (String): Código corto.
- \`name\` (String): Denominación de la categoría o subcategoría.
- \`isTransversal\` (Boolean): Flag que indica si es dimensión transversal (\`PC\` o \`META\`).
- \`operationalDefinition\` (Text): Definición metodológica unívoca.
- \`inclusionCriteria\` (Text): Reglas formales de inclusión.
- \`exclusionCriteria\` (Text): Reglas formales de exclusión.
- \`relatedIndicators\` (Array<String>): Vínculos con los 23 indicadores/preguntas.
- \`illustrativeExample\` (Text): Ejemplo modélico (marcado como ficticio).
- \`auditTrail\` (JSON): Historial de creación, modificación y responsable.

#### F. Entidad \`CodedFragment\` (Fragmento Codificado / Unidad Hermenéutica)
- \`id\` (UUID): Clave primaria.
- \`sessionId\` (FK -> \`ResearchSession.id\`).
- \`instrumentType\` (Enum): \`OBS\` | \`GF\` | \`E\`.
- \`questionId\` (String): Indicador o pregunta de origen.
- \`participantPseudonym\` (String, opcional): Atribución al estudiante.
- \`excerptText\` (Text): Cita textual exacta o fragmento de evidencia observable.
- \`categoryIds\` (Array<String>): Uno o varios códigos asociados (multicodificación).
- \`transversalDimensionIds\` (Array<String>): Códigos transversales (PC o META).
- \`justification\` (Text): Fundamentación epistemológica de por qué se asignó el código.
- \`status\` (Enum): \`propuesta_pendiente\` | \`revisada_aceptada\` | \`modificada\` | \`rechazada\`.
- \`suggestedByAI\` (Boolean): Flag de sugerencia asistida.
- \`researcherName\` (String): Nombre del investigador que validó la codificación.
- \`dateCoded\` (Date): Fecha de la acción.

#### G. Entidad \`TriangulationMatrixEntry\` (Entrada de la Matriz de Triangulación)
- \`id\` (UUID): Clave primaria.
- \`categoryId\` (FK -> \`CategoryDefinition.id\`).
- \`transversalDimensionId\` (String, opcional).
- \`obsEvidenceSummary\` (Text): Síntesis de hallazgos observacionales.
- \`obsFragmentIds\` (Array<UUID>): Vínculos auditados a fragmentos de OBS.
- \`gfEvidenceSummary\` (Text): Síntesis de hallazgos del grupo focal.
- \`gfFragmentIds\` (Array<UUID>): Vínculos auditados a fragmentos de GF.
- \`interviewEvidenceSummary\` (Text): Síntesis de entrevistas individuales.
- \`interviewFragmentIds\` (Array<UUID>): Vínculos auditados a fragmentos de E.
- \`coincidences\` (Text): Convergencias entre las fuentes.
- \`divergencesAndContradictions\` (Text): Discrepancias o tensiones epistemológicas.
- \`complementaryFindings\` (Text): Aportes específicos que amplían la comprensión.
- \`absenceOfEvidenceNotes\` (Text): Justificación de fuentes sin evidencia (sin sesgo punitivo).
- \`researcherInterpretation\` (Text): Hermenéutica sintética fundamentada.
- \`pendingQuestions\` (Text): Interrogantes metodológicos abiertos.

#### H. Entidad \`AuditLogEntry\` (Registro de Auditoría y Trazabilidad)
- \`id\` (UUID).
- \`timestamp\` (ISO 8601).
- \`action\` (Enum de acciones del sistema).
- \`entityType\` (String).
- \`entityId\` (String).
- \`researcher\` (String).
- \`summary\` (String): Descripción concisa del cambio para auditoría metodológica.`
  },
  {
    id: 'entregable-4',
    number: 4,
    title: 'Entregable 4. Flujos de Trabajo Metodológicos',
    subtitle: 'Procedimiento Operativo desde la Recolección en Campo hasta el Reporte Analítico',
    summary: 'Describe las 6 fases sucesivas del flujo investigativo, los hitos de control de calidad y los puntos de decisión colegiados.',
    contentMarkdown: `### Flujo Metodológico Integral en 6 Fases

\`\`\`
[1. Recolección en Campo] 
      │ (OBS en tiempo real / Grabación GF y E)
      ▼
[2. Ingreso y Transcripción Digital] 
      │ (Doble capa: Dato Bruto sellado + Notas de contexto)
      ▼
[3. Segmentación y Codificación Cualitativa]
      │ (Multicodificación + Sugerencias asistidas rotuladas como pendientes)
      ▼
[4. Control de Consistencia Inter-Investigadores]
      │ (Revisión colegiada, aceptación/rechazo, trazabilidad de cambios)
      ▼
[5. Triangulación Multifuente Cruzada]
      │ (Cruce OBS + GF + E por categorías y dimensiones PC / META)
      ▼
[6. Generación de Reportes Analíticos Auditables]
      │ (Conclusiones encadenadas a citas textuales y bitácoras directas)
      ▼
[Publicación y Transferencia Científica]
\`\`\`

---

### Descripción Detallada de las Fases

#### Fase 1. Recolección en Campo y Diligenciamiento de Protocolos
1. El equipo verifica que la sesión cuente con el **consentimiento informado institucional y parental** para la interacción con el STI y el registro de audio.
2. **Observación estructurada**: El observador no interviene en la interacción del estudiante con el STI; diligencia los 8 indicadores (OBS1–OBS8) en una tableta o libreta de campo, consignando minuciosamente evidencias conductuales (tiempos de pausa, dirección de la mirada, clics erráticos).
3. **Grupo focal y entrevista**: El moderador formula las preguntas orales originales (GF1–GF10 o E1–E5), garantizando un clima de confianza que desaliente respuestas por deseabilidad social.

#### Fase 2. Registro Digital y Preservación del Dato Primario
1. Se abre el Módulo de Registro de Instrumentos y se crea una nueva sesión vinculada al colegio, grado, fecha y código de seudónimo.
2. Se digitan las transcripciones o registros de observación.
3. Si un indicador no pudo ser evaluado (p. ej., el STI no emitió retroalimentación de error en esa sesión para OBS6), se marca obligatoriamente como **"No observado / Información insuficiente"** y se anota el motivo, evitando registrarlo como una negativa del estudiante.

#### Fase 3. Segmentación de Unidades Hermenéuticas y Codificación
1. El analista selecciona fragmentos significativos de las respuestas o bitácoras observables.
2. Asocia la unidad hermenéutica con una o más categorías del libro de códigos (\`EXP\`, \`PER\`, \`DIF\`) y dimensiones transversales (\`PC\`, \`META\`).
3. Si se activa la asistencia algorítmica, esta analiza el fragmento y propone códigos tentativos. El sistema los marca con el estado **"Propuesta pendiente de revisión"**.
4. El analista humano examina la pertinencia de la sugerencia a la luz de los criterios de inclusión/exclusión y toma una decisión explícita: **Aceptar**, **Modificar** o **Rechazar**.

#### Fase 4. Sesión de Consenso y Auditoría de Categorías
1. Cuando surgen fenómenos emergentes no contemplados en el libro de códigos inicial, el analista no crea códigos ad-hoc de manera unilateral.
2. Se convoca una breve sesión de consenso donde se propone la nueva subcategoría con su definición operacional y criterios de inclusión/exclusión.
3. Al aprobarse en el sistema, la bitácora registra quién solicitó el cambio y por qué motivo, actualizando el Codebook sin romper los enlaces previos.

#### Fase 5. Triangulación de Fuentes en la Matriz Cruzada
1. En el Módulo de Triangulación, el equipo selecciona una categoría (p. ej., \`EXP-AUT: Autorregulación\`) o una dimensión transversal (p. ej., \`META-REG\`).
2. El sistema muestra simultáneamente las evidencias provenientes de:
   - Observación (¿Ajustó realmente su conducta tras el error?).
   - Grupo focal (¿Qué expresaron colectivamente sobre el reproche del tutor?).
   - Entrevista (¿Cómo experimentó individualmente la rectificación de su error?).
3. El equipo documenta:
   - **Coincidencias**: Convergencias claras entre discurso y conducta.
   - **Divergencias o Contradicciones**: Por ejemplo, estudiantes que en la entrevista afirman "reflexionar con calma" (E2), pero en la observación se evidenciaron clics compulsivos (OBS6).
   - **Complementariedades**: Detalles emocionales del grupo focal que explican la frustración observada en OBS8.

#### Fase 6. Producción de Reportes y Validación de Hallazgos
1. Se generan los reportes temáticos correspondientes.
2. Cada aseveración analítica se respalda con hipervínculos o citas identificadas por seudónimo y sesión.
3. Se verifica que no se incluyan porcentajes muestrales sin justificación del denominador y la unidad de análisis.`
  },
  {
    id: 'entregable-5',
    number: 5,
    title: 'Entregable 5. Diseño de Interfaces y Experiencia de Usuario',
    subtitle: 'Arquitectura Visual, Vistas Especializadas y Ergonomía del Software',
    summary: 'Especifica la distribución funcional de pantallas, flujos de navegación y componentes interactivos diseñados para una alta densidad informativa y rigor científico.',
    contentMarkdown: `### Principios de Diseño de la Interfaz
1. **Densidad informativa balanceada**: Tipografía limpia con contraste nítido, diseñada para jornadas prolongadas de lectura y análisis sin fatiga visual.
2. **Jerarquía visual inequívoca**:
   - Insignias de colores normalizadas por familia:
     - \`EXP\` (Azul pizarra / Slate / Indigo)
     - \`PER\` (Esmeralda / Verde azulado / Teal)
     - \`DIF\` (Ámbar / Naranja / Rose)
     - \`PC\` y \`META\` (Púrpura / Violeta con ribete distintivo transversal)
3. **Retroalimentación de estado**: Cada fragmento codificado muestra su estado metodológico: *Propuesta pendiente* (amarillo), *Aceptada* (verde), *Modificada* (azul), *Rechazada* (gris tachado).

---

### Pantallas Principales del Sistema

#### 1. Panel de Control y Catálogo de Sesiones (Intake Dashboard)
- Barra superior con métricas clave: Total de Sesiones, Registros por Instrumento (OBS, GF, E), Fragmentos Codificados, Grado de Cobertura de Categorías.
- Filtros multifactoriales: Por instrumento, institución educativa, grado, fecha y seudónimo de estudiante.
- Botón de creación rápida con selector de protocolo: Observación, Grupo Focal o Entrevista.
- Conmutador para mostrar u ocultar seudónimos en la exportación CSV de fragmentos; no anonimiza transcripciones ni reemplaza la revisión manual de texto identificable.

#### 2. Formulario de Captura Dinámica de Instrumentos
- Encabezado con metadatos de sesión (Institución, Grado, Código, Evaluador, Consentimiento de audio).
- Lista desplegable o tarjetas de las preguntas precargadas:
  - Para **OBS (1 a 8)**: Selector de escala (Sí, No, Parcialmente, No observado) + Área de texto para *Evidencia Conductual Observable* + Área de texto para *Notas de Campo del Observador*.
  - Para **OBS8**: Selector tipológico especializado con aviso sobre la resolución de la inconsistencia del instrumento físico.
  - Para **GF (1 a 10)**: Gestor dinámico de turnos de habla con selector de seudónimo (\`EST-01\`, \`EST-02\`, etc.), transcripción textual y notas del moderador.
  - Para **E (1 a 5)**: Área de respuesta textual íntegra + Campo para preguntas de repregunta/profundización + Notas contextuales.

#### 3. Gestor de la Matriz Maestra de Categorías (Codebook Explorer)
- Vista en acordeón y árbol jerárquico por familias (\`EXP\`, \`PER\`, \`DIF\`, \`PC\`, \`META\`).
- Ficha técnica completa de cada categoría: Definición operacional, indicadores vinculados, criterios de inclusión/exclusión, ejemplo modélico ficticio y trazabilidad de cambios.
- Modal de edición auditada: Permite crear o modificar categorías solicitando motivo y autor responsable.

#### 4. Espacio de Trabajo de Codificación Cualitativa (Coding Workspace)
- Panel dividido en dos columnas:
  - **Columna izquierda**: Visor de transcripciones y registros empíricos con resaltado de fragmentos.
  - **Columna derecha**: Herramientas de asignación de códigos, justificación teórica, estado de revisión y disparador del asistente algorítmico de sugerencias.
- Listado de fragmentos con filtros por estado de revisión (\`propuesta_pendiente\`, \`revisada_aceptada\`, etc.) para agilizar el arbitraje inter-jueces.

#### 5. Matriz de Triangulación Cruzada (Triangulation Matrix)
- Tabla comparativa de tres columnas para contrastar evidencias empíricas:
  - Columna 1: Observación Estructurada (OBS).
  - Columna 2: Grupo Focal (GF).
  - Columna 3: Entrevista Semiestructurada (E).
- Bloque analítico inferior para registrar: Coincidencias, Contradicciones, Complementariedades, Ausencias de Evidencia Justificadas, Interpretación Hermenéutica y Preguntas Abiertas.

#### 6. Visor de Reportes Analíticos y Dossier Metodológico
- Selector de los 8 reportes temáticos obligatorios.
- Panel de exportación formal (Markdown, HTML imprimible, CSV y JSON consolidado).`
  },
  {
    id: 'entregable-6',
    number: 6,
    title: 'Entregable 6. Reglas de Análisis y Rigor Cualitativo',
    subtitle: 'Criterios Epistemológicos, Prevención de Sesgos y Normas de Interpretación',
    summary: 'Establece los principios científicos de credibilidad, transferibilidad, consistencia y confirmabilidad, así como las restricciones lógicas para evitar sobreinterpretar los datos.',
    contentMarkdown: `### 1. Criterios de Rigor Científico (Guba & Lincoln, 1985)
El sistema opera bajo los cuatro cánones fundamentales de la investigación cualitativa:
- **Credibilidad (Validez Interna)**: Salvaguardada mediante la triangulación sistemática entre los 3 instrumentos y la verificación de miembros (member checking diferido).
- **Transferibilidad (Validez Externa)**: Asegurada mediante la descripción contextual densa (*thick description*) de las instituciones, tareas y condiciones del STI.
- **Consistencia / Dependabilidad (Confiabilidad)**: La bitácora de eventos y el estado versionado apoyan la trazabilidad, pero no garantizan por sí solos la confiabilidad ni son inmutables frente al propietario de la base de datos.
- **Confirmabilidad (Objetividad Hermenéutica)**: Alcanzada mediante la separación estricta entre el dato bruto textual/conductual y las interpretaciones del investigador.

---

### 2. Reglas Epistemológicas Inviolables

#### Regla 1. La conducta observable no demuestra por sí sola el estado mental o afectivo
- **Prohibición**: Registrar en OBS1 *"El estudiante dudó de su capacidad intelectual"* a partir de una pausa de 20 segundos frente a la pantalla.
- **Procedimiento correcto**: Registrar la evidencia fáctica: *"El estudiante permaneció 20 segundos sin mover el cursor antes de hacer clic en la opción B"*. La hipótesis de duda solo adquiere validez si se triangula con una intervención del grupo focal (GF3) o de la entrevista (E3) donde el estudiante declare haber experimentado inseguridad o reconsideración.

#### Regla 2. La percepción del estudiante no constituye prueba objetiva de aprendizaje cognitivo
- **Prohibición**: Concluir en los reportes *"El STI aumentó la capacidad de pensamiento crítico de los estudiantes en un 40%"* fundamentándose únicamente en que en E3 los alumnos dijeron *"sentirse más inteligentes o críticos"*.
- **Procedimiento correcto**: Redactar el hallazgo en términos estrictos de autoinforme: *"Los estudiantes perciben un estímulo positivo hacia el pensamiento crítico (PER-PC), manifestando que las preguntas socráticas del tutor los obligaron a reflexionar; no obstante, esta percepción subjetiva debe cotejarse con la solidez de sus respuestas y la persistencia en el análisis observada en OBS1 y OBS2"*.

#### Regla 3. La ausencia de evidencia no equivale a un resultado negativo
- **Prohibición**: Asumir que si un estudiante no recibió retroalimentación de error durante su sesión de observación (OBS6 = "No observado"), el estudiante *"carece de habilidades de autorregulación"*.
- **Procedimiento correcto**: Marcar el indicador como *"No observado / Información insuficiente"*, indicando en la nota metodológica que la situación interactiva no brindó la oportunidad contextual para que la conducta emergiera. En la Matriz de Triangulación, registrar dicha ausencia como un límite contextual, sin penalizar al sujeto.

#### Regla 4. Prohibición de cuantificación falaz y porcentajes espurios
- **Prohibición**: Presentar tablas con porcentajes tipo *"El 75% de los estudiantes del colegio comprenden el STI"* cuando se analizaron 8 entrevistas semiestructuradas y 2 grupos focales intencionales.
- **Procedimiento correcto**: Utilizar descriptores cualitativos fundamentados (*"la mayoría de los participantes entrevistados"*, *"en 6 de los 8 casos analizados"*, *"un patrón recurrente evidenciado en..."*). Cualquier métrica cuantitativa requerirá explicitar formalmente el universo, el tamaño de la muestra intencional, el denominador exacto y la advertencia de no representatividad inferencial.

#### Regla 5. Trazabilidad hermenéutica de las conclusiones
- Cada conclusión presentada en los reportes finales debe estar anclada a una cadena verificable:
  \`[Conclusión] -> [Patrón Identificado] -> [Códigos Asignados] -> [Fragmentos Textuales / Evidencias Observadas] -> [Sesión / Seudónimo del Sujeto]\`.`
  },
  {
    id: 'entregable-7',
    number: 7,
    title: 'Entregable 7. Plan de Implementación y Batería de Pruebas',
    subtitle: 'Fases de Despliegue, Criterios de Aceptación y Pruebas Metodológicas',
    summary: 'Plan detallado por etapas operativas con pruebas unitarias, de integración y de consistencia metodológica inter-jueces.',
    contentMarkdown: `### Plan de Implementación por Fases

| Fase | Denominación | Duración Estimada | Entregables Técnicos y Metodológicos | Criterios de Aceptación |
|---|---|---|---|---|
| **Fase 1** | Modelado Conceptual y Configuración de Instrumentos | Semana 1–2 | Base de datos tipada, catálogo de las 23 preguntas/indicadores, matriz de categorías inicial precargada. | Validación completa de las redacciones textuales originales de OBS1-OBS8, GF1-GF10 y E1-E5 sin modificaciones inconsultas. |
| **Fase 2** | Desarrollo del Módulo de Registro y Codificación | Semana 3–4 | Pantallas de captura de observación, turnos de grupo focal y entrevistas. Espacio de codificación con soporte multicódigo y trazabilidad. | Capacidad demostrada de almacenar registros de campo distinguiendo dato bruto de notas de contexto; registro de seudónimos. |
| **Fase 3** | Motor de Triangulación y Asistente de Sugerencias | Semana 5–6 | Matriz de triangulación tridimensional, módulo de sugerencias algorítmicas con rótulo de "propuesta pendiente" y acciones Aceptar/Modificar/Rechazar. | La matriz permite cruzar evidencias de los 3 instrumentos por categoría; las sugerencias automáticas nunca se consolidan sin aprobación humana. |
| **Fase 4** | Generador de Reportes Analíticos y Anonimización | Semana 7–8 | 8 reportes temáticos estructurados con encadenamiento de evidencias, alternancia de anonimización y exportador JSON/CSV/Markdown. | Generación de reportes libres de porcentajes ilegítimos; exportación completa de la pista de auditoría. |
| **Fase 5** | Pruebas Piloto y Validación con Investigadores Reales | Semana 9 | Taller de entrenamiento con el equipo de investigación, codificación de 3 sesiones piloto y ajuste fino de usabilidad. | Índice Kappa de Cohen o acuerdo inter-jueces superior al 80% en categorías centrales; cero pérdida de datos. |

---

### Batería de Pruebas Metodológicas y Funcionales

1. **Prueba de Inmutabilidad del Dato Primario**:
   - *Procedimiento*: Modificar una subcategoría o eliminar un código del Codebook.
   - *Criterio de éxito*: El texto original de la entrevista o la evidencia de observación permanece intacto; solo se actualiza la capa analítica de códigos asociados.
2. **Prueba de No Confusión de "No Observado"**:
   - *Procedimiento*: Registrar una sesión de OBS dejando OBS6 marcado como *"No observado / Información insuficiente"*.
   - *Criterio de éxito*: En los filtros y reportes, dicha sesión no aparece clasificada como "estudiante que no se autorregula", sino como información ausente no punible.
3. **Prueba de Revisión de Sugerencias Asistidas**:
   - *Procedimiento*: Ejecutar el motor de sugerencia sobre un fragmento de GF.
   - *Criterio de éxito*: El fragmento adquiere el estado \`propuesta_pendiente\` y no se incluye en los reportes analíticos finales hasta que el investigador pulsa \`Aceptar\` o \`Modificar\`.
4. **Prueba de Trazabilidad Auditada**:
   - *Procedimiento*: Tres investigadores distintos modifican la justificación de un fragmento y agregan un código transversal.
   - *Criterio de éxito*: La bitácora registra cronológicamente los 3 eventos con nombre, fecha y contenido previo/posterior.`
  },
  {
    id: 'entregable-8',
    number: 8,
    title: 'Entregable 8. Preguntas Metodológicas Pendientes',
    subtitle: 'Decisiones Cruciales que el Equipo Investigador Debe Resolver Colegiadamente',
    summary: 'Documenta formalmente los dilemas y decisiones abiertas que requieren consenso del equipo investigador antes del cierre definitivo de la investigación.',
    contentMarkdown: `### 1. Resolución Formal de la Inconsistencia en OBS8
- **Antecedente del documento físico**: El indicador 8 de observación estructurada está formulado como: *«¿Cuál es la reacción predominante ante los mensajes de retroalimentación inmediata del sistema?»*, pero el formato impreso original presentaba opciones dicotómicas «Sí/No».
- **Propuesta del sistema digital**: El sistema resuelve esta discordancia ofreciendo una tipología enriquecida (Receptiva/Atenta, Aceptación pasiva, Frustración/Resistencia, Desconcierto/Confusión, Indiferencia) Y manteniendo la opción de registrar «Sí/No» con evidencia obligatoria.
- **Decisión pendiente para los investigadores**: ¿Debe el equipo acordar una adenda metodológica formal que homologue las observaciones pasadas hacia la tipología conductual, o se mantendrá una codificación mixta anotada como salvedad metodológica en las publicaciones?

---

### 2. Tratamiento de Atribución en Grupos Focales
- **Dilema**: En transcripciones de audio complejas donde varios estudiantes intervienen simultáneamente o con timbres de voz semejantes, no siempre es factible identificar con absoluta certeza si habló \`EST-01\` o \`EST-03\`.
- **Decisión pendiente**: ¿Se permite el uso de un seudónimo colectivo o genérico (p. ej., \`EST-INDET\`) para turnos no atribuibles con certeza, o se desechan dichas intervenciones para no contaminar la triangulación individual? (Recomendación metodológica: mantener el fragmento como voz colectiva \`EST-CORAL\` o \`EST-INDET\`, sin vincularlo a triangulaciones de un estudiante específico).

---

### 3. Criterio de Saturación Teórica
- **Dilema**: ¿Cuántas sesiones de observación, grupos focales y entrevistas individuales serán requeridas por institución y grado para dar por concluida la recolección empírica?
- **Decisión pendiente**: Definir el umbral formal de saturación (p. ej., cuando en dos sesiones consecutivas de grupo focal no emerjan nuevas propiedades o subcategorías para las familias EXP, PER y DIF).

---

### 4. Alcance y Acceso a Grabaciones Originales
- **Dilema**: Las grabaciones en audio de menores de edad en entornos escolares están sujetas a legislaciones estrictas de protección de datos personales y hábeas data (p. ej., Ley 1581 de 2012 en Colombia o equivalentes internacionales).
- **Decisión pendiente**: ¿Las grabaciones maestras deben almacenarse únicamente en repositorios locales cifrados fuera de la nube con acceso restringido al Investigador Principal, vinculando al sistema web solo la transcripción seudonimizada y la referencia hash del archivo local?

---

### 5. Mecanismo de Validación con Participantes (Member Checking)
- **Dilema**: Para cumplir con el estándar más alto de credibilidad cualitativa, se recomienda contrastar las interpretaciones preliminares con los propios estudiantes o con sus docentes observadores.
- **Decisión pendiente**: ¿Se convocará a un subgrupo de estudiantes para una sesión de retroalimentación donde revisen los hallazgos preliminares de percepciones y propuestas de mejora (GF10 y E5)?`
  }
];
