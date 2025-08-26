/**
 * Advanced Stock Market Script v2.2
 * - FIX: Corrected the function call to ns.singularity.getOwnedSourceFiles().
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");

    // --- SETTINGS ---
    const investmentRatio = 0.75;
    const cashReserve = 5_000_000;
    const buyThreshold = 0.60;
    const shortThreshold = 0.45;

    // --- AUTO-CONFIGURATION ---
    let shortingEnabled = false;
    // Check if Singularity functions are available first.
    if (ns.singularity !== undefined) {
        // CORRECTION: The function is part of ns.singularity
        const sourceFiles = ns.singularity.getOwnedSourceFiles();
        const player = ns.getPlayer();
        if (player.bitNodeN === 8) {
            shortingEnabled = true;
        } else {
            const sf8 = sourceFiles.find(sf => sf.n === 8);
            if (sf8 && sf8.lvl >= 2) {
                shortingEnabled = true;
            }
        }
    }
    if(shortingEnabled) ns.tprint("SUCCESS: Shorting capabilities detected and enabled.");


    while (true) {
        ns.clearLog();
        let portfolioValue = ns.getServerMoneyAvailable("home");
        
        // --- Phase 1 & 2: Analyze and Sell Positions ---
        for (const sym of ns.stock.getSymbols()) {
            const [shares, , sharesShort, ] = ns.stock.getPosition(sym);
            portfolioValue += shares * ns.stock.getBidPrice(sym) + sharesShort * ns.stock.getBidPrice(sym);
            const forecast = ns.stock.getForecast(sym);

            if (shares > 0 && forecast < 0.55) {
                ns.stock.sellStock(sym, shares);
            }
            if (shortingEnabled && sharesShort > 0 && forecast > 0.50) {
                ns.stock.sellShort(sym, sharesShort);
            }
        }

        // --- Phase 3: Find and execute new high-potential trades ---
        let potentialTrades = [];
        for (const sym of ns.stock.getSymbols()) {
            const forecast = ns.stock.getForecast(sym);
            const volatility = ns.stock.getVolatility(sym);
            const score = Math.abs(forecast - 0.5) * volatility;

            if (forecast > buyThreshold && ns.stock.getPosition(sym)[0] === 0) {
                potentialTrades.push({ sym, type: 'Long', score, price: ns.stock.getAskPrice(sym) });
            }
            if (shortingEnabled && forecast < shortThreshold && ns.stock.getPosition(sym)[2] === 0) {
                potentialTrades.push({ sym, type: 'Short', score, price: ns.stock.getBidPrice(sym) });
            }
        }

        potentialTrades.sort((a, b) => b.score - a.score);

        let investmentBudget = (ns.getServerMoneyAvailable("home") - cashReserve) * investmentRatio;
        for (const trade of potentialTrades) {
            if (investmentBudget <= 0) break;
            const sharesToTrade = Math.min(Math.floor(investmentBudget / trade.price), ns.stock.getMaxShares(trade.sym));
            
            if (sharesToTrade > 0) {
                if (trade.type === 'Long') {
                    ns.stock.buyStock(trade.sym, sharesToTrade);
                } else if (trade.type === 'Short') {
                    ns.stock.buyShort(trade.sym, sharesToTrade);
                }
                investmentBudget -= sharesToTrade * trade.price;
            }
        }

        // --- Phase 4: Print Dashboard ---
        printDashboard(ns, portfolioValue, shortingEnabled);
        await ns.sleep(6000);
    }
}

function printDashboard(ns, portfolioValue, shortingEnabled) {
    ns.printf("--- BitBurner Stock Manager v2.2 ---");
    ns.printf("Portfolio Value: %s | Shorting: %s", ns.formatNumber(portfolioValue), shortingEnabled ? "✅" : "❌");
    ns.printf("----------------------------------------------------------");
    ns.printf("%-6s | %-10s | %-12s | %-12s | %-8s", "Symbol", "Type", "Shares", "Profit", "Forecast");
    ns.printf("----------------------------------------------------------");

    for (const sym of ns.stock.getSymbols()) {
        const [shares, avgPx, sharesShort, avgPxShort] = ns.stock.getPosition(sym);
        const forecast = ns.stock.getForecast(sym);

        if (shares > 0) {
            const profit = (ns.stock.getBidPrice(sym) - avgPx) * shares;
            ns.printf("%-6s | %-10s | %-12s | %-12s | %-8.2f%%", sym, "Long", ns.formatNumber(shares, 2), ns.formatNumber(profit), forecast * 100);
        }
        if (sharesShort > 0) {
            const profit = (avgPxShort - ns.stock.getAskPrice(sym)) * sharesShort;
            ns.printf("%-6s | %-10s | %-12s | %-12s | %-8.2f%%", sym, "Short", ns.formatNumber(sharesShort, 2), ns.formatNumber(profit), forecast * 100);
        }
    }
}