
// Google Sheets 설정
const SPREADSHEET_ID = "1yX5pgNNbElsEh13vnEQ_A9aBsQmfKBeoPPRKwYqJ-zw";
const SHEET_NAME = "school";

// 전역 변수
let allSchools = [];
let filteredSchools = [];

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadSchoolsFromGoogleSheets();
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 네비게이션
    document.querySelectorAll('.header nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = e.target.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
    
    // 제보 폼
    document.getElementById('reportForm').addEventListener('submit', handleReportSubmit);
    
    // 검색 엔터키
    document.getElementById('searchSchool').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchSchools();
    });
    document.getElementById('searchCity').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchSchools();
    });
}

// 섹션 전환
function showSection(sectionId) {
    // 모든 섹션 숨기기
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 선택된 섹션 표시
    document.getElementById(sectionId).classList.add('active');
    
    // 네비게이션 활성화
    document.querySelectorAll('.header nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
        }
    });
    
    // 학교 섹션이면 학교 목록 로드
    if (sectionId === 'schools' && allSchools.length > 0) {
        displaySchools(allSchools.slice(0, 100));
    }
}

// Google Sheets에서 데이터 로드
async function loadSchoolsFromGoogleSheets() {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('데이터를 불러올 수 없습니다.');
        }
        
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        // 헤더 제외하고 데이터 파싱
        allSchools = rows.slice(1).map((row, index) => ({
            id: `school-${index}`,
            기준년도: row[0] || "",
            시군명: row[1] || "",
            지역교육청명: row[2] || "",
            지역명: row[3] || "",
            학교명: row[4] || "",
            학교급명: row[5] || "",
            설립구분명: row[6] || "",
            제외여부: row[7] || "",
            제외사유: row[8] || "",
            주출입구접근로설치여부: row[9] || "",
            장애인주차구역지정여부: row[10] || "",
            주출입구높이차이제거여부: row[11] || "",
            출입구설치여부: row[12] || "",
            복도설치여부: row[13] || "",
            계단승강기경사로휠체어리프트설치여부: row[14] || "",
            장애인대변기설치여부: row[15] || "",
            장애인소변기설치여부: row[16] || "",
            점자블록설치여부: row[17] || "",
            유도및안내설비설치여부: row[18] || "",
            경보및피난설비설치여부: row[19] || "",
            접근성점수: calculateAccessibilityScore(row)
        }));
        
        updateStats();
        displaySchools(allSchools.slice(0, 100));
        
    } catch (error) {
        console.error('Error loading schools:', error);
        document.getElementById('schoolList').innerHTML = 
            '<p class="loading">데이터를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// CSV 파싱
function parseCSV(text) {
    const rows = [];
    const lines = text.split('\n');
    
    for (let line of lines) {
        if (!line.trim()) continue;
        
        const row = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current.trim());
        rows.push(row);
    }
    
    return rows;
}

// 접근성 점수 계산
function calculateAccessibilityScore(row) {
    const facilities = [
        row[9], row[10], row[11], row[12], row[13],
        row[14], row[15], row[16], row[17], row[18], row[19]
    ];
    
    const installed = facilities.filter(f => f === "적정설치").length;
    const simpleInstalled = facilities.filter(f => f === "단순설치").length;
    const totalFacilities = facilities.length;
    
    return Math.round((installed * 100 + simpleInstalled * 70) / totalFacilities);
}

// 통계 업데이트
function updateStats() {
    const total = allSchools.length;
    const avgScore = Math.round(
        allSchools.reduce((sum, school) => sum + school.접근성점수, 0) / total
    );
    const highAccessibility = allSchools.filter(s => s.접근성점수 >= 70).length;
    
    document.getElementById('totalSchools').textContent = total.toLocaleString();
    document.getElementById('avgScore').textContent = avgScore + '점';
    document.getElementById('highAccessibility').textContent = highAccessibility.toLocaleString();
}

// 학교 검색
function searchSchools() {
    const schoolName = document.getElementById('searchSchool').value.toLowerCase();
    const cityName = document.getElementById('searchCity').value.toLowerCase();
    
    let results = allSchools;
    
    if (schoolName) {
        results = results.filter(school => 
            school.학교명.toLowerCase().includes(schoolName)
        );
    }
    
    if (cityName) {
        results = results.filter(school => 
            school.시군명.toLowerCase().includes(cityName)
        );
    }
    
    filteredSchools = results;
    displaySchools(results.slice(0, 100));
}

