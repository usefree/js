// incidentManager.js

// State Variables
let L1Requests = []; // Array of L1 support engineer requests
let ProdSlackChannelAlerts = []; // Array of Slack channel alerts
let ProdOpsgenieAlerts = []; // Array of OpsGenie alerts
let AskDevOpsChannelRequests = []; // Array of requests to Ask_DevOps channel

let ProductionInDanger = false;
let ClearHowToResolve = true;
let Escalated = false;

// Jira Task Counter for simulation
let jiraTaskCounter = 1;

// Function to create a Jira task
function createTaskToResolveIssue(issue) {
    // Simulate creating a Jira task and returning the task number
    const jiraTaskNumber = `devops-${jiraTaskCounter++}`;
    console.log(`Created Jira task ${jiraTaskNumber} for issue: "${issue}"`);
    return jiraTaskNumber;
}

// Function to silence an alert
function silenceAlert(alert) {
    // Simulate silencing an alert
    if (alert.status !== 'silenced') {
        alert.status = 'silenced';
        console.log(`Silenced alert: ${alert.id}`);
        // Add a comment or record the silencing
        alert.silenceComment = `Silenced by Jira task ${alert.jiraTaskNumber}`;
    } else {
        console.log(`Alert: ${alert.id} is already silenced.`);
    }
}

