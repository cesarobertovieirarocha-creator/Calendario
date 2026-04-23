const users = {
    sigma: {
        'rerisson.moura': { pass: 'sigma123', avatar: 'https://i.pravatar.cc/150?u=rerisson' },
        'isabela.rodrigues': { pass: 'sigma456', avatar: 'https://i.pravatar.cc/150?u=isabela' },
        'cesar.roberto': { pass: 'sigma789', avatar: 'https://i.pravatar.cc/150?u=cesar' }
    },
    mondelez: {
        'maria.eduarda': { pass: 'mondelez123', avatar: 'https://i.pravatar.cc/150?u=maria' },
        'gabriel.moura': { pass: 'mondelez456', avatar: 'https://i.pravatar.cc/150?u=gabriel' },
        'rerisson.moura': { pass: 'mondelez789', avatar: 'https://i.pravatar.cc/150?u=rerisson' }
    }
};

const eisenhower = {
    'do': 'matrix-do',
    'schedule': 'matrix-schedule',
    'delegate': 'matrix-delegate',
    'eliminate': 'matrix-eliminate'
};

const brandNames = {
    'brand-nivea': 'Nivea',
    'brand-rayovac': 'Rayovac',
    'brand-reckitt': 'Reckitt',
    'brand-vestacy': 'Vestacy',
    'brand-kimberly': 'Kimberly-Clark',
    'brand-diageo': 'Diageo',
    'brand-vct': 'VCT',
    'brand-bic': 'BIC',
    'brand-cargill': 'Cargill',
    'brand-haleon': 'Haleon',
    'brand-Operacional': 'Operacional'
};

let currentDate = new Date();
let selectedDate = new Date();

// Dados de exemplo iniciais se o localStorage estiver vazio
const defaultEvents = {
    4: [ // Abril
        { day: 5, industry: 'brand-nivea', matrix: 'do', title: 'Campanha Nivea' },
        { day: 12, industry: 'brand-cargill', matrix: 'schedule', title: 'Planejamento Cargill' },
        { day: 18, industry: 'brand-reckitt', matrix: 'delegate', title: 'Distribuição Reckitt' }
    ]
};

// Carregar do localStorage ou usar padrão
let eventsData = JSON.parse(localStorage.getItem('eisenhowerEvents')) || defaultEvents;

function saveEvents() {
    localStorage.setItem('eisenhowerEvents', JSON.stringify(eventsData));
}

