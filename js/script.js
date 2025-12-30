// Activity Dashboard JavaScript

// Color definitions
const COLORS = {
    sport: '#4fc3f7',
    work: '#ff6b6b',
    goals: '#51cf66'
};

// Data storage
let activities = JSON.parse(localStorage.getItem('activities')) || {};
let comments = JSON.parse(localStorage.getItem('comments')) || {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeContributionGrid();
    initializeCharts();
    setupModal();
});

// Initialize contribution grid (GitHub-style)
function initializeContributionGrid() {
    const grid = document.getElementById('contributionGrid');
    const monthLabels = document.getElementById('monthLabels');
    
    grid.innerHTML = '';
    monthLabels.innerHTML = '';
    
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-12-31');
    
    // Get first day of year (what day of week it starts on)
    // GitHub uses Monday as first day, so we adjust: 0=Sunday -> 6, 1=Monday -> 0, etc.
    let firstDay = startDate.getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // Convert to Monday=0 format
    
    // Organize days by weeks (columns)
    const weeks = [];
    let currentWeek = [];
    let previousMonth = -1;
    
    // Add empty cells for days before the year starts
    for (let i = 0; i < firstDay; i++) {
        currentWeek.push(null); // null = empty day
    }
    
    // Generate all days of 2026, organized by weeks
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const month = currentDate.getMonth();
        const dateStr = formatDate(currentDate);
        
        // Check if we need to add spacing (new month starts in this week)
        if (previousMonth !== -1 && month !== previousMonth && currentWeek.length > 0 && currentWeek.length < 7) {
            // New month started mid-week, mark this week as needing spacing
            // We'll handle spacing when rendering weeks
        }
        
        currentWeek.push({
            date: new Date(currentDate),
            dateStr: dateStr,
            month: month
        });
        
        // If week is complete (7 days), start a new week
        if (currentWeek.length === 7) {
            weeks.push([...currentWeek]);
            currentWeek = [];
        }
        
        previousMonth = month;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add remaining days as last week
    if (currentWeek.length > 0) {
        // Fill remaining days with null
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }
    
    // Render weeks as columns
    let previousWeekMonth = -1;
    weeks.forEach((week, weekIndex) => {
        // Check if this week starts a new month
        const weekFirstDay = week.find(day => day !== null);
        const weekMonth = weekFirstDay ? weekFirstDay.month : -1;
        
        // Add spacing between months (when a new month starts in a new week column)
        if (previousWeekMonth !== -1 && weekMonth !== previousWeekMonth && weekMonth !== -1) {
            const spacer = document.createElement('div');
            spacer.className = 'week-spacer';
            grid.appendChild(spacer);
            
            const spacerLabel = document.createElement('div');
            spacerLabel.className = 'month-label week-spacer';
            monthLabels.appendChild(spacerLabel);
        }
        
        // Create week column
        const weekColumn = document.createElement('div');
        weekColumn.className = 'week-column';
        
        // Add month label for first week of each month
        if (weekMonth !== previousWeekMonth && weekMonth !== -1) {
            const monthLabel = document.createElement('div');
            monthLabel.className = 'month-label';
            monthLabel.textContent = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][weekMonth];
            monthLabels.appendChild(monthLabel);
        } else {
            const emptyLabel = document.createElement('div');
            emptyLabel.className = 'month-label';
            monthLabels.appendChild(emptyLabel);
        }
        
        // Add days to week column (vertical)
        week.forEach((day, dayIndex) => {
            if (day === null) {
                // Empty day (before year starts or after year ends)
                const emptyCell = document.createElement('div');
                emptyCell.className = 'day-tile';
                emptyCell.style.visibility = 'hidden';
                weekColumn.appendChild(emptyCell);
            } else {
                const dayTile = document.createElement('div');
                dayTile.className = 'day-tile';
                dayTile.dataset.date = day.dateStr;
                
                // Check if date has activities
                if (activities[day.dateStr]) {
                    const activityTypes = activities[day.dateStr];
                    dayTile.className = getActivityClass(activityTypes);
                }
                
                // Add tooltip
                const activityText = activities[day.dateStr] ? activities[day.dateStr].join(', ') : 'No activities';
                dayTile.title = `${formatDateReadable(day.date)}\n${activityText}`;
                
                // Add click handler
                dayTile.addEventListener('click', () => openModal(new Date(day.date), day.dateStr));
                
                weekColumn.appendChild(dayTile);
            }
        });
        
        grid.appendChild(weekColumn);
        previousWeekMonth = weekMonth;
    });
}

