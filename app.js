const firebaseConfig = {
    apiKey: "AIzaSyAvxon5UX3WOR2178vd4E0_oKNCCAE3EDo",
    authDomain: "fwo-project-8b52b.firebaseapp.com",
    projectId: "fwo-project-8b52b",
    storageBucket: "fwo-project-8b52b.firebasestorage.app",
    messagingSenderId: "915131259753",
    appId: "1:915131259753:web:216cbc6ba2a86bdf7dfbf8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let isAdmin = false;
let currentPage = 'home';

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            checkIfAdmin(user.uid);
            checkForNewMessages();
        } else {
            isAdmin = false;
        }
        updateAuthSection();
        showPage(currentPage);
    });
    setupModal();
});

function showPage(pageId) {
    currentPage = pageId;
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(pageId)) {
            link.classList.add('active');
        }
    });

    const content = document.getElementById('mainContent');
    
    if (pageId === 'home') content.innerHTML = getHomePage();
    else if (pageId === 'vpn') content.innerHTML = getVPNPage();
    else if (pageId === 'about') content.innerHTML = getAboutPage();
    else if (pageId === 'contact') content.innerHTML = getContactPage();
    else if (pageId === 'adminRequests') {
        if (!isAdmin) {
            showNotification('ACCESS DENIED');
            showPage('home');
            return;
        }
        content.innerHTML = getAdminRequestsPage();
        loadVPNRequests();
    }
}

function getHomePage() {
    return `
        <div class="page">
            <h1>FWO - FREEDOM WARRIORS ONLINE</h1>
            <p>WE ARE A GROUP OF SPECIALIZED INDIVIDUALS FIGHTING FOR FREEDOM ON THE INTERNET.</p>
            <p>STARTING NOW, WE WRITE THE HISTORY OF THE INTERNET.</p>
            <p>OUR MISSION IS TO PROVIDE ACCESS TO INFORMATION FOR EVERYONE, EVERYWHERE.</p>
            <p>NO CENSORSHIP. NO RESTRICTIONS. ONLY FREEDOM.</p>
            ${isAdmin ? `
                <div class="vpn-card">
                    <h3>ADMIN PANEL</h3>
                    <button class="vpn-btn" onclick="showPage('adminRequests')">VIEW VPN REQUESTS</button>
                </div>
            ` : ''}
        </div>
    `;
}

function getVPNPage() {
    if (!currentUser) {
        return `
            <div class="page">
                <h1>ACCESS DENIED</h1>
                <p>YOU MUST BE LOGGED IN TO REQUEST VPN ACCESS.</p>
                <p>PLEASE LOG IN OR REGISTER USING THE FORM ON THE LEFT.</p>
            </div>
        `;
    }
    return `
        <div class="page">
            <h1>FWO VPN</h1>
            <div class="vpn-card">
                <h3>FREEDOM TIER</h3>
                <p>6 MONTHS OF FREE AND SECURE VPN ACCESS</p>
                <div class="price">$0 - COMPLETELY FREE</div>
                <p>> NO LOGS POLICY</p>
                <p>> MILITARY-GRADE ENCRYPTION</p>
                <p>> ACCESS FROM ANYWHERE</p>
                <p>> 10 GBIT/S SERVERS</p>
                <button class="vpn-btn" onclick="showRequestForm()">REQUEST ACCESS</button>
            </div>
            <div id="requestForm" style="display: none;" class="request-form">
                <h2>SUBMIT YOUR REQUEST</h2>
                <form onsubmit="submitVPNRequest(event)">
                    <div class="form-group">
                        <label>YOUR COUNTRY:</label>
                        <input type="text" id="country" required>
                    </div>
                    <div class="form-group">
                        <label>WHY DO YOU NEED VPN ACCESS?</label>
                        <textarea id="reason" required></textarea>
                    </div>
                    <button type="submit" class="submit-btn">SUBMIT REQUEST</button>
                </form>
            </div>
        </div>
    `;
}

function getAboutPage() {
    return `
        <div class="page">
            <h1>ABOUT FWO</h1>
            <p>FWO (FREEDOM WARRIORS ONLINE) WAS FOUNDED IN 2026 WITH A SINGLE MISSION:</p>
            <p>TO PROVIDE UNRESTRICTED ACCESS TO INFORMATION FOR PEOPLE IN RESTRICTED REGIONS.</p>
            <p>WE BELIEVE THAT ACCESS TO INFORMATION IS A BASIC HUMAN RIGHT.</p>
            <p>OUR TEAM CONSISTS OF SECURITY EXPERTS, NETWORK ENGINEERS, AND FREEDOM ACTIVISTS.</p>
            <p>WE OPERATE 24/7 TO ENSURE THAT EVERYONE CAN ACCESS THE FREE INTERNET.</p>
        </div>
    `;
}

