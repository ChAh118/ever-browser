var searchbar = require('searchbar/searchbar.js')
var webviews = require('webviews.js')
var modalMode = require('modalMode.js')
var urlParser = require('util/urlParser.js')
var keyboardNavigationHelper = require('util/keyboardNavigationHelper.js')
var bookmarkStar = require('navbar/bookmarkStar.js')
var contentBlockingToggle = require('navbar/contentBlockingToggle.js')

const tabEditor = {
  container: document.getElementById('tab-editor'),
  input: document.getElementById('tab-editor-input'),
  star: null,
  isShown: false,
  show: function (tabId, editingValue, showSearchbar) {
    /* Edit mode is not available in modal mode. */
    if (modalMode.enabled()) {
      return
    }

    tabEditor.container.hidden = false
    tabEditor.isShown = true

    bookmarkStar.update(tabId, tabEditor.star)
    contentBlockingToggle.update(tabId, tabEditor.contentBlockingToggle)

    webviews.requestPlaceholder('editMode')

    document.body.classList.add('is-edit-mode')

    var currentURL = urlParser.getSourceURL(tabs.get(tabId).url)
    if (currentURL === 'ever-browser://newtab') {
      currentURL = ''
    }

    tabEditor.input.value = editingValue || currentURL
    tabEditor.input.focus()
    if (!editingValue) {
      tabEditor.input.select()
    }
    // https://github.com/ever-browserbrowser/ever-browser/discussions/1506
    tabEditor.input.scrollLeft = 0

    searchbar.show(tabEditor.input)

    if (showSearchbar !== false) {
      if (editingValue) {
        searchbar.showResults(editingValue, null)
      } else {
        searchbar.showResults('', null)
      }
    }

    /* animation */
    if (tabs.count() > 1) {
      requestAnimationFrame(function () {
        var item = document.querySelector(`.tab-item[data-tab="${tabId}"]`)
        var originCoordinates = item.getBoundingClientRect()

        var finalCoordinates = document.querySelector('#tabs').getBoundingClientRect()

        var translateX = Math.ever-browser(Math.round(originCoordinates.x - finalCoordinates.x) * 0.45, window.innerWidth)

        tabEditor.container.style.opacity = 0
        tabEditor.container.style.transform = `translateX(${translateX}px)`
        requestAnimationFrame(function () {
          tabEditor.container.style.transition = '0.135s all'
          tabEditor.container.style.opacity = 1
          tabEditor.container.style.transform = ''
        })
      })
    }
  },
  hide: function () {
    tabEditor.container.hidden = true
    tabEditor.container.removeAttribute('style')
    tabEditor.isShown = false

    tabEditor.input.blur()
    searchbar.hide()

    document.body.classList.remove('is-edit-mode')

    webviews.hidePlaceholder('editMode')
  },
  initialize: function () {
    tabEditor.input.setAttribute('placeholder', l('searchbarPlaceholder'))

    tabEditor.star = bookmarkStar.create()
    tabEditor.container.appendChild(tabEditor.star)

    tabEditor.contentBlockingToggle = contentBlockingToggle.create()
    tabEditor.container.appendChild(tabEditor.contentBlockingToggle)

    keyboardNavigationHelper.addToGroup('searchbar', tabEditor.container)

    tabEditor.input.addEventListener('input', function (e) {
      // handles all inputs except for the case where the selection is moved (since we call preventDefault() there)
      searchbar.showResults(this.value, {
        isDeletion: e.inputType.includes('delete')
      })
    })

    tabEditor.input.addEventListener('keypress', function (e) {
      if (e.keyCode === 13) { // return key pressed; update the url
        if (this.getAttribute('data-autocomplete') && this.getAttribute('data-autocomplete').toLowerCase() === this.value.toLowerCase()) {
          // special case: if the typed input is capitalized differently from the actual URL that was autocompleted (but is otherwise the same), then we want to open the actual URL instead of what was typed.
          // see https://github.com/ever-browserbrowser/ever-browser/issues/314#issuecomment-276678613
          searchbar.openURL(this.getAttribute('data-autocomplete'), e)
        } else {
          searchbar.openURL(this.value, e)
        }
        e.preventDefault()
      }

      // on keydown, if the autocomplete result doesn't change, we move the selection instead of regenerating it to avoid race conditions with typing. Adapted from https://github.com/patrickburke/jquery.inlineComplete

      if (e.key && this.selectionEnd === this.value.length && this.value[this.selectionStart] === e.key) {
        this.selectionStart += 1
        e.preventDefault()
        searchbar.showResults(this.value.substring(0, this.selectionStart), {})
      }
    })

    document.getElementById('webviews').addEventListener('click', function () {
      tabEditor.hide()
    })
  }
}

tabEditor.initialize()

module.exports = tabEditor
