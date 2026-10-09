import { ResearchSession, CodedFragment, TriangulationMatrixEntry, AuditLogEntry } from '../types';

export const SAMPLE_SESSIONS: ResearchSession[] = [
  // ==========================================
  // SESIÓN 1: OBSERVACIÓN ESTRUCTURADA
  // ==========================================
  {
    id: 'ses-obs-001',
    instrumentType: 'OBS',
    instrumentCode: 'OBS-2026-001',
    date: '2026-10-02',
    institution: 'Institución Educativa Departamental San Martín',
    grade: '10° Grado - Grupo B',
    sessionNumber: 1,
    stiVersionOrTask: 'Módulo de Falacias Lógicas y Argumentación Crítica v2.1',
    researcherName: 'Dra. Elena Restrepo (Observadora)',
    studentPseudonym: 'EST-10B-04',
    studentRealNameEncrypted: 'Hash-AES-98214',
    recordingConsentApproved: true,
    audioRecordingRef: 'REC-AUD-20261002-OBS01.m4a (Autorizado)',
    notes: 'Estudiante con nivel medio de familiaridad digital. El aula de cómputo contaba con buena conectividad.',
    createdAt: '2026-10-02T09:30:00Z',
    updatedAt: '2026-10-02T10:45:00Z',
    observationRecords: {
      OBS1: {
        questionId: 'OBS1',
        observed: true,
        scaleValue: 'Sí',
        observableEvidence: 'El estudiante permaneció 75 segundos leyendo el texto del caso antes de mover el cursor sobre los botones de selección. Subrayó con el puntero dos premisas clave.',
        contextualNotes: 'Postura corporal inclinada hacia la pantalla, movimiento pausado del ratón.'
      },
      OBS2: {
        questionId: 'OBS2',
        observed: true,
        scaleValue: 'Sí',
        observableEvidence: 'Hizo clic sobre la opción A, la deseleccionó voluntariamente después de 20 segundos y cambió a la opción C tras comparar los dos enunciados.',
        contextualNotes: 'Murmuró en voz baja comparando las palabras clave de ambas alternativas.'
      },
      OBS3: {
        questionId: 'OBS3',
        observed: true,
        scaleValue: 'Sí',
        observableEvidence: 'Cuando el tutor desplegó la ventana con la pista socrática, el estudiante la leyó completa (18 segundos) y no cerró el diálogo apresuradamente.',
        contextualNotes: 'Mostró disposición receptiva, no ignoró el aviso.'
      },
      OBS4: {
        questionId: 'OBS4',
        observed: true,
        scaleValue: 'Parcialmente / Ocasional',
        observableEvidence: 'Revisó la barra de progreso de 4 pasos antes de comenzar el primer ejercicio, pero no consultó la rúbrica metodológica.',
        contextualNotes: 'Planificación focalizada en la extensión de la tarea más que en la estrategia cognitiva.'
      },
      OBS5: {
        questionId: 'OBS5',
        observed: true,
        scaleValue: 'Sí',
        observableEvidence: 'Al completar el ejercicio 3, abrió la pestaña de "Historial de intentos" y verificó en qué argumentos había recibido observaciones previas.',
        contextualNotes: 'Monitoreo activo de la calidad de sus respuestas.'
      },
      OBS6: {
        questionId: 'OBS6',
        observed: true,
        scaleValue: 'Sí',
        observableEvidence: 'Tras recibir retroalimentación de error en la deducción del silogismo, pausó 45 segundos, releyó la teoría del caso y seleccionó una nueva premisa congruente.',
        contextualNotes: 'Autorregulación efectiva: no incurrió en clics compulsivos de ensayo y error.'
      },
      OBS7: {
        questionId: 'OBS7',
        observed: true,
        scaleValue: 'Sí',
        observableEvidence: 'Navegó con total fluidez por las pestañas, utilizó el zoom de la infografía y desplegó las herramientas de apoyo sin requerir ayuda del observador.',
        contextualNotes: 'Competencia digital operativa adecuada para la tarea.'
      },
      OBS8: {
        questionId: 'OBS8',
        observed: true,
        scaleValue: 'Receptiva / Curiosa / Atenta (lee y reflexiona)',
        observableEvidence: 'Ante el aviso de corrección del sistema, asintió con la cabeza, tomó un bolígrafo y anotó una palabra en su libreta de apuntes antes de continuar.',
        contextualNotes: 'Resolución de discrepancia tipológica: el estudiante mostró receptividad reflexiva demostrada conductualmente en notas manuscritas.'
      }
    }
  },

  // ==========================================
  // SESIÓN 2: OBSERVACIÓN ESTRUCTURADA
  // ==========================================
  {
    id: 'ses-obs-002',
    instrumentType: 'OBS',
    instrumentCode: 'OBS-2026-002',
    date: '2026-10-02',
    institution: 'Institución Educativa Departamental San Martín',
    grade: '10° Grado - Grupo B',
    sessionNumber: 1,
    stiVersionOrTask: 'Módulo de Falacias Lógicas y Argumentación Crítica v2.1',
    researcherName: 'Lic. Carlos Mejía (Observador)',
    studentPseudonym: 'EST-10B-08',
    studentRealNameEncrypted: 'Hash-AES-45129',
    recordingConsentApproved: true,
    audioRecordingRef: 'REC-AUD-20261002-OBS02.m4a (Autorizado)',
    notes: 'El estudiante mostró ansiedad inicial por el tiempo y el puntaje.',
    createdAt: '2026-10-02T10:45:00Z',
    updatedAt: '2026-10-02T11:50:00Z',
    observationRecords: {
      OBS1: {
        questionId: 'OBS1',
        observed: false,
        scaleValue: 'No',
        observableEvidence: 'El estudiante hizo clic en el botón de respuesta a los 4 segundos de cargada la pantalla, sin dar tiempo para la lectura del texto de 200 palabras.',
        contextualNotes: 'Comportamiento de respuesta impulsiva o por azar.'
      },
      OBS2: {
        questionId: 'OBS2',
        observed: false,
        scaleValue: 'No',
        observableEvidence: 'No exploró menús ni desplegó las opciones alternativas; seleccionó directamente la primera opción visible.',
        contextualNotes: 'Falta de deliberación entre opciones.'
      },
      OBS3: {
        questionId: 'OBS3',
        observed: false,
        scaleValue: 'No',
        observableEvidence: 'Cerró el modal de sugerencia del tutor en menos de 1 segundo mediante el botón de cruz (X), sin desplazar la barra de texto.',
        contextualNotes: 'Rechazo o evitación del andamiaje ofrecido por el STI.'
      },
      OBS4: {
        questionId: 'OBS4',
        observed: false,
        scaleValue: 'No',
        observableEvidence: 'Inició inmediatamente sin explorar la estructura ni consultar las herramientas de apoyo.',
        contextualNotes: 'Ausencia total de fase de planificación visible.'
      },
      OBS5: {
        questionId: 'OBS5',
        observed: false,
        scaleValue: 'No',
        observableEvidence: 'No consultó el panel de progreso ni revisó respuestas pasadas durante los 40 minutos de sesión.',
        contextualNotes: 'Foco exclusivo en terminar rápido la tarea.'
      },
      OBS6: {
        questionId: 'OBS6',
        observed: false,
        scaleValue: 'No',
        observableEvidence: 'Al recibir error en la actividad 2, pulsó frenéticamente las opciones B, C y D en un lapso de 6 segundos hasta acertar por descarte.',
        contextualNotes: 'Conducta evidente de dificultad para ajustar estrategias (DIF-AJUSTE).'
      },
      OBS7: {
        questionId: 'OBS7',
        observed: true,
        scaleValue: 'Parcialmente / Requiere asistencia',
        observableEvidence: 'Preguntó dos veces al observador cómo regresar a la pantalla anterior porque no identificaba el icono de retorno.',
        contextualNotes: 'Dificultad de navegación e interfaz (DIF-INT).'
      },
      OBS8: {
        questionId: 'OBS8',
        observed: true,
        scaleValue: 'Frustración / Resistencia / Enojo visible',
        observableEvidence: 'Golpeó suavemente la mesa con la palma de la mano, emitió un suspiro audible y murmuró: "este programa no me deja avanzar".',
        contextualNotes: 'Reacción afectiva negativa intensa ante la retroalimentación inmediata.'
      }
    }
  },

  // ==========================================
  // SESIÓN 3: GRUPO FOCAL
  // ==========================================
  {
    id: 'ses-gf-001',
    instrumentType: 'GF',
    instrumentCode: 'GF-2026-001',
    date: '2026-10-04',
    institution: 'Institución Educativa Departamental San Martín',
    grade: '10° Grado - Grupo B',
    sessionNumber: 1,
    stiVersionOrTask: 'Sesión Plenaria sobre Mediación del STI y Pensamiento Crítico',
    researcherName: 'Dr. Fernando Arbeláez (Moderador) & Dra. Elena Restrepo (Relatora)',
    participantPseudonyms: ['EST-10B-01', 'EST-10B-04', 'EST-10B-08', 'EST-10B-12', 'EST-10B-15'],
    sessionDurationMinutes: 52,
    recordingConsentApproved: true,
    audioRecordingRef: 'REC-GF-20261004-GF01.wav (Consentimiento institucional archivado)',
    notes: 'Dinámica participativa fluida. Asistieron 5 estudiantes que previamente completaron la fase individual con el tutor.',
    createdAt: '2026-10-04T14:00:00Z',
    updatedAt: '2026-10-04T16:30:00Z',
    focusGroupRecords: {
      GF1: {
        questionId: 'GF1',
        moderatorNotes: 'Los estudiantes enfatizaron el control del ritmo frente a la presión colectiva de la clase ordinaria.',
        turns: [
          {
            id: 't-1',
            participantPseudonym: 'EST-10B-04',
            text: 'Lo que más me llamó la atención fue que el tutor no te apura. En la clase normal si no contestas rápido el profesor le da la palabra a otro, pero aquí uno puede quedarse pensando 5 minutos en el porqué de la premisa.',
            contextualNotes: 'Tono reflexivo, el grupo asiente.'
          },
          {
            id: 't-2',
            participantPseudonym: 'EST-10B-08',
            text: 'A mí al principio me pareció aburrido porque en la clase uno puede hablar con los compañeros o el profe te da pistas más directas. El tutor te devuelve preguntas en vez de decirte la respuesta.',
            contextualNotes: 'Manifiesta resistencia inicial al andamiaje socrático.'
          }
        ]
      },
      GF2: {
        questionId: 'GF2',
        moderatorNotes: 'Reconocimiento de desequilibrio cognitivo provocado por contraejemplos del software.',
        turns: [
          {
            id: 't-3',
            participantPseudonym: 'EST-10B-01',
            text: 'Sí, totalmente. Había una actividad sobre noticias falsas donde yo estaba segurísimo de que el testimonio era real, pero el tutor me mostró un contraejemplo y me obligó a revisar si la fuente era creíble.',
            contextualNotes: 'Muestra interés y sorpresa.'
          },
          {
            id: 't-4',
            participantPseudonym: 'EST-10B-12',
            text: 'Te obliga a dudar de lo primero que piensas. Uno siempre quiere marcar lo que suena bonito, pero el sistema te dice: ¿cuál es tu justificación lógica?',
            contextualNotes: 'Énfasis en la necesidad de argumentar.'
          }
        ]
      },
      GF3: {
        questionId: 'GF3',
        moderatorNotes: 'Estrategias de manejo de la incertidumbre cognitiva y duda epistemológica.',
        turns: [
          {
            id: 't-5',
            participantPseudonym: 'EST-10B-04',
            text: 'En el ejercicio 3 me dio un contraejemplo que contradecía lo que yo creía. Al principio me desconcertó, pero luego releí el concepto y me di cuenta de que mi argumento era una falacia ad verecundiam.',
            contextualNotes: 'Excelente evidencia de metacognición y pensamiento crítico.'
          },
          {
            id: 't-6',
            participantPseudonym: 'EST-10B-08',
            text: 'A mí esa duda me dio rabia. Sentí que el sistema me cambiaba las reglas para hacerme equivocar a propósito.',
            contextualNotes: 'Reacción afectiva de frustración ante la objeción lógica.'
          }
        ]
      },
      GF4: {
        questionId: 'GF4',
        moderatorNotes: 'Percepción de multiplicidad de perspectivas versus dogma único.',
        turns: [
          {
            id: 't-7',
            participantPseudonym: 'EST-10B-15',
            text: 'El tutor te mostraba dos personajes debatiendo: uno decía que la medida era justa por razones económicas y el otro que violaba derechos. Me ayudó a ver que los dos tenían argumentos válidos.',
            contextualNotes: 'Apertura mental a perspectivas disidentes.'
          }
        ]
      },
      GF5: {
        questionId: 'GF5',
        moderatorNotes: 'Detección temprana del error mediada por el algoritmo.',
        turns: [
          {
            id: 't-8',
            participantPseudonym: 'EST-10B-04',
            text: 'No te dice "está mal y tienes cero". Te resalta en color amarillo la premisa que no encaja y te pregunta: ¿esta premisa se deduce de los hechos o la estás suponiendo tú?',
            contextualNotes: 'Reconocimiento explícito del valor formativo del feedback.'
          }
        ]
      },
      GF6: {
        questionId: 'GF6',
        moderatorNotes: 'Tensión entre autorregulación reflexiva vs. bloqueo afectivo.',
        turns: [
          {
            id: 't-9',
            participantPseudonym: 'EST-10B-08',
            text: 'Cuando me decía que mi razonamiento era débil, me daban ganas de apagar la pantalla porque yo sentía que para mí tenía sentido.',
            contextualNotes: 'Tensa correlación con los registros de observación de OBS8.'
          },
          {
            id: 't-10',
            participantPseudonym: 'EST-10B-12',
            text: 'Yo me detenía y respiraba. Si me decía que el razonamiento era débil, buscaba la pestaña de ejemplos para ver cómo estructurar mejor la conclusión.',
            contextualNotes: 'Estrategia activa de autorregulación y monitoreo.'
          }
        ]
      },
      GF7: {
        questionId: 'GF7',
        moderatorNotes: 'Conciencia de los propios procesos metacognitivos.',
        turns: [
          {
            id: 't-11',
            participantPseudonym: 'EST-10B-01',
            text: 'Sí, ahora me doy cuenta de que leo muy rápido y que me salto las palabras clave como "algunos" o "ninguno". El sistema me hizo notar que ese descuido me hacía errar.',
            contextualNotes: 'Conciencia metacognitiva de sesgos de atención.'
          }
        ]
      },
      GF8: {
        questionId: 'GF8',
        moderatorNotes: 'Dificultades y frustraciones reportadas.',
        turns: [
          {
            id: 't-12',
            participantPseudonym: 'EST-10B-08',
            text: 'Lo más frustrante fue que a veces la pista era muy abstracta, como en clave de adivinanza. Uno necesita que si está mal, le digan con palabras sencillas por qué.',
            contextualNotes: 'Dificultad reportada con el nivel de andamiaje (DIF-RET).'
          },
          {
            id: 't-13',
            participantPseudonym: 'EST-10B-15',
            text: 'A veces el botón de volver no se veía bien en la resolución de las pantallas viejas del colegio.',
            contextualNotes: 'Dificultad ergonómica de interfaz (DIF-INT).'
          }
        ]
      },
      GF9: {
        questionId: 'GF9',
        moderatorNotes: 'Percepción de personalización y adaptatividad del tutor.',
        turns: [
          {
            id: 't-14',
            participantPseudonym: 'EST-10B-04',
            text: 'Yo comparé con mi compañero de al lado: cuando él falló en deducciones le salieron ejercicios con diagramas, y a mí me salieron de texto. Sentí que sí se adaptaba.',
            contextualNotes: 'Percepción positiva de adaptación algorítmica (PER-ADAPT).'
          },
          {
            id: 't-15',
            participantPseudonym: 'EST-10B-08',
            text: 'A mí me dio la impresión de que eran preguntas fijas en una fila y que a todos nos tocaba lo mismo si le dábamos clic a la misma casilla.',
            contextualNotes: 'Percepción escéptica sobre la adaptatividad del STI.'
          }
        ]
      },
      GF10: {
        questionId: 'GF10',
        moderatorNotes: 'Propuestas de mejora pedagógica y funcional.',
        turns: [
          {
            id: 't-16',
            participantPseudonym: 'EST-10B-12',
            text: 'Le agregaría que uno pueda escribir su argumento con sus propias palabras y que el tutor use inteligencia artificial para analizar el texto, no solo opciones de selección.',
            contextualNotes: 'Propuesta de mejora de alto nivel pedagógico (PER-PROP / DIF-MEJORA).'
          },
          {
            id: 't-17',
            participantPseudonym: 'EST-10B-04',
            text: 'Que permita guardar un resumen de los errores al final para poder estudiar en casa antes del examen.',
            contextualNotes: 'Propuesta de soporte al estudio autónomo.'
          }
        ]
      }
    }
  },

  // ==========================================
  // SESIÓN 4: ENTREVISTA SEMIESTRUCTURADA INDIVIDUAL
  // ==========================================
  {
    id: 'ses-e-001',
    instrumentType: 'E',
    instrumentCode: 'E-2026-001',
    date: '2026-10-05',
    institution: 'Institución Educativa Departamental San Martín',
    grade: '10° Grado - Grupo B',
    sessionNumber: 1,
    stiVersionOrTask: 'Módulo de Falacias Lógicas y Argumentación Crítica v2.1',
    researcherName: 'Dra. Elena Restrepo (Entrevistadora)',
    studentPseudonym: 'EST-10B-04',
    studentRealNameEncrypted: 'Hash-AES-98214',
    recordingConsentApproved: true,
    audioRecordingRef: 'REC-ENT-20261005-E01.m4a (Autorización archivada)',
    notes: 'Entrevista individual de 22 minutos realizada en sala de orientación escolar.',
    createdAt: '2026-10-05T11:00:00Z',
    updatedAt: '2026-10-05T12:15:00Z',
    interviewRecords: {
      E1: {
        questionId: 'E1',
        verbatimResponse: 'Fue una experiencia enriquecedora y bastante demandante. Al principio creí que iba a ser un juego de responder rápido, pero me di cuenta de que el tutor requería mucha concentración y análisis minucioso de cada caso.',
        probingQuestions: '¿Qué momento sentiste como el más demandante?',
        contextualNotes: 'El estudiante se muestra sereno y muy articulado al evocar la sesión interactiva.'
      },
      E2: {
        questionId: 'E2',
        verbatimResponse: 'Me ayudó mucho porque cuando yo creía tener la respuesta segura, el sistema me mostraba un desglose de mi razonamiento y me señalaba dónde había un salto no justificado. Eso me hizo darme cuenta de que en clase suelo apresurarme sin revisar los pasos intermedios.',
        probingQuestions: '¿Crees que ahora aplicas esa revisión en otras materias?',
        contextualNotes: 'Evidencia clara de toma de conciencia metacognitiva (PER-CONSC, META-MON).'
      },
      E3: {
        questionId: 'E3',
        verbatimResponse: 'Sí, definitivamente. Me desafió a buscar contraargumentos. En un ejercicio de falacias yo pensaba que un argumento de autoridad siempre era válido, y el tutor me hizo ver que depender ciegamente de una figura de autoridad sin evidencias empíricas es una falacia.',
        probingQuestions: '¿Cómo manejaste la contradicción?',
        contextualNotes: 'Demuestra desarrollo del pensamiento crítico y apertura mental (PC-ANALISIS, PC-APER).'
      },
      E4: {
        questionId: 'E4',
        verbatimResponse: 'Lo que más se me dificultó fue la primera vez que la pista vino en forma de acertijo socrático. Yo esperaba que me dijera: "la regla es tal", pero en lugar de eso me preguntó si mi premisa era universal o particular. Tuve que releer dos veces la teoría para captar la intención.',
        probingQuestions: '¿Consideras que esa dificultad te bloqueó o te ayudó?',
        contextualNotes: 'Dificultad inicial con el estilo de retroalimentación que desembocó en aprendizaje constructivo.'
      },
      E5: {
        questionId: 'E5',
        verbatimResponse: 'Le añadiría una opción de "árbol de argumentos" donde uno pudiera visualizar gráficamente cómo se conectan las premisas con la conclusión. A veces en puro texto uno pierde la noción del mapa general del argumento.',
        probingQuestions: '¿Por qué consideras importante esa visualización?',
        contextualNotes: 'Propuesta de mejora centrada en la metacognición visual (PER-PROP, META-PLAN).'
      }
    }
  },

  // ==========================================
  // SESIÓN 5: ENTREVISTA SEMIESTRUCTURADA INDIVIDUAL
  // ==========================================
  {
    id: 'ses-e-002',
    instrumentType: 'E',
    instrumentCode: 'E-2026-002',
    date: '2026-10-05',
    institution: 'Institución Educativa Departamental San Martín',
    grade: '10° Grado - Grupo B',
    sessionNumber: 1,
    stiVersionOrTask: 'Módulo de Falacias Lógicas y Argumentación Crítica v2.1',
    researcherName: 'Lic. Carlos Mejía (Entrevistador)',
    studentPseudonym: 'EST-10B-08',
    studentRealNameEncrypted: 'Hash-AES-45129',
    recordingConsentApproved: true,
    audioRecordingRef: 'REC-ENT-20261005-E02.m4a (Autorización archivada)',
    notes: 'Entrevista de 18 minutos. Estudiante reservado al inicio.',
    createdAt: '2026-10-05T14:30:00Z',
    updatedAt: '2026-10-05T15:20:00Z',
    interviewRecords: {
      E1: {
        questionId: 'E1',
        verbatimResponse: 'Fue frustrante la verdad. Yo sentí que el sistema era muy terco porque si uno no ponía exactamente lo que el programa quería, te ponía que tu razonamiento estaba mal.',
        probingQuestions: '¿En qué momentos sentiste mayor frustración?',
        contextualNotes: 'Tono defensivo. Refleja la fricción entre sus expectativas y el rigor lógico demandado.'
      },
      E2: {
        questionId: 'E2',
        verbatimResponse: 'No sé si me ayudó a aprender mejor. Me mostró que cometo errores, pero como no me decía la respuesta directa, me quedaba atrapado.',
        probingQuestions: '¿Consultaste el panel de progreso o las ayudas?',
        contextualNotes: 'Dificultad para el monitoreo y autorregulación sin guía directiva.'
      },
      E3: {
        questionId: 'E3',
        verbatimResponse: 'Pues sí te obliga a mirar de otra manera, pero a veces parece que busca enredar las cosas a propósito en vez de explicar claro.',
        probingQuestions: '¿Qué actividad te pareció más enredada?',
        contextualNotes: 'Reconocimiento forzado del desafío con carga emocional negativa.'
      },
      E4: {
        questionId: 'E4',
        verbatimResponse: 'La interfaz a veces se me trababa cuando quería devolverme, y los mensajes de error salían muy rápido y no explicaban con peras y manzanas.',
        probingQuestions: '¿Hiciste clics repetidos?',
        contextualNotes: 'Triangulación directa con la observación OBS7 y OBS6.'
      },
      E5: {
        questionId: 'E5',
        verbatimResponse: 'Que tenga un botón de "Explicación directa del profesor" para cuando uno ya lo intentó dos veces y no quiere seguir adivinando.',
        probingQuestions: '¿Qué te gustaría que dijera ese botón?',
        contextualNotes: 'Propuesta que evidencia la necesidad de un andamiaje graduado y no binario.'
      }
    }
  }
];

