/* eslint-disable indent */

import Manipulator from '../../mdb/dom/manipulator';
import { element } from '../../mdb/util';
import {
  getYear,
  getMonth,
  getDate,
  getDayNumber,
  getFirstDayOfWeek,
  addMonths,
  getDaysInMonth,
  createDate,
  isSameDate,
  isInRange,
  getToday,
  getYearsOffset,
  isDateDisabled,
  isMonthDisabled,
  isYearDisabled,
  isEdgeOfRange,
} from './date-utils';

export function getDatepickerTemplate(
  date,
  selectedDate,
  selectedYear,
  selectedMonth,
  options,
  monthsInRow,
  yearsInView,
  yearsInRow,
  id,
  selectedRange
) {
  const month = getMonth(date);
  const year = getYear(date);
  const day = getDate(date);
  const dayNumber = getDayNumber(date);
  const template = element('div');

  if (options.inline) {
    const inlineContent = `
    ${createMainContent(
      date,
      month,
      year,
      selectedDate,
      selectedYear,
      selectedMonth,
      options,
      monthsInRow,
      yearsInView,
      yearsInRow,
      selectedRange
    )}
`;
    Manipulator.addClass(template, 'datepicker-dropdown-container');
    Manipulator.addClass(template, `datepicker-dropdown-container-${id}`);

    template.innerHTML = inlineContent;
  } else {
    const modalContent = `
    ${createHeader(day, dayNumber, month, options, date, selectedRange)}
    ${createMainContent(
      date,
      month,
      year,
      selectedDate,
      selectedYear,
      selectedMonth,
      options,
      monthsInRow,
      yearsInView,
      yearsInRow,
      selectedRange
    )}
  `;
    Manipulator.addClass(template, 'datepicker-modal-container');
    Manipulator.addClass(template, `datepicker-modal-container-${id}`);

    template.innerHTML = modalContent;
  }

  if (options.dateRange) {
    Manipulator.addClass(template, 'datepicker-date-range');
  }

  return template;
}

export function getBackdropTemplate() {
  const backdrop = element('div');
  Manipulator.addClass(backdrop, 'datepicker-backdrop');

  return backdrop;
}

export function createContainer() {
  const container = element('div');
  Manipulator.addClass(container, '.datepicker-modal-container');

  return container;
}

export function createCustomHeader(day, dayNumber, month, selected, options) {
  const { weekdaysShort, weekdaysFull, monthsShort, headerTemplateModifier, headerTemplate } =
    options;

  const selectedDate = headerTemplateModifier ? headerTemplateModifier(selected) : selected;
  return headerTemplate
    .replaceAll('[day]', day)
    .replaceAll('[weekday]', weekdaysShort[dayNumber])
    .replaceAll('[weekdayFull]', weekdaysFull[dayNumber])
    .replaceAll('[month]', monthsShort[month])
    .replaceAll('[selected]', selectedDate);
}

function createHeader(day, dayNumber, month, options, selected, selectedRange) {
  return `
      <div class="datepicker-header">
      ${
        options.headerTemplate
          ? createCustomHeader(day, dayNumber, month, selected, options)
          : `
        <div class="datepicker-title">
          <span class="datepicker-title-text">${options.title}</span>
        </div>
        <div class="datepicker-date">
          <span class="datepicker-date-text">${createTitle(selected, selectedRange, options)}</span>
        </div>
        `
      }
      </div>
    `;
}

export function createTitle(selected, selectedRange, options) {
  const { dateRange, weekdaysShort, monthsShort } = options;

  const formatDate = (date) => {
    const month = getMonth(date);
    const day = getDate(date);
    const dayNumber = getDayNumber(date);
    return `${weekdaysShort[dayNumber]}, ${monthsShort[month]} ${day}`;
  };

  if (dateRange) {
    let endDate;
    let startDate;
    if (!selectedRange || selectedRange.length === 0) {
      startDate = selected;
      endDate = selected;
    } else {
      [startDate, endDate] = selectedRange;
    }
    return `${formatDate(startDate)} - ${endDate ? formatDate(endDate) : ''}`;
  }

  return formatDate(selected);
}

