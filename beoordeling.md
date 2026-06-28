# Beoordeling: ADWEB Huishoudboekje

> Reviewdatum: 2026-06-28  
> Reviewer: Claude (strenge examinator-modus)  
> Stack: React 19.2.4 · Next.js 16.2.4 · Firebase 12.13.0 · TypeScript

---

## 1. Samenvattende scoretabel

| Rubriek | Niveau | Punten | Max |
|---|---|---|---|
| KO 1 – Must-have stories werken | **Slaagt (met kanttekeningen)** | — | KO |
| KO 2 – Firebase als dataopslag | **Slaagt** | — | KO |
| KO 3 – Hosted in cloud | **Onzeker – geen hosting-config aantoonbaar** | — | KO |
| Werking & gebruiksvriendelijkheid | Goed | **15** | 20 |
| Volledig realtime Firestore | Bijna volledig | **15** | 20 |
| Separation of Concerns | Gedeeltelijk | **13** | 20 |
| Tests & coverage | Goed | **8** | 10 |
| Nice-to-have 1.4 (members + security rules) | Aanwezig | **10** | 10 |
| Nice-to-have 2.4 (grafieken) | Aanwezig | **10** | 10 |
| Nice-to-have 3.4 (drag-and-drop) | Aanwezig | **10** | 10 |
| **Totaal (excl. KO)** | | **~81** | **100** |

> **Let op**: als KO 3 (hosting) niet aantoonbaar gemaakt kan worden tijdens de verdediging, kan het cijfer op 0 worden gezet.

---

## 2. KO-criteria

### KO 1 – Werken alle must-have user stories?

**Globaal: ja, met twee concrete gaten.**

**KO 2 – Data via Firebase?**  
✅ Firebase 12.13.0 als enige dataopslag. Auth via `firebase/auth`, data via Firestore. Bevestigd in `config/firebase.js`.

**KO 3 – Hosting in cloud?**  
⚠️ **Niet aantoonbaar uit de code.**  
`firebase.json` bevat **alleen** Firestore-configuratie (rules + indexes), géén `hosting`-sectie. Er is geen `vercel.json`, geen CI/CD-pipeline, en geen `.env.local.example` (wél een `.env`-bestand, zie bevinding 9 hieronder). `.firebaserc` wijst naar project `adweb-femke-bas`, maar zonder hostingdeel is deploy niet aantoonbaar.  
→ Verdeelmoment: toon een live URL of laat `firebase deploy --only hosting` werken.

---

## 3. Statusregels per user story

### EPIC 1 – Huishoudboekjes

**1.1 Overzicht met naam en beschrijving**  
✅ **Volledig**  
`app/householdbooks/page.tsx:178-234` toont lijst met naam en omschrijving. Laad-skeleton (r. 149-156), lege staat (r. 158-176). Realtime via `onSnapshot` (r. 43).

**1.2 Toevoegen/aanpassen; naam verplicht; eigenaar automatisch; alleen eigenaar mag aanpassen**  
✅ **Volledig** – met een kleine opmerkelijkheid  
- Aanmaken: `app/householdbooks/new/page.tsx` r. 28-35; `ownerId: user!.uid` gezet bij aanmaken.  
- Naam verplicht: `required`-attribuut op input (r. 84); alleen HTML-validatie, geen whitespace-guard.  
- Alleen eigenaar bewerkt: UI-check `book.ownerId === user.uid` (householdbooks/page.tsx r. 199) + security rule (firestore.rules r. 13-15).  
- Edit redirects naar `/householdbooks` als je geen eigenaar bent (edit/page.tsx r. 38).

**1.3 Archiveren / dearchiveren / aparte lijst**  
⚠️ **Deels** – één criterium gemist  
- Archiveren: ✅ `archiveBook` (householdbooks/page.tsx r. 50-52), verdwijnt uit hoofdlijst (filter r. 36).  
- Aparte gearchiveerde lijst: ✅ `app/householdbooks/archived/page.tsx`.  
- Dearchiveren: ✅ `restoreBook` (archived/page.tsx r. 45-48).  
- **Ontbrekend criterium**: "is niet meer te bekijken." — de book-detailpagina (`/householdbooks/[id]`) en de transactiepagina controleren **niet** of het boekje gearchiveerd is. Iemand die de URL kent kan een gearchiveerd boekje gewoon bezoeken en transacties toevoegen. Er is geen guard of redirect.

