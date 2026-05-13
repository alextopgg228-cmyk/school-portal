import { staticApi } from './staticData.js';

const appElement = document.querySelector('#app');

const roleStorageKey = 'schoolPortalRole';
const scheduleStorageKey = 'schoolPortalScheduleRows';
const adminPassword = 'admin2026';

const state = {
  health: null,
  stats: [],
  role: localStorage.getItem(roleStorageKey) || 'viewer',
  scheduleRows: [],
  scheduleLocal: false,
  meta: {
    jobs: [],
    classes: [],
    studyYears: [],
    classTypes: [],
    employees: [],
    scheduleDates: []
  }
};

const pages = {
  '/': {
    key: 'home',
    title: 'Главная',
    heading: 'Все важное о школе в одном понятном портале',
    lead: 'Расписание занятий, классы, преподаватели, предметы и списки учеников собраны из школьной базы данных.'
  },
  '/schedule': {
    key: 'schedule',
    title: 'Расписание занятий',
    eyebrow: 'Учебный день',
    heading: 'Расписание занятий',
    lead: 'Табличное расписание по классам и времени. Технический администратор может добавлять, менять и удалять уроки.',
    endpoint: '/api/schedule',
    columns: ['ScheduleDate', 'DayOfWeek', 'StartTime', 'EndTime', 'StudyYear', 'ClassLetter', 'SubjectName', 'TeacherName']
  },
  '/classes': {
    key: 'classes',
    title: 'Классы школы',
    eyebrow: 'Учебные группы',
    heading: 'Классы школы',
    lead: 'Список классов с направлениями, количеством учеников и классными руководителями.',
    endpoint: '/api/classes',
    columns: ['StudyYear', 'ClassLetter', 'StudentCount', 'TypeName', 'CreationYear', 'ClassTeacher']
  },
  '/subjects': {
    key: 'subjects',
    title: 'Предметы',
    eyebrow: 'Учебная программа',
    heading: 'Предметы',
    lead: 'Предметы школы, их описание и закрепленные преподаватели.',
    endpoint: '/api/subjects',
    columns: ['SubjectName', 'Description', 'TeacherName', 'JobName']
  },
  '/students': {
    key: 'students',
    title: 'Ученики',
    eyebrow: 'Списки классов',
    heading: 'Ученики',
    lead: 'Списки учеников по классам с дополнительной учебной информацией.',
    endpoint: '/api/students',
    columns: ['FullName', 'BirthDate', 'Gender', 'ClassLetter', 'StudyYear', 'AdditionalInfo']
  },
  '/staff': {
    key: 'hr',
    title: 'Учителя и сотрудники',
    eyebrow: 'Команда школы',
    heading: 'Учителя и сотрудники',
    lead: 'Сотрудники школы, должности, обязанности и контактные телефоны.',
    endpoint: '/api/hr',
    columns: ['FullName', 'JobName', 'Responsibilities']
  }
};

const columnLabels = {
  FullName: 'ФИО',
  Gender: 'Пол',
  JobName: 'Должность',
  Responsibilities: 'Обязанности',
  BirthDate: 'Дата рождения',
  AdditionalInfo: 'Интересы и заметки',
  ClassLetter: 'Класс',
  StudyYear: 'Год обучения',
  CreationYear: 'Год создания',
  StudentCount: 'Ученики',
  TypeName: 'Направление',
  ClassTeacher: 'Классный руководитель',
  SubjectName: 'Предмет',
  Description: 'Описание',
  TeacherName: 'Преподаватель',
  ScheduleDate: 'Дата',
  DayOfWeek: 'День недели',
  StartTime: 'Начало',
  EndTime: 'Окончание'
};

const statLabels = {
  'Должности': 'Должностей',
  'Виды классов': 'Направлений',
  'Сотрудники': 'Сотрудников',
  'Классы': 'Классов',
  'Ученики': 'Учеников',
  'Предметы': 'Предметов',
  'Расписание': 'Занятий'
};

