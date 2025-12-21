(function () {
    const dom = {
        navItems: document.querySelectorAll('.nav-item'),
        views: document.querySelectorAll('.view-section'),
        pageTitle: document.getElementById('page-title'),
        actionLinks: document.querySelectorAll('.action-link'),
        totalCount: document.getElementById('total-count'),
        outOfStockCount: document.getElementById('out-of-stock-count'),
        totalValue: document.getElementById('total-value'),
        tableBody: document.getElementById('products-table-body'),
        loadingSpinner: document.getElementById('loading-spinner'),
        errorMessage: document.getElementById('error-message'),
        emptyState: document.getElementById('empty-state'),
        searchInput: document.getElementById('search-input'),
        categoryFilter: document.getElementById('category-filter'),
        ordersTableBody: document.getElementById('orders-table-body'),
        ordersEmptyState: document.getElementById('orders-empty-state'),
        btnAdd: document.getElementById('btn-add-product'),
        productModal: document.getElementById('product-modal'),
        detailsModal: document.getElementById('details-modal'),
        productForm: document.getElementById('product-form'),
        modalTitle: document.getElementById('modal-title'),
        inputId: document.getElementById('product-id'),
        inputName: document.getElementById('product-name'),
        inputCategory: document.getElementById('product-category'),
        inputPrice: document.getElementById('product-price'),
        inputQuantity: document.getElementById('product-quantity'),
        inputImage: document.getElementById('product-image'),
        btnStockIn: document.getElementById('btn-stock-in'),
        btnStockOut: document.getElementById('btn-stock-out'),
        detailsBody: document.getElementById('details-body')
    };

    const state = {
        products: [],
        orders: [],
        loading: false,
        error: null,
        filter: '',
        search: '',
        editingId: null,
        currentView: 'dashboard'
    };

    const API_URL = 'https://ecommerce.routemisr.com/api/v1/products';
    const STORAGE_KEY = 'inventory_products_v4';
    const ORDERS_STORAGE_KEY = 'inventory_orders_v1';

    const VIEW_TITLES = {
        'dashboard': 'Dashboard Overview',
        'products': 'Product Inventory',
        'users': 'User Management',
        'orders': 'Order Management'
    };

    let currentUser = null;

    async function init() {
        const isAuthenticated = sessionStorage.getItem('isAuthenticated');
        const userStr = sessionStorage.getItem('currentUser');

        if (!isAuthenticated || !userStr) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = JSON.parse(userStr);
        updateSidebarUserInfo();

        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('sidebar-toggle');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Logout?')) {
                    sessionStorage.removeItem('isAuthenticated');
                    sessionStorage.removeItem('currentUser');
                    window.location.href = 'login.html';
                }
            });
        }

        applyRolePermissions();

        if (currentUser.role === 'client') switchView('products');
        else switchView('dashboard');

        state.loading = true;
        updateUIState();

        await loadData();
        state.loading = false;
        render();
    }

    async function loadData() {
        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (localData) state.products = JSON.parse(localData);
            else await fetchInitialData();

            const localOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
            if (localOrders) state.orders = JSON.parse(localOrders);
        } catch {}
    }

    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY || e.key === ORDERS_STORAGE_KEY) {
            loadData().then(() => render());
        }
    });

    function updateSidebarUserInfo() {
        const nameEl = document.getElementById('current-user-name');
        const roleEl = document.getElementById('current-user-role');
        const avatarEl = document.getElementById('current-user-avatar');

        if (nameEl) nameEl.textContent = currentUser.name;
        if (roleEl) roleEl.textContent = currentUser.role === 'admin' ? 'Administrator' : 'Client';

        if (avatarEl && currentUser.name) {
            const parts = currentUser.name.split(' ');
            const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].substring(0, 2);
            avatarEl.textContent = initials.toUpperCase();
        }
    }

    function applyRolePermissions() {
        if (currentUser.role === 'client') {
            document.querySelectorAll('.nav-item').forEach(el => {
                const view = el.dataset.view;
                if (['dashboard', 'users'].includes(view)) el.classList.add('hidden');
            });
            if (dom.btnAdd) dom.btnAdd.classList.add('hidden');
        }
    }

    async function fetchInitialData() {
        try {
            const response = await fetch(API_URL);
            const json = await response.json();
            state.products = json.data.map(item => {
                let category = 'Home';
                const lowerCat = (item.category?.name || '').toLowerCase();
                if (lowerCat.includes('electronic') || lowerCat.includes('tech')) category = 'Electronics';
                if (lowerCat.includes('men') || lowerCat.includes('women') || lowerCat.includes('fashion') || lowerCat.includes('clothing')) category = 'Clothing';

                return {
                    id: Date.now() + Math.floor(Math.random() * 10000),
                    name: item.title,
                    category: category,
                    price: item.price,
                    quantity: item.quantity || 0,
                    description: item.description,
                    image: item.imageCover
                };
            });
            saveToStorage();
        } catch {
            state.products = [];
        }
    }

    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.products));
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(state.orders));
        render();
    }

    function switchView(viewName) {
        if (currentUser.role === 'client' && !['products', 'orders'].includes(viewName)) return;

        state.currentView = viewName;
        if (dom.pageTitle) dom.pageTitle.textContent = VIEW_TITLES[viewName] || 'Inventory';

        dom.navItems.forEach(item => {
            if (item.dataset.view === viewName) item.classList.add('active');
            else item.classList.remove('active');
        });

        dom.views.forEach(section => {
            if (section.id === `view-${viewName}`) section.classList.remove('hidden');
            else section.classList.add('hidden');
        });

        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }

        if (viewName === 'users' && currentUser.role === 'admin') renderUsers();
        if (viewName === 'orders') renderOrders();
    }

    function renderUsers() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const users = JSON.parse(localStorage.getItem('inventory_users') || '[]');

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No users found.</td></tr>';
            return;
        }

        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-medium">${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td><span class="badge ${u.role === 'admin' ? 'badge-warning' : 'badge-success'}">${u.role}</span></td>
                <td style="font-family: monospace; color: var(--text-muted);">${escapeHtml(u.password)}</td>
                <td>${u.joined || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderOrders() {
        if (!dom.ordersTableBody) return;
        dom.ordersTableBody.innerHTML = '';

        let filteredOrders = state.orders.filter(o => o.status !== 'cancelled');

        if (currentUser.role === 'client') {
            filteredOrders = filteredOrders.filter(o => o.userEmail === currentUser.email);
        }

        filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredOrders.length === 0) {
            if (dom.ordersEmptyState) dom.ordersEmptyState.classList.remove('hidden');
        } else {
            if (dom.ordersEmptyState) dom.ordersEmptyState.classList.add('hidden');

            filteredOrders.forEach(order => {
                const tr = document.createElement('tr');
                const isCancelled = order.status === 'cancelled';
                let actionBtn = '';

                if (currentUser && currentUser.role === 'admin') {
                    actionBtn = `
                        <select class="status-select" data-id="${order.id}" style="padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); font-size: 0.8rem;">
                            <option value="placed" ${order.status === 'placed' ? 'selected' : ''}>Placed</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" style="color:red;">Cancel & Remove</option>
                        </select>
                     `;
                } else {
                    if (!isCancelled) {
                        actionBtn = `<button class="btn btn-xs btn-outline cancel-order-btn" data-id="${order.id}" style="color:var(--danger-text); border-color:var(--danger-text);">Cancel</button>`;
                    } else {
                        actionBtn = `<span class="text-sm text-gray">Cancelled</span>`;
                    }
                }

                const statusClass = {
                    'placed': 'badge-warning',
                    'processing': 'badge-info',
                    'shipped': 'badge-primary',
                    'delivered': 'badge-success',
                    'cancelled': 'badge-danger'
                }[order.status] || 'badge-secondary';

                tr.innerHTML = `
                    <td style="font-family:monospace; color:var(--text-muted);">#${order.id.toString().slice(-6)}</td>
                    <td>
                        <div style="font-size:0.9rem; font-weight:500;">${escapeHtml(order.userName)}</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${order.userEmail}</div>
                    </td>
                    <td>
                         <div style="display:flex; align-items:center; gap:0.5rem;">
                             ${order.productImage ? `<img src="${order.productImage}" style="width:24px; height:24px; border-radius:2px;">` : ''}
                             <span style="max-width: 150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(order.productName)}</span>
                         </div>
                    </td>
                    <td>${order.quantity}</td>
                    <td>$${(order.price * order.quantity).toFixed(2)}</td>
                    <td>${new Date(order.date).toLocaleDateString()}</td>
                    <td><span class="badge ${statusClass}">${order.status}</span></td>
                    <td>${actionBtn}</td>
                `;
                dom.ordersTableBody.appendChild(tr);
            });
        }
    }

    function render() {
        renderStats();
        renderTable();
        updateUIState();
    }

    function renderStats() {
        const total = state.products.length;
        const outOfStock = state.products.filter(p => p.quantity === 0).length;
        const value = state.products.reduce((acc, p) => acc + (p.price * p.quantity), 0);

        dom.totalCount.textContent = total;
        dom.outOfStockCount.textContent = outOfStock;
        if (dom.totalValue) dom.totalValue.textContent = '$' + formatNumber(value);
    }

    function renderTable() {
        dom.tableBody.innerHTML = '';

        const filtered = state.products.filter(p => {
            if (currentUser.role === 'client' && p.quantity <= 0) return false;
            const matchesSearch = p.name.toLowerCase().includes(state.search.toLowerCase());
            const matchesCategory = state.filter ? p.category === state.filter : true;
            return matchesSearch && matchesCategory;
        });

        if (filtered.length === 0 && !state.loading) {
            dom.emptyState.classList.remove('hidden');
        } else {
            dom.emptyState.classList.add('hidden');

            filtered.forEach(p => {
                const tr = document.createElement('tr');
                const status = getStockStatus(p.quantity);

                let actionsHtml = '';
                if (currentUser && currentUser.role === 'admin') {
                    actionsHtml = `
                    <td class="actions-cell">
                        <button class="btn-icon view-btn" data-id="${p.id}" title="View">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                        <button class="btn-icon edit-btn" data-id="${p.id}" title="Edit">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete delete-btn" data-id="${p.id}" title="Delete">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </td>`;
                } else {
                    actionsHtml = `
                     <td class="actions-cell">
                        <button class="btn-icon view-btn" data-id="${p.id}" title="View Details">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary buy-btn" data-id="${p.id}" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; margin-left:0.5rem;">
                            Buy
                        </button>
                    </td>`;
                }

                const imgHtml = p.image
                    ? `<img src="${p.image}" alt="${escapeHtml(p.name)}" style="width:32px; height:32px; object-fit:cover; border-radius:4px;">`
                    : `<div style="width:32px; height:32px; background:#f3f4f6; border-radius:4px; display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-box text-gray"></i></div>`;

                tr.innerHTML = `
                    <td class="font-medium">
                         <div style="display:flex; align-items:center; gap:0.5rem;">
                            ${imgHtml}
                            <span style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(p.name)}</span>
                        </div>
                    </td>
                    <td>${escapeHtml(p.category)}</td>
                    <td>$${parseFloat(p.price).toFixed(2)}</td>
                    <td>${p.quantity}</td>
                    <td><span class="badge ${status.class}">${status.label}</span></td>
                    ${actionsHtml}
                `;
                dom.tableBody.appendChild(tr);
            });
        }
    }

    function updateUIState() {
        if (state.loading) {
            dom.loadingSpinner.classList.remove('hidden');
            dom.tableBody.classList.add('hidden');
        } else {
            dom.loadingSpinner.classList.add('hidden');
            dom.tableBody.classList.remove('hidden');
        }
    }

    function formatNumber(num) {
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toFixed(0);
    }

    function getStockStatus(qty) {
        if (qty === 0) return { label: 'Out of Stock', class: 'badge-danger' };
        if (qty < 10) return { label: 'Low Stock', class: 'badge-warning' };
        return { label: 'In Stock', class: 'badge-success' };
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function updateOrderStatus(id, newStatus) {
        if (newStatus === 'cancelled') {
            cancelOrder(id);
        } else {
            const index = state.orders.findIndex(o => o.id === id);
            if (index !== -1) {
                state.orders[index].status = newStatus;
                saveToStorage();
            }
        }
    }

    function buyProduct(id) {
        const productIndex = state.products.findIndex(p => p.id === id);
        if (productIndex === -1) return;

        const product = state.products[productIndex];
        const qtyStr = prompt(`Enter quantity to buy for "${product.name}" (Max: ${product.quantity}):`, "1");
        if (qtyStr === null) return;

        const qty = parseInt(qtyStr);
        if (isNaN(qty) || qty <= 0 || qty > product.quantity) return;

        if (confirm(`Confirm purchase of ${qty}x ${product.name} for $${(qty * product.price).toFixed(2)}?`)) {
            product.quantity -= qty;
            state.products[productIndex] = product;

            state.orders.push({
                id: Date.now(),
                productId: product.id,
                productName: product.name,
                productImage: product.image,
                price: product.price,
                quantity: qty,
                userId: currentUser.email,
                userName: currentUser.name,
                userEmail: currentUser.email,
                date: new Date().toISOString(),
                status: 'placed'
            });

            saveToStorage();
            switchView('orders');
        }
    }

    function cancelOrder(id) {
        if (!confirm("Are you sure you want to cancel this order? Stock will be restored.")) return;

        const orderIndex = state.orders.findIndex(o => o.id === id);
        if (orderIndex === -1) return;

        const order = state.orders[orderIndex];
        const productIndex = state.products.findIndex(p => p.id === order.productId);
        if (productIndex !== -1) state.products[productIndex].quantity += order.quantity;

        state.orders.splice(orderIndex, 1);
        saveToStorage();
        renderOrders();
    }

    window.downloadReport = () => {
        if (!state.products || state.products.length === 0) return;

        const headers = ["ID", "Name", "Category", "Price", "Quantity", "Value"];
        const rows = state.products.map(p => [
            p.id,
            `"${p.name.replace(/"/g, '""')}"`,
            p.category,
            p.price,
            p.quantity,
            (p.price * p.quantity).toFixed(2)
        ]);

        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    dom.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            if (view) switchView(view);
        });
    });

    dom.actionLinks.forEach(item => {
        item.addEventListener('click', (e) => {
            const target = item.dataset.target;
            if (target) switchView(target);
        });
    });

    if (dom.btnAdd) dom.btnAdd.addEventListener('click', () => openModal());

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => closeModal(dom.productModal));
    });

    document.querySelectorAll('.details-close').forEach(btn => {
        btn.addEventListener('click', () => closeModal(dom.detailsModal));
    });

    window.onclick = (event) => {
        if (event.target === dom.productModal) closeModal(dom.productModal);
        if (event.target === dom.detailsModal) closeModal(dom.detailsModal);
    };

    dom.productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (currentUser.role !== 'admin') return;

        const newProduct = {
            id: state.editingId ? state.editingId : Date.now(),
            name: dom.inputName.value,
            category: dom.inputCategory.value,
            price: parseFloat(dom.inputPrice.value),
            quantity: parseInt(dom.inputQuantity.value),
            image: dom.inputImage.value,
            description: 'Manually added product'
        };

        if (state.editingId) {
            const index = state.products.findIndex(p => p.id === state.editingId);
            if (index !== -1) state.products[index] = newProduct;
        } else {
            state.products.unshift(newProduct);
        }

        saveToStorage();
        closeModal(dom.productModal);
        if (!state.editingId && state.currentView !== 'products') switchView('products');
    });

    if (dom.btnStockIn) {
        dom.btnStockIn.addEventListener('click', () => {
            if (dom.inputQuantity.value <= 0) dom.inputQuantity.value = 10;
            dom.inputQuantity.focus();
        });
    }
    if (dom.btnStockOut) {
        dom.btnStockOut.addEventListener('click', () => {
            dom.inputQuantity.value = 0;
            dom.inputQuantity.focus();
        });
    }

    dom.searchInput.addEventListener('input', (e) => {
        state.search = e.target.value;
        renderTable();
    });

    dom.categoryFilter.addEventListener('change', (e) => {
        state.filter = e.target.value;
        renderTable();
    });

    dom.tableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = parseInt(btn.dataset.id);
        const product = state.products.find(p => p.id === id);

        if (btn.classList.contains('delete-btn')) {
            if (confirm('Delete this product?')) {
                state.products = state.products.filter(p => p.id !== id);
                saveToStorage();
            }
        } else if (btn.classList.contains('edit-btn')) {
            openModal(product);
        } else if (btn.classList.contains('view-btn')) {
            openDetails(product);
        } else if (btn.classList.contains('buy-btn')) {
            buyProduct(id);
        }
    });

    if (dom.ordersTableBody) {
        dom.ordersTableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const id = parseInt(btn.dataset.id);
            if (btn.classList.contains('cancel-order-btn')) cancelOrder(id);
        });

        dom.ordersTableBody.addEventListener('change', (e) => {
            if (e.target.classList.contains('status-select')) {
                const id = parseInt(e.target.dataset.id);
                const newStatus = e.target.value;
                updateOrderStatus(id, newStatus);
            }
        });
    }

    function openModal(product = null) {
        if (product) {
            state.editingId = product.id;
            dom.modalTitle.textContent = 'Edit Product';
            dom.inputId.value = product.id;
            dom.inputName.value = product.name;
            dom.inputCategory.value = product.category;
            dom.inputPrice.value = product.price;
            dom.inputQuantity.value = product.quantity;
            dom.inputImage.value = product.image || '';
        } else {
            state.editingId = null;
            dom.modalTitle.textContent = 'Add New Product';
            dom.productForm.reset();
            dom.inputImage.value = '';
        }
        dom.productModal.classList.remove('hidden');
    }

    function openDetails(p) {
        if (!p) return;
        const status = getStockStatus(p.quantity);
        dom.detailsBody.innerHTML = `
            <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(p.name)}</span></div>
            <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${escapeHtml(p.category)}</span></div>
            <div class="detail-row"><span class="detail-label">Price</span><span class="detail-value">$${parseFloat(p.price).toFixed(2)}</span></div>
            <div class="detail-row"><span class="detail-label">Quantity</span><span class="detail-value">${p.quantity}</span></div>
             <div class="detail-row"><span class="detail-label">Status</span><span class="badge ${status.class}">${status.label}</span></div>
            ${p.image ? `<div style="margin-top:1rem;"><img src="${p.image}" style="width:100%; max-height:200px; object-fit:contain; border-radius:8px;"></div>` : ''}
             <div style="margin-top:1rem;"><span class="detail-label">Description</span><p class="text-sm text-gray" style="margin-top:0.5rem; max-height:100px; overflow-y:auto;">${escapeHtml(p.description)}</p></div>
        `;
        dom.detailsModal.classList.remove('hidden');
    }

    function closeModal(modal) {
        modal.classList.add('hidden');
    }

    init();
})();