const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function generateCalendar(date) {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    calendar.innerHTML = '';

    // Pegar valores dos filtros
    const filterIndustry = document.getElementById('filterIndustry')?.value || 'all';
    const filterMatrix = document.getElementById('filterMatrix')?.value || 'all';

    // Headers dos dias da semana
    daysOfWeek.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    // Primeiro dia do mês
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Pegar eventos do mês atual
    const monthKey = date.getMonth() + 1;
    const monthEvents = eventsData[monthKey] || [];

    // Gerar células do calendário
    for (let i = 0; i < 42; i++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';

        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + i);

        const dayNumber = cellDate.getDate();
        const isCurrentMonth = cellDate.getMonth() === date.getMonth();
        const isToday = cellDate.toDateString() === new Date().toDateString();

        const dayNumSpan = document.createElement('span');
        dayNumSpan.className = 'day-number';
        dayNumSpan.textContent = dayNumber;
        cell.appendChild(dayNumSpan);

        // Destacar hoje
        if (isToday) {
            cell.classList.add('today');
        }

        // Mostrar eventos apenas do mês atual
        if (isCurrentMonth) {
            // Filtrar eventos para o dia específico (respeitando filtros globais)
            const dayEvents = monthEvents.filter(event => {
                const matchesDay = event.day === dayNumber;
                const matchesIndustry = filterIndustry === 'all' || event.industry === filterIndustry;
                const matchesMatrix = filterMatrix === 'all' || event.matrix === filterMatrix;
                return matchesDay && matchesIndustry && matchesMatrix;
            });

            if (dayEvents.length > 0) {
                dayEvents.slice(0, 3).forEach((event, index) => {
                    const eventSpan = document.createElement('span');
                    eventSpan.className = `event ${event.industry} ${eisenhower[event.matrix] || ''}`;
                    eventSpan.title = event.title;
                    eventSpan.textContent = event.title.substring(0, 15) + (event.title.length > 15 ? '...' : '');

                    const delBtn = document.createElement('span');
                    delBtn.className = 'delete-event';
                    delBtn.innerHTML = '&times;';
                    delBtn.onclick = (e) => {
                        e.stopPropagation();
                        deleteEvent(monthKey, event.day, index);
                    };
                    eventSpan.appendChild(delBtn);

                    cell.appendChild(eventSpan);
                });
            } else {
                const noEvents = document.createElement('span');
                noEvents.className = 'no-events';
                noEvents.textContent = 'Sem eventos';
                cell.appendChild(noEvents);
            }
        }

        cell.addEventListener('click', () => {
            if (isCurrentMonth) {
                openModal(dayNumber, date.getMonth());
            }
        });

        calendar.appendChild(cell);
    }

    // Atualizar header
    const formattedDate = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const headerTitle = document.querySelector('.header h1');
    if (headerTitle) {
        headerTitle.textContent = `📊 Matriz - ${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}`;
    }

    // Atualizar o input de mês
    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        monthFilter.value = `${year}-${month}`;
    }
}

function applyFilters() {
    generateCalendar(currentDate);
}

// Lógica do Modal de Evento
function openModal(day, month) {
    document.getElementById('eventModal').style.display = 'block';
    document.getElementById('eventDate').value = `${day}-${month + 1}`;
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventTitle').focus();
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}

// Lógica do Modal de Resumo
function openSummary() {
    const modal = document.getElementById('summaryModal');
    const list = document.getElementById('summaryList');
    if (!modal || !list) return;

    modal.style.display = 'block';
    list.innerHTML = '';

    // Filtros internos do modal
    const filterIndustry = document.getElementById('summaryFilterIndustry')?.value || 'all';
    const filterMatrix = document.getElementById('summaryFilterMatrix')?.value || 'all';

    let allFilteredEvents = [];

    // Percorrer todos os meses nos dados para ver TODAS as atividades
    Object.keys(eventsData).forEach(monthKey => {
        const month = parseInt(monthKey);
        eventsData[monthKey].forEach(event => {
            // Filtros de categoria
            const matchesIndustry = filterIndustry === 'all' || event.industry === filterIndustry;
            const matchesMatrix = filterMatrix === 'all' || event.matrix === filterMatrix;

            if (matchesIndustry && matchesMatrix) {
                allFilteredEvents.push({ ...event, month });
            }
        });
    });

    // Ordenar por mês e dia
    allFilteredEvents.sort((a, b) => (a.month * 100 + a.day) - (b.month * 100 + b.day));

    if (allFilteredEvents.length === 0) {
        list.innerHTML = '<div class="summary-empty">Nenhuma atividade encontrada com estes filtros.</div>';
    } else {
        allFilteredEvents.forEach(event => {
            const item = document.createElement('div');
            item.className = 'summary-item';

            const monthName = new Date(2026, event.month - 1).toLocaleDateString('pt-BR', { month: 'long' });

            item.innerHTML = `
                <div class="summary-item-info">
                    <span class="summary-item-date">${event.day} de ${monthName}</span>
                    <span class="summary-item-title">${event.title}</span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="summary-item-brand ${event.industry}">${brandNames[event.industry] || 'Marca'}</span>
                    <div class="legend-color" style="background: ${getMatrixColor(event.matrix)}; width: 12px; height: 12px; border-radius: 3px;"></div>
                </div>
            `;
            list.appendChild(item);
        });
    }
}

