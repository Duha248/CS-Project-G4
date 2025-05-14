const API_BASE = 'https://1ba4cb59-eb5b-461d-b194-f1728f7891f1-00-a2ok4849adfa.sisko.replit.dev/api.php';

const createBtn = document.getElementById('create-btn');
const createBtnI = document.getElementById('create-btnI');
const newGroupForm = document.getElementById('newGroupForm');
const cancelBtn = document.querySelector('#newGroupForm .btn-secondary');
const modal = document.getElementById('cancelConfirmationModal');
const confirmCancel = document.getElementById('confirmCancel');
const denyCancel = document.getElementById('denyCancel');
const resultsSection = document.querySelector('.results');
const searchForm = document.getElementById('searchForm');
const paginationContainer = document.querySelector('.pagination_section');
const toast = document.getElementById('toast');
const noResultsDialog = document.getElementById('noResultsDialog');
const closeNoResultsButton = document.getElementById('closeNoResults');
const courseCodeInput = document.getElementById('courseCode');
const collegeSelect = document.getElementById('college');
const sortSelect = document.getElementById('sortSelect');

const editDialog = document.getElementById('editDialog');
const editCourseCode = document.getElementById('editCourseCode');
const editGroupName = document.getElementById('editGroupName');
const editDescription = document.getElementById('editDescription');
const editCollege = document.getElementById('editCollege');
const editDialogCancel = document.getElementById('editDialogCancel');

const actionDialog = document.getElementById('actionDialog');
const actionDialogTitle = document.getElementById('actionDialogTitle');
const actionDialogMessage = document.getElementById('actionDialogMessage');
const actionDialogConfirm = document.getElementById('actionDialogConfirm');
const actionDialogCancel = document.getElementById('actionDialogCancel');

let currentPage = 1;
const groupsPerPage = 3;
let currentGroupElement = null;
window.lastFilteredGroups = [];

window.addEventListener('DOMContentLoaded', () => {
  loadStudyGroups();

  searchForm.addEventListener('submit', handleSearchSubmit);
  closeNoResultsButton.addEventListener('click', closeNoResultsDialog);
  createBtn.addEventListener('click', openCreateForm);
createBtnI.addEventListener('click', (e) => {
  e.preventDefault();
  noResultsDialog.close();
  openCreateForm();  
});
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal.showModal());
  if (confirmCancel) confirmCancel.addEventListener('click', confirmFormCancel);
  if (denyCancel) denyCancel.addEventListener('click', () => modal.close());
  actionDialogConfirm.addEventListener('click', handleActionConfirm);
  actionDialogCancel.addEventListener('click', () => actionDialog.close());
  editDialogCancel.addEventListener('click', () => editDialog.close());
  newGroupForm.addEventListener('submit', handleCreateGroupSubmit);
  document.getElementById('editGroupForm').addEventListener('submit', handleEditSubmit);
});

// Load and display groups
async function loadStudyGroups(filters = {}, fromSearch = false) {

  try {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}?action=get_groups&${query}`);
    const groups = await res.json();
    window.lastFilteredGroups = groups;
    displayGroups(groups, fromSearch);
  } catch (error) {
    console.error('Failed to load groups:', error);
    showToast('Failed to load groups', true);
  }
}

function displayGroups(groups, fromSearch = false) {
  if ((!groups || !groups.length) && fromSearch) {
    showNoResultsDialog();
    return;
  } else if (!groups || !groups.length) {
    resultsSection.innerHTML = '<h3>No study groups yet. Try creating one!</h3>';
    paginationContainer.innerHTML = '';
    return;
  }

  const startIndex = (currentPage - 1) * groupsPerPage;
  const paginatedGroups = groups.slice(startIndex, startIndex + groupsPerPage);

  resultsSection.innerHTML = `
    <h3>Available Groups (${groups.length})</h3>
    ${paginatedGroups.map(renderGroupHTML).join('')}
  `;
  renderPagination(groups.length);
  setupEventListeners();
}

function renderGroupHTML(group) {
  const commentCount = group.comments?.length || 0;
  return `
    <div class="group-listing" data-group-id="${group.id}">
      <details>
        <summary>
          <p><strong>${group.course_code}</strong></p>
          <p>${group.course_name}</p>
          <small>${commentCount} comments</small>
        </summary>
        <div class="group-details">
          <p><strong>College:</strong> ${group.college}</p>
          <p><strong>Description:</strong> ${group.description || 'No description'}</p>
         <p><strong>Created:</strong> ${formatDate(group.created)}</p>
          <div class="controllers">
            <button class="btn">Edit</button>
            <button class="btn btn-danger delete-btn">Delete</button>
            <button class="btn btn-secondary back-btn">Back</button>

          </div>
          <div class="comments-section">
            <h4>Discussion (${commentCount})</h4>
            ${group.comments?.map(c => `
              <article class="comment">
                <strong>${c.name}</strong> • <small>${formatDateTime(c.time)}</small>
                <p>${c.content}</p>
              </article>`).join('') || '<p>No comments yet</p>'}
            <form class="comment-form">
              <textarea placeholder="Share your thoughts..." required></textarea>
              <button type="submit" class="btn">Post Comment</button>
            </form>
          </div>
        </div>
      </details>
    </div>
  `;
}

function renderPagination(totalGroups) {
  paginationContainer.innerHTML = '';
  const totalPages = Math.ceil(totalGroups / groupsPerPage);
  if (totalPages <= 1) return;

  if (currentPage > 1) {
    paginationContainer.innerHTML += `<a href="#" data-page="${currentPage - 1}">«</a>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.innerHTML += `<a href="#" class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</a>`;
  }

  if (currentPage < totalPages) {
    paginationContainer.innerHTML += `<a href="#" data-page="${currentPage + 1}">»</a>`;
  }

  paginationContainer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      currentPage = parseInt(e.target.dataset.page);
      displayGroups(window.lastFilteredGroups);
      window.scrollTo({ top: resultsSection.offsetTop, behavior: 'smooth' });
    });
  });
}