function createMainContent(
  date,
  month,
  year,
  selectedDate,
  selectedYear,
  selectedMonth,
  options,
  monthsInRow,
  yearsInView,
  yearsInRow,
  selectedRange
) {
  let mainContentTemplate;
  if (options.inline) {
    mainContentTemplate = `
    <div class="datepicker-main">
      ${createControls(month, year, options)}
      <div class="datepicker-view" tabindex="0">
        ${createViewTemplate(
          date,
          year,
          selectedDate,
          selectedYear,
          selectedMonth,
          options,
          monthsInRow,
          yearsInView,
          yearsInRow,
          selectedRange
        )}
      </div>
    </div>
  `;
  } else {
    mainContentTemplate = `
      <div class="datepicker-main">
        ${createControls(month, year, options)}
        <div class="datepicker-view" tabindex="0">
          ${createViewTemplate(
            date,
            year,
            selectedDate,
            selectedYear,
            selectedMonth,
            options,
            monthsInRow,
            yearsInView,
            yearsInRow,
            selectedRange
          )}
        </div>
        ${createFooter(options)}
      </div>
    `;
  }

  return mainContentTemplate;
}

function createViewTemplate(
  date,
  year,
  selectedDate,
  selectedYear,
  selectedMonth,
  options,
  monthsInRow,
  yearsInView,
  yearsInRow,
  selectedRange
) {
  let viewTemplate;
  if (options.view === 'days') {
    viewTemplate = createDayViewTemplate(date, selectedDate, options, selectedRange);
  } else if (options.view === 'months') {
    viewTemplate = createMonthViewTemplate(year, selectedYear, selectedMonth, options, monthsInRow);
  } else {
    viewTemplate = createYearViewTemplate(date, selectedYear, options, yearsInView, yearsInRow);
  }

  return viewTemplate;
}

function createControls(month, year, options) {
  return `
    <div class="datepicker-date-controls">
      <button class="datepicker-view-change-button" aria-label="${options.switchToMultiYearViewLabel}">
        ${options.monthsFull[month]} ${year}
      </button>
      <div class="datepicker-arrow-controls">
        <button class="datepicker-previous-button" aria-label="${options.prevMonthLabel}"></button>
        <button class="datepicker-next-button" aria-label="${options.nextMonthLabel}"></button>
      </div>
    </div>
    `;
}

function createFooter(options) {
  const okBtn = `<button class="datepicker-footer-btn datepicker-ok-btn" aria-label="${options.okBtnLabel}">${options.okBtnText}</button>`;
  const cancelButton = `<button class="datepicker-footer-btn datepicker-cancel-btn" aria-label="${options.cancelBtnLabel}">${options.cancelBtnText}</button>`;
  const clearButton = `<button class="datepicker-footer-btn datepicker-clear-btn" aria-label="${options.clearBtnLabel}">${options.clearBtnText}</button>`;

  return `
        <div class="datepicker-footer">
          ${options.removeClearBtn ? '' : clearButton}
          ${options.removeCancelBtn ? '' : cancelButton}
          ${options.removeOkBtn ? '' : okBtn}
        </div>
      `;
}

export function createDayViewTemplate(date, headerDate, options, selectedRange) {
  const dates = getDatesArray(date, headerDate, options, selectedRange, 1);
  const nextMonthDates = options.dateRange
    ? getDatesArray(addMonths(date, 1), headerDate, options, selectedRange, 2)
    : null;
  const dayNames = options.weekdaysNarrow;

  const tableHeadContent = `
      <tr>
        ${dayNames
          .map((name, i) => {
            return `<th class="datepicker-day-heading" scope="col" aria-label="${options.weekdaysFull[i]}">${name}</th>`;
          })
          .join('')}
      </tr>
    `;

  const tableBodyContent = (dates) =>
    dates
      .map(
        (week) => `
          <tr>
            ${week
              .map((day) => {
                const dayLabel = `${options.weekdaysFull[getDayNumber(day.date)]}, ${
                  options.monthsFull[getMonth(day.date)]
                } ${getDate(day.date)}, ${getYear(day.date)}`;
                const currentDate = `${getYear(day.date)}-${getMonth(day.date)}-${getDate(
                  day.date
                )}`;
                const isFirst = day.isEdgeOfRange === 'first';
                const isLast = day.isEdgeOfRange === 'last';

                const classNames = [
                  'datepicker-cell',
                  'datepicker-small-cell',
                  'datepicker-day-cell',
                  day.currentMonth ? '' : 'disabled',
                  day.disabled ? 'disabled' : '',
                  day.isToday ? 'current' : '',
                  day.isSelected ? 'selected' : '',
                  day.isInRange ? 'in-range' : '',
                  isFirst ? 'first-in-range' : '',
                  isLast ? 'last-in-range' : '',
                ]
                  .filter(Boolean) // Remove empty or false values
                  .join(' ');

                return `
                  <td
                    class="${classNames}"
                    data-mdb-date="${day.currentMonth ? currentDate : ''}"
                    aria-label="${dayLabel}"
                    aria-selected="${day.isSelected}"
                    ${day.disabled ? 'aria-disabled="true"' : ''}>
                    <div
                      class="datepicker-cell-content datepicker-small-cell-content"
                      style="${day.currentMonth ? 'display: block' : 'display: none'}">
                      ${day.dayNumber}
                    </div>
                  </td>
                `;
              })
              .join('')}
          </tr>
        `
      )
      .join('');

  const dayViewTemplate = (dates, month) => `
    <table class="datepicker-table">
        <thead class="text-center">
          ${
            options.dateRange
              ? `
          <tr class="datepicker-month-header">
            <th colspan="7">${options.monthsFull[month]}</th>
          </tr>
          `
              : ''
          }
          ${tableHeadContent}
        </thead>
        <tbody class="datepicker-table-body">
         ${tableBodyContent(dates)}
        </tbody>
      </table>
    `;

  const rangeTemplate = () => `
    ${dayViewTemplate(dates, getMonth(date))}
    <div class="vr"></div>
    ${dayViewTemplate(nextMonthDates, getMonth(addMonths(date, 1)))}
    `;

  return options.dateRange ? rangeTemplate() : dayViewTemplate(dates, getMonth(date));
}

