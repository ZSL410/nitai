# PROJECT_STATUS.md — 拟态 (Nitai) Desktop Pet v2.0.0

> 最后更新：2026-06-30 | 版本：**v2.0.0** — 架构重构：桌面即领地
>
> v1.0.0 是独立仓库首发 + 坐标系统重构。v2.0.0 是范式转换：从静态窗口到移动角色。

## 核心范式转换

**v1.0**: 角色禁锢在一个静态窗口里，窗口位置固定。
**v2.0**: 角色拥有**世界坐标**（屏幕坐标），在整个桌面上自由移动。窗口跟随角色。

```
v1.0:  Window → Character inside (static)
v2.0:  Character has world position → Window follows (dynamic)
```

## 当前功能

### 桌面漫游 🆕
- **自主闲逛**：角色随机走到屏幕上的不同位置
- **召唤模式**：右键菜单 → "召唤到这里" → 点击桌面任意位置 → 角色跑过去
- **三步点击召唤**：连击角色三次 → 自动进入召唤模式
- **一步一点**：不是瞬移，而是一步一步走过去的像素移动
- **Ctrl+W**：切换自主闲逛开关

### 角色视觉
- 16×20 网格像素小人，完整肢体动画
- **生命感系统**：呼吸起伏 + 眨眼（2-6秒随机） + 微晃动
- 7种眼型 + 5种嘴型 + 腮红 + 耳机配件
- 三种体型（小50/中80/大110），缩放过渡动画
- 透明无边框窗口，always-on-top，像素无抗锯齿

### 行为系统（FSM 6 状态）
| 状态 | 行为 |
|------|------|
| idle | 呼吸 + 眨眼 + 眼球追踪 + 微动作（伸懒腰/歪头/小跳） |
| walking | 行走动画 + 窗口跟随移动 |
| curious | 歪头 + 微张嘴 + 好奇表情 |
| happy | 弹跳 + 举手 + 心形粒子 + chirp音效 |
| surprised | 跳起 + 张大嘴 + 火花粒子 + boing音效 |
| sleepy | 半闭眼 + 缩小 + 打哈欠（60s不活动触发） |

### 自主AI 🆕
- 每3秒决策一次（仅在idle状态）
- 35%概率：随机闲逛到屏幕某处
- 15%概率：微动作（伸懒腰/歪头/小跳）
- **好奇心**：鼠标靠近时偶尔走过去看看
- **睡眠**：60秒不活动自动进入sleepy状态
- 点击/拖拽/聊天等交互会重置活动计时器

### 移动系统 🆕
- **帧率无关的阻尼移动**（damp函数）
- **行走速度**: 80px/s（慢走）/ 160px/s（跑步）
- **屏幕边界检测**：自动限制在可见区域内
- 窗口实时跟随角色位置（`win.setPosition()` 每帧同步）

### 交互
- **眼球追踪**：瞳孔跟随鼠标位置
- **点击反应**：摸头→happy / 拍身体→surprised / 双击→大弹跳
- **三步点击**：召唤模式（点击屏幕任意位置→角色跑过去）
- **拖拽移动**：拖拽窗口到新位置（停止自主行走）
- **右键菜单**：体型切换 + 召唤 + 闲逛开关 + 穿透模式
- **打字对话**：按Enter → 输入框 → Mock回复 + 后端API（可选）
- **文件拖放**：拖放文件到角色 → 复制到目标目录

### 气泡系统
- 消息队列 + 嘴边定位
- 进度条（文件复制时）

### 音效
- Web Audio API 合成：chirp / boing / nom / footstep

### 粒子特效
- heart / star / spark / note

## 代码结构（v2.0）

