/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tprint("INFO: Starting ROI-based Hacknet Manager.");

    // What percentage of your money do you want to spend on Hacknet upgrades? (0.5 = 50%)
    const moneyRatioToSpend = 0.5;

    while (true) {
        let bestInvestment = { type: 'none', roi: -1, cost: Infinity, action: null };

        // --- Option 1: Purchase a new node ---
        const purchaseCost = ns.hacknet.getPurchaseNodeCost();
        // Calculate the production of a brand new, base-level node to find its ROI.
        const purchaseRoi = calculateNodeProduction(1, 1, 1) / purchaseCost;
        if (purchaseRoi > bestInvestment.roi) {
            bestInvestment = { type: 'purchase', roi: purchaseRoi, cost: purchaseCost, action: () => ns.hacknet.purchaseNode() };
        }

        // --- Options 2, 3, 4: Upgrade existing nodes ---
        for (let i = 0; i < ns.hacknet.numNodes(); i++) {
            const nodeStats = ns.hacknet.getNodeStats(i);
            const currentProduction = nodeStats.production;

            // Level upgrade ROI
            const levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
            const levelProductionGain = calculateNodeProduction(nodeStats.level + 1, nodeStats.ram, nodeStats.cores) - currentProduction;
            const levelRoi = levelProductionGain / levelCost;
            if (levelRoi > bestInvestment.roi) {
                bestInvestment = { type: 'level', roi: levelRoi, cost: levelCost, action: () => ns.hacknet.upgradeLevel(i, 1) };
            }

            // RAM upgrade ROI
            const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
            const ramProductionGain = calculateNodeProduction(nodeStats.level, nodeStats.ram * 2, nodeStats.cores) - currentProduction;
            const ramRoi = ramProductionGain / ramCost;
            if (ramRoi > bestInvestment.roi) {
                bestInvestment = { type: 'ram', roi: ramRoi, cost: ramCost, action: () => ns.hacknet.upgradeRam(i, 1) };
            }

            // Core upgrade ROI
            const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
            const coreProductionGain = calculateNodeProduction(nodeStats.level, nodeStats.ram, nodeStats.cores + 1) - currentProduction;
            const coreRoi = coreProductionGain / coreCost;
            if (coreRoi > bestInvestment.roi) {
                bestInvestment = { type: 'core', roi: coreRoi, cost: coreCost, action: () => ns.hacknet.upgradeCore(i, 1) };
            }
        }

        // --- Execute the best investment found if we can afford it ---
        const moneyAvailable = ns.getServerMoneyAvailable("home");
        if (moneyAvailable * moneyRatioToSpend > bestInvestment.cost) {
            if (bestInvestment.action) {
                bestInvestment.action();
                ns.print(`SUCCESS: Best investment was '${bestInvestment.type}'. Cost: ${ns.formatNumber(bestInvestment.cost)}`);
            }
        }
        
        await ns.sleep(5000); // Wait 5 seconds
    }

    /**
     * This function simulates the game's production formula to calculate ROI.
     * @param {number} level - The node's level.
     * @param {number} ram - The node's RAM.
     * @param {number} cores - The node's cores.
     * @returns {number} The calculated production per second.
     */
    function calculateNodeProduction(level, ram, cores) {
        // This formula is derived from the game's source code and is subject to change.
        const levelMultiplier = level * 1.5;
        const ramMultiplier = Math.pow(1.035, ram - 1);
        const coresMultiplier = (cores + 5) / 6;
        // The player's global multipliers are omitted here for simplicity,
        // as they affect all ROI calculations equally.
        return levelMultiplier * ramMultiplier * coresMultiplier * ns.getHacknetMultipliers().production;
    }
}