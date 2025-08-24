/** @param {NS} ns */
export async function main(ns) {
    // --- YOUR TARGET SETTING ---
    // At what total portfolio value (cash + stock value) should the script stop?
    const targetValue = 20_000_000_000; // Example: 20 billion

    // --- Trading Settings ---
    const cashReserve = 1_000_000;      // Fixed reserve for trading
    const investmentRatio = 0.25;       // How much of available money to invest per cycle?
    const buyThreshold = 0.6;
    const sellThreshold = 0.55;
    const transactionFee = 100_000;

    ns.disableLog("ALL");

    while (true) {
        // --- 1. CALCULATE PORTFOLIO VALUE ---
        const allSymbols = ns.stock.getSymbols();
        let currentCash = ns.getServerMoneyAvailable("home");
        let stockValue = 0;
        for (const sym of allSymbols) {
            const [shares] = ns.stock.getPosition(sym);
            if (shares > 0) {
                stockValue += shares * ns.stock.getBidPrice(sym);
            }
        }
        const portfolioValue = currentCash + stockValue;

        // Print status to the log so you can track progress
        ns.print(`INFO: Portfolio Value: ${ns.formatNumber(portfolioValue)} / ${ns.formatNumber(targetValue)}`);

        // --- 2. CHECK TARGET VALUE ---
        if (portfolioValue >= targetValue) {
            ns.tprint(`SUCCESS: Target value of ${ns.formatNumber(targetValue)} reached!`);
            ns.tprint("Selling all positions and exiting the script...");

            for (const sym of allSymbols) {
                const [shares] = ns.stock.getPosition(sym);
                if (shares > 0) {
                    const salePrice = ns.stock.sellStock(sym, shares);
                    ns.tprint(`-> Sold: ${ns.formatNumber(shares)}x ${sym} for ${ns.formatNumber(shares * salePrice)}`);
                }
            }
            ns.tprint("All stocks sold. Script terminating.");
            return; // Terminates the script completely
        }

        // --- 3. NORMAL TRADING LOGIC (IF TARGET IS NOT MET) ---

        // Sell Phase
        for (const sym of allSymbols) {
            const [shares] = ns.stock.getPosition(sym);
            if (shares > 0) {
                let forecast = 0;
                try { forecast = ns.stock.getForecast(sym); } catch (e) { continue; }
                if (forecast < sellThreshold) {
                    ns.stock.sellStock(sym, shares);
                }
            }
        }

        // Buy Phase
        let availableCash = ns.getServerMoneyAvailable("home") - cashReserve;
        let investmentBudget = availableCash * investmentRatio;
        for (const sym of allSymbols) {
            let forecast = 0;
            try { forecast = ns.stock.getForecast(sym); } catch (e) { continue; }
            if (forecast >= buyThreshold) {
                const stockPrice = ns.stock.getAskPrice(sym);
                let maxShares = Math.floor((investmentBudget - transactionFee) / stockPrice);
                if (maxShares * stockPrice > 1_000_000) { // Minimum investment of 1m
                    const sharesBought = ns.stock.buyStock(sym, maxShares);
                    if (sharesBought > 0) {
                         investmentBudget -= (sharesBought * stockPrice) + transactionFee;
                    }
                }
            }
        }
        
        await ns.stock.nextUpdate();
    }
}