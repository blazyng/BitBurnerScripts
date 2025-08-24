/** @param {NS} ns */
export async function main(ns) {
    // --- EINSTELLUNGEN ---
    const investitionsLimit = 0.25; 
    const kaufSchwelle = 0.6;
    const verkaufSchwelle = 0.55;
    const geldReserve = 1000000; 
    const transaktionsgebuehr = 100000;

    ns.disableLog("ALL");

    while (true) {
        if (!ns.stock.has4SData()) {
            const apiKosten = ns.stock.get4SDataCost(); // Annahme, dass diese Funktion existiert
            ns.print(`INFO: Warte auf Kauf der 4S Market Data. Benötigt: ${ns.formatNumber(apiKosten)}`);
            if (ns.getServerMoneyAvailable("home") > apiKsten) {
                if (ns.stock.purchase4SMarketData()) {
                    ns.print("ERFOLG: 4S Market Data gekauft!");
                }
            }
            await ns.sleep(60000); 
        } else {
            const alleSymbole = ns.stock.getSymbols();

            // --- Verkaufsphase ---
            for (const sym of alleSymbole) {
                const [anteile] = ns.stock.getPosition(sym);
                if (anteile > 0) {
                    let prognose = 0;
                    try {
                        prognose = ns.stock.getForecast(sym);
                    } catch (e) {
                        ns.print(`WARNUNG: Prognose für ${sym} fehlgeschlagen. Überspringe...`);
                        continue;
                    }
                    
                    if (prognose < verkaufSchwelle) {
                        // KORREKTUR laut Doku: sellStock
                        const verkaufsPreis = ns.stock.sellStock(sym, anteile);
                        if (verkaufsPreis > 0) {
                            ns.print(`VERKAUF: ${ns.formatNumber(anteile)}x ${sym} für ${ns.formatNumber(anteile * verkaufsPreis)}`);
                        }
                    }
                }
            }

            // --- Kaufphase ---
            let verfuegbaresGeld = ns.getServerMoneyAvailable("home") - geldReserve;
            let investitionsBudget = verfuegbaresGeld * investitionsLimit;

            for (const sym of alleSymbole) {
                let prognose = 0;
                try {
                    prognose = ns.stock.getForecast(sym);
                } catch (e) {
                    ns.print(`WARNUNG: Prognose für ${sym} fehlgeschlagen. Überspringe...`);
                    continue;
                }

                if (prognose >= kaufSchwelle) {
                    const aktienPreis = ns.stock.getAskPrice(sym);
                    let maxKaufbareAnteile = Math.floor((investitionsBudget - transaktionsgebuehr) / aktienPreis);

                    if (maxKaufbareAnteile * aktienPreis > 1000000) {
                        // KORREKTUR laut Doku: buyStock
                        const tatsaechlicherKauf = ns.stock.buyStock(sym, maxKaufbareAnteile);
                        if (tatsaechlicherKauf > 0) {
                            ns.print(`KAUF: ${ns.formatNumber(tatsaechlicherKauf)}x ${sym} für ${ns.formatNumber(tatsaechlicherKauf * aktienPreis)}`);
                            investitionsBudget -= (tatsaechlicherKauf * aktienPreis) + transaktionsgebuehr;
                        }
                    }
                }
            }
            
            await ns.stock.nextUpdate();
        }
    }
}