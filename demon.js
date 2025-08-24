/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tprint("INFO: Starte allmächtigen Hacking-Daemon (Finden, Nuken, HGW)...");

    const weakenScript = "weaken-worker.js";
    const growScript = "grow-worker.js";
    const hackScript = "hack-worker.js";

    // Eine Liste der Port-Öffner-Programme
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

        for (const target of allServers) {
            if (ns.getServer(target).purchasedByPlayer || target === "home") continue;

            // --- NEUER TEIL: VERSUCHE, ROOT ZU ERLANGEN ---
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
                    ns.tprint(`SUCCESS: Root-Zugang auf ${target} erlangt!`);
                }
            }
            
            // --- HGW-LOGIK (nur wenn wir Root-Zugang haben) ---
            if (ns.hasRootAccess(target) && ns.getServerMaxMoney(target) > 0) {
                const minSecurity = ns.getServerMinSecurityLevel(target);
                const maxMoney = ns.getServerMaxMoney(target);

                // Entscheide, was zu tun ist...
                let scriptToRun;
                if (ns.getServerSecurityLevel(target) > minSecurity + 5) {
                    scriptToRun = weakenScript;
                } else if (ns.getServerMoneyAvailable(target) < maxMoney * 0.8) {
                    scriptToRun = growScript;
                } else {
                    scriptToRun = hackScript;
                }

                // ...und verteile die Aufgabe
                for (const hacker of hackerServers) {
                    // Diese Logik kann man noch verfeinern, aber als Basis ist sie gut
                    const scriptRam = ns.getScriptRam(scriptToRun, hacker);
                    const availableRam = ns.getServerMaxRam(hacker) - ns.getServerUsedRam(hacker);
                    const threads = Math.floor(availableRam / scriptRam);
                    if (threads > 0) {
                        await ns.scp([weakenScript, growScript, hackScript], hacker);
                        ns.exec(scriptToRun, hacker, threads, target);
                    }
                }
            }
        }
        await ns.sleep(10000); // Warte 10 Sekunden vor dem nächsten kompletten Durchlauf
    }
}

// Die bekannte Funktion zum Scannen aller Server
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