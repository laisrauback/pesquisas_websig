// ========================================
// CRIAÇÃO DO MAPA
// ========================================

const mapa = L.map('map', {
    zoomControl: false
}).setView([-14.2, -51.9], 4);


// ========================================
// CONTROLES DO MAPA
// ========================================

// Botão de zoom no canto superior direito
L.control.zoom({
    position: 'topright'
}).addTo(mapa);

// Escala no canto inferior esquerdo
L.control.scale({
    position: 'bottomleft',
    metric: true,
    imperial: false
}).addTo(mapa);


// ========================================
// MAPA BASE
// ========================================

const osm = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
);

osm.addTo(mapa);


// ========================================
// ESTADOS DO BRASIL
// ========================================

let camadaEstados;
let camadaMunicipios = null;
let estadoAtual = null;


// ========================================
// ESTADOS DISPONÍVEIS PARA PESQUISA
// ========================================

const estadosDisponiveis = [
    'RS',
    'SC',
    'PR',
    'RJ',
    'SP',
    'ES',
    'MG',
    'MT',
    'MS',
    'GO',
    'DF'
];


// ========================================
// CACHE DOS DADOS
// ========================================

const cacheMunicipios = {};
const cachePesquisas = {};


// ========================================
// CÓDIGOS DOS ESTADOS
// ========================================

const ufPorCodigo = {
    11: 'RO',
    12: 'AC',
    13: 'AM',
    14: 'RR',
    15: 'PA',
    16: 'AP',
    17: 'TO',
    21: 'MA',
    22: 'PI',
    23: 'CE',
    24: 'RN',
    25: 'PB',
    26: 'PE',
    27: 'AL',
    28: 'SE',
    29: 'BA',
    31: 'MG',
    32: 'ES',
    33: 'RJ',
    35: 'SP',
    41: 'PR',
    42: 'SC',
    43: 'RS',
    50: 'MS',
    51: 'MT',
    52: 'GO',
    53: 'DF'
};


// ========================================
// CARREGAR ESTADOS
// ========================================

fetch('dados/brasil/BR_UF_2024.geojson')
    .then(response => response.json())
    .then(dados => {

        camadaEstados = L.geoJSON(dados, {

            style: {
                color: '#333',
                weight: 1,
                fillColor: '#d9d9d9',
                fillOpacity: 0.5
            },

            onEachFeature: function (feature, layer) {

                const codigoUF = feature.properties.CD_UF;

                const uf = ufPorCodigo[codigoUF];

                layer.bindPopup(
                    `<strong>${uf}</strong>`
                );

                layer.on('click', function () {

                    carregarMunicipios(uf);

                });

            }

        }).addTo(mapa);

        mapa.fitBounds(
            camadaEstados.getBounds()
        );

    })
    .catch(erro => {

        console.error(
            'Erro ao carregar BR_UF_2024.geojson:',
            erro
        );

    });


// ========================================
// CARREGAR MUNICÍPIOS
// ========================================

function carregarMunicipios(uf, codigoMunicipioSelecionado = null) {

    estadoAtual = uf;

    // Se já houver municípios carregados,
    // remove antes de carregar outro estado
    if (camadaMunicipios) {

        mapa.removeLayer(camadaMunicipios);
        camadaMunicipios = null;

    }

    // Se os municípios já estiverem no cache,
    // usa os dados existentes
    if (cacheMunicipios[uf]) {

        mostrarMunicipios(
            uf,
            cacheMunicipios[uf],
            codigoMunicipioSelecionado
        );

        return;
    }

    const arquivo =
        `dados/municipios/${uf}_Municipios_2024.geojson`;

    fetch(arquivo)
        .then(response => {

            if (!response.ok) {

                throw new Error(
                    `Arquivo não encontrado: ${arquivo}`
                );

            }

            return response.json();

        })
        .then(dados => {

            cacheMunicipios[uf] = dados;

            mostrarMunicipios(
                uf,
                dados,
                codigoMunicipioSelecionado
            );

        })
        .catch(erro => {

            console.error(
                'Erro ao carregar municípios:',
                erro
            );

            alert(
                `Não foi possível carregar os municípios de ${uf}.`
            );

        });
}