function currentPath() {
  const hashPath = window.location.hash.replace(/^#/, '') || '/';
  const path = hashPath.replace(/\/$/, '') || '/';
  return pages[path] ? path : '/';
}

function navigate(path) {
  const cleanPath = path.startsWith('#') ? path.slice(1) : path;
  window.location.hash = cleanPath || '/';
  render();
}

async function api(path) {
  return staticApi(path);
}

function isAdmin() {
  return state.role === 'admin';
}

function roleTitle() {
  return isAdmin() ? 'Технический администратор' : 'Обычный пользователь';
}

function setRole(role) {
  state.role = role;
  localStorage.setItem(roleStorageKey, role);
  renderAuthBar();
  render();
}

function renderAuthBar() {
  let bar = document.querySelector('#authBar');

  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'authBar';
    bar.className = 'auth-bar';
    document.querySelector('.site-header').append(bar);
  }

  bar.replaceChildren();

  const pill = document.createElement('span');
  pill.className = `role-pill ${isAdmin() ? 'role-pill--admin' : ''}`;
  pill.textContent = roleTitle();

  const button = document.createElement('button');
  button.className = 'button button--small';
  button.type = 'button';
  button.textContent = 'Вход / роль';
  button.dataset.openLogin = 'true';

  const exit = document.createElement('button');
  exit.className = 'button button--small';
  exit.type = 'button';
  exit.textContent = 'Выйти';
  exit.hidden = !isAdmin();
  exit.addEventListener('click', () => setRole('viewer'));

  bar.append(pill, button, exit);
}

