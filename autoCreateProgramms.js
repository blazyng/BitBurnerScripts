/** @param {NS} ns */
export async function main(ns) {
  // A list of hacking programs to create, in order of increasing skill requirement.
  const programsToCreate = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe"
  ];

  // Loop through the programs to find the next one to create.
  for (const program of programsToCreate) {
    // If the program does not exist, we try to create it.
    if (!ns.fileExists(program, "home")) {
      const myHackingSkill = ns.getHackingLevel();
      const requiredSkill = ns.getTrainingSkill(program);

      // Check if the hacking skill is sufficient.
      if (myHackingSkill >= requiredSkill) {
        ns.tprint(`SUCCESS: Starting to create ${program}. This will take some time.`);
        ns.singularity.createProgram(program);
        // We start the creation and then exit. The orchestrator will check again later.
        return; 
      } else {
        ns.tprint(`SKIPPING: Need hacking skill ${requiredSkill} to create ${program}. Current: ${myHackingSkill}`);
        // We'll stop here since programs must be created in order.
        return; 
      }
    }
  }

  ns.tprint("All hacking programs have been created!");
}