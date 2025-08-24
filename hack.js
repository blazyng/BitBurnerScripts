/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0];

  while (true) {
    // 1. Weaken: Always lower security first if needed
    if (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target) + 5) {
      await ns.weaken(target);
    }
    // 2. Grow: Then increase money if needed
    else if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.75) {
      await ns.grow(target);
    }
    // 3. Hack: When both conditions are optimal, hack
    else {
      await ns.hack(target);
      // 4. Weaken after hack:
      // A hack increases security, so we weaken it right away.
      // This makes the next cycle more efficient.
      await ns.weaken(target);
    }
  }
}