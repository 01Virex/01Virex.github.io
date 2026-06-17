# 动态配图目录

把动态要用的图片放进这个文件夹(`static/img/moments/`)。

在 `content/moments/_index.md` 的某条动态里这样引用:

```yaml
images:
  - /img/moments/你的图片.jpg
  - /img/moments/另一张.png
```

- 路径以 `/img/moments/` 开头,后面接文件名。
- 一条动态可以放多张图(自动排成九宫格)。
- 不配图就不写 `images` 那几行,纯文字动态完全没问题。
