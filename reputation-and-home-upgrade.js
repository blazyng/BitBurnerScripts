/** @param {NS} ns */
export async function main(ns) {
  // Check if the necessary API is available.
  if (!ns.fileExists("Source-File-4.js", "home")) {
    ns.tprint("ERROR: 'ns.singularity' functions are not available. This script requires Source-File 4.");
    return;
  }
  
  // --- USER SETTINGS ---
  // The name of the faction you want to work for.
  const targetFaction = "CyberSec"; 
  // The reputation amount you want to reach with this faction.
  const targetReputation = 100000;
  
  while (true) {
    // --- PHASE 1: REPUTATION MANAGEMENT ---
    if (ns.getServerMaxRam("home") < 256) {
        ns.tprint("INFO: Skipping reputation work. Need more RAM for hacking.");
    } else {
        const faction = ns.checkFactionInvitations().includes(targetFaction) ? targetFaction : null;
        if (faction) {
          ns.tprint(`INFO: Joining faction ${targetFaction}.`);
          ns.joinFaction(faction);
        }

        if (ns.getPlayer().factions.includes(targetFaction) && ns.getFactionRep(targetFaction) < targetReputation) {
          if (!ns.isBusy()) {
            ns.tprint(`INFO: Starting work for faction ${targetFaction} to gain reputation.`);
            ns.singularity.workForFaction(targetFaction, "Hacking", false);
          }
        } else if (ns.isBusy() && ns.getFactionRep(targetFaction) >= targetReputation) {
          ns.tprint("SUCCESS: Target reputation reached. Stopping work.");
          ns.singularity.stopAction();
        }
    }

    // --- PHASE 2: HOME SERVER UPGRADE ---
    // Upgrade home RAM if possible and we have enough money.
    const ramCost = ns.singularity.getUpgradeHomeRamCost();
    const coreCost = ns.singularity.getUpgradeHomeCoresCost();
    const money = ns.getServerMoneyAvailable("home");
    
    // We prioritize RAM upgrades for hacking.
    if (money >= ramCost) {
      ns.tprint(`INFO: Upgrading home RAM... This will restart all scripts.`);
      ns.singularity.upgradeHomeRam();
      ns.tprint("SUCCESS: Home RAM upgraded. Restarting all daemons...");
      // The orchestrator will handle the restart after this script is killed.
      break; 
    }
    
    // Upgrade home cores if possible and we have enough money.
    if (money >= coreCost && money < ramCost) {
      ns.tprint(`INFO: Upgrading home cores... This will restart all scripts.`);
      ns.singularity.upgradeHomeCores();
      ns.tprint("SUCCESS: Home cores upgraded. Restarting all daemons...");
      // The orchestrator will handle the restart after this script is killed.
      break; 
    }

    await ns.sleep(60000); // Check once a minute.
  }
}