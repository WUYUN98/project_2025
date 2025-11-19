import PerfectScrollbar from '../../mdb/perfect-scrollbar';
import { typeCheckConfig } from '../../mdb/util/index';
import Data from '../../mdb/dom/data';
import EventHandler, { EventHandlerMulti } from '../../mdb/dom/event-handler';
import Manipulator from '../../mdb/dom/manipulator';
import SelectorEngine from '../../mdb/dom/selector-engine';
import tableTemplate from './html/table'; //eslint-disable-line
import { search, sort, paginate } from './util';
import DatatablePagination from './pagination/index';
import BaseComponent from '../../free/base-component';
import { bindCallbackEventsIfNeeded } from '../../autoinit/init';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'datatable';
const DATA_KEY = `mdb.${NAME}`;

const CLASS_DATATABLE = 'datatable';
const CLASS_FIXED_CELL = 'fixed-cell';

const SELECTOR_BODY = '.datatable-inner';
const SELECTOR_CELL = 'td';
const SELECTOR_HEADER = '.datatable-header th';
const SELECTOR_HEADER_CHECKBOX = '.datatable-header-checkbox';
const SELECTOR_HEADER_FILTER_INPUT = '.datatable-header-filter-input';

const SELECTOR_SORT_ICON = '.datatable-sort-icon';
const SELECTOR_ROW = '.datatable-body tr';
const SELECTOR_ROW_CHECKBOX = '.datatable-row-checkbox';

const SELECTOR_PAGINATION = '.datatable-pagination';

const EVENT_KEY = `.${DATA_KEY}`;
const EVENT_SELECTED = `rowSelected${EVENT_KEY}`;
const EVENT_RENDER = `render${EVENT_KEY}`;
const EVENT_ROW_CLICKED = `rowClicked${EVENT_KEY}`;
const EVENT_UPDATE = `update${EVENT_KEY}`;

const EVENT_VALUE_CHANGED_SELECT = 'valueChanged.mdb.select';
const EVENT_PAGINATION_CHANGE = 'paginationChange.mdb.datatable';
const EVENT_SORT_CHANGE = 'sortChange.mdb.datatable';
const EVENT_COLUMN_SEARCH = 'columnSearch.mdb.datatable';

const TYPE_OPTIONS = {
  bordered: 'boolean',
  borderless: 'boolean',
  borderColor: '(string|null)',
  clickableRows: 'boolean',
  color: '(string|null)',
  defaultValue: 'string',
  edit: 'boolean',
  entries: '(number|string)',
  entriesOptions: 'array',
  fullPagination: 'boolean',
  hover: 'boolean',
  loading: 'boolean',
  loadingMessage: 'string',
  maxWidth: '(null|number|string)',
  maxHeight: '(null|number|string)',
  multi: 'boolean',
  noFoundMessage: 'string',
  pagination: 'boolean|object',
  selectable: 'boolean',
  serverSide: 'boolean',
  sm: 'boolean',
  sortField: '(null|string)',
  sortOrder: '(null|string)',
  loaderClass: 'string',
  fixedHeader: 'boolean',
  striped: 'boolean',
  rowsText: 'string',
  ofText: 'string',
  allText: 'string',
  forceSort: 'boolean',
  columnSearch: 'boolean',
};

const TYPE_COLUMN_FIELDS = {
  label: 'string',
  field: 'string',
  fixed: '(boolean|string)',
  format: '(function|null)',
  width: '(number|null)',
  sort: 'boolean',
};

const DEFAULT_OPTIONS = {
  bordered: false,
  borderless: false,
  borderColor: null,
  clickableRows: false,
  color: null,
  defaultValue: '-',
  edit: false,
  entries: 10,
  entriesOptions: [10, 25, 50, 200],
  fixedHeader: false,
  fullPagination: false,
  hover: false,
  loaderClass: 'bg-primary',
  loading: false,
  loadingMessage: 'Loading results...',
  maxWidth: null,
  maxHeight: null,
  multi: false,
  noFoundMessage: 'No matching results found',
  pagination: true,
  selectable: false,
  serverSide: false,
  sm: false,
  sortField: null,
  sortOrder: 'asc',
  striped: false,
  rowsText: 'Rows per page:',
  ofText: 'of',
  allText: 'All',
  forceSort: false,
  columnSearch: false,
};

