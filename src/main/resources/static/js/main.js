'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}


function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    var li = document.createElement('li');

    if (message.type === 'JOIN') {
        li.classList.add('event-message');
        li.textContent = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        li.classList.add('event-message');
        li.textContent = message.sender + ' left!';
    } else {
        // WhatsApp-style bubble
        li.className = ''; // clear any default
        li.classList.add('message');

        if (message.sender === username) {
            li.classList.add('sent');      // right, green
        } else {
            li.classList.add('received');  // left, gray
        }

        var nameSpan = document.createElement('span');
        nameSpan.textContent = message.sender;
        nameSpan.style.display = 'block';
        nameSpan.style.fontSize = '11px';
        nameSpan.style.color = '#8696a0';
        nameSpan.style.marginBottom = '2px';

        var textSpan = document.createElement('span');
        textSpan.textContent = message.content;

        li.appendChild(nameSpan);
        li.appendChild(textSpan);
    }

    console.log('classes on li:', li.className);  // <— check in console

    messageArea.appendChild(li);
    messageArea.scrollTop = messageArea.scrollHeight;
}



function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)
