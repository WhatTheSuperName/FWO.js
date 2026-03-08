// ==================== FIREBASE КОНФИГУРАЦИЯ ====================
// ВСТАВЬ СВОИ ДАННЫЕ ИЗ FIREBASE КОНСОЛИ!!!
const firebaseConfig = {
    apiKey: "ВСТАВЬТЕ_СВОЙ_API_KEY",
    authDomain: "ВСТАВЬТЕ_СВОЙ_AUTH_DOMAIN",
    projectId: "ВСТАВЬТЕ_СВОЙ_PROJECT_ID",
    storageBucket: "ВСТАВЬТЕ_СВОЙ_STORAGE_BUCKET",
    messagingSenderId: "ВСТАВЬТЕ_СВОЙ_MESSAGING_SENDER_ID",
    appId: "ВСТАВЬТЕ_СВОЙ_APP_ID"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentUser = null;
let isAdmin = false;
let currentPage = 'home';

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем состояние авторизации
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        updateAuthSection();
        
        if (user) {
            // Проверяем, является ли пользователь админом
            await checkIfAdmin(user.uid);
            // Проверяем новые сообщения
            checkForNewMessages();
        } else {
            isAdmin = false;
        }
        
        showPage(currentPage);
    });

    // Настройка модального окна
    setupModal();
});

// ==================== НАВИГАЦИЯ ====================
function showPage(pageId) {
    currentPage = pageId;
    
    // Обновляем активную ссылку
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick').includes(pageId)) {
            link.classList.add('active');
        }
    });

    const content = document.getElementById('mainContent');
    
    switch(pageId) {
        case 'home':
            content.innerHTML = getHomePage();
            break;
        case 'vpn':
            content.innerHTML = getVPNPage();
            break;
        case 'about':
            content.innerHTML = getAboutPage();
            break;
        case 'contact':
            content.innerHTML = getContactPage();
            break;
    }
}

