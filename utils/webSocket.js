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

    // 如果已经存在该用户的回调，不再重复连接
    if (messageHandlers[uid]) {
        return;
    }

    // 如果没有连接或已关闭，才创建新连接
    if (!socketTask || !socketOpen) {
        wsUrl = `ws://localhost:8080/ws?userId=${uid}`;
        socketTask = wx.connectSocket({ url: wsUrl });
    }

    // 存储当前用户的回调函数
    if (typeof onMessageReceived === 'function') {
        messageHandlers[uid] = onMessageReceived;
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
                const receiverUid = String(message.receiver);
                if (messageHandlers[receiverUid]) {
                    messageHandlers[receiverUid](message);
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
    if (socketTask && socketOpen) {
        socketTask.close();
    }
}