---

### EPIC 2 – Uitgaven en inkomsten

**2.1 Overzicht gesorteerd op datum, per maand, met statistieken/balans**  
✅ **Volledig**  
- Gesorteerd op datum: `orderBy('date', 'desc')` in `transactionService.ts:65`.  
- Maandselector: `MonthSelector`-component, `transactions/page.tsx:293-307`.  
- Statistieken: `TransactionStatistics` toont inkomsten, uitgaven, balans, aantal (r. 300-306).

**2.2 Toevoegen/aanpassen; kosten verplicht; datum standaard vandaag**  
✅ **Volledig**  
- Aanmaken: `app/householdbooks/[id]/transactions/new/page.tsx`.  
- Bewerken: `[transactionId]/edit/page.tsx`.  
- Bedrag verplicht: JS-validatie in `TransactionForm.tsx:49-53` (geen HTML `required` op het getal-input, maar dat is geen showstopper).  
- Datum standaard vandaag: `TransactionForm.tsx:36`: `new Date().toISOString().split('T')[0]`.

**2.3 Verwijderen**  
✅ **Volledig**  
`deleteTransaction` in `transactionService.ts:43-48`; bevestigingsdialoog via `ConfirmDialog` vóór verwijdering.

---

### EPIC 3 – Categorieën

**3.1 Overzicht met resterend budget; visueel signaal bij bijna op / overschreden**  
✅ **Volledig**  
- `CategoryCard` toont `BudgetSummaryBadge` (bedragen) + `BudgetProgressBar` (kleurenbalk).  
- Kleuren: indigo → amber bij ≥80% → rood bij >100% (`BudgetProgressBar.tsx:16-20`).  
- Tekst: "Almost at budget limit" / "Over budget" (`CategoryCard.tsx:92-97`).  
- Logica in `useCategoryBudget.ts:30-32`: `isWarning: ratio >= 0.8 && ratio <= 1.0`, `isExceeded: ratio > 1.0`.

**3.2 Toevoegen/aanpassen/verwijderen; naam + max budget; optioneel einddatum**  
✅ **Volledig**  
- CRUD: `categories/new/`, `categories/[id]/edit/`, delete via `deleteCategory` service.  
- Verwijderen doet ook `categoryId: null` op gekoppelde transacties via `writeBatch` (`categoryService.ts:49-61`).  
- Naam + maxBudget verplicht, einddatum optioneel in `CategoryForm.tsx`.

**3.3 Koppelen aan maximaal één categorie**  
✅ **Volledig**  
- Dropdown in `TransactionForm` (r. 137-149) + drag-and-drop (zie 3.4).  
- `categoryId: string | null` in type garandeert max één categorie.

---

### Nice-to-have features

**1.4 Gedeelde boekjes + security rules**  
✅ **Aanwezig en werkend**  
- Uitnodiging per e-mail in `householdbooks/page.tsx:79-101` (modal) en `edit/page.tsx:71-98`.  
- `firestore.rules` bevat `isBookMember`-functie (r. 27-30) en past deze toe op categories en transactions.  
- UI-guard: alleen eigenaar ziet Edit/Invite/Archive-knoppen (page.tsx r. 199).

**2.4 Visuele balans (lijndiagram + staafdiagram)**  
✅ **Aanwezig en werkend**  
- Staafdiagram (uitgaven per categorie) en lijndiagram (cumulatief saldo per dag) in `CategoryCharts.tsx`.  
- Beide via `@mui/x-charts`. Lijndiagram vereist data (toont melding als leeg).

**3.4 Drag-and-drop**  
✅ **Aanwezig en werkend**  
- `@dnd-kit/core` in `transactions/page.tsx`.  
- Optimistische UI-update: wijziging zichtbaar vóórdat Firestore bevestigt (r. 206-213).  
- Rollback bij fout (r. 217-218), cleanup in `finally` (r. 219-220).  
- `DragOverlay` met ghost-element tijdens slepen (r. 416-426).

---

## 4. Technische rubrieken

### 4.1 Werking & gebruiksvriendelijkheid (15/20)

**Sterk:**
- Laad-skeletons op alle lijstpagina's.
- Lege staten met call-to-action.
- `ConfirmDialog` vóór destructieve acties.
- `ErrorBanner` bij laadfouten.
- Optimistische DnD-update geeft directe feedback.

