/** @param {NS> ns */
export async function main(ns) {
  while (true) {
    let bestInvestment = "none";
    let bestInvestmentRatio = 0;
    
    // Check cost-efficiency for purchasing a new node.
    const purchaseCost = ns.hacknet.getPurchaseNodeCost();
    const purchaseProduction = ns.hacknet.getProductionForNode(1, 1, 1);
    if (purchaseCost > 0) {
      const purchaseRatio = purchaseProduction / purchaseCost;
      if (purchaseRatio > bestInvestmentRatio) {
        bestInvestmentRatio = purchaseRatio;
        bestInvestment = "purchase";
      }
    }
    
    // Iterate over all existing nodes and compare upgrade costs.
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
      const stats = ns.hacknet.getNodeStats(i);
      
      // Calculate efficiency for a level upgrade.
      const levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
      const levelGain = ns.hacknet.getProductionForNode(stats.level + 1, stats.ram, stats.cores) - stats.production;
      const levelRatio = levelGain / levelCost;
      if (levelRatio > bestInvestmentRatio) {
        bestInvestmentRatio = levelRatio;
        bestInvestment = `level_${i}`;
      }

      // Calculate efficiency for a RAM upgrade.
      const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
      const ramGain = ns.hacknet.getProductionForNode(stats.level, stats.ram + 1, stats.cores) - stats.production;
      const ramRatio = ramGain / ramCost;
      if (ramRatio > bestInvestmentRatio) {
        bestInvestmentRatio = ramRatio;
        bestInvestment = `ram_${i}`;
      }

      // Calculate efficiency for a cores upgrade.
      const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
      const coreGain = ns.hacknet.getProductionForNode(stats.level, stats.ram, stats.cores + 1) - stats.production;
      const coreRatio = coreGain / coreCost;
      if (coreRatio > bestInvestmentRatio) {
        bestInvestmentRatio = coreRatio;
        bestInvestment = `core_${i}`;
      }
    }

    // Execute the best investment if enough money is available.
    const money = ns.getServerMoneyAvailable("home");
    switch (bestInvestment) {
      case "purchase":
        if (money >= purchaseCost) {
          ns.hacknet.purchaseNode();
        }
        break;
      default:
        const parts = bestInvestment.split('_');
        const upgradeType = parts[0];
        const index = parseInt(parts[1]);
        if (upgradeType === "level" && money >= ns.hacknet.getLevelUpgradeCost(index, 1)) {
          ns.hacknet.upgradeLevel(index, 1);
        } else if (upgradeType === "ram" && money >= ns.hacknet.getRamUpgradeCost(index, 1)) {
          ns.hacknet.upgradeRam(index, 1);
        } else if (upgradeType === "core" && money >= ns.hacknet.getCoreUpgradeCost(index, 1)) {
          ns.hacknet.upgradeCore(index, 1);
        }
        break;
    }
    await ns.sleep(100);
  }
}