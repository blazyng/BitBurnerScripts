/** @param {NS} ns */
export async function main(ns) {
  // The name of the worker script that will be copied and run.
  const scriptToRun = "hack.js";
  const scriptRam = ns.getScriptRam(scriptToRun);

  // Phase 1: Scan and filter all hackable servers.
  const allServers = await findAllServers(ns);

  // Filter out 'home' and all purchased servers.
  let targetServers = allServers.filter(server => {
    return server !== "home" && !ns.getServer(server).purchasedByPlayer;
  });

  // We must filter the target servers to only include those we have root access to.
  targetServers = targetServers.filter(server => ns.hasRootAccess(server));

  // We find all servers that can be used to run the hacking script.
  const hackerServers = allServers.filter(server => {
    return ns.hasRootAccess(server) && ns.getServerMaxRam(server) > 0;
  });
  
  // Phase 2: Deploy the worker script to all hacker servers.
  ns.tprint("Deploying worker script to all hacker servers...");
  if (!ns.fileExists(scriptToRun, "home")) {
    ns.tprint(`ERROR: '${scriptToRun}' not found on 'home'. Cannot deploy.`);
    return;
  }
  for (const server of hackerServers) {
    await ns.scp(scriptToRun, server);
  }

  // Phase 3: Start the hacking daemon.
  let i = 0; // Counter for target rotation.
  ns.tprint("Hacking daemon started. Deploying hacking scripts.");

  while (true) {
    if (targetServers.length === 0) {
      ns.tprint("No hackable targets available. Pausing for 5 minutes.");
      await ns.sleep(300000);
      continue;
    }

    const target = targetServers[i % targetServers.length];

    for (const hacker of hackerServers) {
      if (ns.getServerMaxRam(hacker) > ns.getServerUsedRam(hacker)) {
        const availableRam = ns.getServerMaxRam(hacker) - ns.getServerUsedRam(hacker);
        const threads = Math.floor(availableRam / scriptRam);

        if (threads > 0) {
          ns.exec(scriptToRun, hacker, threads, target);
        }
      }
    }

    i++;
    await ns.sleep(10000);
  }
}

/**
 * Helper function to find all servers in the network.
 * @param {NS} ns
 * @returns {Array<string>} An array of all server hostnames.
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