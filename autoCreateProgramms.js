/** @param {NS} ns */
export async function main(ns) {
    // KORREKTUR: Wir legen die Anforderungen in einem Objekt ab.
    const programRequirements = {
        "BruteSSH.exe": 50,
        "FTPCrack.exe": 100,
        "relaySMTP.exe": 250,
        "HTTPWorm.exe": 500,
        "SQLInject.exe": 750
    };
    const programsToCreate = Object.keys(programRequirements);

    // NEU: Prüfung, ob Singularity-Funktionen überhaupt verfügbar sind.
    if (ns.singularity === undefined) {
        ns.tprint("ERROR: Singularity-Funktionen sind nicht verfügbar. (BN-4 oder 'The Red Pill' benötigt)");
        return;
    }

    // NEU: Prüfung, ob du gerade beschäftigt bist.
    if (ns.singularity.isBusy()) {
        ns.tprint("INFO: Spieler ist beschäftigt. Programm-Erstellung wird übersprungen.");
        return;
    }

    for (const program of programsToCreate) {
        if (!ns.fileExists(program, "home")) {
            const myHackingSkill = ns.getHackingLevel();
            // KORREKTUR: Wir nutzen unser Objekt für die Anforderung.
            const requiredSkill = programRequirements[program];

            if (myHackingSkill >= requiredSkill) {
                ns.tprint(`SUCCESS: Starte Erstellung von ${program}.`);
                // Der Befehl selbst ist korrekt.
                if (ns.singularity.createProgram(program)) {
                    ns.tprint(`-> ${program} wird jetzt erstellt. Das Skript beendet sich für's Erste.`);
                } else {
                    ns.tprint(`WARNUNG: Erstellung von ${program} fehlgeschlagen (nicht genug Geld?).`);
                }
                return; // Beendet sich, damit du während der Erstellung was anderes tun kannst.
            } else {
                ns.tprint(`INFO: Nächstes Programm: ${program}. Benötigtes Hacking-Level: ${requiredSkill}. Aktuell: ${myHackingSkill}`);
                // Wir stoppen hier, da die Reihenfolge wichtig ist.
                return;
            }
        }
    }

    ns.tprint("SUCCESS: Alle Hacking-Programme wurden bereits erstellt!");
}