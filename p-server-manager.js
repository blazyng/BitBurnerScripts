/** @param {NS} ns */
export async function main(ns) {
  // --- USER SETTINGS ---
  // The amount of RAM for the new server (we will buy the biggest available).
  const maxServerRam = ns.getPurchasedServerMaxRam();
  // The name of the worker script that will be copied and run.
  const scriptToRun = "hack.js";

  while (true) {
    const purchasedServers = ns.getPurchasedServers();

    // PHASE 1: Buy a new server if we haven't reached the limit yet.
    if (purchasedServers.length < ns.getPurchasedServerLimit()) {
      const serverCost = ns.getPurchasedServerCost(maxServerRam);

      if (ns.getServerMoneyAvailable("home") >= serverCost) {
        const newServerName = ns.purchaseServer("pserv", maxServerRam);
        ns.tprint(`SUCCESS: Bought new server '${newServerName}' with ${ns.nFormat(maxServerRam, '0.00a')}GB RAM.`);
        await ns.scp(scriptToRun, newServerName);
        ns.tprint(`SUCCESS: Deployed '${scriptToRun}' on '${newServerName}'.`);
      }
    } 
    
    // PHASE 2: Upgrade a server if we have reached the limit.
    else {
      // Find the weakest server to upgrade.
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

          const newServerName = ns.purchaseServer("pserv", maxServerRam);
          ns.tprint(`SUCCESS: Replaced '${weakestServer}' with '${newServerName}' (${ns.nFormat(maxServerRam, '0.00a')}GB).`);
          await ns.scp(scriptToRun, newServerName);
          ns.tprint(`SUCCESS: Deployed '${scriptToRun}' on '${newServerName}'.`);
        }
      }
    }

    await ns.sleep(60000); // Check once a minute.
  }
}