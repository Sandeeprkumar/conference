document.addEventListener('DOMContentLoaded', function() {
    // Schedule page logic (runs only if schedule tabs exist)
    var scheduleTabs = document.querySelector('.schedule-tabs');
    if (scheduleTabs) {
        fetch('data/schedule.json')
            .then(function(resp) {
                return resp.json();
            })
            .then(function(json) {
                window.scheduleData = json;
                renderSchedule('day1');
                var defaultTab = document.getElementById('tab-day1');
                if (defaultTab) defaultTab.classList.add('active');
            });
        var tabDay1 = document.getElementById('tab-day1');
        var tabDay2 = document.getElementById('tab-day2');
        if (tabDay1) {
            tabDay1.addEventListener('click', function() {
                renderSchedule('day1');
                tabDay1.classList.add('active');
                if (tabDay2) tabDay2.classList.remove('active');
            });
        }
        if (tabDay2) {
            tabDay2.addEventListener('click', function() {
                renderSchedule('day2');
                tabDay2.classList.add('active');
                if (tabDay1) tabDay1.classList.remove('active');
            });
        }
    }
    // Registration page logic: compute payable amount from category and nationality
    var regTypeSelect = document.getElementById('registration-type');
    var nationalitySelect = document.getElementById('nationality');
    if (regTypeSelect && nationalitySelect) {
        updateRegistrationAmount();
        regTypeSelect.addEventListener('change', updateRegistrationAmount);
        nationalitySelect.addEventListener('change', updateRegistrationAmount);
        var regForm = document.getElementById('registration-form');
        var regAlert = document.getElementById('registration-alert');
        if (regForm) {
            regForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var formData = new FormData(regForm);
                fetch('submit_registration.php', {
                    method: 'POST',
                    body: formData
                }).then(function(response) {
                    return response.json();
                }).then(function(data) {
                    if (data.status === 'success') {
                        regAlert.className = 'alert alert-success';
                        regAlert.textContent = data.message;
                        regForm.reset();
                        updateRegistrationAmount();
                    } else {
                        regAlert.className = 'alert alert-error';
                        regAlert.textContent = data.message || 'There was an error submitting your registration.';
                    }
                }).catch(function() {
                    regAlert.className = 'alert alert-error';
                    regAlert.textContent = 'Network error: please try again later.';
                });
            });
        }
    }
    // Paper submission page logic
    var paperForm = document.getElementById('paper-form');
    var paperAlert = document.getElementById('paper-alert');
    if (paperForm && paperAlert) {
        paperForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(paperForm);
            fetch('submit_paper.php', {
                    method: 'POST',
                    body: formData
                }).then(function(resp) {
                    return resp.json();
                })
                .then(function(data) {
                    if (data.status === 'success') {
                        paperAlert.className = 'alert alert-success';
                        paperAlert.textContent = data.message;
                        paperForm.reset();
                    } else {
                        paperAlert.className = 'alert alert-error';
                        paperAlert.textContent = data.message || 'There was an error submitting your paper.';
                    }
                }).catch(function() {
                    paperAlert.className = 'alert alert-error';
                    paperAlert.textContent = 'Network error: please try again later.';
                });
        });
    }
    // Contact form logic
    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
        var contactAlert = document.getElementById('contact-alert');
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(contactForm);
            fetch('contact_submit.php', {
                    method: 'POST',
                    body: formData
                }).then(function(resp) {
                    return resp.json();
                })
                .then(function(data) {
                    if (data.status === 'success') {
                        contactAlert.className = 'alert alert-success';
                        contactAlert.textContent = data.message;
                        contactForm.reset();
                    } else {
                        contactAlert.className = 'alert alert-error';
                        contactAlert.textContent = data.message || 'There was an error sending your message.';
                    }
                }).catch(function() {
                    contactAlert.className = 'alert alert-error';
                    contactAlert.textContent = 'Network error: please try again later.';
                });
        });
    }
    // Mobile navigation toggle
    var menuToggle = document.getElementById('menu-toggle');
    var siteHeader = document.querySelector('.site-header');
    if (menuToggle && siteHeader) {
        menuToggle.addEventListener('click', function() {
            siteHeader.classList.toggle('nav-open');
        });
    }
});

/**
 * Render the schedule table for the given day key.
 * Populates the table body and the schedule title.
 *
 * @param {string} dayKey - either 'day1' or 'day2'
 */
