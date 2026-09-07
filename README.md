# Akkumulátor méretező

Webalkalmazás, amely negyedórás bontású elektromos fogyasztási és napelemes
termelési CSV adatok alapján szimulációval megkeresi, milyen méretű (kWh)
akkumulátoros tároló lenne optimális egy adott fogyasztási helyen: minimalizálja
a hálózatba visszatöltött energiát, jó kihasználtság mellett, és lehetőség
szerint a napi termelésből fedezi az éjszakai fogyasztást.

## Előfeltétel

- Node.js 20+ és npm

## Telepítés

```bash
npm install
```

Ez a gyökér `package.json` workspace-ei miatt a `server` és `client` mappák
függőségeit is telepíti.

## Futtatás fejlesztői módban

```bash
npm run dev
```

Ez elindítja:
- a backend API-t: http://localhost:3001
- a frontendet: http://localhost:5173 (nyisd meg ezt a böngészőben)

## Használat

1. Töltsd fel a fogyasztási CSV-t és a termelési CSV-t (ugyanarra a
   fogyasztási helyre).
2. Az előnézetben add meg, melyik oszlop az időbélyeg (vagy dátum+idő külön),
   melyik az érték, milyen formátumban, és van-e fejléc sor. A rendszer nem
   feltételez fix CSV formátumot – bármilyen elválasztó (`,`/`;`/tab), magyar
   vagy angol dátumformátum, kWh/kW/W érték kezelhető.
3. Állítsd be (opcionálisan) a szimulációs paramétereket: kör-hatásfok, max
   töltő/kisütő teljesítmény, minimális töltöttségi szint, vizsgált kapacitás
   tartomány.
4. Kattints a "Számítás indítása" gombra. Az eredmény tartalmazza a javasolt
   kapacitást, az indoklást, és a részletes grafikonokat (kapacitás-görbék,
   átlagos napi profil, hálózati csere).

## Build

```bash
npm run build
npm run typecheck
```