// Get CSS class for activity combination
function getActivityClass(activityTypes) {
    const hasSport = activityTypes.includes('sport');
    const hasWork = activityTypes.includes('work');
    const hasGoals = activityTypes.includes('goals');
    
    const count = (hasSport ? 1 : 0) + (hasWork ? 1 : 0) + (hasGoals ? 1 : 0);
    
    if (count === 3) return 'day-tile multiple';
    if (hasSport && hasWork) return 'day-tile sport-work';
    if (hasSport && hasGoals) return 'day-tile sport-goals';
    if (hasWork && hasGoals) return 'day-tile work-goals';
    if (hasSport) return 'day-tile sport';
    if (hasWork) return 'day-tile work';
    if (hasGoals) return 'day-tile goals';
    
    return 'day-tile';
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display
function formatDateReadable(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Modal setup
let currentSelectedDate = null;
let currentSelectedActivities = [];

function setupModal() {
    const modal = document.getElementById('activityModal');
    const closeBtn = document.querySelector('.close');
    const saveBtn = document.getElementById('saveActivity');
    const activityBtns = document.querySelectorAll('.activity-btn');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    activityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const activity = btn.dataset.activity;
            const index = currentSelectedActivities.indexOf(activity);
            
            if (index > -1) {
                currentSelectedActivities.splice(index, 1);
                btn.classList.remove('active');
            } else {
                currentSelectedActivities.push(activity);
                btn.classList.add('active');
            }
            
            updateSelectedActivitiesDisplay();
        });
    });
    
    saveBtn.addEventListener('click', () => {
        if (currentSelectedDate) {
            const commentTextarea = document.getElementById('activityComment');
            const comment = commentTextarea.value.trim();
            
            if (currentSelectedActivities.length > 0) {
                activities[currentSelectedDate] = [...currentSelectedActivities];
            } else {
                delete activities[currentSelectedDate];
            }
            
            if (comment) {
                comments[currentSelectedDate] = comment;
            } else {
                delete comments[currentSelectedDate];
            }
            
            localStorage.setItem('activities', JSON.stringify(activities));
            localStorage.setItem('comments', JSON.stringify(comments));
            initializeContributionGrid();
            updateCharts();
            modal.style.display = 'none';
        }
    });
}

