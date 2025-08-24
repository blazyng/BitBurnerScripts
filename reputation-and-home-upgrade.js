/**
 * This script is a utility for early-to-mid game progression.
 * It automatically grinds reputation for a target faction and
 * saves up to purchase Home RAM and Core upgrades.
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("sleep");
    ns.tprint("INFO: Starting Home & Faction Progression Manager...");

    // Check if Singularity functions are available.
    if (ns.singularity === undefined) {
        ns.tprint("ERROR: Singularity functions are not available. (Requires SF-4)");
        return;
    }

    // --- USER SETTINGS ---
    // The name of the faction you want to work for.
    const targetFaction = "CyberSec";
    // The reputation amount you want to reach with this faction.
    const targetReputation = 100000;
    const workType = "Hacking Contracts"; // The correct name for hacking work

    while (true) {
        // --- PHASE 1: REPUTATION MANAGEMENT ---
        // Join the faction if we have an invitation.
        if (ns.singularity.checkFactionInvitations().includes(targetFaction)) {
            ns.singularity.joinFaction(targetFaction);
            ns.tprint(`SUCCESS: Joined faction '${targetFaction}'.`);
        }

        // Work for the faction if we are a member and below the rep target.
        if (ns.getPlayer().factions.includes(targetFaction) && ns.singularity.getFactionRep(targetFaction) < targetReputation) {
            if (!ns.singularity.isBusy()) {
                ns.tprint(`INFO: Starting work ('${workType}') for faction '${targetFaction}'.`);
                ns.singularity.workForFaction(targetFaction, workType, false);
            }
        } else if (ns.singularity.isBusy()) {
            const currentWork = ns.singularity.getCurrentWork();
            // Stop working if we are working for the target faction and have reached our goal.
            if (currentWork.type === "FACTION" && currentWork.factionName === targetFaction && ns.singularity.getFactionRep(targetFaction) >= targetReputation) {
                ns.tprint(`SUCCESS: Target reputation for '${targetFaction}' reached. Stopping work.`);
                ns.singularity.stopAction();
            }
        }

        // --- PHASE 2: HOME SERVER UPGRADE ---
        const money = ns.getServerMoneyAvailable("home");
        
        // We prioritize RAM upgrades for hacking.
        const ramCost = ns.singularity.getUpgradeHomeRamCost();
        if (money >= ramCost) {
            if (ns.singularity.upgradeHomeRam()) {
                ns.tprint("SUCCESS: Home RAM upgraded. Scripts will restart.");
                // Script will be killed by the game, so we don't need to exit manually.
            }
        }
        
        // Upgrade home cores if we can't afford RAM yet.
        const coreCost = ns.singularity.getUpgradeHomeCoresCost();
        if (money >= coreCost && money < ramCost) {
            if (ns.singularity.upgradeHomeCores()) {
                ns.tprint("SUCCESS: Home cores upgraded. Scripts will restart.");
            }
        }

        await ns.sleep(60000); // Check once a minute.
    }
}