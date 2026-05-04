import { staticApi } from './staticData.js';

const appElement = document.querySelector('#app');

const state = {
  health: null,
  stats: [],
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
    lead: 'Выберите класс и дату, чтобы посмотреть уроки, время и преподавателей.',
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

  status.textContent = 'Открыт учебный демо-набор данных';
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

  root.append(hero, overview, cards, split);
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
  const content = document.createElement('div');
  content.id = 'content';
  content.className = 'content';
  content.innerHTML = '<div class="empty">Загрузка данных...</div>';

  workspace.append(header, form, content);
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

async function loadRows(page, form) {
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

  rows.slice(0, 5).forEach((row) => {
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

window.addEventListener('hashchange', render);

bootstrap().catch((error) => {
  appElement.innerHTML = `<section class="section"><div class="error">${error.message}</div></section>`;
});
