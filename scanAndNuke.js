/** @param {NS} ns */
export async function main(ns) {
  // A list of hacking programs in the order they are generally acquired.
  const hackingPrograms = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe"
  ];
  
  const purchasedPrograms = hackingPrograms.filter(program => ns.fileExists(program, "home"));
  const numPrograms = purchasedPrograms.length;
  
  const visited = new Set();
  const queue = ["home"];
  
  ns.tprint(`Current Hacking Tools: ${purchasedPrograms.join(", ")}`);
  
  while (queue.length > 0) {
    const server = queue.shift();
    
    if (visited.has(server)) {
      continue;
    }
    visited.add(server);
    
    // Check if the server has root access.
    if (ns.hasRootAccess(server)) {
      // Check if a backdoor needs to be installed.
      if (!ns.getServer(server).backdoorInstalled) {
        ns.tprint(`--- MANUALLY INSTALL BACKDOOR ---`);
        ns.tprint(`HINT: You can install a backdoor on ${server}.`);
        ns.tprint(`1. Connect: connect ${server}`);
        ns.tprint(`2. Install: backdoor`);
        ns.tprint(`3. Return: connect home`);
        ns.tprint(`---------------------------------`);
      }
    } else {
      const requiredSkill = ns.getServerRequiredHackingLevel(server);
      const requiredPorts = ns.getServerNumPortsRequired(server);
      const myHackingSkill = ns.getHackingLevel();
      
      // Decide if we can hack this server.
      if (myHackingSkill < requiredSkill) {
        ns.tprint(`SKIPPING: ${server} - Hacking skill too low. Req: ${requiredSkill}, Current: ${myHackingSkill}`);
      } else if (requiredPorts > numPrograms) {
        ns.tprint(`SKIPPING: ${server} - Not enough hacking programs. Req: ${requiredPorts}, Have: ${numPrograms}`);
      } else {
        // Run all available port-opening programs.
        for (const program of purchasedPrograms) {
          switch (program) {
            case "BruteSSH.exe":
              ns.brutessh(server);
              break;
            case "FTPCrack.exe":
              ns.ftpcrack(server);
              break;
            case "relaySMTP.exe":
              ns.relaysmtp(server);
              break;
            case "HTTPWorm.exe":
              ns.httpworm(server);
              break;
            case "SQLInject.exe":
              ns.sqlinject(server);
              break;
          }
        }
        
        ns.nuke(server);
        ns.tprint(`SUCCESS: ${server} was hacked and taken over with Nuke.exe!`);
        ns.tprint(`HINT: You can now install a backdoor on ${server}.`);
      }
    }
    
    // Add connected servers to the queue for scanning.
    const connectedServers = ns.scan(server);
    for (const connectedServer of connectedServers) {
      if (!visited.has(connectedServer)) {
        queue.push(connectedServer);
      }
    }
  }
}