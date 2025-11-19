import paginationTemplate, { createPaginationButtons } from './templates';
import SelectorEngine from '../../../mdb/dom/selector-engine';
import EventHandler from '../../../mdb/dom/event-handler';
import Select from '../../select/index';

const SELECTOR_PAGINATION_RIGHT = '.datatable-pagination-right';
const SELECTOR_PAGINATION_LEFT = '.datatable-pagination-left';
const SELECTOR_PAGINATION_START = '.datatable-pagination-start';
const SELECTOR_PAGINATION_END = '.datatable-pagination-end';

const SELECTOR_PAGINATION_NAV = '.datatable-pagination-nav';
const SELECTOR_PAGINATION = '.datatable-pagination';
const SELECTOR_PAGINATION_BUTTONS = '.datatable-pagination-buttons';

const SELECTOR_SELECT = '.datatable-select';
const SELECTOR_SELECT_LABEL = '.datatable-select-text';

const EVENT_PAGINATION_CHANGE = 'paginationChange.mdb.datatable';

const EVENT_VALUE_CHANGED_SELECT = 'valueChanged.mdb.select';

export default class DatatablePagination {
  constructor(element, options) {
    this._element = element;

    this._options = options;

    this._left = null;
    this._right = null;
    this._start = null;
    this._end = null;

    this._select = null;
    this._selectInstance = null;

    this._pagination = null;

    this._activePage = null;
    this._total = null;
    this._entries = null;

    this._setPaginationValues();
  }

  // Getters

  get options() {
    return {
      entries: this._options.entries,
      entriesOptions: this._options.entriesOptions,
      fullPagination: this._options.fullPagination,
      rowsText: this._options.rowsText,
      ofText: this._options.ofText,
      allText: this._options.allText,
    };
  }

  get activePage() {
    return this._activePage;
  }

  get pages() {
    if (this._optionToLowerCase(this._entries) === 'all') {
      return 1;
    }

    return Math.ceil(this._total / this._entries);
  }

  get pagination() {
    return {
      page: this._activePage,
      entries: this._entries,
      total: this._total,
    };
  }

  get navigationText() {
    const entries =
      this._optionToLowerCase(this._options.entries) === 'all' ? this._total : this._entries;
    const { ofText } = this._options;
    const firstVisibleEntry = this._activePage * Number(entries);
    const lastVisibleEntry = Math.min(firstVisibleEntry + Number(entries), this._total);

    if (this._total === 0) {
      return `0 ${ofText} 0`;
    }

    if (this._optionToLowerCase(this._entries) === 'all') {
      return `1 - ${this._total} ${ofText} ${this._total}`;
    }

    return `${firstVisibleEntry + 1} - ${lastVisibleEntry} ${ofText} ${this._total}`;
  }

  // Public
  appendPagination() {
    this._appendPagination();
    this._setupPagination();
    this._setupPaginationSelect();
    this._selectInstance.setValue(String(this._entries));
    this._toggleDisableState();
  }

  updatePagination() {
    this._setPaginationValues();

    this._removeEventListeners();
    this._updatePaginationButtonsTemplate();
    this._setupPagination();
    this._setNavigationText();
    this._setSelectLabel();
    this._selectInstance.setValue(String(this._entries));
  }

  removePagination() {
    this._disposePaginationSelect();
    this._removeEventListeners();

    const paginationEl = SelectorEngine.findOne(SELECTOR_PAGINATION, this._element);
    if (paginationEl) {
      paginationEl.remove();
    }
    this._pagination = null;
  }

  // Private
  _setNavigationText() {
    const nav = SelectorEngine.findOne(SELECTOR_PAGINATION_NAV, this._pagination);
    nav.innerHTML = this.navigationText;
  }

  _setSelectLabel() {
    const selectLabel = SelectorEngine.findOne(SELECTOR_SELECT_LABEL, this._pagination);
    selectLabel.innerHTML = this._options.rowsText;
  }

