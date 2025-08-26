/**
 * Advanced Hacking Daemon v3.0 (Batch Processor)
 * - Plans all HGW actions in a "batch" before executing.
 * - Distributes tasks intelligently across the entire network's RAM.
 * - This is the most efficient HGW model.
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tprint("INFO: Starting Batch Hacking Daemon v3.0...");

    const worker = {
        weaken: "weaken-worker.js",
        grow: "grow-worker.js",
        hack: "hack-worker.js",
    };

    while (true) {
        const allServers = getAllServers(ns);
        const player = ns.getPlayer();

        // --- Phase 1: Analyze all targets and create a task list ---
        let tasks = [];
        for (const target of allServers) {
            const server = ns.getServer(target);
            if (server.purchasedByPlayer || target === "home" || server.moneyMax === 0) continue;

            // Nuke if needed
            if (!server.hasAdminRights) {
                if (tryNuke(ns, target)) {
                    server.hasAdminRights = true; // Update our view of the server
                } else {
                    continue; // Can't hack, so skip
                }
            }

            // HGW Planning
            const moneyThresh = server.moneyMax * 0.8;
            const securityThresh = server.minDifficulty + 5;

            if (server.hackDifficulty > securityThresh) {
                // Needs weakening
                const threadsNeeded = Math.ceil((server.hackDifficulty - server.minDifficulty) / ns.weakenAnalyze(1));
                tasks.push({ script: worker.weaken, threads: threadsNeeded, target: target, priority: 1 });
            } else if (server.moneyAvailable < moneyThresh) {
                // Needs growing
                const growthFactor = server.moneyMax / Math.max(server.moneyAvailable, 1);
                const threadsNeeded = Math.ceil(ns.growthAnalyze(target, growthFactor));
                tasks.push({ script: worker.grow, threads: threadsNeeded, target: target, priority: 2 });
            } else {
                // Ready to hack
                const threadsNeeded = Math.floor(ns.hackAnalyzeThreads(target, server.moneyAvailable * 0.25));
                if (threadsNeeded > 0) {
                    tasks.push({ script: worker.hack, threads: threadsNeeded, target: target, priority: 3 });
                }
            }
        }

        // Sort tasks by priority (weaken > grow > hack)
        tasks.sort((a, b) => a.priority - b.priority);

        // --- Phase 2 & 3: Distribute and Execute Tasks ---
        const hackerServers = allServers.filter(s => ns.hasRootAccess(s) && ns.getServerMaxRam(s) > 0);
        
        // Ensure worker scripts are everywhere
        for (const hacker of hackerServers) {
            await ns.scp(Object.values(worker), hacker, "home");
        }

        for (const task of tasks) {
            let threadsRemaining = task.threads;
            for (const hacker of hackerServers) {
                if (threadsRemaining <= 0) break;

                const scriptRam = ns.getScriptRam(task.script, hacker);
                const availableRam = ns.getServerMaxRam(hacker) - ns.getServerUsedRam(hacker);
                const possibleThreads = Math.floor(availableRam / scriptRam);

                if (possibleThreads > 0) {
                    const threadsToRun = Math.min(threadsRemaining, possibleThreads);
                    ns.exec(task.script, hacker, threadsToRun, task.target);
                    threadsRemaining -= threadsToRun;
                }
            }
        }

        await ns.sleep(1000); // Shorter sleep, as we are more precise now
    }
}

// --- Helper Functions ---
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