**Tekortkomingen:**

| # | Bevinding | Ernst |
|---|---|---|
| 1 | Gearchiveerd boekje blijft toegankelijk via directe URL (zie 1.3) | Hoog |
| 2 | ESLint-**error** (geen waarschuwing) in productie: `react-hooks/set-state-in-effect` in `householdbooks/page.tsx:32`. Dit kan onverwacht gedrag veroorzaken in Strict Mode. | Middel |
| 3 | Invite/Archive/Edit-knoppen zijn `opacity-0` en alleen zichtbaar bij hover (`group-hover:opacity-100`, r. 200). Op touchscreens zijn ze onvindbaar. | Middel |
| 4 | `sign-up/page.tsx:140`: "Terms and Conditions" link gaat naar `href="#"` — broken link. | Laag |
| 5 | Geen bescherming tegen dubbele submit bij aanmaken boekje (`setSubmitting(false)` wordt niet aangeroepen bij succes — redirect voorkomt het, maar bij trage navigatie kan dubbele klik slagen). | Laag |

### 4.2 Volledig realtime op basis van Firestore (15/20)

**Correct:**
- `householdbooks/page.tsx` — `onSnapshot` ✅ (r. 43-46), cleanup via `return unsubscribe` ✅ (r. 47).
- `useCategories.ts` — `onSnapshot` via `subscribeToCategories` ✅, cleanup ✅.
- `useTransactions.ts` — `onSnapshot` via `subscribeToTransactions` ✅, cleanup ✅.
- `AuthContext.tsx` — `onAuthStateChanged` ✅, cleanup ✅.

**Ontbrekend:**
- `app/householdbooks/archived/page.tsx:37` — gebruikt **`getDocs`** (one-shot). Als een tweede gebruiker een boekje archiveert terwijl jij op de pagina staat, zie je dat **niet** live. Terugzetten filtert ook lokaal (r. 46: `setBooks(prev => prev.filter(...))`), wat inconsistent is met de onSnapshot-patronen elders.
- Editpagina's voor boekje, transactie en categorie gebruiken `getDoc` voor initiële data — acceptabel voor formulieren, maar vermeldenswaard.

### 4.3 Separation of Concerns (13/20)

**Uitstekend (gedeelten):**
- `categoryService.ts` en `transactionService.ts` accepteren `db: Firestore` als eerste argument — ze importeren `db` **nooit** zelf. Dit is textbook dependency injection en maakt testen triviaal.
- Hooks (`useCategories`, `useTransactions`) zijn brug tussen services en UI; componenten kennen geen Firestore-details.
- `useCategoryBudget` is puur functioneel (geen side effects).
- Alle monetaire logica in `utils/money.ts`.
- Types gecentraliseerd in `types/`.

**Tekortkomingen:**

| Locatie | Probleem |
|---|---|
| `app/householdbooks/page.tsx:6` | Importeert 10 Firestore-functies direct: `collection, query, where, getDocs, updateDoc, doc, or, and, getDoc, onSnapshot`. De hele invite-, archiveer- en boekjes-laadlogica zit inline in de page-component. |
| `app/householdbooks/new/page.tsx:6` | `addDoc, collection, serverTimestamp` direct in de page. |
| `app/householdbooks/[id]/edit/page.tsx:6` | `doc, getDoc, getDocs, updateDoc, collection, query, where` direct in de page. |
| **Structureel** | Er is **geen `householdbookService.ts`**, terwijl er wél een `categoryService.ts` en `transactionService.ts` zijn. Huishoudboekje-operaties (aanmaken, archiveren, uitnodigen, leden verwijderen) zijn niet geabstraheerd. |
| Duplicatie | Invite + member-beheer staat bijna identiek in `householdbooks/page.tsx:54-114` én `[id]/edit/page.tsx:71-99`. |

**Uitlegaanzet voor de verdediging:** "We hebben de servicelaag consequent toegepast voor categorieën en transacties, maar voor huishoudboekjes is dat niet afgemaakt. In een volgende iteratie zou `householdbookService.ts` deze logica overnemen, wat de pagina's cleaner maakt en de boekjeslogica ook testbaar maakt zonder de browser."

### 4.4 Tests & coverage (8/10)