export const INITIAL_CODED_FRAGMENTS: CodedFragment[] = [
  {
    id: 'frag-001',
    sessionId: 'ses-obs-001',
    sessionCode: 'OBS-2026-001',
    instrumentType: 'OBS',
    questionId: 'OBS1',
    participantPseudonym: 'EST-10B-04',
    excerptText: 'El estudiante permaneció 75 segundos leyendo el texto del caso antes de mover el cursor sobre los botones de selección. Subrayó con el puntero dos premisas clave.',
    categoryIds: ['EXP-ANA'],
    transversalDimensionIds: ['PC-ANALISIS'],
    justification: 'Conducta fáctica observable de pausa y descomposición de información textual previa a la toma de decisión.',
    status: 'revisada_aceptada',
    researcherName: 'Dra. Elena Restrepo',
    dateCoded: '2026-10-02'
  },
  {
    id: 'frag-002',
    sessionId: 'ses-obs-001',
    sessionCode: 'OBS-2026-001',
    instrumentType: 'OBS',
    questionId: 'OBS6',
    participantPseudonym: 'EST-10B-04',
    excerptText: 'Tras recibir retroalimentación de error en la deducción del silogismo, pausó 45 segundos, releyó la teoría del caso y seleccionó una nueva premisa congruente.',
    categoryIds: ['EXP-AUT'],
    transversalDimensionIds: ['META-REG'],
    justification: 'Modificación deliberada de la estrategia de resolución tras recibir retroalimentación correctiva sin incurrir en ensayo y error impulsivo.',
    status: 'revisada_aceptada',
    researcherName: 'Dra. Elena Restrepo',
    dateCoded: '2026-10-02'
  },
  {
    id: 'frag-003',
    sessionId: 'ses-obs-002',
    sessionCode: 'OBS-2026-002',
    instrumentType: 'OBS',
    questionId: 'OBS6',
    participantPseudonym: 'EST-10B-08',
    excerptText: 'Al recibir error en la actividad 2, pulsó frenéticamente las opciones B, C y D en un lapso de 6 segundos hasta acertar por descarte.',
    categoryIds: ['DIF-AJUSTE'],
    transversalDimensionIds: [],
    justification: 'Conducta observable de bloqueo para formular una hipótesis reflexiva tras el error; recurso exclusivo al ensayo y error mecánico.',
    status: 'revisada_aceptada',
    researcherName: 'Lic. Carlos Mejía',
    dateCoded: '2026-10-02'
  },
  {
    id: 'frag-004',
    sessionId: 'ses-gf-001',
    sessionCode: 'GF-2026-001',
    instrumentType: 'GF',
    questionId: 'GF2',
    participantPseudonym: 'EST-10B-01',
    excerptText: 'Había una actividad sobre noticias falsas donde yo estaba segurísimo de que el testimonio era real, pero el tutor me mostró un contraejemplo y me obligó a revisar si la fuente era creíble.',
    categoryIds: ['PER-PC', 'EXP-DUDA'],
    transversalDimensionIds: ['PC-CUEST', 'PC-EVAL'],
    justification: 'Percepción explícita de cuestionamiento epistémico impulsado por la mediación del tutor inteligente ante certezas iniciales.',
    status: 'revisada_aceptada',
    researcherName: 'Dr. Fernando Arbeláez',
    dateCoded: '2026-10-04'
  },
  {
    id: 'frag-005',
    sessionId: 'ses-gf-001',
    sessionCode: 'GF-2026-001',
    instrumentType: 'GF',
    questionId: 'GF8',
    participantPseudonym: 'EST-10B-08',
    excerptText: 'Lo más frustrante fue que a veces la pista era muy abstracta, como en clave de adivinanza. Uno necesita que si está mal, le digan con palabras sencillas por qué.',
    categoryIds: ['DIF-RET', 'DIF-FRUST'],
    transversalDimensionIds: [],
    justification: 'Incomprensión y descontento ante el estilo de andamiaje socrático del software; demanda de feedback directo instructivo.',
    status: 'revisada_aceptada',
    researcherName: 'Dr. Fernando Arbeláez',
    dateCoded: '2026-10-04'
  },
  {
    id: 'frag-006',
    sessionId: 'ses-gf-001',
    sessionCode: 'GF-2026-001',
    instrumentType: 'GF',
    questionId: 'GF9',
    participantPseudonym: 'EST-10B-04',
    excerptText: 'Yo comparé con mi compañero de al lado: cuando él falló en deducciones le salieron ejercicios con diagramas, y a mí me salieron de texto. Sentí que sí se adaptaba.',
    categoryIds: ['PER-ADAPT'],
    transversalDimensionIds: [],
    justification: 'Percepción positiva de diferenciación y personalización algorítmica de los itinerarios de aprendizaje.',
    status: 'revisada_aceptada',
    researcherName: 'Dr. Fernando Arbeláez',
    dateCoded: '2026-10-04'
  },
  {
    id: 'frag-007',
    sessionId: 'ses-e-001',
    sessionCode: 'E-2026-001',
    instrumentType: 'E',
    questionId: 'E2',
    participantPseudonym: 'EST-10B-04',
    excerptText: 'Me ayudó mucho porque cuando yo creía tener la respuesta segura, el sistema me mostraba un desglose de mi razonamiento y me señalaba dónde había un salto no justificado. Eso me hizo darme cuenta de que en clase suelo apresurarme sin revisar los pasos intermedios.',
    categoryIds: ['PER-CONSC', 'PER-META'],
    transversalDimensionIds: ['META-MON'],
    justification: 'Autoinforme de toma de conciencia metacognitiva sobre sesgos cognitivos propios e identificación de desvíos en el razonamiento.',
    status: 'revisada_aceptada',
    researcherName: 'Dra. Elena Restrepo',
    dateCoded: '2026-10-05'
  },
  {
    id: 'frag-008',
    sessionId: 'ses-e-001',
    sessionCode: 'E-2026-001',
    instrumentType: 'E',
    questionId: 'E5',
    participantPseudonym: 'EST-10B-04',
    excerptText: 'Le añadiría una opción de "árbol de argumentos" donde uno pudiera visualizar gráficamente cómo se conectan las premisas con la conclusión. A veces en puro texto uno pierde la noción del mapa general del argumento.',
    categoryIds: ['PER-PROP', 'DIF-MEJORA'],
    transversalDimensionIds: ['META-PLAN'],
    justification: 'Propuesta constructiva de mejora didáctica orientada a facilitar la representación visual y la planificación cognitiva.',
    status: 'revisada_aceptada',
    researcherName: 'Dra. Elena Restrepo',
    dateCoded: '2026-10-05'
  },
  {
    id: 'frag-009',
    sessionId: 'ses-e-002',
    sessionCode: 'E-2026-002',
    instrumentType: 'E',
    questionId: 'E1',
    participantPseudonym: 'EST-10B-08',
    excerptText: 'Fue frustrante la verdad. Yo sentí que el sistema era muy terco porque si uno no ponía exactamente lo que el programa quería, te ponía que tu razonamiento estaba mal.',
    categoryIds: ['DIF-FRUST', 'EXP-GEN'],
    transversalDimensionIds: [],
    justification: 'Vivencia general marcada por frustración y percepción de rigidez algorítmica.',
    status: 'revisada_aceptada',
    researcherName: 'Lic. Carlos Mejía',
    dateCoded: '2026-10-05'
  },
  // Propuesta pendiente de revisión para ejemplificar flujo
  {
    id: 'frag-010',
    sessionId: 'ses-gf-001',
    sessionCode: 'GF-2026-001',
    instrumentType: 'GF',
    questionId: 'GF10',
    participantPseudonym: 'EST-10B-12',
    excerptText: 'Le agregaría que uno pueda escribir su argumento con sus propias palabras y que el tutor use inteligencia artificial para analizar el texto, no solo opciones de selección.',
    categoryIds: ['PER-PROP'],
    transversalDimensionIds: ['PC-CUEST'],
    justification: 'Sugerencia automática: Demanda de interacción en lenguaje natural y mayor apertura en la formulación de argumentos.',
    status: 'propuesta_pendiente',
    suggestedByAI: true,
    aiConfidence: 'Alta (89%)',
    researcherName: 'Asistente Heurístico (Pendiente Revisión)',
    dateCoded: '2026-10-05'
  }
];