function getDatesArray(activeDate, headerDate, options, selectedRange = [], visibleMonth) {
  const dates = [];

  const month = getMonth(activeDate);
  const previousMonth = getMonth(addMonths(activeDate, -1));
  const nextMonth = getMonth(addMonths(activeDate, 1));
  const year = getYear(activeDate);

  const firstDay = getFirstDayOfWeek(year, month, options);
  const daysInMonth = getDaysInMonth(activeDate);
  const daysInPreviousMonth = getDaysInMonth(addMonths(activeDate, -1));
  const daysInWeek = 7;

  let dayNumber = 1;
  let isCurrentMonth = false;

  const firstVisibleMonth = visibleMonth === 1 ? month : previousMonth;
  const secondVisibleMonth = visibleMonth === 1 ? nextMonth : month;
  const isVisible = options.dateRange
    ? month === firstVisibleMonth || month === secondVisibleMonth
    : month === firstVisibleMonth;

  const isSelected = (date, selectedRange) => {
    if (!selectedRange || selectedRange?.length === 0) return false;
    if (options.dateRange) {
      return selectedRange.length === 1
        ? isSameDate(date, selectedRange[0])
        : isSameDate(date, selectedRange[0]) || isSameDate(date, selectedRange[1]);
    }

    return isSameDate(date, selectedRange);
  };

  for (let i = 1; i < daysInWeek; i++) {
    const week = [];
    if (i === 1) {
      // First week
      const previousMonthDay = daysInPreviousMonth - firstDay + 1;
      // Previous month
      for (let j = previousMonthDay; j <= daysInPreviousMonth; j++) {
        const date = createDate(year, previousMonth, j);

        week.push({
          date,
          currentMonth: isCurrentMonth,
          isSelected: isSelected(date, headerDate) && isCurrentMonth,
          isInRange: isInRange(date, selectedRange) && isCurrentMonth,
          isEdgeOfRange: isCurrentMonth ? isEdgeOfRange(date, selectedRange) : false,
          isToday: isSameDate(date, getToday()),
          dayNumber: getDate(date),
          disabled: isDateDisabled(
            date,
            options.min,
            options.max,
            options.filter,
            options.disablePast,
            options.disableFuture
          ),
        });
      }

      isCurrentMonth = true;
      // Current month
      const daysLeft = daysInWeek - week.length;
      for (let j = 0; j < daysLeft; j++) {
        const date = createDate(year, month, dayNumber);

        week.push({
          date,
          currentMonth: isCurrentMonth,
          isSelected: isSelected(date, headerDate) && isVisible,
          isInRange: isInRange(date, selectedRange) && isCurrentMonth,
          isEdgeOfRange: isCurrentMonth ? isEdgeOfRange(date, selectedRange) : false,
          isToday: isSameDate(date, getToday()),
          dayNumber: getDate(date),
          disabled: isDateDisabled(
            date,
            options.min,
            options.max,
            options.filter,
            options.disablePast,
            options.disableFuture
          ),
        });
        dayNumber++;
      }
    } else {
      // Rest of the weeks
      for (let j = 1; j < 8; j++) {
        if (dayNumber > daysInMonth) {
          // Next month
          dayNumber = 1;
          isCurrentMonth = false;
        }
        const date = createDate(year, isCurrentMonth ? month : nextMonth, dayNumber);

        week.push({
          date,
          currentMonth: isCurrentMonth,
          isSelected: isSelected(date, headerDate) && isCurrentMonth,
          isInRange: isInRange(date, selectedRange) && isCurrentMonth,
          isEdgeOfRange: isCurrentMonth ? isEdgeOfRange(date, selectedRange) : false,
          isToday: isSameDate(date, getToday()),
          dayNumber: getDate(date),
          disabled: isDateDisabled(
            date,
            options.min,
            options.max,
            options.filter,
            options.disablePast,
            options.disableFuture
          ),
        });
        dayNumber++;
      }
    }
    dates.push(week);
  }

  return dates;
}

