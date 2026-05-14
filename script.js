let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
let teacherCreatedKeys = JSON.parse(localStorage.getItem('teacherCreatedKeys')) || [];
let questionBank = JSON.parse(localStorage.getItem('questionBank')) || { "5": [], "6": [], "7": [], "8": [] };
let classRoster = JSON.parse(localStorage.getItem('classRoster')) || { "5": [], "6": [], "7": [], "8": [] };

let currentUser = { name: "", type: "", regType: "" };
let activeClass = "";
let currentQuizData = [];
let currentQuestionIndex = 0;
let userAnswers = {}; 
let score = { correct: 0, wrong: 0 };

const pool = {
    "easy": [
        { q: "What is 5 + 7?", a: "10", b: "12", c: "14", d: "15", r: "B" },
        { q: "How many corners does a square have?", a: "3", b: "4", c: "5", d: "6", r: "B" },
        { q: "What is half of 10?", a: "2", b: "4", c: "5", d: "6", r: "C" },
        { q: "What is 3 x 3?", a: "6", b: "9", c: "12", d: "15", r: "B" }
    ],
    "medium": [
        { q: "What is 15 x 3?", a: "35", b: "45", c: "55", d: "65", r: "B" },
        { q: "What is the measure of a right angle?", a: "45", b: "60", c: "90", d: "180", r: "C" },
        { q: "What is the square of 25?", a: "225", b: "525", c: "625", d: "725", r: "C" }
    ],
    "hard": [
        { q: "What is 12 x 12 + 6?", a: "144", b: "150", c: "156", d: "160", r: "B" },
        { q: "How do you extract √169?", a: "11", b: "12", c: "13", d: "14", r: "C" },
        { q: "Which number is prime?", a: "1", b: "9", c: "11", d: "15", r: "C" }
    ]
};

window.onload = () => updateMainClassList();

function saveData() {
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    localStorage.setItem('teacherCreatedKeys', JSON.stringify(teacherCreatedKeys));
    localStorage.setItem('questionBank', JSON.stringify(questionBank));
    localStorage.setItem('classRoster', JSON.stringify(classRoster));
}

function openModal(mode) {
    document.getElementById('auth-modal').style.display = 'block';
    if(mode === 'register') {
        document.getElementById('register-section').style.display = 'block';
        document.getElementById('login-section').style.display = 'none';
        resetRegModal();
    } else {
        document.getElementById('register-section').style.display = 'none';
        document.getElementById('login-section').style.display = 'block';
        resetLoginModal();
    }
}

function closeModal() { document.getElementById('auth-modal').style.display = 'none'; }

function showRegisterFields(type) {
    currentUser.regType = type;
    document.getElementById('reg-step-1').style.display = 'none';
    document.getElementById('reg-step-2').style.display = 'block';
    document.getElementById('school-field').style.display = (type === 'teacher') ? 'block' : 'none';
}

function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const surname = document.getElementById('reg-surname').value.trim();
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value.trim();
    const school = document.getElementById('reg-school').value.trim();
    if(!name || !surname || !user || !pass) return alert("Please fill in all required fields!");
    if(currentUser.regType === 'teacher' && !school) return alert("Please enter your school!");
    if(registeredUsers.find(u => u.username === user)) return alert("This username is already taken!");
    registeredUsers.push({ name, surname, username: user, password: pass, role: currentUser.regType, school });
    saveData();
    alert("Registration successful! You can now log in.");
    openModal('login');
}

function resetRegModal() { document.getElementById('reg-step-1').style.display = 'block'; document.getElementById('reg-step-2').style.display = 'none'; }

function showLoginFields(type) {
    currentUser.type = type;
    document.getElementById('login-step-1').style.display = 'none';
    document.getElementById('login-step-2').style.display = 'block';
}

function handleAuth() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (currentUser.type === 'teacher' && user === "admin" && pass === "1234") {
        return loginSuccess("TEACHER (ADMIN)", "teacher");
    }
    const found = registeredUsers.find(u => u.username === user && u.password === pass && u.role === currentUser.type);
    if(found) {
        loginSuccess(found.name + " " + found.surname, found.role);
        if(found.role === 'student') updateStudentClasses(user);
    } else { alert("Invalid login!"); }
}

function loginSuccess(displayName, role) {
    currentUser.name = displayName; currentUser.type = role;
    if(role === 'teacher') {
        document.getElementById('teacher-controls').style.display = 'block';
        document.getElementById('teacher-classes-menu-btn').style.display = 'block';
    }
    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('user-menu').style.display = 'block';
    document.getElementById('user-name-btn').innerText = displayName.toUpperCase();
    closeModal();
}

function resetLoginModal() { document.getElementById('login-step-1').style.display = 'block'; document.getElementById('login-step-2').style.display = 'none'; }

