/**
 * Advanced Hacking Daemon v2.2 (Final)
 * - Focused Target: Attacks the single most profitable server.
 * - Home Server Contribution: Uses home RAM for hacking, but keeps a user-defined percentage free.
 * - Protects manager scripts running on home.
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tprint("INFO: Starting Focused Hacking Daemon v2.2...");

    // --- SETTINGS ---
    // Keep 20% of home's RAM free for other scripts and commands.
    const homeRamReservePercent = 0.20;

    const worker = {
        weaken: "weaken-worker.js",
        grow: "grow-worker.js",
        hack: "hack-worker.js",
    };

    while (true) {
        const allServers = getAllServers(ns);
        const player = ns.getPlayer();

        // --- Phase 1: Nuke all possible servers ---
        for (const server of allServers) {
            if (!ns.hasRootAccess(server)) {
                tryNuke(ns, server);
            }
        }

        // --- Phase 2: Find the single best target ---
        let bestTarget = "";
        let maxScore = 0;
        for (const server of allServers) {
            const s = ns.getServer(server);
            if (s.purchasedByPlayer || !s.hasAdminRights || s.moneyMax === 0 || s.requiredHackingSkill > player.skills.hacking) {
                continue;
            }
            const score = s.moneyMax / s.minDifficulty;
            if (score > maxScore) {
                maxScore = score;
                bestTarget = server;
            }
        }

        if (!bestTarget) {
            ns.print("WARN: No suitable target found. Waiting...");
            await ns.sleep(60000);
            continue;
        }

        // --- Phase 3: Prepare and Attack the best target ---
        ns.print(`INFO: Best target is '${bestTarget}'. Preparing attack...`);
        const target = bestTarget;
        const moneyThresh = ns.getServerMaxMoney(target) * 0.90;
        const securityThresh = ns.getServerMinSecurityLevel(target) + 5;

        let scriptToRun;
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            scriptToRun = worker.weaken;
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            scriptToRun = worker.grow;
        } else {
            scriptToRun = worker.hack;
        }

        // --- Phase 4: Distribute the task across the entire network ---
        const hackerServers = allServers.filter(s => ns.hasRootAccess(s) && ns.getServerMaxRam(s) > 0);
        await ns.scp(Object.values(worker), "home", "home"); // Ensure workers are on home

        for (const hacker of hackerServers) {
            // Stop old tasks on WORKER servers, but NEVER on home.
            if (hacker !== "home") {
                ns.killall(hacker);
                await ns.scp(Object.values(worker), hacker, "home");
            }

            // Calculate available RAM with the special reserve rule for home.
            let availableRam = ns.getServerMaxRam(hacker) - ns.getServerUsedRam(hacker);
            if (hacker === "home") {
                const homeMaxRam = ns.getServerMaxRam("home");
                const reservedRam = homeMaxRam * homeRamReservePercent;
                availableRam = Math.max(0, availableRam - reservedRam);
            }
            
            const scriptRam = ns.getScriptRam(scriptToRun, hacker);
            const threads = Math.floor(availableRam / scriptRam);

            if (threads > 0) {
                ns.exec(scriptToRun, hacker, threads, target);
            }
        }

        await ns.sleep(2000);
    }
}

// --- HELPER FUNCTIONS ---
// FIX: Moved outside of the main function and the while-loop.

/**
 * Returns a list of all servers in the network.
 * @param {NS} ns 
 * @returns {string[]}
 */
function getAllServers(ns) {
    const visited = new Set(["home"]);
    const queue = ["home"];
    while (queue.length > 0) {
        const connectedServers = ns.scan(queue.shift());
        for (const server of connectedServers) {
            if (!visited.has(server)) {
                visited.add(server);
                queue.push(server);
            }
        }
    }
    return [...visited];
}

/**
 * Tries to gain root access on a target server.
 * @param {NS} ns 
 * @param {string} target 
 * @returns {boolean}
 */
function tryNuke(ns, target) {
    const portOpeners = [ns.brutessh, ns.ftpcrack, ns.relaysmtp, ns.httpworm, ns.sqlinject];
    const exeFiles = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
    let openPorts = 0;
    for (let i = 0; i < exeFiles.length; i++) {
        if (ns.fileExists(exeFiles[i], "home")) {
            portOpeners[i](target);
            openPorts++;
        }
    }
    if (openPorts >= ns.getServerNumPortsRequired(target) && ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target)) {
        ns.nuke(target);
        return true;
    }
    return false;
}