const DEFAULT_COLUMN = {
  label: '',
  field: '',
  fixed: false,
  format: null,
  width: null,
  sort: true,
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Datatable extends BaseComponent {
  constructor(element, data = {}, options = {}) {
    super(element);

    this._options = this._getOptions(options);

    this._sortReverse = false;

    this._activePage = 0;

    this._search = '';
    this._searchColumn = null;

    this._pagination = new DatatablePagination(element, this._options);

    this._selected = [];
    this._checkboxes = null;
    this._headerCheckbox = null;
    this._columnSearchInputs = null;
    this._rows = this._getRows(data.rows);
    this._columns = this._getColumns(data.columns);
    this._tableId = null;
    this._hasFixedColumns = null;

    if (this._element) {
      this._perfectScrollbar = null;
      this._setup();

      this._enforceOptionDependency();

      // Preventing from disappearing borders in datatables with fixed columns
      this._hasFixedColumns = this._columns.some((column) => column.hasOwnProperty('fixed'));
      if (this._hasFixedColumns) {
        this._listenToWindowResize();
      }

      Manipulator.setDataAttribute(this._element, `${this.constructor.NAME}-initialized`, true);
      bindCallbackEventsIfNeeded(this.constructor);
    }
  }

  // Getters

  static get NAME() {
    return NAME;
  }

  get columns() {
    return this._columns.map((column, index) => {
      let template = {
        ...DEFAULT_COLUMN,
        field: `field_${index}`,
        columnIndex: index,
      };

      if (typeof column === 'string') {
        template.label = column;
      } else if (typeof column === 'object') {
        template = {
          ...template,
          ...column,
        };
      }

      typeCheckConfig('column', template, TYPE_COLUMN_FIELDS);

      return template;
    });
  }

  get rows() {
    return this._rows.map((row, index) => {
      const output = {
        rowIndex: index,
      };

      if (Array.isArray(row)) {
        this.columns.forEach((column, i) => {
          if (row[i] === 0) {
            output[column.field] = row[i];
          } else {
            output[column.field] = row[i] || this._options.defaultValue;
          }
        });
      } else if (typeof row === 'object') {
        this.columns.forEach((column) => {
          if (row[column.field] === 0) {
            output[column.field] = row[column.field];
          } else {
            output[column.field] = row[column.field] || this._options.defaultValue;
          }
        });
      }

      return output;
    });
  }

  get searchResult() {
    return search(this.rows, this._search, this._searchColumn);
  }

  get computedRows() {
    let result = [...this.searchResult];

    this._pagination._total = result.length;

    if (this._options.sortOrder) {
      result = sort({
        rows: result,
        field: this._options.sortField,
        order: this._options.sortOrder,
      });
    }

    if (this._options.pagination) {
      const entries =
        this._optionToLowerCase(this._options.entries) === 'all'
          ? result.length
          : this._options.entries;

      result = paginate({
        rows: result,
        entries,
        activePage: this._activePage,
      });
    }

    return result;
  }

  get pages() {
    if (this._optionToLowerCase(this._options.entries) === 'all') {
      return 1;
    }

    return Math.ceil(this.searchResult.length / this._options.entries);
  }

  get pagination() {
    return this._pagination.pagination;
  }

  get classNames() {
    return [
      CLASS_DATATABLE,
      this._options.color,
      this._options.borderColor && `border-${this._options.borderColor}`,
      this._options.hover && 'datatable-hover',
      this._options.bordered && 'datatable-bordered',
      this._options.borderless && 'datatable-borderless',
      this._options.sm && 'datatable-sm',
      this._options.striped && 'datatable-striped',
      this._options.loading && 'datatable-loading',
      this._options.clickableRows && 'datatable-clickable-rows',
    ].filter((className) => className);
  }

  get tableOptions() {
    return {
      columns: this.columns,
      rows: this._options.serverSide ? this.rows : this.computedRows,
      noFoundMessage: this._options.noFoundMessage,
      edit: this._options.edit,
      loading: this._options.loading,
      loaderClass: this._options.loaderClass,
      loadingMessage: this._options.loadingMessage,
      selectable: this._options.selectable,
      multi: this._options.multi,
      forceSort: this._options.forceSort,
      columnSearch: this._options.columnSearch,
    };
  }

  // Public

  update(data, options = {}) {
    if (data && data.rows) {
      this._rows = data.rows;
    }

    if (data && data.columns) {
      this._columns = data.columns;
    }

    this._clearClassList(options);

    this._options = this._getOptions({
      ...this._options,
      ...options,
    });
    this._pagination._options = this._options;

    this._setup();

    this._renderRows();
  }

  dispose() {
    this._removeEventListeners();
    if (this._pagination) {
      this._pagination.removePagination();
    }

    this._perfectScrollbar.destroy();
    Manipulator.removeDataAttribute(this._element, `${this.constructor.NAME}-initialized`);

    super.dispose();
  }

  search(string, column) {
    this._search = string;

    this._searchColumn = column;

    this._activePage = 0;
    this._pagination._activePage = this._activePage;

    this._renderRows();

    if (this._options.maxHeight) {
      this._perfectScrollbar.element.scrollTop = 0;

      this._perfectScrollbar.update();
    }
  }

  sort(column, order = 'asc') {
    this._options.sortOrder = order;

    if (typeof column === 'string') {
      this._options.sortField = this.columns.find((header) => header.field === column).field;
    } else if (typeof column === 'number') {
      this._options.sortField = this.columns[column].field;
    } else {
      this._options.sortField = column.field;
    }

    const icon = SelectorEngine.findOne(
      `i[data-mdb-sort="${this._options.sortField}"]`,
      this._element
    );

    this._setActiveSortIcon(icon);

    if (this._options.serverSide) {
      return;
    }

    this._renderRows();
  }

  setActivePage(index) {
    if (index < this.pages) {
      this._changeActivePage(index);
    }
  }

  // Private

  _changeActivePage(index) {
    this._activePage = index;
    this._pagination._activePage = this._activePage;

    this._pagination._toggleDisableState();

    this._renderRows();
  }

  _enforceOptionDependency() {
    if (
      this._options.serverSide &&
      this._options.pagination &&
      typeof this._options.pagination !== 'object'
    ) {
      console.warn(
        'A pagination object is required when serverSide is enabled and pagination is intended to be used.'
      );
    }
  }

  _optionToLowerCase(option) {
    return typeof option === 'string' ? option.toLowerCase() : option;
  }

  _clearClassList(options) {
    if (this._options.color && options.color) {
      Manipulator.removeClass(this._element, this._options.color);
    }

    if (this._options.borderColor && options.borderColor) {
      Manipulator.removeClass(this._element, `border-${this._options.borderColor}`);
    }

    ['hover', 'bordered', 'borderless', 'sm', 'striped', 'loading'].forEach((option) => {
      if (this._options[option] && !options[option]) {
        Manipulator.removeClass(this._element, `datatable-${option}`);
      }
    });
  }

  _emitSelectEvent() {
    EventHandler.trigger(this._element, EVENT_SELECTED, {
      selectedRows: this.rows.filter((row) => this._selected.indexOf(row.rowIndex) !== -1),
      selectedIndexes: this._selected,
      allSelected: this._selected.length === this.rows.length,
    });
  }

  _getRows(rows = []) {
    const body = SelectorEngine.findOne('tbody', this._element);

    if (!body) {
      return rows;
    }

    const tableRows = SelectorEngine.find('tr', body).map((row) => {
      return SelectorEngine.find('td', row).map((cell) => cell.innerHTML);
    });

    return [...tableRows, ...rows];
  }

  _getColumns(columns = []) {
    const head = SelectorEngine.findOne('thead', this._element);

    if (!head) {
      return columns;
    }

    const headerRow = SelectorEngine.findOne('tr', head);

    const headers = SelectorEngine.find('th', headerRow).map((cell) => ({
      label: cell.innerHTML,
      ...Manipulator.getDataAttributes(cell),
    }));

    return [...headers, ...columns];
  }

  _getCSSValue(size) {
    if (typeof size === 'string') {
      return size;
    }

    return `${size}px`;
  }

  _getOptions(options) {
    const config = {
      ...DEFAULT_OPTIONS,
      ...Manipulator.getDataAttributes(this._element),
      ...options,
    };

    const entriesOptions = Manipulator.getDataAttributes(this._element).entriesOptions;
    const entriesOptionsAsArray = Array.isArray(config.entriesOptions)
      ? config.entriesOptions
      : JSON.parse(entriesOptions.replaceAll("'", '"')); //eslint-disable-line

    config.entriesOptions = entriesOptionsAsArray;

    typeCheckConfig(NAME, config, TYPE_OPTIONS);
    return config;
  }

  _setActiveRows() {
    SelectorEngine.find(SELECTOR_ROW, this._element).forEach((row) => {
      if (this._selected.includes(Manipulator.getDataAttribute(row, 'index'))) {
        Manipulator.addClass(row, 'active');
      } else {
        Manipulator.removeClass(row, 'active');
      }
    });
  }

  _setEntries(e) {
    this._options = this._getOptions({ ...this._options, entries: e.target.value });

    this._pagination._options = this._options;

    if (this._activePage > this.pages - 1) {
      this._activePage = this.pages - 1;
      this._pagination._activePage = this._activePage;
    }

    this._pagination._toggleDisableState();

    this._renderRows();
  }

  _setSelected() {
    SelectorEngine.find(SELECTOR_ROW_CHECKBOX, this._element).forEach((checkbox) => {
      const index = Manipulator.getDataAttribute(checkbox, 'rowIndex');

      checkbox.checked = this._selected.includes(index);
    });

    this._setActiveRows();
  }

  _setActiveSortIcon(active) {
    SelectorEngine.find(SELECTOR_SORT_ICON, this._element).forEach((icon) => {
      const angle = this._options.sortOrder === 'desc' && icon === active ? 180 : 0;

      Manipulator.style(icon, {
        transform: `rotate(${angle}deg)`,
      });

      if (icon === active && this._options.sortOrder) {
        Manipulator.addClass(icon, 'active');
      } else {
        Manipulator.removeClass(icon, 'active');
      }
    });
  }

  _setClassNames() {
    this.classNames.forEach((className) => {
      Manipulator.addClass(this._element, className);
    });
  }

  _setup() {
    this._setClassNames();

    this._renderTable();

    if (this._options.edit) {
      this._setupEditable();
    }

    if (this._options.clickableRows) {
      this._setupClickableRows();
    }

    if (this._options.selectable) {
      this._setupSelectable();
    }

    if (this._options.columnSearch) {
      this._setupColumnSearch();
    }

    this._setupScroll();

    this._setupSort();
  }

  _setupPagination() {
    const paginationEl = SelectorEngine.findOne(SELECTOR_PAGINATION, this._element);
    if (!paginationEl) {
      this._pagination.appendPagination();
      this._setupPaginationListeners();
    } else {
      this._pagination.updatePagination();
    }
  }

  _listenToWindowResize() {
    this._windowResizeHandler = this._handleWindowResize.bind(this);

    EventHandlerMulti.on(window, 'resize DOMContentLoaded', this._windowResizeHandler);
  }

  _handleWindowResize() {
    this._renderRows();
  }

  _setupClickableRows() {
    SelectorEngine.find(SELECTOR_ROW, this._element).forEach((row) => {
      const index = Manipulator.getDataAttribute(row, 'index');

      EventHandler.on(row, 'click', (e) => {
        if (!SelectorEngine.matches(e.target, SELECTOR_ROW_CHECKBOX)) {
          EventHandler.trigger(this._element, EVENT_ROW_CLICKED, { index, row: this.rows[index] });
        }
      });
    });
  }

  _setupEditable() {
    SelectorEngine.find(SELECTOR_ROW, this._element).forEach((row) => {
      const index = Manipulator.getDataAttribute(row, 'index');

      SelectorEngine.find(SELECTOR_CELL, row).forEach((cell) => {
        EventHandler.on(cell, 'input', (e) => this._updateRow(e, index));
        EventHandler.on(cell, 'focus', () => {
          cell.classList.add('editable-active');
        });
        EventHandler.on(cell, 'blur', () => {
          cell.classList.remove('editable-active');
        });
      });
    });
  }

  _setupScroll() {
    const datatableBody = SelectorEngine.findOne(SELECTOR_BODY, this._element);

    const style = {
      overflow: 'auto',
      position: 'relative',
    };

    if (this._options.maxHeight) {
      style.maxHeight = this._getCSSValue(this._options.maxHeight);
    }

    if (this._options.maxWidth) {
      const width = this._getCSSValue(this._options.maxWidth);

      style.maxWidth = width;

      Manipulator.style(this._element, { maxWidth: width });
    }

    Manipulator.style(datatableBody, style);

    if (this._options.fixedHeader) {
      let headers = SelectorEngine.find(SELECTOR_HEADER, this._element);

      if (this._options.selectable) {
        headers = headers.filter((header, index) => {
          Manipulator.addClass(header, CLASS_FIXED_CELL);

          if (this._options.color) {
            Manipulator.addClass(header, this._options.color);
          }

          return index !== 0;
        });
      }

      headers.forEach((header, i) => {
        Manipulator.addClass(header, CLASS_FIXED_CELL);

        if (this.columns[i].fixed) {
          Manipulator.addStyle(header, { zIndex: 4 });
        }

        if (this._options.color) {
          Manipulator.addClass(header, this._options.color);
        }
      });
    }

    this._perfectScrollbar = new PerfectScrollbar(datatableBody);
  }

  _setupSort() {
    SelectorEngine.find(SELECTOR_SORT_ICON, this._element).forEach((icon) => {
      const field = Manipulator.getDataAttribute(icon, 'sort');
      const [header] = SelectorEngine.parents(icon, 'div');
      Manipulator.style(header, { cursor: 'pointer' });

      if (field === this._options.sortField) {
        this._setActiveSortIcon(icon);
      }

      EventHandler.on(header, 'click', () => {
        if (this._options.sortField === field && this._options.sortOrder === 'asc') {
          this._options.sortOrder = 'desc';
        } else if (this._options.sortField === field && this._options.sortOrder === 'desc') {
          this._options.sortOrder = this._options.forceSort ? 'asc' : null;
        } else {
          this._options.sortOrder = 'asc';
        }

        this._options.sortField = field;

        EventHandler.trigger(this._element, EVENT_SORT_CHANGE, {
          sorting: {
            field,
            columnIndex: this._getColumnIndex(field),
            order: this._options.sortOrder,
          },
        });

        if (this._options.serverSide) {
          return;
        }

        this._renderRows();

        this._setActiveSortIcon(icon);
      });
    });
  }

  _setupColumnSearch() {
    this._columnSearchInputs = SelectorEngine.find(SELECTOR_HEADER_FILTER_INPUT, this._element);

    this._columnSearchInputs.forEach((input) => {
      EventHandler.on(input, 'input', (e) => {
        const value = e.target.value;
        const field = Manipulator.getDataAttribute(input, 'field');
        const columnIndex = this._getColumnIndex(field);

        EventHandler.trigger(this._element, EVENT_COLUMN_SEARCH, {
          value,
          field,
          columnIndex,
        });

        if (this._options.serverSide) {
          return;
        }

        this.search(value, field);
      });
    });
  }

  _getColumnIndex(field) {
    return this.columns.findIndex((column) => column.field === field);
  }

  _setupSelectable() {
    this._checkboxes = SelectorEngine.find(SELECTOR_ROW_CHECKBOX, this._element);

    this._headerCheckbox = SelectorEngine.findOne(SELECTOR_HEADER_CHECKBOX, this._element);

    EventHandler.on(this._headerCheckbox, 'input', (e) => this._toggleSelectAll(e));

    this._checkboxes.forEach((checkbox) => {
      const rowIndex = Manipulator.getDataAttribute(checkbox, 'rowIndex');

      EventHandler.on(checkbox, 'input', (e) => this._toggleSelectRow(e, rowIndex));
    });
  }

  _removeEventListeners() {
    if (this._options.pagination) {
      EventHandler.off(this._element, EVENT_PAGINATION_CHANGE);

      EventHandler.off(this._pagination._select, EVENT_VALUE_CHANGED_SELECT);
    }

    EventHandlerMulti.off(window, 'resize DOMContentLoaded', this._windowResizeHandler);

    if (this._options.editable) {
      SelectorEngine.find(SELECTOR_CELL, this._element).forEach((cell) => {
        EventHandler.off(cell, 'input');
        EventHandler.off(cell, 'focus');
        EventHandler.off(cell, 'blur');
      });
    }

    if (this._options.clickableRows) {
      SelectorEngine.find(SELECTOR_ROW, this._element).forEach((row) => {
        EventHandler.off(row, 'click');
      });
    }

    SelectorEngine.find(SELECTOR_SORT_ICON, this._element).forEach((icon) => {
      const [header] = SelectorEngine.parents(icon, 'th');

      EventHandler.off(header, 'click');
    });

    if (this._options.selectable) {
      EventHandler.off(this._headerCheckbox, 'input');

      this._checkboxes.forEach((checkbox) => {
        EventHandler.off(checkbox, 'input');
      });
    }

    if (this._options.columnSearch) {
      this._columnSearchInputs.forEach((input) => {
        EventHandler.off(input, 'input');
      });
    }
  }

  _renderTable() {
    const userTable = SelectorEngine.findOne('table', this._element);
    this._tableId = userTable?.getAttribute('id');
    const tableOptions = this.tableOptions;
    const { rows } = tableOptions;

    const paginationEl = SelectorEngine.findOne(SELECTOR_PAGINATION, this._element);
    if (paginationEl && !this._options.pagination) {
      this._pagination.removePagination();
    }

    [...this._element.children].forEach((child) => {
      if (child !== paginationEl) {
        child.remove();
      }
    });

    this._element.insertAdjacentHTML('afterbegin', tableTemplate(tableOptions).table);

    if (this._options.pagination) {
      this._setupPagination();
    }

    if (this._tableId) {
      const renderedTable = SelectorEngine.findOne('table', this._element);
      renderedTable.setAttribute('id', this._tableId);
    }

    this._formatCells(rows);

    EventHandler.trigger(this._element, EVENT_RENDER);
  }

  _renderRows() {
    const body = SelectorEngine.findOne('tbody', this._element);
    const tableOptions = this.tableOptions;
    const { rows } = tableOptions;

    body.innerHTML = tableTemplate(tableOptions).rows;

    if (this._options.pagination) {
      this._pagination._setNavigationText();
      this._pagination._toggleDisableState();
    }
    this._formatCells(rows);

    if (this._options.edit) {
      this._setupEditable();
    }

    if (this._options.selectable) {
      this._setupSelectable();

      this._setSelected();
    }

    if (this._options.clickableRows) {
      this._setupClickableRows();
    }

    EventHandler.trigger(this._element, EVENT_RENDER);
  }

  _formatCells(rowsData) {
    const columnsMap = new Map(
      this.columns.map((obj) => {
        return [obj.field, obj];
      })
    );

    const rows = SelectorEngine.find(SELECTOR_ROW, this._element);
    const cellsToFormat = [];

    rows.forEach((row, index) => {
      const cells = SelectorEngine.find(SELECTOR_CELL, row);

      cells.forEach((cell) => {
        const field = Manipulator.getDataAttribute(cell, 'field');
        const column = columnsMap.get(field);

        if (column && column.format !== null) {
          const cellData = rowsData[index][field];
          cellsToFormat.push({ cell, column, cellData });
        }
      });
    });

    cellsToFormat.forEach(({ cell, column, cellData }) => column.format(cell, cellData));
  }

  _setupPaginationListeners() {
    if (this._options.serverSide) {
      return;
    }

    EventHandler.on(this._element, EVENT_PAGINATION_CHANGE, (e) => {
      if (this._activePage !== e.pagination?.page) {
        this._changeActivePage(e.pagination.page);
      }
    });

    EventHandler.on(this._pagination._select, EVENT_VALUE_CHANGED_SELECT, (e) => {
      if (this._options.entries !== e.value) {
        this._setEntries(e);
      }
    });
  }

  _toggleSelectAll(e) {
    if (e.target.checked) {
      this._selected = this.rows.map((row) => row.rowIndex);
    } else this._selected = [];

    this._setSelected();

    this._emitSelectEvent();
  }

  _toggleSelectRow(e, rowIndex) {
    if (e.target.checked) {
      if (this._options.multi && !this._selected.includes(rowIndex)) {
        this._selected = [...this._selected, rowIndex];
      } else {
        this._selected = [rowIndex];

        this._checkboxes.forEach((checkbox) => {
          if (checkbox !== e.target) {
            checkbox.checked = false;
          }
        });
      }
    } else {
      this._selected = this._selected.filter((index) => index !== rowIndex);
    }
    if (this._options.multi && !e.target.checked) {
      this._headerCheckbox.checked = false;
    }

    this._setActiveRows();

    this._emitSelectEvent();
  }

  _updateRow(event, index) {
    const field = Manipulator.getDataAttribute(event.target, 'field');

    const value = event.target.textContent;

    const row = this._rows[index];

    if (Array.isArray(row)) {
      const column = this.columns.find((column) => {
        return column.field === field;
      });

      const columnIndex = column.columnIndex;

      row[columnIndex] = value;
    } else {
      row[field] = value;
    }

    EventHandler.trigger(this._element, EVENT_UPDATE, {
      rows: this._rows,
      columns: this._columns,
    });
  }

  static jQueryInterface(config, param1, param2) {
    return this.each(function () {
      let data = Data.getData(this, DATA_KEY);
      const _config = typeof config === 'object' && config;

      if (!data && /dispose/.test(config)) {
        return;
      }

      if (!data) {
        data = new Datatable(this, _config, param1);
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](param1, param2);
      }
    });
  }
}

export default Datatable;
