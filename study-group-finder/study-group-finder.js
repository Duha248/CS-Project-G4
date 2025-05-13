// API endpoints
const API = {
  groups: './data/groups.json',
  members: './data/members.json',
  comments: './data/comments.json'
};

// DOM Elements
const createBtn = document.getElementById('create-btn');
const createBtnI = document.getElementById('create-btnI');
const newGroupForm = document.getElementById('newGroupForm');
const cancelBtn = document.querySelector('#newGroupForm .btn-secondary');
const modal = document.getElementById('cancelConfirmationModal');
const confirmCancel = document.getElementById('confirmCancel');
const denyCancel = document.getElementById('denyCancel');
const resultsSection = document.querySelector('.results');
const searchForm = document.getElementById('searchForm');
const loadingIndicator = document.createElement('div');
const paginationContainer = document.querySelector('.pagination_section');

const actionDialog = document.getElementById('actionDialog');
const actionDialogTitle = document.getElementById('actionDialogTitle');
const actionDialogConfirm = document.getElementById('actionDialogConfirm');
const actionDialogCancel = document.getElementById('actionDialogCancel');

const editDialog = document.getElementById('editDialog');
const editCourseCode = document.getElementById('editCourseCode');
const editGroupName = document.getElementById('editGroupName');
const editDescription = document.getElementById('editDescription');
const editCollege = document.getElementById('editCollege');
const editDialogCancel = document.getElementById('editDialogCancel');
const toast = document.getElementById('toast');
const creationDateInput = document.getElementById('creationDate');

const noResultsDialog = document.getElementById('noResultsDialog');
const closeNoResultsButton = document.getElementById('closeNoResults');
const courseCodeInput = document.getElementById('courseCode');
const collegeSelect = document.getElementById('college');

let currentGroupElement = null;
let currentPage = 1;
const groupsPerPage = 3;

loadingIndicator.className = 'loading';
loadingIndicator.innerHTML = '<p>Loading study groups...</p>';

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  loadStudyGroups();
  searchForm.addEventListener('submit', handleSearchSubmit);
  closeNoResultsButton.addEventListener('click', closeNoResultsDialog);
  createBtnI.addEventListener('click', openCreateForm);
  createBtn.addEventListener('click', openCreateForm);
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal.showModal());
  if (confirmCancel) confirmCancel.addEventListener('click', confirmFormCancel);
  if (denyCancel) denyCancel.addEventListener('click', () => modal.close());
  actionDialogConfirm.addEventListener('click', handleActionConfirm);
  actionDialogCancel.addEventListener('click', () => actionDialog.close());
  editDialogCancel.addEventListener('click', () => editDialog.close());
  document.getElementById('editGroupForm').addEventListener('submit', handleEditSubmit);
  newGroupForm.addEventListener('submit', handleCreateGroupSubmit);
  if (creationDateInput) creationDateInput.value = new Date().toISOString().slice(0, 16).replace('T', ' ');
});

function handleSearchSubmit(e) {
  e.preventDefault();
  const formData = new FormData(searchForm);
  const filters = {
    courseCode: formData.get('courseCode'),
    college: formData.get('college'),
    sortBy: formData.get('sortSelect')
  };
  currentPage = 1;
  loadStudyGroups(filters);
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

async function loadStudyGroups(filters = {}) {
  try {
    resultsSection.innerHTML = '';
    resultsSection.appendChild(loadingIndicator);

    const [groups, members, comments] = await Promise.all([
      fetchData(API.groups),
      fetchData(API.members),
      fetchData(API.comments)
    ]);

    let filteredGroups = processData(groups, members, comments);

    // Case-insensitive course code filter
    if (filters.courseCode) {
      const searchCode = filters.courseCode.toUpperCase().trim();
      filteredGroups = filteredGroups.filter(group => 
        group.course_code.toUpperCase().includes(searchCode)
      );
    }

    // Case-insensitive college filter
    if (filters.college) {
      const searchCollege = filters.college.toLowerCase().replace(/\s+/g, '-').trim();
      filteredGroups = filteredGroups.filter(group => 
        group.college.toLowerCase().replace(/\s+/g, '-') === searchCollege
      );
    }

    if (filters.sortBy) {
      filteredGroups = sortGroups(filteredGroups, filters.sortBy);
    }

    window.lastFilteredGroups = filteredGroups;
    displayGroups(filteredGroups);

  } catch (error) {
    showError(error);
  }
}

function fetchData(url) {
  return fetch(url).then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  });
}