// Function to perform a planned task
async function doPlannedTask(timeInSeconds) {
    // Simulate performing a planned task that takes timeInSeconds
    console.log(`Starting planned task for ${timeInSeconds} seconds.`);
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Planned task completed.`);
            resolve('Resolved');
        }, timeInSeconds * 1000); // Convert seconds to milliseconds
    });
}

// Function to try to resolve an issue
async function tryToResolveIssue(issue, timeInSeconds) {
    console.log(`Attempting to resolve issue: "${issue}" within ${timeInSeconds} seconds.`);
    let issueStatus = 'In Progress';
    let timeRemaining = timeInSeconds;

    while (issueStatus !== 'Resolved' && timeRemaining > 0) {
        // Simulate resolution steps
        await sleep(1000); // Wait 1 second
        // Randomly decide if resolution was successful
        const resolved = Math.random() > 0.3; // 70% chance to resolve
        if (resolved) {
            issueStatus = 'Resolved';
            console.log(`Issue resolved: "${issue}"`);
        } else {
            console.log(`Issue still unresolved: "${issue}"`);
        }
        timeRemaining -= 1;
    }

    if (issueStatus !== 'Resolved') {
        console.log(`Failed to resolve issue within time: "${issue}"`);
    }

    return issueStatus;
}

// Function to escalate an issue
function escalate(issue) {
    // Simulate escalating the issue
    if (!Escalated) {
        Escalated = true;
        console.log(`Escalated issue: "${issue}" to a more experienced colleague.`);
        // Implement actual escalation logic here (e.g., notify via Slack or OpsGenie)
    } else {
        console.log(`Issue: "${issue}" has already been escalated.`);
    }
    return Escalated;
}

// Helper functions for time
function getCurrentDay() {
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const now = new Date();
    return days[now.getDay()];
}

function getCurrentTime() {
    const now = new Date();
    return {
        hour: now.getHours(),
        minute: now.getMinutes()
    };
}

function isWorkingDay(day) {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day);
}

function isWorkingHours(time) {
    return (time.hour > 9 || (time.hour === 9 && time.minute >= 0)) && (time.hour < 18);
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to check if production is in danger
function checkProductionInDanger() {
    // Simulate checking production status
    // In a real scenario, integrate with monitoring tools or APIs
    // For simulation, randomly determine the status
    ProductionInDanger = Math.random() > 0.7; // 30% chance production is in danger
    console.log(`Production In Danger: ${ProductionInDanger}`);
    return ProductionInDanger;
}

// Function to check if there is a clear way to resolve the issue
function checkClearHowToResolve() {
    // Simulate determining if there is a clear resolution path
    // In a real scenario, this could involve checking documentation, known issues, etc.
    // For simulation, randomly determine the status
    ClearHowToResolve = Math.random() > 0.5; // 50% chance there is a clear resolution
    console.log(`Clear How To Resolve: ${ClearHowToResolve}`);
    return ClearHowToResolve;
}

// Function to convert requestType to a readable format
function getReadableType(requestType) {
    switch(requestType) {
        case 'L1Request':
            return 'L1 Request';
        case 'OpsGenieAlert':
            return 'OpsGenie Alert';
        case 'SlackChannelAlert':
            return 'Slack Alert';
        case 'DevOpsChannelRequest':
            return 'DevOps Channel Request';
        default:
            return 'Unknown Type';
    }
}

// Unified function to handle different types of requests/alerts
async function handleRequest(requestType, requestsArray) {
    if (requestsArray.length === 0) return false; // No action taken

    if (requestsArray.length === 1) {
        let request = requestsArray[0];
        let time = 10; // seconds

        // Log the start of the incident
        console.log(`\n=== Starting Incident ===`);
        console.log(`Name: "${request.description}"`);
        console.log(`Type: ${getReadableType(requestType)}`);
        console.log(`=========================\n`);

        // Initial Assessment
        checkProductionInDanger();
        checkClearHowToResolve();

        if (ProductionInDanger && ClearHowToResolve) {
            // Silencing the alert before attempting to resolve, unless it's a DevOps Channel Request
            if (requestType !== 'DevOpsChannelRequest') {
                silenceAlert(request);
            }
            // Attempt to resolve the issue
            let status = await tryToResolveIssue(request.description, time);
            request.status = status;
            await sleep(5000); // Sleep for 5 seconds after attempting to resolve

            if (status === 'Resolved') {
                let jiraTask = createTaskToResolveIssue(request.description);
                // Only silence alerts that are not DevOps Channel Requests
                if (requestType !== 'DevOpsChannelRequest') {
                    // Already silenced before resolving
                    // Optionally, add additional actions if needed
                }
            } else {
                // After time ended and issue not resolved, escalate if ProductionInDanger is still true
                if (ProductionInDanger) {
                    escalate(request.description);
                }
            }
        } else if (!ProductionInDanger) {
            // Create Jira task and silence alert, unless it's a DevOps Channel Request
            let jiraTask = createTaskToResolveIssue(request.description);
            if (requestType !== 'DevOpsChannelRequest') {
                silenceAlert(request);
            }
            await sleep(5000); // Sleep for 5 seconds after silencing
        } else if (ProductionInDanger && !ClearHowToResolve) {
            // Escalate the issue
            escalate(request.description);
            await sleep(5000); // Sleep for 5 seconds after escalating
        }

        // Remove the handled request from the array to prevent re-processing
        requestsArray.shift();

        // Sleep after handling the single request
        await sleep(5000); // Sleep for 5 seconds

    } else if (requestsArray.length > 1) {
        // Log the start of handling multiple incidents
        console.log(`\n=== Handling Multiple Incidents (${requestsArray.length}) ===`);

        // Escalate all requests/alerts of this type
        requestsArray.forEach(request => {
            console.log(`Escalating incident: "${request.description}"`);
            escalate(request.description);
        });

        // Clear the requests/alerts
        requestsArray.length = 0; // Efficiently clears the array

        // Log the completion of escalation
        console.log(`=== Completed Escalation of Multiple Incidents ===\n`);

        // Sleep after escalating multiple requests
        await sleep(5000); // Sleep for 5 seconds
    }

    return true; // Action taken
}

// Function to handle escalation notifications
function handleEscalation() {
    if (Escalated) {
        console.log('Issue has been escalated to a more experienced colleague.');
        // Implement actual escalation logic here (e.g., notify via Slack or OpsGenie)
        // Reset escalation flag if needed
        Escalated = false;
    }
}

// Main duty period function
async function dutyPeriod() {
    console.log("Duty period started.");

    while (DutyIsActive()) {
        const currentDay = getCurrentDay();
        const currentTime = getCurrentTime();

        if (isWorkingDay(currentDay) && isWorkingHours(currentTime)) {
            let actionTaken = false;

            // Priority 1: Handle L1 Requests
            actionTaken = await handleRequest('L1Request', L1Requests);
            if (actionTaken) {
                console.log("Handled L1 Requests. Skipping lower priority tasks.\n");
            } else {
                // Priority 2: Handle OpsGenie Alerts
                actionTaken = await handleRequest('OpsGenieAlert', ProdOpsgenieAlerts);
                if (actionTaken) {
                    console.log("Handled OpsGenie Alerts. Skipping lower priority tasks.\n");
                } else {
                    // Priority 3: Handle Slack Channel Alerts
                    actionTaken = await handleRequest('SlackChannelAlert', ProdSlackChannelAlerts);
                    if (actionTaken) {
                        console.log("Handled Slack Channel Alerts. Skipping lower priority tasks.\n");
                    } else {
                        // Priority 4: Handle DevOps Channel Requests
                        actionTaken = await handleRequest('DevOpsChannelRequest', AskDevOpsChannelRequests);
                        if (actionTaken) {
                            console.log("Handled DevOps Channel Requests. Skipping lower priority tasks.\n");
                        } else {
                            // Priority 5: Perform Planned Tasks
                            const timeToWork = 10; // seconds
                            await doPlannedTask(timeToWork);
                            // Sleep after performing a planned task
                            await sleep(5000); // Sleep for 5 seconds
                        }
                    }
                }
            }
        } else {
            // Outside working hours, implement different logic or just wait
            console.log("Outside working hours.\n");
            // Optionally, implement logic to handle alerts outside working hours
            // For example, perform different tasks or just sleep
        }

        // Check for escalation
        handleEscalation();

        // Sleep for a minute before next check
        await sleep(6 * 1000); // 60,000 milliseconds = 1 minute
    }

    console.log("Duty period ended.");
}

// Function to determine if duty is active
function DutyIsActive() {
    // Define logic for duty period
    // For example, based on time of day, dates, etc.
    // For now, return true to keep the loop running
    // Implement actual logic to start/end duty period
    return true;
}

// Initialize sample data for testing
function initializeSampleData() {
    L1Requests.push({
        id: `L1-00${jiraTaskCounter}`,
        description: 'Database connectivity issue',
        status: 'In Progress'
    });

    ProdOpsgenieAlerts.push({
        id: `OpsGenie-00${jiraTaskCounter}`,
        description: 'Service outage detected',
        status: 'In Progress'
    });

    ProdSlackChannelAlerts.push({
        id: `Slack-00${jiraTaskCounter}`,
        description: 'High memory usage detected',
        status: 'In Progress'
    });

    AskDevOpsChannelRequests.push({
        id: `DevOps-00${jiraTaskCounter}`,
        description: 'Request for deployment assistance',
        status: 'In Progress'
    });
}

// Initialize sample data for testing
function initializeSampleData2() {
    L1Requests.push({
        id: "L1-001",
        description: 'Database connectivity issue2',
        status: 'In Progress'
    });

    ProdOpsgenieAlerts.push({
        id: 'OpsGenie-002',
        description: 'Service outage detected2',
        status: 'In Progress'
    });

    ProdSlackChannelAlerts.push({
        id: 'Slack-002',
        description: 'High memory usage detected2',
        status: 'In Progress'
    });

    AskDevOpsChannelRequests.push({
        id: 'DevOps-002',
        description: 'Request for deployment assistance2',
        status: 'In Progress'
    });
}

function runLoopImmediatelyAndThenEveryMinute() {
    // Call the function immediately
    initializeSampleData();

    // Set up an interval to run every 60 seconds (60,000 milliseconds)
    setInterval(() => {
        initializeSampleData();  // Call the function every minute
    }, 60 * 1000);  // 60,000 milliseconds = 1 minute
}

// Start the loop
// Start the loop
runLoopImmediatelyAndThenEveryMinute();

// Start the duty period
dutyPeriod();
