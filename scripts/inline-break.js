/* global hexo */
// The archer theme sets `word-break: break-all` on inline code and links, so
// narrow table columns split short identifiers such as `ctx_reduce` or link
// text such as README mid-word.
//
// - Inline code and links break at word boundaries; a token wider than its
//   container may still wrap anywhere.
// - Inside table cells, code keeps whole words. Long identifiers
//   (`human_message_token_limit_before_evict`) get <wbr> after `_`, `/`, `.`
//   so they wrap at natural joints instead of widening the table.
// - Link text in cells (README, 源码) and short cells (「1 落盘」) stay whole.
// - On narrow screens, wide tables scroll sideways.
const LONG = 20
const SHORT_CELL = 8

// Runs on every generated page (post render results are cached in db.json).
hexo.extend.filter.register('after_render:html', html =>
  html.replace(/<(td|th)([^>]*)>([\s\S]*?)<\/\1>/g, (cell, tag, attrs, body) => {
    // Short labels such as 「1 落盘」 or 「层次」 stay on one line.
    const text = body.replace(/<[^>]+>/g, '').trim()
    if (text.length > 0 && text.length <= SHORT_CELL && !/class=/.test(attrs)) {
      return `<${tag}${attrs} class="nowrap-cell">${body}</${tag}>`
    }
    return cell
      .replace(/<code>([^<\s]+)<\/code>/g, (m, code) =>
        code.length < LONG ? m : `<code>${code.replace(/([_/.])(?=[^_/.])/g, '$1<wbr>')}</code>`)
      // Short link labels (源码, 默认值, README) never split across lines.
      .replace(/<a ([^>]*)>([^<]{1,8})<\/a>/g, (m, a, label) =>
        /class=/.test(a) ? m : `<a ${a} class="nowrap-cell">${label}</a>`)
  }))

hexo.extend.injector.register(
  'head_end',
  `<style>
.article-entry code, .abstract-content code,
.article-entry a, .abstract-content a,
.license-wrapper a {
  word-break: normal;
  overflow-wrap: anywhere;
}
.article-entry td code, .article-entry th code,
.article-entry td a, .article-entry th a { overflow-wrap: break-word; }
.article-entry .nowrap-cell { white-space: nowrap; }
@media (max-width: 768px) {
  .article-entry table { display: block; overflow-x: auto; }
}
</style>`,
  'post'
)