function formatDate(dateString) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Handlers
async function handleSearchSubmit(e) {
  e.preventDefault();
  currentPage = 1;
  
  loadStudyGroups({
    courseCode: courseCodeInput.value,
    college: collegeSelect.value, 
    sortBy: sortSelect.value
  }, true);
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

async function handleCreateGroupSubmit(e) {
  e.preventDefault();
  const formData = new FormData(newGroupForm);
  try {
    const res = await fetch(`${API_BASE}?action=create_group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_code: formData.get('newCourseCode'),
        course_name: formData.get('groupName'),
        description: formData.get('groupDescription'),
        college: newGroupForm.querySelector('#newCollege option:checked').text
      })
    });
    if (!res.ok) throw new Error('Failed to create group');
    showToast('Group created!');
    newGroupForm.reset();
    newGroupForm.classList.remove('show');
    loadStudyGroups();
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleEditSubmit(e) {
  e.preventDefault();
  const groupId = currentGroupElement.dataset.groupId;
  try {
    const res = await fetch(`${API_BASE}?action=update_group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: groupId,
        course_code: editCourseCode.value,
        course_name: editGroupName.value,
        description: editDescription.value,
        college: editCollege.options[editCollege.selectedIndex].text,
      })
    });
    if (!res.ok) throw new Error('Update failed');
    showToast('Group updated!');
    editDialog.close();
    loadStudyGroups();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleDeleteClick() {
  const groupId = currentGroupElement.dataset.groupId;
  
  try {
    const response = await fetch(`${API_BASE}?action=delete_group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: groupId })
    });
    
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Delete error:", errorData);
      throw new Error(errorData.message || 'Failed to delete group');
    }
    
    const data = await response.json();
    console.log("Delete success:", data);
    showToast('Group deleted successfully');
    currentGroupElement.remove();
    loadStudyGroups();

  } catch (error) {
    console.error("Full deletion error:", error);
    showToast(error.message || 'Failed to delete group', true);
  }
}

async function handlePostClick(e) {
  e.preventDefault();
  const form = e.target;
  const textarea = form.querySelector('textarea');
  const content = textarea.value.trim();
  const groupId = form.closest('.group-listing').dataset.groupId;
  if (!content) return;

  try {
    const res = await fetch(`${API_BASE}?action=add_comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group_id: groupId,
        member_id: 11,
        content: content
      })
    });
    if (!res.ok) throw new Error('Failed to post comment');
    
    textarea.value = '';
    showToast('Comment posted');
await loadStudyGroups();
    
    // Find the group element again after reload
    const newGroupElement = document.querySelector(`.group-listing[data-group-id="${groupId}"]`);
    if (newGroupElement) {
      // Open the details
      const details = newGroupElement.querySelector('details');
      if (details) {
        details.open = true;}}
        } catch (err) {
    showToast(err.message, true);
  }
}

// Event Setup
function setupEventListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      currentGroupElement = e.target.closest('.group-listing');
      const groupId = currentGroupElement.dataset.groupId;
      const group = window.lastFilteredGroups.find(g => g.id == groupId);
      if (!group) return;
      editCourseCode.value = group.course_code;
      editGroupName.value = group.course_name;
      editDescription.value = group.description || '';
      Array.from(editCollege.options).forEach(option => {
        option.selected = option.text === group.college;
      });
      editDialog.showModal();
    });
  });
  document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', e => e.target.closest('details')?.removeAttribute('open')));

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      currentGroupElement = e.target.closest('.group-listing');
      const name = currentGroupElement.querySelector('summary p:nth-child(2)').textContent;
      actionDialogTitle.textContent = 'Delete Group';
      actionDialogMessage.textContent = `Are you sure you want to delete "${name}"?`;
      actionDialog.showModal();
    });
  });

  document.querySelectorAll('.comment-form').forEach(form => {
    if (!form.dataset.listenerAttached) {
      form.addEventListener('submit', handlePostClick);
      form.dataset.listenerAttached = 'true';
    }
  });
}

async function handleActionConfirm() {
  actionDialog.close();
  if (actionDialogTitle.textContent.includes('Delete')) {
    await handleDeleteClick();
  }
}

// Utilities
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = isError ? 'toast-notification error show' : 'toast-notification show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function openCreateForm(e) {
  if (e) e.preventDefault();
  newGroupForm.style.display = 'block';
  newGroupForm.classList.add('show');
  newGroupForm.scrollIntoView({ behavior: 'smooth' });
}

function confirmFormCancel() {
  newGroupForm.reset();
  newGroupForm.classList.remove('show');
  modal.close();
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
