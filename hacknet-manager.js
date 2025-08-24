/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tprint("INFO: Starte ROI-basierten Hacknet-Manager.");

    // Wieviel Prozent deines Geldes willst du für Hacknet-Upgrades reservieren? (0.5 = 50%)
    const moneyRatioToSpend = 0.5;

    while (true) {
        let bestInvestment = { type: 'none', roi: -1, cost: Infinity, action: null };

        // --- Option 1: Neuen Node kaufen ---
        const purchaseCost = ns.hacknet.getPurchaseNodeCost();
        const purchaseRoi = calculateNodeProduction(1, 1, 1) / purchaseCost;
        if (purchaseRoi > bestInvestment.roi) {
            bestInvestment = { type: 'purchase', roi: purchaseRoi, cost: purchaseCost, action: () => ns.hacknet.purchaseNode() };
        }

        // --- Optionen 2, 3, 4: Bestehende Nodes upgraden ---
        for (let i = 0; i < ns.hacknet.numNodes(); i++) {
            const nodeStats = ns.hacknet.getNodeStats(i);
            const currentProduction = nodeStats.production;

            // Level-Upgrade ROI
            const levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
            const levelProductionGain = calculateNodeProduction(nodeStats.level + 1, nodeStats.ram, nodeStats.cores) - currentProduction;
            const levelRoi = levelProductionGain / levelCost;
            if (levelRoi > bestInvestment.roi) {
                bestInvestment = { type: 'level', roi: levelRoi, cost: levelCost, action: () => ns.hacknet.upgradeLevel(i, 1) };
            }

            // RAM-Upgrade ROI
            const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
            const ramProductionGain = calculateNodeProduction(nodeStats.level, nodeStats.ram * 2, nodeStats.cores) - currentProduction;
            const ramRoi = ramProductionGain / ramCost;
            if (ramRoi > bestInvestment.roi) {
                bestInvestment = { type: 'ram', roi: ramRoi, cost: ramCost, action: () => ns.hacknet.upgradeRam(i, 1) };
            }

            // Core-Upgrade ROI
            const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
            const coreProductionGain = calculateNodeProduction(nodeStats.level, nodeStats.ram, nodeStats.cores + 1) - currentProduction;
            const coreRoi = coreProductionGain / coreCost;
            if (coreRoi > bestInvestment.roi) {
                bestInvestment = { type: 'core', roi: coreRoi, cost: coreCost, action: () => ns.hacknet.upgradeCore(i, 1) };
            }
        }

        // --- Führe die beste gefundene Aktion aus, wenn wir sie uns leisten können ---
        const moneyAvailable = ns.getServerMoneyAvailable("home");
        if (moneyAvailable * moneyRatioToSpend > bestInvestment.cost) {
            if (bestInvestment.action) {
                bestInvestment.action();
                ns.print(`SUCCESS: Beste Investition war '${bestInvestment.type}'. Kosten: ${ns.formatNumber(bestInvestment.cost)}`);
            }
        }
        
        await ns.sleep(5000); // Warte 5 Sekunden
    }

    // Diese Funktion simuliert die Produktionsformel des Spiels
    function calculateNodeProduction(level, ram, cores) {
        // (Diese Formel ist aus dem Spiel-Quellcode abgeleitet und kann sich ändern)
        const levelMultiplier = level * 1.5;
        const ramMultiplier = Math.pow(1.035, ram - 1);
        const coresMultiplier = (cores + 5) / 6;
        // Die globalen Multiplikatoren des Spielers werden hier der Einfachheit halber weggelassen
        return levelMultiplier * ramMultiplier * coresMultiplier;
    }
}