export function createMonthViewTemplate(year, selectedYear, selectedMonth, options, monthsInRow) {
  const months = getMonthsArray(options, monthsInRow);
  const currentMonth = getMonth(getToday());
  const currentYear = getYear(getToday());

  const tableBodyContent = `
      ${months
        .map((row) => {
          return `
          <tr>
          ${row
            .map((month) => {
              const monthIndex = options.monthsShort.indexOf(month);
              const isDisabled = isMonthDisabled(
                monthIndex,
                year,
                options.min,
                options.max,
                options.disablePast,
                options.disableFuture
              );
              return `
                <td class="datepicker-cell datepicker-large-cell datepicker-month-cell 
                ${isDisabled ? 'disabled' : ''} ${
                monthIndex === selectedMonth && year === selectedYear ? 'selected' : ''
              } ${
                monthIndex === currentMonth && year === currentYear ? 'current' : ''
              }" data-mdb-month="${monthIndex}" data-mdb-year="${year}" aria-label="${month}, ${year}"  ${
                isDisabled ? 'aria-disabled=true' : ''
              }>
                  <div class="datepicker-cell-content datepicker-large-cell-content">${month}</div>
                </td>
              `;
            })
            .join('')}
          </tr>
        `;
        })
        .join('')}
    `;

  return `
      <table class="datepicker-table">
        <tbody class="datepicker-table-body">
         ${tableBodyContent}
        </tbody>
      </table>
    `;
}

function getMonthsArray({ monthsShort }, monthsInRow) {
  return monthsShort.reduce((months, month, index) => {
    const rowIndex = Math.floor(index / monthsInRow);
    if (!months[rowIndex]) months[rowIndex] = [];
    months[rowIndex].push(month);
    return months;
  }, []);
}

export function createYearViewTemplate(date, selectedYear, options, yearsInView, yearsInRow) {
  const years = getYearsArray(date, yearsInView, yearsInRow);
  const currentYear = getYear(getToday());

  const tableBodyContent = `
    ${years
      .map((row) => {
        return `
        <tr>
          ${row
            .map((year) => {
              const isDisabled = isYearDisabled(
                year,
                options.min,
                options.max,
                options.disablePast,
                options.disableFuture
              );
              return `
              <td class="datepicker-cell datepicker-large-cell datepicker-year-cell
              ${isDisabled ? 'disabled' : ''} ${year === selectedYear ? 'selected' : ''} ${
                year === currentYear ? 'current' : ''
              }" aria-label="${year}" data-mdb-year="${year}" ${
                isDisabled ? 'aria-disabled="true"' : ''
              }>
                <div class="datepicker-cell-content datepicker-large-cell-content">${year}</div>
              </td>
            `;
            })
            .join('')}
        </tr>
      `;
      })
      .join('')}
  `;

  return `
      <table class="datepicker-table">
        <tbody class="datepicker-table-body">
        ${tableBodyContent}
        </tbody>
      </table>
    `;
}

function getYearsArray(date, yearsInView, yearsInRow) {
  const years = [];
  const activeYear = getYear(date);
  const yearsOffset = getYearsOffset(date, yearsInView);

  const firstYearInView = activeYear - yearsOffset;

  let row = [];

  for (let i = 0; i < yearsInView; i++) {
    row.push(firstYearInView + i);

    if (row.length === yearsInRow) {
      const yearsRow = row;
      years.push(yearsRow);
      row = [];
    }
  }

  return years;
}

export function getToggleButtonTemplate(id, ariaLabel) {
  return `
    <button id="${id}" type="button" class="datepicker-toggle-button" data-mdb-toggle="datepicker" aria-label="${ariaLabel}">
      <i class="far fa-calendar datepicker-toggle-icon"></i>
    </button>
  `;
}