function processData(groups, members, comments) {
  return groups.map(group => {
    const groupMembers = group.members.map(id => members.find(m => m.id === id)).filter(Boolean);
    const groupComments = group.comments.map(cid => {
      const comment = comments.find(c => c.id === cid);
      const commenter = members.find(m => m.id === comment?.member_id);
      return comment && commenter ? { ...comment, memberName: commenter.name } : null;
    }).filter(Boolean);
    return { ...group, members: groupMembers, comments: groupComments };
  });
}

function sortGroups(groups, sortBy) {
  const sorted = [...groups];
  switch (sortBy) {
    case 'code_asc': return sorted.sort((a, b) => a.course_code.localeCompare(b.course_code));
    case 'code_desc': return sorted.sort((a, b) => b.course_code.localeCompare(a.course_code));
    case 'date_new': return sorted.sort((a, b) => new Date(b.created) - new Date(a.created));
    case 'date_old': return sorted.sort((a, b) => new Date(a.created) - new Date(b.created));
    case 'members_asc': return sorted.sort((a, b) => a.members.length - b.members.length);
    case 'members_desc': return sorted.sort((a, b) => b.members.length - a.members.length);
    default: return groups;
  }
}

function displayGroups(groups) {
  if (!groups.length) return showNoResultsDialog();
  const startIndex = (currentPage - 1) * groupsPerPage;
  const paginatedGroups = groups.slice(startIndex, startIndex + groupsPerPage);
  const html = paginatedGroups.map(renderGroupHTML).join('');
  resultsSection.innerHTML = `<h3>Available Groups:</h3>${html}`;
  renderPagination(groups.length);
  setupEventListeners();
}

function renderGroupHTML(group) {
  return `
  <div class="group-listing">
    <details>
      <summary><p><strong>Course: ${group.course_code}</strong></p><p><strong>${group.course_name}</strong></p></summary>
      <p class="group-college"><strong>College:</strong> ${group.college}</p>
      <p class="group-description"><strong>Description:</strong> ${group.description}</p>
      <p><strong>Created:</strong> ${formatDate(group.created)}</p>
      <div class="members-section">
        <p><strong>Current Members (${group.members.length}):</strong></p>
        <div class="member-list">${group.members.map(m => `<span class="member-badge">${m.name}</span>`).join('')}</div>
      </div>
      <div class="controllers">
        <button class="btn btn-secondary edit-btn">Edit</button>
        <button class="btn join-btn">Join</button>
        <button class="btn btn-danger delete-btn">Delete</button>
        <button class="btn btn-secondary back-btn">Back</button>
      </div>
      <div class="comments-section">
        <h3>Discussion</h3>
        ${group.comments.map(c => `<article class="comment"><strong>${c.memberName}</strong> • <small>${c.time}</small><p>${c.content}</p></article>`).join('') || '<p> </p>'}
        <form class="comment-form">
          <label>Share your thoughts</label>
          <textarea rows="3" placeholder="What would you like to discuss?"></textarea>
          <button type="submit" class="btn">Post Comment</button>
        </form>
      </div>
    </details>
  </div>`;
}

function renderPagination(totalGroups) {
  paginationContainer.innerHTML = '';
  const totalPages = Math.ceil(totalGroups / groupsPerPage);
  if (totalPages <= 1) return;
  if (currentPage > 1) paginationContainer.innerHTML += `<a href="#" data-page="${currentPage - 1}">«</a>`;
  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.innerHTML += `<a href="#" class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</a>`;
  }
  if (currentPage < totalPages) paginationContainer.innerHTML += `<a href="#" data-page="${currentPage + 1}">»</a>`;
  paginationContainer.querySelectorAll('a').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    currentPage = parseInt(e.target.dataset.page);
    displayGroups(window.lastFilteredGroups);
  }));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function showNoResultsDialog() {
  noResultsDialog.showModal();
}

function closeNoResultsDialog() {
  noResultsDialog.close();
  courseCodeInput.value = '';
  collegeSelect.selectedIndex = 0;
  loadStudyGroups();
}

function openCreateForm(e) {
  if (e) e.preventDefault();
  newGroupForm.style.display = 'block';
  newGroupForm.classList.add('show');
  newGroupForm.scrollIntoView({ behavior: 'smooth' });
}

function confirmFormCancel() {
  newGroupForm.classList.remove('show');
  modal.close();
  newGroupForm.reset();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function setupEventListeners() {
  document.querySelectorAll('.join-btn').forEach(btn => btn.addEventListener('click', handleJoinClick));
  document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteClick));
  document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEditClick));
  document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', e => e.target.closest('details')?.removeAttribute('open')));
  document.querySelectorAll('.comment-form').forEach(form => {
    if (!form.dataset.listenerAttached) {
      form.addEventListener('submit', handlePostClick);
      form.dataset.listenerAttached = 'true';
    }
  });

}