export const INITIAL_TRIANGULATION_ENTRIES: TriangulationMatrixEntry[] = [
  {
    id: 'triang-001',
    categoryId: 'EXP-AUT',
    transversalDimensionId: 'META-REG',
    obsEvidenceSummary: 'En OBS-2026-001 se constató una pausa de 45 segundos tras el error y relectura teórica deliberada (EST-10B-04). En contraste, en OBS-2026-002 se evidenció repetición compulsiva de clics aleatorios (EST-10B-08).',
    obsEvidenceAvailable: true,
    obsFragmentIds: ['frag-002', 'frag-003'],
    gfEvidenceSummary: 'En el grupo focal, los estudiantes relataron dos respuestas opuestas: quienes utilizaron las pistas para reformular su hipótesis (EST-10B-12, EST-10B-04) frente a quienes manifestaron bloqueo o deseos de abandonar (EST-10B-08).',
    gfEvidenceAvailable: true,
    gfFragmentIds: ['t-9', 't-10'],
    interviewEvidenceSummary: 'En las entrevistas individuales se corrobora que la capacidad de autorregulación está mediada por la tolerancia a la frustración y la claridad con la que perciben la intención pedagógica del tutor (E2 en EST-10B-04 vs EST-10B-08).',
    interviewEvidenceAvailable: true,
    interviewFragmentIds: ['frag-007'],
    coincidences: 'Las tres fuentes coinciden en que el STI genera un momento crítico de bifurcación conductual ante el error: no hay respuestas indiferentes; o bien detona búsqueda activa de andamiaje, o bien desencadena comportamientos de ensayo y error evasivos.',
    divergencesAndContradictions: 'Discrepancia entre la autoimagen declarada y la conducta observada en ciertos participantes: mientras en entrevista algunos estudiantes tienden a declarar que "pensaron bien las cosas", en la observación directa se evidenciaron lapsos breves de clics mecánicos antes de calmarse.',
    complementaryFindings: 'El grupo focal y la entrevista proporcionan la explicación afectiva profunda (sensación de ser juzgado por la máquina vs. ver a la máquina como un espejo) que la observación estructurada solo captura como latencia o aceleración de clics.',
    absenceOfEvidenceNotes: 'Todas las fuentes cuentan con evidencia primaria suficiente para esta categoría central.',
    researcherInterpretation: 'La autorregulación con el STI no es una cualidad estática del estudiante, sino una competencia emergente que depende críticamente del estilo del feedback: cuando el andamiaje es socrático, requiere acompañamiento docente inicial para no degenerar en frustración ciega.',
    pendingQuestions: '¿En qué medida el nivel previo de competencia lectora condiciona que el estudiante interprete la pista socrática como una ayuda o como una barrera punitiva?',
    lastUpdatedBy: 'Dra. Elena Restrepo & Equipo ROCAS',
    updatedAt: '2026-10-06T11:20:00Z'
  },
  {
    id: 'triang-002',
    categoryId: 'PER-PC',
    transversalDimensionId: 'PC-ANALISIS',
    obsEvidenceSummary: 'Evidencia en OBS1 y OBS2: se registran pausas sistemáticas de 70 a 90 segundos previas a la emisión de respuestas en estudiantes que exploran hipótesis y desglosan textos.',
    obsEvidenceAvailable: true,
    obsFragmentIds: ['frag-001'],
    gfEvidenceSummary: 'En GF2 y GF4 los estudiantes expresaron unánimemente que las consignas del STI rompieron la inercia de "responder de memoria", obligándolos a confrontar premisas y justificar.',
    gfEvidenceAvailable: true,
    gfFragmentIds: ['frag-004'],
    interviewEvidenceSummary: 'En E3, los entrevistados detallaron casos puntuales (p. ej. falacias ad verecundiam y noticias falsas) donde debieron reevaluar sus criterios de veracidad lógica.',
    interviewEvidenceAvailable: true,
    interviewFragmentIds: ['frag-007'],
    coincidences: 'Convergencia sólida: tanto la conducta externa (tiempo de inspección, exploración de alternativas) como el relato colectivo e individual confirman un efecto estimulador del pensamiento crítico.',
    divergencesAndContradictions: 'No se observaron contradicciones significativas; la divergencia observada estriba en la profundidad del análisis, más vinculada a la familiaridad con el contenido que al rechazo del método.',
    complementaryFindings: 'La entrevista aporta el testimonio epistemológico de cómo el estudiante transforma una intuición en un argumento formal guiado por las preguntas del sistema.',
    absenceOfEvidenceNotes: 'Evidencias completas en los 3 instrumentos.',
    researcherInterpretation: 'El tutor inteligente actúa como un catalizador del pensamiento crítico siempre que plantee contraejemplos contextualizados y exija justificación de premisas en lugar de premiar la adivinación.',
    pendingQuestions: '¿Se sostiene esta actitud analítica cuando el estudiante regresa al aula tradicional sin el andamiaje en pantalla?',
    lastUpdatedBy: 'Dr. Fernando Arbeláez',
    updatedAt: '2026-10-06T15:00:00Z'
  },
  {
    id: 'triang-003',
    categoryId: 'DIF-FRUST',
    transversalDimensionId: undefined,
    obsEvidenceSummary: 'En OBS8 se observaron manifestaciones corporales de enojo o desconcierto (suspiros, golpes suaves a la mesa, clics rápidos) ante mensajes reiterados de incorrección en 2 de 8 observaciones.',
    obsEvidenceAvailable: true,
    obsFragmentIds: ['frag-003'],
    gfEvidenceSummary: 'En GF8, los estudiantes verbalizaron que la frustración surge cuando las pistas son formuladas de forma críptica o cuando sienten que el sistema no reconoce matices válidos de su razonamiento.',
    gfEvidenceAvailable: true,
    gfFragmentIds: ['frag-005'],
    interviewEvidenceSummary: 'En E1 y E4 (EST-10B-08), el estudiante manifiesta vivencia de impotencia y sensación de que el software es "terco" y no dialoga con el alumno.',
    interviewEvidenceAvailable: true,
    interviewFragmentIds: ['frag-009'],
    coincidences: 'La frustración no es meramente técnica (usabilidad), sino epistemológica: radica en el choque entre las explicaciones intuitivas del alumno y la rigidez del modelo lógico del tutor.',
    divergencesAndContradictions: 'En la observación física la frustración parecía ser un enojo con el computador; en la entrevista se devela que es un malestar originado por la falta de una explicación pedagógica clara.',
    complementaryFindings: 'El grupo focal matiza que la frustración disminuye drásticamente si el tutor permite un segundo intento con una pista más directa o si existe mediación del profesor.',
    absenceOfEvidenceNotes: 'Información registrada y contrastada en las tres fuentes empíricas.',
    researcherInterpretation: 'La frustración es un indicador diagnóstico crucial: señala la zona de ruptura del andamiaje donde el STI deja de ser un tutor socrático y es percibido como un evaluador punitivo.',
    pendingQuestions: '¿Cuál es el umbral óptimo de intentos fallidos antes de que el STI deba ofrecer la respuesta comentada en lugar de una pista adicional?',
    lastUpdatedBy: 'Equipo Metodológico ROCAS',
    updatedAt: '2026-10-07T09:40:00Z'
  },
  {
    id: 'triang-004',
    categoryId: 'PER-ADAPT',
    transversalDimensionId: undefined,
    obsEvidenceSummary: 'Información no directamente observable en una sola sesión individual: no es posible observar directamente desde el exterior el algoritmo adaptativo sin comparar los registros de logs del servidor.',
    obsEvidenceAvailable: false,
    obsFragmentIds: [],
    gfEvidenceSummary: 'En GF9, surge una marcada polarización entre estudiantes que compararon sus pantallas con sus pares y constataron ramas diferentes, frente a quienes consideraron que el flujo era lineal para todos.',
    gfEvidenceAvailable: true,
    gfFragmentIds: ['frag-006'],
    interviewEvidenceSummary: 'En las entrevistas individuales la percepción de adaptación es difusa, ya que el estudiante no tiene punto de comparación en solitario.',
    interviewEvidenceAvailable: true,
    interviewFragmentIds: [],
    coincidences: 'Tanto en entrevistas como en grupo focal se aprecia que el estudiante promedio no comprende con claridad cómo opera el motor adaptativo del tutor.',
    divergencesAndContradictions: 'Mientras en GF se debatió sobre si el tutor era inteligente o lineal, las observaciones no pueden confirmar la vivencia subjetiva sin el testimonio oral.',
    complementaryFindings: 'El grupo focal resulta ser el instrumento idóneo para esta categoría, pues la interacción entre pares permite poner en común trayectorias individuales que ningún estudiante percibe de forma aislada.',
    absenceOfEvidenceNotes: 'OBSERVACIÓN: La ausencia de evidencia directa en Observación Estructurada (OBS) para PER-ADAPT responde a la naturaleza del fenómeno (la adaptatividad es un juicio inferencial interno o un proceso algorítmico interno, no una conducta externa inmediata). Esta ausencia NO constituye un resultado negativo, sino una delimitación metodológica del instrumento.',
    researcherInterpretation: 'Para que los estudiantes perciban la "inteligencia" adaptativa del STI, se requiere visibilizar de manera explícita por qué el sistema toma ciertas decisiones didácticas (p. ej., mensajes como "Detectamos que dominas premisas, pasemos a falacias complejas").',
    pendingQuestions: '¿Debe el STI incluir un indicador visual que informe al estudiante sobre el nivel de adaptación alcanzado?',
    lastUpdatedBy: 'Dra. Elena Restrepo',
    updatedAt: '2026-10-07T14:10:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-01T08:00:00Z',
    action: 'system_reset',
    entityType: 'system',
    entityId: 'sys-core',
    researcher: 'Equipo Metodológico ROCAS',
    summary: 'Inicialización de la plataforma y precarga de los 3 instrumentos (OBS1-8, GF1-10, E1-5) y 24 categorías de análisis.'
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-02T10:45:00Z',
    action: 'create_session',
    entityType: 'session',
    entityId: 'ses-obs-001',
    researcher: 'Dra. Elena Restrepo',
    summary: 'Registro completo de sesión de Observación Estructurada OBS-2026-001 para el estudiante EST-10B-04.'
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-02T11:55:00Z',
    action: 'create_session',
    entityType: 'session',
    entityId: 'ses-obs-002',
    researcher: 'Lic. Carlos Mejía',
    summary: 'Registro de sesión de Observación Estructurada OBS-2026-002 para el estudiante EST-10B-08.'
  },
  {
    id: 'aud-004',
    timestamp: '2026-10-04T16:35:00Z',
    action: 'create_session',
    entityType: 'session',
    entityId: 'ses-gf-001',
    researcher: 'Dr. Fernando Arbeláez',
    summary: 'Registro y transcripción segmentada del Grupo Focal GF-2026-001 con 5 participantes.'
  },
  {
    id: 'aud-005',
    timestamp: '2026-10-05T12:20:00Z',
    action: 'create_session',
    entityType: 'session',
    entityId: 'ses-e-001',
    researcher: 'Dra. Elena Restrepo',
    summary: 'Registro de Entrevista Semiestructurada E-2026-001 con el estudiante EST-10B-04.'
  },
  {
    id: 'aud-006',
    timestamp: '2026-10-06T11:30:00Z',
    action: 'triangulate',
    entityType: 'triangulation',
    entityId: 'triang-001',
    researcher: 'Dra. Elena Restrepo',
    summary: 'Consolidación de triangulación cualitativa para EXP-AUT (Autorregulación) y META-REG.'
  }
];