// ==================== СТРАНИЦЫ ====================
function getHomePage() {
    return `
        <div class="page">
            <h1>FWO - FREEDOM WARRIORS ONLINE</h1>
            <div class="status-message">
                > SYSTEM STATUS: ONLINE
                > ENCRYPTION: ACTIVE
                > NETWORK: SECURE
            </div>
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
            <p>FWO (FREEDOM WARRIORS ONLINE) WAS FOUNDED IN 2024 WITH A SINGLE MISSION:</p>
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
            <p>FOR SECURITY REASONS, WE DO NOT USE TRADITIONAL CONTACT METHODS.</p>
            <p>IF YOU NEED TO REACH US:</p>
            <p>> MATRIX: @fwo:matrix.org</p>
            <p>> SESSION: 0542f8e3a1b9c7d4e6f8a2b0c3d5e7f9</p>
            <p>> XMPP: fwo@jabber.org</p>
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
                        <th>USER</th>
                        <th>COUNTRY</th>
                        <th>REASON</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody id="requestsTableBody">
                    <tr><td colspan="5">LOADING REQUESTS...</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// ==================== ФУНКЦИИ АВТОРИЗАЦИИ ====================
function updateAuthSection() {
    const authSection = document.getElementById('authSection');
    
    if (currentUser) {
        authSection.innerHTML = `
            <div style="margin-bottom: 10px;">
                > LOGGED AS: ${currentUser.email}<br>
                ${isAdmin ? '> STATUS: ADMIN' : '> STATUS: USER'}
            </div>
            <button class="auth-btn" onclick="logout()">[LOGOUT]</button>
        `;
    } else {
        authSection.innerHTML = `
            <input type="email" id="loginEmail" class="auth-input" placeholder="EMAIL" autocomplete="off">
            <input type="password" id="loginPassword" class="auth-input" placeholder="PASSWORD">
            <button class="auth-btn" onclick="login()">[LOGIN]</button>
            <button class="auth-btn" onclick="showRegister()">[REGISTER]</button>
            <div id="registerFields" style="display: none;">
                <input type="text" id="regUsername" class="auth-input" placeholder="USERNAME">
                <input type="email" id="regEmail" class="auth-input" placeholder="EMAIL">
                <input type="password" id="regPassword" class="auth-input" placeholder="PASSWORD">
                <button class="auth-btn" onclick="register()">[CREATE ACCOUNT]</button>
            </div>
        `;
    }
}

function showRegister() {
    document.getElementById('registerFields').style.display = 'block';
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('LOGIN SUCCESSFUL');
    } catch (error) {
        showNotification('ERROR: ' + error.message);
    }
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    if (!username || !email || !password) {
        showNotification('PLEASE FILL ALL FIELDS');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Сохраняем имя пользователя в Firestore
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
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

// ==================== ПРОВЕРКА АДМИНА ====================
async function checkIfAdmin(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        isAdmin = userDoc.data()?.isAdmin === true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        isAdmin = false;
    }
}

// ==================== ФУНКЦИИ ДЛЯ VPN ====================
function showRequestForm() {
    document.getElementById('requestForm').style.display = 'block';
}

async function submitVPNRequest(event) {
    event.preventDefault();
    
    const country = document.getElementById('country').value;
    const reason = document.getElementById('reason').value;
    
    try {
        // Получаем username пользователя
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const username = userDoc.data()?.username || currentUser.email;
        
        // Сохраняем заявку
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

// ==================== АДМИН ФУНКЦИИ ====================
async function loadVPNRequests() {
    try {
        const snapshot = await db.collection('vpn_requests')
            .orderBy('createdAt', 'desc')
            .get();
        
        const tableBody = document.getElementById('requestsTableBody');
        let html = '';
        
        snapshot.forEach(doc => {
            const request = doc.data();
            const requestId = doc.id;
            
            html += `
                <tr>
                    <td>${request.username}</td>
                    <td>${request.country}</td>
                    <td>${request.reason}</td>
                    <td>${request.status}</td>
                    <td>
                        ${request.status === 'pending' ? `
                            <input type="text" id="response-${requestId}" class="admin-response-input" placeholder="YOUR RESPONSE">
                            <button class="admin-response-btn" onclick="respondToRequest('${requestId}')">SEND</button>
                        ` : request.adminResponse || 'NO RESPONSE'}
                    </td>
                </tr>
            `;
        });
        
        if (html === '') {
            html = '<tr><td colspan="5">NO REQUESTS FOUND</td></tr>';
        }
        
        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

async function respondToRequest(requestId) {
    const response = document.getElementById(`response-${requestId}`).value;
    
    if (!response) {
        showNotification('PLEASE ENTER A RESPONSE');
        return;
    }
    
    try {
        // Получаем информацию о заявке
        const requestDoc = await db.collection('vpn_requests').doc(requestId).get();
        const requestData = requestDoc.data();
        
        // Обновляем статус заявки
        await db.collection('vpn_requests').doc(requestId).update({
            status: 'answered',
            adminResponse: response,
            respondedAt: new Date()
        });
        
        // Отправляем сообщение пользователю
        await db.collection('admin_messages').add({
            userId: requestData.userId,
            message: `YOUR VPN REQUEST HAS BEEN PROCESSED.\nADMIN RESPONSE: ${response}`,
            read: false,
            createdAt: new Date()
        });
        
        showNotification('RESPONSE SENT TO USER');
        loadVPNRequests(); // Перезагружаем таблицу
    } catch (error) {
        showNotification('ERROR: ' + error.message);
    }
}

// ==================== ПРОВЕРКА НОВЫХ СООБЩЕНИЙ ====================
async function checkForNewMessages() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('admin_messages')
            .where('userId', '==', currentUser.uid)
            .where('read', '==', false)
            .get();
        
        if (!snapshot.empty) {
            showMessageBadge(snapshot.size);
        }
    } catch (error) {
        console.error('Error checking messages:', error);
    }
}

function showMessageBadge(count) {
    // Удаляем старый бейдж, если есть
    const oldBadge = document.querySelector('.message-badge');
    if (oldBadge) oldBadge.remove();
    
    // Создаем новый бейдж
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
                <div style="border-bottom: 1px solid #333; padding: 10px;">
                    <small>${msg.createdAt.toDate().toLocaleString()}</small>
                    <p>${msg.message}</p>
                </div>
            `;
            
            // Отмечаем как прочитанное
            db.collection('admin_messages').doc(doc.id).update({ read: true });
        });
        
        // Показываем в модальном окне
        showModal('YOUR MESSAGES', messages);
        
        // Удаляем бейдж
        const badge = document.querySelector('.message-badge');
        if (badge) badge.remove();
    } catch (error) {
        showNotification('ERROR LOADING MESSAGES');
    }
}

// ==================== МОДАЛЬНОЕ ОКНО ====================
function setupModal() {
    const modal = document.getElementById('messageModal');
    const span = document.getElementsByClassName('close')[0];
    
    span.onclick = function() {
        modal.style.display = 'none';
    };
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

function showModal(title, content) {
    const modal = document.getElementById('messageModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h2>${title}</h2>
        ${content}
    `;
    
    modal.style.display = 'block';
}

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==================== ПЕРЕХВАТЧИК СТРАНИЦ ДЛЯ АДМИНА ====================
// Расширяем функцию showPage для обработки админской страницы
const originalShowPage = showPage;
showPage = function(pageId) {
    if (pageId === 'adminRequests') {
        if (!isAdmin) {
            showNotification('ACCESS DENIED');
            return;
        }
        
        document.getElementById('mainContent').innerHTML = getAdminRequestsPage();
        loadVPNRequests();
        
        // Обновляем активную ссылку
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
    } else {
        originalShowPage(pageId);
    }
};

// Добавляем обработку страницы adminRequests в навигацию
// Добавим ссылку в меню, если пользователь админ
const originalUpdateAuthSection = updateAuthSection;
updateAuthSection = function() {
    originalUpdateAuthSection();
    
    if (isAdmin) {
        // Добавляем ссылку на админку в меню
        const navLinks = document.querySelector('.nav-links');
        if (!document.querySelector('[onclick="showPage(\'adminRequests\')"]')) {
            const adminLink = document.createElement('a');
            adminLink.href = '#';
            adminLink.className = 'nav-link';
            adminLink.setAttribute('onclick', 'showPage(\'adminRequests\')');
            adminLink.textContent = '[ADMIN PANEL]';
            navLinks.appendChild(adminLink);
        }
    }
};
