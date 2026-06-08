# AGO CLI Test Project

## Obiettivo
Progetto per testare e sviluppare funzionalità relative alla CLI di AGO (Advanced Git Operations).

## Descrizione
Questo progetto ha lo scopo di implementare e testare le funzionalità della command line interface per AGO, includendo:

- Gestione comandi CLI
- Parsing argomenti
- Esecuzione operazioni git avanzate
- Gestione errori e validazione input

## Struttura del Progetto
```
├── README.md          # Documentazione principale
├── package.json       # Configurazione npm/pnpm con script Docker
├── src/              # Codice sorgente
├── tests/            # Test unitari e integrazione
├── build/            # Build di produzione (dopo npm run build)
├── Dockerfile        # Dockerfile per produzione (multi-stage)
├── Dockerfile.dev    # Dockerfile per sviluppo con hot-reload
├── docker-compose.yml # Configurazione Docker Compose
├── .env.development  # Variabili d'ambiente per sviluppo
└── docs/             # Documentazione aggiuntiva
```

## Prerequisiti
- Docker installato
- Docker Compose installato (opzionale, per uso avanzato)
- Node.js e pnpm (per sviluppo locale)
- pnpm (consigliato): `npm install -g pnpm`

## Come iniziare

### 1. Clona il repository
```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Installazione dipendenze (sviluppo locale)
```bash
pnpm install
```

### 3. Esegui i test
```bash
pnpm test
```

### 4. Avvia la CLI
```bash
python -m ago
```

---

## 🐳 Docker - Istruzioni per il Deploy

### 🚀 Script pnpm per Docker (NUOVO!)

Il progetto ora include script pnpm dedicati per semplificare l'uso di Docker:

```bash
# Build dell'immagine di sviluppo
pnpm docker:build

# Build dell'immagine di produzione
pnpm docker:build:prod

# Avvia container di sviluppo con hot-reload (Docker diretto)
pnpm docker:dev

# Avvia container di sviluppo (Docker Compose)
pnpm docker:dev:compose

# Avvia container di sviluppo con rebuild (Docker Compose)
pnpm docker:dev:compose:build

# Avvia container di produzione
pnpm docker:prod

# Avvia produzione (Docker Compose)
pnpm docker:prod:compose

# Ferma tutti i container
pnpm docker:down

# Pulisci il sistema Docker
pnpm docker:clean

# Visualizza logs in tempo reale
pnpm docker:logs

# Riavvia il servizio di sviluppo
pnpm docker:restart
```

### Build dell'immagine Docker (Produzione)

**Opzione 1: Script pnpm (RACCOMANDATO)**
```bash
pnpm docker:build:prod
```

**Opzione 2: Docker diretto**
```bash
# Build dell'immagine di produzione
docker build -t ago-cli-app:latest .

# Build con tag specifico
docker build -t ago-cli-app:v1.0.0 .
```

**Opzione 3: Docker Compose**
```bash
# Build del servizio web
docker-compose build web

# Build di tutti i servizi
docker-compose build
```

### Esecuzione del container (Produzione)

**Opzione 1: Script pnpm (RACCOMANDATO)**
```bash
pnpm docker:prod
```

**Opzione 2: Docker diretto**
```bash
# Esegui il container in background sulla porta 3000
docker run -d -p 3000:80 --name ago-app ago-cli-app:latest

# Esegui con variabili d'ambiente
docker run -d \
  -p 3000:80 \
  -e NODE_ENV=production \
  --name ago-app \
  ago-cli-app:latest

# Esegui in modalità interattiva (per debug)
docker run -it -p 3000:80 ago-cli-app:latest /bin/sh
```

**Opzione 3: Docker Compose**
```bash
# Avvia il servizio web in background
docker-compose up -d web

# Avvia tutti i servizi
docker-compose up -d

# Visualizza i log
docker-compose logs -f web

# Ferma i servizi
docker-compose down
```

### Sviluppo con Docker (Hot-Reload)

**Opzione 1: Script pnpm (RACCOMANDATO - CON HOT-RELOAD)**
```bash
# Build e avvio con hot-reload
pnpm docker:dev

