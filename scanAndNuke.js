/** @param {NS} ns */
export async function main(ns) {
  ns.tprint("INFO: Starting continuous network scanner and nuker daemon.");

  while (true) {
    const serversToHack = await findAllServersToHack(ns);
    const hackingPrograms = [
      "BruteSSH.exe",
      "FTPCrack.exe",
      "relaySMTP.exe",
      "HTTPWorm.exe",
      "SQLInject.exe"
    ];

    for (const server of serversToHack) {
      const serverObj = ns.getServer(server);

      // We need to have enough hacking skill to hack the server.
      if (ns.getHackingLevel() >= serverObj.requiredHackingSkill) {

        // Check which hacking programs are available and open ports.
        let portsOpened = 0;
        if (ns.fileExists(hackingPrograms[0], "home")) {
          ns.brutessh(server);
          portsOpened++;
        }
        if (ns.fileExists(hackingPrograms[1], "home")) {
          ns.ftpcrack(server);
          portsOpened++;
        }
        if (ns.fileExists(hackingPrograms[2], "home")) {
          ns.relaysmtp(server);
          portsOpened++;
        }
        if (ns.fileExists(hackingPrograms[3], "home")) {
          ns.httpworm(server);
          portsOpened++;
        }
        if (ns.fileExists(hackingPrograms[4], "home")) {
          ns.sqlinject(server);
          portsOpened++;
        }

        // Try to gain root access.
        if (portsOpened >= serverObj.numOpenPortsRequired) {
          ns.nuke(server);
          ns.tprint(`SUCCESS: Nuked and gained root access on ${server}.`);
        }
      }
    }
    await ns.sleep(120000); // Wait 2 minutes (120000 ms) before the next scan.
  }
}

/**
 * Helper function to find all servers that we haven't rooted yet.
 * @param {NS} ns
 * @returns {Array<string>} An array of server hostnames without root access.
 */
async function findAllServersToHack(ns) {
  const visited = new Set();
  const queue = ["home"];
  const servers = [];
  
  while (queue.length > 0) {
    const server = queue.shift();
    if (visited.has(server) || ns.hasRootAccess(server)) {
      continue;
    }
    visited.add(server);
    
    // We only care about servers that are not home or purchased.
    if (server !== "home" && !ns.getServer(server).purchasedByPlayer) {
      servers.push(server);
    }
    
    const connectedServers = ns.scan(server);
    for (const connectedServer of connectedServers) {
      if (!visited.has(connectedServer)) {
        queue.push(connectedServer);
      }
    }
  }
  return servers;
}