function renderSchedule(dayKey) {
    var scheduleTableBody = document.getElementById('schedule-body');
    var scheduleTitle = document.getElementById('schedule-title');
    if (!scheduleTableBody || !scheduleTitle || !window.scheduleData) return;
    var dayData = window.scheduleData[dayKey];
    scheduleTitle.textContent = dayData.title;
    // Clear existing rows
    scheduleTableBody.innerHTML = '';
    dayData.sessions.forEach(function(session) {
        var row = document.createElement('tr');
        var timeCell = document.createElement('td');
        timeCell.textContent = session.start + ' – ' + session.end;
        var titleCell = document.createElement('td');
        titleCell.textContent = session.title;
        var trackCell = document.createElement('td');
        trackCell.textContent = session.track;
        row.appendChild(timeCell);
        row.appendChild(titleCell);
        row.appendChild(trackCell);
        scheduleTableBody.appendChild(row);
    });
}

 
function updateRegistrationAmount() {
    var typeSelect = document.getElementById('registration-type');
    var nationalitySelect = document.getElementById('nationality');
    var amountField = document.getElementById('amount-payable');
    var cutoffInput = document.getElementById('registration-cutoff');
    if (!typeSelect || !nationalitySelect || !amountField) return;
    var selectedOption = typeSelect.options[typeSelect.selectedIndex];
    var isIndian = (nationalitySelect.value === 'Indian');
    var fee;
    if (isIndian) {
        // Determine whether to use early or late fee based on the cut-off date
        var cutoffDateStr = cutoffInput ? cutoffInput.value : '';
        var feeEarly = selectedOption.getAttribute('data-fee-indian-early');
        var feeLate = selectedOption.getAttribute('data-fee-indian-late');
        // Default to early fee if parsing fails
        fee = feeEarly;
        if (cutoffDateStr) {
            try {
                var cutoffDate = new Date(cutoffDateStr);
                var today = new Date();
                // Compare only the date portion (ignore time) by zeroing hours
                var todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                var cutoffMid = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth(), cutoffDate.getDate());
                if (todayMid > cutoffMid && feeLate) {
                    fee = feeLate;
                }
            } catch (e) {
                // If error, keep early fee
                fee = feeEarly;
            }
        }
    } else {
        fee = selectedOption.getAttribute('data-fee-usd');
    }
    if (!fee) fee = 0;
    var currency = isIndian ? '₹' : '$';
    amountField.value = currency + fee;

    // Update payment instructions based on nationality
    var paymentDetails = document.getElementById('payment-details');
    if (paymentDetails) {
        var nationality = nationalitySelect.value;
        var instructions = '';
        // Payment instructions for Indian participants
        if (nationality === 'Indian') {
            // Provide UPI payment details
            instructions += '<h4>Payment Instructions</h4>';
            instructions += '<p>Please make the payment via UPI to the following ID:</p>';
            instructions += '<p><strong>UPI ID:</strong> yespay.bizsbiz34561@yesbankltd</p>';
            instructions += '<p>After payment, upload the payment proof below.</p>';
        } else if (nationality === 'International') {
            // Provide bank transfer details for international participants
            instructions += '<h4>Payment Instructions</h4>';
            instructions += '<p>Please make a bank transfer using the details below:</p>';
            instructions += '<ul>';
            instructions += '<li><strong>Bank Name:</strong> Yes Bank</li>';
            instructions += '<li><strong>Account Name:</strong> Ganitara Research Foundation Bank</li>';
            instructions += '<li><strong>Account Number:</strong> 063461900003536</li>';
            instructions += '<li><strong>IFSC Code:</strong> YESB0000634</li>';
            instructions += '<li><strong>SWIFT Code:</strong> YESBINBB</li>';
            instructions += '<li><strong>Bank Address:</strong> Haryana, India</li>';
            instructions += '</ul>';
            instructions += '<p>After payment, upload the payment proof below.</p>';
        }
        if (instructions) {
            paymentDetails.innerHTML = instructions;
            paymentDetails.style.display = 'block';
        } else {
            paymentDetails.innerHTML = '';
            paymentDetails.style.display = 'none';
        }
    }
}

// Copy UPI ID to clipboard
function copyUPI() {
    const upiId = 'yespay.bizsbiz34561@yesbankltd';
    navigator.clipboard.writeText(upiId).then(() => {
        const btn = document.querySelector('.btn-copy');
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = 'Copy';
        }, 2000);
    });
}

// Calculate registration fee based on type and nationality
document.getElementById('regType')?.addEventListener('change', calculateFee);
document.getElementById('nationality')?.addEventListener('change', calculateFee);

function calculateFee() {
    const type = document.getElementById('regType').value;
    const nationality = document.getElementById('nationality').value;
    const amountField = document.getElementById('amount');
    
    if (!type || !nationality) {
        amountField.value = '';
        return;
    }

    const fees = {
        student: { indian: '₹2,100', international: '$30' },
        academic: { indian: '₹2,600', international: '$40' },
        industry: { indian: '₹2,600', international: '$40' },
        delegate: { indian: '₹900', international: '$20' }
    };

    amountField.value = fees[type][nationality];
}