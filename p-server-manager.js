/** @param {NS} ns */
export async function main(ns) {
  // --- USER SETTINGS ---
  const serverNamePrefix = "TakiNya";
  const scriptToRun = "hack.js";

  while (true) {
    const purchasedServers = ns.getPurchasedServers();

    // PHASE 1: Buy a new server if the limit has not been reached yet.
    if (purchasedServers.length < ns.getPurchasedServerLimit()) {
      const money = ns.getServerMoneyAvailable("home");
      let bestRam = 0;

      // Find the largest server we can afford.
      for (let ram = 16; ram <= ns.getPurchasedServerMaxRam(); ram *= 2) {
        const cost = ns.getPurchasedServerCost(ram);
        if (money >= cost) {
          bestRam = ram;
        }
      }

      if (bestRam > 0) {
        const cost = ns.getPurchasedServerCost(bestRam);
        const newServerName = ns.purchaseServer(serverNamePrefix, bestRam);
        ns.tprint(`SUCCESS: Bought new server '${newServerName}' with ${ns.nFormat(bestRam, '0.00a')}GB RAM.`);
        await ns.scp(scriptToRun, newServerName);
        ns.tprint(`SUCCESS: Deployed '${scriptToRun}' on '${newServerName}'.`);
      }
    } 
    
    // PHASE 2: Upgrade a server if the limit has been reached.
    else {
      // Find the weakest server to upgrade.
      const maxServerRam = ns.getPurchasedServerMaxRam();
      let weakestServer = "";
      let lowestRam = maxServerRam + 1;
      
      for (const server of purchasedServers) {
        const ram = ns.getServerMaxRam(server);
        if (ram < lowestRam) {
          lowestRam = ram;
          weakestServer = server;
        }
      }

      // If the weakest server is not yet at the max RAM, delete it and buy a new one.
      if (weakestServer !== "" && lowestRam < maxServerRam) {
        const newServerCost = ns.getPurchasedServerCost(maxServerRam);

        if (ns.getServerMoneyAvailable("home") >= newServerCost) {
          ns.tprint(`UPGRADING: Deleting weakest server '${weakestServer}' with ${ns.nFormat(lowestRam, '00a')}GB RAM.`);
          ns.killall(weakestServer);
          ns.deleteServer(weakestServer);

          const newServerName = ns.purchaseServer(serverNamePrefix, maxServerRam);
          ns.tprint(`SUCCESS: Replaced '${weakestServer}' with '${newServerName}' (${ns.nFormat(maxServerRam, '0.00a')}GB).`);
          await ns.scp(scriptToRun, newServerName);
          ns.tprint(`SUCCESS: Deployed '${scriptToRun}' on '${newServerName}'.`);
        }
      }
    }

    await ns.sleep(60000); // Check once a minute.
  }
}