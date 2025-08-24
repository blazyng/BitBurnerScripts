/** @param {NS} ns */
export async function main(ns) {
    ns.tprint("INFO: Checking status of essential daemons...");

    // Eine Liste aller deiner Manager-Skripte, die immer laufen sollen.
    const daemons = [
        "demon.js",
        "hacknet-manager.js",
        "p-server-manager.js",
        "stockMarket.js"
    ];

    for (const script of daemons) {
        // Prüfe, ob das Skript NICHT bereits auf 'home' läuft.
        if (!ns.isRunning(script, "home")) {
            // Wenn es nicht läuft, starte es.
            ns.run(script);
            ns.tprint(`SUCCESS: Started '${script}'.`);
        } else {
            ns.tprint(`INFO: '${script}' is already running.`);
        }
    }
    ns.tprint("--- Daemon check complete. Launcher is exiting. ---");
}