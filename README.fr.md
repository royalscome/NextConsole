# NextConsole

> Console de debogage front-end de nouvelle generation. Une alternative moderne a vConsole, avec prise en charge des journaux IA en streaming, REPL et systeme de plugins, optimisee pour le H5 mobile et le Web moderne.

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Fonctionnalites

- **Panneau Console** - Intercepte `console.log/info/warn/error/debug` avec coloration, traces de pile, rendu en liste virtuelle pour 10 000+ logs, recherche/filtrage et export
- **Journaux IA en streaming** - Prise en charge native de SSE et du JSON en streaming avec mises a jour UI en temps reel via rendu tamponne
- **Panneau Reseau** - Intercepte `fetch`, `XMLHttpRequest`, `EventSource` (SSE) et `WebSocket` avec tableau triable, details requete/reponse, timings et **flux de messages en temps reel** pour SSE/WebSocket (comme l'onglet Messages des DevTools)
- **Panneau Stockage** - Voir/modifier/supprimer `localStorage`, `sessionStorage` et les cookies avec recherche et edition inline
- **Panneau Elements** - Explorateur d'arbre DOM repliable avec surbrillance au survol
- **Panneau Systeme** - UA, ecran, memoire de l'appareil, type de reseau et metriques de performance (FP, FCP, heap)
- **Panneau REPL** - Execute du JavaScript dans la portee globale avec historique des commandes (↑/↓), formatage du resultat et affichage des erreurs
- **Systeme de plugins** - Etendez NextConsole avec des onglets, styles et logiques personnalises via une API simple
- **Isolation Shadow DOM** - Pas de pollution CSS globale, pas de conflit DOM
- **Zero dependance** - TypeScript pur, sans verrouillage sur un framework
- **Mobile-first** - Optimise pour le tactile, bouton flottant draggable avec aimantation aux bords et panneaux responsives
- **Petit bundle** - Environ 22 KB gzippes (avec plugins integres)

## Comparaison

### Taille du bundle

| Outil | Minifie | Gzippe | Dependances |
| --- | --- | --- | --- |
| **NextConsole** | **97 KB** | **22 KB** | **0** |
| vConsole 3.15 | 277 KB | 76 KB | 4 |
| Eruda 3.4 | 485 KB | 147 KB | 0 (integrees) |
| Chii 1.15 | N/A (serveur) | N/A | 9 |

NextConsole est **3,5x plus petit** que vConsole et **6,7x plus petit** que Eruda (en gzip).

### Comparatif des fonctionnalites

| Fonctionnalite | NextConsole | vConsole | Eruda | Chii |
| --- | :---: | :---: | :---: | :---: |
| Journaux Console | ✅ | ✅ | ✅ | ✅ |
| Journal IA en streaming | ✅ | ❌ | ❌ | ❌ |
| Reseau (Fetch) | ✅ | ✅ | ✅ | ✅ |
| Reseau (XHR) | ✅ | ✅ | ✅ | ✅ |
| Reseau (SSE) | ✅ Temps reel | ❌ | ❌ | ✅ |
| Reseau (WebSocket) | ✅ Temps reel | ❌ | ❌ | ✅ |
| Stockage | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ |
| Elements DOM | ✅ | ✅ | ✅ | ✅ |
| Infos systeme | ✅ | ✅ | ✅ | ✅ |
| REPL / Execution JS | ✅ | ✅ | ✅ | ✅ |
| Profilage des performances | ✅ Plugin | ❌ | ❌ | ✅ |
| Visualiseur de source | ✅ Plugin | ❌ (tiers) | ✅ | ✅ |
| Systeme de plugins | ✅ | ✅ | ✅ | ❌ |
| Isolation Shadow DOM | ✅ | ❌ | ❌ | N/A |
| Zero dependance | ✅ | ❌ (4 deps) | ✅ (bundle) | ❌ (9 deps) |
| TypeScript natif | ✅ | ✅ | ✅ | ❌ |
| Theme sombre | ✅ | ✅ | ✅ | ✅ |
| Optimise mobile | ✅ | ✅ | ✅ | ❌ |
| Debogage distant | ❌ | ❌ | ❌ | ✅ |
| Derniere mise a jour | 2026 | 2023 | 2025 | 2025 |

### Architecture

| Aspect | NextConsole | vConsole | Eruda | Chii |
| --- | --- | --- | --- | --- |
| Rendu | Shadow DOM | `<div>` dans le body | `<div>` dans le body | Chrome DevTools |
| Isolation CSS | Complete (Shadow DOM) | Classes scopees | Classes scopees | iframe |
| Format de build | ES + UMD | UMD | UMD | Serveur + Client |
| Framework | Aucun | Aucun | Aucun | Serveur Node.js |
| Rendu des logs | Liste virtuelle (10K+) | Ajout DOM | Ajout DOM | DevTools natif |
| Streaming | Batch RAF | N/A | N/A | N/A |

## Demarrage rapide

### CDN / UMD

```html
<script src="https://unpkg.com/@royalscome/nextconsole/dist/nextconsole.umd.js"></script>
<script>
  var nc = new NextConsole();
</script>
```

### Module ES

```bash
npm install @royalscome/nextconsole
```

```js
import NextConsole from '@royalscome/nextconsole';

const nc = new NextConsole({
  defaultTab: 'console',
  panelHeight: 0.4,
});

// Afficher / masquer
nc.show();
nc.hide();
nc.toggle();
```

## Journaux IA en streaming

NextConsole prend en charge nativement les sorties IA/LLM en streaming :

```js
const nc = new NextConsole();

// Demarrer le streaming - les morceaux sont ajoutes en temps reel
nc.appendStream('chat-1', 'Bonjour ');
nc.appendStream('chat-1', 'depuis ');
nc.appendStream('chat-1', 'l IA !');

// Marquer le flux comme termine
nc.endStream('chat-1');
```

Cela evite les gels d'UI, meme avec des milliers de mises a jour rapides, grace a un rendu groupe via `requestAnimationFrame`.

## Systeme de plugins

Etendez NextConsole avec des panneaux et des logiques personnalises :

```js
const nc = new NextConsole();

nc.use({
  name: 'my-plugin',
  version: '1.0.0',
  tab: {
    label: 'Mon Onglet',
    render(container, api) {
      container.innerHTML = '<div>Hello from plugin!</div>';
    },
    destroy() { /* nettoyage */ },
  },
  init(api) {
    api.log('Plugin charge !');
    api.addStyle('.custom { color: red; }');
  },
  destroy() { /* nettoyage */ },
});
```

### API des plugins

| Propriete / Methode | Description |
| --- | --- |
| `api.consoleCore` | Acces au module central de la console |
| `api.networkCore` | Acces au module central reseau |
| `api.storageCore` | Acces au module central stockage |
| `api.addStyle(css)` | Injecte du CSS personnalise dans le Shadow DOM |
| `api.log(...args)` | Ecrit des messages via la console |
| `api.show()` | Affiche le panneau |
| `api.hide()` | Masque le panneau |

### Interface de plugin

```ts
interface NextConsolePlugin {
  name: string;           // Nom de plugin unique
  version?: string;       // Version du plugin
  tab?: {                 // Onglet personnalise optionnel
    label: string;
    render(container: HTMLElement, api: PluginAPI): void;
    destroy?(): void;
  };
  init?(api: PluginAPI): void;    // Appele a l'installation
  destroy?(): void;               // Appele au nettoyage
}
```

### Plugins integres

NextConsole embarque deux plugins officiels :

#### Plugin Source

Affiche tous les scripts et feuilles de style de la page (externes et inline) avec un visualiseur de code source complet :

```js
import NextConsole, { createSourcePlugin } from '@royalscome/nextconsole';

const nc = new NextConsole();
nc.use(createSourcePlugin());
```

#### Plugin Performance

Core Web Vitals, repartition des ressources, detection des longues taches et marques de performance personnalisees :

```js
import NextConsole, { createPerformancePlugin } from '@royalscome/nextconsole';

const nc = new NextConsole();
nc.use(createPerformancePlugin());
```

## Configuration

```ts
interface NextConsoleConfig {
  /** Cible de montage (par defaut : document.body) */
  target?: HTMLElement;
  /** Onglet actif par defaut */
  defaultTab?: 'console' | 'network' | 'storage' | 'element' | 'system' | 'repl';
  /** Ratio initial de hauteur du panneau 0-1 (par defaut : 0.4) */
  panelHeight?: number;
  /** Position initiale du bouton flottant */
  buttonPosition?: { x: number; y: number };
  /** Theme */
  theme?: 'dark';
  /** Options de console */
  console?: {
    maxLogs?: number;      // par defaut : 10000
    hookConsole?: boolean; // par defaut : true
  };
  /** Options reseau */
  network?: {
    maxRequests?: number;      // par defaut : 500
    hookFetch?: boolean;       // par defaut : true
    hookXHR?: boolean;         // par defaut : true
    hookSSE?: boolean;         // par defaut : true
    hookWebSocket?: boolean;   // par defaut : true
  };
  /** Options de stockage */
  storage?: {
    showLocalStorage?: boolean;    // par defaut : true
    showSessionStorage?: boolean;  // par defaut : true
    showCookies?: boolean;         // par defaut : true
  };
  /** Appele quand NextConsole est pret */
  onReady?: () => void;
}
```

## API

| Methode | Description |
| --- | --- |
| `nc.show()` | Affiche le panneau |
| `nc.hide()` | Masque le panneau |
| `nc.toggle()` | Bascule la visibilite du panneau |
| `nc.isVisible` | Verifie si le panneau est visible |
| `nc.appendStream(id, chunk)` | Ajoute un fragment a un log en streaming |
| `nc.endStream(id)` | Marque un flux comme termine |
| `nc.clearConsole()` | Efface tous les journaux console |
| `nc.clearNetwork()` | Efface toutes les entrees reseau |
| `nc.exportLogs()` | Exporte les logs sous forme de chaine JSON |
| `nc.getLogEntries()` | Retourne toutes les entrees de logs |
| `nc.getNetworkEntries()` | Retourne toutes les entrees reseau |
| `nc.use(plugin)` | Enregistre un plugin (chainable) |
| `nc.destroy()` | Detruit et nettoie entierement |

## Developpement

```bash
# Installer les dependances
npm install

# Demarrer le serveur de dev avec la demo
npx vite examples

# Demarrer le serveur de test SSE/WebSocket (port 3210)
node examples/server.js

# Build de production
npm run build

# Verification de types
npm run typecheck
```

Le serveur de test fournit :
- `GET /sse` - endpoint SSE avec 8 types d'evenements nommes (connected, user_login, order_created, etc.)
- `GET /sse/ai` - texte en streaming de style IA (caractere par caractere)
- `ws://localhost:3210/ws` - WebSocket avec messages push, echo, ping et gestionnaires get_users

## Structure du projet

```text
src/
├── core/              # Logique centrale d'interception
│   ├── console-core.ts    # Hook console et streaming
│   ├── network-core.ts    # Interception Fetch/XHR/SSE/WebSocket
│   ├── storage-core.ts    # Lecture/ecriture du stockage
│   ├── element-core.ts    # Arbre DOM et surbrillance
│   ├── system-core.ts     # Collecte des informations systeme
│   └── repl-core.ts       # Execution des commandes JS
├── ui/                # Composants UI
│   ├── main-panel.ts      # Coque du panneau, onglets et gestion des plugins
│   ├── float-button.ts    # Bouton flottant draggable
│   ├── console-panel.ts   # Onglet console (liste virtuelle)
│   ├── network-panel.ts   # Onglet reseau (tableau triable)
│   ├── storage-panel.ts   # Onglet stockage (CRUD)
│   ├── element-panel.ts   # Onglet elements (arbre DOM)
│   ├── system-panel.ts    # Onglet systeme
│   └── repl-panel.ts      # Onglet REPL (execution JS)
├── utils/             # Outils utilitaires
│   ├── dom.ts             # Utilitaires DOM
│   ├── json.ts            # Mise en couleur JSON et stringify
│   ├── time.ts            # Formatage du temps
│   └── event-emitter.ts   # Event emitter type
├── styles/
│   └── theme.ts           # Theme CSS (injecte dans le Shadow DOM)
├── types/             # Interfaces TypeScript
│   ├── index.ts
│   ├── console.ts
│   ├── network.ts
│   ├── storage.ts
│   ├── system.ts
│   └── plugin.ts          # Types du systeme de plugins
├── plugins/           # Plugins integres
│   ├── index.ts
│   ├── source-plugin.ts   # Visualiseur de code source
│   └── performance-plugin.ts  # Profilage des performances
└── index.ts           # Point d'entree de l'API publique
```

## Compatibilite navigateur

- Chrome (mobile et desktop)
- Safari (iOS et macOS)
- Firefox
- Edge

## Licence

[MIT](LICENSE)
