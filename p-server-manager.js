/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tprint("INFO: Starting purchased server manager.");

    // --- SETTINGS ---
    const serverNamePrefix = "ChisaTaki";
    // How much money should always be kept in reserve?
    const cashReserve = 1_000_000_000; // e.g., 1 billion

    while (true) {
        const cashAvailable = ns.getServerMoneyAvailable("home") - cashReserve;
        const pservLimit = ns.getPurchasedServerLimit();
        const pservs = ns.getPurchasedServers();

        // --- Phase 1: Purchase new servers until the limit is reached ---
        if (pservs.length < pservLimit) {
            let ram = 8; // Start at 8 GB
            
            // Find the largest RAM size we can afford
            while (ns.getPurchasedServerCost(ram * 2) < cashAvailable && (ram * 2) <= ns.getPurchasedServerMaxRam()) {
                ram *= 2;
            }

            if (ns.getPurchasedServerCost(ram) < cashAvailable) {
                const hostname = ns.purchaseServer(serverNamePrefix + pservs.length, ram);
                if (hostname) {
                    ns.tprint(`SUCCESS: Purchased new server '${hostname}' with ${ram}GB RAM.`);
                }
            }
        }

        // --- Phase 2: Incrementally upgrade existing servers ---
        if (pservs.length === pservLimit) {
            let weakestServer = "";
            let lowestRam = ns.getPurchasedServerMaxRam() + 1;

            // Find the server with the least amount of RAM
            for (const server of pservs) {
                const ram = ns.getServerMaxRam(server);
                if (ram < lowestRam) {
                    lowestRam = ram;
                    weakestServer = server;
                }
            }

            // Attempt to double the RAM of the weakest server
            const ramToUpgrade = lowestRam * 2;
            if (ramToUpgrade <= ns.getPurchasedServerMaxRam() && ns.getPurchasedServerCost(ramToUpgrade) < cashAvailable) {
                ns.upgradePurchasedServer(weakestServer, ramToUpgrade);
                ns.tprint(`SUCCESS: Upgraded server '${weakestServer}' to ${ramToUpgrade}GB RAM.`);
            }
        }
        
        await ns.sleep(10000); // Check every 10 seconds
    }
}