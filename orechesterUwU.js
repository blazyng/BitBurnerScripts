/** @param {NS> ns */
export async function main(ns) {
  ns.tprint("Starting the full automation cycle...");
  ns.tprint("This orchestrator will manage your programs, network, hacking, and finances.");

  // Phase 1: Game Progression - Hacking Tools
  ns.tprint("Phase 1: Creating hacking programs...");
  ns.run("autoCreateProgramms.js");
  await ns.sleep(10000);

  // Phase 2: Network Expansion & Preparation
  ns.tprint("Phase 2: Scanning for new targets and running Nuke...");
  ns.run("scanAndNuke.js");
  await ns.sleep(5000);

  // Phase 3: System Clean-up & Deployment
  ns.tprint("Phase 3: Killing all running scripts for a fresh start...");
  const serversToKill = await findServersToKill(ns);
  for (const server of serversToKill) {
    ns.killall(server);
  }
  await ns.sleep(1000);

  // Phase 4: Daemon Initialization
  ns.tprint("Phase 4: Starting core daemons...");
  ns.run("demon.js");
  ns.run("hacknet-manager.js");
  ns.run("hackWithoutExternalServers.js");
  ns.run("stockMarket.js");
  
  ns.tprint("All core daemons started. The orchestrator will now wait.");
  ns.tprint("Run this script again periodically to refresh the network.");

  // Phase 5: Special Note on Infiltration
  ns.tprint("--------------------------------------------------");
  ns.tprint("NOTE: autoInfiltrate.js is a manual script.");
  ns.tprint("Run it manually to activate automated infiltration.");
  ns.tprint("--------------------------------------------------");

  await ns.sleep(300000); 
}

/**
 * Helper function to find all servers that have root access.
 * @param {NS} ns
 * @returns {Array<string>} An array of server hostnames with root access.
 */
async function findServersToKill(ns) {
  const visited = new Set();
  const queue = ["home"];
  const servers = [];

  while (queue.length > 0) {
    const server = queue.shift();
    if (visited.has(server)) {
      continue;
    }
    visited.add(server);

    if (ns.hasRootAccess(server)) {
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