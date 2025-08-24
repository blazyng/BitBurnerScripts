/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("scan");
    ns.tprint("INFO: Starting backdoor installation script...");

    // A better way to check for Singularity functions.
    if (ns.singularity === undefined) {
        ns.tprint("ERROR: Singularity functions are not available. (Requires SF-4)");
        return;
    }

    const visited = new Set();
    const queue = ["home"];
    visited.add("home");

    while (queue.length > 0) {
        const server = queue.shift();
        const serverInfo = ns.getServer(server);

        // Skip home and purchased servers, they don't need backdoors.
        if (serverInfo.purchasedByPlayer) {
            continue;
        }

        const hasRoot = serverInfo.hasAdminRights;
        const isBackdoored = serverInfo.backdoorInstalled;

        ns.print(`INFO: Analyzing '${server}'... Root: ${hasRoot}, Backdoor: ${isBackdoored}`);

        if (hasRoot && !isBackdoored) {
            ns.print(`WARN: Server '${server}' is ready for backdoor installation.`);
            try {
                await installBackdoorOnServer(ns, server);
            } catch (e) {
                ns.tprint(`ERROR: Failed to install backdoor on ${server}. Error: ${e}`);
            }
        }
        
        const connectedServers = ns.scan(server);
        for (const connectedServer of connectedServers) {
            if (!visited.has(connectedServer)) {
                visited.add(connectedServer);
                // BUG FIX: Push the singular 'connectedServer', not the whole array.
                queue.push(connectedServer);
            }
        }
    }

    ns.tprint("SUCCESS: Backdoor scan and installation script complete.");
}

/**
 * Connects to a server and installs a backdoor.
 * @param {NS} ns The Netscript object.
 * @param {string} server The hostname of the server to backdoor.
 */
async function installBackdoorOnServer(ns, server) {
    const path = findPath(ns, server);
    if (!path) {
        ns.tprint(`ERROR: Could not find path to ${server}.`);
        return;
    }

    ns.tprint(`INFO: Installing backdoor on '${server}'...`);
    
    // Connect to each server in the path
    for (const node of path) {
        ns.singularity.connect(node);
    }
    
    // Install the backdoor on the final server in the path
    await ns.singularity.installBackdoor();
    ns.tprint(`SUCCESS: Backdoor installed on ${server}!`);
    
    // Connect back to home
    ns.singularity.connect("home");
}

/**
 * Finds the shortest path from 'home' to a target server.
 * @param {NS} ns The Netscript object.
 * @param {string} target The hostname of the target server.
 * @returns {string[] | null} An array of hostnames representing the path, or null if no path is found.
 */
function findPath(ns, target) {
    const queue = [{ node: "home", path: [] }];
    const visited = new Set(["home"]);

    while (queue.length > 0) {
        const { node, path } = queue.shift();
        
        const neighbors = ns.scan(node);
        for (const neighbor of neighbors) {
            if (neighbor === target) {
                return [...path, neighbor];
            }
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push({ node: neighbor, path: [...path, neighbor] });
            }
        }
    }
    return null; // No path found
}