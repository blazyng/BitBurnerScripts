/** @param {NS} ns */
export async function main(ns) {
  ns.tprint("INFO: Starting verbose backdoor installation script...");
  
  // Überprüfe, ob die singularity-Funktionen verfügbar sind.
  // Diese sind notwendig, um Backdoors automatisch zu installieren.
  if (!ns.fileExists("Source-File-4.js", "home")) {
    ns.tprint("FEHLER: 'ns.singularity'-Funktionen nicht verfügbar.");
    ns.tprint("HINWEIS: Du musst Source-File 4 freischalten, um dieses Skript zu verwenden.");
    return;
  }
  
  const visited = new Set();
  const queue = ["home"];
  
  while (queue.length > 0) {
    const server = queue.shift();
    
    if (visited.has(server)) {
      continue;
    }
    visited.add(server);

    const serverObj = ns.getServer(server);
    
    // Wir überspringen 'home' und alle gekauften Server, da sie keine Backdoors benötigen.
    if (server === "home" || serverObj.purchasedByPlayer) {
      ns.tprint(`SKIPPING: ${server} is not a valid target.`);
      continue;
    }

    const hasRoot = ns.hasRootAccess(server);
    const isBackdoored = serverObj.backdoorInstalled;

    ns.tprint(`DEBUG: Analyzing server '${server}'...`);
    ns.tprint(`DEBUG: '${server}' -> hasRootAccess: ${hasRoot}, backdoorInstalled: ${isBackdoored}`);

    if (hasRoot && !isBackdoored) {
      ns.tprint(`INFO: Found server '${server}' for backdoor installation.`);
      
      const requiredRam = 32; 
      if (ns.getServerMaxRam("home") - ns.getServerUsedRam("home") < requiredRam) {
        ns.tprint(`WARNING: Not enough RAM on 'home' to install backdoor. Needs ${requiredRam} GB.`);
      } else {
        await installBackdoorOnServer(ns, server);
      }
    }
    
    const connectedServers = ns.scan(server);
    for (const connectedServer of connectedServers) {
      if (!visited.has(connectedServer)) {
        queue.push(connectedServers);
      }
    }
  }

  ns.tprint("INFO: Backdoor scan complete.");
}

/**
 * Helper function to find the path, connect, and install a backdoor.
 */
async function installBackdoorOnServer(ns, server) {
  const path = findPath(ns, server);

  if (!path) {
    ns.tprint(`ERROR: Could not find path to ${server}.`);
    return;
  }
  
  const homeHostname = ns.getHostname();

  ns.tprint(`INFO: Connecting to ${server} to install backdoor...`);
  
  for (const node of path) {
    await ns.singularity.connect(node);
  }
  
  ns.tprint(`INFO: Installing backdoor on ${server}. This may take a moment.`);
  await ns.singularity.installBackdoor();
  
  ns.tprint(`SUCCESS: Backdoor installed on ${server}. Connecting back to home.`);
  
  ns.singularity.connect(homeHostname);
}

/**
 * Helper function to find the shortest path to a server.
 */
function findPath(ns, target) {
  const queue = [{ node: "home", path: [] }];
  const visited = new Set(["home"]);

  while (queue.length > 0) {
    const { node, path } = queue.shift();
    if (node === target) {
      return path;
    }
    
    const neighbors = ns.scan(node);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }
  return null;
}