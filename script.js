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
};

const allowedAdmins = ['rerisson.moura'];

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

// --- SISTEMA DE AUDITORIA (LOGS) ---
function addAuditLog(action, taskId, taskTitle, industry, matrix) {
    const logs = JSON.parse(localStorage.getItem('eisenhowerAuditLogs')) || [];
    const newLog = {
        user: currentUsername,
        division: currentUserDivision,
        date: new Date().toLocaleString('pt-BR'),
        action: action, // 'CRIAÇÃO', 'EDIÇÃO', 'EXCLUSÃO', 'ARQUIVAMENTO', etc
        taskId: taskId,
        title: taskTitle,
        industry: industry || '',
        matrix: matrix || ''
    };
    logs.push(newLog);
    localStorage.setItem('eisenhowerAuditLogs', JSON.stringify(logs.slice(-1000))); // Aumentado para 1000 logs
}

// --- CONTROLE DE PERMISSÕES CRÍTICAS ---
function canEdit(event) {
    if (currentUserRole === 'COORDENADOR') return true;
    if (currentUserRole === 'VIEWER') return false;
    // USER: Pode editar se for criador OU responsável
    return (event.createdBy === currentUsername || event.assignedTo === currentUsername);
}

function canDelete(event) {
    return currentUserRole === 'COORDENADOR';
}