function openModal(date, dateStr) {
    const modal = document.getElementById('activityModal');
    const modalDate = document.getElementById('modalDate');
    const commentTextarea = document.getElementById('activityComment');
    
    currentSelectedDate = dateStr;
    currentSelectedActivities = activities[dateStr] ? [...activities[dateStr]] : [];
    
    modalDate.textContent = formatDateReadable(date);
    
    // Load existing comment
    commentTextarea.value = comments[dateStr] || '';
    
    // Update button states
    document.querySelectorAll('.activity-btn').forEach(btn => {
        if (currentSelectedActivities.includes(btn.dataset.activity)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    updateSelectedActivitiesDisplay();
    modal.style.display = 'block';
}

function updateSelectedActivitiesDisplay() {
    const container = document.getElementById('selectedActivities');
    container.innerHTML = '';
    
    if (currentSelectedActivities.length === 0) {
        container.innerHTML = '<span style="color: var(--text-secondary);">No activities selected</span>';
        return;
    }
    
    currentSelectedActivities.forEach(activity => {
        const tag = document.createElement('span');
        tag.className = `selected-activity-tag ${activity}`;
        tag.textContent = activity.charAt(0).toUpperCase() + activity.slice(1);
        container.appendChild(tag);
    });
}

// Charts initialization
let lineChart = null;
let pieChart = null;
let radarChart = null;
let correlationChart = null;

function initializeCharts() {
    initializeLineChart();
    initializePieChart();
    initializeRadarChart();
    initializeCorrelationChart();
}

function initializeLineChart() {
    const ctx = document.getElementById('lineChart').getContext('2d');
    
    const data = getChartData();
    
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Sport',
                    data: data.sport,
                    borderColor: COLORS.sport,
                    backgroundColor: `${COLORS.sport}30`,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Work',
                    data: data.work,
                    borderColor: COLORS.work,
                    backgroundColor: `${COLORS.work}30`,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Goals',
                    data: data.goals,
                    borderColor: COLORS.goals,
                    backgroundColor: `${COLORS.goals}30`,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e8eaed'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(20, 25, 46, 0.95)',
                    titleColor: '#e8eaed',
                    bodyColor: '#e8eaed',
                    borderColor: '#2a3142',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#a8b3c0'
                    },
                    grid: {
                        color: '#2a3142'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#a8b3c0'
                    }
                }
            }
        }
    });
}

function initializePieChart() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    const data = getPieChartData();
    
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Sport', 'Work'],
            datasets: [{
                data: [data.sport, data.work],
                backgroundColor: [COLORS.sport, COLORS.work],
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#e8eaed'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(20, 25, 46, 0.95)',
                    titleColor: '#e8eaed',
                    bodyColor: '#e8eaed',
                    borderColor: '#2a3142',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = data.sport + data.work;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function getChartData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sportData = new Array(12).fill(0);
    const workData = new Array(12).fill(0);
    const goalsData = new Array(12).fill(0);
    
    Object.keys(activities).forEach(dateStr => {
        const date = new Date(dateStr);
        const month = date.getMonth();
        const activityTypes = activities[dateStr];
        
        if (activityTypes.includes('sport')) sportData[month]++;
        if (activityTypes.includes('work')) workData[month]++;
        if (activityTypes.includes('goals')) goalsData[month]++;
    });
    
    return {
        labels: months,
        sport: sportData,
        work: workData,
        goals: goalsData
    };
}

function getPieChartData() {
    let sportCount = 0;
    let workCount = 0;
    
    Object.keys(activities).forEach(dateStr => {
        const activityTypes = activities[dateStr];
        if (activityTypes.includes('sport')) sportCount++;
        if (activityTypes.includes('work')) workCount++;
    });
    
    return {
        sport: sportCount,
        work: workCount
    };
}

function initializeRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    const data = getRadarChartData();
    
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Sport', 'Work', 'Goals'],
            datasets: [{
                label: 'Activity Balance',
                data: [data.sport, data.work, data.goals],
                borderColor: COLORS.sport,
                backgroundColor: `${COLORS.sport}30`,
                pointBackgroundColor: COLORS.sport,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: COLORS.sport,
                borderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1.2,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(20, 25, 46, 0.95)',
                    titleColor: '#e8eaed',
                    bodyColor: '#e8eaed',
                    borderColor: '#2a3142',
                    borderWidth: 1
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#a8b3c0',
                        backdropColor: 'transparent'
                    },
                    grid: {
                        color: '#2a3142'
                    },
                    pointLabels: {
                        color: '#e8eaed',
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                }
            }
        }
    });
}

