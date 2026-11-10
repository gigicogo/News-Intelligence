# News Intelligence

### Dalle notizie alla conoscenza. Una ricerca alla volta.

**News Intelligence** è un progetto indipendente per raccogliere notizie da più fonti, cercare ciò che conta davvero e trasformare i risultati in una rassegna chiara, sintetica e pronta da leggere o condividere.

Nasce da una domanda semplice: **perché limitarsi a scorrere decine di feed RSS, quando si può partire da ciò che si vuole sapere?**

Invece di aprire una testata dopo l'altra, si definisce un argomento, si sceglie un periodo e si cercano le notizie pertinenti nell'insieme delle fonti selezionate. Da lì è possibile costruire una rassegna personale, con i titoli originali, i collegamenti agli articoli e brevi sintesi.

**[Apri News Intelligence](https://gigicogo.github.io/News-Intelligence/)** · [Esplora il codice](https://github.com/gigicogo/News-Intelligence)

---

## L'idea

Un lettore RSS tradizionale mette al centro le *fonti*: scegli i siti da seguire e leggi quello che pubblicano.

News Intelligence prova a mettere al centro le **domande**. Per esempio:

> Quali novità sono emerse su OpenAI negli ultimi sette giorni?  
> Che cosa hanno raccontato testate diverse su SpaceX?  
> Quali notizie vale la pena includere in una rassegna sull'intelligenza artificiale?

Le risposte non arrivano da una generica ricerca sul web: vengono cercate **tra gli articoli raccolti dai feed RSS che hai deciso di seguire**. La selezione delle fonti rimane quindi sotto il tuo controllo.

## Che cosa puoi fare

- **Riunire più fonti RSS e Atom**, italiane e internazionali, in un unico spazio.
- **Aggiungere e gestire i feed** dalla web app, oppure importarli in blocco con un file **OPML**, come quelli esportati da altri lettori RSS.
- **Cercare per parola chiave** fra titoli e contenuti disponibili, scegliendo *ultime 24 ore*, *ultimi 3 giorni* oppure *ultima settimana*.
- **Leggere un'anteprima dei risultati** senza abbandonare subito la ricerca, mantenendo sempre il collegamento all'articolo originale.
- **Selezionare le notizie più interessanti** e riunirle con un clic in una rassegna.
- **Copiare, scaricare in Markdown o stampare in PDF** la rassegna ottenuta.
- **Preparare abstract in italiano con l'IA**, per le fonti supportate, e sottoporli a controllo editoriale prima di utilizzarli come sintesi approvate.

L'accesso alle funzioni di gestione dei feed e di revisione editoriale è riservato all'amministratore; la ricerca e la consultazione delle notizie restano il cuore dell'esperienza di lettura.

## Dalla ricerca alla rassegna

Il percorso è volutamente breve:

**1. Scegli le fonti** → **2. Cerca un argomento** → **3. Seleziona gli articoli** → **4. Verifica gli abstract** → **5. Crea la rassegna**

Immagina di cercare `SpaceX` nell'ultima settimana: puoi trovare articoli pubblicati da testate differenti, confrontarne gli angoli di lettura e scegliere soltanto quelli che ti interessano. Il documento finale raccoglie **titoli cliccabili, fonte, data e un testo breve per ogni notizia**.

Non si tratta di sostituire il giornalismo delle testate originali, ma di facilitare la **selezione, l'orientamento e la consultazione**.

## L'IA al posto giusto

News Intelligence utilizza l'intelligenza artificiale per un compito concreto: **aiutare a sintetizzare**, non decidere automaticamente che cosa sia vero o importante.

Quando è disponibile un contenuto sufficiente e la fonte è supportata, un modello linguistico su **Cloudflare Workers AI** può proporre un abstract in italiano. La sintesi viene conservata per evitare elaborazioni ripetute, può essere corretta manualmente e richiede un'approvazione prima di essere trattata come testo editoriale verificato.

Se una fonte non è supportata, il contenuto originale non è accessibile o l'IA non è disponibile, l'app continua a utilizzare le informazioni presenti nel feed RSS.

**Un abstract convincente non è una prova:** nomi, numeri, attribuzioni e previsioni devono sempre essere verificati sull'articolo originale. Non tutti i siti consentono l'estrazione o il riutilizzo dei testi; News Intelligence non nasce per ripubblicare gli articoli integrali.

## Un archivio leggero, non una raccolta infinita

Il progetto è pensato per un utilizzo personale e discontinuo, senza far crescere il database all'infinito.

- I feed vengono controllati periodicamente (nella configurazione attuale, **ogni sei ore**).
- Le notizie vengono conservate temporaneamente (attualmente **10 giorni**).
- Dopo un periodo prolungato senza attività **amministrativa autenticata** (attualmente **14 giorni**), la raccolta può sospendersi e l'archivio delle notizie viene svuotato.
- L'elenco dei feed e le impostazioni rimangono disponibili per riprendere l'attività.

Questa scelta ha un compromesso: **News Intelligence non vuole essere un archivio storico completo**. Se un articolo non è più disponibile nel feed al momento della ripresa, potrebbe non essere recuperabile.

L'infrastruttura è stata progettata per sfruttare, dove possibile, i **piani gratuiti**, senza dipendere da API commerciali per gli abstract. Restano applicabili i limiti e le quote d'uso dei servizi impiegati.

## Dietro le quinte, in poche parole

L'interfaccia vive su **GitHub Pages**. Un **Cloudflare Worker** si occupa della raccolta dei feed e delle ricerche; **Cloudflare D1** conserva temporaneamente gli articoli; **Workers AI** supporta la generazione degli abstract. Le operazioni programmate aggiornano e ripuliscono l'archivio.

Sono tecnologie diverse, ma l'obiettivo è uno: **offrire un'esperienza semplice a chi legge**, senza obbligarlo a usare gli strumenti tecnici.

## Un progetto in evoluzione

News Intelligence nasce come sperimentazione pratica ed è arrivato a una **versione candidata 1.0**, dopo prove su raccolta multi-fonte, ricerca, importazione OPML, rassegne e revisione degli abstract.

Alcuni aspetti restano da perfezionare: l'estrazione da un numero maggiore di testate, la qualità e la verifica delle sintesi, l'esperienza d'uso e filtri tematici o geografici più evoluti. **Non tutte le funzioni immaginate per il progetto sono già disponibili.**

Il codice è pubblicato per raccontare il percorso, consentire di esplorare la soluzione e favorire miglioramenti. Per segnalazioni e suggerimenti si possono utilizzare le [Issues del repository](https://github.com/gigicogo/News-Intelligence/issues).

---

**News Intelligence** — *Meno tempo a inseguire le notizie. Più tempo a capire quelle che contano.*