**Resultaten (gemeten):**
```
Test Suites: 6 passed, 6 total
Tests:       28 passed, 28 total
Coverage:    Statements 92.39% | Branch 92.3% | Functions 81.25% | Lines 93.25%
```

**Aanwezig:**
- `categoryService.test.ts`: create, update, delete (batch), subscribe — 4 tests, alles volledig.
- `transactionService.test.ts`: create, assignCategory (met én zonder categorie), subscribe — 4 tests.
- `useCategories.test.ts`: loading-state, data-callback, unsubscribe bij unmount, null-bookId — 4 tests.
- `useCategoryBudget.test.ts`: sommen, remaining, isWarning, isExceeded, meerdere categorieën — 6 tests.
- `BudgetProgressBar.test.tsx`: kleuren, breedte-capping — 5 tests.
- `CategoryForm.test.tsx`: happy flow, validatiefout naam, validatiefout budget, cancel, pre-fill — 5 tests.

**Ontbrekend:**
- Geen test voor `useTransactions` hook (equivalent van `useCategories`, maar niet getest; `transactionService.ts:40,47` ongedekt).
- Geen test voor `updateTransaction` en `deleteTransaction` (regels 40 en 47 zijn de enige uncovered lines in transactionService).
- Geen test voor `TransactionForm`-component.
- Geen test voor `MonthSelector`.

---

## 5. Top-prioriteiten (gerangschikt op rendement)

### P1 — Hosting aantoonbaar maken (KO-risico)
**Impact: KO** · Effort: laag  
Voeg een `hosting`-sectie toe aan `firebase.json` of toon een live URL tijdens de verdediging. Zonder dit kan het gehele cijfer op 0 gezet worden.

```json
// firebase.json — voeg toe:
"hosting": {
  "public": ".next",
  "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
}
```

### P2 — Guard voor gearchiveerde boekjes (story 1.3 volledig maken)
**Impact: KO-grens** · Effort: laag  
In `app/householdbooks/[id]/page.tsx` en `transactions/page.tsx`: haal het boekje op bij mount, controleer `archived === true`, redirect naar `/householdbooks` als dat zo is.

### P3 — `householdbookService.ts` toevoegen (Separation of Concerns +3-5 pt)
**Impact: hoog** · Effort: middel  
Verplaats `createHouseholdbook`, `archiveHouseholdbook`, `restoreHouseholdbook`, `inviteMember`, `removeMember` naar een service, identiek aan het patroon van `categoryService.ts`. Verwijder de directe Firestore-imports uit de page-componenten.

### P4 — Archived-pagina realtime maken (+1-2 pt realtime-rubriek)
**Impact: middel** · Effort: laag  
Vervang `getDocs(q)` in `archived/page.tsx:37` door `onSnapshot`, net als in de hoofdoverzichtpagina.

### P5 — ESLint-error oplossen
**Impact: werking** · Effort: laag  
`householdbooks/page.tsx:32`: `setFetching(true)` aanroepen in een `useEffect` geeft een lint-error. Gebruik een initiële state van `true` of gebruik een `ref`.

### P6 — Unused imports opruimen in CategoryCharts
**Impact: lint** · Effort: triviaal  
`CategoryCharts.tsx:5-7`: `ChartsXAxis`, `ChartsYAxis`, `ChartsTooltip` zijn geïmporteerd maar niet gebruikt.

---

## 6. Risico's voor de verdediging

### Risico A — Onverklaarbaar gedrag van het DnD optimistic-update patroon
**Locatie**: `transactions/page.tsx:196-222`

Het patroon is correct maar subtiel:
1. `previousTransactions` wordt opgeslagen vanuit de Firestore-state (`transactions`).
2. `optimisticTransactions` wordt gezet vanuit `displayedTransactions` (die de optimistische state al kan bevatten).
3. `finally` zet optimistic altijd terug naar `null` — ook bij succes.

**Vraag die een examinator stelt**: "Als je de optimistische state altijd verwijdert in `finally`, zie je dan geen flicker terug naar de oude toestand?"  
**Antwoord**: Nee, omdat de `onSnapshot`-listener in `useTransactions` de bevestigde Firestore-state levert voordat de volgende render plaatsvindt (of vrijwel gelijktijdig). In de praktijk flikkert het niet omdat de Firestore-update en de snapshot-callback snel volgen.

