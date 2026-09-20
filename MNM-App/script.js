// 1. PYTHON MODEL WEIGHTS (Derived from IBM HR Analytics dataset)
const modelWeights = {
    intercept: -17.3707,
    aptitude: 2.6537,
    technical: 2.9271,
    interview: 2.7610,
    continuity: 8.4024,
    college_tier: 9.5534 
};

// --- NEW: CHECK FOR COMPLETED QUIZ DATA ---
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('sjt_completed') === 'true') {
        // Fetch scores
        let techScore = localStorage.getItem('sjt_tech');
        let intScore = localStorage.getItem('sjt_int');
        
        // Update sliders
        document.getElementById('in-technical').value = techScore;
        document.getElementById('in-interview').value = intScore;
        
        // Append message to console
        setTimeout(() => {
            let consoleOut = document.getElementById('console-output');
            consoleOut.innerHTML += `\n> <span class="c-highlight">SJT Assessment Data Imported.</span>\n> Technical Proxy set to: ${techScore}/4\n> Interpersonal Proxy set to: ${intScore}/4`;
            consoleOut.scrollTop = consoleOut.scrollHeight;
        }, 500);

        // Clear local storage so it doesn't loop
        localStorage.removeItem('sjt_completed');
        localStorage.removeItem('sjt_tech');
        localStorage.removeItem('sjt_int');
        
        // Ensure UI updates
        runModel();
    }
});
// ------------------------------------------

// 2. SCENARIO DATA
// ... (Keep your existing scenarios and runModel logic exactly as it is below this)

// 2. SCENARIO DATA
const scenarios = {
    "1": { apt: 4, tech: 4, int: 3, cont: 1, coll: "1.0", debrief: "The algorithm easily categorizes this traditional profile as a Strong Hire. Numerical inputs create a confident baseline prediction." },
    "2": { apt: 5, tech: 4, int: 3, cont: 8, coll: "0.0", debrief: "The model heavily penalized the high 'NumCompaniesWorked' and non-STEM degree. It completely missed the human context that the applicant was taking short-term consulting contracts while caring for family." },
    "3": { apt: 3, tech: 4, int: 1, cont: 2, coll: "1.0", debrief: "Change the Theory: Under Person-Job fit, the high technical score justifies a hire. Under Person-Organization fit, the rock-bottom interpersonal score makes them a cultural risk. Same data, different interventions." },
    "4": { apt: 3, tech: 3, int: 4, cont: 2, coll: "0.5", debrief: "Challenge the Data: The 'RelationshipSatisfaction' score was recorded by a manager known for Leniency Bias. The model's prediction is useless if the input data is corrupted." },
    
    // UPDATED SCENARIO 5
    "5": { 
        apt: 4, 
        tech: 4, 
        int: 4, 
        cont: 8, // The algorithm secretly overwrote the resume's "1 company" with "8 companies"
        coll: "1.0", 
        debrief: "MANDATORY STOP: The candidate's resume listed 1 company. However, the system scraped private social media to find 8 short-term gigs, forcing the slider to 8 and tanking the score without informed consent. Human review must stop the automated process." 
    }
};

let currentTheory = 'job';

