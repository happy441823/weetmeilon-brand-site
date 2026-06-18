# SWEETMEILON AI 文章生成说明

## 当前默认

```text
CMS_AI_GENERATION_ENABLE=false
```

第一阶段不调用外部 AI，不自动生成正式文章。

## 当前能力

后台 `/admin/seo/articles/generate` 可以创建 `seo_generation_jobs` 草稿任务，保存：

- 目标关键词
- 关联商品
- 文章类型
- 是否生成 FAQ
- 是否加入商品卡片
- 是否加入购买 CTA

任务状态默认为 `draft`。

## 后续开启要求

AI 生成内容必须经过：

```text
AI 生成 → 草稿 → 人工审核 → 提交审核 → 发布
```

不得生成后直接发布到正式站。

## 内容红线

- 不夸大功效
- 不写医疗治疗或治愈表达
- 不写绝对化用语
- 不虚构销量、评价、价格、库存
- 成人类目表达保持专业克制
