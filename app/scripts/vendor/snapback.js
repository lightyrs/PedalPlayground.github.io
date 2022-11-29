!(function (t, e) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = e())
    : "function" == typeof define && define.amd
    ? define(e)
    : (t.snapback = e());
})(this, function () {
  "use strict";
  var t = function (t, e) {
    var i = this,
      n =
        "undefined" != typeof MutationObserver
          ? MutationObserver
          : "undefined" != typeof WebKitMutationObserver
          ? WebKitMutationObserver
          : void 0;
    n &&
      ((this.register = this.register.bind(this)),
      (this.addMutation = this.addMutation.bind(this)),
      Object.assign(
        this,
        {
          observe: {
            subtree: !0,
            attributes: !0,
            attributeOldValue: !0,
            childList: !0,
            characterData: !0,
            characterDataOldValue: !0,
          },
          element: t,
          timeout: 0,
          undos: [],
          mutations: [],
          undoIndex: -1,
        },
        e
      ),
      (this.observer = new n(function (t) {
        t.forEach(i.addMutation);
      })));
  };
  return (
    (t.prototype = {
      addMutation: function (t) {
        switch (
          (this.timeout &&
            (clearTimeout(this._timeout),
            (this._timeout = setTimeout(this.register, this.timeout))),
          t.type)
        ) {
          case "characterData":
            t.newValue = t.target.textContent;
            var e = this.mutations[this.mutations.length - 1];
            if (
              e &&
              "characterData" === e.type &&
              e.target === t.target &&
              e.newValue === t.oldValue
            )
              return void (e.newValue = t.newValue);
            break;
          case "attributes":
            t.newValue = t.target.getAttribute(t.attributeName);
        }
        this.mutations.push(t);
      },
      disable: function () {
        this.enabled && (this.observer.disconnect(), (this.enabled = !1));
      },
      enable: function () {
        this.enabled || (this.observer.observe(this.element, this.observe), (this.enabled = !0));
      },
      register: function () {
        0 < this.mutations.length &&
          (this.undoIndex < this.undos.length - 1 &&
            (this.undos = this.undos.slice(0, this.undoIndex + 1)),
          this.undos.push({
            data:
              this.store instanceof Function ? { before: this.data, after: this.store() } : void 0,
            mutations: this.mutations,
          }),
          (this.mutations = []),
          (this.undoIndex = this.undos.length - 1));
      },
      redo: function () {
        this.enabled &&
          this.undoIndex < this.undos.length - 1 &&
          this.undoRedo(this.undos[++this.undoIndex], !1);
      },
      undo: function () {
        this.register(),
          this.enabled && 0 <= this.undoIndex && this.undoRedo(this.undos[this.undoIndex--], !0);
      },
      undoRedo: function (t, s) {
        this.disable(),
          (s ? t.mutations.slice(0).reverse() : t.mutations).forEach(function (e) {
            switch (e.type) {
              case "characterData":
                e.target.textContent = s ? e.oldValue : e.newValue;
                break;
              case "attributes":
                var t = s ? e.oldValue : e.newValue;
                t || !1 === t || 0 === t
                  ? e.target.setAttribute(e.attributeName, t)
                  : e.target.removeAttribute(e.attributeName);
                break;
              case "childList":
                var i = s ? e.removedNodes : e.addedNodes,
                  n = s ? e.addedNodes : e.removedNodes;
                Array.from(i).forEach(
                  e.nextSibling
                    ? function (t) {
                        e.nextSibling.parentNode.insertBefore(t, e.nextSibling);
                      }
                    : function (t) {
                        e.target.appendChild(t);
                      }
                ),
                  Array.from(n).forEach(function (t) {
                    t.parentNode.removeChild(t);
                  });
            }
          }),
          this.restore instanceof Function && this.restore(s ? t.data.before : t.data.after),
          this.enable();
      },
    }),
    t
  );
});
