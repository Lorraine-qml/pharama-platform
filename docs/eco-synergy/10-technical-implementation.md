# 10 技术实现要点

## 10.1 前端

- 路由前缀：`/eco/*`，与 `docs/eco-synergy/02-menu-routes.md` 一致。  
- 按子模块拆分路由与懒加载（`React.lazy`）以降低首包。  
- 权限：`useAuth()` + `can(action, module)` 集中策略；与 `03-rbac-matrix.md` 对齐。  
- 表单：受控组件 + 统一 `zod`/`yup` 校验（与项目其余模块对齐选型）。

## 10.2 后端

- RESTful CRUD；列表统一 `page` `pageSize` `sort` `filters`。  
- 关联查询：详情接口 `include=linkedProject,stats` 可选展开。  
- 删除：软删除 + 审计日志（推荐）。

## 10.3 知识库与 OSS

- 上传直传 OSS（预签名 URL）或经后端中转（按安全策略选型）。  
- 预览：Office/PDF 用在线预览服务或前端 `pdf.js`；版本与大小限制在接口层校验。  
- **V1**：库级权限；不做文档级 ACL。

## 10.4 AI 中台（V2）

- 同步任务：定时 + 手动触发；失败重试与告警。  
- 调用测试：独立 API Key 与配额；与计费系统对账（非 V1）。

## 10.5 安全

- 所有写操作需登录态；敏感字段脱敏展示。  
- 导入接口防 CSV 注入、文件类型白名单。

## 10.6 与当前仓库（V1 壳层）

- 代码中已注册导航与路由占位；完整 CRUD 与 OSS 在后续迭代按本文档拆分任务实现。