  _updatePaginationButtonsTemplate() {
    const buttonsHTML = createPaginationButtons(this._options.fullPagination);
    const paginationButtons = SelectorEngine.findOne(SELECTOR_PAGINATION_BUTTONS, this._pagination);
    paginationButtons.outerHTML = buttonsHTML;
  }

  _setPaginationValues() {
    const { pagination } = this._options;
    this._activePage = pagination.page || 0;
    this._total = pagination.total || 0;
    this._entries = pagination.entries || this._options.entries;
  }

  _appendPagination() {
    const paginationEl = paginationTemplate(
      this.options,
      this._options.loading,
      this.navigationText
    );

    this._element.insertAdjacentHTML('beforeend', paginationEl);
    this._pagination = SelectorEngine.findOne(SELECTOR_PAGINATION, this._element);
  }

  _optionToLowerCase(option) {
    return typeof option === 'string' ? option.toLowerCase() : option;
  }

  _toggleDisableState() {
    if (this._options.pagination === false) {
      return;
    }

    if (this._activePage === 0 || this._options.loading) {
      this._left.setAttribute('disabled', true);

      if (this._options.fullPagination) {
        this._start.setAttribute('disabled', true);
      }
    } else {
      this._left.removeAttribute('disabled');

      if (this._options.fullPagination) {
        this._start.removeAttribute('disabled');
      }
    }

    if (this._activePage === this.pages - 1 || this._options.loading || this.pages === 0) {
      this._right.setAttribute('disabled', true);

      if (this._options.fullPagination) {
        this._end.setAttribute('disabled', true);
      }
    } else {
      this._right.removeAttribute('disabled');

      if (this._options.fullPagination) {
        this._end.removeAttribute('disabled');
      }
    }
  }

  _removeEventListeners() {
    EventHandler.off(this._right, 'click');

    EventHandler.off(this._left, 'click');

    if (this._options.fullPagination) {
      EventHandler.off(this._start, 'click');

      EventHandler.off(this._end, 'click');
    }
  }

  _setupPagination() {
    this._right = SelectorEngine.findOne(SELECTOR_PAGINATION_RIGHT, this._element);
    this._left = SelectorEngine.findOne(SELECTOR_PAGINATION_LEFT, this._element);

    const paginationButtons = [
      { button: this._right, action: () => (this._activePage += 1) },
      { button: this._left, action: () => (this._activePage -= 1) },
    ];

    if (this._options.fullPagination) {
      this._start = SelectorEngine.findOne(SELECTOR_PAGINATION_START, this._element);
      this._end = SelectorEngine.findOne(SELECTOR_PAGINATION_END, this._element);

      paginationButtons.push(
        { button: this._start, action: () => (this._activePage = 0) },
        { button: this._end, action: () => (this._activePage = this.pages - 1) }
      );
    }

    paginationButtons.forEach(({ button, action }) => {
      if (button) {
        EventHandler.on(button, 'click', () => {
          action();
          EventHandler.trigger(this._element, EVENT_PAGINATION_CHANGE, {
            pagination: this.pagination,
          });
        });
      }
    });
  }

  _setupPaginationSelect() {
    if (this._selectInstance) {
      this._selectInstance.dispose();
    }

    this._select = SelectorEngine.findOne(SELECTOR_SELECT, this._element);

    this._selectInstance = new Select(this._select);

    EventHandler.on(this._select, EVENT_VALUE_CHANGED_SELECT, (e) => {
      if (this._entries !== e.value) {
        this._entries = e.value;

        EventHandler.trigger(this._element, EVENT_PAGINATION_CHANGE, {
          pagination: this.pagination,
        });
      }
    });
  }

  _disposePaginationSelect() {
    EventHandler.off(this._select, EVENT_VALUE_CHANGED_SELECT);

    if (this._selectInstance) {
      this._selectInstance.dispose();
    }
  }
}