// ========================================
// MOSTRAR MUNICÍPIOS
// ========================================

function mostrarMunicipios(
    uf,
    dados,
    codigoMunicipioSelecionado = null
) {

    estadoAtual = uf;

    camadaMunicipios = L.geoJSON(dados, {

        style: {
            color: '#555',
            weight: 1,
            fillColor: '#eeeeee',
            fillOpacity: 0.4
        },

        onEachFeature: function (feature, layer) {

            const nome =
                feature.properties.NM_MUN;

            const codigoMunicipio =
                feature.properties.CD_MUN;

            // Clique no município
            layer.on('click', function () {

                abrirModalMunicipio(
                    uf,
                    codigoMunicipio,
                    nome
                );

            });

        }

    }).addTo(mapa);


    // Se foi selecionado um município
    // através da barra de pesquisa
    if (codigoMunicipioSelecionado) {

        let municipioEncontrado = null;

        dados.features.forEach(feature => {

            if (
                String(feature.properties.CD_MUN) ===
                String(codigoMunicipioSelecionado)
            ) {

                municipioEncontrado = feature;

            }

        });

        if (municipioEncontrado) {

            const camadaTemporaria =
                L.geoJSON(municipioEncontrado);

            mapa.fitBounds(
                camadaTemporaria.getBounds(),
                {
                    padding: [30, 30]
                }
            );

            abrirModalMunicipio(
                uf,
                municipioEncontrado.properties.CD_MUN,
                municipioEncontrado.properties.NM_MUN
            );

        }

    } else {

        mapa.fitBounds(
            camadaMunicipios.getBounds()
        );

    }

}


// ========================================
// ABRIR MODAL DO MUNICÍPIO
// ========================================

function abrirModalMunicipio(
    uf,
    codigoMunicipio,
    nomeMunicipio,
    pesquisaSelecionada = null
) {

    estadoAtual = uf;

    document.getElementById(
        'modalMunicipioLabel'
    ).textContent = nomeMunicipio;

    document.getElementById(
        'conteudoMunicipio'
    ).innerHTML = `
        <p>Carregando pesquisas...</p>
    `;

    const elementoModal =
        document.getElementById('modalMunicipio');

    const modal =
        new bootstrap.Modal(elementoModal);

    modal.show();


    // ========================================
    // CARREGAR PESQUISAS
    // ========================================

    carregarPesquisasEstado(uf)
        .then(pesquisas => {

            const pesquisasMunicipio =
                pesquisas[codigoMunicipio];


            // Não encontrou pesquisas
            if (
                !pesquisasMunicipio ||
                pesquisasMunicipio.length === 0
            ) {

                document.getElementById(
                    'conteudoMunicipio'
                ).innerHTML = `
                    <p>
                        Não foram encontradas pesquisas
                        arqueológicas para este município.
                    </p>
                `;

                return;

            }


            // ========================================
            // MONTAR MODAL
            // ========================================

            let html = `
                <p>
                    <strong>
                        ${pesquisasMunicipio.length}
                    </strong>
                    pesquisa(s) arqueológica(s) encontrada(s).
                </p>

                <div class="list-group">
            `;


            pesquisasMunicipio.forEach(pesquisa => {

                html += `
                    <div class="list-group-item">

                        <h5 class="mb-2">
                            ${pesquisa.nome}
                        </h5>

                        <p class="mb-1">
                            <strong>Instituição:</strong>
                            ${pesquisa.instituicao || 'Não informado'}
                        </p>

                        <p class="mb-3">
                            <strong>Ano:</strong>
                            ${pesquisa.ano || 'Não informado'}
                        </p>

                        <a
                            href="${pesquisa.link}"
                            target="_blank"
                            class="btn btn-primary btn-sm">
                            Abrir pesquisa
                        </a>

                    </div>
                `;

            });


            html += `</div>`;


            document.getElementById(
                'conteudoMunicipio'
            ).innerHTML = html;


        })
        .catch(erro => {

            console.error(
                'Erro ao carregar pesquisas:',
                erro
            );

            document.getElementById(
                'conteudoMunicipio'
            ).innerHTML = `
                <div class="alert alert-danger">
                    Não foi possível carregar as pesquisas
                    deste município.
                </div>
            `;

        });

}


