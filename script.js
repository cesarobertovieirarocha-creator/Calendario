const users = {
    sigma: {
        'rerisson.moura': { pass: 'Rerisson@2026!', avatar: 'Imagens/Rerisson.jpg' },
        'isabela.rodrigues': { pass: 'Isabela@456!', avatar: 'Imagens/Isabela.jpg' },
        'cesar.roberto': { pass: 'Cesar@789!', avatar: 'Imagens/Cesar.jpg' }
    },
    mondelez: {
        'maria.eduarda': { pass: 'Maria@Edu123!', avatar: 'Imagens/Maria Eduarda.jpg' },
        'gabriel.moura': { pass: 'Gabriel@456!', avatar: 'Imagens/Gabriel .jpg' },
        'rerisson.moura': { pass: 'Rerisson@2026!', avatar: 'Imagens/Rerisson.jpg' }
    }
const allowedAdmins = ['cesar.roberto', 'rerisson.moura'];

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
        'brand-mondelez': 'Mondelez',
        'brand-hypera': 'Hypera',
        'brand-Operacional': 'Operacional'
    };

    // --- EDITE OS LINKS DAS IMAGENS AQUI ---
    const brandLogos = {
        'brand-nivea': 'Imagens/Nivea.png',
        'brand-rayovac': 'Imagens/Rayovac.png',
        'brand-reckitt': 'Imagens/Reckitt.png',
        'brand-vestacy': 'Imagens/Vestacy.png',
        'brand-kimberly': 'Imagens/kimberly.png',
        'brand-diageo': 'Imagens/Diageo.png',
        'brand-vct': 'Imagens/VCT.png',
        'brand-bic': 'Imagens/BIC.png',
        'brand-cargill': 'Imagens/Cargil.png',
        'brand-haleon': 'Imagens/Haleon.png',
        'brand-mondelez': 'Imagens/Mondelez.png',
        'brand-hypera': 'Imagens/Hypera.png',
        'brand-Operacional': 'Imagens/Operacional.png'
    };

    let currentDate = new Date();
    let selectedDate = new Date();
    let currentUserDivision = ''; // Armazena a divisão do usuário logado
    let currentUserRole = '';     // Armazena o perfil (VIEWER, USER, COORDENADOR)
    let currentUsername = '';     // Armazena o username logado
    let viewingUser = 'all';      // Usuário que estamos visualizando no momento

    // Dados de exemplo iniciais se o localStorage estiver vazio
    const defaultEvents = {
        "2026-04": [
            { id: '1', day: 5, industry: 'brand-nivea', matrix: 'do', title: 'Campanha Nivea' },
            { id: '2', day: 12, industry: 'brand-cargill', matrix: 'schedule', title: 'Planejamento Cargill' },
            { id: '3', day: 18, industry: 'brand-reckitt', matrix: 'delegate', title: 'Distribuição Reckitt' }
        ]
    };

    // Carregar do localStorage
    let eventsData = JSON.parse(localStorage.getItem('eisenhowerEvents')) || defaultEvents;

    // Migração de dados (Se o formato antigo { month: [] } for detectado)
    function migrateData() {
        let migrated = false;
Object.keys(eventsData).forEach(key => {
    if (!key.includes('-') && !isNaN(key)) {
        const year = new Date().getFullYear();
        const newKey = `${year}-${key.padStart(2, '0')}`;
        if (!eventsData[newKey]) eventsData[newKey] = [];

        eventsData[key].forEach(event => {
            if (!event.id) event.id = Date.now() + Math.random().toString(36).substr(2, 9);
            eventsData[newKey].push(event);
        });
        delete eventsData[key];
        migrated = true;
    }
});

// Garantir que todos os eventos tenham ID
Object.keys(eventsData).forEach(key => {
    eventsData[key].forEach(event => {
        if (!event.id) {
            event.id = Date.now() + Math.random().toString(36).substr(2, 9);
            migrated = true;
        }
    });
});

if (migrated) saveEvents();
}