```
拟态开发版/
├── main.js                         # 主进程入口（v2.0 简化）
├── main/
│   ├── config.js                   # 配置加载
│   ├── window.js                   # 🆕 窗口管理器（宠物窗口 + 召唤覆盖层）
│   ├── tray.js                     # 系统托盘
│   ├── ipc-handlers.js             # 🆕 IPC（walk/summon/wander）
│   ├── position-store.js           # 位置持久化
│   └── music-detector.js           # 音乐检测
├── renderer/
│   ├── index.html                  # HTML + 脚本加载链
│   ├── mimic.js                    # 🆕 世界坐标命名空间
│   ├── app.js                      # 🆕 游戏循环 + 启动
│   ├── character/
│   │   ├── pixel-renderer.js       # 🆕 像素角色渲染（始终居中）
│   │   ├── animations.js           # 🆕 动画状态管理 + 生命感系统
│   │   └── expressions.js          # 表情定义表
│   ├── behavior/
│   │   ├── state-machine.js        # 🆕 FSM 6状态
│   │   └── ai-controller.js        # 🆕 自主AI（闲逛/好奇/睡眠）
│   ├── movement/
│   │   ├── easing.js               # 🆕 缓动函数库（damp/lerp/ease）
│   │   └── walk-controller.js      # 🆕 行走控制器（世界坐标→窗口同步）
│   ├── interaction/
│   │   ├── drag.js                 # 窗口拖拽
│   │   ├── click.js                # 点击反应（三步召唤）
│   │   ├── contextmenu.js          # 右键菜单（召唤+闲逛）
│   │   ├── drop.js                 # 文件拖放
│   │   ├── eye-tracking.js         # 眼球追踪
│   │   ├── chat.js                 # 打字对话
│   │   └── music-detect.js         # 音乐检测
│   ├── bubble/
│   │   └── bubble.js               # 气泡消息队列
│   ├── audio.js                    # 🆕 Web Audio 合成
│   └── particles.js                # 🆕 粒子特效
└── config.json
```

## 扩展接口

### 更换角色形象
- 修改 `character/pixel-renderer.js` 中的 `PARTS`（身体部位网格定义）和 `C`（调色板）
- 可添加多个皮肤定义，通过 `M.Rendering.PARTS` 和 `M.Rendering.C` 切换

### 添加新行为
- 在 `behavior/state-machine.js` 中注册新状态到 `FSM._handlers`
- 在 `behavior/ai-controller.js` 中添加决策逻辑

### 添加新动画
- 在 `character/animations.js` 中扩展 `Anim` 对象
- 在 `character/pixel-renderer.js` 中添加绘制函数

### 添加新交互
- 在 `interaction/` 目录创建新文件
- 在 `index.html` 中加载脚本

## 运行

```bash
cd 拟态开发版 && npm start          # Windows 原生
cd /mnt/d/nitai/拟态开发版 && npm run start:wsl  # WSL2
```

## 变更日志

### v2.0.0 (2026-06-30) — 架构重构：桌面即领地 🔥
- 🏗️ **范式转换**：角色拥有世界坐标，窗口跟随角色移动
- 🚶 **桌面漫游**：角色可以在整个桌面范围内自主移动
- 🔮 **召唤系统**：右键 → "召唤到这里" → 点击桌面 → 角色跑过去
- 🧠 **自主AI**：闲逛 + 好奇心（靠近鼠标）+ 睡眠模式
- 💓 **生命感系统**：呼吸起伏 + 随机眨眼 + 微晃动 + 伸懒腰/歪头
- 📐 **世界坐标系统**：所有位置计算基于屏幕坐标，帧率无关阻尼移动
- 🎯 **三步点击召唤**：三击角色 → 自动进入召唤模式
- 🗂️ **模块化架构**：`character/` `behavior/` `movement/` 清晰分离
- 🔌 **扩展接口**：皮肤切换、行为扩展、动画扩展预留接口
- 📝 同步更新所有交互模块到新API

### v1.0.0 (2026-06-30) — 独立仓库首发 + 坐标系统重构
- 从晓风主项目分离为独立 Git 仓库
- 坐标系统重构：`getPetBounds()` 单一真相来源
- S6 文档体系