// ========================================
// CARREGAR JSON DE PESQUISAS
// ========================================

function carregarPesquisasEstado(uf) {

    // Se já estiver no cache
    if (cachePesquisas[uf]) {

        return Promise.resolve(
            cachePesquisas[uf]
        );

    }


    return fetch(
        `dados/pesquisas/${uf}.json`
    )
        .then(response => {

            if (!response.ok) {

                throw new Error(
                    `Não foi possível carregar ${uf}.json`
                );

            }

            return response.json();

        })
        .then(dados => {

            cachePesquisas[uf] = dados;

            return dados;

        });

}

// ========================================
// BARRA DE PESQUISA
// ========================================

const campoPesquisa =
    document.getElementById('campo-pesquisa');

const resultadosPesquisa =
    document.getElementById('resultados-pesquisa');

let timerPesquisa = null;


// ========================================
// NORMALIZAR TEXTO
// ========================================

function normalizarTexto(texto) {

    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

}


// ========================================
// DIGITAÇÃO NA BARRA
// ========================================

campoPesquisa.addEventListener('input', function () {

    clearTimeout(timerPesquisa);

    const termo =
        normalizarTexto(campoPesquisa.value);

    if (termo.length < 2) {

        resultadosPesquisa.style.display = 'none';
        resultadosPesquisa.innerHTML = '';

        return;

    }

    resultadosPesquisa.style.display = 'block';

    resultadosPesquisa.innerHTML = `
        <div class="resultado-pesquisa">
            Pesquisando...
        </div>
    `;

    timerPesquisa = setTimeout(() => {

        realizarPesquisa(termo);

    }, 300);

});


// ========================================
// REALIZAR PESQUISA
// ========================================

async function realizarPesquisa(termo) {

    const resultados = [];


    // ========================================
    // PESQUISAR MUNICÍPIOS
    // ========================================

    const buscasMunicipios =
        estadosDisponiveis.map(async uf => {

            try {

                let dados;

                if (cacheMunicipios[uf]) {

                    dados = cacheMunicipios[uf];

                } else {

                    const resposta = await fetch(
                        `dados/municipios/${uf}_Municipios_2024.geojson`
                    );

                    if (!resposta.ok) {
                        return;
                    }

                    dados = await resposta.json();

                    cacheMunicipios[uf] = dados;

                }


                if (
                    !dados ||
                    !dados.features
                ) {
                    return;
                }


                dados.features.forEach(feature => {

                    const nome =
                        feature.properties.NM_MUN || '';

                    if (
                        normalizarTexto(nome)
                            .includes(termo)
                    ) {

                        resultados.push({

                            tipo: 'municipio',

                            uf: uf,

                            codigo:
                                feature.properties.CD_MUN,

                            nome: nome

                        });

                    }

                });

            } catch (erro) {

                console.warn(
                    `Erro ao pesquisar municípios de ${uf}:`,
                    erro
                );

            }

        });


    // ========================================
    // PESQUISAR PESQUISAS
    // ========================================

    const buscasPesquisas =
        estadosDisponiveis.map(async uf => {

            try {

                const pesquisas =
                    await carregarPesquisasEstado(uf);


                if (!pesquisas) {
                    return;
                }


                for (
                    const codigoMunicipio in pesquisas
                ) {

                    const lista =
                        pesquisas[codigoMunicipio];


                    if (!Array.isArray(lista)) {
                        continue;
                    }


                    lista.forEach(pesquisa => {

                        const nomePesquisa =
                            pesquisa.nome || '';


                        if (
                            normalizarTexto(nomePesquisa)
                                .includes(termo)
                        ) {

                            resultados.push({

                                tipo: 'pesquisa',

                                uf: uf,

                                codigo:
                                    codigoMunicipio,

                                nome:
                                    nomePesquisa,

                                instituicao:
                                    pesquisa.instituicao || '',

                                ano:
                                    pesquisa.ano || ''

                            });

                        }

                    });

                }

            } catch (erro) {

                console.warn(
                    `Erro ao pesquisar pesquisas de ${uf}:`,
                    erro
                );

            }

        });


    // Espera todas as buscas terminarem
    await Promise.all([
        ...buscasMunicipios,
        ...buscasPesquisas
    ]);


    // ========================================
    // REMOVER DUPLICADOS
    // ========================================

    const resultadosUnicos = [];

    const chaves = new Set();


    resultados.forEach(resultado => {

        const chave =
            `${resultado.tipo}|${resultado.uf}|${resultado.codigo}|${resultado.nome}`;

        if (!chaves.has(chave)) {

            chaves.add(chave);

            resultadosUnicos.push(resultado);

        }

    });


    // ========================================
    // MOSTRAR RESULTADOS
    // ========================================

    mostrarResultadosPesquisa(
        resultadosUnicos
    );

}


