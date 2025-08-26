/**
 * Scans the entire network and prints the connection path for every server.
 * @param {NS} ns
 */
export async function main(ns) {
    const allPaths = findAllServerPaths(ns);
    ns.tprint("INFO: Found paths to all servers from 'home':");
    
    // Sort server names alphabetically for a cleaner output
    const sortedServers = Object.keys(allPaths).sort();

    for (const server of sortedServers) {
        // We skip 'home' as the path is trivial
        if (server === "home") continue;
        
        const path = allPaths[server];
        ns.tprint(`${server}: ${path.join(' -> ')}`);
    }
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