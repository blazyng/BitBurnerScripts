/**
 * Automatically connects your terminal to a specified server.
 * Requires Singularity API (Source-File 4).
 * @param {NS} ns
 */
export async function main(ns) {
    // 1. Check for Singularity API
    if (ns.singularity === undefined) {
        ns.tprint("ERROR: Singularity API is required for this script. (Requires SF-4)");
        return;
    }

    const target = ns.args[0];
    if (!target) {
        ns.tprint("ERROR: Please provide a target server.");
        ns.tprint("Usage: run connect-to.js <server-name>");
        return;
    }

    const allPaths = findAllServerPaths(ns);
    const pathToTarget = allPaths[target];

    if (!pathToTarget) {
        ns.tprint(`ERROR: Server '${target}' not found or is unreachable.`);
        return;
    }

    // 2. Execute connection sequence
    ns.tprint(`Connecting to '${target}'...`);
    ns.singularity.connect("home");
    for (const server of pathToTarget) {
        if (server !== "home") {
            if (!ns.singularity.connect(server)) {
                ns.tprint(`ERROR: Failed to connect to '${server}'. Aborting.`);
                return;
            }
        }
    }
    ns.tprint(`SUCCESS: You are now connected to '${target}'.`);
}

/**
 * Scans the entire network to find the path from 'home' to every server.
 * @param {NS} ns The Netscript object.
 * @returns {Object<string, string[]>} An object mapping each server name to its path from home.
 */
function findAllServerPaths(ns) {
    const paths = { "home": ["home"] };
    const queue = ["home"];
    const visited = new Set(["home"]);

    while (queue.length > 0) {
        const currentServer = queue.shift();
        const neighbors = ns.scan(currentServer);

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
                const pathToNeighbor = [...paths[currentServer], neighbor];
                paths[neighbor] = pathToNeighbor;
            }
        }
    }
    return paths;
}