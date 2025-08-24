/** @param {NS} ns */
export async function main(ns) {
  // --- USER SETTINGS ---
  // A list of symbols for early-game trading.
  const earlyGameSymbols = ["NMG", "JGN", "CTK", "VITA", "OMGA", "FNS"]; 
  // Percentage of total money to invest in one stock.
  const investRatio = 0.15;

  while (true) {
    // Phase 0: Check if we can even access the stock market.
    try {
        ns.stock.getSymbols();
    } catch (e) {
        ns.tprint("ERROR: Not enough privileges to access the stock market. Check your factions for 'TIX API Access'.");
        const tixApiCost = 15000000000; // Hardcoded cost to show the player what to aim for.
        const myMoney = ns.getServerMoneyAvailable("home");
        ns.tprint(`Money needed for TIX API Access: ${ns.nFormat(tixApiCost, '0.00a')}. Current money: ${ns.nFormat(myMoney, '0.00a')}`);
        await ns.sleep(60000); // Wait 1 minute before checking again.
        continue;
    }

    // Check if we have the 4S data API.
    const has4SData = ns.stock.has4SDataTixApi();

    // Phase 1: Simple Trading (before 4S Data API is purchased)
    if (!has4SData) {
      const apiCost = ns.stock.get4SDataTixApiCost();
      if (ns.getServerMoneyAvailable("home") >= apiCost) {
        ns.tprint("Money is sufficient! Buying 4S Market Data TIX API...");
        ns.stock.purchase4SMarketDataTixApi();
        continue;
      }

      for (const sym of earlyGameSymbols) {
        const [ownedShares, avgPrice] = ns.stock.getPosition(sym);
        const currentPrice = ns.stock.getBidPrice(sym);

        if (ownedShares === 0) {
          const moneyAvailable = ns.getServerMoneyAvailable("home");
          const sharesToBuy = Math.floor((moneyAvailable * 0.10) / ns.stock.getAskPrice(sym));
          if (sharesToBuy > 0) {
            ns.stock.buy(sym, sharesToBuy);
          }
        } 
        else if (currentPrice > avgPrice * 1.05) {
          ns.stock.sell(sym, ownedShares);
        }
      }
    } 
    // Phase 2: Advanced Trading (after 4S Data API is purchased)
    else {
      const allSymbols = ns.stock.getSymbols();
      const buyThreshold = 0.65;
      const sellThreshold = 0.55;

      for (const sym of allSymbols) {
        const forecast = ns.stock.getForecast(sym);
        const [ownedShares] = ns.stock.getPosition(sym);
        
        if (forecast >= buyThreshold && ownedShares === 0) {
          const moneyAvailable = ns.getServerMoneyAvailable("home");
          const sharesToBuy = Math.floor((moneyAvailable * investRatio) / ns.stock.getAskPrice(sym));
          if (sharesToBuy > 0) {
            ns.stock.buy(sym, sharesToBuy);
          }
        }
        
        if (forecast <= sellThreshold && ownedShares > 0) {
          ns.stock.sell(sym, ownedShares);
        }
      }
    }

    await ns.sleep(6000); 
  }
}