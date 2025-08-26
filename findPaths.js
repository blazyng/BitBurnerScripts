/**
 * Finds and prints the path to a single specified server.
 * @param {NS} ns
 */
export async function main(ns) {
    const target = ns.args[0];
    if (!target) {
        ns.tprint("ERROR: Please provide a target server.");
        ns.tprint("Usage: run find-path.js <server-name>");
        return;
    }

    const allPaths = findAllServerPaths(ns);
    const pathToTarget = allPaths[target];

    if (pathToTarget) {
        ns.tprint(`SUCCESS: Path to '${target}' found.`);
        ns.tprint(pathToTarget.join(' -> '));
    } else {
        ns.tprint(`ERROR: Server '${target}' not found or is unreachable.`);
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