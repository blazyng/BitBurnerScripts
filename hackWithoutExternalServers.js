/** @param {NS} ns */
export async function main(ns) {
  // Rekursives Scannen, um alle Server im Netzwerk zu finden
  const servers = await findAllServers(ns);
  
  while (true) {
    let bestTarget = "";
    let maxMoney = 0;
    
    // Finde den profitabelsten Server, der gehackt werden kann
    for (const server of servers) {
      if (ns.hasRootAccess(server) && ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(server)) {
        if (ns.getServerMaxMoney(server) > maxMoney) {
          maxMoney = ns.getServerMaxMoney(server);
          bestTarget = server;
        }
      }
    }
    
    if (bestTarget === "") {
      ns.tprint("Keine hackbaren Server gefunden. Warten auf Fortschritt...");
      await ns.sleep(60000);
      continue;
    }
    
    // Führe den Weaken-Grow-Hack-Zyklus auf dem profitabelsten Ziel aus
    const target = bestTarget;
    
    if (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target) + 5) {
      await ns.weaken(target);
    } else if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.75) {
      await ns.grow(target);
    } else {
      await ns.hack(target);
      await ns.weaken(target);
    }
  }
}

/**
 * Hilfsfunktion zum Finden aller Server im Netzwerk.
 */
async function findAllServers(ns) {
  const visited = new Set();
  const queue = ["home"];
  const servers = [];
  
  while (queue.length > 0) {
    const server = queue.shift();
    if (visited.has(server)) continue;
    visited.add(server);
    
    servers.push(server);
    
    const connectedServers = ns.scan(server);
    for (const connectedServer of connectedServers) {
      if (!visited.has(connectedServer)) {
        queue.push(connectedServer);
      }
    }
  }
  return servers;
}