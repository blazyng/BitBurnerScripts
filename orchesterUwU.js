/** @param {NS} ns */
export async function main(ns) {
    ns.tprint("INFO: Checking status of essential daemons...");

    // A list of all your manager scripts that should run continuously.
    const daemons = [
        "demon.js",
        "hacknet-manager.js",
        "p-server-manager.js",
        "stockMarket.js"
        // Add "reputation-manager.js" here once you've created it.
    ];

    for (const script of daemons) {
        // Check if the script is NOT already running on 'home'.
        if (!ns.isRunning(script, "home")) {
            // If it's not running, start it.
            ns.run(script);
            ns.tprint(`SUCCESS: Started '${script}'.`);
        } else {
            ns.tprint(`INFO: '${script}' is already running.`);
        }
    }
    ns.tprint("--- Daemon check complete. Launcher is exiting. ---");
}