# 点赞功能实现说明

## 功能概述
为PetAll（宠物列表）页面添加了点赞功能，用户可以通过点击爱心图标来点赞或取消点赞宠物。

## 实现的功能

### 1. 点赞/取消点赞
- 点击爱心图标可以点赞或取消点赞
- 使用POST接口：`/like/toggle`
- 参数：`targetId`（宠物ID）、`targetType`（目标类型）、`userId`（用户ID）

### 2. 获取点赞数
- 自动获取每个宠物的点赞数
- 使用GET接口：`/like/count`
- 参数：`targetId`（宠物ID）、`targetType`（目标类型）

### 3. 点赞状态显示
- 使用❤️表示已点赞状态
- 使用��表示未点赞状态
- 点赞数实时显示

### 4. 点赞状态查询
- 每次加载宠物列表时自动查询每个宠物的点赞状态
- 使用GET接口：`/like/isLiked`
- 参数：`targetId`（宠物ID）、`targetType`（目标类型）、`userId`（用户ID）
- 确保显示正确的点赞状态，避免重复点赞

## 修改的文件

### PetAll页面
- `pages/PetAll/PetAll.js` - 添加点赞相关方法和数据
- `pages/PetAll/PetAll.wxml` - 在宠物卡片中添加点赞按钮
- `pages/PetAll/PetAll.wxss` - 添加点赞按钮样式

## 使用方法

### 在PetAll页面
- 每个宠物卡片底部都有点赞按钮
- 点击爱心图标进行点赞/取消点赞
- 点赞数实时更新

## 注意事项

1. **用户ID获取**：代码中使用了`app.globalData.userId`，请确保在用户登录后正确设置此值
2. **API接口**：请确保后端API接口正确配置，支持以下接口：
   - POST `/like/toggle` - 点赞/取消点赞
   - GET `/like/count` - 获取点赞数
   - GET `/like/isLiked` - 查询用户是否已点赞
3. **权限验证**：点赞功能需要用户登录状态，请确保`app.globalData.token`正确设置
4. **数据格式**：接口使用表单提交格式（`application/x-www-form-urlencoded`），确保后端能正确解析表单数据

## 事件处理说明

### 事件冒泡处理
- **PetAll页面**：使用 `catchtap="toggleLike"` 来阻止事件冒泡，避免点击点赞按钮时触发宠物卡片的点击事件

### 为什么使用catchtap？
在微信小程序中，`catchtap` 会自动阻止事件冒泡，这是处理嵌套元素点击事件的推荐方式。使用 `catchtap` 可以确保：
- 点击点赞按钮时不会触发父级宠物卡片的点击事件
- 用户可以在不跳转页面的情况下进行点赞操作

## 自定义配置

### 表单提交配置
点赞功能使用表单提交格式，具体配置如下：

- **Content-Type**: `application/x-www-form-urlencoded`
- **数据格式**: 表单数据，包含以下字段：
  - `targetId`: 宠物ID
  - `targetType`: 目标类型（固定为"宠物"）
  - `userId`: 用户ID

**后端接收示例**：
```javascript
// 点赞/取消点赞接口
POST /like/toggle
Content-Type: application/x-www-form-urlencoded

targetId=1&targetType=宠物&userId=1

// 获取点赞数接口
GET /like/count?targetId=1&targetType=宠物

// 查询用户是否已点赞接口
GET /like/isLiked?targetId=1&targetType=宠物&userId=1
```

### 修改点赞图标
如果需要使用自定义图片图标，可以：
1. 在`components/IMAGES/`目录下添加`heart_filled.png`和`heart_empty.png`文件
2. 将wxml中的文字符号替换为image标签
3. 调整CSS样式以适配图片显示

### 修改API地址
在JS文件中修改`getApp().globalData.MyUrl`的值来配置正确的API地址。

### 样式设计特性
点赞按钮采用了简洁现代的设计风格，参考抖音等主流应用：

- **简洁设计**：清爽的浅色背景，简洁的边框设计
- **颜色搭配**：已点赞状态使用红色爱心，未点赞状态使用灰色爱心
- **格式对齐**：统一的间距和尺寸，确保视觉对齐
- **轻量动画**：简单的缩放效果，不干扰用户体验
- **响应式设计**：适配不同屏幕尺寸，移动端优化
- **触摸友好**：合适的点击区域和反馈效果

## 技术特点

- 使用`catchtap`正确阻止事件冒泡，避免点赞点击触发宠物卡片点击
- 实时更新点赞状态和点赞数
- 响应式设计，支持触摸反馈
- 错误处理和用户提示
- 兼容微信小程序的事件处理机制
- 简洁现代的UI设计，注重格式对齐和用户体验
- 轻量级的动画效果，不干扰用户操作
- 响应式设计，适配不同屏幕尺寸

## 常见问题解决

### TypeError: e.stopPropagation is not a function
**问题原因**：微信小程序的事件对象没有`stopPropagation`方法
**解决方案**：使用`catchtap`替代`bindtap`来自动阻止事件冒泡，或者使用`e.detail`来获取事件详情

### 点赞按钮点击后页面跳转
**问题原因**：事件冒泡到父级元素
**解决方案**：确保使用`catchtap`而不是`bindtap`来绑定点赞事件