// 학교 목록 표시
function displaySchools(schools) {
    const schoolList = document.getElementById('schoolList');
    
    if (schools.length === 0) {
        schoolList.innerHTML = '<p class="loading">검색 결과가 없습니다.</p>';
        return;
    }
    
    schoolList.innerHTML = schools.map(school => createSchoolCard(school)).join('');
}

// 학교 카드 생성
function createSchoolCard(school) {
    const scoreClass = school.접근성점수 >= 70 ? 'high' : 
                      school.접근성점수 >= 50 ? 'medium' : 'low';
    
    return `
        <div class="school-card" onclick='showSchoolDetail(${JSON.stringify(school).replace(/'/g, "&apos;")})'>
            <h3>${school.학교명}</h3>
            <p>${school.시군명} ${school.지역명}</p>
            <span class="score-badge ${scoreClass}">접근성 ${school.접근성점수}점</span>
            <ul class="facility-list">
                <li>
                    <span class="facility-icon ${school.주출입구접근로설치여부 === '적정설치' ? 'available' : 'unavailable'}"></span>
                    주출입구 접근로
                </li>
                <li>
                    <span class="facility-icon ${school.장애인주차구역지정여부 === '적정설치' ? 'available' : 'unavailable'}"></span>
                    장애인 주차구역
                </li>
                <li>
                    <span class="facility-icon ${school.장애인대변기설치여부 === '적정설치' ? 'available' : 'unavailable'}"></span>
                    장애인 화장실
                </li>
                <li>
                    <span class="facility-icon ${school.계단승강기경사로휠체어리프트설치여부 === '적정설치' ? 'available' : 'unavailable'}"></span>
                    승강기/경사로
                </li>
            </ul>
        </div>
    `;
}

// 학교 상세 정보 표시
function showSchoolDetail(school) {
    const modal = document.getElementById('schoolModal');
    const detailDiv = document.getElementById('schoolDetail');
    
    const scoreClass = school.접근성점수 >= 70 ? 'high' : 
                      school.접근성점수 >= 50 ? 'medium' : 'low';
    
    detailDiv.innerHTML = `
        <h2>${school.학교명}</h2>
        <p style="color: #666; margin-bottom: 1rem;">${school.시군명} ${school.지역명}</p>
        <span class="score-badge ${scoreClass}" style="font-size: 1.1rem;">접근성 ${school.접근성점수}점</span>
        
        <div class="detail-section">
            <h3>기본 정보</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>학교급</strong>
                    <span>${school.학교급명}</span>
                </div>
                <div class="detail-item">
                    <strong>설립구분</strong>
                    <span>${school.설립구분명}</span>
                </div>
                <div class="detail-item">
                    <strong>지역교육청</strong>
                    <span>${school.지역교육청명}</span>
                </div>
                <div class="detail-item">
                    <strong>기준년도</strong>
                    <span>${school.기준년도}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>편의시설 현황</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>주출입구 접근로</strong>
                    <span>${school.주출입구접근로설치여부 || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>장애인 주차구역</strong>
                    <span>${school.장애인주차구역지정여부 || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>주출입구 높이차이 제거</strong>
                    <span>${school.주출입구높이차이제거여부 || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>출입구(문)</strong>
                    <span>${school.출입구설치여부 || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>복도</strong>
                    <span>${school.복도설치여부 || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>승강기/경사로</strong>
                    <span>${school.계단승강기경사로휠체어리프트설치여부 || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>장애인 대변기</strong>
                    <span>${school.장애인대변기설치여부 || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>장애인 소변기</strong>
                    <span>${school.장애인소변기설치여부 || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>점자블록</strong>
                    <span>${school.점자블록설치여부 || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>유도 및 안내설비</strong>
                    <span>${school.유도및안내설비설치여부 || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>경보 및 피난설비</strong>
                    <span>${school.경보및피난설비설치여부 || '-'}</span>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// 모달 닫기
function closeModal() {
    document.getElementById('schoolModal').style.display = 'none';
}

// 모달 외부 클릭시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('schoolModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// 제보 폼 제출
function handleReportSubmit(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('reportMessage');
    messageDiv.className = 'message success';
    messageDiv.textContent = '제보가 접수되었습니다. 감사합니다!';
    
    document.getElementById('reportForm').reset();
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}
