# CLAUDE.md — 拟态（nitai）AI 助手指南

> 本文档为 Claude Code 提供项目上下文。详细文档在 `docs/` 目录（S6 结构），优先阅读 `docs/README.md`。

## 项目概述

拟态是晓风智能体的 Electron 桌面像素桌宠，独立 Git 仓库。项目代码在 `拟态开发版/`，运行在 Windows 平台。

- **当前版本**: v3.7.1（晓风期内最后版本，独立后计划重置为 v1.0.0）
- **渲染**: Canvas 2D，像素无抗锯齿（`image-rendering: pixelated`）
- **窗口**: 透明、无边框、始终置顶
- **运行**: Windows 原生 Electron；WSL2 仅用于代码编辑和 Git

## 项目结构

```
拟态开发版/
├── main.js                    # 主进程入口
├── main/                      # 主进程模块（config/window/tray/ipc/music-detector/position）
├── renderer/
│   ├── index.html             # HTML + CSS + 脚本加载链（顺序敏感）
│   ├── app.js                 # 引导入口 + rAF 动画循环 + 低功耗帧率控制
│   ├── mimic.js               # 全局命名空间 window.Mimic
│   ├── layout.js              # 动态窗口布局引擎
│   ├── audio.js               # Web Audio 音效合成
│   ├── fsm/                   # FSM 状态机（core + expressions + states/）
│   ├── rendering/             # pixel-character.js + particles.js
│   ├── bubble/                # 气泡消息队列 + 嘴边定位
│   └── interaction/           # drag/contextmenu/drop/eye-tracking/click/chat/music-detect
└── config.json                # 运行配置
```

> 详细职责说明 → `docs/00_核心概念/架构设计.md`

## 代码规范

### Canvas 绘制

- 角色在 16×20 逻辑网格上绘制，像素块尺寸 = `petSize / 16`
- **所有坐标必须以 `M.petCX` / `M.petCY`（窗口中心）为原点动态计算**
- 禁止硬编码像素偏移 — 这是已知 bug 的根因
- 图像平滑必须禁用：`ctx.imageSmoothingEnabled = false`
- 眼型 7 种、嘴型 4 种，定义见 `fsm/expressions.js`

### FSM 状态管理

- 状态通过 `M.FSM.transitionTo('stateName', context)` 切换
- 每个状态在 `fsm/states/<name>.js` 定义 `{ expression, enter, update, exit }`
- 新状态三步注册：创建 states/xxx.js → 添加表情到 expressions.js → index.html 加载脚本
- 状态生命周期：`_exit(old)` → `_enter(new)` → `_update(current)` [每帧]

### 窗口布局

- 公式：`winH = petSize + 2 × max(overhead, BOTTOM_MARGIN)`，`overhead = bubbleH + ARROW_H + GAP`
- 角色绝对居中：`petCX = winW/2`，`petCY = winH/2`
- 布局常量：`SIDE_PAD=20`, `GAP=5`, `BOTTOM_MARGIN=10`, `ARROW_H=6`

### 版本号

- 每次修改必须递增版本号（`主.次.补丁`）
- 同步更新两处：`app.js` 的 `APP_VERSION` + `mimic.js` 的 `VERSION`
- 同步更新 `PROJECT_STATUS.md`

## 核心约束

1. **禁止在旧代码上叠加新功能** — 先重构为可扩展结构，再添加功能
2. **坐标系统必须基于窗口中心动态计算** — 严禁硬编码绝对像素值（窗口随气泡/体型动态变化）
3. **IPC 使用扁平参数** — `send('channel', arg1, arg2)` 而非 `send('channel', {arg1, arg2})`，主进程 `Number()` + `isNaN` 守卫
4. **WSL2 仅用于编辑** — 桌宠在 Windows 原生运行，`npm run start:wsl` 仅紧急调试
5. **脚本加载顺序不可变** — `mimic → fsm → rendering → audio → layout → bubble → interaction → app`

## 已知问题

> 详细说明 → `docs/02_开发手册/常见问题.md`

| 问题 | 严重程度 | 计划修复 |
|------|----------|----------|
| 坐标硬编码 → 角色偏上 + 气泡遮挡 | 🟡 中 | v3.8.0 / 独立后 v1.0.0 |
| 眼球追踪一阶 lerp 抖动 | 🟢 低 | 后续版本 |

## 与晓风主项目的关系

- **独立仓库**：从晓风主项目分离，位于 `D:\nitai\`，独立 Git 版本控制
- **仅通过 HTTP API 通信**：`POST /api/file/process`（文件通知）+ `POST /api/chat`（对话）
- **无代码共享**：不依赖晓风任何代码模块，完全独立的 Electron 应用
- **配置耦合点**：`config.json` 中 `targetDir` 默认指向 `D:\xiaofeng_agent\02_数据输入`
- **启动顺序**：先启动晓风后端（端口 5001），再启动桌宠

## 文档体系

完整文档见 `docs/`（S6 结构）：

| 目录 | 内容 |
|------|------|
| `docs/00_核心概念/` | 架构设计、技术栈、术语表 |
| `docs/01_功能手册/` | 桌面交互、文件拖放、状态表情、听歌、眼球追踪、低功耗 |
| `docs/02_开发手册/` | 如何运行、调试、添加表情、常见问题 |
| `docs/03_版本历史/` | 变更日志总览 + 各版本详情 |
| `docs/04_记忆库/` | 用户偏好（预留） |
| `docs/99_归档/` | 历史文档 |

> 入口：`docs/README.md`