function logout() { 
    currentUser = { name: "", type: "", regType: "" };
    location.reload(); 
}

function toggleTheme() { document.body.classList.toggle('dark-theme'); }
function toggleDropdown() { document.getElementById('dropdown-content').classList.toggle('show'); }

function showScreen(id) {
    const screens = ['screen-class', 'screen-manage-class', 'screen-create-class', 'screen-add-question', 'screen-teacher-classes', 'screen-difficulty', 'screen-quiz', 'screen-result'];
    screens.forEach(s => { if(document.getElementById(s)) document.getElementById(s).style.display = 'none'; });
    document.getElementById(id).style.display = 'block';
    if(id === 'screen-add-question') updateTargetClassSelect();
}

function updateMainClassList() {
    const mainList = document.getElementById('main-class-list');
    mainList.innerHTML = ["5TH", "6TH", "7TH", "8TH"].map(n => `<button onclick="openDifficulty('${n}')">${n} GRADE</button>`).join('');
}

function openDifficulty(name) {
    activeClass = name;
    document.getElementById('diff-class-title').innerText = name + " GRADE";
    showScreen('screen-difficulty');
}

function startQuiz(level) { currentQuizData = [...pool[level]]; initQuiz(); }

function initQuiz() {
    currentQuestionIndex = 0; userAnswers = {}; score = { correct: 0, wrong: 0 };
    document.getElementById('score-correct').innerText = "D: 0";
    document.getElementById('score-wrong').innerText = "Y: 0";
    showQuestion(); showScreen('screen-quiz');
}

function showQuestion() {
    const qData = currentQuizData[currentQuestionIndex];
    document.getElementById('question-text').innerText = qData.q;
    const btnContainer = document.getElementById('answer-buttons');
    btnContainer.innerHTML = "";
    document.getElementById('quiz-timer').innerText = `${currentQuestionIndex + 1}/${currentQuizData.length}`;
    updateNavButtons();
    ['A', 'B', 'C', 'D'].forEach(letter => {
        const btn = document.createElement('button');
        btn.innerText = `${letter}) ${qData[letter.toLowerCase()]}`;
        if(userAnswers[currentQuestionIndex]) {
            if(letter === currentQuizData[currentQuestionIndex].r) btn.classList.add('correct-anim');
            else if(letter === userAnswers[currentQuestionIndex]) btn.classList.add('wrong-anim');
            btn.disabled = true;
        }
        btn.onclick = () => checkAnswer(letter, btn);
        btnContainer.appendChild(btn);
    });
}

function checkAnswer(choice, btn) {
    if(userAnswers[currentQuestionIndex]) return;
    const correct = currentQuizData[currentQuestionIndex].r;
    userAnswers[currentQuestionIndex] = choice;
    if (choice === correct) { score.correct++; btn.classList.add('correct-anim'); } 
    else { score.wrong++; btn.classList.add('wrong-anim'); }
    document.getElementById('score-correct').innerText = `Correct: ${score.correct}`;
    document.getElementById('score-wrong').innerText = `Wrong: ${score.wrong}`;
}

function nextQuestion() { if (currentQuestionIndex < currentQuizData.length - 1) { currentQuestionIndex++; showQuestion(); } }
function prevQuestion() { if (currentQuestionIndex > 0) { currentQuestionIndex--; showQuestion(); } }
function updateNavButtons() {
    document.getElementById('prev-btn').style.visibility = (currentQuestionIndex === 0) ? 'hidden' : 'visible';
    document.getElementById('next-btn').style.visibility = (currentQuestionIndex === currentQuizData.length - 1) ? 'hidden' : 'visible';
}

function showResults() { 
    document.getElementById('final-correct').innerText = `Correct: ${score.correct}`; 
    document.getElementById('final-wrong').innerText = `Wrong: ${score.wrong}`; 
    document.getElementById('final-total').innerText = `Score: ${Math.round((score.correct / currentQuizData.length) * 100)}`; 
    showScreen('screen-result'); 
}

function createNewClass() {
    const name = document.getElementById('new-class-name').value.trim();
    if (!name || questionBank[name]) return alert("You already created this class");
    teacherCreatedKeys.push(name);
    questionBank[name] = []; classRoster[name] = [];
    saveData(); updateTargetClassSelect(); showScreen('screen-class');
}

function updateTargetClassSelect() {
    const select = document.getElementById('target-class-select');
    if(select) { select.innerHTML = teacherCreatedKeys.map(k => `<option value="${k}">${k.toUpperCase()}</option>`).join(''); }
}