migrateData();

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

    // Pegar eventos do mês atual usando o novo formato de chave YYYY-MM
    const yearKey = date.getFullYear();
    const monthKey = String(date.getMonth() + 1).padStart(2, '0');
    const fullKey = `${yearKey}-${monthKey}`;
    const monthEvents = eventsData[fullKey] || [];

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

        // Adicionar botão de "+" para criar tarefa (Canto Superior)
        if (isCurrentMonth && currentUserRole !== 'VIEWER') {
            const addBtn = document.createElement('div');
            addBtn.className = 'add-event-btn';
            addBtn.innerHTML = '+';
            addBtn.title = 'Criar nova tarefa';
            addBtn.onclick = (e) => {
                e.stopPropagation(); // Impede de abrir os detalhes do dia
                openModal(dayNumber, cellDate.getMonth(), cellDate.getFullYear());
            };
            cell.appendChild(addBtn);
        }

        // Mostrar eventos apenas do mês atual
        if (isCurrentMonth) {
            const dayEvents = monthEvents.filter(event => {
                const matchesDay = event.day === dayNumber;
                const matchesIndustry = filterIndustry === 'all' || event.industry === filterIndustry;
                const matchesMatrix = filterMatrix === 'all' || event.matrix === filterMatrix;
                const matchesSearch = !searchQuery || event.title.toLowerCase().includes(searchQuery);

                // Regra de Privacidade: VISUALIZAR não vê tarefas privadas
                const matchesVisibility = (currentUserRole !== 'VIEWER') || (event.visibility !== 'private');

                // Filtro de Usuário:
                // 1. Se for USER, vê apenas as suas
                // 2. Se for VIEWER, vê apenas as do alvo selecionado
                // 3. Se for ADM, vê 'all' ou o selecionado no filtro
                let matchesUser = true;
                if (currentUserRole === 'USER') {
                    matchesUser = event.createdBy === currentUsername;
                } else if (currentUserRole === 'VIEWER') {
                    matchesUser = event.createdBy === viewingUser;
                } else if (currentUserRole === 'COORDENADOR' && viewingUser !== 'all') {
                    matchesUser = event.createdBy === viewingUser;
                }

                return matchesDay && matchesIndustry && matchesMatrix && matchesSearch && matchesVisibility && matchesUser;
            });

            if (dayEvents.length > 0) {
                dayEvents.slice(0, 3).forEach((event) => {
                    const eventDiv = document.createElement('div');
                    eventDiv.className = 'event-mini-item';

                    // Busca o link no objeto centralizado no topo do script.js
                    const logoSrc = brandLogos[event.industry] || `Imagens/${event.industry.replace('brand-', '')}.png`;

                    const timeDisplay = event.time ? `<span style="opacity: 0.8; font-weight: 400;">${event.time}</span> ` : '';
                    const lockIcon = event.visibility === 'private' ? ' 🔒' : '';

                    eventDiv.innerHTML = `
                        <img src="${logoSrc}" class="mini-logo" onerror="this.style.opacity='0'" alt="">
                        <span class="mini-title" title="${event.title}">${timeDisplay}${event.title}${lockIcon}</span>
                    `;
                    eventDiv.style.backgroundColor = getMatrixColor(event.matrix);
                    eventDiv.style.border = 'none';
                    eventDiv.style.color = 'white';

                    eventDiv.onclick = (e) => {
                        e.stopPropagation();
                        openEventDetail(event, fullKey);
                    };

                    setupDragDrop(eventDiv, event, fullKey);
                    cell.appendChild(eventDiv);
                });

                if (dayEvents.length > 3) {
                    const moreEvents = document.createElement('div');
                    moreEvents.className = 'no-events';
                    moreEvents.style.marginTop = '2px';
                    moreEvents.textContent = `+ ${dayEvents.length - 3} tarefas`;
                    cell.appendChild(moreEvents);
                }
            } else {
                const noEvents = document.createElement('span');
                noEvents.className = 'no-events';
                noEvents.textContent = 'Sem eventos';
                cell.appendChild(noEvents);
            }
        }

        cell.addEventListener('click', () => {
            if (isCurrentMonth) {
                openDayDetails(dayNumber, cellDate.getMonth(), cellDate.getFullYear());
            }
        });

        setupCellDrop(cell, dayNumber, isCurrentMonth);
        calendar.appendChild(cell);
    }

    // Atualizar header
    const formattedDate = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const monthDisplay = document.getElementById('currentMonthDisplay');
    if (monthDisplay) {
        monthDisplay.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }

    // Atualizar o input de mês
    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        monthFilter.value = `${year}-${month}`;
    }

    // Atualizar contadores de prioridade
    if (typeof updatePriorityCounters === 'function') updatePriorityCounters();
}

