

// Global state
let allSchools = [];
let currentPage = 'home';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    await loadSchools();
    setupSearch();
});

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateToPage(page);
        });
    });

    // Handle hash changes
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1) || 'home';
        navigateToPage(hash);
    });

    // Initial page load
    const hash = window.location.hash.slice(1) || 'home';
    navigateToPage(hash);
}

function navigateToPage(page) {
    currentPage = page;
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    // Show/hide sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${page}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update URL
    window.location.hash = page;
}

// Load schools data
async function loadSchools() {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('schools-grid');
    
    if (loading) loading.style.display = 'block';
    
    try {
        const response = await fetch('/api/schools');
        const data = await response.json();
        allSchools = data;
        
        displaySchools(allSchools);
    } catch (error) {
        console.error('Error loading schools:', error);
        if (grid) {
            grid.innerHTML = '<p class="no-results">데이터를 불러오는데 실패했습니다.</p>';
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// Display schools
function displaySchools(schools) {
    const grid = document.getElementById('schools-grid');
    const noResults = document.getElementById('no-results');
    
    if (!grid) return;
    
    if (schools.length === 0) {
        grid.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    if (noResults) noResults.style.display = 'none';
    
    grid.innerHTML = schools.slice(0, 50).map(school => createSchoolCard(school)).join('');
    
    // Add click handlers
    grid.querySelectorAll('.school-card').forEach((card, index) => {
        card.addEventListener('click', () => showSchoolDetail(schools[index]));
    });
}

// Create school card HTML
function createSchoolCard(school) {
    const facilities = [
        { label: '주출입구 접근로', value: school.주출입구접근로설치여부 },
        { label: '장애인 주차구역', value: school.장애인주차구역지정여부 },
        { label: '출입구(문)', value: school['출입구(문)설치여부'] },
        { label: '장애인 화장실', value: school.장애인대변기설치여부 }
    ];
    
    return `
        <div class="school-card">
            <div class="school-card-header">
                <h3 class="school-name">${school.학교명}</h3>
                <div class="school-meta">
                    <span class="school-badge">${school.학교급명}</span>
                    <span class="school-badge">${school.설립구분명}</span>
                </div>
            </div>
            <div class="school-facilities">
                ${facilities.map(f => `
                    <div class="facility-item">
                        <div class="facility-icon ${f.value === 'Y' ? 'available' : 'unavailable'}">
                            ${f.value === 'Y' ? '✓' : '✗'}
                        </div>
                        <span>${f.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('school-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query === '') {
                displaySchools(allSchools);
            } else {
                const filtered = allSchools.filter(school => 
                    school.학교명.toLowerCase().includes(query) ||
                    school.지역명?.toLowerCase().includes(query)
                );
                displaySchools(filtered);
            }
        });
    }
}

// Search from hero section
function searchFromHero() {
    const heroSearch = document.getElementById('hero-search');
    const schoolSearch = document.getElementById('school-search');
    
    if (heroSearch && schoolSearch) {
        const query = heroSearch.value;
        schoolSearch.value = query;
        navigateToPage('schools');
        
        // Trigger search
        setTimeout(() => {
            const event = new Event('input', { bubbles: true });
            schoolSearch.dispatchEvent(event);
        }, 100);
    }
}

// Show school detail modal
function showSchoolDetail(school) {
    const modal = document.getElementById('school-modal');
    const modalName = document.getElementById('modal-school-name');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalName || !modalBody) return;
    
    modalName.textContent = school.학교명;
    
    const facilities = [
        { label: '기준년도', value: school.기준년도 },
        { label: '시군명', value: school.시군명 },
        { label: '지역교육청명', value: school.지역교육청명 },
        { label: '지역명', value: school.지역명 },
        { label: '학교급명', value: school.학교급명 },
        { label: '설립구분명', value: school.설립구분명 },
        { label: '주출입구 접근로 설치', value: school.주출입구접근로설치여부 },
        { label: '장애인 주차구역 지정', value: school.장애인주차구역지정여부 },
        { label: '주출입구 높이차이 제거', value: school.주출입구높이차이제거여부 },
        { label: '출입구(문) 설치', value: school['출입구(문)설치여부'] },
        { label: '복도 설치', value: school.복도설치여부 },
        { label: '계단/승강기/경사로', value: school['계단/승강기/경사로/휠체어리프트설치여부'] },
        { label: '장애인 대변기 설치', value: school.장애인대변기설치여부 },
        { label: '장애인 소변기 설치', value: school.장애인소변기설치여부 },
        { label: '점자블록 설치', value: school.점자블록설치여부 },
        { label: '유도 및 안내설비', value: school.유도및안내설비설치여부 },
        { label: '경보 및 피난설비', value: school.경보및피난설비설치여부 }
    ];
    
    modalBody.innerHTML = facilities.map(f => {
        let statusHtml = '';
        if (f.value === 'Y' || f.value === 'N') {
            statusHtml = `<span class="status-badge ${f.value === 'Y' ? 'yes' : 'no'}">
                ${f.value === 'Y' ? '설치됨' : '미설치'}
            </span>`;
        } else {
            statusHtml = `<span>${f.value || '-'}</span>`;
        }
        
        return `
            <div class="facility-detail">
                <span class="facility-label">${f.label}</span>
                <div class="facility-status">${statusHtml}</div>
            </div>
        `;
    }).join('');
    
    modal.classList.add('active');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('school-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('school-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// Export functions to global scope
window.searchFromHero = searchFromHero;
window.closeModal = closeModal;
