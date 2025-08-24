/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tprint("INFO: Starting the all-in-one hacking daemon (Scan, Nuke, HGW)...");

    const weakenScript = "weaken-worker.js";
    const growScript = "grow-worker.js";
    const hackScript = "hack-worker.js";
    const workerScripts = [weakenScript, growScript, hackScript];

    // A list of the port-opening programs.
    const portOpeners = [
        { name: "BruteSSH.exe", open: ns.brutessh },
        { name: "FTPCrack.exe", open: ns.ftpcrack },
        { name: "relaySMTP.exe", open: ns.relaysmtp },
        { name: "HTTPWorm.exe", open: ns.httpworm },
        { name: "SQLInject.exe", open: ns.sqlinject }
    ];

    while (true) {
        const allServers = getAllServers(ns);
        const hackerServers = allServers.filter(s => ns.hasRootAccess(s) && ns.getServerMaxRam(s) > 0);

        // OPTIMIZATION: Copy worker scripts to all hacker servers once per cycle.
        for (const hacker of hackerServers) {
            await ns.scp(workerScripts, hacker, "home");
        }

        for (const target of allServers) {
            if (ns.getServer(target).purchasedByPlayer || target === "home") continue;

            // --- Part 1: Attempt to gain root access ---
            if (!ns.hasRootAccess(target)) {
                let openPorts = 0;
                for (const opener of portOpeners) {
                    if (ns.fileExists(opener.name, "home")) {
                        opener.open(target);
                        openPorts++;
                    }
                }
                if (openPorts >= ns.getServerNumPortsRequired(target) && ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target)) {
                    ns.nuke(target);
                    ns.tprint(`SUCCESS: Gained root access on ${target}!`);
                }
            }
            
            // --- Part 2: HGW Logic (if we have root) ---
            if (ns.hasRootAccess(target) && ns.getServerMaxMoney(target) > 0) {
                const minSecurity = ns.getServerMinSecurityLevel(target);
                const maxMoney = ns.getServerMaxMoney(target);

                // Decide which action to take...
                let scriptToRun;
                if (ns.getServerSecurityLevel(target) > minSecurity + 5) {
                    scriptToRun = weakenScript;
                } else if (ns.getServerMoneyAvailable(target) < maxMoney * 0.8) {
                    scriptToRun = growScript;
                } else {
                    scriptToRun = hackScript;
                }

                // ...and dispatch the task to our hacker servers.
                const scriptRam = ns.getScriptRam(scriptToRun);
                for (const hacker of hackerServers) {
                    const availableRam = ns.getServerMaxRam(hacker) - ns.getServerUsedRam(hacker);
                    const threads = Math.floor(availableRam / scriptRam);
                    if (threads > 0) {
                        ns.exec(scriptToRun, hacker, threads, target);
                    }
                }
            }
        }
        await ns.sleep(10000); // Wait 10 seconds before the next full cycle.
    }
}

// Helper function to scan for all servers in the network.
function getAllServers(ns) {
    const visited = new Set(["home"]);
    const queue = ["home"];
    while (queue.length > 0) {
        const server = queue.shift();
        const connectedServers = ns.scan(server);
        for (const connectedServer of connectedServers) {
            if (!visited.has(connectedServer)) {
                visited.add(connectedServer);
                queue.push(connectedServer);
            }
        }
    }
    return [...visited];
}