function applyFilters() {
    generateCalendar(currentDate);
    syncLegendState();
}

function syncLegendState() {
    const filterSelect = document.getElementById('filterMatrix');
    if (!filterSelect) return;

    const matrix = filterSelect.value;
    document.querySelectorAll('.legend-item').forEach(item => {
        item.classList.remove('active-filter');
    });

    if (matrix !== 'all') {
        const priorities = ['do', 'schedule', 'delegate', 'eliminate'];
        const index = priorities.indexOf(matrix);
        if (index > -1) {
            document.querySelectorAll('.legend-item')[index].classList.add('active-filter');
        }
    }
}

function togglePriorityFilter(matrix) {
    const filterSelect = document.getElementById('filterMatrix');
    if (!filterSelect) return;

    if (filterSelect.value === matrix) {
        filterSelect.value = 'all';
    } else {
        filterSelect.value = matrix;
    }
    applyFilters();
}

// Lógica do Modal de Evento
function openModal(day, month, year) {
    document.getElementById('eventModal').style.display = 'flex';
    const yearVal = year || currentDate.getFullYear();
    const monthVal = String(month + 1).padStart(2, '0');
    document.getElementById('eventDate').value = `${yearVal}-${monthVal}-${day}`;
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventVisibility').value = 'public';

    // Atualiza as opções de indústria com base na divisão
    updateIndustryOptions();

    document.getElementById('eventTitle').focus();
}

function updateIndustryOptions() {
    const select = document.getElementById('eventIndustry');
    if (!select) return;

    select.innerHTML = '';

    if (currentUserDivision === 'mondelez') {
        // Apenas Mondelez e Operacional
        addOption(select, 'brand-mondelez', 'Mondelez');
        addOption(select, 'brand-Operacional', 'Operacional');
    } else {
        // Todas as opções (Sigma)
        Object.entries(brandNames).forEach(([value, text]) => {
            if (value !== 'brand-mondelez') { // Sigma não vê Mondelez no select de criação (opcional)
                addOption(select, value, text);
            }
        });
    }
}

function addOption(select, value, text) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.text = text;
    select.add(opt);
}

function updateFilterOptions() {
    const filters = [
        document.getElementById('filterIndustry'),
        document.getElementById('summaryFilterIndustry')
    ];

    filters.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="all">Todos Fornecedores</option>';

        if (currentUserDivision === 'mondelez') {
            addOption(select, 'brand-mondelez', 'Mondelez');
            addOption(select, 'brand-Operacional', 'Operacional');
        } else {
            Object.entries(brandNames).forEach(([value, text]) => {
                if (value !== 'brand-mondelez') {
                    addOption(select, value, text);
                }
            });
        }
        if (Array.from(select.options).some(opt => opt.value === currentValue)) {
            select.value = currentValue;
        }
    });
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}