function canArchive(event) {
    if (currentUserRole === 'COORDENADOR') return true;
    if (currentUserRole === 'VIEWER') return false;
    // USER: Pode arquivar se for criador
    return (event.createdBy === currentUsername);
}
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

    // Garantir que todos os eventos tenham ID e DIVISÃO
    Object.keys(eventsData).forEach(key => {
        eventsData[key].forEach(event => {
            let updated = false;
            if (!event.id) {
                event.id = Date.now() + Math.random().toString(36).substr(2, 9);
                updated = true;
            }
            // Se não tem divisão, assume 'sigma' (divisão original do app)
            if (!event.division) {
                event.division = 'sigma';
                updated = true;
            }
            if (updated) migrated = true;
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

                // --- NOVA HIERARQUIA DE PERMISSÕES ---
                let matchesUserAndVisibility = false;

                if (currentUserRole === 'COORDENADOR') {
                    // ADMIN: Vê tudo da divisão. Se filtrar usuário, vê o alvo + as dele.
                    if (viewingUser !== 'all') {
                        matchesUserAndVisibility = (event.createdBy === viewingUser || event.assignedTo === viewingUser);
                    } else {
                        matchesUserAndVisibility = true;
                    }
                } else if (currentUserRole === 'USER') {
                    // USUÁRIO: Vê apenas o que criou como USER ou o que foi atribuído a ele como USER
                    const isOwner = event.createdBy === currentUsername && event.createdByRole === 'USER';
                    const isAssigned = event.assignedTo === currentUsername;
                    matchesUserAndVisibility = isOwner || isAssigned;
                } else {
                    // VIEWER: Vê apenas Públicas da divisão
                    matchesUserAndVisibility = event.visibility === 'public';
                }

                // ISOLAMENTO DE DIVISÃO (Segurança Obrigatória)
                if (event.division !== currentUserDivision && !allowedAdmins.includes(currentUsername)) {
                    matchesUserAndVisibility = false;
                }

                // Filtro de Status (Pendente/Concluído/Arquivado)
                const filterStatus = document.getElementById('filterStatus')?.value || 'all';
                let matchesStatus = true;

                if (filterStatus === 'archived') {
                    matchesStatus = event.archived === true;
                } else {
                    // Por padrão, esconde arquivados de todos os outros filtros
                    if (event.archived) return false;

                    if (filterStatus === 'pending') matchesStatus = !event.completed;
                    if (filterStatus === 'completed') matchesStatus = event.completed;
                }

                return matchesDay && matchesIndustry && matchesMatrix && matchesSearch && matchesUserAndVisibility && matchesStatus;
            });

            if (dayEvents.length > 0) {
                dayEvents.slice(0, 3).forEach((event) => {
                    const eventDiv = document.createElement('div');
                    eventDiv.className = 'event-mini-item';

                    // Busca o link no objeto centralizado no topo do script.js
                    const industryKey = event.industry || 'brand-Operacional';
                    const logoSrc = brandLogos[industryKey] || `Imagens/${industryKey.replace('brand-', '')}.png`;

                    const endTimeDisplay = event.endTime ? ` às ${event.endTime}` : '';
                    const timeDisplay = event.time ? `<span style="opacity: 0.8; font-weight: 400;">${event.time}${endTimeDisplay}</span> ` : '';
                    const lockIcon = event.visibility === 'private' ? ' 🔒' : '';
                    const checkIcon = event.completed ? ' ✅' : '';

                    if (event.completed) {
                        eventDiv.classList.add('event-completed');
                    }

                    eventDiv.innerHTML = `
                        <img src="${logoSrc}" class="mini-logo" onerror="this.style.opacity='0'" alt="">
                        <div class="mini-title" title="${event.title}">
                            <span>${timeDisplay}${event.title}</span>
                            ${event.assignedTo ? `<small>👤 ${getUserDisplayName(event.assignedTo)}</small>` : ''}
                            ${currentUserRole === 'COORDENADOR' && viewingUser === 'all' ? `<small>📝 ${getUserDisplayName(event.createdBy)}</small>` : ''}
                        </div>
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
    const eventEndTimeInput = document.getElementById('eventEndTime');
    if (eventEndTimeInput) eventEndTimeInput.value = '';
    document.getElementById('eventVisibility').value = 'public';

    // Atualiza as opções de indústria com base na divisão
    updateIndustryOptions();
    populateAssignedToSelect();

    document.getElementById('eventTitle').focus();
}

function updateIndustryOptions() {
    const select = document.getElementById('eventIndustry');
    if (!select) return;

    select.innerHTML = '';

    if (currentUserDivision === 'mondelez' && !allowedAdmins.includes(currentUsername)) {
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

        if (currentUserDivision === 'mondelez' && !allowedAdmins.includes(currentUsername)) {
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

            // SEGURANÇA: Só mostra no resumo o que o usuário pode VER
            let matchesUser = false;
            if (currentUserRole === 'COORDENADOR') {
                if (viewingUser !== 'all') {
                    // Adm vendo um usuário específico: filtra por criador ou responsável
                    matchesUser = (event.createdBy === viewingUser || event.assignedTo === viewingUser);
                } else {
                    matchesUser = true;
                }
            } else if (currentUserRole === 'USER') {
                const isOwner = event.createdBy === currentUsername;
                const isAssigned = event.assignedTo === currentUsername;
                matchesUser = isOwner || isAssigned;
            } else {
                matchesUser = event.visibility === 'public';
            }

            // ISOLAMENTO DE DIVISÃO (Obrigatório)
            const isFromCurrentDivision = event.division === currentUserDivision || (allowedAdmins.includes(currentUsername));
            if (!isFromCurrentDivision) {
                matchesUser = false;
            }

            if (matchesIndustry && matchesMatrix && matchesUser) {
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
            if (event.completed) {
                item.classList.add('event-completed');
            }

            const monthName = new Date(event.year, event.month - 1).toLocaleDateString('pt-BR', { month: 'long' });
            const dateDisplay = `${event.day} de ${monthName}${event.year !== new Date().getFullYear() ? ' de ' + event.year : ''}`;
            const checkIcon = event.completed ? ' ✅' : '';

            item.innerHTML = `
                <div class="summary-item-info">
                    <span class="summary-item-date">${dateDisplay}</span>
                    <span class="summary-item-title">${event.title}${checkIcon}</span>
                    <div class="summary-item-meta" style="font-size: 0.85em; opacity: 0.8; display: flex; gap: 15px; margin-top: 5px;">
                        ${event.assignedTo ? `<span>👤 <b>Resp:</b> ${getUserDisplayName(event.assignedTo)}</span>` : ''}
                        <span>📝 <b>Por:</b> ${getUserDisplayName(event.createdBy)}</span>
                    </div>
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

    if (currentUserRole === 'COORDENADOR') {
        // ADMIN: Escolhe entre arquivar ou excluir permanente
        customConfirm(`Atenção Administrador: Deseja ARQUIVAR ou EXCLUIR PERMANENTEMENTE a tarefa "${event.title}"?`, () => {
            // Callback para Excluir Permanente (comportamento padrão do botão confirmar no customConfirm legado)
            const index = eventsData[fullKey].findIndex(e => e.id === eventId);
            if (index > -1) {
                const taskTitle = event.title;
                const taskId = event.id;
                eventsData[fullKey].splice(index, 1);
                saveEvents();
                addAuditLog('EXCLUSÃO PERMANENTE', taskId, taskTitle, event.industry, event.matrix);
                openSummary();
                generateCalendar(currentDate);
                showToast("Tarefa excluída permanentemente.");
            }
        }, "Excluir Permanente", "Arquivar", () => {
            // Callback para Arquivar
            archiveTask(fullKey, eventId);
            openSummary();
        });
    } else {
        // USER: Apenas Arquivar
        if (!canArchive(event)) {
            showToast("Você não tem permissão para arquivar esta tarefa.", "error");
            return;
        }
        customConfirm(`Deseja arquivar a tarefa "${event.title}"?`, () => {
            archiveTask(fullKey, eventId);
            openSummary();
        });
    }
}

function archiveTask(fullKey, eventId) {
    const event = eventsData[fullKey]?.find(e => e.id === eventId);
    if (!event) return;

    event.archived = true;
    saveEvents();
    addAuditLog('ARQUIVAMENTO', event.id, event.title, event.industry, event.matrix);
    generateCalendar(currentDate);
    showToast("Tarefa arquivada com sucesso.");
}



function customConfirm(message, onConfirm, confirmText = "Confirmar", cancelText = "Cancelar", onCancel) {
    const modal = document.getElementById('confirmModal');
    const msgPara = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.querySelector('.btn-cancel');

    if (modal && msgPara && confirmBtn) {
        msgPara.textContent = message;
        confirmBtn.textContent = confirmText;
        if (cancelBtn) cancelBtn.textContent = cancelText;

        modal.style.display = 'flex';

        confirmBtn.onclick = function () {
            onConfirm();
            closeConfirmModal();
        };

        if (cancelBtn) {
            cancelBtn.onclick = function () {
                if (onCancel) onCancel();
                closeConfirmModal();
            };
        }
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
        // Filtrar por divisão e permissão nos detalhes do dia também
        const filteredDayEvents = dayEvents.filter(event => {
            if (event.division !== currentUserDivision && !allowedAdmins.includes(currentUsername)) return false;

            if (currentUserRole === 'COORDENADOR') {
                if (viewingUser !== 'all') {
                    return (event.createdBy === viewingUser || event.assignedTo === viewingUser);
                }
                return true;
            } else if (currentUserRole === 'USER') {
                return event.createdBy === currentUsername || event.assignedTo === currentUsername;
            } else {
                return event.visibility === 'public';
            }
        });

        if (filteredDayEvents.length === 0) {
            list.innerHTML = '<div class="summary-empty">Nenhuma tarefa visível para você neste dia.</div>';
            return;
        }

        filteredDayEvents.forEach(event => {
            const item = document.createElement('div');
            item.className = 'summary-item';
            if (event.completed) {
                item.classList.add('event-completed');
            }
            const checkIcon = event.completed ? ' ✅' : '';

            item.innerHTML = `
                <div class="summary-item-info">
                    <span class="summary-item-title">${event.title}${checkIcon}</span>
                    <div class="summary-item-meta" style="font-size: 0.85em; opacity: 0.8; display: flex; gap: 15px; margin-top: 5px;">
                        ${event.assignedTo ? `<span>👤 <b>Resp:</b> ${getUserDisplayName(event.assignedTo)}</span>` : ''}
                        <span>📝 <b>Por:</b> ${getUserDisplayName(event.createdBy)}</span>
                    </div>
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

    if (currentUserRole === 'COORDENADOR') {
        customConfirm(`Atenção Administrador: Deseja ARQUIVAR ou EXCLUIR PERMANENTEMENTE a tarefa "${event.title}"?`, () => {
            const index = eventsData[fullKey].findIndex(e => e.id === eventId);
            if (index > -1) {
                const taskTitle = event.title;
                const taskId = event.id;
                eventsData[fullKey].splice(index, 1);
                saveEvents();
                addAuditLog('EXCLUSÃO PERMANENTE', taskId, taskTitle, event.industry, event.matrix);
                openDayDetails(day, month, year);
                generateCalendar(currentDate);
                showToast("Tarefa excluída permanentemente.");
            }
        }, "Excluir Permanente", "Arquivar", () => {
            archiveTask(fullKey, eventId);
            openDayDetails(day, month, year);
        });
    } else {
        if (!canArchive(event)) {
            showToast("Você não tem permissão para arquivar esta tarefa.", "error");
            return;
        }
        customConfirm(`Deseja arquivar a tarefa "${event.title}"?`, () => {
            archiveTask(fullKey, eventId);
            openDayDetails(day, month, year);
        });
    }
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

    const timeText = event.time ? event.time + (event.endTime ? ' às ' + event.endTime : '') + ' - ' : '';
    title.textContent = timeText + event.title + (event.visibility === 'private' ? ' (🔒 Privada)' : '');
    dateText.textContent = `${event.day} de ${monthName} de ${year}`;
    brandText.textContent = brandNames[event.industry] || 'Marca';

    // Exibir Responsável e Criador (sempre para Admin, se participar para User)
    const creatorInfo = document.getElementById('detailCreatorInfo');
    const assignedInfo = document.getElementById('detailAssignedInfo');
    if (creatorInfo) {
        const canSee = currentUserRole === 'COORDENADOR' || event.createdBy === currentUsername || event.assignedTo === currentUsername;
        if (canSee) {
            // Verificar se o criador é um coordenador
            let isCreatorAdmin = false;
            for (const div in users) {
                if (users[div][event.createdBy] && users[div][event.createdBy].role === 'COORDENADOR') {
                    isCreatorAdmin = true;
                    break;
                }
            }

            const displayName = (isCreatorAdmin && currentUserRole !== 'COORDENADOR') ? 'Coordenação' : getUserDisplayName(event.createdBy);
            creatorInfo.innerHTML = `<b>Criado por:</b> ${displayName}`;
            creatorInfo.style.display = 'block';
        } else {
            creatorInfo.style.display = 'none';
        }
    }
    if (assignedInfo) {
        assignedInfo.innerHTML = `<b>Responsável:</b> ${getUserDisplayName(event.assignedTo) || 'Não atribuído'}`;
    }

    const matrixNames = { 'do': 'Fazer Agora', 'schedule': 'Agendar', 'delegate': 'Delegar', 'eliminate': 'Eliminar' };
    priorityText.textContent = matrixNames[event.matrix];
    priorityText.style.backgroundColor = getMatrixColor(event.matrix);

    // Controle de botões baseado em permissão
    const toggleBtn = document.getElementById('toggleCompleteDetailBtn');
    if (toggleBtn) {
        toggleBtn.style.display = canEdit(event) ? 'block' : 'none';
        if (event.completed) {
            toggleBtn.textContent = 'Reabrir Tarefa';
            toggleBtn.style.background = '#f59e0b';
        } else {
            toggleBtn.textContent = 'Marcar como Concluída';
            toggleBtn.style.background = '#10b981';
        }
        toggleBtn.onclick = () => {
            toggleEventCompletion(fullKey, event.id);
            closeEventDetail();
        };
    }

    if (deleteBtn) {
        if (currentUserRole === 'COORDENADOR') {
            deleteBtn.textContent = event.archived ? 'Excluir Permanente' : 'Excluir/Arquivar';
            deleteBtn.style.display = 'block';
        } else {
            deleteBtn.textContent = 'Arquivar Tarefa';
            deleteBtn.style.display = canArchive(event) ? 'block' : 'none';
        }

        deleteBtn.onclick = () => {
            deleteEventFromSummary(fullKey, event.id);
            closeEventDetail();
        };
    }

    // Exibir Observações
    const descRow = document.getElementById('detailDescriptionRow');
    const descText = document.getElementById('detailDescriptionText');
    if (descRow && descText) {
        if (event.description) {
            descText.textContent = event.description;
            descRow.style.display = 'block';
        } else {
            descRow.style.display = 'none';
        }
    }

    // Exibir Anexo
    const attRow = document.getElementById('detailAttachmentRow');
    const attLink = document.getElementById('detailAttachmentLink');
    if (attRow && attLink) {
        if (event.attachment) {
            attLink.href = event.attachment;
            attLink.download = event.attachmentName || 'anexo';
            attLink.textContent = `📎 Baixar: ${event.attachmentName || 'Anexo'}`;
            attRow.style.display = 'block';
        } else {
            attRow.style.display = 'none';
        }
    }

    modal.style.display = 'flex';
}

function toggleEventCompletion(fullKey, eventId) {
    const event = eventsData[fullKey]?.find(e => e.id === eventId);
    if (!event) return;

    if (!canEdit(event)) {
        alert("Você não tem permissão para alterar esta tarefa.");
        return;
    }

    const action = event.completed ? 'REABERTURA' : 'CONCLUSÃO';
    event.completed = !event.completed;
    saveEvents();

    // Processa recorrência caso tenha completado uma tarefa recorrente
    if (event.completed && event.seriesId) {
        processRecurrences();
    }

    addAuditLog(action, event.id, event.title, event.industry, event.matrix);

    // Atualizar UI
    generateCalendar(currentDate);
    const summaryModal = document.getElementById('summaryModal');
    if (summaryModal && summaryModal.style.display === 'flex') openSummary();
    const dayDetailsModal = document.getElementById('dayDetailsModal');
    if (dayDetailsModal && dayDetailsModal.style.display === 'flex') {
        const [year, month] = fullKey.split('-').map(Number);
        openDayDetails(event.day, month - 1, year);
    }
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
    const passwordResetModal = document.getElementById('passwordResetModal');

    if (event.target == eventModal) closeModal();
    if (event.target == summaryModal) closeSummary();
    if (event.target == confirmModal) closeConfirmModal();
    if (event.target == dayDetailsModal) closeDayDetails();
    if (event.target == eventDetailModal) closeEventDetail();
    if (event.target == passwordResetModal) closePasswordReset();
}

document.getElementById('eventForm').onsubmit = async function (e) {
    e.preventDefault();
    const dateParts = document.getElementById('eventDate').value.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);

    const title = document.getElementById('eventTitle').value;
    const industry = document.getElementById('eventIndustry').value;
    const matrix = document.getElementById('eventMatrix').value;
    const time = document.getElementById('eventTime').value;
    const eventEndTimeInput = document.getElementById('eventEndTime');
    const endTime = eventEndTimeInput ? eventEndTimeInput.value : '';
    const description = document.getElementById('eventDescription').value;
    const visibility = document.getElementById('eventVisibility').value;
    const assignedToSelect = document.getElementById('eventAssignedTo');
    const assignedTo = (currentUserRole === 'COORDENADOR' && assignedToSelect.value) ? assignedToSelect.value : currentUsername;

    // Processamento do Anexo (Base64 limit 1MB)
    let base64Attachment = null;
    let attachmentName = null;
    const fileInput = document.getElementById('eventAttachment');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 1048576) {
            alert('O anexo deve ter no máximo 1MB para não travar o sistema.');
            return;
        }
        base64Attachment = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        attachmentName = file.name;
    }

    // Configurações de Recorrência
    const isRecurring = document.getElementById('eventRecurrenceCheck')?.checked;
    const recurrenceType = document.getElementById('eventRecurrenceType')?.value;
    const recurrenceEnd = document.getElementById('eventRecurrenceEnd')?.value;
    const seriesId = isRecurring ? 'series_' + Date.now() + Math.random().toString(36).substr(2, 9) : null;

    let instancesToCreate = 1;
    if (isRecurring && recurrenceEnd) {
        instancesToCreate = 3; // Cria até 3 instâncias iniciais como solicitado
    }

    let currentDateObj = new Date(year, month - 1, day);
    const endRecurrenceDateObj = recurrenceEnd ? new Date(recurrenceEnd + 'T00:00:00') : null;

    const reminderCheck = document.getElementById('eventReminder');
    const reminderTime = document.getElementById('eventReminderTime');

    for (let i = 0; i < instancesToCreate; i++) {
        if (endRecurrenceDateObj && currentDateObj > endRecurrenceDateObj) break;

        const curYear = currentDateObj.getFullYear();
        const curMonth = currentDateObj.getMonth() + 1;
        const curDay = currentDateObj.getDate();
        const curFullKey = `${curYear}-${String(curMonth).padStart(2, '0')}`;

        if (!eventsData[curFullKey]) {
            eventsData[curFullKey] = [];
        }

        const newEvent = {
            id: Date.now() + Math.random().toString(36).substr(2, 9) + i,
            day: curDay,
            industry,
            matrix,
            title,
            time,
            endTime,
            description,
            visibility,
            assignedTo: assignedTo,
            division: currentUserDivision,
            createdBy: currentUsername,
            createdByRole: currentUserRole
        };

        if (base64Attachment) {
            newEvent.attachment = base64Attachment;
            newEvent.attachmentName = attachmentName;
        }

        if (isRecurring) {
            newEvent.seriesId = seriesId;
            newEvent.recurrenceType = recurrenceType;
            newEvent.recurrenceEnd = recurrenceEnd;
        }

        if (reminderCheck && reminderCheck.checked && reminderTime && reminderTime.value) {
            newEvent.reminder = true;
            newEvent.reminderTime = reminderTime.value;
        }

        eventsData[curFullKey].push(newEvent);

        if (i === 0) {
            addAuditLog('CRIAÇÃO', newEvent.id, newEvent.title, newEvent.industry, newEvent.matrix);
        }

        // Avança a data
        if (isRecurring) {
            if (recurrenceType === 'daily') currentDateObj.setDate(currentDateObj.getDate() + 1);
            if (recurrenceType === 'weekly') currentDateObj.setDate(currentDateObj.getDate() + 7);
            if (recurrenceType === 'monthly') currentDateObj.setMonth(currentDateObj.getMonth() + 1);
        }
    }

    saveEvents();
    generateCalendar(currentDate);
    closeModal();
    if (fileInput) fileInput.value = '';
    document.getElementById('eventDescription').value = '';
    const recCheck = document.getElementById('eventRecurrenceCheck');
    if (recCheck) {
        recCheck.checked = false;
        document.getElementById('recurrenceOptions').style.display = 'none';
    }
    showToast(isRecurring ? "Série de tarefas iniciada com sucesso!" : "Tarefa criada com sucesso!");
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
        processRecurrences(); // Garante a criação de novas tarefas recorrentes pendentes ao entrar
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
        viewerGroup.style.display = 'none'; // Viewer NÃO escolhe usuário
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

    // Mostrar botões de ADMIN
    const adminAuditBtn = document.getElementById('adminAuditBtn');
    if (adminAuditBtn) {
        adminAuditBtn.style.display = (role === 'COORDENADOR') ? 'block' : 'none';
    }

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

    // Controle do campo Responsável no formulário (Apenas Admin delega)
    const assignedToGroup = document.getElementById('assignedToGroup');
    if (assignedToGroup) {
        assignedToGroup.style.display = (role === 'COORDENADOR') ? 'block' : 'none';
        if (role === 'COORDENADOR') populateAssignedToSelect();
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

        const customPasswords = JSON.parse(localStorage.getItem('eisenhowerPasswords')) || {};
        const isCustomPass = customPasswords[division] && customPasswords[division][user] === pass;
        const isDefaultPass = users[division] && users[division][user] && users[division][user].pass === pass;

        if (isCustomPass || isDefaultPass) {
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
// RECUPERAÇÃO / TROCA DE SENHA
// ========================================
function openPasswordReset() {
    document.getElementById('passwordResetModal').style.display = 'flex';
    document.getElementById('resetError').textContent = '';
    document.getElementById('resetSuccess').textContent = '';
}

function closePasswordReset() {
    document.getElementById('passwordResetModal').style.display = 'none';
}

function populateResetUserSelect(division) {
    const select = document.getElementById('resetUserSelect');
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

const passwordResetForm = document.getElementById('passwordResetForm');
if (passwordResetForm) {
    passwordResetForm.onsubmit = function (e) {
        e.preventDefault();
        const division = document.getElementById('resetDivision').value;
        const user = document.getElementById('resetUserSelect').value;
        const newPass = document.getElementById('resetNewPassword').value;

        if (!division || !user || !newPass) return;

        let customPasswords = JSON.parse(localStorage.getItem('eisenhowerPasswords')) || {};
        if (!customPasswords[division]) customPasswords[division] = {};

        customPasswords[division][user] = newPass;
        localStorage.setItem('eisenhowerPasswords', JSON.stringify(customPasswords));

        document.getElementById('resetSuccess').textContent = 'Senha atualizada com sucesso! Use-a para entrar.';
        document.getElementById('resetError').textContent = '';
        document.getElementById('resetNewPassword').value = '';

        setTimeout(() => {
            closePasswordReset();
        }, 2000);
    };
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
    const filterStatus = document.getElementById('filterStatus')?.value || 'all';

    const yearKey = currentDate.getFullYear();
    const monthKey = String(currentDate.getMonth() + 1).padStart(2, '0');
    const fullKey = `${yearKey}-${monthKey}`;
    const monthEvents = eventsData[fullKey] || [];

    return monthEvents.filter(event => {
        // SEGURANÇA: Só exporta o que o usuário pode VER
        let matchesUser = false;
        if (currentUserRole === 'COORDENADOR') {
            if (viewingUser !== 'all') {
                matchesUser = (event.createdBy === viewingUser || event.assignedTo === viewingUser);
            } else {
                matchesUser = true;
            }
        } else if (currentUserRole === 'USER') {
            const isOwner = event.createdBy === currentUsername && event.createdByRole === 'USER';
            const isAssigned = event.assignedTo === currentUsername;
            matchesUser = isOwner || isAssigned;
        } else {
            matchesUser = event.visibility === 'public';
        }

        // ISOLAMENTO DE DIVISÃO
        if (event.division && event.division !== currentUserDivision && !allowedAdmins.includes(currentUsername)) {
            matchesUser = false;
        }

        const mi = filterIndustry === 'all' || event.industry === filterIndustry;
        const mm = filterMatrix === 'all' || event.matrix === filterMatrix;
        const ms = !searchQuery || event.title.toLowerCase().includes(searchQuery);

        let matchesStatus = true;
        if (filterStatus === 'archived') {
            matchesStatus = event.archived === true;
        } else {
            if (event.archived) return false;
            if (filterStatus === 'pending') matchesStatus = !event.completed;
            if (filterStatus === 'completed') matchesStatus = event.completed;
        }

        return matchesUser && mi && mm && ms && matchesStatus;
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

    const completedPercentEl = document.getElementById('counterCompletedPercent');
    if (completedPercentEl) {
        const total = monthEvents.length;
        const completed = monthEvents.filter(e => e.completed).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        completedPercentEl.textContent = `${percent}%`;
    }
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

// ========================================
// 7. GOOGLE SHEETS SYNC
// ========================================
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby_GWWYa1LH9-uRyL37eNi9MEymzeJau5Ga04L3-qFdqMbYMYjYbz6I0KubqZk2kBlhNw/exec'; // URL CONFIGURADA

async function syncWithSheets() {
    const btn = document.getElementById('syncBtn');
    if (btn) {
        btn.style.animation = 'spin 1s linear infinite';
    }

    try {
        // 1. Garantir que os dados locais atuais estão salvos antes de mesclar
        saveEvents();

        // 2. Tentar baixar dados e logs da nuvem
        const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL);
        if (!response.ok) throw new Error('Falha na conexão com a nuvem.');

        const data = await response.json();
        const cloudEvents = data.eventsData || {};
        const cloudLogs = data.auditLogs || [];

        // 3. MESCLAGEM ROBUSTA: Local + Nuvem (Sem perdas)
        const newMergedData = { ...eventsData };

        Object.keys(cloudEvents).forEach(monthKey => {
            if (!newMergedData[monthKey]) {
                newMergedData[monthKey] = cloudEvents[monthKey];
            } else {
                // Adiciona apenas o que não existe localmente ou atualiza
                cloudEvents[monthKey].forEach(cloudEv => {
                    const localIdx = newMergedData[monthKey].findIndex(e => e.id === cloudEv.id);
                    if (localIdx === -1) {
                        newMergedData[monthKey].push(cloudEv);
                    } else {
                        // Se houver conflito, mantém a versão com mais metadados ou a da nuvem
                        newMergedData[monthKey][localIdx] = { ...newMergedData[monthKey][localIdx], ...cloudEv };
                    }
                });
            }
        });

        eventsData = newMergedData;
        saveEvents();
        generateCalendar(currentDate);

        // 4. Mesclagem de Logs
        const localLogs = JSON.parse(localStorage.getItem('eisenhowerAuditLogs')) || [];
        const combinedLogs = [...cloudLogs, ...localLogs].filter((v, i, a) =>
            a.findIndex(t => t.date === v.date && t.taskId === v.taskId) === i
        );
        localStorage.setItem('eisenhowerAuditLogs', JSON.stringify(combinedLogs.slice(-1000)));

        // 5. Enviar de volta para a nuvem
        await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                eventsData: eventsData,
                auditLogs: combinedLogs.slice(-1000)
            }),
            headers: { 'Content-Type': 'text/plain' }
        });

        showToast('Sincronização completa (Dados locais preservados)');
    } catch (err) {
        console.error('Erro na sincronização:', err);
        showToast('Falha ao sincronizar: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.style.animation = 'none';
        }
    }
}

function getUserDisplayName(username) {
    if (!username) return '';
    return username.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function populateAssignedToSelect() {
    const select = document.getElementById('eventAssignedTo');
    if (!select || !currentUserDivision) return;
    select.innerHTML = '<option value="">Selecione o Responsável</option>';
    const usersInDivision = users[currentUserDivision] || {};
    Object.keys(usersInDivision).forEach(username => {
        const displayName = getUserDisplayName(username);
        const opt = document.createElement('option');
        opt.value = username;
        opt.textContent = displayName;
        select.appendChild(opt);
    });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.5s forwards';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

function openAuditModal() {
    document.getElementById('auditModal').style.display = 'flex';
    renderAuditLogs();
}

function closeAuditModal() {
    document.getElementById('auditModal').style.display = 'none';
}

function renderAuditLogs() {
    const list = document.getElementById('auditLogList');
    const search = document.getElementById('auditSearch')?.value.toLowerCase() || '';
    if (!list) return;

    const logs = JSON.parse(localStorage.getItem('eisenhowerAuditLogs')) || [];
    list.innerHTML = '';

    const filteredLogs = logs.filter(log =>
        (log.user && log.user.toLowerCase().includes(search)) ||
        (log.title && log.title.toLowerCase().includes(search)) ||
        (log.action && log.action.toLowerCase().includes(search))
    ).reverse(); // Mais novos primeiro

    if (filteredLogs.length === 0) {
        list.innerHTML = '<div class="summary-empty">Nenhum log encontrado.</div>';
        return;
    }

    filteredLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'summary-item';

        const industryDisplay = log.industry ? `<span class="summary-item-brand ${log.industry}" style="font-size: 0.75em; padding: 2px 8px;">${brandNames[log.industry] || log.industry}</span>` : '';
        const matrixColor = getMatrixColor(log.matrix);
        const matrixDisplay = log.matrix ? `<div class="legend-color" style="background: ${matrixColor}; width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 5px;"></div>` : '';

        item.innerHTML = `
            <div class="summary-item-info" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span style="font-size: 0.8em; color: var(--accent); font-weight: 600;">${log.date}</span>
                    ${industryDisplay}
                </div>
                <span class="summary-item-title">
                    <b>${getUserDisplayName(log.user)}</b> 
                    <span style="color: var(--primary-color); font-weight: 600;">${log.action}</span>
                </span>
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
                    ${matrixDisplay}
                    <small style="opacity: 0.8; font-size: 0.9em;">Tarefa: <b>${log.title}</b></small>
                </div>
                <div style="font-size: 0.75em; opacity: 0.6; margin-top: 5px;">
                    ID: ${log.taskId} | Divisão: ${log.division?.toUpperCase()}
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

// --- EXPORTAÇÃO ---
function getFilteredEventsForExport() {
    const filterIndustry = document.getElementById('filterIndustry')?.value || 'all';
    const filterMatrix = document.getElementById('filterMatrix')?.value || 'all';
    const filterStatus = document.getElementById('filterStatus')?.value || 'all';
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';

    let exportedEvents = [];

    Object.keys(eventsData).forEach(fullKey => {
        const [year, month] = fullKey.split('-').map(Number);
        eventsData[fullKey].forEach(event => {
            const matchesIndustry = filterIndustry === 'all' || event.industry === filterIndustry;
            const matchesMatrix = filterMatrix === 'all' || event.matrix === filterMatrix;
            const matchesSearch = !searchQuery || event.title.toLowerCase().includes(searchQuery);

            let matchesStatus = true;
            if (filterStatus === 'archived') {
                matchesStatus = event.archived === true;
            } else {
                if (event.archived) matchesStatus = false;
                else if (filterStatus === 'pending') matchesStatus = !event.completed;
                else if (filterStatus === 'completed') matchesStatus = event.completed;
            }

            let matchesUser = false;
            if (currentUserRole === 'COORDENADOR') {
                if (viewingUser !== 'all') {
                    matchesUser = (event.createdBy === viewingUser || event.assignedTo === viewingUser);
                } else {
                    matchesUser = true;
                }
            } else if (currentUserRole === 'USER') {
                const isOwner = event.createdBy === currentUsername;
                const isAssigned = event.assignedTo === currentUsername;
                matchesUser = isOwner || isAssigned;
            } else {
                matchesUser = event.visibility === 'public';
            }

            const isFromCurrentDivision = event.division === currentUserDivision || (allowedAdmins.includes(currentUsername));
            if (!isFromCurrentDivision) {
                matchesUser = false;
            }

            if (matchesIndustry && matchesMatrix && matchesStatus && matchesSearch && matchesUser) {
                exportedEvents.push({ ...event, month, year });
            }
        });
    });

    exportedEvents.sort((a, b) => (a.year * 10000 + a.month * 100 + a.day) - (b.year * 10000 + b.month * 100 + b.day));
    return exportedEvents;
}

function getExportHeader() {
    const now = new Date();
    return {
        title: `RELATÓRIO AGENDA - ${currentUserDivision.toUpperCase()}`,
        month: document.getElementById('currentMonthDisplay')?.textContent || '',
        user: `${getUserDisplayName(currentUsername)} (${currentUserRole})`,
        viewing: viewingUser === 'all' ? 'Equipe Completa' : getUserDisplayName(viewingUser),
        date: now.toLocaleString('pt-BR'),
        filters: `Status: ${document.getElementById('filterStatus')?.options[document.getElementById('filterStatus').selectedIndex].text} | Indústria: ${document.getElementById('filterIndustry')?.options[document.getElementById('filterIndustry').selectedIndex].text}`
    };
}

function exportExcel() {
    const events = getFilteredEventsForExport();
    const header = getExportHeader();

    // Preparar dados
    const data = [
        [header.title],
        [`Mês: ${header.month}`, `Usuário: ${header.user}`],
        [`Visualizando: ${header.viewing}`, `Exportado: ${header.date}`],
        [`Filtros: ${header.filters}`, `Total de Tarefas: ${events.length}`],
        [],
        ['DIA', 'TÍTULO', 'MARCA', 'PRIORIDADE', 'HORA', 'CONCLUÍDA', 'RESPONSÁVEL', 'CRIADO POR', 'VISIBILIDADE', 'DIVISÃO', 'OBSERVAÇÕES', 'ARQUIVADA', 'LEMBRETE']
    ];

    let completedCount = 0;

    events.forEach(e => {
        if (e.completed) completedCount++;
        const timeStr = e.time ? e.time + (e.endTime ? ` até ${e.endTime}` : '') : '-';
        const matrixNames = { 'do': 'Fazer Agora', 'schedule': 'Agendar', 'delegate': 'Delegar', 'eliminate': 'Eliminar' };

        data.push([
            `${String(e.day).padStart(2, '0')}/${String(e.month).padStart(2, '0')}`,
            e.title,
            brandNames[e.industry] || '-',
            matrixNames[e.matrix] || '-',
            timeStr,
            e.completed ? 'SIM' : 'NÃO',
            getUserDisplayName(e.assignedTo) || '-',
            getUserDisplayName(e.createdBy) || '-',
            e.visibility === 'public' ? 'Pública' : 'Privada',
            (e.division || '').toUpperCase(),
            e.description || '-',
            e.archived ? 'SIM' : 'NÃO',
            e.reminder ? `SIM (${e.reminderTime})` : 'NÃO'
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Auto-size columns slightly
    const wscols = [
        { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 15 }
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agenda");

    const fileName = `agenda_${currentUserDivision.toUpperCase()}_${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, '0')}_${currentUsername.replace(/\./g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    showToast("Excel exportado com sucesso!");
    closeExportDropdown();
}

function exportPDF() {
    const events = getFilteredEventsForExport();
    const headerData = getExportHeader();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    doc.setFontSize(16);
    doc.text(headerData.title, 14, 15);

    doc.setFontSize(10);
    doc.text(`Mês: ${headerData.month} | Usuário: ${headerData.user}`, 14, 22);
    doc.text(`Visualizando: ${headerData.viewing}`, 14, 27);
    doc.text(`Exportado: ${headerData.date}`, 14, 32);

    let completedCount = 0;
    const tableData = events.map(e => {
        if (e.completed) completedCount++;
        const timeStr = e.time ? e.time + (e.endTime ? ` - ${e.endTime}` : '') : '-';
        const matrixNames = { 'do': 'Fazer Agora', 'schedule': 'Agendar', 'delegate': 'Delegar', 'eliminate': 'Eliminar' };

        return [
            `${String(e.day).padStart(2, '0')}/${String(e.month).padStart(2, '0')}`,
            e.title.length > 25 ? e.title.substring(0, 25) + '...' : e.title,
            (brandNames[e.industry] || '-').substring(0, 10),
            matrixNames[e.matrix] || '-',
            timeStr,
            e.completed ? 'SIM' : 'NÃO',
            (getUserDisplayName(e.assignedTo) || '-').split(' ')[0],
            (getUserDisplayName(e.createdBy) || '-').split(' ')[0],
            e.visibility === 'public' ? 'Pública' : 'Privada',
            (e.division || '').toUpperCase(),
            (e.description || '-').substring(0, 20),
            e.archived ? 'SIM' : 'NÃO',
            e.reminder ? 'SIM' : 'NÃO'
        ];
    });

    doc.text(`Total: ${events.length} tarefas | Concluídas: ${completedCount} (${events.length > 0 ? Math.round((completedCount / events.length) * 100) : 0}%)`, 14, 37);
    doc.text(`Filtros: ${headerData.filters}`, 14, 42);

    doc.autoTable({
        startY: 47,
        head: [['DIA', 'TÍTULO', 'MARCA', 'PRIORIDADE', 'HORA', 'CONCLUÍDA', 'RESPONSÁVEL', 'CRIADO POR', 'VISIBILIDADE', 'DIVISÃO', 'OBSERVAÇÕES', 'ARQ.', 'LEMBRETE']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });

    const fileName = `agenda_${currentUserDivision.toUpperCase()}_${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, '0')}_${currentUsername.replace(/\./g, '_')}.pdf`;
    doc.save(fileName);

    showToast("PDF exportado com sucesso!");
    closeExportDropdown();
}

function toggleExportDropdown() {
    const dropdown = document.getElementById('exportDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

function closeExportDropdown() {
    const dropdown = document.getElementById('exportDropdown');
    if (dropdown) dropdown.style.display = 'none';
}

window.addEventListener('click', function (e) {
    if (!e.target.closest('.export-wrapper')) {
        closeExportDropdown();
    }
});

// --- RECORRÊNCIAS INTELIGENTES ---
function processRecurrences() {
    const seriesMap = {};

    Object.keys(eventsData).forEach(fullKey => {
        const [year, month] = fullKey.split('-').map(Number);
        eventsData[fullKey].forEach(event => {
            if (event.seriesId) {
                if (!seriesMap[event.seriesId]) {
                    seriesMap[event.seriesId] = {
                        events: [],
                        type: event.recurrenceType,
                        endDate: event.recurrenceEnd,
                        template: event
                    };
                }
                const eventDate = new Date(year, month - 1, event.day);
                seriesMap[event.seriesId].events.push({ ...event, fullKey, eventDate });
            }
        });
    });

    let updated = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    Object.keys(seriesMap).forEach(seriesId => {
        const series = seriesMap[seriesId];
        series.events.sort((a, b) => a.eventDate - b.eventDate);
        const lastInstance = series.events[series.events.length - 1];

        const activeInstances = series.events.filter(e => {
            return !e.completed && e.eventDate >= today;
        });

        const targetActiveCount = 3;

        if (activeInstances.length < targetActiveCount) {
            const endRecurrenceDateObj = series.endDate ? new Date(series.endDate + 'T00:00:00') : null;
            let instancesToGenerate = targetActiveCount - activeInstances.length;
            let currentDateObj = new Date(lastInstance.eventDate);

            for (let i = 0; i < instancesToGenerate; i++) {
                if (series.type === 'daily') currentDateObj.setDate(currentDateObj.getDate() + 1);
                if (series.type === 'weekly') currentDateObj.setDate(currentDateObj.getDate() + 7);
                if (series.type === 'monthly') currentDateObj.setMonth(currentDateObj.getMonth() + 1);

                if (endRecurrenceDateObj && currentDateObj > endRecurrenceDateObj) break;

                const curYear = currentDateObj.getFullYear();
                const curMonth = currentDateObj.getMonth() + 1;
                const curDay = currentDateObj.getDate();
                const curFullKey = `${curYear}-${String(curMonth).padStart(2, '0')}`;

                if (!eventsData[curFullKey]) {
                    eventsData[curFullKey] = [];
                }

                const newEvent = { ...series.template };
                newEvent.id = Date.now() + Math.random().toString(36).substr(2, 9) + i;
                newEvent.day = curDay;
                newEvent.completed = false;

                eventsData[curFullKey].push(newEvent);
                updated = true;
            }
        }
    });

    if (updated) saveEvents();
}