// Set Cookie function
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000)); // Set expiration date
    let expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Get Cookie function
export function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
}

// Check if user is authenticated
export function isAuthenticated() {
    const token = getCookie('auth_token');  // Check token in cookies
    return token !== null;  // Return true if token exists
}

// Login User function
export function loginUser() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert("Пожалуйста, заполните оба поля.");
        return;
    }

    const loginData = { email, password };

    fetch('http://localhost:5000/api/v1/User/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
    })
    .then(response => {
        if (response.status === 200) {
            return response.text();  // Read the token from the response body
        } else {
            return response.text().then(error => {
                alert("Ошибка входа");
                return Promise.reject(error);
            });
        }
    })
    .then(token => {
        if (token) {
            setCookie('auth_token', token, 7);  
            updateLoginBlock();
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
    });
}

// Toggle Feedback Form visibility
export function toggleFeedbackForm() {
    const feedbackForm = document.getElementById('feedbackForm');
    
    if (isAuthenticated()) {
        feedbackForm.style.display = 'block';  // Show form if authenticated
    } else {
        feedbackForm.style.display = 'none';  // Hide form if not authenticated
    }
}

// Handle page load
window.onload = function() {
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        toggleFeedbackForm();  // Show feedback form if authenticated
    }
};

// utility.js

export function searchText() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let mainContent = document.getElementById('mainContent');

    // Remove previous highlights
    let cleanedContent = mainContent.innerHTML.replace(/<mark>(.*?)<\/mark>/g, '$1');

    // If input is empty, reset the content
    if (input.length === 0) {
        mainContent.innerHTML = cleanedContent;
        return;
    }

    let regex = new RegExp(`(${input})`, 'gi'); // Create a case-insensitive regex

    // Highlight the search text
    let highlightedContent = cleanedContent.replace(regex, '<mark>$1</mark>');

    // Update the content with highlights
    mainContent.innerHTML = highlightedContent;
}


const form = document.getElementById('feedbackForm');

// Listen for form submission
if (form) {
    form.addEventListener('submit-button', async (e) => {
    e.preventDefault(); // Prevent the default form submission
    
    // Get the message from the form
    const message = document.getElementById('message').value;
    const mail = document.getElementById('email').value;
    // Prepare the data for the request
    const feedbackData = {
        message: message,
        email: mail
    };

    try {
        // Send the feedback data as a POST request to your API
        const response = await fetch('http://localhost:5000/api/Feedback/createFeedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedbackData),  // Send the message as the request body
        });

        if (response.ok) {
            const responseData = await response.json();
            alert('Отзыв отправлен успешно!');
            console.log('Response:', responseData); // Optionally log the response data
        } else {
            alert('Произошла ошибка при отправке отзыва');
        }
    } catch (error) {
        alert('Произошла ошибка при отправке запроса');
        console.error('Error:', error);
    }
})};

