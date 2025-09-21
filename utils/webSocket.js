let socketOpen = false;
let socketTask = null;
const messageHandlers = {};

/**
 * 建立 WebSocket 连接
 * @param {string|number} userId - 用户ID
 * @param {Function} onMessageReceived - 消息回调函数
 */
export function connect(userId, onMessageReceived) {
    const uid = String(userId);
    let wsUrl = '';

    // 更新或添加该用户的回调函数
    if (typeof onMessageReceived === 'function') {
        messageHandlers[uid] = onMessageReceived;
    }

    // 如果连接已打开，直接返回，不需要重新连接
    if (socketOpen && socketTask) {
        console.log("WebSocket连接已存在，使用现有连接");
        return;
    }

    // 如果没有连接或已关闭，才创建新连接
    if (!socketTask || !socketOpen) {
        wsUrl = `ws://localhost:8080/ws?userId=${uid}`;
        console.log("正在建立WebSocket连接:", wsUrl);
        socketTask = wx.connectSocket({ url: wsUrl });
    }

    // 事件监听只需注册一次
    if (socketTask) {
        socketTask.onOpen(() => {
            console.log("WebSocket 已连接", wsUrl || (socketTask.url || ''));
            socketOpen = true;
        });

        socketTask.onMessage((res) => {
            try {
                const message = JSON.parse(res.data);
                console.log("WebSocket收到消息:", message);
                const receiverUid = String(message.receiver);
                // 调用接收者的回调函数
                if (messageHandlers[receiverUid] && typeof messageHandlers[receiverUid] === 'function') {
                    messageHandlers[receiverUid](message);
                }
                // 也要调用发送者的回调函数，以便发送者能收到确认消息
                const senderUid = String(message.sender);
                if (senderUid !== receiverUid && messageHandlers[senderUid] && typeof messageHandlers[senderUid] === 'function') {
                    messageHandlers[senderUid](message);
                }
            } catch (e) {
                console.error("无法解析收到的消息", res.data);
            }
        });

        socketTask.onClose(() => {
            console.log("WebSocket 已断开");
            socketOpen = false;
        });

        socketTask.onError((err) => {
            console.error("WebSocket Error:", err);
            socketOpen = false;
        });
    }
}

/**
 * 发送消息到 WebSocket 服务器
 * @param {Object} message - 要发送的消息对象
 */
export function sendMessage(message) {
    if (!socketOpen || !socketTask) {
        console.warn("WebSocket 尚未连接，无法发送消息");
        return;
    }
    const payload = JSON.stringify(message);
    console.log("发送WebSocket消息:", message);
    socketTask.send({ data: payload });
}

/**
 * 断开 WebSocket 连接并移除指定用户的回调
 * @param {string|number} userId - 用户ID
 */
export function disconnect(userId) {
    const uid = String(userId);
    if (messageHandlers[uid]) {
        delete messageHandlers[uid];
    }
    // 只有当没有其他用户监听时才关闭连接
    if (Object.keys(messageHandlers).length === 0 && socketTask && socketOpen) {
        socketTask.close();
    }
}