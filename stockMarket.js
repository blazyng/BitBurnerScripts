/** @param {NS} ns */
export async function main(ns) {
    // --- DEINE ZIEL-EINSTELLUNG ---
    // Bei welchem Gesamtwert (Bargeld + Aktienwert) soll das Skript stoppen?
    const zielwert = 20000000000; // Beispiel: 20 Milliarden

    // --- Handels-Einstellungen (wie im vorigen Skript) ---
    const geldReserve = 1000000;      // Feste Reserve für den Handel
    const investitionsLimit = 0.25;   // Wieviel vom verfügbaren Geld pro Zyklus investieren?
    const kaufSchwelle = 0.6;
    const verkaufSchwelle = 0.55;
    const transaktionsgebuehr = 100000;

    ns.disableLog("ALL");

    while (true) {
        // --- 1. GESAMTWERT BERECHNEN ---
        const alleSymbole = ns.stock.getSymbols();
        let aktuellesGeld = ns.getServerMoneyAvailable("home");
        let aktienwert = 0;
        for (const sym of alleSymbole) {
            const [anteile] = ns.stock.getPosition(sym);
            if (anteile > 0) {
                aktienwert += anteile * ns.stock.getBidPrice(sym);
            }
        }
        const gesamtwert = aktuellesGeld + aktienwert;

        // Info-Ausgabe für dich, damit du den Fortschritt siehst
        ns.print(`INFO: Gesamtwert: ${ns.formatNumber(gesamtwert)} / ${ns.formatNumber(zielwert)}`);

        // --- 2. ZIELWERT PRÜFEN ---
        if (gesamtwert >= zielwert) {
            ns.tprint(`SUCCESS: Zielwert von ${ns.formatNumber(zielwert)} erreicht!`);
            ns.tprint("Verkaufe alle Positionen und beende das Skript...");

            for (const sym of alleSymbole) {
                const [anteile] = ns.stock.getPosition(sym);
                if (anteile > 0) {
                    const verkaufsPreis = ns.stock.sellStock(sym, anteile);
                    ns.tprint(`-> Verkauft: ${ns.formatNumber(anteile)}x ${sym} für ${ns.formatNumber(anteile * verkaufsPreis)}`);
                }
            }
            ns.tprint("Alle Aktien verkauft. Skript wird beendet.");
            return; // Beendet das Skript vollständig
        }

        // --- 3. NORMALE HANDELSLOGIK (WENN ZIEL NICHT ERREICHT) ---
        // (Verkaufs- & Kaufphasen wie zuvor)

        // Verkaufsphase
        for (const sym of alleSymbole) {
            const [anteile] = ns.stock.getPosition(sym);
            if (anteile > 0) {
                let prognose = 0;
                try { prognose = ns.stock.getForecast(sym); } catch (e) { continue; }
                if (prognose < verkaufSchwelle) {
                    ns.stock.sellStock(sym, anteile);
                }
            }
        }

        // Kaufphase
        let verfuegbaresGeld = ns.getServerMoneyAvailable("home") - geldReserve;
        let investitionsBudget = verfuegbaresGeld * investitionsLimit;
        for (const sym of alleSymbole) {
            let prognose = 0;
            try { prognose = ns.stock.getForecast(sym); } catch (e) { continue; }
            if (prognose >= kaufSchwelle) {
                const aktienPreis = ns.stock.getAskPrice(sym);
                let maxKaufbareAnteile = Math.floor((investitionsBudget - transaktionsgebuehr) / aktienPreis);
                if (maxKaufbareAnteile * aktienPreis > 1000000) {
                    const kauf = ns.stock.buyStock(sym, maxKaufbareAnteile);
                    if (kauf > 0) {
                         investitionsBudget -= (kauf * aktienPreis) + transaktionsgebuehr;
                    }
                }
            }
        }
        
        await ns.stock.nextUpdate();
    }
}