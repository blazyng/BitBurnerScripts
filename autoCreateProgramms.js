/** @param {NS} ns */
export async function main(ns) {
    // Defines the hacking level required for each program.
    const programRequirements = {
        "BruteSSH.exe": 50,
        "FTPCrack.exe": 100,
        "relaySMTP.exe": 250,
        "HTTPWorm.exe": 500,
        "SQLInject.exe": 750
    };
    const programsToCreate = Object.keys(programRequirements);

    // Check if Singularity functions are available.
    if (ns.singularity === undefined) {
        ns.tprint("ERROR: Singularity functions are not available. (Requires BN-4 or 'The Red Pill')");
        return;
    }

    // Check if the player is currently busy with another task.
    if (ns.singularity.isBusy()) {
        ns.tprint("INFO: Player is busy. Skipping program creation.");
        return;
    }

    for (const program of programsToCreate) {
        if (!ns.fileExists(program, "home")) {
            const myHackingSkill = ns.getHackingLevel();
            const requiredSkill = programRequirements[program];

            if (myHackingSkill >= requiredSkill) {
                ns.tprint(`SUCCESS: Starting creation of ${program}.`);
                if (ns.singularity.createProgram(program)) {
                    ns.tprint(`-> ${program} is now being created. The script will exit for now.`);
                } else {
                    ns.tprint(`WARN: Creation of ${program} failed (not enough money?).`);
                }
                // Exit the script to free up RAM while the program is being created.
                return; 
            } else {
                ns.tprint(`INFO: Next program: ${program}. Required hacking level: ${requiredSkill}. Current: ${myHackingSkill}`);
                // Stop here since programs must be created in order.
                return;
            }
        }
    }

    ns.tprint("SUCCESS: All hacking programs have already been created!");
}