// 3. THE MACHINE LEARNING ENGINE
function runModel() {
    // Fetch raw slider values
    let rawApt = parseFloat(document.getElementById('in-aptitude').value);
    let rawTech = parseFloat(document.getElementById('in-technical').value);
    let rawInt = parseFloat(document.getElementById('in-interview').value);
    let rawCont = parseFloat(document.getElementById('in-continuity').value);
    let rawColl = parseFloat(document.getElementById('in-college').value);

    // Update UI Labels
    document.getElementById('val-aptitude').innerText = `${rawApt} / 5`;
    document.getElementById('val-technical').innerText = `${rawTech} / 4`;
    document.getElementById('val-interview').innerText = `${rawInt} / 4`;
    document.getElementById('val-continuity').innerText = `${rawCont} Companies`;

    // Normalize inputs to 0.0 - 1.0 to feed the Logistic Regression model
    let normApt = rawApt / 5.0;
    let normTech = rawTech / 4.0;
    let normInt = rawInt / 4.0;
    let normCont = 1.0 - (rawCont / 9.0); // Inverse relationship

    // Calculate Log-Odds (z)
    let z = modelWeights.intercept + 
            (modelWeights.aptitude * normApt) + 
            (modelWeights.technical * normTech) + 
            (modelWeights.interview * normInt) + 
            (modelWeights.continuity * normCont) + 
            (modelWeights.college_tier * rawColl);
    
    // Sigmoid Activation
    let probability = 1 / (1 + Math.exp(-z));
    let score = (probability * 100).toFixed(1);

    // Build Live Console Text
    let consoleText = `> Processing applicant data...\n`;
    consoleText += `> Math: z = ${modelWeights.intercept} + (\u03B2X)\n`;
    
    if (currentTheory === 'job') {
        consoleText += `> <span class="c-highlight">LENS ACTIVE: Person-Job Fit (Focus: Technical)</span>\n`;
    } else {
        consoleText += `> <span class="c-highlight">LENS ACTIVE: Person-Org Fit (Focus: Culture)</span>\n`;
    }

    // Update UI Elements
    let scoreEl = document.getElementById('ai-score');
    let verdictEl = document.getElementById('ai-verdict');
    let consoleOut = document.getElementById('console-output');

    scoreEl.innerText = `${score}%`;
    
    // Theory overrides output
    if (currentTheory === 'org' && rawInt <= 2) {
        scoreEl.style.color = 'var(--red)';
        verdictEl.innerText = "CULTURAL RISK REJECT";
        verdictEl.style.color = 'var(--red)';
        consoleText += `> <span class="c-warn">OVERRIDE: Low Relationship Satisfaction (Score: ${rawInt}). High cultural friction risk detected.</span>`;
    } else {
        if (score >= 70) {
            scoreEl.style.color = 'var(--green)';
            verdictEl.innerText = "STRONG HIRE";
            verdictEl.style.color = 'var(--green)';
        } else if (score >= 40) {
            scoreEl.style.color = 'var(--gold)';
            verdictEl.innerText = "BORDERLINE";
            verdictEl.style.color = 'var(--gold)';
        } else {
            scoreEl.style.color = 'var(--red)';
            verdictEl.innerText = "REJECT";
            verdictEl.style.color = 'var(--red)';
        }
        consoleText += `> System Verdict: ${verdictEl.innerText}`;
    }
    
    // Refresh the console display
    consoleOut.innerHTML = consoleText;
    consoleOut.scrollTop = consoleOut.scrollHeight;
}

function loadScenario() {
    let scId = document.getElementById('scenario-loader').value;
    let testBtn = document.getElementById('btn-take-test');
    
    // 1. IF SANDBOX: Show the test button and stop the function
    if (scId === "sandbox") {
        if (testBtn) {
            testBtn.style.display = 'block'; 
        }
        return; 
    }

    // 2. ELSE (Scenarios 1-5): Hide the test button
    if (testBtn) {
        testBtn.style.display = 'none';
    }

    // 3. Load the predefined scenario data
    let sc = scenarios[scId];
    document.getElementById('in-aptitude').value = sc.apt;
    document.getElementById('in-technical').value = sc.tech;
    document.getElementById('in-interview').value = sc.int;
    document.getElementById('in-continuity').value = sc.cont;
    document.getElementById('in-college').value = sc.coll;
    
    // Reset theory to Job fit and recalculate
    setTheory('job');
}

function setTheory(theoryType) {
    currentTheory = theoryType;
    document.getElementById('chip-job').classList.remove('active');
    document.getElementById('chip-org').classList.remove('active');
    document.getElementById(`chip-${theoryType}`).classList.add('active');
    
    // Force the model to recalculate immediately with the new lens
    runModel();
}

function investigateContext() {
    let scId = document.getElementById('scenario-loader').value;
    if (scId === "sandbox") {
        showDebrief("Human Review", "In Sandbox mode, the algorithm calculates blindly based on raw numbers. Only human conversation can determine the context behind these metrics.");
    } else {
        showDebrief("Context Revealed", scenarios[scId].debrief);
    }
}

function triggerStopCard() {
    let scId = document.getElementById('scenario-loader').value;
    if (scId === "5") {
        showDebrief("🚨 STOP CARD VALIDATED", scenarios["5"].debrief);
    } else {
        showDebrief("🚨 STOP CARD PLAYED", "You have halted the automated system to conduct an ethical or qualitative audit of the data.");
    }
}

function showDebrief(title, text) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-text').innerText = text;
    document.getElementById('debrief-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('debrief-modal').style.display = 'none';
}

// Initialize Sandbox
runModel();