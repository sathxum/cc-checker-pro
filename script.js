// CC Checker Pro - Validation Engine

// Luhn Algorithm
function luhnCheck(cardNumber) {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 13) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = clean.length - 1; i >= 0; i--) {
        let digit = parseInt(clean.charAt(i), 10);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Detect card type
function detectCardType(cardNumber) {
    const clean = cardNumber.replace(/\D/g, '');
    
    if (/^4/.test(clean)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    if (/^(6011|65|64[4-9]|622)/.test(clean)) return 'Discover';
    if (/^35/.test(clean)) return 'JCB';
    if (/^(300|301|302|303|304|305|36|38)/.test(clean)) return 'Diners';
    if (/^62/.test(clean)) return 'UnionPay';
    
    return 'Unknown';
}

// Validate expiry date
function validateExpiry(month, year) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);
    
    if (isNaN(expMonth) || isNaN(expYear)) return true;
    if (expMonth < 1 || expMonth > 12) return false;
    
    const fullYear = expYear < 100 ? 2000 + expYear : expYear;
    
    if (fullYear < currentYear) return false;
    if (fullYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
}

// BIN Database
const binDatabase = {
    '424242': { bank: 'JPMorgan Chase Bank', country: 'United States', emoji: '🇺🇸', category: 'Credit' },
    '400005': { bank: 'JPMorgan Chase Bank', country: 'United States', emoji: '🇺🇸', category: 'Debit' },
    '401288': { bank: 'Wells Fargo Bank', country: 'United States', emoji: '🇺🇸', category: 'Credit' },
    '411111': { bank: 'Chase Bank', country: 'United States', emoji: '🇺🇸', category: 'Credit' },
    '510000': { bank: 'JPMorgan Chase Bank', country: 'United States', emoji: '🇺🇸', category: 'Credit' },
    '520000': { bank: 'Bank of America', country: 'United States', emoji: '🇺🇸', category: 'Credit' },
    '340000': { bank: 'American Express', country: 'United States', emoji: '🇺🇸', category: 'Credit' },
    '370000': { bank: 'American Express', country: 'United States', emoji: '🇺🇸', category: 'Credit' },
    '601100': { bank: 'Discover Financial', country: 'United States', emoji: '🇺🇸', category: 'Credit' },
    '400000': { bank: 'Barclays Bank UK', country: 'United Kingdom', emoji: '🇬🇧', category: 'Credit' },
    '450000': { bank: 'TD Canada Trust', country: 'Canada', emoji: '🇨🇦', category: 'Credit' },
    '460000': { bank: 'Commonwealth Bank', country: 'Australia', emoji: '🇦🇺', category: 'Credit' },
    '470000': { bank: 'Deutsche Bank', country: 'Germany', emoji: '🇩🇪', category: 'Credit' },
    '480000': { bank: 'BNP Paribas', country: 'France', emoji: '🇫🇷', category: 'Credit' },
    '490000': { bank: 'Mitsubishi UFJ Financial', country: 'Japan', emoji: '🇯🇵', category: 'Credit' },
    '352000': { bank: 'JCB Co., Ltd.', country: 'Japan', emoji: '🇯🇵', category: 'Credit' },
    '620000': { bank: 'Bank of China', country: 'China', emoji: '🇨🇳', category: 'Credit' },
};

// Lookup BIN
function lookupBIN(cardNumber) {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 6) return null;
    
    const bin = clean.substring(0, 6);
    return binDatabase[bin] || null;
}

// Parse card line
function parseCardLine(line) {
    const parts = line.split('|').map(p => p.trim());
    
    if (parts.length >= 4) {
        return {
            number: parts[0],
            month: parts[1],
            year: parts[2],
            cvv: parts[3],
            valid: true
        };
    }
    
    const clean = line.replace(/\s/g, '');
    
    if (/^\d{13,19}$/.test(clean)) {
        return {
            number: clean,
            month: '',
            year: '',
            cvv: '',
            valid: true
        };
    }
    
    return {
        number: parts[0] || line,
        month: parts[1] || '',
        year: parts[2] || '',
        cvv: parts[3] || '',
        valid: parts.length >= 2
    };
}

