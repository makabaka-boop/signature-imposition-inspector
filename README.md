# 骑马订拼版检查台

离线、纯前端的小批量骑马订拼版核对工具。装订员在印刷前可逐页确认每一页的实体位置（签帖 / 纸张 / 面 / 槽位），避免补空白页或切换翻纸方式后出现页码倒置、签帖串页。

## 功能

- 正文页数 1–512；签帖大小 4–32 且为 4 的倍数；左订 / 右订；长边 / 短边翻转
- 非法参数组合不会覆盖上一次合法拼版，界面提示错误原因
- 每个签帖独立补 BLANK 到满帖
- 生成顺序：先排左订长边基准 → 右订交换每面左右槽位 → 短边翻转再交换背面左右槽位
- 按实体纸张顺序输出 `frontLeft / frontRight / backLeft / backRight`，表格、卡片、反查、JSON 导出共用同一份映射（`src/imposition.ts`），导出不再另算
- 页码反查：输入页码即得所在签帖、纸张、面、槽位
- 每张纸一张可翻面卡片，正背两面直观核对
- 一键下载 JSON（含设置、纸张序列与页码索引）

## 运行

### Docker Compose（推荐）

```bash
docker compose up --build web
# 打开 http://localhost:8080
```

### 本地开发

```bash
npm install
npm run dev
```

## 测试

Vitest 覆盖 4 / 8 / 12 页金样、BLANK 补白、变换语义，以及全部模式（装订 × 翻纸）下多种页数/签帖组合的正反向互查性质：

```bash
npm test
# 或在容器中：
docker compose --profile test run --rm test
```

## 结构

```
src/imposition.ts        唯一映射来源：校验、生成、反查索引、统计
src/imposition.test.ts   金样 + 性质测试
src/App.tsx              参数状态与「非法不覆盖」逻辑
src/components/          控制面板 / 拼版表 / 页码反查 / 翻面卡片
```
