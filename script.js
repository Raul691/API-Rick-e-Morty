// Variáveis globais de estado
const API_BASE = 'https://rickandmortyapi.com/api/character';
let paginaAtual = 1;
let totalPaginas = 1;
let modoFavoritos = false;

// Elementos do DOM
const cardsContainer = document.getElementById('cards-container');
const campoBusca = document.getElementById('campo-busca');
const filtroStatus = document.getElementById('filtro-status');
const btnAnterior = document.getElementById('btn-anterior');
const btnProxima = document.getElementById('btn-proxima');
const infoPagina = document.getElementById('info-pagina');
const btnFavoritos = document.getElementById('btn-favoritos');
const contadorFavs = document.getElementById('contador-favs');

// Obter favoritos guardados no localStorage (armazenados por ID)
function obterFavoritos() {
    return JSON.parse(localStorage.getItem('favoritos_rick_morty')) || [];
}

// Guardar favoritos no localStorage
function guardarFavoritos(favs) {
    localStorage.setItem('favoritos_rick_morty', JSON.stringify(favs));
    atualizarContadorFavoritos();
}

function atualizarContadorFavoritos() {
    contadorFavs.textContent = obterFavoritos().length;
}

// Função principal para carregar dados da API
async function carregarPersonagens() {
    if (modoFavoritos) return; // Se estiver no modo favoritos, não faz busca paginada

    const nome = campoBusca.value.trim();
    const status = filtroStatus.value;

    // Constrói os parâmetros do pedido
    let url = `${API_BASE}/?page=${paginaAtual}`;
    if (nome) url += `&name=${encodeURIComponent(nome)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;

    try {
        const response = await fetch(url);
        
        if (response.status === 404) {
            cardsContainer.innerHTML = '<p>Nenhum personagem encontrado com estes filtros.</p>';
            btnAnterior.disabled = true;
            btnProxima.disabled = true;
            infoPagina.textContent = 'Página 0 de 0';
            return;
        }

        const data = await response.json();
        totalPaginas = data.info.pages;
        
        // Atualiza a interface
        exibirPersonagens(data.results);
        atualizarPaginacao();

    } catch (error) {
        console.error('Erro ao procurar dados:', error);
        cardsContainer.innerHTML = '<p>Erro ao carregar dados da API.</p>';
    }
}

// Criar e injetar cards no DOM
function exibirPersonagens(personagens) {
    cardsContainer.innerHTML = '';
    const favoritos = obterFavoritos();

    personagens.forEach(personagem => {
        const card = document.createElement('div');
        card.classList.add('card');

        const ehFavorito = favoritos.includes(personagem.id);

        // Estrutura HTML do card
        card.innerHTML = `
            <button class="btn-coracao" data-id="${personagem.id}">
                ${ehFavorito ? '❤️' : '🤍'}
            </button>
            <img src="${personagem.image}" alt="${personagem.name}">
            <div class="card-info">
                <h3>${personagem.name}</h3>
                <p>Status: ${personagem.status} - ${personagem.species}</p>
            </div>
        `;

        // Evento do botão de favorito
        const btnCoracao = card.querySelector('.btn-coracao');
        btnCoracao.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorito(personagem.id);
        });

        cardsContainer.appendChild(card);
    });
}

// Alternar status de favorito
function toggleFavorito(id) {
    let favoritos = obterFavoritos();
    
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(favId => favId !== id);
    } else {
        favoritos.push(id);
    }

    guardarFavoritos(favoritos);

    if (modoFavoritos) {
        carregarFavoritosNaTela();
    } else {
        carregarPersonagens();
    }
}

// Mostrar apenas os personagens favoritados
async function carregarFavoritosNaTela() {
    const favoritos = obterFavoritos();

    if (favoritos.length === 0) {
        cardsContainer.innerHTML = '<p>Ainda não tens nenhum personagem nos favoritos.</p>';
        document.getElementById('paginacao').style.display = 'none';
        return;
    }

    try {
        // Pedido à API enviando múltiplos IDs (ex: /api/character/1,2,3)
        const response = await fetch(`${API_BASE}/${favoritos.join(',')}`);
        const data = await response.json();

        // Se for só 1 favorito, a API devolve um Objeto; se forem vários, devolve um Array
        const resultados = Array.isArray(data) ? data : [data];
        
        exibirPersonagens(resultados);
        document.getElementById('paginacao').style.display = 'none'; // Oculta a paginação nos favoritos

    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
    }
}

// Atualizar botões de paginação
function atualizarPaginacao() {
    document.getElementById('paginacao').style.display = 'flex';
    infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    btnAnterior.disabled = paginaAtual <= 1;
    btnProxima.disabled = paginaAtual >= totalPaginas;
}

// Event Listeners (Eventos dos controlos)
campoBusca.addEventListener('input', () => {
    paginaAtual = 1;
    modoFavoritos = false;
    carregarPersonagens();
});

filtroStatus.addEventListener('change', () => {
    paginaAtual = 1;
    modoFavoritos = false;
    carregarPersonagens();
});

btnAnterior.addEventListener('click', () => {
    if (paginaAtual > 1) {
        paginaAtual--;
        carregarPersonagens();
    }
});

btnProxima.addEventListener('click', () => {
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        carregarPersonagens();
    }
});

btnFavoritos.addEventListener('click', () => {
    modoFavoritos = !modoFavoritos;

    if (modoFavoritos) {
        btnFavoritos.textContent = 'Ver Todos 🌐';
        carregarFavoritosNaTela();
    } else {
        btnFavoritos.innerHTML = `Ver Favoritos ❤️ (<span id="contador-favs">${obterFavoritos().length}</span>)`;
        carregarPersonagens();
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    atualizarContadorFavoritos();
    carregarPersonagens();
});