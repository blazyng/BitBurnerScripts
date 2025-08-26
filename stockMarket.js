/**
 * Advanced Stock Market Script v3.2
 * - FIX: Corrected the portfolio value calculation in the dashboard to properly account for short positions.
 * @param {NS} ns 
 */
export async function main(ns) {
    ns.disableLog("ALL");

    // --- SETTINGS ---
    const cashReserve = 5_000_000;
    const investmentRatio = 0.80;
    const sellThreshold = 0.55;
    const rebalanceThreshold = 1.2;

    const shortingEnabled = checkShortingAbility(ns);
    if (shortingEnabled) ns.tprint("SUCCESS: Shorting capabilities detected and enabled.");

    while (true) {
        ns.clearLog();
        
        // The main logic remains the same
        sellLosingPositions(ns, shortingEnabled);
        executeNewTrades(ns, { cashReserve, investmentRatio, sellThreshold, rebalanceThreshold, shortingEnabled });
        
        // The dashboard function is now fixed
        printDashboard(ns, shortingEnabled);
        await ns.sleep(6000);
    }
}


function sellLosingPositions(ns, shortingEnabled) {
    const stocks = ns.stock.getSymbols().map(sym => ({
        sym,
        forecast: ns.stock.getForecast(sym),
        position: ns.stock.getPosition(sym)
    }));

    for (const stock of stocks) {
        const [shares, , sharesShort, ] = stock.position;
        if (shares > 0 && stock.forecast < 0.55) {
            ns.stock.sellStock(stock.sym, shares);
        }
        if (shortingEnabled && sharesShort > 0 && stock.forecast > 0.50) {
            ns.stock.sellShort(stock.sym, sharesShort);
        }
    }
}

function executeNewTrades(ns, config) {
    const stocks = ns.stock.getSymbols().map(sym => {
        const forecast = ns.stock.getForecast(sym);
        return {
            sym,
            forecast,
            position: ns.stock.getPosition(sym),
            volatility: ns.stock.getVolatility(sym),
            price: ns.stock.getPrice(sym),
            score: Math.abs(forecast - 0.5) * ns.stock.getVolatility(sym)
        };
    });

    const myPositions = stocks.filter(s => s.position[0] > 0 || s.position[2] > 0);
    const opportunities = stocks.filter(s => s.position[0] === 0 && s.position[2] === 0);

    const worstHolding = myPositions.sort((a, b) => a.score - b.score)[0];
    const bestOpportunity = opportunities.sort((a, b) => b.score - a.score)[0];

    if (worstHolding && bestOpportunity && bestOpportunity.score > worstHolding.score * config.rebalanceThreshold) {
        if (worstHolding.position[0] > 0) ns.stock.sellStock(worstHolding.sym, worstHolding.position[0]);
        if (config.shortingEnabled && worstHolding.position[2] > 0) ns.stock.sellShort(worstHolding.sym, worstHolding.position[2]);
    }
    
    let investmentBudget = (ns.getServerMoneyAvailable("home") - config.cashReserve) * config.investmentRatio;
    const potentialTrades = opportunities.sort((a, b) => b.score - a.score);

    for (const trade of potentialTrades) {
        if (investmentBudget <= 0) break;
        const sharesToTrade = Math.min(Math.floor(investmentBudget / trade.price), ns.stock.getMaxShares(trade.sym));
        if (sharesToTrade <= 0) continue;

        if (trade.forecast > 0.60) {
            ns.stock.buyStock(trade.sym, sharesToTrade);
            investmentBudget -= sharesToTrade * trade.price;
        } else if (config.shortingEnabled && trade.forecast < 0.45) {
            ns.stock.buyShort(trade.sym, sharesToTrade);
            investmentBudget -= sharesToTrade * trade.price;
        }
    }
}

function checkShortingAbility(ns) { /* ... dein bekannter Code ... */ }

/**
 * Prints a clean, updating dashboard of stock positions with corrected portfolio value calculation.
 */
function printDashboard(ns, shortingEnabled) {
    const commission = 100_000;
    let cash = ns.getServerMoneyAvailable("home");
    let longValue = 0;
    let shortProfitLoss = 0;

    const positions = ns.stock.getSymbols().map(sym => {
        const [shares, avgPx, sharesShort, avgPxShort] = ns.stock.getPosition(sym);
        longValue += shares * ns.stock.getBidPrice(sym);
        if (sharesShort > 0) {
            shortProfitLoss += (avgPxShort - ns.stock.getAskPrice(sym)) * sharesShort;
        }
        return { sym, shares, avgPx, sharesShort, avgPxShort };
    });

    const portfolioValue = cash + longValue + shortProfitLoss;

    ns.printf("--- BitBurner Stock Manager v3.2 ---");
    ns.printf("Portfolio Value: %s | Shorting: %s", ns.formatNumber(portfolioValue), shortingEnabled ? "✅" : "❌");
    ns.printf("--------------------------------------------------------------------");
    ns.printf("%-6s | %-5s | %-10s | %-15s | %-10s | %-8s", "Symbol", "Type", "Shares", "Profit (Real)", "Value", "Forecast");
    ns.printf("--------------------------------------------------------------------");

    for (const pos of positions) {
        const forecast = ns.stock.getForecast(pos.sym);
        if (pos.shares > 0) {
            const value = ns.stock.getBidPrice(pos.sym) * pos.shares;
            const profit = value - (pos.avgPx * pos.shares) - (2 * commission);
            ns.printf("%-6s | %-5s | %-10s | %-15s | %-10s | %-8.2f%%", pos.sym, "Long", ns.formatNumber(pos.shares, 2), ns.formatNumber(profit), ns.formatNumber(value), forecast * 100);
        }
        if (pos.sharesShort > 0) {
            const value = ns.stock.getAskPrice(pos.sym) * pos.sharesShort;
            const profit = (pos.avgPxShort * pos.sharesShort) - value - (2 * commission);
            ns.printf("%-6s | %-5s | %-10s | %-15s | %-10s | %-8.2f%%", pos.sym, "Short", ns.formatNumber(pos.sharesShort, 2), ns.formatNumber(profit), ns.formatNumber(value), forecast * 100);
        }
    }
}