function showMyCreatedClasses() {
    const list = document.getElementById('teacher-classes-list');
    list.innerHTML = teacherCreatedKeys.map(name => `
        <div class="list-item">
            <button onclick="manageClass('${name}')" style="flex-grow: 1; margin-right: 10px;">${name.toUpperCase()}</button>
            <button class="delete-btn" onclick="deleteClass('${name}')">DELETE</button>
        </div>
    `).join('');
    showScreen('screen-teacher-classes');
    toggleDropdown();
}

function deleteClass(name) {
    if(!confirm(`Delete ${name}?`)) return;
    teacherCreatedKeys = teacherCreatedKeys.filter(k => k !== name);
    delete questionBank[name]; delete classRoster[name];
    saveData(); showMyCreatedClasses();
}

function manageClass(name) { activeClass = name; document.getElementById('manage-class-title').innerText = name.toUpperCase() + " CLASS"; backToOptions(); showScreen('screen-manage-class'); }
function backToOptions() { document.getElementById('manage-options').style.display = 'block'; document.getElementById('section-questions').style.display = 'none'; document.getElementById('section-students').style.display = 'none'; }
function showSubSection(id) { document.getElementById('manage-options').style.display = 'none'; document.getElementById(id).style.display = 'block'; if(id === 'section-questions') updateManageQuestionsList(); if(id === 'section-students') updateManageStudentsList(); }


function updateManageQuestionsList() {
    const d = document.getElementById('class-questions-display');
    const qs = questionBank[activeClass] || [];
    
    if(qs.length === 0) {
        d.innerHTML = "There are no questions in this class.";
        return;
    }

    d.innerHTML = qs.map((q, i) => `
        <div class="q-manage-item">
            <div class="q-header-row">
                <span class="q-title">${i+1}. ${q.text}</span>
                <button class="delete-btn" onclick="deleteQuestion(${i})">DELETE</button>
            </div>
            <ul class="q-options-list">
                <li class="${q.correct === 'A' ? 'correct-option' : ''}">A) ${q.a}</li>
                <li class="${q.correct === 'B' ? 'correct-option' : ''}">B) ${q.b}</li>
                <li class="${q.correct === 'C' ? 'correct-option' : ''}">C) ${q.c}</li>
                <li class="${q.correct === 'D' ? 'correct-option' : ''}">D) ${q.d}</li>
            </ul>
        </div>
    `).join('');
}

function deleteQuestion(index) {
    if(!confirm("Delete this question?")) return;
    questionBank[activeClass].splice(index, 1); 
    saveData(); 
    updateManageQuestionsList(); 
}

function updateManageStudentsList() {
    const d = document.getElementById('class-students-display');
    const roster = classRoster[activeClass] || [];
    d.innerHTML = roster.map((s, i) => `<div class="list-item"><span>👤 ${s}</span><button class="delete-btn" onclick="deleteStudent(${i})">DELETE</button></div>`).join('');
}
function deleteStudent(index) {
    if(!confirm("Remove this student from the class?")) return;
    classRoster[activeClass].splice(index, 1); 
    saveData(); 
    updateManageStudentsList(); 
}

function saveQuestionToSystem() {
    const target = document.getElementById('target-class-select').value;
    const txt = document.getElementById('add-q-text').value;
    const a = document.getElementById('opt-a').value, b = document.getElementById('opt-b').value, c = document.getElementById('opt-c').value, d = document.getElementById('opt-d').value;
    const correct = document.getElementById('correct-answer-select').value;
    if(!txt || !target || !a || !b) return alert("Missing information! Please fill in at least the question text and options A-B.");
    questionBank[target].push({ text: txt, a, b, c, d, correct });
    saveData(); 
    alert("Question added."); 
    showScreen('screen-class');
}

function registerStudentToClass() {
    const s = document.getElementById('new-student-username').value.trim();
    if(!s) return; 
    classRoster[activeClass].push(s); 
    saveData(); 
    updateManageStudentsList();
    document.getElementById('new-student-username').value = "";
}

function updateStudentClasses(studentUser) {
    const area = document.getElementById('student-special-area');
    const list = document.getElementById('student-classes-list');
    list.innerHTML = "";
    let found = [];
    Object.keys(classRoster).forEach(cn => { 
        if(classRoster[cn].map(name => name.toLowerCase()).includes(studentUser.toLowerCase())) found.push(cn); 
    });
    if(found.length > 0) {
        area.style.display = 'block';
        found.forEach(cn => {
            const btn = document.createElement('button');
            btn.innerText = cn.toUpperCase() + " ASSIGNMENTS";
            btn.onclick = () => {
                activeClass = cn;
                const qs = questionBank[cn];
                if(qs.length === 0) return alert("There are no questions assigned to this class yet");
                currentQuizData = qs.map(q => ({ q: q.text, a: q.a, b: q.b, c: q.c, d: q.d, r: q.correct }));
                initQuiz();
            };
            list.appendChild(btn);
        });
    }
}