function initializeCorrelationChart() {
    const ctx = document.getElementById('correlationChart').getContext('2d');
    
    const data = getCorrelationData();
    
    correlationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Sport + Work', 'Sport + Goals', 'Work + Goals', 'All Three', 'Sport Only', 'Work Only', 'Goals Only'],
            datasets: [{
                label: 'Days',
                data: [
                    data.sportWork,
                    data.sportGoals,
                    data.workGoals,
                    data.allThree,
                    data.sportOnly,
                    data.workOnly,
                    data.goalsOnly
                ],
                backgroundColor: [
                    `rgba(79, 195, 247, 0.7)`,
                    `rgba(81, 207, 102, 0.7)`,
                    `rgba(255, 107, 107, 0.7)`,
                    `rgba(147, 51, 234, 0.7)`,
                    `${COLORS.sport}80`,
                    `${COLORS.work}80`,
                    `${COLORS.goals}80`
                ],
                borderColor: [
                    COLORS.sport,
                    COLORS.goals,
                    COLORS.work,
                    '#9333ea',
                    COLORS.sport,
                    COLORS.work,
                    COLORS.goals
                ],
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(20, 25, 46, 0.95)',
                    titleColor: '#e8eaed',
                    bodyColor: '#e8eaed',
                    borderColor: '#2a3142',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#a8b3c0'
                    },
                    grid: {
                        color: '#2a3142'
                    }
                },
                x: {
                    ticks: {
                        color: '#a8b3c0',
                        font: {
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function getRadarChartData() {
    let sportCount = 0;
    let workCount = 0;
    let goalsCount = 0;
    
    Object.keys(activities).forEach(dateStr => {
        const activityTypes = activities[dateStr];
        if (activityTypes.includes('sport')) sportCount++;
        if (activityTypes.includes('work')) workCount++;
        if (activityTypes.includes('goals')) goalsCount++;
    });
    
    // Normalize to percentage for better visualization
    const total = sportCount + workCount + goalsCount;
    const max = Math.max(sportCount, workCount, goalsCount, 1);
    
    return {
        sport: total > 0 ? Math.round((sportCount / max) * 100) : 0,
        work: total > 0 ? Math.round((workCount / max) * 100) : 0,
        goals: total > 0 ? Math.round((goalsCount / max) * 100) : 0
    };
}

function getCorrelationData() {
    let sportWork = 0;
    let sportGoals = 0;
    let workGoals = 0;
    let allThree = 0;
    let sportOnly = 0;
    let workOnly = 0;
    let goalsOnly = 0;
    
    Object.keys(activities).forEach(dateStr => {
        const activityTypes = activities[dateStr];
        const hasSport = activityTypes.includes('sport');
        const hasWork = activityTypes.includes('work');
        const hasGoals = activityTypes.includes('goals');
        
        const count = (hasSport ? 1 : 0) + (hasWork ? 1 : 0) + (hasGoals ? 1 : 0);
        
        if (count === 3) {
            allThree++;
        } else if (hasSport && hasWork) {
            sportWork++;
        } else if (hasSport && hasGoals) {
            sportGoals++;
        } else if (hasWork && hasGoals) {
            workGoals++;
        } else if (hasSport) {
            sportOnly++;
        } else if (hasWork) {
            workOnly++;
        } else if (hasGoals) {
            goalsOnly++;
        }
    });
    
    return {
        sportWork,
        sportGoals,
        workGoals,
        allThree,
        sportOnly,
        workOnly,
        goalsOnly
    };
}

function updateCharts() {
    if (lineChart) {
        const data = getChartData();
        lineChart.data.labels = data.labels;
        lineChart.data.datasets[0].data = data.sport;
        lineChart.data.datasets[1].data = data.work;
        lineChart.data.datasets[2].data = data.goals;
        lineChart.update();
    }
    
    if (pieChart) {
        const data = getPieChartData();
        pieChart.data.datasets[0].data = [data.sport, data.work];
        pieChart.update();
    }
    
    if (radarChart) {
        const data = getRadarChartData();
        radarChart.data.datasets[0].data = [data.sport, data.work, data.goals];
        radarChart.update();
    }
    
    if (correlationChart) {
        const data = getCorrelationData();
        correlationChart.data.datasets[0].data = [
            data.sportWork,
            data.sportGoals,
            data.workGoals,
            data.allThree,
            data.sportOnly,
            data.workOnly,
            data.goalsOnly
        ];
        correlationChart.update();
    }
}

