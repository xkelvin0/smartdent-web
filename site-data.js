(function () {
    const defaults = {
        programs: [
            { id: 1, type: 'Diplomado', hours: '120 hrs', title: 'Diplomado en Derecho Notarial y Registral', description: 'Especialízate en trámites de escrituras públicas, transferencias de propiedad y calificación registral en la SUNARP.', image: 'img/curso1.jpg', active: true },
            { id: 2, type: 'Curso', hours: '40 hrs', title: 'Saneamiento Físico Legal de Predios', description: 'Aprende los procedimientos técnicos y legales para la regularización de inmuebles rústicos y urbanos.', image: 'img/curso2.jpg', active: true },
            { id: 3, type: 'Seminario', hours: '12 hrs', title: 'Precedentes de Observancia Obligatoria', description: 'Análisis exhaustivo de los fallos y resoluciones del Tribunal Registral con carácter vinculante y obligatorio.', image: 'img/curso3.jpg', active: true },
            { id: 4, type: 'Diplomado', hours: '140 hrs', title: 'Derecho de Contratos y Obligaciones Civiles', description: 'Redacción, interpretación y resolución de controversias en contratos típicos y atípicos.', image: 'img/curso4.jpg', active: true },
            { id: 5, type: 'Curso', hours: '48 hrs', title: 'Derecho Administrativo y Procedimiento Sancionador', description: 'Estudio integral de actos administrativos y estrategias de defensa ante entidades estatales.', image: 'img/curso5.jpg', active: true },
            { id: 6, type: 'Seminario', hours: '16 hrs', title: 'Garantías Reales y Ejecución de Hipotecas', description: 'Constitución de hipotecas, calificación registral y procesos judiciales de ejecución de garantías.', image: 'img/curso6.jpg', active: true }
        ],
        allies: [
            { id: 1, short: 'MTC', name: 'Ministerio de Transportes y Comunicaciones', category: 'Entidad pública', image: 'img/mtc.png', active: true },
            { id: 2, short: 'SUNARP', name: 'SUNARP', category: 'Zona Registral XIV · Ayacucho', image: 'img/sunarp ayacucho.png', active: true },
            { id: 3, short: 'PROVÍAS', name: 'Provías Nacional', category: 'Infraestructura vial', image: 'img/provias.png', active: true },
            { id: 4, short: 'GL', name: 'Notaría Gonzales Loli', category: 'Institución notarial', image: 'img/notaria.png', active: true },
            { id: 5, short: 'PJ', name: 'Corte Superior de Justicia', category: 'Distrito Judicial de Huancavelica', image: 'img/corte superior.png', active: true },
            { id: 6, short: 'SUNARP', name: 'SUNARP', category: 'Zona Registral III · Moyobamba', image: 'img/sunarp moyobamba.png', active: true },
            { id: 7, short: 'ERCC', name: 'ERCC', category: 'Institución aliada', image: 'img/Notaria_Raul_Camacho_2021.png', active: true },
            { id: 8, short: 'PJ', name: 'Corte Superior de Justicia', category: 'Distrito Judicial de Lima Norte', image: 'img/corte justicia.png', active: true },
            { id: 9, short: 'PAINO', name: 'Notaría Paino', category: 'Institución notarial', image: 'img/paino.png', active: true },
            { id: 10, short: 'SUNARP', name: 'SUNARP', category: 'Zona Registral IX · Lima', image: 'img/sunarp lima.jpg', active: true },
            { id: 11, short: 'SBN', name: 'Superintendencia Nacional de Bienes Estatales', category: 'Entidad pública · SBN', image: 'img/sbn.png', active: true }
        ]
    };
    if (localStorage.getItem('ej_data_version') !== '5') {
        const savedAllies = localStorage.getItem('ej_allies');
        if (savedAllies) {
            const migrated = JSON.parse(savedAllies).map(item => {
                const base = defaults.allies.find(ally => Number(ally.id) === Number(item.id));
                return base ? { ...item, image: base.image } : item;
            });
            localStorage.setItem('ej_allies', JSON.stringify(migrated));
        }
        const savedPrograms = localStorage.getItem('ej_programs');
        if (savedPrograms) {
            const migratedPrograms = JSON.parse(savedPrograms).map(item => {
                const base = defaults.programs.find(p => Number(p.id) === Number(item.id));
                return base ? { ...item, image: base.image } : item;
            });
            localStorage.setItem('ej_programs', JSON.stringify(migratedPrograms));
        }
        localStorage.setItem('ej_data_version', '5');
    }
    function read(key) {
        const saved = localStorage.getItem(`ej_${key}`);
        if (!saved) return structuredClone(defaults[key]);
        return JSON.parse(saved).map(item => ({ ...(defaults[key].find(base => Number(base.id) === Number(item.id)) || {}), ...item }));
    }
    function write(key, value) { localStorage.setItem(`ej_${key}`, JSON.stringify(value)); }
    window.EJData = { defaults, getPrograms: () => read('programs'), savePrograms: v => write('programs', v), getAllies: () => read('allies'), saveAllies: v => write('allies', v) };
})();
