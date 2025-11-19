const getField = ({ row, column, edited, showLabel = false, darkMode = false }) => {
  if (!edited) {
    if (column.inputType === 'select') {
      const selectedOption = column.options.find((option) => {
        if (typeof option === 'object' && option !== null) {
          return option.key === row[column.field];
        }
        return option === row[column.field];
      });
      return selectedOption?.value || selectedOption || row[column.field];
    }
    return row[column.field];
  }

  const fieldParameters = {
    row,
    ...column,
    edited,
    showLabel,
    darkMode,
  };

  switch (column.inputType) {
    case 'checkbox':
      return getCheckboxField(fieldParameters);
    case 'select':
      return getSelectField(fieldParameters);

    default:
      return getDefaultField(fieldParameters);
  }
};

const getCheckboxField = ({
  row,
  field,
  editable,
  label,
  showLabel,
}) => `<div class="form-check ms-1 mt-1 ps-0">
<input
  ${editable ? '' : 'disabled'}
  class="table-editor__input form-check-input ms-1"
  type="checkbox"
  ${row[field] && JSON.parse(row[field]) ? 'checked' : ''}
/>
${showLabel ? `<label class="ps-3 form-check-label">${label}</label>` : ''}
</div>`;

const getSelectField = ({ row, field, options = [], editable, label, showLabel }) => `<select ${
  editable ? '' : 'data-mdb-disabled="true"'
} class="select table-editor__input-select">
  ${options
    .map((option) => {
      const value = option?.key ?? option;
      const label = option?.value ?? option;
      const selected = value === row[field] ? 'selected' : '';
      return `<option value="${value}" ${selected}>${label}</option>`;
    })
    .join('\n')}
</select>
${showLabel ? `<label class="form-label select-label">${label}</label>` : ''}`;

const getDefaultField = ({
  row,
  field,
  inputType = 'text',
  editable,
  label,
  showLabel,
  darkMode,
}) =>
  `<div class="form-outline ${darkMode ? 'form-white' : ''}" data-mdb-input-init><input ${
    editable ? '' : 'disabled'
  } type="${inputType}"class="table-editor__input form-control" value="${row[field]}">
  ${showLabel ? `<label class="form-label">${label}</label>` : ''}
  </div>`;

export default getField;
