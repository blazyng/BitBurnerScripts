/** @param {NS} ns */
export async function main(ns) {
  // We'll only spend up to 20% of our total money on Hacknet nodes.
  const maxMoneyRatio = 0.20; 

  while (true) {
    let lowestCost = Infinity;
    let bestInvestment = "none";
    
    // Check cost for a new node
    const purchaseCost = ns.hacknet.getPurchaseNodeCost();
    const moneyAvailable = ns.getServerMoneyAvailable("home");
    
    // Only invest if we have a reasonable amount of money and are below our investment threshold.
    if (moneyAvailable * maxMoneyRatio > purchaseCost) {
      if (purchaseCost < lowestCost) {
        lowestCost = purchaseCost;
        bestInvestment = "purchase";
      }
    }
    
    // Check costs for all upgrades
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
      const levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
      const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
      const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
      
      // Only upgrade if we're under the money limit.
      if (moneyAvailable * maxMoneyRatio > levelCost && levelCost < lowestCost) {
        lowestCost = levelCost;
        bestInvestment = `level_${i}`;
      }
      if (moneyAvailable * maxMoneyRatio > ramCost && ramCost < lowestCost) {
        lowestCost = ramCost;
        bestInvestment = `ram_${i}`;
      }
      if (moneyAvailable * maxMoneyRatio > coreCost && coreCost < lowestCost) {
        lowestCost = coreCost;
        bestInvestment = `core_${i}`;
      }
    }

    // Execute the best investment
    if (bestInvestment !== "none") {
      switch (bestInvestment) {
        case "purchase":
          ns.hacknet.purchaseNode();
          ns.tprint("INFO: Purchased a new Hacknet node.");
          break;
        default:
          const parts = bestInvestment.split('_');
          const upgradeType = parts[0];
          const index = parseInt(parts[1]);
          
          if (upgradeType === "level") {
            ns.hacknet.upgradeLevel(index, 1);
            ns.tprint(`INFO: Upgraded Hacknet Node ${index} level.`);
          } else if (upgradeType === "ram") {
            ns.hacknet.upgradeRam(index, 1);
            ns.tprint(`INFO: Upgraded Hacknet Node ${index} RAM.`);
          } else if (upgradeType === "core") {
            ns.hacknet.upgradeCore(index, 1);
            ns.tprint(`INFO: Upgraded Hacknet Node ${index} cores.`);
          }
          break;
      }
    }
    await ns.sleep(100);
  }
}