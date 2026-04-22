const industries = {
    nivea: '#0077be',
    cargill: '#d32f2f',
    reckitt: '#00a651'
};

const eisenhower = {
    'do': 'matrix-do',
    'schedule': 'matrix-schedule',
    'delegate': 'matrix-delegate',
    'eliminate': 'matrix-eliminate'
};

let currentDate = new Date();
let selectedDate = new Date();

// Dados de exemplo - eventos por indústria e matriz Eisenhower
const eventsData = {
    1: [ // Janeiro
        { day: 5, industry: 'nivea', matrix: 'do', title: 'Lançamento Creme Nivea' },
        { day: 12, industry: 'cargill', matrix: 'schedule', title: 'Reunião Fornecedores Cargill' },
        { day: 18, industry: 'reckitt', matrix: 'delegate', title: 'Campanha Dettol Reckitt' },
        { day: 25, industry: 'nivea', matrix: 'eliminate', title: 'Treinamento Equipe' }
    ],
    2: [ // Fevereiro
        { day: 3, industry: 'cargill', matrix: 'do', title: 'Auditoria Cargill' },
        { day: 14, industry: 'reckitt', matrix: 'schedule', title: 'Dia dos Namorados - Reckitt' },
        { day: 28, industry: 'nivea', matrix: 'do', title: 'Feira de Beleza Nivea' }
    ]
};

const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function generateCalendar(date) {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

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
            const monthEvents = eventsData[date.getMonth() + 1] || [];
            const dayEvents = monthEvents.filter(event => event.day === dayNumber);

            if (dayEvents.length > 0) {
                dayEvents.slice(0, 3).forEach(event => { // Máximo 3 eventos por dia
                    const eventSpan = document.createElement('span');
                    eventSpan.className = `event ${event.industry} ${eisenhower[event.matrix] || ''}`;
                    eventSpan.title = event.title;
                    eventSpan.textContent = event.title.substring(0, 15) + (event.title.length > 15 ? '...' : '');
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
            console.log(`Data selecionada: ${cellDate.toLocaleDateString('pt-BR')}`);
            // Aqui você pode adicionar lógica para modal de detalhes
        });

        calendar.appendChild(cell);
    }

    // Atualizar header
    document.querySelector('.header h1').textContent =
        `📅 ${date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;

    // Atualizar o input de mês
    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        monthFilter.value = `${year}-${month}`;
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

// Inicializar calendário
generateCalendar(currentDate);
