# 生态协同模块 — 需求说明书（拆分版）索引

本目录为**数字孪生空间 · 生态协同**子模块的完整需求说明，按主题拆分为多份文档，便于评审、排期与分工。

| 序号 | 文档 | 说明 |
|------|------|------|
| 01 | [01-positioning-principles.md](./01-positioning-principles.md) | 模块定位、设计原则、V1/V2 边界 |
| 02 | [02-menu-routes.md](./02-menu-routes.md) | 菜单结构、前端路由、与孪生底座关系 |
| 03 | [03-rbac-matrix.md](./03-rbac-matrix.md) | 角色权限矩阵与前端表现规则 |
| 04 | [04-virtual-projects-spec.md](./04-virtual-projects-spec.md) | **虚拟项目**：功能点、列表、表单、校验 |
| 05 | [05-external-partners-spec.md](./05-external-partners-spec.md) | **外部合作**：功能点、列表、表单、与基础数据同步 |
| 06 | [06-ai-abilities-spec.md](./06-ai-abilities-spec.md) | **AI 能力**：V1 静态展示、详情、V2 对接 |
| 07 | [07-knowledge-base-spec.md](./07-knowledge-base-spec.md) | **知识库**：库管理、文档管理子页、上传与权限 |
| 08 | [08-data-and-integration.md](./08-data-and-integration.md) | 数据来源、与入孵/基础数据/AI 中台联动 |
| 09 | [09-interaction-pagination-export.md](./09-interaction-pagination-export.md) | 筛选、分页、删除确认、导出、状态标签 |
| 10 | [10-technical-implementation.md](./10-technical-implementation.md) | 接口、OSS、库级权限、非目标（V1） |

**前端演示入口（V1 壳层）**

- `/eco/virtual-project` — 虚拟项目  
- `/eco/external-partner` — 外部合作  
- `/eco/ai-ability` — AI 能力  
- `/eco/knowledge-base` — 知识库  
- `/eco/knowledge-base/:libraryId/manage` — 知识库文档管理（子页）

实现状态以代码为准；需求以本目录为权威说明，冲突时以本目录更新为准。