// Validate single card
function validateCard(line) {
    const parsed = parseCardLine(line);
    
    if (!parsed.valid || !parsed.number) {
        return {
            card: line,
            status: 'unknown',
            message: 'Invalid format'
        };
    }
    
    const cleanNumber = parsed.number.replace(/\D/g, '');
    
    const luhnValid = luhnCheck(cleanNumber);
    
    let expiryValid = true;
    if (parsed.month && parsed.year) {
        expiryValid = validateExpiry(parsed.month, parsed.year);
    }
    
    const cardType = detectCardType(cleanNumber);
    const binInfo = lookupBIN(cleanNumber);
    
    if (luhnValid && expiryValid) {
        return {
            card: line,
            status: 'live',
            message: 'Approved',
            details: {
                cardType,
                bank: binInfo?.bank || 'Unknown Bank',
                country: binInfo?.country || 'Unknown',
                emoji: binInfo?.emoji || '🌐',
                category: binInfo?.category || 'Unknown'
            }
        };
    } else if (!luhnValid) {
        return {
            card: line,
            status: 'die',
            message: 'Luhn check failed'
        };
    } else {
        return {
            card: line,
            status: 'die',
            message: 'Card expired'
        };
    }
}

// DOM Elements
const cardInput = document.getElementById('cardInput');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const liveCount = document.getElementById('liveCount');
const dieCount = document.getElementById('dieCount');
const unknownCount = document.getElementById('unknownCount');
const resultsSection = document.getElementById('resultsSection');
const resultsList = document.getElementById('resultsList');
const checkedCount = document.getElementById('checkedCount');

// State
let isChecking = false;
let results = [];

// Update stats display
function updateStats() {
    const live = results.filter(r => r.status === 'live').length;
    const die = results.filter(r => r.status === 'die').length;
    const unknown = results.filter(r => r.status === 'unknown').length;
    
    liveCount.textContent = live;
    dieCount.textContent = die;
    unknownCount.textContent = unknown;
}

// Mask card number
function maskCardNumber(number) {
    const clean = number.replace(/\D/g, '');
    if (clean.length <= 4) return clean;
    return '*'.repeat(clean.length - 4) + clean.slice(-4);
}

// Add result to display
function addResultToDisplay(result) {
    const item = document.createElement('div');
    item.className = `result-item ${result.status}`;
    
    const cardNumber = result.card.split('|')[0] || result.card;
    
    let detailsHtml = '';
    if (result.details) {
        detailsHtml = `
            <div class="card-details">
                <span>💳 ${result.details.cardType}</span>
                <span>🏦 ${result.details.bank}</span>
                <span>${result.details.emoji} ${result.details.country}</span>
                <span>📅 ${result.details.category}</span>
            </div>
        `;
    }
    
    item.innerHTML = `
        <div class="result-left">
            <div class="status-dot ${result.status}"></div>
            <div class="result-info">
                <div class="card-number">${maskCardNumber(cardNumber)}</div>
                ${detailsHtml}
            </div>
        </div>
        <div class="result-status ${result.status}">
            ${result.status === 'live' ? '✓ Live' : result.status === 'die' ? '✗ Die' : '? Unknown'}
        </div>
    `;
    
    resultsList.appendChild(item);
}

// Check cards
async function checkCards() {
    if (isChecking) return;
    
    const input = cardInput.value.trim();
    if (!input) return;
    
    isChecking = true;
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<span class="play-icon">⏸</span><span>Checking...</span>';
    
    results = [];
    resultsList.innerHTML = '';
    resultsSection.classList.remove('hidden');
    
    const lines = input.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const result = validateCard(line);
        results.push(result);
        
        addResultToDisplay(result);
        updateStats();
        checkedCount.textContent = `${results.length} cards checked`;
        
        resultsList.scrollTop = resultsList.scrollHeight;
        
        if (i < lines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    isChecking = false;
    checkBtn.disabled = false;
    checkBtn.innerHTML = '<span class="play-icon">▶</span><span>Start Check</span>';
}

// Clear all
function clearAll() {
    cardInput.value = '';
    results = [];
    resultsList.innerHTML = '';
    resultsSection.classList.add('hidden');
    updateStats();
}

// Event listeners
checkBtn.addEventListener('click', checkCards);
clearBtn.addEventListener('click', clearAll);

cardInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        checkCards();
    }
});

cardInput.addEventListener('input', () => {
    checkBtn.disabled = isChecking || !cardInput.value.trim();
});

// Initialize
checkBtn.disabled = true;