# Oppure usa docker-compose
pnpm docker:dev:compose

# Con rebuild
pnpm docker:dev:compose:build
```

**Opzione 2: Docker diretto (Dockerfile.dev)**
```bash
# Build dell'immagine di sviluppo
docker build -f Dockerfile.dev -t ago-cli-app:dev .

# Esegui il container di sviluppo con hot-reload
docker run -d \
  -p 3001:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e NODE_ENV=development \
  -e CHOKIDAR_USEPOLLING=true \
  --name ago-app-dev \
  ago-cli-app:dev
```

**Opzione 3: Docker Compose (servizio dev)**
```bash
# Avvia il servizio di sviluppo
docker-compose up -d dev

# Visualizza i log in tempo reale
docker-compose logs -f dev

# Accedi al container in esecuzione
docker-compose exec dev /bin/sh
```

### Configurazione Hot-Reload

Il container di sviluppo è configurato con:
- **Volume mounting**: Il codice locale è montato in tempo reale (`-v $(pwd):/app`)
- **Preservazione node_modules**: I moduli installati nel container sono preservati (`-v /app/node_modules`)
- **Variabili d'ambiente**: `CHOKIDAR_USEPOLLING=true` per rilevare cambiamenti su Docker
- **Porta**: `3001` per sviluppo, `3000` per produzione

### Comandi Docker utili

```bash
# Lista dei container in esecuzione
docker ps

# Lista di tutti i container (anche fermi)
docker ps -a

# Visualizza i log di un container
docker logs -f ago-app

# Accedi al terminale di un container in esecuzione
docker exec -it ago-app /bin/sh

# Ferma un container
docker stop ago-app

# Rimuovi un container
docker rm ago-app

# Rimuovi un'immagine
docker rmi ago-cli-app:latest

# Pulisci i container fermi e le immagini non utilizzate
docker system prune -a

# Ricostruisci senza cache
docker build --no-cache -t ago-cli-app:latest .
docker-compose build --no-cache
```

### Health Check

Il servizio web include un health check configurato. Per verificare lo stato:

```bash
# Controlla lo stato del container
docker inspect --format='{{.State.Health.Status}}' <container-id>

# Oppure usa curl sull'endpoint di health
curl http://localhost:3000/health
```

### Docker Compose - Comandi Rapidi

```bash
# Avvia l'applicazione completa
docker-compose up -d

# Vedere lo stato dei servizi
docker-compose ps

# Fermare e rimuovere tutti i container
docker-compose down

# Ricostruire e riavviare i servizi
docker-compose up -d --build

# Visualizzare i log di tutti i servizi
docker-compose logs -f

# Scalare i servizi (es. più istanze web)
docker-compose up -d --scale web=3
```

---

## 📝 Variabili d'ambiente

Crea un file `.env.development` per lo sviluppo locale e Docker:

```bash
# Copia il template
cp .env.development .env.development.local

# Modifica con i tuoi valori
```

Variabili supportate:
- `NODE_ENV`: Ambiente di esecuzione (development/production)
- `REACT_APP_API_URL`: URL dell'API backend
- `CHOKIDAR_USEPOLLING`: Abilita polling per hot-reload su Docker
- `FAST_REFRESH`: Abilita fast refresh per React

---

## Stato del Progetto
🚧 In sviluppo

## Porte di default
- **Sviluppo locale**: `http://localhost:3000`
- **Sviluppo Docker**: `http://localhost:3001` (hot-reload attivo)
- **Produzione Docker**: `http://localhost:3000`

## Note
- Il Dockerfile di produzione usa un approccio multi-stage per minimizzare la dimensione dell'immagine
- Nginx viene utilizzato per servire i file statici in produzione
- Il servizio di sviluppo supporta hot-reload per lo sviluppo rapido
- Usa `pnpm` come package manager per migliori performance
- Gli script `docker:*` in package.json semplificano l'uso di Docker

---
*Team Lead: Coordinamento progetto AGO CLI*
*DevOps: Configurazione Docker e script pnpm*