function getContactPage() {
    return `
        <div class="page">
            <h1>CONTACT US</h1>
            <p>FOR SECURITY REASONS, WE USE ONLY SECURE CHANNELS:</p>
            <p>> TG: @tg_fwo</p>
            <p>FOR VPN REQUESTS, PLEASE USE THE VPN PAGE.</p>
        </div>
    `;
}

function getAdminRequestsPage() {
    return `
        <div class="page">
            <h1>VPN REQUESTS - ADMIN PANEL</h1>
            <table class="requests-table">
                <thead>
                    <tr>
                        <th>USERNAME</th>
                        <th>COUNTRY</th>
                        <th>REASON</th>
                        <th>DATE</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody id="requestsTableBody">
                    <tr><td colspan="6">LOADING REQUESTS...</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function updateAuthSection() {
    const authSection = document.getElementById('authSection');
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).get().then((doc) => {
            const userData = doc.data();
            const username = userData?.username || currentUser.email;
            authSection.innerHTML = `
                <div style="margin-bottom: 10px;">
                    > LOGGED AS: ${username}<br>
                    > STATUS: ${isAdmin ? 'ADMIN' : 'USER'}
                </div>
                <button class="auth-btn" onclick="logout()">[LOGOUT]</button>
            `;
        }).catch(() => {
            authSection.innerHTML = `
                <div style="margin-bottom: 10px;">
                    > LOGGED AS: ${currentUser.email}<br>
                    > STATUS: ${isAdmin ? 'ADMIN' : 'USER'}
                </div>
                <button class="auth-btn" onclick="logout()">[LOGOUT]</button>
            `;
        });
    } else {
        authSection.innerHTML = `
            <input type="text" id="loginUsername" class="auth-input" placeholder="USERNAME">
            <input type="password" id="loginPassword" class="auth-input" placeholder="PASSWORD">
            <button class="auth-btn" onclick="login()">[LOGIN]</button>
            <button class="auth-btn" onclick="showRegister()">[REGISTER]</button>
            <div id="registerFields" style="display: none;">
                <input type="text" id="regUsername" class="auth-input" placeholder="USERNAME">
                <input type="password" id="regPassword" class="auth-input" placeholder="PASSWORD">
                <button class="auth-btn" onclick="register()">[CREATE ACCOUNT]</button>
            </div>
        `;
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes('adminRequests')) {
            link.remove();
        }
    });

    if (isAdmin) {
        const navLinks = document.querySelector('.nav-links');
        const adminLink = document.createElement('a');
        adminLink.href = '#';
        adminLink.className = 'nav-link';
        adminLink.setAttribute('onclick', 'showPage(\'adminRequests\')');
        adminLink.textContent = '[ADMIN PANEL]';
        navLinks.appendChild(adminLink);
    }
}

function showRegister() {
    document.getElementById('registerFields').style.display = 'block';
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showNotification('PLEASE ENTER USERNAME AND PASSWORD');
        return;
    }
    
    try {
        const email = `${username.toLowerCase()}@fwo.local`;
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('LOGIN SUCCESSFUL');
    } catch (error) {
        showNotification('ERROR: ' + error.message);
    }
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    
    if (!username || !password) {
        showNotification('PLEASE FILL ALL FIELDS');
        return;
    }
    
    try {
        const email = `${username.toLowerCase()}@fwo.local`;
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            isAdmin: false,
            createdAt: new Date()
        });
        
        showNotification('REGISTRATION SUCCESSFUL');
    } catch (error) {
        showNotification('ERROR: ' + error.message);
    }
}

async function logout() {
    await auth.signOut();
    showPage('home');
}

async function checkIfAdmin(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        isAdmin = doc.data()?.isAdmin === true;
    } catch (error) {
        isAdmin = false;
    }
}

function showRequestForm() {
    document.getElementById('requestForm').style.display = 'block';
}

async function submitVPNRequest(event) {
    event.preventDefault();
    
    const country = document.getElementById('country').value;
    const reason = document.getElementById('reason').value;
    
    if (!country || !reason) {
        showNotification('PLEASE FILL ALL FIELDS');
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const username = userDoc.data()?.username || currentUser.email;
        
        await db.collection('vpn_requests').add({
            userId: currentUser.uid,
            username: username,
            country: country,
            reason: reason,
            status: 'pending',
            adminResponse: null,
            createdAt: new Date()
        });
        
        showNotification('REQUEST SUBMITTED SUCCESSFULLY');
        document.getElementById('requestForm').style.display = 'none';
        document.getElementById('country').value = '';
        document.getElementById('reason').value = '';
    } catch (error) {
        showNotification('ERROR: ' + error.message);
    }
}

async function loadVPNRequests() {
    try {
        const snapshot = await db.collection('vpn_requests').orderBy('createdAt', 'desc').get();
        const tableBody = document.getElementById('requestsTableBody');
        let html = '';
        
        if (snapshot.empty) {
            html = '<tr><td colspan="6">NO REQUESTS FOUND</td></tr>';
        } else {
            snapshot.forEach(doc => {
                const r = doc.data();
                html += `
                    <tr>
                        <td><strong>${r.username || 'Unknown'}</strong></td>
                        <td>${r.country || 'Unknown'}</td>
                        <td>${r.reason || ''}</td>
                        <td>${r.createdAt ? r.createdAt.toDate().toLocaleString() : 'Unknown'}</td>
                        <td>${r.status === 'pending' ? '⏳ PENDING' : '✅ ANSWERED'}</td>
                        <td>
                            ${r.status === 'pending' ? `
                                <input type="text" id="response-${doc.id}" class="admin-response-input" placeholder="RESPONSE">
                                <button class="admin-response-btn" onclick="respondToRequest('${doc.id}')">SEND</button>
                            ` : r.adminResponse || 'Done'}
                        </td>
                    </tr>
                `;
            });
        }
        tableBody.innerHTML = html;
    } catch (error) {
        showNotification('ERROR LOADING REQUESTS');
    }
}

async function respondToRequest(requestId) {
    const response = document.getElementById(`response-${requestId}`).value;
    if (!response) {
        showNotification('ENTER RESPONSE');
        return;
    }
    
    try {
        const requestDoc = await db.collection('vpn_requests').doc(requestId).get();
        const requestData = requestDoc.data();
        
        await db.collection('vpn_requests').doc(requestId).update({
            status: 'answered',
            adminResponse: response,
            respondedAt: new Date()
        });
        
        await db.collection('admin_messages').add({
            userId: requestData.userId,
            message: `YOUR VPN REQUEST HAS BEEN PROCESSED.\n\nADMIN RESPONSE: ${response}`,
            read: false,
            createdAt: new Date()
        });
        
        showNotification('RESPONSE SENT');
        loadVPNRequests();
    } catch (error) {
        showNotification('ERROR: ' + error.message);
    }
}

async function checkForNewMessages() {
    if (!currentUser) return;
    try {
        const snapshot = await db.collection('admin_messages')
            .where('userId', '==', currentUser.uid)
            .where('read', '==', false)
            .get();
        if (!snapshot.empty) showMessageBadge(snapshot.size);
    } catch (error) {}
}

function showMessageBadge(count) {
    const old = document.querySelector('.message-badge');
    if (old) old.remove();
    
    const badge = document.createElement('div');
    badge.className = 'message-badge';
    badge.innerHTML = `[${count} NEW MESSAGE${count > 1 ? 'S' : ''}]`;
    badge.onclick = showMessages;
    document.body.appendChild(badge);
}

async function showMessages() {
    try {
        const snapshot = await db.collection('admin_messages')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        let messages = '';
        snapshot.forEach(doc => {
            const msg = doc.data();
            messages += `
                <div style="border-bottom:1px solid #333;padding:10px;">
                    <small>${msg.createdAt ? msg.createdAt.toDate().toLocaleString() : ''}</small>
                    <p style="white-space:pre-line">${msg.message}</p>
                </div>
            `;
            db.collection('admin_messages').doc(doc.id).update({ read: true });
        });
        
        showModal('YOUR MESSAGES', messages || '<p>NO MESSAGES</p>');
        const badge = document.querySelector('.message-badge');
        if (badge) badge.remove();
    } catch (error) {}
}

function setupModal() {
    const modal = document.getElementById('messageModal');
    const span = document.querySelector('.close');
    span.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };
}

function showModal(title, content) {
    const modal = document.getElementById('messageModal');
    document.getElementById('modalBody').innerHTML = `<h2>${title}</h2>${content}`;
    modal.style.display = 'block';
}

function showNotification(message) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}
