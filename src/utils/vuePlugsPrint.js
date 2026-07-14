// 打印类属性、方法定义
/* eslint-disable */
const Print = function (dom, options, pageSize) {

  if (!(this instanceof Print)) return new Print(dom, options, pageSize);

  this.options = this.extend({
    'noPrint': '.no-print',
    /** 为 false 时不注入通用 @page size，便于业务用命名 @page（如三等分横/纵） */
    'injectPageSize': true,
    /** 可选：统一注入 @page margin，减少预览/实打偏差 */
    'pageMargin': '',
    /** 打印前等待资源渲染稳定（图片/字体） */
    'waitForAssets': true,
    /** 打印前额外等待时间，默认给驱动和浏览器排版缓冲 */
    'beforePrintDelay': 260,
    /** afterprint 兜底超时，避免 iframe 遗留 */
    'cleanupDelay': 15000,
    /** 追加到 iframe head 末尾的 CSS（后写入，可覆盖其它页 @media print） */
    'extraStyle': ''
  }, options);

  if ((typeof dom) === "string") {
    this.dom = document.querySelector(dom);
  } else {
    this.isDOM(dom)
    this.dom = this.isDOM(dom) ? dom : dom.$el;
  }

  this.init(pageSize);
};
Print.prototype = {
  init: function (pageSize) {
    var headHtml = this.getStyle(pageSize);
    var bodyHtml = this.getHtml();
    /* 完整文档结构：避免各浏览器对「仅 style+div」碎片 write 的解析差异；link 进 head 便于统一等样式加载 */
    var content = '<!DOCTYPE html><html><head><meta charset="utf-8">' + headHtml + '</head><body>' + bodyHtml + '</body></html>';
    this.writeIframe(content);
  },
  extend: function (obj, obj2) {
    for (var k in obj2) {
      obj[k] = obj2[k];
    }
    return obj;
  },

  getStyle: function (pageSize) {
    var str = "",
      styles = document.querySelectorAll('style,link');
    for (var i = 0; i < styles.length; i++) {
      str += styles[i].outerHTML;
    }
    str += "<style>" + (this.options.noPrint ? this.options.noPrint : '.no-print') + "{display:none;}</style>";
    str += "<style>html,body,div{height: auto!important;}</style>";
    /* 避免 body 默认 8px 边距、或布局里 min-height:100vh 等在打印 iframe 里撑出多一页空白 */
    str += "<style>html,body{margin:0!important;padding:0!important;min-height:0!important;}</style>";

    str = str.replace('size: A5', `size: ${pageSize}`);
    // 自定义纸张（如 210mm×140mm）：注入 @page，避免仅依赖页面内 style 的替换
    // 注意：浏览器预览≠打印机物理可打印区；仅设置 size 时，左右边框仍可能被硬件边距裁切。
    // 因此默认给左右各留一点安全边距（可用 options.pageMargin 覆盖）。
    if (this.options.injectPageSize !== false && pageSize && String(pageSize).indexOf('mm') !== -1) {
      var pageMargin = this.options.pageMargin && String(this.options.pageMargin).trim()
        ? String(this.options.pageMargin).trim()
        : (function () {
          // 小标签纸（如条码）通常需要尽量贴边；宽票据（>=120mm）更容易遇到左右物理不可打印区裁切
          var s = String(pageSize)
          var m = s.match(/(\d+(?:\.\d+)?)\s*mm/gi)
          var maxMm = 0
          if (m && m.length) {
            for (var i = 0; i < m.length; i++) {
              var v = parseFloat(String(m[i]).replace(/mm/gi, ''))
              if (!isNaN(v)) maxMm = Math.max(maxMm, v)
            }
          }
          return maxMm >= 120 ? '0 4mm' : '0'
        })()
      str += "<style>@page { size: " + pageSize + " !important; margin: " + pageMargin + " !important; }</style>";
    }
    // pageMargin 已在自定义 mm 纸张的 @page 中合并注入；这里仅处理非 mm 纸张或关闭 injectPageSize 的场景
    if (this.options.pageMargin && String(this.options.pageMargin).trim()) {
      var ps = pageSize && String(pageSize);
      var mergedMm = this.options.injectPageSize !== false && ps && ps.indexOf('mm') !== -1;
      if (!mergedMm) {
        str += "<style>@page { margin: " + this.options.pageMargin + " !important; }</style>";
      }
    }

    // 业务可注入覆盖样式（放在最后，优先于其它组件的 media=print）
    if (this.options.extraStyle && String(this.options.extraStyle).trim()) {
      str += "<style type=\"text/css\">" + this.options.extraStyle + "</style>";
    }

    return str;
  },

  getHtml: function () {
    /* 只处理打印区域内的表单节点：勿用 document 全页查询，否则会篡改整站 Element/Vue 管理的 input，
       首打后再次打印常见「预览空白」或组件异常。 */
    var root = this.dom;
    if (!root || typeof root.querySelectorAll !== 'function') {
      return root && root.outerHTML ? root.outerHTML : '';
    }
    var inputs = root.querySelectorAll('input');
    var textareas = root.querySelectorAll('textarea');
    var selects = root.querySelectorAll('select');

    for (var k = 0; k < inputs.length; k++) {
      if (inputs[k].type == "checkbox" || inputs[k].type == "radio") {
        if (inputs[k].checked == true) {
          inputs[k].setAttribute('checked', "checked")
        } else {
          inputs[k].removeAttribute('checked')
        }
      } else if (inputs[k].type == "text") {
        inputs[k].setAttribute('value', inputs[k].value)
      } else {
        inputs[k].setAttribute('value', inputs[k].value)
      }
    }

    for (var k2 = 0; k2 < textareas.length; k2++) {
      if (textareas[k2].type == 'textarea') {
        textareas[k2].innerHTML = textareas[k2].value
      }
    }

    for (var k3 = 0; k3 < selects.length; k3++) {
      if (selects[k3].type == 'select-one') {
        var child = selects[k3].children;
        for (var i in child) {
          if (child[i].tagName == 'OPTION') {
            if (child[i].selected == true) {
              child[i].setAttribute('selected', "selected")
            } else {
              child[i].removeAttribute('selected')
            }
          }
        }
      }
    }

    let content = this.dom.outerHTML;
    if (content.indexOf('hidden="hidden"') > -1) {
      content = content.replace(/hidden="hidden"/g, '');
    }
    // 布尔属性 hidden 或多余空格
    content = content.replace(/\s+hidden(?:="hidden")?(?=\s|>)/gi, '');
    return content;
  },

  writeIframe: function (content) {
    var _this = this;
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.id = 'print-iframe-' + String(Date.now()) + '-' + String(Math.random()).slice(2, 8);
    iframe.setAttribute('style', 'position:absolute;width:0;height:0;top:-10px;left:-10px;');
    var w = iframe.contentWindow || iframe.contentDocument;
    var doc = iframe.contentDocument || iframe.contentWindow.document;

    var printDone = false;
    var cleanupDone = false;
    function cleanup() {
      if (cleanupDone) return;
      cleanupDone = true;
      try {
        if (iframe && iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      } catch (e) {}
    }
    function finishAndPrint() {
      if (printDone) return;
      printDone = true;
      iframe.onload = null;
      _this.prepareAndPrint(w, _this.options).finally(function () {
        setTimeout(cleanup, _this.options.cleanupDelay || 15000);
      });
    }
    // 必须先绑定 onload 再 write/close；部分环境下 load 不触发，需定时兜底否则打印对话框永不出现
    iframe.onload = function () {
      finishAndPrint();
    };
    doc.open();
    doc.write(content);
    doc.close();
    setTimeout(finishAndPrint, 300);
  },

  /** 等待打印 iframe 内外链样式表就绪，避免偶发「预览全白」（样式未加载完就 print，清缓存后易复现） */
  waitStylesheetsInFrame: function (frameWindow) {
    return new Promise(function (resolve) {
      try {
        var doc = frameWindow && frameWindow.document;
        if (!doc) {
          resolve();
          return;
        }
        var links = doc.querySelectorAll('link[rel="stylesheet"]');
        if (!links || !links.length) {
          resolve();
          return;
        }
        var waits = [];
        for (var i = 0; i < links.length; i++) {
          (function (link) {
            if (!link || !link.href) return;
            try {
              if (link.sheet) return;
            } catch (e) {
              /* 跨域样式表访问 sheet 可能抛错，仍等待 load/error */
            }
            waits.push(new Promise(function (r) {
              var done = false;
              function fin() {
                if (done) return;
                done = true;
                r();
              }
              link.addEventListener('load', fin, { once: true });
              link.addEventListener('error', fin, { once: true });
              setTimeout(fin, 4000);
            }));
          })(links[i]);
        }
        if (!waits.length) {
          resolve();
          return;
        }
        Promise.all(waits).then(function () { resolve(); }).catch(function () { resolve(); });
      } catch (e) {
        resolve();
      }
    });
  },
  prepareAndPrint: function (frameWindow, options) {
    var _this = this;
    if (options.waitForAssets === false) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          _this.toPrint(frameWindow, options, resolve);
        }, options.beforePrintDelay || 260);
      });
    }
    /* 先等外链 CSS，再等字体/图，避免 fonts.ready 早于样式表导致排版仍空白 */
    return this.waitStylesheetsInFrame(frameWindow)
      .catch(function () {})
      .then(function () {
        return Promise.all([
          _this.waitFontsReady(frameWindow),
          _this.waitImagesReady(frameWindow)
        ]);
      })
      .catch(function () {})
      .then(function () {
        return new Promise(function (resolve) {
          setTimeout(function () {
            _this.toPrint(frameWindow, options, resolve);
          }, options.beforePrintDelay || 260);
        });
      });
  },
  waitFontsReady: function (frameWindow) {
    try {
      if (frameWindow.document && frameWindow.document.fonts && frameWindow.document.fonts.ready) {
        return Promise.race([
          frameWindow.document.fonts.ready,
          new Promise(function (resolve) { setTimeout(resolve, 1200); })
        ]);
      }
    } catch (e) {}
    return Promise.resolve();
  },
  waitImagesReady: function (frameWindow) {
    try {
      var imgs = frameWindow.document.querySelectorAll('img');
      if (!imgs || imgs.length === 0) return Promise.resolve();
      var waits = [];
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        if (img.complete) continue;
        waits.push(new Promise(function (resolve) {
          var done = false;
          function finish() {
            if (done) return;
            done = true;
            resolve();
          }
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
          setTimeout(finish, 1200);
        }));
      }
      return Promise.all(waits);
    } catch (e) {
      return Promise.resolve();
    }
  },
  toPrint: function (frameWindow, options, done) {
    try {
      setTimeout(function () {
        var finished = false;
        function finish() {
          if (finished) return;
          finished = true;
          if (typeof done === 'function') done();
        }
        try {
          frameWindow.onafterprint = finish;
        } catch (e) {}
        frameWindow.focus();
        try {
          if (!frameWindow.document.execCommand('print', false, null)) {
            frameWindow.print();
          }
          if (options.callback ) options.callback()
        } catch (e) {
          frameWindow.print();
        }
        // 部分浏览器 afterprint 不触发，兜底 2s
        setTimeout(finish, 2000);
      }, 10);
    } catch (err) {
      console.log('err', err);
      if (typeof done === 'function') done();
    }
  },
  isDOM: (typeof HTMLElement === 'object') ?
    function (obj) {
      return obj instanceof HTMLElement;
    } :
    function (obj) {
      return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
    },
};
const MyPlugin = {}
MyPlugin.install = function (Vue, options) {
  // 4. 添加实例方法
  Vue.prototype.$print = Print
}
export default MyPlugin