// Fetch username using the GUID
export async function fetchUsernameByGUID(guid) {
    try {
        const token = getCookie('auth_token');
        const response = await fetch(`http://localhost:5000/api/v1/User/id:guid?id=${guid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            return data.name; // Предполагается, что имя пользователя возвращается в поле `name`
        } else {
            console.error('Ошибка получения имени пользователя:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Ошибка:', error);
        return null;
    }
}

// Parse GUID from token
export function parseGUIDFromToken() {
    const token = getCookie('auth_token'); // Получаем токен из куки
    if (!token) return null;

    try {
        // Decode the token payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Extract the GUID from the `nameidentifier` claim
        return payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || null;
    } catch (error) {
        console.error('Ошибка при парсинге токена:', error);
        return null;
    }
}


// Update login block with username using GUID
export async function updateLoginBlock() {
    const guid = parseGUIDFromToken(); // Получаем GUID из токена
    const username = guid ? await fetchUsernameByGUID(guid) : null;
    const loginBlock = document.querySelector('.login-block');
    if (loginBlock) {
    if (username) {
        // Если пользователь аутентифицирован
        loginBlock.innerHTML = `
        <td width=21.5%>
            <p style="margin: 0; font-size: 16px; color: #333;">
                Добро пожаловать, <strong style="color: #007bff;">${username}</strong>!
            </p>

            <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                <a href="javascript:void(0);" onclick="openCartPopup()" style="text-decoration: none;">
                    <img src="/source/cart.png" alt="Корзина" style="width: 40px; height: 40px;" />
                </a>

                <button onclick="logoutUser()" class="submit-button">Выйти</button>
            </div>
        </td>
        `;
    } else {
        // Если пользователь не аутентифицирован
        loginBlock.innerHTML = `
            <form>
                <input type="text" id="loginEmail" class="input-field" placeholder="Email">
                <input type="password" id="loginPassword" class="input-field" placeholder="Пароль">
                <button type="button" class="submit-button" onclick="loginUser()">Войти</button>
                <a href="authorize.html" class="register-link">Регистрация</a>
            </form>
        `;
    }
    
    // Ensure the loginBlock doesn't change size after content is updated
    loginBlock.style.minHeight = "60px";  // Set a minimum height to prevent layout shift
    loginBlock.style.display = "flex";
    loginBlock.style.flexDirection = "column";
    loginBlock.style.justifyContent = "center";
    loginBlock.style.alignItems = "center";  // Ensures everything is vertically aligned
}
}

// Logout User function
export function logoutUser() {
    setCookie('auth_token', '', -1); // Удаляем токен
    location.reload(); // Обновляем страницу
}

const cartPopup = document.getElementById('cartPopup');
const cartPopupOverlay = document.getElementById('cartPopupOverlay');
const closeCartPopupButton = document.getElementById('closeCartPopup');


export function openCartPopup() {
    // Создаем overlay (фон попапа)
    const overlay = document.createElement('div');
    overlay.classList.add('cartPopupOverlay');
    overlay.addEventListener('click', closeCartPopup);  // Закрытие при клике на фон

    // Создаем сам попап
    const popup = document.createElement('div');
    popup.classList.add('popup');

    // Кнопка закрытия попапа
    const closeButton = document.createElement('button');
    closeButton.classList.add('popup-close');
    closeButton.textContent = 'X';
    closeButton.addEventListener('click', closeCartPopup);

    // Контейнер для списка товаров в корзине
    const cartItemsContainer = document.createElement('div');
    cartItemsContainer.id = 'cartItemsContainer';
    cartItemsContainer.textContent = 'Товары добавляются динамически';

    // Контейнер для отображения общей суммы
    const cartTotal = document.createElement('div');
    cartTotal.classList.add('total-counter');
    cartTotal.id = 'cartTotal';
    cartTotal.textContent = 'Итого: 0 руб.';

    const clearCartButton = document.createElement('button');
    clearCartButton.id = 'clearCartButton';
    clearCartButton.textContent = 'Очистить корзину';
    clearCartButton.addEventListener('click', () => {
        clearCart(); // Очистка корзины при нажатии на кнопку
    });

    // Кнопка оформления заказа
    const checkoutButton = document.createElement('button');
    checkoutButton.id = 'checkoutButton';
    checkoutButton.textContent = 'Оформить заказ';

    

    // Добавляем все элементы в попап
    popup.appendChild(closeButton);
    popup.appendChild(cartItemsContainer);
    popup.appendChild(cartTotal);
    popup.appendChild(checkoutButton);
    popup.appendChild(clearCartButton)

    // Добавляем overlay и popup в body
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Блокируем прокрутку страницы при открытии попапа
    document.body.style.overflow = 'hidden';

    // Инициализация списка товаров и общей стоимости
    updateCartPopup();
}

export function clearCart() {
    // Удаляем данные корзины из localStorage
    localStorage.removeItem('cart');
    // Обновляем отображение корзины, если попап открыт
    updateCartPopup();
}

// Функция для закрытия попапа
export function closeCartPopup() {
    const popup = document.querySelector('.popup');
    const overlay = document.querySelector('.cartPopupOverlay');
    if (popup) {
        popup.remove();
    }
    if (overlay) {
        overlay.remove();  // Убираем overlay
    }

    document.body.style.overflow = '';  // Восстанавливаем прокрутку страницы
}

document.addEventListener('DOMContentLoaded', function () {
    const cartPopupOverlay = document.querySelector('.cartPopupOverlay');
    const closeCartButton = document.querySelector('.popup-close');

    if (cartPopupOverlay) {
        cartPopupOverlay.addEventListener('click', closeCartPopup); // Закрытие при клике на фон
    }
    if (closeCartButton) {
        closeCartButton.addEventListener('click', closeCartPopup); // Закрытие по кнопке ✖
    }
});


document.addEventListener('DOMContentLoaded', function () {
    const cartPopupOverlay = document.getElementById('cartPopupOverlay');
    const closeCartButton = document.getElementById('closeCartPopup');

    if (cartPopupOverlay) {
        cartPopupOverlay.addEventListener('click', closeCartPopup); // Закрытие при клике на фон
    }
    if (closeCartButton) {
        closeCartButton.addEventListener('click', closeCartPopup); // Закрытие по кнопке ✖
    }
});

// Обновить содержимое корзины
export function updateCartPopup() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const totalAmount = document.getElementById('cartTotal');
    
    // Получаем товары из localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartItemsContainer.innerHTML = ''; // Очищаем контейнер с товарами
    let total = 0;
    if (cart.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'Ваша корзина пуста';
        emptyMessage.style.textAlign = 'center';
        cartItemsContainer.appendChild(emptyMessage);
    } else {
    // Добавляем товары в контейнер
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
        <div class="cart-item-details">
            <img src="http://localhost:5000${item.imagePath}" alt="${item.name}" class="cart-item-image" />
            <p>${item.name} - ${item.price} руб.</p>
        </div>
        <div class="quantity-container">
            <button class="decrease-btn" onclick="decreaseItemQuantity('${item.id}')">-</button>
            <span class="item-quantity">${item.quantity}</span>
            <button class="increase-btn" onclick="increaseItemQuantity('${item.id}')">+</button>
        </div>
        `;
        cartItemsContainer.appendChild(itemElement);
        total += item.price * item.quantity;
    });
    }

    totalAmount.textContent = total.toFixed(2); // Обновляем итоговую сумму
}

