/* =========================================================
   Pokedex — app.js  (v2)
   ========================================================= */
(function () {
  'use strict';

  // =====================================================
  // CONSTANTS & CONFIG
  // =====================================================
  const API_BASE = 'https://pokeapi.co/api/v2';
  const OFFICIAL_ARTWORK = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
  const SPRITE_FALLBACK  = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
  const POKEBALL_SVG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23ef4444' stroke='%23222' stroke-width='6'/%3E%3Cpath d='M5 50 A45 45 0 0 0 95 50 Z' fill='%23ffffff' stroke='%23222' stroke-width='6'/%3E%3Cpath d='M5 50 H95' stroke='%23222' stroke-width='8'/%3E%3Ccircle cx='50' cy='50' r='14' fill='%23ffffff' stroke='%23222' stroke-width='6'/%3E%3Ccircle cx='50' cy='50' r='6' fill='%23222'/%3E%3C/svg%3E";

  const TYPE_DEFAULT_POKEMON = {
    normal:   { name: 'Snorlax',    id: 143 },
    fire:     { name: 'Charizard',  id: 6 },
    water:    { name: 'Blastoise',  id: 9 },
    electric: { name: 'Pikachu',    id: 25 },
    grass:    { name: 'Sceptile',   id: 254 },
    ice:      { name: 'Lapras',     id: 131 },
    fighting: { name: 'Lucario',    id: 448 },
    poison:   { name: 'Gengar',     id: 94 },
    ground:   { name: 'Groudon',    id: 383 },
    flying:   { name: 'Pidgeot',    id: 18 },
    psychic:  { name: 'Mewtwo',     id: 150 },
    bug:      { name: 'Scizor',     id: 212 },
    rock:     { name: 'Tyranitar',  id: 248 },
    ghost:    { name: 'Gengar',     id: 94 },
    dragon:   { name: 'Rayquaza',   id: 384 },
    dark:     { name: 'Umbreon',    id: 197 },
    steel:    { name: 'Steelix',    id: 208 },
    fairy:    { name: 'Sylveon',    id: 700 }
  };

  const GENERATIONS = [
    { label: 'Gen I   (#1–151)',    offset: 0,   limit: 151 },
    { label: 'Gen II  (#152–251)',  offset: 151, limit: 100 },
    { label: 'Gen III (#252–386)',  offset: 251, limit: 135 },
    { label: 'Gen IV  (#387–493)',  offset: 386, limit: 107 },
    { label: 'Gen V   (#494–649)',  offset: 493, limit: 156 },
    { label: 'Gen VI  (#650–721)',  offset: 649, limit: 72  },
    { label: 'Gen VII (#722–809)',  offset: 721, limit: 88  },
    { label: 'Gen VIII(#810–905)', offset: 809, limit: 96  },
    { label: 'Gen IX  (#906–1025)', offset: 905, limit: 120 },
  ];

  const TYPE_COLORS = {
    normal:'#9fa19f', fire:'#e62829', water:'#2980ef', electric:'#fac000',
    grass:'#3fa129', ice:'#3dcef3', fighting:'#ff8000', poison:'#9141cb',
    ground:'#915121', flying:'#81b9ef', psychic:'#ef4179', bug:'#91a119',
    rock:'#afa981', ghost:'#704170', dragon:'#5060e1', dark:'#624d4e',
    steel:'#60a1b8', fairy:'#ef70ef', unknown:'#69a090',
  };

  const STAT_COLORS = {
    hp:'#ff5959', attack:'#f5ac78', defense:'#fae078',
    'special-attack':'#9db7f5', 'special-defense':'#a7db8d', speed:'#fa92b2',
  };

  const STAT_LABELS = {
    hp:'HP', attack:'ATK', defense:'DEF',
    'special-attack':'Sp.ATK', 'special-defense':'Sp.DEF', speed:'SPD',
  };

  // Gen 6+ Type Effectiveness chart
  const TYPE_CHART = {
    normal:   { weak:['fighting'],                           immune:['ghost'],               resist:[] },
    fire:     { weak:['water','ground','rock'],               immune:[],                      resist:['fire','grass','ice','bug','steel','fairy'] },
    water:    { weak:['electric','grass'],                   immune:[],                      resist:['fire','water','ice','steel'] },
    electric: { weak:['ground'],                             immune:[],                      resist:['electric','flying','steel'] },
    grass:    { weak:['fire','ice','poison','flying','bug'], immune:[],                      resist:['water','electric','grass','ground'] },
    ice:      { weak:['fire','fighting','rock','steel'],     immune:[],                      resist:['ice'] },
    fighting: { weak:['flying','psychic','fairy'],           immune:[],                      resist:['bug','rock','dark'] },
    poison:   { weak:['ground','psychic'],                   immune:[],                      resist:['grass','fighting','poison','bug','fairy'] },
    ground:   { weak:['water','grass','ice'],                immune:['electric'],            resist:['poison','rock'] },
    flying:   { weak:['electric','ice','rock'],              immune:['ground'],              resist:['grass','fighting','bug'] },
    psychic:  { weak:['bug','ghost','dark'],                 immune:[],                      resist:['fighting','psychic'] },
    bug:      { weak:['fire','flying','rock'],               immune:[],                      resist:['grass','fighting','ground'] },
    rock:     { weak:['water','grass','fighting','ground','steel'], immune:[],              resist:['normal','fire','poison','flying'] },
    ghost:    { weak:['ghost','dark'],                       immune:['normal','fighting'],   resist:['poison','bug'] },
    dragon:   { weak:['ice','dragon','fairy'],               immune:[],                      resist:['fire','water','electric','grass'] },
    dark:     { weak:['fighting','bug','fairy'],             immune:['psychic'],             resist:['ghost','dark'] },
    steel:    { weak:['fire','fighting','ground'],           immune:['poison'],              resist:['normal','grass','ice','flying','psychic','bug','rock','dragon','steel','fairy'] },
    fairy:    { weak:['poison','steel'],                     immune:['dragon'],              resist:['fighting','bug','dark'] },
  };

  // =====================================================
  // STATE
  // =====================================================
  let allPokemon              = [];
  let globalPokemonDirectory  = [];
  const globalPokemonCache    = new Map();
  let searchDebounceTimer     = null;
  let currentGenIndex         = 0;
  let activeTypeFilter        = null;
  let favorites               = JSON.parse(localStorage.getItem('pokefavorites') || '[]');

  // Game state
  const sil = {
    pokemon: null, score: 0, streak: 0,
    bestStreak: parseInt(localStorage.getItem('pokeBestStreak') || '0'),
    lives: 3, timer: null, timeLeft: 30, revealed: false,
  };

  // =====================================================
  // DOM REFS
  // =====================================================
  const progressBar     = document.getElementById('progressBar');
  const pokedexGrid     = document.getElementById('pokedexGrid');
  const statusContainer = document.getElementById('statusContainer');
  const loaderWrapper   = document.getElementById('loaderWrapper');
  const searchInput     = document.getElementById('searchInput');
  const searchBtn       = document.getElementById('searchBtn');
  const darkModeBtn     = document.getElementById('darkModeBtn');
  const surpriseBtn     = document.getElementById('surpriseBtn');
  const genSelect       = document.getElementById('genSelect');
  const typeFiltersEl   = document.getElementById('typeFilters');
  const resultCounter   = document.getElementById('resultCounter');
  const modalOverlay    = document.getElementById('modalOverlay');
  const modalCard       = document.getElementById('modalCard');
  const favCountBadge   = document.getElementById('favCount');
  const showFavsBtn     = document.getElementById('showFavsBtn');
  const gamesBtn        = document.getElementById('gamesBtn');
  const gameOverlay     = document.getElementById('gameOverlay');
  const gameModalEl     = document.getElementById('gameModal');

  // =====================================================
  // PROGRESS BAR
  // =====================================================
  function setProgress(pct) {
    progressBar.style.width  = pct + '%';
    progressBar.style.opacity = pct >= 100 ? '0' : '1';
  }

  // =====================================================
  // STATUS / LOADER
  // =====================================================
  function showStatus(msg, isError = false) {
    statusContainer.textContent = msg;
    statusContainer.style.display = 'block';
    if (isError) statusContainer.style.borderColor = 'rgba(220,10,45,0.4)';
    else         statusContainer.style.borderColor = 'var(--card-border)';
    loaderWrapper.style.display = 'none';
  }
  function hideStatus() { statusContainer.style.display = 'none'; }
  function showLoader() {
    loaderWrapper.style.display = 'flex'; statusContainer.style.display = 'none';
    pokedexGrid.innerHTML = ''; setProgress(5);
  }
  function hideLoader() {
    loaderWrapper.style.display = 'none'; setProgress(100);
    setTimeout(() => setProgress(0), 600);
  }

  // =====================================================
  // FAVOURITES
  // =====================================================
  function saveFavorites() {
    localStorage.setItem('pokefavorites', JSON.stringify(favorites));
    favCountBadge.textContent = favorites.length;
  }

  function toggleFavorite(id) {
    const idx = favorites.indexOf(id);
    if (idx === -1) favorites.push(id);
    else favorites.splice(idx, 1);
    saveFavorites();

    document.querySelectorAll(`.fav-btn[data-id="${id}"]`).forEach(btn => {
      btn.textContent = favorites.includes(id) ? '❤️' : '🤍';
      btn.classList.toggle('active', favorites.includes(id));
    });
    const mfb = document.getElementById('modalFavBtn');
    if (mfb && parseInt(mfb.dataset.id) === id) {
      mfb.textContent = favorites.includes(id) ? '❤️' : '🤍';
      mfb.classList.toggle('active', favorites.includes(id));
    }
  }

  // =====================================================
  // RENDER CARDS
  // =====================================================
  function renderPokemonList(pokemonArray) {
    if (!pokemonArray || pokemonArray.length === 0) {
      pokedexGrid.innerHTML = '';
      showStatus('No se encontraron Pokémon 🧐', true);
      resultCounter.textContent = '0 resultados';
      return;
    }
    hideStatus();
    pokedexGrid.innerHTML = '';
    resultCounter.textContent = `${pokemonArray.length} Pokémon`;
    pokemonArray.forEach((p, i) => pokedexGrid.appendChild(createCard(p, i)));
  }

  function getPokemonGeneration(id) {
    const num = typeof id === 'number' ? id : parseInt(id, 10);
    if (!num || num <= 0) return { roman: 'Gen ?', region: 'Desconocida', full: 'Generación Desconocida' };
    if (num <= 151)  return { roman: 'Gen I',    region: 'Kanto',    full: 'Gen I (Kanto)' };
    if (num <= 251)  return { roman: 'Gen II',   region: 'Johto',    full: 'Gen II (Johto)' };
    if (num <= 386)  return { roman: 'Gen III',  region: 'Hoenn',    full: 'Gen III (Hoenn)' };
    if (num <= 493)  return { roman: 'Gen IV',   region: 'Sinnoh',   full: 'Gen IV (Sinnoh)' };
    if (num <= 649)  return { roman: 'Gen V',    region: 'Teselia',  full: 'Gen V (Teselia)' };
    if (num <= 721)  return { roman: 'Gen VI',   region: 'Kalos',    full: 'Gen VI (Kalos)' };
    if (num <= 809)  return { roman: 'Gen VII',  region: 'Alola',    full: 'Gen VII (Alola)' };
    if (num <= 905)  return { roman: 'Gen VIII', region: 'Galar',    full: 'Gen VIII (Galar)' };
    return                 { roman: 'Gen IX',   region: 'Paldea',   full: 'Gen IX (Paldea)' };
  }

  function createCard(pokemon, idx) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    card.style.animationDelay = `${Math.min(idx * 35, 500)}ms`;

    const idNum      = pokemon.id;
    const id         = idNum.toString().padStart(3, '0');
    const genInfo    = getPokemonGeneration(idNum);
    const spriteUrl  = getSpriteUrl(pokemon);
    const fallbackUrl= `${SPRITE_FALLBACK}${idNum}.png`;
    const types      = (pokemon.types && pokemon.types.length > 0) ? pokemon.types.map(t => t.type.name) : ['normal'];
    const primary    = types[0] || 'normal';
    const color      = TYPE_COLORS[primary] || '#9fa19f';
    const isFav      = favorites.includes(idNum);
    const typeBadges = types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');

    card.dataset.id = idNum;
    card.style.setProperty('--card-type-color', color);

    card.innerHTML = `
      <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${idNum}" aria-label="Favorito">
        ${isFav ? '❤️' : '🤍'}
      </button>
      <div class="pokemon-sprite">
        <img src="${spriteUrl || fallbackUrl}" alt="${pokemon.name}" loading="lazy"
          onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${fallbackUrl}';}else{this.onerror=null;this.src='${POKEBALL_SVG_PLACEHOLDER}';}">
      </div>
      <div class="card-meta-row">
        <span class="pokemon-id">#${id}</span>
        <span class="pokemon-gen-badge" title="${genInfo.full}">${genInfo.roman}</span>
      </div>
      <span class="pokemon-name">${pokemon.name}</span>
      <div class="pokemon-types">${typeBadges}</div>
    `;

    card.querySelector('.fav-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(pokemon.id);
    });
    card.addEventListener('click', () => openModal(pokemon));
    return card;
  }

  function getSpriteUrl(pokemon) {
    if (!pokemon) return POKEBALL_SVG_PLACEHOLDER;
    const id = pokemon.id || (typeof pokemon === 'number' ? pokemon : null);
    if (pokemon.sprites?.other?.['official-artwork']?.front_default) {
      return pokemon.sprites.other['official-artwork'].front_default;
    }
    if (pokemon.sprites?.front_default) {
      return pokemon.sprites.front_default;
    }
    if (id) {
      return `${OFFICIAL_ARTWORK}${id}.png`;
    }
    return POKEBALL_SVG_PLACEHOLDER;
  }

  // =====================================================
  // GLOBAL DIRECTORY (ALL GENERATIONS)
  // =====================================================
  async function loadGlobalDirectory() {
    try {
      const res = await fetch(`${API_BASE}/pokemon?limit=1025`);
      if (res.ok) {
        const data = await res.json();
        globalPokemonDirectory = data.results.map((item, idx) => {
          const m = (item.url || '').match(/\/(\d+)\/?$/);
          const id = m ? parseInt(m[1], 10) : (idx + 1);
          return { id, name: item.name, url: item.url };
        });
      }
    } catch (e) {
      console.warn('No se pudo cargar el directorio global de Pokémon', e);
    }
  }

  // =====================================================
  // FILTER & SEARCH
  // =====================================================
  function getDisplayList() {
    let list = [...allPokemon];
    if (activeTypeFilter) list = list.filter(p => p.types.some(t => t.type.name === activeTypeFilter));
    return list;
  }

  async function performSearch() {
    clearTimeout(searchDebounceTimer);
    const rawQuery = searchInput.value.trim();
    if (!rawQuery) {
      renderPokemonList(getDisplayList());
      hideStatus();
      return;
    }

    const cleanQuery = rawQuery.replace(/^#+/, '').trim().toLowerCase();
    const parsedId   = parseInt(cleanQuery, 10);
    const isNumber   = /^\d+$/.test(cleanQuery) && !isNaN(parsedId) && parsedId > 0;

    let matches = [];

    // Search across all generations
    if (globalPokemonDirectory.length > 0) {
      if (isNumber) {
        matches = globalPokemonDirectory.filter(p => p.id === parsedId);
      } else {
        matches = globalPokemonDirectory.filter(p =>
          p.name.toLowerCase().includes(cleanQuery) || p.id.toString() === cleanQuery
        );
      }
    } else {
      if (isNumber) {
        matches = allPokemon.filter(p => p.id === parsedId);
      } else {
        matches = allPokemon.filter(p =>
          p.name.toLowerCase().includes(cleanQuery) || p.id.toString() === cleanQuery
        );
      }
    }

    // Direct API fallback if not found in directory
    if (matches.length === 0) {
      showLoader();
      try {
        const lookup = isNumber ? parsedId : cleanQuery;
        const res = await fetch(`${API_BASE}/pokemon/${lookup}`);
        if (res.ok) {
          const directData = await res.json();
          directData.detailsLoaded = true;
          globalPokemonCache.set(directData.id, directData);
          hideLoader();
          hideStatus();
          renderPokemonList([directData]);
          const gInfo = getPokemonGeneration(directData.id);
          resultCounter.textContent = `1 resultado: #${directData.id.toString().padStart(3, '0')} ${directData.name} · ${gInfo.full}`;
          return;
        }
      } catch (e) { /* not found */ }

      hideLoader();
      pokedexGrid.innerHTML = '';
      showStatus(`No se encontró ningún Pokémon con "${rawQuery}" en ninguna generación 🧐`, true);
      resultCounter.textContent = '0 resultados';
      return;
    }

    // Convert matches to Pokemon objects
    const resultList = matches.map(item => {
      if (globalPokemonCache.has(item.id)) {
        return globalPokemonCache.get(item.id);
      }
      const pObj = {
        id: item.id,
        name: item.name,
        url: item.url,
        sprites: {
          front_default: `${SPRITE_FALLBACK}${item.id}.png`,
          other: {
            'official-artwork': { front_default: `${OFFICIAL_ARTWORK}${item.id}.png` }
          }
        },
        types: [{ type: { name: 'normal' } }],
        stats: [],
        abilities: [],
        height: 0,
        weight: 0,
        detailsLoaded: false
      };
      globalPokemonCache.set(item.id, pObj);
      return pObj;
    });

    hideStatus();
    renderPokemonList(resultList);

    if (resultList.length === 1) {
      const g = getPokemonGeneration(resultList[0].id);
      resultCounter.textContent = `1 resultado: #${resultList[0].id.toString().padStart(3, '0')} ${resultList[0].name} · ${g.full}`;
    } else {
      const uniqueGens = [...new Set(resultList.map(p => getPokemonGeneration(p.id).roman))];
      if (uniqueGens.length === 1) {
        resultCounter.textContent = `${resultList.length} resultados · ${getPokemonGeneration(resultList[0].id).full}`;
      } else {
        resultCounter.textContent = `${resultList.length} resultados · ${uniqueGens.join(', ')}`;
      }
    }

    // Progressive details loader for results
    fetchProgressiveDetails(resultList);
  }

  // =====================================================
  // TYPE FILTER BUTTONS
  // =====================================================
  function buildTypeFilters() {
    const types = Object.keys(TYPE_COLORS).filter(t => t !== 'unknown');
    typeFiltersEl.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'type-filter-btn active';
    allBtn.textContent = 'Todos';
    allBtn.style.cssText = 'background:rgba(120,120,140,0.5);color:#fff;border-color:rgba(255,255,255,0.3);';
    allBtn.addEventListener('click', () => {
      activeTypeFilter = null;
      document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
      renderPokemonList(getDisplayList());
    });
    typeFiltersEl.appendChild(allBtn);

    types.forEach(type => {
      const btn = document.createElement('button');
      btn.className = `type-filter-btn type-badge type-${type}`;
      btn.textContent = type;
      btn.addEventListener('click', () => {
        if (activeTypeFilter === type) {
          activeTypeFilter = null; btn.classList.remove('active'); allBtn.classList.add('active');
        } else {
          activeTypeFilter = type;
          document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
        searchInput.value = '';
        renderPokemonList(getDisplayList());
      });
      typeFiltersEl.appendChild(btn);
    });
  }

  // =====================================================
  // GENERATION SELECT
  // =====================================================
  function buildGenSelect() {
    genSelect.innerHTML = '';
    GENERATIONS.forEach((gen, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = gen.label;
      genSelect.appendChild(opt);
    });
  }

  // =====================================================
  // LOAD POKEMON (FAST RESILIENT BATCHING)
  // =====================================================
  async function loadPokemon(genIndex) {
    currentGenIndex = genIndex; activeTypeFilter = null; searchInput.value = '';
    document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.type-filter-btn')?.classList.add('active');
    showLoader();

    const gen = GENERATIONS[genIndex];
    try {
      const res = await fetch(`${API_BASE}/pokemon?offset=${gen.offset}&limit=${gen.limit}`);
      if (!res.ok) throw new Error();
      const { results } = await res.json();

      // Immediately build base Pokemon objects with official artwork URLs
      const pokemonList = results.map((item, i) => {
        const m = (item.url || '').match(/\/(\d+)\/?$/);
        const id = m ? parseInt(m[1], 10) : (gen.offset + i + 1);
        return {
          id,
          name: item.name,
          url: item.url,
          sprites: {
            front_default: `${SPRITE_FALLBACK}${id}.png`,
            other: {
              'official-artwork': { front_default: `${OFFICIAL_ARTWORK}${id}.png` }
            }
          },
          types: [{ type: { name: 'normal' } }],
          stats: [],
          abilities: [],
          height: 0,
          weight: 0,
          detailsLoaded: false
        };
      });

      allPokemon = pokemonList;
      hideLoader();
      hideStatus();
      renderPokemonList(allPokemon);

      // Fetch details progressively in the background without blocking the UI
      fetchProgressiveDetails(allPokemon);

    } catch (err) {
      console.error(err);
      hideLoader();
      showStatus('Error al cargar la Pokédex. Intenta de nuevo.', true);
    }
  }

  async function fetchProgressiveDetails(list) {
    const batchSize = 6;
    for (let i = 0; i < list.length; i += batchSize) {
      const batch = list.slice(i, i + batchSize);
      await Promise.all(batch.map(async p => {
        if (p.detailsLoaded) return;
        try {
          const r = await fetch(`${API_BASE}/pokemon/${p.id}`);
          if (r.ok) {
            const data = await r.json();
            p.types = data.types || p.types;
            p.stats = data.stats || p.stats;
            p.abilities = data.abilities || p.abilities;
            p.height = data.height || p.height;
            p.weight = data.weight || p.weight;
            p.detailsLoaded = true;

            // Update card type badges in DOM if rendered
            const card = pokedexGrid.querySelector(`.pokemon-card[data-id="${p.id}"]`);
            if (card) {
              const types = p.types.map(t => t.type.name);
              const primary = types[0] || 'normal';
              const color = TYPE_COLORS[primary] || '#9fa19f';
              card.style.setProperty('--card-type-color', color);
              const typesEl = card.querySelector('.pokemon-types');
              if (typesEl) {
                typesEl.innerHTML = types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');
              }
            }
          }
        } catch (e) {
          // ignore error, official artwork image is already displaying
        }
      }));
    }
  }


  // =====================================================
  // SURPRISE ME
  // =====================================================
  async function surpriseMe() {
    try {
      const id  = Math.floor(Math.random() * 1025) + 1;
      const res = await fetch(`${API_BASE}/pokemon/${id}`);
      if (!res.ok) throw new Error();
      openModal(await res.json());
    } catch { showStatus('No se pudo cargar el Pokémon sorpresa 😅', true); }
  }

  // =====================================================
  // SHOW FAVORITES
  // =====================================================
  function showFavorites() {
    const favList = allPokemon.filter(p => favorites.includes(p.id));
    if (!favList.length) { showStatus('No tienes Pokémon favoritos aún ❤️'); return; }
    searchInput.value = ''; activeTypeFilter = null;
    document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.type-filter-btn')?.classList.add('active');
    renderPokemonList(favList);
  }

  // =====================================================
  // POKEMON DETAIL MODAL
  // =====================================================
  async function openModal(pokemon) {
    // If full details are not yet loaded, fetch them now
    if (!pokemon.detailsLoaded && (!pokemon.stats || pokemon.stats.length === 0)) {
      try {
        const r = await fetch(`${API_BASE}/pokemon/${pokemon.id}`);
        if (r.ok) {
          const data = await r.json();
          pokemon.types = data.types || pokemon.types;
          pokemon.stats = data.stats || pokemon.stats;
          pokemon.abilities = data.abilities || pokemon.abilities;
          pokemon.height = data.height || pokemon.height;
          pokemon.weight = data.weight || pokemon.weight;
          pokemon.sprites = data.sprites || pokemon.sprites;
          pokemon.detailsLoaded = true;
        }
      } catch (e) { /* continue with available info */ }
    }

    // Fetch evolution chain
    let evoItems = [];
    try {
      const specRes = await fetch(`${API_BASE}/pokemon-species/${pokemon.id}`);
      if (specRes.ok) {
        const specData = await specRes.json();
        const evoRes   = await fetch(specData.evolution_chain.url);
        if (evoRes.ok) {
          evoItems = flattenEvolutionChain((await evoRes.json()).chain);
        }
      }
    } catch { /* ignore */ }

    const types    = (pokemon.types && pokemon.types.length > 0) ? pokemon.types.map(t => t.type.name) : ['normal'];
    const primary  = types[0] || 'normal';
    const color    = TYPE_COLORS[primary] || '#9fa19f';
    const sprite   = getSpriteUrl(pokemon) || `${OFFICIAL_ARTWORK}${pokemon.id}.png`;
    const fallback = `${SPRITE_FALLBACK}${pokemon.id}.png`;
    const id       = pokemon.id.toString().padStart(3, '0');
    const genInfo  = getPokemonGeneration(pokemon.id);
    const isFav    = favorites.includes(pokemon.id);
    const badges   = types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');

    const statsHTML = (pokemon.stats || []).map(s => {
      const key   = s.stat.name;
      const val   = s.base_stat;
      const pct   = Math.min((val / 180) * 100, 100);
      return `
        <div class="stat-row">
          <span class="stat-name">${STAT_LABELS[key] || key}</span>
          <span class="stat-value">${val}</span>
          <div class="stat-bar-bg">
            <div class="stat-bar-fill" data-pct="${pct}" style="background:${STAT_COLORS[key]||'#aaa'}"></div>
          </div>
        </div>`;
    }).join('');

    const abilHTML = (pokemon.abilities || []).map(a =>
      `<span class="ability-badge ${a.is_hidden ? 'hidden-ability' : ''}">${a.ability.name}${a.is_hidden ? ' ✦' : ''}</span>`
    ).join('');

    const heightM  = ((pokemon.height  || 0) / 10).toFixed(1);
    const weightKg = ((pokemon.weight  || 0) / 10).toFixed(1);
    const evoHTML  = evoItems.length > 1 ? buildEvoHTML(evoItems)
      : '<span style="color:rgba(255,255,255,0.35);font-size:0.82rem">Sin cadena de evolución</span>';

    modalCard.innerHTML = `
      <div class="modal-header">
        <div class="modal-type-bg" style="background:${color}"></div>
        <button class="modal-fav-btn ${isFav ? 'active' : ''}" id="modalFavBtn" data-id="${pokemon.id}">
          ${isFav ? '❤️' : '🤍'}
        </button>
        <button class="modal-close" id="modalClose" aria-label="Cerrar">✕</button>
        <span class="modal-id">#${id} · ${genInfo.full}</span>
        <img class="modal-sprite" src="${sprite}" alt="${pokemon.name}" onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${fallback}';}else{this.onerror=null;this.src='${POKEBALL_SVG_PLACEHOLDER}';}">
        <h2 class="modal-name">${pokemon.name}</h2>
        <div class="modal-types">${badges}</div>
      </div>
      <div class="modal-body">
        <div>
          <p class="modal-section-title">📐 Info</p>
          <div class="modal-info-row">
            <div class="modal-info-box"><div class="info-label">Altura</div><div class="info-value">${heightM} m</div></div>
            <div class="modal-info-box"><div class="info-label">Peso</div><div class="info-value">${weightKg} kg</div></div>
            <div class="modal-info-box"><div class="info-label">Nº</div><div class="info-value">#${id}</div></div>
            <div class="modal-info-box"><div class="info-label">Generación</div><div class="info-value" style="color:#fca5a5;font-weight:800;">${genInfo.roman} (${genInfo.region})</div></div>
          </div>
        </div>
        <div>
          <p class="modal-section-title">⚡ Estadísticas Base</p>
          <div class="stats-list">${statsHTML || '<span style="color:rgba(255,255,255,0.35)">Sin datos</span>'}</div>
        </div>
        <div>
          <p class="modal-section-title">🎯 Habilidades</p>
          <div class="abilities-list">${abilHTML || '<span style="color:rgba(255,255,255,0.35)">Sin datos</span>'}</div>
        </div>
        <div>
          <p class="modal-section-title">🔗 Cadena Evolutiva</p>
          <div class="evo-chain">${evoHTML}</div>
        </div>
      </div>
    `;

    modalOverlay.style.display = 'flex';
    modalOverlay.classList.remove('closing');
    modalCard.classList.remove('closing');
    document.body.style.overflow = 'hidden';

    // Animate stat bars
    requestAnimationFrame(() => requestAnimationFrame(() => {
      modalCard.querySelectorAll('.stat-bar-fill').forEach(b => b.style.width = b.dataset.pct + '%');
    }));

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalFavBtn').addEventListener('click', () => toggleFavorite(pokemon.id));

    // Evolution item clicks
    modalCard.querySelectorAll('.evo-item').forEach(item => {
      item.addEventListener('click', async () => {
        const name = item.dataset.name;
        if (name === pokemon.name) return;
        try {
          const r = await fetch(`${API_BASE}/pokemon/${name}`);
          if (r.ok) openModal(await r.json());
        } catch { /* ignore */ }
      });
    });
  }

  function closeModal() {
    modalOverlay.classList.add('closing');
    modalCard.classList.add('closing');
    setTimeout(() => { modalOverlay.style.display = 'none'; document.body.style.overflow = ''; }, 220);
  }

  // =====================================================
  // EVOLUTION CHAIN — FIX: extract ID from species URL
  // =====================================================
  function flattenEvolutionChain(chain) {
    const result = [];
    let node = chain;
    while (node) {
      // species URL = https://pokeapi.co/api/v2/pokemon-species/{id}/
      const m  = (node.species.url || '').match(/\/(\d+)\/?$/);
      const id = m ? parseInt(m[1]) : null;
      result.push({ name: node.species.name, id });
      node = node.evolves_to?.[0] || null;
    }
    return result;
  }

  function buildEvoHTML(items) {
    return items.map(({ name, id }, i) => {
      const src      = id ? `${OFFICIAL_ARTWORK}${id}.png` : POKEBALL_SVG_PLACEHOLDER;
      const fallback = id ? `${SPRITE_FALLBACK}${id}.png` : POKEBALL_SVG_PLACEHOLDER;
      const arrow    = i < items.length - 1 ? '<span class="evo-arrow">▶</span>' : '';
      return `
        <div class="evo-item" data-name="${name}">
          <img src="${src}" alt="${name}"
               onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${fallback}';}else{this.onerror=null;this.src='${POKEBALL_SVG_PLACEHOLDER}';}"
               width="60" height="60">
          <span>${name}</span>
        </div>${arrow}`;
    }).join('');
  }

  // =====================================================
  // DARK MODE
  // =====================================================
  function initDarkMode() {
    if (localStorage.getItem('pokeDarkMode') === 'true') {
      document.body.classList.add('dark-mode');
      darkModeBtn.textContent = '☀️';
    }
  }
  function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    darkModeBtn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('pokeDarkMode', isDark);
  }

  // =====================================================
  // BACKGROUND POKÉBALLS
  // =====================================================
  function spawnBackgroundBalls() {
    const c = document.querySelector('.bg-balls');
    if (!c) return;
    for (let i = 0; i < 10; i++) {
      const b = document.createElement('div');
      b.className = 'bg-ball';
      const s = 40 + Math.random() * 120;
      b.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;animation-duration:${14+Math.random()*18}s;animation-delay:${Math.random()*16}s;`;
      c.appendChild(b);
    }
  }

  // =====================================================
  // AUDIO SYNTHESIZER (Web Audio API - Procedural SFX)
  // =====================================================
  let audioCtx = null;
  function getAudioContext() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) {
      return null;
    }
  }

  function playTone(freq, type = 'sine', duration = 0.1, delay = 0, vol = 0.08) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {}
  }

  function sfxFlip() { playTone(460, 'sine', 0.08, 0, 0.06); }
  function sfxMatch() { playTone(587.33, 'triangle', 0.12, 0, 0.09); playTone(880, 'triangle', 0.22, 0.09, 0.09); }
  function sfxWrong() { playTone(220, 'sawtooth', 0.14, 0, 0.07); playTone(180, 'sawtooth', 0.18, 0.1, 0.07); }
  function sfxWin() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => playTone(f, 'triangle', 0.22, i * 0.11, 0.1));
  }
  function sfxAttack() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  // =====================================================
  // GAMES MODAL
  // =====================================================
  function openGamesModal() {
    renderGameSelection();
    gameOverlay.style.display = 'flex';
    gameOverlay.classList.remove('closing');
    gameModalEl.classList.remove('closing');
    document.body.style.overflow = 'hidden';
  }

  function closeGamesModal() {
    clearSilhouetteTimer();
    clearMemoryTimer();
    gameOverlay.classList.add('closing');
    gameModalEl.classList.add('closing');
    setTimeout(() => { gameOverlay.style.display = 'none'; document.body.style.overflow = ''; }, 220);
  }

  function renderGameSelection() {
    clearSilhouetteTimer();
    clearMemoryTimer();
    gameModalEl.innerHTML = `
      <div class="game-modal-header">
        <span class="game-modal-title">🎮 Zona de Minijuegos Pokémon</span>
        <button class="game-close-btn" id="gameCloseBtn" aria-label="Cerrar">✕</button>
      </div>
      <div class="game-selection">
        <p class="game-selection-title">Selecciona una experiencia interactiva</p>
        <div class="game-options-grid">
          <button class="game-option-btn" id="startSilhouette" style="--accent-color:#8b5cf6">
            <span class="game-option-badge">Popular</span>
            <span class="game-option-icon">🔮</span>
            <span class="game-option-label">¿Quién es ese Pokémon?</span>
            <span class="game-option-desc">Adivina la silueta antes de que el reloj llegue a cero.</span>
          </button>
          <button class="game-option-btn" id="startTypeCalc" style="--accent-color:#0ea5e9">
            <span class="game-option-badge">Nuevo</span>
            <span class="game-option-icon">⚡</span>
            <span class="game-option-label">Arena de Batalla & Tipos</span>
            <span class="game-option-desc">Simulador interactivo con animaciones de ataque y quiz de efectividad.</span>
          </button>
          <button class="game-option-btn" id="startMemory" style="--accent-color:#ec4899">
            <span class="game-option-badge">Nuevo</span>
            <span class="game-option-icon">🃏</span>
            <span class="game-option-label">PokéMemory 3D</span>
            <span class="game-option-desc">Encuentra todas las parejas de cartas en el menor tiempo.</span>
          </button>
        </div>
      </div>
    `;
    document.getElementById('gameCloseBtn').addEventListener('click', closeGamesModal);
    document.getElementById('startSilhouette').addEventListener('click', () => startSilhouetteGame());
    document.getElementById('startTypeCalc').addEventListener('click',   () => renderTypeCalculator());
    document.getElementById('startMemory').addEventListener('click',     () => startMemoryGame());
  }

  // =====================================================
  // 1. SILHOUETTE GAME
  // =====================================================
  async function startSilhouetteGame() {
    sil.score = 0; sil.lives = 3; sil.streak = 0; sil.revealed = false;
    await nextSilhouette();
  }

  async function nextSilhouette() {
    sil.revealed = false; sil.timeLeft = 30;

    let pokemon;
    if (allPokemon.length > 0) {
      pokemon = allPokemon[Math.floor(Math.random() * allPokemon.length)];
    } else {
      const id  = Math.floor(Math.random() * 151) + 1;
      const res = await fetch(`${API_BASE}/pokemon/${id}`);
      pokemon   = await res.json();
    }
    sil.pokemon = pokemon;

    // Preload silhouette artwork
    const spriteUrl = getSpriteUrl(pokemon) || `${OFFICIAL_ARTWORK}${pokemon.id}.png`;
    const silPreload = new Image();
    silPreload.src = spriteUrl;

    renderSilhouetteScreen();
    startSilhouetteTimer();
  }

  function renderSilhouetteScreen() {
    const p        = sil.pokemon;
    const sprite   = getSpriteUrl(p) || `${OFFICIAL_ARTWORK}${p.id}.png`;
    const fallback = `${SPRITE_FALLBACK}${p.id}.png`;

    gameModalEl.innerHTML = `
      <div class="game-modal-header">
        <span class="game-modal-title">🔮 ¿Quién es ese Pokémon?</span>
        <button class="game-back-btn" id="silBackBtn">← Juegos</button>
        <button class="game-close-btn" id="silCloseBtn">✕</button>
      </div>
      <div class="silhouette-game">
        <div class="game-score-row">
          <div class="game-score-box">
            <span class="game-score-label">Puntos</span>
            <span class="game-score-val" id="silScore">${sil.score}</span>
          </div>
          <div class="game-score-box">
            <span class="game-score-label">Racha</span>
            <span class="game-score-val" id="silStreak">${sil.streak}${sil.streak >= 3 ? ' 🔥' : ''}</span>
          </div>
          <div class="game-score-box">
            <span class="game-score-label">Récord</span>
            <span class="game-score-val">${sil.bestStreak} ⭐</span>
          </div>
        </div>

        <div class="timer-bar">
          <div class="timer-fill" id="timerFill" style="width:100%;background:#3fa129"></div>
        </div>
        <div class="timer-display" id="timerDisplay">⏱ ${sil.timeLeft}s</div>

        <div class="silhouette-container">
          <img id="silImg" class="silhouette-img hidden" src="${sprite}" alt="???"
            onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${fallback}';}else{this.onerror=null;this.src='${POKEBALL_SVG_PLACEHOLDER}';}">
        </div>

        <span class="silhouette-question" id="silQuestion">¿Quién es este Pokémon?</span>

        <div class="silhouette-lives" id="silLives">${'❤️'.repeat(sil.lives)}${'🖤'.repeat(3-sil.lives)}</div>

        <div class="silhouette-input-row">
          <input type="text" id="silInput" class="silhouette-input"
            placeholder="Escribe el nombre del Pokémon…" autocomplete="off" autocorrect="off" spellcheck="false">
          <button id="silSubmit" class="silhouette-submit">✓</button>
        </div>

        <div id="silFeedback" class="silhouette-feedback"></div>
        <button id="silNext" class="game-btn" style="display:none">Siguiente ▶</button>
      </div>
    `;

    document.getElementById('silBackBtn').addEventListener('click', () => { clearSilhouetteTimer(); renderGameSelection(); });
    document.getElementById('silCloseBtn').addEventListener('click', closeGamesModal);
    document.getElementById('silSubmit').addEventListener('click', checkSilhouetteGuess);
    document.getElementById('silInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') checkSilhouetteGuess();
    });
    document.getElementById('silNext')?.addEventListener('click', () => {
      if (sil.lives <= 0) { startSilhouetteGame(); } else { nextSilhouette(); }
    });
    document.getElementById('silInput').focus();
  }

  function startSilhouetteTimer() {
    clearSilhouetteTimer();
    sil.timer = setInterval(() => {
      sil.timeLeft--;
      updateTimerUI();
      if (sil.timeLeft <= 0) { clearSilhouetteTimer(); revealSilhouette(false); }
    }, 1000);
  }

  function clearSilhouetteTimer() {
    if (sil.timer) { clearInterval(sil.timer); sil.timer = null; }
  }

  function updateTimerUI() {
    const pct   = (sil.timeLeft / 30) * 100;
    const fill  = document.getElementById('timerFill');
    const disp  = document.getElementById('timerDisplay');
    if (fill) {
      fill.style.width      = pct + '%';
      fill.style.background = pct > 60 ? '#3fa129' : pct > 30 ? '#fac000' : '#e62829';
    }
    if (disp) disp.textContent = `⏱ ${sil.timeLeft}s`;
  }

  function checkSilhouetteGuess() {
    if (sil.revealed) return;
    const inp   = document.getElementById('silInput');
    if (!inp) return;
    const guess   = inp.value.trim().toLowerCase();
    const correct = sil.pokemon.name.toLowerCase();

    if (!guess) return;

    if (guess === correct) {
      sil.score++; sil.streak++;
      if (sil.streak > sil.bestStreak) {
        sil.bestStreak = sil.streak;
        localStorage.setItem('pokeBestStreak', sil.bestStreak);
      }
      clearSilhouetteTimer();
      sfxMatch();
      revealSilhouette(true);
    } else {
      sil.lives--;
      sfxWrong();
      inp.classList.add('shake');
      inp.value = '';
      setTimeout(() => inp.classList.remove('shake'), 450);

      const livesEl = document.getElementById('silLives');
      if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(sil.lives,0)) + '🖤'.repeat(3 - Math.max(sil.lives,0));

      if (sil.lives <= 0) { clearSilhouetteTimer(); revealSilhouette(false); }
    }
  }

  function revealSilhouette(correct) {
    sil.revealed = true;
    if (!correct) sil.streak = 0;

    const img  = document.getElementById('silImg');
    if (img) { img.classList.remove('hidden'); img.classList.add('revealed'); }

    const qEl = document.getElementById('silQuestion');
    if (qEl) {
      qEl.textContent = sil.pokemon.name;
      qEl.className   = 'silhouette-revealed-name';
    }

    const fb  = document.getElementById('silFeedback');
    if (fb) {
      fb.textContent = correct
        ? `¡Correcto! +1 punto 🎉`
        : `Era ${sil.pokemon.name} 😔`;
      fb.className = `silhouette-feedback ${correct ? 'correct' : 'wrong'}`;
    }

    const scoreEl  = document.getElementById('silScore');
    const streakEl = document.getElementById('silStreak');
    if (scoreEl) scoreEl.textContent  = sil.score;
    if (streakEl) streakEl.textContent = sil.streak + (sil.streak >= 3 ? ' 🔥' : '');

    const nextBtn = document.getElementById('silNext');
    if (nextBtn) {
      nextBtn.style.display = 'block';
      nextBtn.textContent   = sil.lives <= 0 ? '🔄 Reiniciar' : 'Siguiente ▶';
    }

    const inp = document.getElementById('silInput');
    const sub = document.getElementById('silSubmit');
    if (inp) inp.disabled = true;
    if (sub) sub.disabled = true;
  }

  // =====================================================
  // 2. BATTLE ARENA & TYPE CALCULATOR (V2 - UPGRADED)
  // =====================================================
  const PRESET_ATTACKERS = [
    { name:'Charizard', type:'fire',     move:'Llamarada',    id:6 },
    { name:'Pikachu',   type:'electric', move:'Rayo',         id:25 },
    { name:'Greninja',  type:'water',    move:'Hidrobomba',   id:658 },
    { name:'Mewtwo',    type:'psychic',  move:'Onda Mental',  id:150 },
    { name:'Lucario',   type:'fighting', move:'Esfera Aural', id:448 },
    { name:'Gengar',    type:'ghost',    move:'Bola Sombra',  id:94 },
    { name:'Sceptile',  type:'grass',    move:'Rayo Solar',   id:254 },
  ];

  const PRESET_DEFENDERS = [
    { name:'Venusaur',  types:['grass','poison'],  id:3 },
    { name:'Blastoise', types:['water'],           id:9 },
    { name:'Gyarados',  types:['water','flying'],  id:130 },
    { name:'Gengar',    types:['ghost','poison'],  id:94 },
    { name:'Dragonite', types:['dragon','flying'], id:149 },
    { name:'Steelix',   types:['steel','ground'],  id:208 },
    { name:'Tyranitar', types:['rock','dark'],     id:248 },
  ];

  let calcActiveTab = 'arena';
  let selAtkType = 'fire';
  let selDefTypes = ['grass', 'poison'];
  let currentAttacker = PRESET_ATTACKERS[0];
  let currentDefender = PRESET_DEFENDERS[0];
  let quizScore = 0;
  let quizStreak = 0;
  let quizCurrent = null;

  function renderTypeCalculator() {
    gameModalEl.innerHTML = `
      <div class="game-modal-header">
        <span class="game-modal-title">⚡ Arena de Batalla & Tipos</span>
        <button class="game-back-btn" id="calcBackBtn">← Juegos</button>
        <button class="game-close-btn" id="calcCloseBtn">✕</button>
      </div>
      <div class="type-calc-game">
        <div class="calc-tabs">
          <button class="calc-tab-btn ${calcActiveTab === 'arena' ? 'active' : ''}" id="tabArena">
            ⚔️ Arena de Combate
          </button>
          <button class="calc-tab-btn ${calcActiveTab === 'quiz' ? 'active' : ''}" id="tabQuiz">
            🎯 Desafío de Efectividades
          </button>
        </div>

        <div id="calcTabContent"></div>
      </div>
    `;

    document.getElementById('calcBackBtn').addEventListener('click', renderGameSelection);
    document.getElementById('calcCloseBtn').addEventListener('click', closeGamesModal);

    document.getElementById('tabArena').addEventListener('click', () => {
      calcActiveTab = 'arena';
      document.getElementById('tabArena').classList.add('active');
      document.getElementById('tabQuiz').classList.remove('active');
      renderArenaContent();
    });

    document.getElementById('tabQuiz').addEventListener('click', () => {
      calcActiveTab = 'quiz';
      document.getElementById('tabQuiz').classList.add('active');
      document.getElementById('tabArena').classList.remove('active');
      renderQuizContent();
    });

    if (calcActiveTab === 'arena') renderArenaContent();
    else renderQuizContent();
  }

  function getTypeMoveName(t) {
    const moves = {
      fire:'Llamarada', water:'Hidrobomba', grass:'Rayo Solar', electric:'Rayo',
      ice:'Rayo Hielo', fighting:'A Bocajarro', poison:'Bomba Lodo', ground:'Terremoto',
      flying:'Pájaro Osado', psychic:'Psíquico', bug:'Zumbido', rock:'Roca Afilada',
      ghost:'Bola Sombra', dragon:'Cometa Draco', dark:'Pulso Umbrío', steel:'Foco Resplandor',
      fairy:'Fuerza Lunar', normal:'Hiperrayo'
    };
    return moves[t] || 'Ataque Elemental';
  }

  function renderArenaContent() {
    const container = document.getElementById('calcTabContent');
    if (!container) return;

    const types = Object.keys(TYPE_COLORS).filter(t => t !== 'unknown');

    // Make sure attacker matches current selected type if not explicitly set
    if (!currentAttacker || currentAttacker.type !== selAtkType) {
      const defPoke = TYPE_DEFAULT_POKEMON[selAtkType] || { name: 'Charizard', id: 6 };
      currentAttacker = { name: defPoke.name, id: defPoke.id, type: selAtkType, move: getTypeMoveName(selAtkType) };
    }

    // Make sure defender matches current selected type if not explicitly set
    if (!currentDefender) {
      const defPoke = TYPE_DEFAULT_POKEMON[selDefTypes[0]] || { name: 'Venusaur', id: 3 };
      currentDefender = { name: defPoke.name, id: defPoke.id, types: [...selDefTypes] };
    }

    const atkBattlerSprite = `${OFFICIAL_ARTWORK}${currentAttacker.id}.png`;
    const defBattlerSprite = `${OFFICIAL_ARTWORK}${currentDefender.id}.png`;

    const atkChips = PRESET_ATTACKERS.map((a, i) => `
      <button class="preset-chip ${currentAttacker.name === a.name ? 'active' : ''}" data-atk-idx="${i}">
        <span>${getTypeIcon(a.type)}</span> ${a.name}
      </button>
    `).join('');

    const defChips = PRESET_DEFENDERS.map((d, i) => `
      <button class="preset-chip ${currentDefender.name === d.name ? 'active' : ''}" data-def-idx="${i}">
        <span>🛡️</span> ${d.name}
      </button>
    `).join('');

    const atkButtons = types.map(t => `
      <button class="calc-type-btn type-badge type-${t} ${selAtkType === t ? 'selected' : ''}" data-type="${t}" data-role="atk">${t}</button>
    `).join('');

    const defButtons = types.map(t => `
      <button class="calc-type-btn type-badge type-${t} ${selDefTypes.includes(t) ? 'selected' : ''}" data-type="${t}" data-role="def">${t}</button>
    `).join('');

    container.innerHTML = `
      <div class="battle-arena">
        <div class="attack-beam-overlay" id="attackBeam"></div>

        <div class="arena-fighters-row">
          <!-- Attacker -->
          <div class="fighter-card attacker">
            <span class="fighter-role-tag">Atacante</span>
            <div class="fighter-avatar" id="attackerAvatar">
              <img id="attackerImg" src="${atkBattlerSprite}" alt="${currentAttacker.name}"
                onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${SPRITE_FALLBACK}${currentAttacker.id}.png';}else{this.onerror=null;this.src='${POKEBALL_SVG_PLACEHOLDER}';}">
            </div>
            <div class="fighter-name" id="attackerName">${currentAttacker.name}</div>
            <div class="fighter-types" id="attackerTypes">
              <span class="type-badge type-${selAtkType}">${selAtkType}</span>
            </div>
            <div style="font-size:0.7rem;color:rgba(255,255,255,0.6);font-weight:700;">
              Movimiento: <span style="color:#fca5a5;">${currentAttacker.move || getTypeMoveName(selAtkType)}</span>
            </div>
          </div>

          <!-- VS / Action -->
          <div class="arena-vs-col">
            <div class="arena-vs-badge">VS</div>
            <button class="btn-launch-attack" id="btnLaunchAttack" title="¡Lanzar Ataque!">
              💥 ¡ATACAR!
            </button>
            <button class="preset-chip" id="btnSwapCombatants" style="font-size:0.72rem;padding:0.25rem 0.6rem;" title="Intercambiar Atacante y Defensor">
              ⇄ Invertir
            </button>
          </div>

          <!-- Defender -->
          <div class="fighter-card defender">
            <span class="fighter-role-tag">Defensor</span>
            <div class="fighter-avatar" id="defenderAvatar">
              <img id="defenderImg" src="${defBattlerSprite}" alt="${currentDefender.name}"
                onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${SPRITE_FALLBACK}${currentDefender.id}.png';}else{this.onerror=null;this.src='${POKEBALL_SVG_PLACEHOLDER}';}">
            </div>
            <div class="fighter-name" id="defenderName">${currentDefender.name}</div>
            <div class="fighter-types" id="defenderTypes">
              ${selDefTypes.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            </div>

            <!-- Defender HP Bar Simulator -->
            <div class="arena-hp-container">
              <div class="arena-hp-text">
                <span>Salud (HP)</span>
                <span id="arenaHpLabel">100%</span>
              </div>
              <div class="arena-hp-bar">
                <div class="arena-hp-fill" id="arenaHpFill" style="width:100%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Result Box -->
        <div id="arenaResultArea" class="arena-result-card"></div>
      </div>

      <!-- Quick Preset Pokémon -->
      <div class="preset-chips-row">
        <span class="preset-chips-label">🎯 Pokémon Atacantes Populares:</span>
        <div class="preset-chips">${atkChips}</div>
      </div>

      <div class="preset-chips-row">
        <span class="preset-chips-label">🛡️ Pokémon Defensores Populares:</span>
        <div class="preset-chips">${defChips}</div>
      </div>

      <!-- Type Selectors -->
      <div class="type-picker-section">
        <div class="type-picker-title">
          <span>⚔️ Tipo del Ataque (Selecciona 1)</span>
          <span class="type-picker-subtext">Actual: <b>${selAtkType}</b></span>
        </div>
        <div class="type-calc-grid" id="atkTypeGrid">${atkButtons}</div>
      </div>

      <div class="type-picker-section">
        <div class="type-picker-title">
          <span>🛡️ Tipos del Defensor (Selecciona 1 o 2)</span>
          <span class="type-picker-subtext">Seleccionados: <b>${selDefTypes.join(' + ') || 'Ninguno'}</b></span>
        </div>
        <div class="type-calc-grid" id="defTypeGrid">${defButtons}</div>
      </div>
    `;

    // Hook launch attack button
    document.getElementById('btnLaunchAttack')?.addEventListener('click', triggerBattleAttackAnimation);

    // Hook swap button
    document.getElementById('btnSwapCombatants')?.addEventListener('click', () => {
      const tempAtk = selAtkType;
      selAtkType = selDefTypes[0] || 'normal';
      selDefTypes = [tempAtk];
      const tempPoke = currentAttacker;
      currentAttacker = currentDefender ? { name: currentDefender.name, id: currentDefender.id, type: selAtkType, move: getTypeMoveName(selAtkType) } : null;
      currentDefender = tempPoke ? { name: tempPoke.name, id: tempPoke.id, types: [...selDefTypes] } : null;
      renderArenaContent();
      triggerBattleAttackAnimation();
    });

    // Hook preset chips
    container.querySelectorAll('.preset-chip[data-atk-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.atkIdx);
        currentAttacker = { ...PRESET_ATTACKERS[idx] };
        selAtkType = currentAttacker.type;
        renderArenaContent();
        triggerBattleAttackAnimation();
      });
    });

    container.querySelectorAll('.preset-chip[data-def-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.defIdx);
        currentDefender = { ...PRESET_DEFENDERS[idx] };
        selDefTypes = [...currentDefender.types];
        renderArenaContent();
        triggerBattleAttackAnimation();
      });
    });

    // Hook type buttons
    container.querySelectorAll('.calc-type-btn[data-role="atk"]').forEach(btn => {
      btn.addEventListener('click', () => {
        selAtkType = btn.dataset.type;
        const mapped = TYPE_DEFAULT_POKEMON[selAtkType] || { name: selAtkType, id: 6 };
        currentAttacker = { name: mapped.name, id: mapped.id, type: selAtkType, move: getTypeMoveName(selAtkType) };
        renderArenaContent();
        updateArenaResultUI();
      });
    });

    container.querySelectorAll('.calc-type-btn[data-role="def"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.type;
        if (selDefTypes.includes(t)) {
          if (selDefTypes.length > 1) {
            selDefTypes = selDefTypes.filter(x => x !== t);
          }
        } else {
          if (selDefTypes.length < 2) selDefTypes.push(t);
          else selDefTypes = [selDefTypes[1], t];
        }
        const mapped = TYPE_DEFAULT_POKEMON[selDefTypes[0]] || { name: selDefTypes[0], id: 3 };
        currentDefender = { name: mapped.name, id: mapped.id, types: [...selDefTypes] };
        renderArenaContent();
        updateArenaResultUI();
      });
    });

    updateArenaResultUI();
  }

  function triggerBattleAttackAnimation() {
    sfxAttack();
    const beam = document.getElementById('attackBeam');
    const atkAvatar = document.getElementById('attackerAvatar');
    const defAvatar = document.getElementById('defenderAvatar');

    if (atkAvatar) {
      atkAvatar.classList.remove('pulse-attack');
      void atkAvatar.offsetWidth;
      atkAvatar.classList.add('pulse-attack');
    }

    if (beam) {
      beam.classList.remove('fire-beam');
      void beam.offsetWidth;
      beam.classList.add('fire-beam');
    }

    setTimeout(() => {
      if (defAvatar) {
        defAvatar.classList.remove('hit-shake');
        void defAvatar.offsetWidth;
        defAvatar.classList.add('hit-shake');
      }
      updateArenaResultUI();
    }, 200);
  }

  function updateArenaResultUI() {
    const resEl = document.getElementById('arenaResultArea');
    if (!resEl || !selAtkType || selDefTypes.length === 0) return;

    const mult = getEffectiveness(selAtkType, selDefTypes);
    const { icon, label, color, comment } = multLabel(mult);

    // Update HP bar simulator
    const hpFill = document.getElementById('arenaHpFill');
    const hpLabel = document.getElementById('arenaHpLabel');
    if (hpFill && hpLabel) {
      let hpPct = 100;
      let hpColor = '#10b981';
      let hpText = '100%';
      if (mult === 0) {
        hpPct = 100; hpColor = '#38bdf8'; hpText = '100% (Inmune)';
      } else if (mult === 0.25) {
        hpPct = 88; hpColor = '#10b981'; hpText = '88% (Rozado)';
      } else if (mult === 0.5) {
        hpPct = 75; hpColor = '#84cc16'; hpText = '75% (Resistido)';
      } else if (mult === 1) {
        hpPct = 50; hpColor = '#eab308'; hpText = '50% (Daño Normal)';
      } else if (mult === 2) {
        hpPct = 20; hpColor = '#f97316'; hpText = '20% (¡Crítico!)';
      } else if (mult === 4) {
        hpPct = 0; hpColor = '#ef4444'; hpText = '0% (¡K.O. Demoledor!)';
      }
      hpFill.style.width = hpPct + '%';
      hpFill.style.background = hpColor;
      hpLabel.textContent = hpText;
      hpLabel.style.color = hpColor;
    }

    // Step-by-step formula text
    let formulaExplanation = '';
    if (selDefTypes.length === 1) {
      formulaExplanation = `Ataque <b style="color:#fff;">${selAtkType}</b> contra <b style="color:#fff;">${selDefTypes[0]}</b> = <b>×${mult}</b>`;
    } else {
      const m1 = getEffectiveness(selAtkType, [selDefTypes[0]]);
      const m2 = getEffectiveness(selAtkType, [selDefTypes[1]]);
      formulaExplanation = `(${selAtkType} vs ${selDefTypes[0]} = <b>×${m1}</b>) × (${selAtkType} vs ${selDefTypes[1]} = <b>×${m2}</b>) = <b>×${mult} total</b>`;
    }

    // Calculate all affinities for the defender
    const allTypes = Object.keys(TYPE_COLORS).filter(t => t !== 'unknown');
    const weaknesses = [];
    const resistances = [];
    const immunities = [];

    allTypes.forEach(t => {
      const ef = getEffectiveness(t, selDefTypes);
      if (ef >= 2) weaknesses.push({ type: t, ef });
      else if (ef === 0) immunities.push(t);
      else if (ef < 1) resistances.push({ type: t, ef });
    });

    const weakBadges = weaknesses.length > 0
      ? weaknesses.map(w => `<span class="type-badge type-${w.type}" style="font-size:0.68rem;padding:2px 6px;">${w.type} (${w.ef}×)</span>`).join(' ')
      : '<span style="color:rgba(255,255,255,0.4);font-size:0.75rem;">Ninguna debilidad</span>';

    const resistBadges = resistances.length > 0
      ? resistances.map(r => `<span class="type-badge type-${r.type}" style="font-size:0.68rem;padding:2px 6px;">${r.type} (${r.ef}×)</span>`).join(' ')
      : '<span style="color:rgba(255,255,255,0.4);font-size:0.75rem;">Ninguna resistencia</span>';

    const immuneBadges = immunities.length > 0
      ? immunities.map(t => `<span class="type-badge type-${t}" style="font-size:0.68rem;padding:2px 6px;">${t} (0×)</span>`).join(' ')
      : '<span style="color:rgba(255,255,255,0.4);font-size:0.75rem;">Ninguna inmunidad</span>';

    resEl.style.setProperty('--result-color', color);
    resEl.innerHTML = `
      <div class="result-multiplier-badge" style="color:${color}">
        <span>${icon}</span> <span>${label}</span>
      </div>
      <div class="result-status-text">${comment}</div>

      <div class="result-details-pills">
        <span class="result-pill">⚔️ Atacante: <b>${currentAttacker.name} (${selAtkType.toUpperCase()})</b></span>
        <span class="result-pill">🛡️ Defensor: <b>${currentDefender.name} (${selDefTypes.join('/').toUpperCase()})</b></span>
        <span class="result-pill">Efectividad: <b>×${mult}</b></span>
      </div>

      <!-- Formula breakdown -->
      <div class="arena-formula-card">
        <div>💡 <b>Desglose de cálculo:</b></div>
        <div class="arena-formula-math">${formulaExplanation}</div>
      </div>

      <!-- Matchup Profile of Defender -->
      <div class="arena-affinities-box">
        <div class="affinity-row">
          <span class="affinity-label" style="color:#f87171;">💥 Débil frente a:</span>
          <div>${weakBadges}</div>
        </div>
        <div class="affinity-row">
          <span class="affinity-label" style="color:#4ade80;">🛡️ Resiste frente a:</span>
          <div>${resistBadges}</div>
        </div>
        <div class="affinity-row">
          <span class="affinity-label" style="color:#94a3b8;">🚫 Inmune frente a:</span>
          <div>${immuneBadges}</div>
        </div>
      </div>
    `;
  }

  function getTypeIcon(t) {
    const icons = {
      fire:'🔥', water:'💧', grass:'🌿', electric:'⚡', ice:'❄️', fighting:'🥊',
      poison:'☠️', ground:'🏜️', flying:'🦅', psychic:'🔮', bug:'🐛', rock:'🪨',
      ghost:'👻', dragon:'🐉', dark:'🌙', steel:'⚙️', fairy:'✨', normal:'⭐'
    };
    return icons[t] || '⚡';
  }

  function multLabel(m) {
    if (m === 0)    return { icon:'🚫', label:'Inmune (0×)',                 color:'#94a3b8', comment:'¡No tiene ningún efecto! El defensor anula por completo este ataque.' };
    if (m === 0.25) return { icon:'⬇️', label:'Muy poco eficaz (¼×)',      color:'#ec4899', comment:'¡Apenas siente el impacto! Ambos tipos del defensor resisten el golpe (¼×).' };
    if (m === 0.5)  return { icon:'↙️', label:'Poco eficaz (½×)',          color:'#f59e0b', comment:'No es muy eficaz... El objetivo resiste la mitad del daño normal.' };
    if (m === 1)    return { icon:'➡️', label:'Daño normal (1×)',           color:'#38bdf8', comment:'Daño estándar equilibrado. Sin ventajas ni desventajas de tipo.' };
    if (m === 2)    return { icon:'⬆️', label:'¡Súper eficaz! (2×)',       color:'#10b981', comment:'¡Es súper eficaz! El defensor recibe el doble de daño de combate.' };
    if (m === 4)    return { icon:'💥', label:'¡Ultra demoledor! (4×)',     color:'#ef4444', comment:'¡Impacto demoledor! Ambos tipos del defensor son débiles, provocando 4× de daño.' };
    return { icon:'❓', label:`×${m}`, color:'#94a3b8', comment:`Efectividad de combate calculada.` };
  }

  function renderQuizContent() {
    const container = document.getElementById('calcTabContent');
    if (!container) return;

    if (!quizCurrent) nextQuizQuestion();

    const q = quizCurrent;
    const allPossible = [0, 0.25, 0.5, 1, 2, 4];
    const currentMult = q.correctMult;

    // Pick 3 random distinct WRONG options
    const wrongOptions = allPossible.filter(x => x !== currentMult).sort(() => 0.5 - Math.random()).slice(0, 3);
    let pool = [currentMult, ...wrongOptions];

    // True Fisher-Yates Shuffle to guarantee 100% random button positions
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    container.innerHTML = `
      <div class="type-quiz-container">
        <div class="quiz-header-bar">
          <div class="quiz-score-info">
            <span>🎯 Desafío de Tipos</span>
            <span class="quiz-score-tag">Puntos: <b id="quizScoreVal">${quizScore}</b></span>
            <span class="quiz-streak-tag">Racha: <b id="quizStreakVal">${quizStreak}</b> 🔥</span>
          </div>
          <button id="quizResetBtn" class="quiz-reset-btn" title="Reiniciar contador de puntos">
            🔄 Reiniciar Marcador
          </button>
        </div>

        <div class="quiz-card">
          <div style="font-size:3rem;line-height:1;">${getTypeIcon(q.atk)}</div>
          <div class="quiz-scenario">
            Un ataque de tipo <span class="type-badge type-${q.atk}">${q.atk}</span> golpea a un Pokémon de tipo
            ${q.def.map(t => `<span class="type-badge type-${t}">${t}</span>`).join(' + ')}.
            <br>¿Cuál es el multiplicador de efectividad?
          </div>

          <div class="quiz-options-grid" id="quizOpts">
            ${pool.map(mult => `
              <button class="quiz-opt-btn" data-mult="${mult}">
                ${mult === 0 ? '0× (Inmune)' : mult === 0.25 ? '¼× (Muy poco eficaz)' : mult === 0.5 ? '½× (Poco eficaz)' : mult === 1 ? '1× (Normal)' : mult === 2 ? '2× (Súper eficaz)' : '4× (Ultra eficaz)'}
              </button>
            `).join('')}
          </div>

          <div id="quizFeedback" style="display:none;font-weight:700;font-size:0.95rem;margin-top:0.4rem;line-height:1.4;"></div>
          <button id="quizNextBtn" class="game-btn" style="display:none;margin-top:0.6rem;">Siguiente pregunta ▶</button>
        </div>
      </div>
    `;

    // Hook reset score button
    document.getElementById('quizResetBtn')?.addEventListener('click', () => {
      quizScore = 0;
      quizStreak = 0;
      nextQuizQuestion();
      renderQuizContent();
      const fb = document.getElementById('quizFeedback');
      if (fb) {
        fb.style.display = 'block';
        fb.style.color = '#38bdf8';
        fb.textContent = '¡Marcador reiniciado a 0! Nueva pregunta generada.';
      }
    });

    container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = parseFloat(btn.dataset.mult);
        const correct = chosen === q.correctMult;

        container.querySelectorAll('.quiz-opt-btn').forEach(b => {
          b.disabled = true;
          if (parseFloat(b.dataset.mult) === q.correctMult) b.classList.add('correct');
          else if (b === btn && !correct) b.classList.add('wrong');
        });

        const fb = document.getElementById('quizFeedback');
        const nextBtn = document.getElementById('quizNextBtn');
        const scoreVal = document.getElementById('quizScoreVal');
        const streakVal = document.getElementById('quizStreakVal');

        // Detailed explanation
        let explanation = '';
        if (q.def.length === 1) {
          explanation = `${q.atk} contra ${q.def[0]} tiene efectividad ×${q.correctMult}.`;
        } else {
          const m1 = getEffectiveness(q.atk, [q.def[0]]);
          const m2 = getEffectiveness(q.atk, [q.def[1]]);
          explanation = `(${q.atk} vs ${q.def[0]} = ×${m1}) × (${q.atk} vs ${q.def[1]} = ×${m2}) = ×${q.correctMult}.`;
        }

        if (fb) {
          fb.style.display = 'block';
          if (correct) {
            quizScore++;
            quizStreak++;
            sfxMatch();
            fb.innerHTML = `<span style="color:#10b981;">¡Correcto! +1 punto 🎉</span><br><span style="font-size:0.82rem;color:rgba(255,255,255,0.7);">${explanation}</span>`;
          } else {
            quizStreak = 0;
            sfxWrong();
            fb.innerHTML = `<span style="color:#ef4444;">Incorrecto. La respuesta era ×${q.correctMult}.</span><br><span style="font-size:0.82rem;color:rgba(255,255,255,0.7);">${explanation}</span>`;
          }
          if (scoreVal) scoreVal.textContent = quizScore;
          if (streakVal) streakVal.textContent = quizStreak;
        }

        if (nextBtn) {
          nextBtn.style.display = 'inline-block';
          nextBtn.addEventListener('click', () => {
            nextQuizQuestion();
            renderQuizContent();
          });
        }
      });
    });
  }

  function nextQuizQuestion() {
    const types = Object.keys(TYPE_COLORS).filter(t => t !== 'unknown');
    const atk = types[Math.floor(Math.random() * types.length)];
    const def1 = types[Math.floor(Math.random() * types.length)];
    const hasDual = Math.random() > 0.45;
    let def2 = null;
    if (hasDual) {
      const remaining = types.filter(t => t !== def1);
      def2 = remaining[Math.floor(Math.random() * remaining.length)];
    }
    const def = def2 ? [def1, def2] : [def1];
    const correctMult = getEffectiveness(atk, def);
    quizCurrent = { atk, def, correctMult };
  }

  function getEffectiveness(atkType, defTypes) {
    let m = 1;
    for (const d of defTypes) {
      const chart = TYPE_CHART[d];
      if (!chart) continue;
      if (chart.immune.includes(atkType)) return 0;
      if (chart.weak.includes(atkType))   m *= 2;
      if (chart.resist.includes(atkType)) m *= 0.5;
    }
    return m;
  }

  // =====================================================
  // 3. POKÉMEMORY 3D (REPAIRED & BULLETPROOF)
  // =====================================================
  const MEMORY_POKEMON_PRESETS = [
    { id: 25,  name: 'Pikachu' },
    { id: 6,   name: 'Charizard' },
    { id: 9,   name: 'Blastoise' },
    { id: 3,   name: 'Venusaur' },
    { id: 94,  name: 'Gengar' },
    { id: 133, name: 'Eevee' }
  ];

  let memoryCards = [];
  let memoryFlipped = [];
  let memoryMoves = 0;
  let memoryMatches = 0;
  let memorySeconds = 0;
  let memoryTimer = null;
  let memoryLock = false;
  let memoryBest = parseInt(localStorage.getItem('pokeMemoryBest') || '0', 10);

  function startMemoryGame() {
    clearMemoryTimer();
    memoryMoves = 0;
    memoryMatches = 0;
    memorySeconds = 0;
    memoryLock = false;
    memoryFlipped = [];

    // Choose 6 pokemon: either from allPokemon loaded or fallback presets
    let chosen = [];
    if (typeof allPokemon !== 'undefined' && Array.isArray(allPokemon) && allPokemon.length >= 6) {
      const shuffled = [...allPokemon].sort(() => 0.5 - Math.random());
      chosen = shuffled.slice(0, 6).map(p => ({ id: p.id, name: p.name }));
    } else {
      chosen = [...MEMORY_POKEMON_PRESETS];
    }

    // Eagerly preload artwork so cards appear instantly when flipped
    chosen.forEach(poke => {
      const pre = new Image();
      pre.src = `${OFFICIAL_ARTWORK}${poke.id}.png`;
    });

    // Duplicate into 12 cards and shuffle
    const deck = [];
    chosen.forEach((poke, idx) => {
      deck.push({ uid: `${idx}-a`, id: poke.id, name: poke.name, pairId: idx });
      deck.push({ uid: `${idx}-b`, id: poke.id, name: poke.name, pairId: idx });
    });

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    memoryCards = deck;

    renderMemoryScreen();
    startMemoryTimer();
  }

  function startMemoryTimer() {
    clearMemoryTimer();
    memoryTimer = setInterval(() => {
      memorySeconds++;
      const timeEl = document.getElementById('memTime');
      if (timeEl) timeEl.textContent = `${memorySeconds}s`;
    }, 1000);
  }

  function clearMemoryTimer() {
    if (memoryTimer) { clearInterval(memoryTimer); memoryTimer = null; }
  }

  function renderMemoryScreen() {
    gameModalEl.innerHTML = `
      <div class="game-modal-header">
        <span class="game-modal-title">🃏 PokéMemory 3D</span>
        <button class="game-back-btn" id="memBackBtn">← Juegos</button>
        <button class="game-close-btn" id="memCloseBtn">✕</button>
      </div>
      <div class="memory-game">
        <div class="memory-stats-bar">
          <div class="memory-stat-box">
            <span class="memory-stat-label">Tiempo</span>
            <span class="memory-stat-val" id="memTime">${memorySeconds}s</span>
          </div>
          <div class="memory-stat-box">
            <span class="memory-stat-label">Movimientos</span>
            <span class="memory-stat-val" id="memMoves">${memoryMoves}</span>
          </div>
          <div class="memory-stat-box">
            <span class="memory-stat-label">Parejas</span>
            <span class="memory-stat-val" id="memPairs">${memoryMatches} / 6</span>
          </div>
          <div class="memory-stat-box">
            <span class="memory-stat-label">Récord</span>
            <span class="memory-stat-val">${memoryBest > 0 ? memoryBest + ' mov.' : '—'}</span>
          </div>
          <button id="memRestartBtn" class="memory-restart-btn" title="Reiniciar partida">
            🔄 Reiniciar Tablero
          </button>
        </div>

        <div class="memory-grid" id="memoryGrid">
          ${memoryCards.map((card, idx) => `
            <div class="memory-card" data-idx="${idx}" tabindex="0" role="button" aria-label="Carta Pokémon ${card.name}">
              <div class="memory-card-inner">
                <div class="memory-card-back">
                  <div class="memory-card-back-pokeball"></div>
                </div>
                <div class="memory-card-front">
                  <img src="${OFFICIAL_ARTWORK}${card.id}.png" alt="${card.name}"
                    onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${SPRITE_FALLBACK}${card.id}.png';}else{this.onerror=null;this.src='${POKEBALL_SVG_PLACEHOLDER}';}">
                  <div class="memory-card-front-name">${card.name}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div id="memoryVictoryArea" style="width:100%;"></div>
      </div>
    `;

    document.getElementById('memBackBtn')?.addEventListener('click', () => { clearMemoryTimer(); renderGameSelection(); });
    document.getElementById('memCloseBtn')?.addEventListener('click', closeGamesModal);
    document.getElementById('memRestartBtn')?.addEventListener('click', startMemoryGame);

    // Robust Event Delegation for memory cards
    const grid = document.getElementById('memoryGrid');
    grid?.addEventListener('click', e => {
      const cardEl = e.target.closest('.memory-card');
      if (cardEl) handleMemoryCardClick(cardEl);
    });

    grid?.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const cardEl = e.target.closest('.memory-card');
        if (cardEl) { e.preventDefault(); handleMemoryCardClick(cardEl); }
      }
    });
  }

  function handleMemoryCardClick(cardEl) {
    if (memoryLock) return;
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

    sfxFlip();
    cardEl.classList.add('flipped');
    const idx = parseInt(cardEl.dataset.idx, 10);
    memoryFlipped.push({ element: cardEl, data: memoryCards[idx] });

    if (memoryFlipped.length === 2) {
      memoryMoves++;
      const movesEl = document.getElementById('memMoves');
      if (movesEl) movesEl.textContent = memoryMoves;

      const [c1, c2] = memoryFlipped;
      if (c1.data.pairId === c2.data.pairId) {
        // MATCH!
        sfxMatch();
        c1.element.classList.add('matched');
        c2.element.classList.add('matched');
        memoryMatches++;
        const pairsEl = document.getElementById('memPairs');
        if (pairsEl) pairsEl.textContent = `${memoryMatches} / 6`;
        memoryFlipped = [];

        if (memoryMatches === 6) {
          triggerMemoryVictory();
        }
      } else {
        // NO MATCH
        memoryLock = true;
        sfxWrong();
        setTimeout(() => {
          c1.element.classList.remove('flipped');
          c2.element.classList.remove('flipped');
          memoryFlipped = [];
          memoryLock = false;
        }, 750);
      }
    }
  }

  function triggerMemoryVictory() {
    clearMemoryTimer();
    sfxWin();

    if (memoryBest === 0 || memoryMoves < memoryBest) {
      memoryBest = memoryMoves;
      localStorage.setItem('pokeMemoryBest', memoryBest);
    }

    const stars = memoryMoves <= 9 ? '⭐⭐⭐' : memoryMoves <= 14 ? '⭐⭐' : '⭐';

    const victoryArea = document.getElementById('memoryVictoryArea');
    if (!victoryArea) return;

    victoryArea.innerHTML = `
      <div class="memory-victory-card">
        <div class="memory-victory-title">🎉 ¡Victoria Pokémon!</div>
        <div class="memory-victory-stars">${stars}</div>
        <div class="memory-victory-stats">
          Completaste el tablero en <b>${memorySeconds} segundos</b> y <b>${memoryMoves} movimientos</b>.
          <br>Récord personal: <b>${memoryBest} movimientos</b>.
        </div>
        <button id="memReplayBtn" class="game-btn">🔄 Jugar Otra Ronda</button>
      </div>
    `;

    document.getElementById('memReplayBtn')?.addEventListener('click', startMemoryGame);
  }

  // =====================================================
  // INIT
  // =====================================================
  function init() {
    initDarkMode();
    buildGenSelect();
    buildTypeFilters();
    spawnBackgroundBalls();
    saveFavorites();
    loadPokemon(0);
    loadGlobalDirectory();

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); performSearch(); } });
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      const val = searchInput.value.trim();
      if (!val) {
        hideStatus();
        renderPokemonList(getDisplayList());
      } else {
        searchDebounceTimer = setTimeout(performSearch, 220);
      }
    });

    darkModeBtn.addEventListener('click', toggleDarkMode);
    surpriseBtn.addEventListener('click', surpriseMe);
    genSelect.addEventListener('change', () => loadPokemon(parseInt(genSelect.value)));
    showFavsBtn?.addEventListener('click', showFavorites);

    // Wire play buttons reliably
    gamesBtn?.addEventListener('click', openGamesModal);
    document.getElementById('gamesBtnFloat')?.addEventListener('click', openGamesModal);
    document.querySelectorAll('.btn-games, .btn-games-header').forEach(btn => {
      btn.addEventListener('click', openGamesModal);
    });

    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    gameOverlay?.addEventListener('click',  e => { if (e.target === gameOverlay)  closeGamesModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (modalOverlay.style.display !== 'none') closeModal();
        if (gameOverlay?.style.display  !== 'none') closeGamesModal();
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