// ========================================
// MOSTRAR RESULTADOS
// ========================================

function mostrarResultadosPesquisa(resultados) {

    resultadosPesquisa.innerHTML = '';


    if (resultados.length === 0) {

        resultadosPesquisa.innerHTML = `
            <div class="resultado-pesquisa">
                Nenhum resultado encontrado.
            </div>
        `;

        resultadosPesquisa.style.display = 'block';

        return;

    }


    // Máximo de 30 resultados
    const resultadosExibidos =
        resultados.slice(0, 30);


    resultadosExibidos.forEach(resultado => {

        const elemento =
            document.createElement('div');

        elemento.className =
            'resultado-pesquisa';


        // ========================================
        // MUNICÍPIO
        // ========================================

        if (
            resultado.tipo === 'municipio'
        ) {

            elemento.innerHTML = `
                <strong>
                    ${resultado.nome}
                </strong>

                <span class="tipo-resultado">
                    Município — ${resultado.uf}
                </span>
            `;

        }


        // ========================================
        // PESQUISA ARQUEOLÓGICA
        // ========================================

        else {

            elemento.innerHTML = `
                <strong>
                    ${resultado.nome}
                </strong>

                <span class="tipo-resultado">
                    Pesquisa arqueológica — ${resultado.uf}
                </span>

                ${
                    resultado.ano
                    ? `
                        <span class="tipo-resultado">
                            Ano: ${resultado.ano}
                        </span>
                    `
                    : ''
                }
            `;

        }


        // ========================================
        // CLIQUE
        // ========================================

        elemento.addEventListener(
            'click',
            function () {

                selecionarResultado(
                    resultado
                );

            }
        );


        resultadosPesquisa.appendChild(
            elemento
        );

    });


    resultadosPesquisa.style.display =
        'block';

}


// ========================================
// SELECIONAR RESULTADO
// ========================================

function selecionarResultado(resultado) {

    // Coloca o nome na barra
    campoPesquisa.value =
        resultado.nome;

    // Fecha a lista
    resultadosPesquisa.style.display =
        'none';


    // ========================================
    // MUNICÍPIO
    // ========================================

    if (
        resultado.tipo === 'municipio'
    ) {

        carregarMunicipios(
            resultado.uf,
            resultado.codigo
        );

        return;

    }


    // ========================================
    // PESQUISA ARQUEOLÓGICA
    // ========================================

    if (
        resultado.tipo === 'pesquisa'
    ) {

        carregarMunicipios(
            resultado.uf,
            resultado.codigo
        );

    }

}


// ========================================
// FECHAR RESULTADOS AO CLICAR FORA
// ========================================

document.addEventListener(
    'click',
    function (evento) {

        const areaPesquisa =
            document.getElementById(
                'area-pesquisa'
            );


        if (
            areaPesquisa &&
            !areaPesquisa.contains(
                evento.target
            )
        ) {

            resultadosPesquisa.style.display =
                'none';

        }

    }
);