function openLoginDialog() {
  const oldModal = document.querySelector('#loginModal');
  if (oldModal) {
    oldModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'loginModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
      <button class="modal__close" type="button" data-close-login aria-label="Закрыть">×</button>
      <p class="eyebrow">Вход по ролям</p>
      <h2 id="loginTitle">Выберите доступ</h2>
      <p class="modal__text">Обычный пользователь только просматривает сайт. Технический администратор может редактировать расписание.</p>
      <div class="login-grid">
        <button class="role-card" type="button" data-login-viewer>
          <strong>Обычный пользователь</strong>
          <span>Просмотр информации, классов, предметов и расписания.</span>
        </button>
        <form class="role-card role-card--admin" id="adminLoginForm">
          <strong>Технический администратор</strong>
          <span>Добавление уроков и изменение расписания.</span>
          <label class="field">
            <span>Пароль администратора</span>
            <input name="password" type="password" autocomplete="current-password" placeholder="Введите пароль">
          </label>
          <button class="button button--primary" type="submit">Войти администратором</button>
          <div class="form-error" id="loginError"></div>
        </form>
      </div>
    </div>
  `;

  document.body.append(modal);
  modal.querySelector('input[name="password"]').focus();
}

function closeLoginDialog() {
  document.querySelector('#loginModal')?.remove();
}

function option(value, text) {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = text;
  return element;
}

function field(labelText, control) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';

  const label = document.createElement('label');
  label.textContent = labelText;
  label.htmlFor = control.id;

  wrapper.append(label, control);
  return wrapper;
}

function selectControl(name, items, valueKey, labelKey, allLabel) {
  const select = document.createElement('select');
  select.name = name;
  select.id = name;
  select.append(option('', allLabel));

  items.forEach((item) => {
    const value = typeof item === 'object' ? item[valueKey] : item;
    const text = typeof item === 'object' ? item[labelKey] : item;
    select.append(option(value, text));
  });

  return select;
}

function dateControl(name, dates) {
  const input = document.createElement('input');
  input.name = name;
  input.id = name;
  input.type = 'date';
  input.setAttribute('list', `${name}List`);

  const dataList = document.createElement('datalist');
  dataList.id = `${name}List`;
  dates.forEach((date) => dataList.append(option(date, date)));

  return { input, dataList };
}

function formatDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return value || '-';
  }

  return new Intl.DateTimeFormat('ru-RU').format(new Date(`${value}T00:00:00`));
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (key === 'BirthDate' || key === 'ScheduleDate') {
    return formatDate(value);
  }

  return value;
}

function updateActiveNav() {
  const path = currentPath();
  document.querySelectorAll('[data-route]').forEach((link) => {
    const rawHref = link.getAttribute('href') || '/';
    const href = rawHref.startsWith('#') ? rawHref.slice(1) : rawHref;
    link.classList.toggle('is-active', href === path);
  });
}

function renderHealth() {
  const status = document.createElement('span');
  status.className = 'db-status';

  if (!state.health) {
    status.textContent = 'Проверка подключения...';
    return status;
  }

  if (state.health.mode === 'database') {
    status.classList.add('db-status--ok');
    status.textContent = 'Подключено к школьной базе';
    return status;
  }

  if (state.health.mode === 'error') {
    status.classList.add('db-status--error');
    status.textContent = 'Нет подключения к базе';
    status.title = state.health.error || '';
    return status;
  }

  status.textContent = state.health.mode === 'static' ? 'Опубликованная версия GitHub Pages' : 'Открыт учебный демо-набор данных';
  status.title = state.health.error || '';
  return status;
}

function renderStats() {
  const stats = document.createElement('div');
  stats.className = 'stats';

  state.stats.forEach((row) => {
    const item = document.createElement('article');
    item.className = 'stat';

    const value = document.createElement('span');
    value.className = 'stat__value';
    value.textContent = row.value;

    const label = document.createElement('span');
    label.className = 'stat__label';
    label.textContent = statLabels[row.label] || row.label;

    item.append(value, label);
    stats.append(item);
  });

  return stats;
}

function renderHome() {
  const root = document.createDocumentFragment();

  const hero = document.createElement('section');
  hero.className = 'hero';
  hero.innerHTML = `
    <img class="hero__image" src="./assets/school-campus.png" alt="Здание школы">
    <div class="hero__overlay"></div>
    <div class="hero__content">
      <p class="eyebrow">База данных школы</p>
      <h1>Все важное о школе в одном понятном портале</h1>
      <p class="hero__lead">Расписание занятий, классы, преподаватели, предметы и списки учеников собраны из школьной базы данных.</p>
      <div class="hero__actions">
        <a class="button button--primary" href="#/schedule" data-route>Смотреть расписание</a>
        <a class="button button--light" href="#/classes" data-route>Открыть классы</a>
      </div>
    </div>
  `;

  const overview = document.createElement('section');
  overview.className = 'section';
  const header = document.createElement('div');
  header.className = 'section__header';
  header.innerHTML = '<div><p class="eyebrow">Обзор школы</p><h2>Актуальные данные</h2></div>';
  header.append(renderHealth());
  overview.append(header, renderStats());

  const story = document.createElement('section');
  story.className = 'section school-story';
  story.innerHTML = `
    <div class="school-story__main">
      <p class="eyebrow">О школе</p>
      <h2>Современная образовательная среда для учебы, проектов и развития</h2>
      <p>Школьный портал объединяет учебные данные в одном месте: расписание, классы, предметы, сотрудников и сведения по учебным группам. Главная цель системы - сделать школьную информацию понятной для учеников, родителей и педагогов.</p>
    </div>
    <div class="school-story__facts">
      <article><strong>Проектное обучение</strong><span>Олимпиады, кружки, практические занятия и работа с наставниками.</span></article>
      <article><strong>Безопасная структура данных</strong><span>Сайт показывает только учебную информацию без лишних персональных данных.</span></article>
      <article><strong>Расписание без путаницы</strong><span>Уроки сгруппированы по датам, времени и классам.</span></article>
    </div>
  `;

  const cards = document.createElement('section');
  cards.className = 'audience';
  cards.innerHTML = `
    <a class="audience__item" href="#/schedule" data-route>
      <span class="audience__icon">01</span>
      <h3>Расписание</h3>
      <p>Уроки по датам и классам, время занятий и преподаватели.</p>
    </a>
    <a class="audience__item" href="#/classes" data-route>
      <span class="audience__icon">02</span>
      <h3>Классы</h3>
      <p>Направления классов, количество учеников и классные руководители.</p>
    </a>
    <a class="audience__item" href="#/staff" data-route>
      <span class="audience__icon">03</span>
      <h3>Сотрудники</h3>
      <p>Учителя, должности, обязанности и контактная информация.</p>
    </a>
  `;

  const initiatives = document.createElement('section');
  initiatives.className = 'section';
  initiatives.innerHTML = `
    <div class="section__header">
      <div>
        <p class="eyebrow">Новости и проекты</p>
        <h2>Информационные материалы школы</h2>
      </div>
    </div>
    <div class="initiative-grid">
      <article class="initiative-card initiative-card--wide">
        <img src="./assets/initiative-vote.svg" alt="Всероссийское голосование по выбору объектов благоустройства">
        <div><h3>Городская среда</h3><p>Информационный блок о голосовании за объекты благоустройства и школьных социальных проектах.</p></div>
      </article>
      <article class="initiative-card">
        <img src="./assets/unity-2026.svg" alt="2026 год единства народов России">
        <div><h3>2026 год единства</h3><p>Патриотические и просветительские мероприятия для учеников.</p></div>
      </article>
      <article class="initiative-card">
        <img src="./assets/ministry-news.svg" alt="Новости Министерства просвещения Российской Федерации">
        <div><h3>Новости образования</h3><p>Раздел для важных объявлений, олимпиад и учебных событий.</p></div>
      </article>
    </div>
  `;

  const sponsors = document.createElement('section');
  sponsors.className = 'section';
  sponsors.innerHTML = `
    <div class="section__header">
      <div>
        <p class="eyebrow">Партнеры</p>
        <h2>Спонсоры и социальные партнеры</h2>
      </div>
    </div>
    <div class="sponsor-grid">
      <article class="sponsor-card">
        <img src="./assets/family-mfc.svg" alt="Семейный МФЦ">
        <strong>Семейный МФЦ</strong>
        <span>Поддержка семей, консультации и помощь родителям.</span>
      </article>
      <article class="sponsor-card">
        <img src="./assets/ministry-news.svg" alt="Министерство просвещения">
        <strong>Образовательные новости</strong>
        <span>Информационная поддержка учебных и воспитательных проектов.</span>
      </article>
      <article class="sponsor-card">
        <img src="./assets/unity-2026.svg" alt="Год единства народов России">
        <strong>Культурные проекты</strong>
        <span>Мероприятия для школьников, посвященные истории и культуре.</span>
      </article>
    </div>
  `;

  const split = document.createElement('section');
  split.className = 'section section--split';
  split.innerHTML = `
    <div class="panel panel--feature">
      <div class="panel__header">
        <p class="eyebrow">Учебный день</p>
        <h2>Ближайшие занятия</h2>
      </div>
      <div id="schedulePreview" class="lesson-list"><div class="empty">Загрузка расписания...</div></div>
    </div>
    <div class="panel">
      <div class="panel__header">
        <p class="eyebrow">Команда</p>
        <h2>Преподаватели</h2>
      </div>
      <div id="teacherPreview" class="teacher-list"><div class="empty">Загрузка сотрудников...</div></div>
    </div>
  `;

  root.append(hero, overview, story, cards, initiatives, sponsors, split);
  appElement.replaceChildren(root);
  loadHomePreviews();
}

function renderPageHeader(page) {
  const header = document.createElement('section');
  header.className = 'page-hero';
  header.innerHTML = `
    <div>
      <p class="eyebrow">${page.eyebrow}</p>
      <h1>${page.heading}</h1>
      <p>${page.lead}</p>
    </div>
  `;
  header.append(renderHealth());
  return header;
}

function renderFilters(page) {
  const form = document.createElement('form');
  form.className = 'filters';
  form.id = 'dataFilters';

  if (page.key === 'hr') {
    form.append(field('Должность', selectControl('jobName', state.meta.jobs, 'JobName', 'JobName', 'Все сотрудники')));
  }

  if (page.key === 'students') {
    form.append(field('Класс', selectControl('classCode', state.meta.classes, 'ClassCode', 'ClassName', 'Все классы')));
  }

  if (page.key === 'classes') {
    form.append(field('Год обучения', selectControl('studyYear', state.meta.studyYears, null, null, 'Все годы')));
    form.append(field('Направление', selectControl('typeCode', state.meta.classTypes, 'TypeCode', 'TypeName', 'Все направления')));
  }

  if (page.key === 'subjects') {
    form.append(field('Преподаватель', selectControl('employeeCode', state.meta.employees, 'EmployeeCode', 'FullName', 'Все преподаватели')));
  }

  if (page.key === 'schedule') {
    const date = dateControl('scheduleDate', state.meta.scheduleDates);
    form.append(field('Класс', selectControl('classCode', state.meta.classes, 'ClassCode', 'ClassName', 'Все классы')));
    form.append(field('Дата', date.input));
    form.append(date.dataList);
  }

  const submit = document.createElement('button');
  submit.className = 'button button--primary';
  submit.type = 'submit';
  submit.textContent = 'Показать';

  const reset = document.createElement('button');
  reset.className = 'button';
  reset.type = 'button';
  reset.textContent = 'Сбросить';
  reset.addEventListener('click', () => {
    form.reset();
    loadRows(page, form);
  });

  form.append(submit, reset);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    loadRows(page, form);
  });

  return form;
}

function renderDataPage(page) {
  const section = document.createElement('section');
  section.className = 'section page-section';

  const workspace = document.createElement('div');
  workspace.className = 'workspace';

  const header = document.createElement('div');
  header.className = 'workspace__header';
  header.innerHTML = `<strong>${page.title}</strong><span id="sourceLabel" class="source-label"></span>`;

  const form = renderFilters(page);
  const adminPanel = document.createElement('div');
  adminPanel.id = 'adminPanel';

  const content = document.createElement('div');
  content.id = 'content';
  content.className = 'content';
  content.innerHTML = '<div class="empty">Загрузка данных...</div>';

  workspace.append(header, form, adminPanel, content);
  section.append(renderPageHeader(page), workspace);
  appElement.replaceChildren(section);
  loadRows(page, form);
}

function buildQuery(form) {
  const params = new URLSearchParams();
  const data = new FormData(form);

  data.forEach((value, key) => {
    const text = String(value).trim();
    if (text) {
      params.set(key, text);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

function renderTable(rows, columns) {
  const content = document.querySelector('#content');

  if (!rows.length) {
    content.innerHTML = '<div class="empty">По выбранным фильтрам ничего не найдено.</div>';
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrap';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');

  columns.forEach((column) => {
    const th = document.createElement('th');
    th.textContent = columnLabels[column] || column;
    headRow.append(th);
  });

  thead.append(headRow);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');

    columns.forEach((column) => {
      const td = document.createElement('td');
      td.textContent = formatValue(column, row[column]);
      tr.append(td);
    });

    tbody.append(tr);
  });

  table.append(thead, tbody);
  wrapper.append(table);
  content.replaceChildren(wrapper);
}

function getSavedScheduleRows() {
  try {
    const rows = JSON.parse(localStorage.getItem(scheduleStorageKey) || 'null');
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

function saveScheduleRows(rows) {
  const sorted = sortScheduleRows(rows);
  localStorage.setItem(scheduleStorageKey, JSON.stringify(sorted));
  state.scheduleRows = sorted;
  state.scheduleLocal = true;
  refreshScheduleDates(sorted);
}

function clearSavedScheduleRows() {
  localStorage.removeItem(scheduleStorageKey);
  state.scheduleRows = [];
  state.scheduleLocal = false;
}

function sortScheduleRows(rows) {
  return [...rows].sort((a, b) => {
    const dateCompare = String(a.ScheduleDate).localeCompare(String(b.ScheduleDate));
    if (dateCompare) {
      return dateCompare;
    }
    const timeCompare = String(a.StartTime).localeCompare(String(b.StartTime));
    if (timeCompare) {
      return timeCompare;
    }
    return Number(a.ClassCode || 0) - Number(b.ClassCode || 0);
  });
}

function refreshScheduleDates(rows) {
  state.meta.scheduleDates = [...new Set(rows.map((row) => row.ScheduleDate).filter(Boolean))].sort();
}

function getClassInfo(classCode) {
  const item = state.meta.classes.find((schoolClass) => Number(schoolClass.ClassCode) === Number(classCode));
  const className = item?.ClassName || '';
  const match = className.match(/^(\d+)(.+)$/);

  return {
    ClassCode: Number(classCode),
    ClassName: className,
    StudyYear: match ? Number(match[1]) : '',
    ClassLetter: match ? match[2] : className
  };
}

function applyScheduleFilters(rows, form) {
  const data = new FormData(form);
  const classCode = data.get('classCode');
  const scheduleDate = data.get('scheduleDate');

  return sortScheduleRows(rows)
    .filter((row) => !classCode || Number(row.ClassCode) === Number(classCode))
    .filter((row) => !scheduleDate || row.ScheduleDate === scheduleDate);
}

function scheduleId(row) {
  return String(row.ScheduleCode);
}

function renderScheduleAdminPanel() {
  const panel = document.querySelector('#adminPanel');
  if (!panel) {
    return;
  }

  if (!isAdmin()) {
    panel.replaceChildren();
    return;
  }

  panel.innerHTML = `
    <div class="schedule-admin">
      <div class="schedule-admin__header">
        <div>
          <p class="eyebrow">Панель администратора</p>
          <h3>Добавление и изменение уроков</h3>
        </div>
        <button class="button button--danger" type="button" data-reset-schedule>Сбросить правки</button>
      </div>
      <form id="scheduleEditorForm" class="schedule-editor">
        <input type="hidden" name="scheduleId">
        <label class="field"><span>Дата</span><input name="scheduleDate" type="date" required></label>
        <label class="field"><span>День недели</span><input name="dayOfWeek" type="text" placeholder="Понедельник" required></label>
        <label class="field"><span>Начало</span><input name="startTime" type="time" required></label>
        <label class="field"><span>Окончание</span><input name="endTime" type="time" required></label>
        <label class="field"><span>Класс</span><select name="classCode" required></select></label>
        <label class="field"><span>Предмет</span><input name="subjectName" type="text" placeholder="Математика" required></label>
        <label class="field"><span>Преподаватель</span><input name="teacherName" type="text" placeholder="Иванов И.И." required></label>
        <div class="schedule-editor__actions">
          <button class="button button--primary" type="submit">Сохранить урок</button>
          <button class="button" type="button" data-clear-schedule-form>Очистить</button>
        </div>
      </form>
    </div>
  `;

  const classSelect = panel.querySelector('select[name="classCode"]');
  state.meta.classes.forEach((item) => {
    classSelect.append(option(item.ClassCode, item.ClassName));
  });
}

function readScheduleForm(form) {
  const data = new FormData(form);
  const classInfo = getClassInfo(data.get('classCode'));

  return {
    ScheduleCode: data.get('scheduleId') || `local-${Date.now()}`,
    ScheduleDate: data.get('scheduleDate'),
    DayOfWeek: data.get('dayOfWeek').trim(),
    ClassCode: classInfo.ClassCode,
    ClassLetter: classInfo.ClassLetter,
    StudyYear: classInfo.StudyYear,
    SubjectName: data.get('subjectName').trim(),
    TeacherName: data.get('teacherName').trim(),
    StartTime: data.get('startTime'),
    EndTime: data.get('endTime')
  };
}

function fillScheduleForm(row) {
  const form = document.querySelector('#scheduleEditorForm');
  if (!form) {
    return;
  }

  form.scheduleId.value = scheduleId(row);
  form.scheduleDate.value = row.ScheduleDate || '';
  form.dayOfWeek.value = row.DayOfWeek || '';
  form.startTime.value = row.StartTime || '';
  form.endTime.value = row.EndTime || '';
  form.classCode.value = row.ClassCode || '';
  form.subjectName.value = row.SubjectName || '';
  form.teacherName.value = row.TeacherName || '';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearScheduleForm() {
  const form = document.querySelector('#scheduleEditorForm');
  form?.reset();
  if (form) {
    form.scheduleId.value = '';
  }
}

function submitScheduleForm(event) {
  event.preventDefault();
  if (!isAdmin()) {
    return;
  }

  const form = event.currentTarget;
  const row = readScheduleForm(form);
  const rows = state.scheduleRows.length ? [...state.scheduleRows] : [];
  const index = rows.findIndex((item) => scheduleId(item) === scheduleId(row));

  if (index >= 0) {
    rows[index] = row;
  } else {
    rows.push(row);
  }

  saveScheduleRows(rows);
  clearScheduleForm();
  loadRows(pages['/schedule'], document.querySelector('#dataFilters'));
}

function deleteScheduleRow(id) {
  if (!isAdmin()) {
    return;
  }

  const rows = state.scheduleRows.filter((row) => scheduleId(row) !== String(id));
  saveScheduleRows(rows);
  loadRows(pages['/schedule'], document.querySelector('#dataFilters'));
}

function renderScheduleCell(lessons) {
  const cell = document.createElement('td');
  cell.className = 'schedule-slot';

  if (!lessons.length) {
    cell.innerHTML = '<span class="schedule-slot__empty">-</span>';
    return cell;
  }

  lessons.forEach((lesson) => {
    const card = document.createElement('article');
    card.className = 'schedule-slot__lesson';

    const subject = document.createElement('strong');
    subject.textContent = lesson.SubjectName || 'Урок';

    const teacher = document.createElement('span');
    teacher.textContent = lesson.TeacherName || 'Преподаватель не указан';

    card.append(subject, teacher);

    if (isAdmin()) {
      const actions = document.createElement('div');
      actions.className = 'schedule-actions';

      const edit = document.createElement('button');
      edit.className = 'icon-button';
      edit.type = 'button';
      edit.textContent = 'Изм.';
      edit.dataset.editSchedule = scheduleId(lesson);

      const remove = document.createElement('button');
      remove.className = 'icon-button icon-button--danger';
      remove.type = 'button';
      remove.textContent = 'Удал.';
      remove.dataset.deleteSchedule = scheduleId(lesson);

      actions.append(edit, remove);
      card.append(actions);
    }

    cell.append(card);
  });

  return cell;
}

function renderScheduleBoard(rows) {
  const content = document.querySelector('#content');

  if (!rows.length) {
    content.innerHTML = '<div class="empty">По выбранным фильтрам уроки не найдены.</div>';
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'schedule-board';

  const dates = [...new Set(rows.map((row) => row.ScheduleDate))].sort();

  dates.forEach((date) => {
    const dayRows = rows.filter((row) => row.ScheduleDate === date);
    const dayName = dayRows[0]?.DayOfWeek || '';
    const classes = [...new Map(dayRows.map((row) => [
      Number(row.ClassCode),
      {
        ClassCode: Number(row.ClassCode),
        ClassName: `${row.StudyYear}${row.ClassLetter}`
      }
    ])).values()].sort((a, b) => a.ClassCode - b.ClassCode);
    const times = [...new Set(dayRows.map((row) => `${row.StartTime}|${row.EndTime}`))].sort();

    const section = document.createElement('section');
    section.className = 'schedule-day';

    const title = document.createElement('div');
    title.className = 'schedule-day__title';
    title.innerHTML = `<strong>${formatDate(date)}</strong><span>${dayName}</span>`;

    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-wrap schedule-table-wrap';

    const table = document.createElement('table');
    table.className = 'schedule-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const timeHead = document.createElement('th');
    timeHead.textContent = 'Время';
    headRow.append(timeHead);

    classes.forEach((schoolClass) => {
      const th = document.createElement('th');
      th.textContent = schoolClass.ClassName;
      headRow.append(th);
    });

    thead.append(headRow);
    table.append(thead);

    const tbody = document.createElement('tbody');
    times.forEach((time) => {
      const [startTime, endTime] = time.split('|');
      const row = document.createElement('tr');
      const timeCell = document.createElement('td');
      timeCell.className = 'schedule-time';
      timeCell.textContent = `${startTime} - ${endTime}`;
      row.append(timeCell);

      classes.forEach((schoolClass) => {
        const lessons = dayRows.filter((lesson) => (
          Number(lesson.ClassCode) === schoolClass.ClassCode
          && lesson.StartTime === startTime
          && lesson.EndTime === endTime
        ));
        row.append(renderScheduleCell(lessons));
      });

      tbody.append(row);
    });

    table.append(tbody);
    tableWrap.append(table);
    section.append(title, tableWrap);
    wrapper.append(section);
  });

  content.replaceChildren(wrapper);
}

async function loadScheduleRows(page, form) {
  const content = document.querySelector('#content');
  const sourceLabel = document.querySelector('#sourceLabel');
  content.innerHTML = '<div class="empty">Загрузка расписания...</div>';

  try {
    const payload = await api(page.endpoint);
    const savedRows = getSavedScheduleRows();
    const allRows = sortScheduleRows(savedRows || payload.rows);

    state.scheduleRows = allRows;
    state.scheduleLocal = Boolean(savedRows);
    refreshScheduleDates(allRows);
    renderScheduleAdminPanel();

    sourceLabel.textContent = state.scheduleLocal
      ? 'Расписание с локальными правками администратора'
      : (payload.source === 'database' ? 'Данные из школьной базы' : 'Статическая копия расписания');
    sourceLabel.title = payload.warning || '';

    renderScheduleBoard(applyScheduleFilters(allRows, form));
  } catch (error) {
    sourceLabel.textContent = '';
    content.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

async function loadRows(page, form) {
  if (page.key === 'schedule') {
    await loadScheduleRows(page, form);
    return;
  }

  const content = document.querySelector('#content');
  const sourceLabel = document.querySelector('#sourceLabel');
  content.innerHTML = '<div class="empty">Загрузка данных...</div>';

  try {
    const payload = await api(`${page.endpoint}${buildQuery(form)}`);
    sourceLabel.textContent = payload.source === 'database' ? 'Данные из школьной базы' : 'Демо-данные для просмотра';
    sourceLabel.title = payload.warning || '';
    renderTable(payload.rows, page.columns);
  } catch (error) {
    sourceLabel.textContent = '';
    content.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

function renderSchedulePreview(rows) {
  const target = document.querySelector('#schedulePreview');
  target.replaceChildren();

  const savedRows = getSavedScheduleRows();
  const previewRows = sortScheduleRows(savedRows || rows);

  previewRows.slice(0, 5).forEach((row) => {
    const lesson = document.createElement('article');
    lesson.className = 'lesson';
    lesson.innerHTML = `
      <div class="lesson__time">${row.StartTime} - ${row.EndTime}</div>
      <div>
        <div class="lesson__title">${row.SubjectName}</div>
        <div class="lesson__meta">${formatDate(row.ScheduleDate)}, ${row.DayOfWeek}. ${row.TeacherName}</div>
      </div>
      <div class="lesson__class">${row.StudyYear}${row.ClassLetter}</div>
    `;
    target.append(lesson);
  });
}

function renderTeacherPreview(rows) {
  const target = document.querySelector('#teacherPreview');
  target.replaceChildren();

  rows.slice(0, 5).forEach((row) => {
    const teacher = document.createElement('article');
    teacher.className = 'teacher';
    teacher.innerHTML = `<div class="teacher__name">${row.FullName}</div><div class="teacher__role">${row.JobName}</div>`;
    target.append(teacher);
  });
}

async function loadHomePreviews() {
  const [schedule, teachers] = await Promise.all([
    api('/api/schedule'),
    api('/api/hr')
  ]);

  renderSchedulePreview(schedule.rows);
  renderTeacherPreview(teachers.rows);
}

function render() {
  const path = currentPath();
  const page = pages[path];
  document.title = `${page.title} | Школьный портал`;
  updateActiveNav();
  renderAuthBar();

  if (page.key === 'home') {
    renderHome();
  } else {
    renderDataPage(page);
  }
}

async function bootstrap() {
  const [health, stats, meta] = await Promise.all([
    api('/api/health'),
    api('/api/stats'),
    api('/api/meta')
  ]);

  state.health = health;
  state.stats = stats.rows;
  state.meta = meta.data;
  render();
}

document.addEventListener('click', (event) => {
  const loginButton = event.target.closest('[data-open-login]');
  if (loginButton) {
    openLoginDialog();
    return;
  }

  if (event.target.closest('[data-close-login]') || event.target.id === 'loginModal') {
    closeLoginDialog();
    return;
  }

  const viewerButton = event.target.closest('[data-login-viewer]');
  if (viewerButton) {
    setRole('viewer');
    closeLoginDialog();
    return;
  }

  const editButton = event.target.closest('[data-edit-schedule]');
  if (editButton) {
    const row = state.scheduleRows.find((lesson) => scheduleId(lesson) === editButton.dataset.editSchedule);
    if (row) {
      fillScheduleForm(row);
    }
    return;
  }

  const deleteButton = event.target.closest('[data-delete-schedule]');
  if (deleteButton) {
    if (window.confirm('Удалить этот урок из расписания?')) {
      deleteScheduleRow(deleteButton.dataset.deleteSchedule);
    }
    return;
  }

  const resetSchedule = event.target.closest('[data-reset-schedule]');
  if (resetSchedule) {
    if (window.confirm('Сбросить все локальные изменения расписания?')) {
      clearSavedScheduleRows();
      loadRows(pages['/schedule'], document.querySelector('#dataFilters'));
    }
    return;
  }

  if (event.target.closest('[data-clear-schedule-form]')) {
    clearScheduleForm();
    return;
  }

  const link = event.target.closest('[data-route]');
  if (!link) {
    return;
  }

  const href = link.getAttribute('href');
  if (!href || href.startsWith('http')) {
    return;
  }

  event.preventDefault();
  navigate(href);
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'adminLoginForm') {
    event.preventDefault();
    const password = new FormData(event.target).get('password');
    const error = event.target.querySelector('#loginError');

    if (password === adminPassword) {
      setRole('admin');
      closeLoginDialog();
    } else {
      error.textContent = 'Неверный пароль. Для проекта пароль: admin2026';
    }
    return;
  }

  if (event.target.id === 'scheduleEditorForm') {
    submitScheduleForm(event);
  }
});

window.addEventListener('hashchange', render);

bootstrap().catch((error) => {
  appElement.innerHTML = `<section class="section"><div class="error">${error.message}</div></section>`;
});
