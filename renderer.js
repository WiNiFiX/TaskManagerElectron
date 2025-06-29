const { exec } = require('child_process');
const { clipboard } = require('electron');

// Global variable to store current processes
let currentProcesses = [];

// Process list functionality
function getProcessList() {
    return new Promise((resolve, reject) => {
        let command;
        
        if (process.platform === 'win32') {
            // Windows
            command = 'tasklist /FO CSV /NH';
        } else {
            // macOS and Linux
            command = 'ps aux';
        }

        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}

function parseProcessList(output, platform) {
    const processes = [];
    
    if (platform === 'win32') {
        // Parse Windows tasklist output
        const lines = output.trim().split('\n');
        lines.forEach(line => {
            const parts = line.split('","');
            if (parts.length >= 5) {
                const fullName = parts[0].replace(/"/g, '');
                const pid = parts[1].replace(/"/g, '');
                const memory = parts[4].replace(/"/g, '');
                
                // Extract just the process name (after the last backslash or forward slash)
                let name = fullName;
                if (fullName.includes('\\')) {
                    name = fullName.split('\\').pop();
                } else if (fullName.includes('/')) {
                    name = fullName.split('/').pop();
                }
                // Remove .exe extension if present
                if (name.endsWith('.exe')) {
                    name = name.slice(0, -4);
                }
                
                if (name && pid && !isNaN(parseInt(pid))) {
                    processes.push({
                        name: name,
                        pid: pid,
                        memory: memory,
                        cpu: 'N/A' // Windows tasklist doesn't show CPU
                    });
                }
            }
        });
    } else {
        // Parse macOS/Linux ps aux output
        const lines = output.trim().split('\n');
        lines.slice(1).forEach(line => { // Skip header
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 11) {
                const user = parts[0];
                const pid = parts[1];
                const cpu = parts[2];
                const memory = parts[3];
                const fullCommand = parts.slice(10).join(' ');
                
                // Better process name extraction for macOS/Linux
                let name = extractProcessName(fullCommand);
                
                if (name && pid && !isNaN(parseInt(pid))) {
                    processes.push({
                        name: name,
                        pid: pid,
                        cpu: cpu + '%',
                        memory: memory + '%'
                    });
                }
            }
        });
    }
    
    // Sort alphabetically by process name and limit to maximum 1000 processes
    return processes
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        .slice(0, 1000);
}

function extractProcessName(fullCommand) {
    // Common process names to look for
    const commonProcesses = [
        'firefox', 'chrome', 'safari', 'electron', 'node', 'python', 'java',
        'bash', 'zsh', 'sh', 'csh', 'tcsh', 'ksh', 'fish',
        'vim', 'nano', 'emacs', 'code', 'sublime',
        'git', 'docker', 'kubectl', 'npm', 'yarn',
        'mysql', 'postgres', 'redis', 'mongodb',
        'nginx', 'apache', 'httpd', 'lighttpd',
        'systemd', 'launchd', 'init', 'upstart',
        'finder', 'dock', 'spotlight', 'siri',
        'terminal', 'iterm', 'hyper', 'alacritty',
        'slack', 'discord', 'teams', 'zoom', 'skype',
        'spotify', 'itunes', 'vlc', 'quicktime',
        'photoshop', 'illustrator', 'figma', 'sketch',
        'xcode', 'android', 'flutter', 'react',
        'webpack', 'babel', 'eslint', 'prettier'
    ];

    // First, try to find a common process name in the command
    for (const processName of commonProcesses) {
        if (fullCommand.toLowerCase().includes(processName)) {
            return processName;
        }
    }

    // If no common process found, try to extract from path
    let name = fullCommand;
    
    // Remove common path prefixes
    name = name.replace(/^\/usr\/bin\//, '');
    name = name.replace(/^\/usr\/sbin\//, '');
    name = name.replace(/^\/bin\//, '');
    name = name.replace(/^\/sbin\//, '');
    name = name.replace(/^\/System\/Library\//, '');
    name = name.replace(/^\/Library\//, '');
    name = name.replace(/^\/Applications\//, '');
    
    // Get the last part after any slash
    if (name.includes('/')) {
        name = name.split('/').pop();
    }
    
    // Remove any arguments or parameters
    if (name.includes(' ')) {
        name = name.split(' ')[0];
    }
    
    // Remove common extensions
    name = name.replace(/\.(exe|app|bundle|framework)$/, '');
    
    // Filter out very long names (likely paths or profile directories)
    if (name.length > 20) {
        return null;
    }
    
    // Filter out names that look like random strings or hashes
    if (/^[a-f0-9]{8,}$/i.test(name) || /^[a-z0-9]{16,}$/i.test(name)) {
        return null;
    }
    
    return name;
}

function createProcessTable(processes) {
    if (processes.length === 0) {
        return '<div class="error">No processes found</div>';
    }

    let tableHTML = `
        <div id="stickyHeader" style="position: fixed; top: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.95); z-index: 1000; padding: 0.5rem; border-bottom: 1px solid rgba(0, 0, 0, 0.1); display: none;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.7rem;">
                <tr>
                    <th style="background: rgba(128, 128, 128, 0.2); padding: 0.4rem 0.5rem; text-align: left; font-weight: 600; color: #333; border-bottom: 1px solid rgba(0, 0, 0, 0.1);">Process Name</th>
                    <th style="background: rgba(128, 128, 128, 0.2); padding: 0.4rem 0.5rem; text-align: left; font-weight: 600; color: #333; border-bottom: 1px solid rgba(0, 0, 0, 0.1);">PID</th>
                    <th style="background: rgba(128, 128, 128, 0.2); padding: 0.4rem 0.5rem; text-align: left; font-weight: 600; color: #333; border-bottom: 1px solid rgba(0, 0, 0, 0.1);">CPU</th>
                    <th style="background: rgba(128, 128, 128, 0.2); padding: 0.4rem 0.5rem; text-align: left; font-weight: 600; color: #333; border-bottom: 1px solid rgba(0, 0, 0, 0.1);">Memory</th>
                </tr>
            </table>
        </div>
        <table class="process-table" id="mainTable">
            <thead>
                <tr>
                    <th>Process Name</th>
                    <th>PID</th>
                    <th>CPU</th>
                    <th>Memory</th>
                </tr>
            </thead>
            <tbody>
    `;

    processes.forEach(proc => {
        tableHTML += `
            <tr>
                <td>${proc.name}</td>
                <td class="pid">${proc.pid}</td>
                <td class="cpu">${proc.cpu}</td>
                <td class="memory">${proc.memory}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    
    // Add button container at the bottom
    tableHTML += `
        <div class="button-container">
            <button class="calculator-btn" onclick="launchCalculator()">🧮 Calculator</button>
            <button class="copy-btn" onclick="copyProcessList()">📋 Copy Process List</button>
        </div>
    `;
    
    return tableHTML;
}

function copyProcessList() {
    if (currentProcesses.length === 0) {
        alert('No processes to copy!');
        return;
    }
    
    // Create a list of process names separated by newlines
    const processNames = currentProcesses.map(proc => proc.name).join('\n');
    
    // Copy to clipboard
    clipboard.writeText(processNames);
    
    // Show feedback
    alert(`Copied ${currentProcesses.length} process names to clipboard!`);
}

async function updateProcessList() {
    try {
        const output = await getProcessList();
        const processes = parseProcessList(output, process.platform);
        
        // Store current processes globally
        currentProcesses = processes;
        
        const tableHTML = createProcessTable(processes);
        
        document.getElementById('processTableContainer').innerHTML = tableHTML;
        
        // Initialize sticky headers after table is created
        setTimeout(handleStickyHeaders, 100);
        
    } catch (error) {
        console.error('Error fetching processes:', error);
        document.getElementById('processTableContainer').innerHTML = 
            '<div class="error">Error loading processes: ' + error.message + '</div>';
    }
}

// Update process list every 5 seconds
updateProcessList(); // Initial load
// setInterval(updateProcessList, 5000); // Uncomment to enable auto-refresh

function launchCalculator() {
    if (process.platform === 'darwin') {
        // macOS
        exec('open -a Calculator', (error) => {
            if (error) {
                console.error('Error launching calculator:', error);
                alert('Error launching calculator: ' + error.message);
            } else {
                console.log('Calculator launched successfully');
            }
        });
    } else if (process.platform === 'win32') {
        // Windows
        exec('calc', (error) => {
            if (error) {
                console.error('Error launching calculator:', error);
                alert('Error launching calculator: ' + error.message);
            } else {
                console.log('Calculator launched successfully');
            }
        });
    } else {
        // Linux
        exec('gnome-calculator', (error) => {
            if (error) {
                // Try alternative calculators
                exec('kcalc', (error2) => {
                    if (error2) {
                        console.error('Error launching calculator:', error2);
                        alert('Error launching calculator: ' + error2.message);
                    } else {
                        console.log('Calculator launched successfully');
                    }
                });
            } else {
                console.log('Calculator launched successfully');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Process monitor loaded successfully!');
});

// Function to handle sticky headers
function handleStickyHeaders() {
    console.log('🔧 Initializing sticky headers...');
    
    const container = document.querySelector('.container');
    const stickyHeader = document.getElementById('stickyHeader');
    const mainTable = document.getElementById('mainTable');
    const tableHeader = mainTable ? mainTable.querySelector('thead') : null;
    
    console.log('Container found:', !!container);
    console.log('Sticky header found:', !!stickyHeader);
    console.log('Main table found:', !!mainTable);
    console.log('Table header found:', !!tableHeader);
    
    if (!container || !stickyHeader || !mainTable || !tableHeader) {
        console.error('❌ Missing elements for sticky headers');
        return;
    }
    
    console.log('✅ All elements found, setting up scroll listener...');
    
    // Function to check if we should show sticky header
    function checkStickyHeader() {
        const containerRect = container.getBoundingClientRect();
        const headerRect = tableHeader.getBoundingClientRect();
        
        console.log('📊 Scroll check:');
        console.log('  Container top:', containerRect.top);
        console.log('  Header top:', headerRect.top);
        console.log('  Header bottom:', headerRect.bottom);
        console.log('  Container scrollTop:', container.scrollTop);
        
        // Show sticky header when the original header scrolls out of the container's visible area
        // We need to check if the header's top is above the container's top
        if (headerRect.top < containerRect.top) {
            console.log('👆 Showing sticky header');
            stickyHeader.style.display = 'block';
        } else {
            console.log('👇 Hiding sticky header');
            stickyHeader.style.display = 'none';
        }
    }
    
    // Add scroll listener to container
    container.addEventListener('scroll', () => {
        console.log('🔄 SCROLL EVENT DETECTED!');
        checkStickyHeader();
    });
    
    // Initial check
    checkStickyHeader();
    
    console.log('✅ Sticky header listener attached');
} 