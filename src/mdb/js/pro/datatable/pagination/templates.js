import { isRTL } from '../../../mdb/util/index';
/* eslint-disable indent */
const pagination = (
  { entries, entriesOptions, fullPagination, rowsText, allText },
  loading,
  text
) => {
  const selectHTML = createEntriesSelect(entries, entriesOptions, loading, rowsText, allText);
  const buttonsHTML = createPaginationButtons(fullPagination);

  return `
    <div class="datatable-pagination">
      ${selectHTML}
      <div class="datatable-pagination-nav">
        ${text}
      </div>
      ${buttonsHTML}
    </div>
  `;
};

const createPaginationButtons = (fullPagination) => {
  return `
    <div class="datatable-pagination-buttons">
      ${
        fullPagination
          ? '<button data-mdb-ripple-color="dark" data-mdb-ripple-init class="btn btn-link datatable-pagination-button datatable-pagination-start"><i class="fa fa-angle-double-left"></i></button>'
          : ''
      }
      <button data-mdb-ripple-color="dark" data-mdb-ripple-init class="btn btn-link datatable-pagination-button datatable-pagination-left"><i class="fa fa-chevron-${
        isRTL ? 'right' : 'left'
      }"></i></button>
      <button data-mdb-ripple-color="dark" data-mdb-ripple-init class="btn btn-link datatable-pagination-button datatable-pagination-right"><i class="fa fa-chevron-${
        isRTL ? 'left' : 'right'
      }"></i></button>
      ${
        fullPagination
          ? '<button data-mdb-ripple-color="dark" data-mdb-ripple-init class="btn btn-link datatable-pagination-button datatable-pagination-end"><i class="fa fa-angle-double-right"></i></button>'
          : ''
      }
    </div>
  `;
};

const createEntriesSelect = (entries, entriesOptions, loading, rowsText, allText) => {
  const options = entriesOptions
    .map((option) => {
      const optionToLowerCase = typeof option === 'string' ? option.toLowerCase() : option;
      if (optionToLowerCase === 'all') {
        return `<option value="${option}" ${
          option === entries ? 'selected' : ''
        }>${allText}</option>`;
      }
      return `<option value="${option}">${option}</option>`;
    })
    .join('\n');

  return `
    <div class="datatable-select-wrapper">
      <p class="datatable-select-text">${rowsText}</p>
      <select name="entries" ${
        loading ? 'data-mdb-disabled="true"' : ''
      } class="datatable-select select">
        ${options}
      </select>
    </div>
  `;
};

export { createEntriesSelect, createPaginationButtons };
export default pagination;
