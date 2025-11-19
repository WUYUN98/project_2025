/* eslint-disable import/prefer-default-export */
/* eslint-disable indent */

export const getTimepickerTemplate = (
  {
    format24,
    okLabel,
    cancelLabel,
    headId,
    footerId,
    bodyId,
    pickerId,
    clearLabel,
    inline,
    showClearBtn,
    amLabel,
    pmLabel,
    isRTL,
  },
  id
) => {
  const normalTemplate = `<div id='${pickerId}' class='timepicker-wrapper h-100 d-flex align-items-center justify-content-center flex-column position-fixed'>
      <div class="d-flex align-items-center justify-content-center flex-column timepicker-container timepicker-container-${id}">
        <div class="d-flex flex-column timepicker-elements justify-content-around">
          ${createHead(headId, format24, amLabel, pmLabel, okLabel, inline, isRTL)}
          ${createTimepickerClockWrapper(bodyId, format24)}
        </div>
        ${createFooter(footerId, showClearBtn, clearLabel, cancelLabel, okLabel)}

      </div>
    </div>`;

  const inlineTemplate = `
    <div id='${pickerId}' class='timepicker-wrapper h-100 d-flex align-items-center justify-content-center flex-column timepicker-wrapper-inline'>
      <div class="d-flex align-items-center justify-content-center flex-column timepicker-container timepicker-container-${id}">

        <div class="d-flex flex-column timepicker-elements justify-content-around timepicker-elements-inline">

        ${createHead(headId, format24, amLabel, pmLabel, okLabel, inline, isRTL)}

        </div>

      </div>
    </div>
  `;

  return inline ? inlineTemplate : normalTemplate;
};

function createFooter(footerId, showClearBtn, clearLabel, cancelLabel, okLabel) {
  return `
  <div id='${footerId}' class='timepicker-footer'>
    <div class="w-100 d-flex justify-content-between">
      ${
        showClearBtn
          ? `<button type='button' class='timepicker-button timepicker-clear' tabindex="0" aria-label="${clearLabel}">${clearLabel}</button>`
          : ''
      }
      <button type='button' class='timepicker-button timepicker-cancel' tabindex="0" aria-label="${cancelLabel}">${cancelLabel}</button>
      <button type='button' class='timepicker-button timepicker-submit' tabindex="0" aria-label="${okLabel}">${okLabel}</button>
    </div>
  </div>`;
}

function createTimepickerClockWrapper(bodyId, format24) {
  return `
  <div id='${bodyId}' class='timepicker-clock-wrapper d-flex justify-content-center flex-column align-items-center'>
    <div class='timepicker-clock'>
      <span class='timepicker-middle-dot position-absolute'></span>
      <div class='timepicker-hand-pointer position-absolute'>
        <div class='timepicker-circle position-absolute'></div>
      </div>
      ${format24 ? '<div class="timepicker-clock-inner"></div>' : ''}
    </div>
  </div>`;
}

function createModeWrapper(inline, format24, amLabel, pmLabel, okLabel) {
  const submitBtn = `<button type='button' class='timepicker-button timepicker-submit timepicker-submit-inline py-1 px-2 mb-0' tabindex="0">${okLabel}</button>`;

  if (format24) {
    return inline ? `${submitBtn}` : '';
  } else {
    return `
      <div class="d-flex ${
        !inline ? 'flex-column ' : ''
      }justify-content-center timepicker-mode-wrapper">
        <button type='button' class="timepicker-hour-mode timepicker-am${
          inline ? ' me-2 ms-4' : ''
        }" tabindex="0">${amLabel}</button>
        <button type='button' class="timepicker-hour-mode timepicker-pm" tabindex="0">${pmLabel}</button>
        ${inline ? `${submitBtn}` : ''}
      </div>`;
  }
}

function createHead(headId, format24, amLabel, pmLabel, okLabel, inline, isRTL) {
  return `
  <div id='${headId}' class='timepicker-head d-flex flex-row align-items-center justify-content-center ${
    inline ? 'timepicker-head-inline' : ''
  }'
  style='padding-${isRTL ? 'left' : 'right'}:${format24 && !inline ? 50 : 0}px'>
    <div class='timepicker-head-content d-flex w-100 justify-content-evenly'>
    ${!inline ? `${createCurrentWrapperNormal()}` : `${createCurrentWrapperInline()}`}
      ${createModeWrapper(inline, format24, amLabel, pmLabel, okLabel)}
    </div>
  </div>
  `;
}

function createCurrentWrapperNormal() {
  return `
    <div class="timepicker-current-wrapper">
      <span class="position-relative h-100">
        <button type='button' class='timepicker-current timepicker-hour active' tabindex="0">21</button>
      </span>
      <button type='button' class='timepicker-dot' disabled>:</button>
      <span class="position-relative h-100">
        <button type='button' class='timepicker-current timepicker-minute' tabindex="0">21</button>
      </span>
    </div>
  `;
}

function createCurrentWrapperInline() {
  return `
    <div class="timepicker-current-wrapper">
      <span class="position-relative h-100 timepicker-inline-hour-icons">
        <i class="fas fa-chevron-up position-absolute text-white timepicker-icon-up timepicker-icon-inline-hour"></i>
        <button type='button' class='timepicker-current timepicker-hour active timepicker-current-inline' tabindex="0">21</button>
        <i class="fas fa-chevron-down position-absolute text-white timepicker-icon-down timepicker-icon-inline-hour"></i>
      </span>
      <button type='button' class='timepicker-dot timepicker-current-inline' disabled>:</button>
      <span class="position-relative h-100  timepicker-inline-minutes-icons">
        <i class="fas fa-chevron-up position-absolute text-white timepicker-icon-up timepicker-icon-inline-minute"></i>
        <button type='button' class='timepicker-current timepicker-minute timepicker-current-inline' tabindex="0">21</button>
        <i class="fas fa-chevron-down position-absolute text-white timepicker-icon-down timepicker-icon-inline-minute"></i>
      </span>
    </div>
  `;
}

export const getToggleButtonTemplate = (options, id) => {
  const { iconClass, toggleButtonLabel } = options;

  return `
  <button id="${id}" tabindex="0" type="button" class="timepicker-toggle-button" data-mdb-toggle="timepicker" aria-label="${toggleButtonLabel}">
    <i class="${iconClass}"></i>
  </button>
`;
};