function getMatrixColor(matrix) {
    const colors = { 'do': '#ef4444', 'schedule': '#3b82f6', 'delegate': '#f59e0b', 'eliminate': '#94a3b8' };
    return colors[matrix] || '#fff';
}

function closeSummary() {
    document.getElementById('summaryModal').style.display = 'none';
}

window.onclick = function (event) {
    const eventModal = document.getElementById('eventModal');
    const summaryModal = document.getElementById('summaryModal');
    if (event.target == eventModal) closeModal();
    if (event.target == summaryModal) closeSummary();
}

document.getElementById('eventForm').onsubmit = function (e) {
    e.preventDefault();
    const [day, month] = document.getElementById('eventDate').value.split('-').map(Number);
    const title = document.getElementById('eventTitle').value;
    const industry = document.getElementById('eventIndustry').value;
    const matrix = document.getElementById('eventMatrix').value;

    if (!eventsData[month]) {
        eventsData[month] = [];
    }

    eventsData[month].push({ day, industry, matrix, title });
    saveEvents();
    generateCalendar(currentDate);
    closeModal();
};

function deleteEvent(month, day, index) {
    if (confirm('Deseja eliminar este evento?')) {
        const key = month;
        if (eventsData[key]) {
            const filterIndustry = document.getElementById('filterIndustry')?.value || 'all';
            const filterMatrix = document.getElementById('filterMatrix')?.value || 'all';

            const filteredDayEvents = eventsData[key].filter(event => {
                const matchesDay = event.day === day;
                const matchesIndustry = filterIndustry === 'all' || event.industry === filterIndustry;
                const matchesMatrix = filterMatrix === 'all' || event.matrix === filterMatrix;
                return matchesDay && matchesIndustry && matchesMatrix;
            });

            const eventToRemove = filteredDayEvents[index];

            if (eventToRemove) {
                const globalIndex = eventsData[key].indexOf(eventToRemove);
                if (globalIndex > -1) {
                    eventsData[key].splice(globalIndex, 1);
                    saveEvents();
                    generateCalendar(currentDate);
                }
            }
        }
    }
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar(currentDate);
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar(currentDate);
}

function goToToday() {
    currentDate = new Date();
    generateCalendar(currentDate);
}

function filterByMonth(value) {
    if (!value) return;
    const [year, month] = value.split('-');
    currentDate = new Date(year, parseInt(month) - 1, 1);
    generateCalendar(currentDate);
}

// Lógica de Autenticação
function checkSession() {
    const session = JSON.parse(localStorage.getItem('eisenhowerSession'));
    if (session) {
        showMainContent(session.username, session.division);
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('main-container').style.display = 'none';
    }
}

function showMainContent(username, division) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';

    const userData = users[division][username];
    const displayName = username.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const userSpan = document.getElementById('loggedUser');
    if (userSpan) userSpan.textContent = displayName;

    const avatarImg = document.getElementById('userAvatar');
    if (avatarImg && userData && userData.avatar) {
        avatarImg.src = userData.avatar;
    }

    const title = document.getElementById('mainTitle');
    if (title) title.textContent = `EQUIPE ${division.toUpperCase()}`;

    generateCalendar(currentDate);
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.onsubmit = function (e) {
        e.preventDefault();
        const division = document.getElementById('loginDivision').value;
        const user = document.getElementById('username').value.toLowerCase();
        const pass = document.getElementById('password').value;
        const errorMsg = document.getElementById('loginError');

        if (users[division] && users[division][user] && users[division][user].pass === pass) {
            const session = { username: user, division: division };
            localStorage.setItem('eisenhowerSession', JSON.stringify(session));
            showMainContent(user, division);
            errorMsg.textContent = '';
        } else {
            errorMsg.textContent = 'Usuário ou senha incorretos para esta divisão.';
        }
    };
}

function logout() {
    localStorage.removeItem('eisenhowerSession');
    location.reload();
}

// Inicializar verificação
checkSession();