// Lógica do Modal de Resumo
function openSummary() {
    const modal = document.getElementById('summaryModal');
    const list = document.getElementById('summaryList');
    if (!modal || !list) return;

    modal.style.display = 'flex';
    list.innerHTML = '';

    // Filtros internos do modal
    const filterIndustry = document.getElementById('summaryFilterIndustry')?.value || 'all';
    const filterMatrix = document.getElementById('summaryFilterMatrix')?.value || 'all';

    let allFilteredEvents = [];

    // Percorrer todos os meses nos dados para ver TODAS as atividades
    Object.keys(eventsData).forEach(fullKey => {
        const [year, month] = fullKey.split('-').map(Number);
        eventsData[fullKey].forEach(event => {
            // Filtros de categoria
            const matchesIndustry = filterIndustry === 'all' || event.industry === filterIndustry;
            const matchesMatrix = filterMatrix === 'all' || event.matrix === filterMatrix;

            if (matchesIndustry && matchesMatrix) {
                allFilteredEvents.push({ ...event, month, year });
            }
        });
    });

    // Ordenar por data
    allFilteredEvents.sort((a, b) => (a.year * 10000 + a.month * 100 + a.day) - (b.year * 10000 + b.month * 100 + b.day));

    if (allFilteredEvents.length === 0) {
        list.innerHTML = '<div class="summary-empty">Nenhuma atividade encontrada com estes filtros.</div>';
    } else {
        allFilteredEvents.forEach(event => {
            const item = document.createElement('div');
            item.className = 'summary-item';

            const monthName = new Date(event.year, event.month - 1).toLocaleDateString('pt-BR', { month: 'long' });
            const dateDisplay = `${event.day} de ${monthName}${event.year !== new Date().getFullYear() ? ' de ' + event.year : ''}`;

            item.innerHTML = `
                <div class="summary-item-info">
                    <span class="summary-item-date">${dateDisplay}</span>
                    <span class="summary-item-title">${event.title}</span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="summary-item-brand ${event.industry}">${brandNames[event.industry] || 'Marca'}</span>
                    <div class="legend-color" style="background: ${getMatrixColor(event.matrix)}; width: 12px; height: 12px; border-radius: 3px;"></div>
                    <button class="btn-delete-summary" onclick="deleteEventFromSummary('${event.year}-${String(event.month).padStart(2, '0')}', '${event.id}')" title="Excluir Tarefa">🗑️</button>
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

function deleteEventFromSummary(fullKey, eventId) {
    const event = eventsData[fullKey]?.find(e => e.id === eventId);
    if (!event) return;

    if (!canEdit(event)) {
        alert("Você não tem permissão para excluir esta tarefa.");
        return;
    }

    customConfirm(`Deseja excluir a tarefa "${event.title}"?`, () => {
        const index = eventsData[fullKey].findIndex(e => e.id === eventId);
        if (index > -1) {
            eventsData[fullKey].splice(index, 1);
            saveEvents();
            openSummary(); // Atualiza a lista no modal
            generateCalendar(currentDate); // Atualiza o calendário ao fundo
        }
    });
}

function canEdit(event) {
    if (currentUserRole === 'COORDENADOR') return true;
    if (currentUserRole === 'USER') {
        // Se a tarefa não tem criador (tarefas antigas), apenas coordenador deleta
        return event.createdBy === currentUsername;
    }
    return false; // VIEWER não edita nada
}

function customConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const msgPara = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');

    if (modal && msgPara && confirmBtn) {
        msgPara.textContent = message;
        modal.style.display = 'flex';

        confirmBtn.onclick = function () {
            onConfirm();
            closeConfirmModal();
        };
    }
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

function openDayDetails(day, month, year) {
    const modal = document.getElementById('dayDetailsModal');
    const list = document.getElementById('dayDetailsList');
    const title = document.getElementById('dayDetailsTitle');
    if (!modal || !list) return;

    modal.style.display = 'flex';
    list.innerHTML = '';

    const monthName = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long' });
    title.textContent = `📅 Tarefas de ${day} de ${monthName} de ${year}`;

    const fullKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const dayEvents = (eventsData[fullKey] || []).filter(e => e.day === day);

    if (dayEvents.length === 0) {
        list.innerHTML = '<div class="summary-empty">Nenhuma tarefa para este dia.</div>';
    } else {
        dayEvents.forEach(event => {
            const item = document.createElement('div');
            item.className = 'summary-item';
            item.innerHTML = `
                <div class="summary-item-info">
                    <span class="summary-item-title">${event.title}</span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="summary-item-brand ${event.industry}">${brandNames[event.industry] || 'Marca'}</span>
                    <div class="legend-color" style="background: ${getMatrixColor(event.matrix)}; width: 12px; height: 12px; border-radius: 3px;"></div>
                    <button class="btn-delete-summary" onclick="deleteEventFromDayDetails('${fullKey}', ${day}, ${month}, ${year}, '${event.id}')" title="Excluir Tarefa">🗑️</button>
                </div>
            `;
            list.appendChild(item);
        });
    }
}

function closeDayDetails() {
    document.getElementById('dayDetailsModal').style.display = 'none';
}

function deleteEventFromDayDetails(fullKey, day, month, year, eventId) {
    const event = eventsData[fullKey]?.find(e => e.id === eventId);
    if (!event) return;

    customConfirm(`Deseja excluir a tarefa "${event.title}"?`, () => {
        const index = eventsData[fullKey].findIndex(e => e.id === eventId);
        if (index > -1) {
            eventsData[fullKey].splice(index, 1);
            saveEvents();
            openDayDetails(day, month, year); // Atualiza os detalhes do dia
            generateCalendar(currentDate); // Atualiza o calendário ao fundo
        }
    });
}

function openEventDetail(event, fullKey) {
    const modal = document.getElementById('eventDetailModal');
    if (!modal) return;

    const logo = document.getElementById('detailLogo');
    const title = document.getElementById('detailTitle');
    const dateText = document.getElementById('detailDateText');
    const brandText = document.getElementById('detailBrandText');
    const priorityText = document.getElementById('detailPriorityText');
    const deleteBtn = document.getElementById('deleteDetailBtn');

    const [year, month] = fullKey.split('-').map(Number);
    const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long' });

    logo.src = brandLogos[event.industry] || '';
    logo.onerror = () => logo.src = 'Imagens/Sigma.png'; // Fallback

    title.textContent = (event.time ? event.time + ' - ' : '') + event.title + (event.visibility === 'private' ? ' (🔒 Privada)' : '');
    dateText.textContent = `${event.day} de ${monthName} de ${year}`;
    brandText.textContent = brandNames[event.industry] || 'Marca';

    const matrixNames = { 'do': 'Fazer Agora', 'schedule': 'Agendar', 'delegate': 'Delegar', 'eliminate': 'Eliminar' };
    priorityText.textContent = matrixNames[event.matrix];
    priorityText.style.backgroundColor = getMatrixColor(event.matrix);

    deleteBtn.onclick = () => {
        deleteEventFromSummary(fullKey, event.id);
        closeEventDetail();
    };

    modal.style.display = 'flex';
}

function closeEventDetail() {
    document.getElementById('eventDetailModal').style.display = 'none';
}

window.onclick = function (event) {
    const eventModal = document.getElementById('eventModal');
    const summaryModal = document.getElementById('summaryModal');
    const confirmModal = document.getElementById('confirmModal');
    const dayDetailsModal = document.getElementById('dayDetailsModal');
    const eventDetailModal = document.getElementById('eventDetailModal');

    if (event.target == eventModal) closeModal();
    if (event.target == summaryModal) closeSummary();
    if (event.target == confirmModal) closeConfirmModal();
    if (event.target == dayDetailsModal) closeDayDetails();
    if (event.target == eventDetailModal) closeEventDetail();
}

document.getElementById('eventForm').onsubmit = function (e) {
    e.preventDefault();
    const dateParts = document.getElementById('eventDate').value.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);

    const title = document.getElementById('eventTitle').value;
    const industry = document.getElementById('eventIndustry').value;
    const matrix = document.getElementById('eventMatrix').value;
    const time = document.getElementById('eventTime').value;
    const visibility = document.getElementById('eventVisibility').value;

    const fullKey = `${year}-${String(month).padStart(2, '0')}`;

    if (!eventsData[fullKey]) {
        eventsData[fullKey] = [];
    }

    const newEvent = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        day,
        industry,
        matrix,
        title,
        time,
        visibility,
        createdBy: currentUsername // Salva quem criou
    };

    // Lembrete
    const reminderCheck = document.getElementById('eventReminder');
    const reminderTime = document.getElementById('eventReminderTime');
    if (reminderCheck && reminderCheck.checked && reminderTime && reminderTime.value) {
        newEvent.reminder = true;
        newEvent.reminderTime = reminderTime.value;
    }

    eventsData[fullKey].push(newEvent);
    saveEvents();
    generateCalendar(currentDate);
    closeModal();
};

// Função deleteEvent legada removida (substituída por deleteEventFromSummary e deleteEventFromDayDetails usando IDs)

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
        showMainContent(session.username, session.division, session.role || 'USER', session.viewingUser);
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('main-container').style.display = 'none';
    }
}

function togglePasswordRequired(role) {
    const usernameGroup = document.getElementById('usernameGroup');
    const viewerGroup = document.getElementById('viewerGroup');
    const passwordGroup = document.getElementById('passwordGroup');
    const division = document.getElementById('loginDivision').value;

    if (role === 'VIEWER') {
        usernameGroup.style.display = 'none';
        viewerGroup.style.display = 'block';
        passwordGroup.style.display = 'none';
        document.getElementById('username').removeAttribute('required');
        document.getElementById('password').removeAttribute('required');
    } else if (role === 'COORDENADOR') {
        usernameGroup.style.display = 'block';
        viewerGroup.style.display = 'block'; // Admin também escolhe quem quer ver
        passwordGroup.style.display = 'block';
        document.getElementById('username').setAttribute('required', 'required');
        document.getElementById('password').setAttribute('required', 'required');
    } else {
        usernameGroup.style.display = 'block';
        viewerGroup.style.display = 'none';
        passwordGroup.style.display = 'block';
        document.getElementById('username').setAttribute('required', 'required');
        document.getElementById('password').setAttribute('required', 'required');
    }

    if (division && (role === 'VIEWER' || role === 'COORDENADOR')) {
        populateViewerSelect(division);
    }
}

function updateViewerSelectOnDivisionChange(division) {
    const role = document.getElementById('loginRole').value;
    if (role === 'VIEWER' || role === 'COORDENADOR') {
        populateViewerSelect(division);
    }
}

function populateViewerSelect(division) {
    const select = document.getElementById('viewerUserSelect');
    if (!select || !users[division]) return;

    select.innerHTML = '';
    Object.keys(users[division]).forEach(username => {
        const displayName = username.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const opt = document.createElement('option');
        opt.value = username;
        opt.textContent = displayName;
        select.appendChild(opt);
    });
}

function showMainContent(username, division, role, initialViewingUser) {
    currentUserDivision = division;
    currentUserRole = role;
    currentUsername = username;
    viewingUser = initialViewingUser || 'all';

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';

    // Mostrar filtro de usuário se for ADM
    const adminFilterContainer = document.getElementById('adminUserFilterContainer');
    if (adminFilterContainer) {
        if (role === 'COORDENADOR') {
            adminFilterContainer.style.display = 'block';
            populateAdminUserFilter(division);
            document.getElementById('adminUserFilter').value = viewingUser;
        } else {
            adminFilterContainer.style.display = 'none';
        }
    }

    const userData = users[division] ? users[division][username] : null;
    const displayName = username.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const userSpan = document.getElementById('loggedUser');
    if (userSpan) userSpan.textContent = `${displayName} (${role})`;

    // Se for VIEWER ou COORDENADOR logando como alguém específico, atualizar título
    if (viewingUser !== 'all' && viewingUser !== username) {
        const targetName = viewingUser.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        if (userSpan) userSpan.textContent = `${displayName} (👀 Vendo: ${targetName})`;
    }

    const avatarImg = document.getElementById('userAvatar');
    if (avatarImg && userData && userData.avatar) {
        avatarImg.src = userData.avatar;
    }

    const title = document.getElementById('mainTitle');
    if (title) title.textContent = `EQUIPE ${division.toUpperCase()}`;

    // Atualiza filtros globais e do resumo
    updateFilterOptions();

    const divisionLogo = document.getElementById('divisionLogo');
    if (divisionLogo) {
        // Define o logo baseado na divisão (Sigma ou Mondelez)
        if (division.toLowerCase() === 'sigma') {
            divisionLogo.src = 'Imagens/Sigma.png';
        } else if (division.toLowerCase() === 'mondelez') {
            divisionLogo.src = 'Imagens/Mondelez.png';
        }
    }

    generateCalendar(currentDate);
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.onsubmit = function (e) {
        e.preventDefault();
        const role = document.getElementById('loginRole').value;
        const division = document.getElementById('loginDivision').value;
        const user = document.getElementById('username').value.toLowerCase();
        const pass = document.getElementById('password').value;
        const errorMsg = document.getElementById('loginError');

        if (role === 'VIEWER') {
            const selectedTarget = document.getElementById('viewerUserSelect').value;
            if (!selectedTarget) {
                errorMsg.textContent = 'Por favor, selecione um perfil para visualizar.';
                return;
            }
            const session = { username: selectedTarget, division: division, role: role, viewingUser: selectedTarget };
            localStorage.setItem('eisenhowerSession', JSON.stringify(session));
            showMainContent(selectedTarget, division, role, selectedTarget);
            return;
        }

        if (users[division] && users[division][user] && users[division][user].pass === pass) {
            // Validar se é um administrador permitido
            if (role === 'COORDENADOR' && !allowedAdmins.includes(user)) {
                errorMsg.textContent = 'Acesso negado: Este usuário não possui privilégios de Administrador.';
                return;
            }

            const selectedTarget = (role === 'COORDENADOR') ? document.getElementById('viewerUserSelect').value : user;
            const session = { username: user, division: division, role: role, viewingUser: selectedTarget };
            localStorage.setItem('eisenhowerSession', JSON.stringify(session));
            showMainContent(user, division, role, selectedTarget);
            errorMsg.textContent = '';
        } else {
            errorMsg.textContent = 'Usuário ou senha incorretos para esta divisão.';
        }
    };
}

function populateAdminUserFilter(division) {
    const select = document.getElementById('adminUserFilter');
    if (!select || !users[division]) return;

    select.innerHTML = '<option value="all">👥 Ver Equipe Completa</option>';
    Object.keys(users[division]).forEach(username => {
        const displayName = username.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const opt = document.createElement('option');
        opt.value = username;
        opt.textContent = `👤 Agenda de: ${displayName}`;
        select.appendChild(opt);
    });
}

function handleAdminUserFilter(val) {
    viewingUser = val;
    generateCalendar(currentDate);
}

function logout() {
    localStorage.removeItem('eisenhowerSession');
    location.reload();
}

function closeSummary() {
    document.getElementById('summaryModal').style.display = 'none';
}

// ========================================
// 1. BUSCA POR TEXTO
// ========================================
let searchQuery = '';
let searchTimeout = null;

function handleSearch(value) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchQuery = value.trim().toLowerCase();
        const clearBtn = document.getElementById('searchClear');
        if (clearBtn) clearBtn.classList.toggle('visible', searchQuery.length > 0);
        generateCalendar(currentDate);
    }, 300);
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    searchQuery = '';
    document.getElementById('searchClear')?.classList.remove('visible');
    generateCalendar(currentDate);
}

// ========================================
// 2. PUSH NOTIFICATIONS / LEMBRETES
// ========================================
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function checkReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const fullKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayEvents = eventsData[fullKey]?.filter(e => e.day === now.getDate()) || [];

    todayEvents.forEach(event => {
        if (event.reminder && event.reminderTime === currentTime) {
            const notifKey = `notified_${event.id}_${today}_${currentTime}`;
            if (!sessionStorage.getItem(notifKey)) {
                new Notification('🔔 Lembrete - Agenda de Funções', {
                    body: `${event.title}\n${brandNames[event.industry] || 'Tarefa'}`,
                    icon: brandLogos[event.industry] || 'Imagens/Sigma.png'
                });
                sessionStorage.setItem(notifKey, '1');
            }
        }
    });
}

setInterval(checkReminders, 60000);

// ========================================
// 3. EXPORTAR PDF / EXCEL
// ========================================
function toggleExportDropdown() {
    const dd = document.getElementById('exportDropdown');
    dd.classList.toggle('show');
}

document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.export-wrapper');
    const dd = document.getElementById('exportDropdown');
    if (wrapper && dd && !wrapper.contains(e.target)) {
        dd.classList.remove('show');
    }
});

function getFilteredEventsForExport() {
    const filterIndustry = document.getElementById('filterIndustry')?.value || 'all';
    const filterMatrix = document.getElementById('filterMatrix')?.value || 'all';
    const yearKey = currentDate.getFullYear();
    const monthKey = String(currentDate.getMonth() + 1).padStart(2, '0');
    const fullKey = `${yearKey}-${monthKey}`;
    const monthEvents = eventsData[fullKey] || [];
    return monthEvents.filter(e => {
        const mi = filterIndustry === 'all' || e.industry === filterIndustry;
        const mm = filterMatrix === 'all' || e.matrix === filterMatrix;
        const ms = !searchQuery || e.title.toLowerCase().includes(searchQuery);
        return mi && mm && ms;
    }).sort((a, b) => a.day - b.day);
}

function getMatrixName(m) {
    return { 'do': 'Fazer Agora', 'schedule': 'Agendar', 'delegate': 'Delegar', 'eliminate': 'Eliminar' }[m] || m;
}

function exportPDF() {
    document.getElementById('exportDropdown').classList.remove('show');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const events = getFilteredEventsForExport();
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    doc.setFontSize(18);
    doc.text(`Agenda de Funções - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

    const rows = events.map(e => [
        e.day, e.title, brandNames[e.industry] || '', getMatrixName(e.matrix)
    ]);

    doc.autoTable({
        startY: 36,
        head: [['Dia', 'Título', 'Indústria', 'Prioridade']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { font: 'helvetica', fontSize: 10 }
    });

    doc.save(`agenda_${currentDate.getFullYear()}_${String(currentDate.getMonth() + 1).padStart(2, '0')}.pdf`);
}

function exportExcel() {
    document.getElementById('exportDropdown').classList.remove('show');
    const events = getFilteredEventsForExport();
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const data = events.map(e => ({
        'Dia': e.day,
        'Título': e.title,
        'Indústria': brandNames[e.industry] || '',
        'Prioridade': getMatrixName(e.matrix)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthName.charAt(0).toUpperCase() + monthName.slice(1));
    XLSX.writeFile(wb, `agenda_${currentDate.getFullYear()}_${String(currentDate.getMonth() + 1).padStart(2, '0')}.xlsx`);
}

// ========================================
// 4. TEMA CLARO / ESCURO
// ========================================
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('eisenhowerTheme', next);
    const btn = document.getElementById('themeToggleInline');
    if (btn) btn.textContent = next === 'light' ? '☀️' : '🌙';
}

function loadTheme() {
    const saved = localStorage.getItem('eisenhowerTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeToggleInline');
    if (btn) btn.textContent = saved === 'light' ? '☀️' : '🌙';
}

loadTheme();

// ========================================
// 5. CONTADOR DE TAREFAS
// ========================================
function updatePriorityCounters() {
    const yearKey = currentDate.getFullYear();
    const monthKey = String(currentDate.getMonth() + 1).padStart(2, '0');
    const fullKey = `${yearKey}-${monthKey}`;
    const monthEvents = eventsData[fullKey] || [];

    const counts = { do: 0, schedule: 0, delegate: 0, eliminate: 0 };
    monthEvents.forEach(e => { if (counts.hasOwnProperty(e.matrix)) counts[e.matrix]++; });

    const ids = { do: 'counterDo', schedule: 'counterSchedule', delegate: 'counterDelegate', eliminate: 'counterEliminate' };
    Object.entries(ids).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) {
            const oldVal = parseInt(el.textContent);
            el.textContent = counts[key];
            if (oldVal !== counts[key]) {
                el.classList.remove('pulse');
                void el.offsetWidth;
                el.classList.add('pulse');
            }
        }
    });
}

// ========================================
// 6. DRAG & DROP
// ========================================
let draggedEvent = null;
let draggedFullKey = '';

function setupDragDrop(eventDiv, event, fullKey) {
    eventDiv.setAttribute('draggable', 'true');
    eventDiv.addEventListener('dragstart', (e) => {
        draggedEvent = event;
        draggedFullKey = fullKey;
        eventDiv.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', event.id);
    });
    eventDiv.addEventListener('dragend', () => {
        eventDiv.classList.remove('dragging');
        draggedEvent = null;
    });
}

function setupCellDrop(cell, dayNumber, isCurrentMonth) {
    if (!isCurrentMonth) return;
    cell.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cell.classList.add('drag-over');
    });
    cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
    cell.addEventListener('drop', (e) => {
        e.preventDefault();
        cell.classList.remove('drag-over');
        if (!draggedEvent || !draggedFullKey) return;

        const yearKey = currentDate.getFullYear();
        const monthKey = String(currentDate.getMonth() + 1).padStart(2, '0');
        const targetKey = `${yearKey}-${monthKey}`;

        if (draggedFullKey === targetKey && draggedEvent.day !== dayNumber) {
            const idx = eventsData[draggedFullKey].findIndex(ev => ev.id === draggedEvent.id);
            if (idx > -1) {
                eventsData[draggedFullKey][idx].day = dayNumber;
                saveEvents();
                generateCalendar(currentDate);
            }
        }
        draggedEvent = null;
        draggedFullKey = '';
    });
}

// Inicializar verificação
requestNotificationPermission();
checkSession();