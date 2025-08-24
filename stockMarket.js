/** @param {NS} ns */
export async function main(ns) {
    // --- NEUE, VERBESSERTE EINSTELLUNGEN ---
    // Wieviel Prozent deines Geldes soll immer als sichere Reserve bleiben? (0.5 = 50%)
    const behalteProzent = 0.5; 
    // Wieviel Prozent VOM REST soll pro Zyklus maximal investiert werden? (0.25 = 25%)
    const investiereProzent = 0.25;

    // --- Handelsschwellen (kannst du so lassen) ---
    const kaufSchwelle = 0.6;
    const verkaufSchwelle = 0.55;
    const transaktionsgebuehr = 100000;

    ns.disableLog("ALL");

    while (true) {
        if (!ns.stock.has4SData()) {
            const apiKosten = 25000000000; // 25 Mrd. für die 4S API
            ns.print(`INFO: Warte auf Kauf der 4S Market Data. Benötigt: ${ns.formatNumber(apiKosten)}`);
            if (ns.getServerMoneyAvailable("home") > apiKosten) {
                if (ns.stock.purchase4SMarketData()) {
                    ns.print("ERFOLG: 4S Market Data gekauft!");
                }
            }
            await ns.sleep(60000); 
        } else {
            const alleSymbole = ns.stock.getSymbols();

            // --- Verkaufsphase (unverändert) ---
            for (const sym of alleSymbole) {
                const [anteile] = ns.stock.getPosition(sym);
                if (anteile > 0) {
                    let prognose = 0;
                    try { prognose = ns.stock.getForecast(sym); } catch (e) { continue; }
                    
                    if (prognose < verkaufSchwelle) {
                        const verkaufsPreis = ns.stock.sellStock(sym, anteile);
                        if (verkaufsPreis > 0) {
                            ns.print(`VERKAUF: ${ns.formatNumber(anteile)}x ${sym} für ${ns.formatNumber(anteile * verkaufsPreis)}`);
                        }
                    }
                }
            }

            // --- Kaufphase (mit neuer Logik) ---
            // NEU: Berechne die Reserve und das Budget dynamisch in jeder Runde
            const aktuellesGeld = ns.getServerMoneyAvailable("home");
            const geldReserve = aktuellesGeld * behalteProzent;
            const geldFuerInvestitionen = aktuellesGeld - geldReserve;
            let investitionsBudget = geldFuerInvestitionen * investiereProzent;

            for (const sym of alleSymbole) {
                let prognose = 0;
                try { prognose = ns.stock.getForecast(sym); } catch (e) { continue; }

                if (prognose >= kaufSchwelle) {
                    const aktienPreis = ns.stock.getAskPrice(sym);
                    // Berechne max. Anteile basierend auf dem Budget für DIESEN ZYKLUS
                    let maxKaufbareAnteile = Math.floor((investitionsBudget - transaktionsgebuehr) / aktienPreis);

                    if (maxKaufbareAnteile * aktienPreis > 1000000) { // Mindestinvestment von 1 Mio.
                        const tatsaechlicherKauf = ns.stock.buyStock(sym, maxKaufbareAnteile);
                        if (tatsaechlicherKauf > 0) {
                            ns.print(`KAUF: ${ns.formatNumber(tatsaechlicherKauf)}x ${sym} für ${ns.formatNumber(tatsaechlicherKauf * aktienPreis)}`);
                            // Reduziere das Budget für diesen Zyklus, um nicht zu viel auszugeben
                            investitionsBudget -= (tatsaechlicherKauf * aktienPreis) + transaktionsgebuehr;
                        }
                    }
                }
            }
            
            await ns.stock.nextUpdate();
        }
    }
}