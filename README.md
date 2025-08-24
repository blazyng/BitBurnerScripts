# Bitburner Automation Suite

A collection of autonomous daemon scripts designed to automate the core functionalities of Bitburner. This suite allows for hands-free progression after a single launch command, covering network penetration, hacking economy, and financial management.

## How to Use

The entire system is managed by autonomous daemons that are launched once.

1.  Ensure all `.js` files (the manager/daemon scripts and their workers) are on your **home** server.
2.  **After a reset (new BitNode):** Manually run any one-time utility scripts needed.
    ```sh
    run autoCreateProgramms.js
    ```
3.  **To start the automation:** Run the simple launcher script. It will start all essential daemons if they aren't already running and then exit immediately to save RAM.
    ```sh
    run start.js
    ```

From this point on, the daemons will manage your entire operation in the background.

## Script Breakdown

### 1. Core System
- **`start.js`**: A lightweight launcher. Its only job is to start the main daemons listed below. It does not run continuously.
- **`demon.js`**: The heart of the hacking operation. This all-in-one daemon perpetually scans the network, gains root access on new servers (Nuking), and intelligently deploys the simple worker scripts based on the Hack-Grow-Weaken (HGW) strategy to maximize profits.
- **Worker Scripts** (`hack-worker.js`, `grow-worker.js`, `weaken-worker.js`): Three single-purpose, lightweight scripts that are controlled by `demon.js`. They execute one task and then terminate, ensuring maximum RAM efficiency.

### 2. Economic Daemons
- **`hacknet-manager.js`**: An autonomous manager that uses a Return-On-Investment (ROI) strategy to decide on the most profitable Hacknet upgrade (new node, level, RAM, or core) and executes it.
- **`p-server-manager.js`**: Manages your fleet of purchased servers. It automatically buys new servers and incrementally upgrades the weakest ones to continuously improve your network's RAM capacity.
- **`stockMarket.js`**: A fully automated stock trading bot with a target-value feature. Once its portfolio value reaches a user-defined target, it liquidates all assets and shuts down.
- **`reputation-manager.js`**: A background daemon that automates faction tasks. It automatically joins factions and works for them to grind reputation, focusing on unlocking the next available Augmentations.

### 3. Utility Scripts
- **`autoCreateProgramms.js`**: A one-time utility script to run after a reset. It checks your hacking skill and automatically creates the required `.exe` files in the correct order.
- **`autoInfiltrate.js`**: A specialized script to run on demand for automating infiltration mini-games, providing a quick boost to money and faction reputation.