---

### Risico B — `isWarning` bij exact 100%
**Locatie**: `useCategoryBudget.ts:30-32`

```ts
isWarning: usageRatio >= 0.8 && usageRatio <= 1.0,
isExceeded: usageRatio > 1.0,
```

Bij exact 100% is `isWarning = true` en `isExceeded = false`. De UI toont dan "Almost at budget limit" in amber, **niet** "Over budget" in rood. Dit is een edge-case die misschien niet de bedoeling is. Verdedigingsvraag: "Waarom is 100% een waarschuwing en geen overschrijding?"

---

### Risico C — Geen `householdbookService` terwijl dit de centrale architectuurkeuze is
**Locatie**: `app/householdbooks/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`

De architectuur is dat services de Firestore-details afschermen. Dat is consequent doorgevoerd voor categorieën en transacties, maar **niet** voor huishoudboekjes. Als een examinator dit vraagt: "Waarom importeer je hier `addDoc` direct in de component?"

**Antwoord-aanzet**: "Dit is een bekende inconsistentie in onze codebase. Voor epics 2 en 3 is de servicelaag volledig — we hebben dat als architectuurpatroon gehanteerd om de code testbaar te maken. Voor epic 1 is dat niet afgemaakt door tijdsdruk. In een refactor zou `householdbookService.ts` dezelfde aanpak volgen als `categoryService.ts`."

---

### Risico D — `.env`-bestand gecheckt in de repository
**Locatie**: `/Users/bas-school/adweb-femke-bas/.env` (bestand aanwezig in working tree)

Als dit bestand Firebase-sleutels bevat en is gecheckt in de git-history, is dat een beveiligingsrisico. Controleer `git log --all --oneline -- .env` om te zien of het ooit gecommit is. Als dat zo is: roteer de sleutels in de Firebase Console.

---

### Risico E — Duplicate invite-logica uitleggen
**Locatie**: `householdbooks/page.tsx:54-114` en `[id]/edit/page.tsx:71-99`

Bijna identieke code op twee plaatsen. Vraag: "Waarom heb je dit gedupliceerd in plaats van een component?"  
**Antwoord-aanzet**: "Dit is technische schuld. Het had een `MemberManagement`-component of een `useInvite`-hook kunnen zijn. De functionaliteit werkt correct op beide plekken, maar de herbruikbaarheid ontbreekt."

---

### Risico F — `useCategoryBudget` die geen React-hook is
**Locatie**: `hooks/useCategoryBudget.ts:36-41`

```ts
export function useCategoryBudget(
  categories: Category[],
  transactions: Transaction[],
): CategoryBudgetSummary[] {
  return computeCategoryBudgets(categories, transactions);
}
```

Dit is feitelijk een pure functie die als hook is verpakt. Hij heeft geen `useState`, `useEffect`, of andere hook-aanroepen. Vraag: "Waarom is dit een hook en geen gewone functie?"  
**Antwoord-aanzet**: "We hebben het als hook blootgesteld zodat we de API consistent kunnen houden — als we later caching of memo willen toevoegen, hoeven de aanroepers niet te veranderen. `computeCategoryBudgets` is wél exporteerd als pure functie voor testbaarheid."

---

## 7. Snelle feiten voor de verdediging

| Vraag | Antwoord | Locatie |
|---|---|---|
| React-versie? | 19.2.4 (voldoet aan > 19.0.0) | `package.json:22` |
| Waarom cents en niet euros? | Integer-rekenkunde voorkomt floating-point-fouten | `utils/money.ts` |
| Hoe werkt realtime? | `onSnapshot` retourneert unsubscribe-functie; hook retourneert die als cleanup van `useEffect` | `useCategories.ts:11-26` |
| Waarom `db` als parameter in services? | Dependency injection voor testbaarheid: tests kunnen een mock-db injecteren | `categoryService.ts:23` |
| Wat doet `deleteCategory` met transacties? | Batch-schrijf: alle gekoppelde transacties krijgen `categoryId: null`, dan wordt de categorie verwijderd | `categoryService.ts:49-61` |
| Hoe weet de app wie er lid is? | Firestore-query met `array-contains` op `members`-array; security rules controleren hetzelfde | `page.tsx:38-40`, `firestore.rules:11,29` |
