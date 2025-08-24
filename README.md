# Bitburner Automation Suite

A collection of scripts designed to automate core functionalities of the game Bitburner. This suite allows for hands-free progression, from network expansion to financial management, all controlled by a single orchestrator.

## How to Use

The entire system is designed to be started by running just one script.

1.  Ensure all `.js` files are in your home directory.
2.  From your home terminal, simply run the master orchestrator:

    ```sh
    run orechesterUwu.js
    ```

The `orechesterUwu.js` script will then handle the execution and management of all other scripts in the correct order.

## Script Breakdown

### 1. The Orchestrator
- **`orechesterUwu.js`**: The central hub and brain of the system. It runs in a loop, periodically starting and refreshing all other daemons to ensure your network and economy are always optimized.

### 2. Network Hacking
- **`scanAndNuke.js`**: The network expansion tool. It scans the entire network, opens ports using available `.exe` files, and gains root access on all hackable servers.
- **`demon.js`**: The hacking manager. It deploys the `hack.js` worker script to all servers with available RAM to perform money-making operations. **Now uses a safer target list by filtering out your home and purchased servers.**
- **`hack.js`**: The worker script. This is the core hacking engine that weakens, grows, and hacks a single server. It is run in parallel by `demon.js` across your network.
- **`hackWithoutExternalServers.js`**: A standalone script for hacking from your home server only. It can be used as a simple backup or early-game hacker.

### 3. Economic Automation
- **`hacknet-manager.js`**: A smart daemon that continuously calculates the best investment (new node vs. upgrade) for your Hacknet network and executes it.
- **`stockMarket.js`**: A two-phase stock market automation tool. It first earns money with a simple strategy, buys the necessary API, and then switches to an advanced, highly profitable trading strategy.

### 4. Utility Scripts
- **`autoCreateProgramms.js`**: A utility script that checks your hacking skill and automatically starts creating the required `.exe` files in the correct order.
- **`installBackdoors.js`**: **A new script that automates the process of installing backdoors on vulnerable servers to gain faction reputation.**
- **`autoInfiltrate.js`**: A specialized, manual script for automating infiltration mini-games. Run it on demand to quickly earn money and faction reputation.