export function removeItemFromCart(id) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = cart.filter(item => item.id !== id);

    localStorage.setItem('cart', JSON.stringify(updatedCart));
    //updateCartPopup();  // Update the cart popup after removing the item
}

export function addItemToCart(id, name, price, imagePath) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        // If the item already exists in the cart, increase its quantity
        existingItem.quantity++;
    } else {
        // If the item doesn't exist in the cart, add a new item
        cart.push({ id, name, price, quantity: 1, imagePath });
    }

    // Save the updated cart back to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
   // updateCartPopup();  // Update the cart popup to reflect the changes
}


export function increaseItemQuantity(id) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.id === id);

    if (item) {
        item.quantity++; // Увеличиваем количество
    }

    localStorage.setItem('cart', JSON.stringify(cart)); // Сохраняем изменения
    updateCartPopup(); // Обновляем отображение корзины
}

export function decreaseItemQuantity(id) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.id === id);

    if (itemIndex !== -1) {
        const item = cart[itemIndex];
        if (item.quantity > 1) {
            item.quantity--; // Уменьшаем количество
        } else {
            cart.splice(itemIndex, 1); // Удаляем товар, если количество стало 0
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart)); // Сохраняем изменения
    updateCartPopup(); // Обновляем отображение корзины
}



// Оформление заказа (переход на страницу оформления)
export function checkout() {
    if (JSON.parse(localStorage.getItem('cart')).length === 0) {
    } else {
        window.location.href = 'checkout.html'; // Переход на страницу оформления заказа
    }
}



window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.openCartPopup = openCartPopup;
window.closeCartPopup = closeCartPopup;
window.addItemToCart = addItemToCart;
window.increaseItemQuantity = increaseItemQuantity;
window.decreaseItemQuantity = decreaseItemQuantity;
