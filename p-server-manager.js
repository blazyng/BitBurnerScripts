/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tprint("INFO: Starte Manager für gekaufte Server.");

    // --- EINSTELLUNGEN ---
    const serverNamePrefix = "pserv-";
    // Wieviel Geld soll immer mindestens übrig bleiben?
    const geldReserve = 1000000000; // 1 Milliarde als Beispiel

    while (true) {
        const geldVerfuegbar = ns.getServerMoneyAvailable("home") - geldReserve;
        const pservLimit = ns.getPurchasedServerLimit();
        const pservs = ns.getPurchasedServers();

        // --- Phase 1: Neue Server kaufen, bis das Limit erreicht ist ---
        if (pservs.length < pservLimit) {
            let ram = 8; // Starten wir bei 8 GB
            // Finde die größte RAM-Größe, die wir uns leisten können
            while (ns.getPurchasedServerCost(ram * 2) < geldVerfuegbar && (ram * 2) <= ns.getPurchasedServerMaxRam()) {
                ram *= 2;
            }

            if (ns.getPurchasedServerCost(ram) < geldVerfuegbar) {
                const hostname = ns.purchaseServer(serverNamePrefix + pservs.length, ram);
                if (hostname) {
                    ns.tprint(`SUCCESS: Neuen Server '${hostname}' mit ${ram}GB RAM gekauft.`);
                }
            }
        }

        // --- Phase 2: Bestehende Server inkrementell aufrüsten ---
        if (pservs.length === pservLimit) {
            let schwächsterServer = "";
            let niedrigsterRam = ns.getPurchasedServerMaxRam() + 1;

            // Finde den Server mit dem wenigsten RAM
            for (const server of pservs) {
                const ram = ns.getServerMaxRam(server);
                if (ram < niedrigsterRam) {
                    niedrigsterRam = ram;
                    schwächsterServer = server;
                }
            }

            // Versuche, den RAM des schwächsten Servers zu verdoppeln
            const ramUpgrade = niedrigsterRam * 2;
            if (ramUpgrade <= ns.getPurchasedServerMaxRam() && ns.getPurchasedServerCost(ramUpgrade) < geldVerfuegbar) {
                ns.upgradePurchasedServer(schwächsterServer, ramUpgrade);
                ns.tprint(`SUCCESS: Server '${schwächsterServer}' auf ${ramUpgrade}GB RAM aufgerüstet.`);
            }
        }
        
        await ns.sleep(10000); // Prüfe alle 10 Sekunden
    }
}