function handleDeleteClick(e) {
  currentGroupElement = e.target.closest('.group-listing');
  const groupName = currentGroupElement.querySelector('summary p:last-child').textContent;
  actionDialogTitle.textContent = 'Delete Study Group';
  actionDialogMessage.textContent = `Are you sure you want to delete the "${groupName}" group? This action cannot be undone.`;
  actionDialog.showModal();
}

function handleJoinClick(e) {
  currentGroupElement = e.target.closest('.group-listing');
  const groupName = currentGroupElement.querySelector('summary p:last-child').textContent;
  const joinBtn = e.target;
  if (joinBtn.textContent === 'Joined') return showToast('You have already joined this group!');
  actionDialogTitle.textContent = 'Join Study Group';
  actionDialogMessage.textContent = `You're about to join the "${groupName}" study group.`;
  actionDialog.showModal();
}

function handleEditClick(e) {
  currentGroupElement = e.target.closest('.group-listing');
  editCourseCode.value = currentGroupElement.querySelector('summary p:first-child').textContent.replace('Course: ', '').trim();
  editGroupName.value = currentGroupElement.querySelector('summary p:last-child').textContent.trim();
  editDescription.value = currentGroupElement.querySelector('.group-description').textContent.replace('Description: ', '').trim();
  const collegeText = currentGroupElement.querySelector('.group-college').textContent.replace('College: ', '').trim();
  [...editCollege.options].forEach(opt => opt.selected = (opt.text === collegeText));
  editDialog.showModal();
}

function handleActionConfirm() {
  actionDialog.close();
  const title = actionDialogTitle.textContent;
  if (title.includes('Delete')) {
    const groupName = currentGroupElement.querySelector('summary p:last-child').textContent;
    currentGroupElement.remove();
    showToast(`"${groupName}" has been deleted successfully.`);
  } else if (title.includes('Join')) {
    const memberList = currentGroupElement.querySelector('.member-list');
    const newMember = document.createElement('span');
    newMember.className = 'member-badge';
    newMember.textContent = 'You';
    memberList.appendChild(newMember);
    const countElement = currentGroupElement.querySelector('.members-section p');
    const currentCount = parseInt(countElement.textContent.match(/\d+/)[0]);
    countElement.textContent = countElement.textContent.replace(/\d+/, currentCount + 1);
    const joinBtn = currentGroupElement.querySelector('.join-btn');
    joinBtn.textContent = 'Joined';
    joinBtn.disabled = true;
    showToast(`You've successfully joined the group!`);
  }
}

function handleEditSubmit(e) {
  e.preventDefault();
  currentGroupElement.querySelector('summary p:first-child').textContent = `Course: ${editCourseCode.value}`;
  currentGroupElement.querySelector('summary p:last-child').textContent = editGroupName.value;
  currentGroupElement.querySelector('.group-description').textContent = `Description: ${editDescription.value}`;
  currentGroupElement.querySelector('.group-college').textContent = `College: ${editCollege.options[editCollege.selectedIndex].text}`;
  editDialog.close();
  showToast('Group updated successfully!');
}

function handleCreateGroupSubmit(e) {
  e.preventDefault();
  const formData = new FormData(newGroupForm);
  const group = {
    id: Date.now(),
    course_code: formData.get('newCourseCode'),
    course_name: formData.get('groupName'),
    description: formData.get('groupDescription') || '',
    college: newGroupForm.querySelector('#newCollege option:checked').textContent,
    created: formData.get('creationDate'),
    members: [],
    comments: []
  };

  // Append group after the header
  const html = renderGroupHTML(group);
  const existingHeader = resultsSection.querySelector('h3');
  if (existingHeader) {
    existingHeader.insertAdjacentHTML('afterend', html);
  } else {
    resultsSection.innerHTML += html;
  }

  setupEventListeners();
  newGroupForm.reset();
  newGroupForm.classList.remove('show');
  showToast(`Study group "${group.course_name}" created.`);
}

function handlePostClick(e) {
  e.preventDefault();
  const form = e.target;
  const textarea = form.querySelector('textarea');
  const content = textarea.value.trim();

  if (content) {
    const newComment = document.createElement('article');
    newComment.className = 'comment';
    newComment.innerHTML = `
      <strong>You</strong> • 
      <small>${new Date().toLocaleTimeString()}</small>
      <p>${content}</p>`;
      
    const commentsSection = form.closest('.comments-section');
    commentsSection.insertBefore(newComment, form);
    textarea.value = '';
    showToast('Comment added.');
  }
}
